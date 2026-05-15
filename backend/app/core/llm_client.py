"""
LLM Client - Production Ready
- Timeout handling
- Retry with exponential backoff
- Circuit breaker pattern
- Graceful fallback
"""
import asyncio
import logging
from typing import Optional, List, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
import aiohttp

logger = logging.getLogger(__name__)


@dataclass
class CircuitBreakerState:
    """Circuit breaker state tracking."""
    failures: int = 0
    last_failure: Optional[datetime] = None
    state: str = "closed"  # closed, open, half_open
    recovery_timeout_seconds: int = 30


class CircuitBreaker:
    """
    Circuit breaker to prevent cascading failures when LLM API is down.
    States:
    - closed: Normal operation, requests pass through
    - open: LLM API failing, requests fail fast without calling API
    - half_open: Testing if API recovered, limited requests pass through
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 30,
        half_open_max_calls: int = 3
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = timedelta(seconds=recovery_timeout)
        self.half_open_max_calls = half_open_max_calls
        self.state = "closed"
        self.failures = 0
        self.last_failure_time: Optional[datetime] = None
        self.half_open_calls = 0

    def _check_recovery(self):
        """Check if circuit should transition to half_open."""
        if self.state == "open" and self.last_failure_time:
            if datetime.now() - self.last_failure_time >= self.recovery_timeout:
                self.state = "half_open"
                self.half_open_calls = 0
                logger.info("Circuit breaker: OPEN -> HALF_OPEN")

    def _record_success(self):
        """Record successful call."""
        if self.state == "half_open":
            self.half_open_calls += 1
            if self.half_open_calls >= self.half_open_max_calls:
                self.state = "closed"
                self.failures = 0
                logger.info("Circuit breaker: HALF_OPEN -> CLOSED (recovered)")

    def _record_failure(self):
        """Record failed call."""
        self.failures += 1
        self.last_failure_time = datetime.now()

        if self.state == "half_open":
            self.state = "open"
            logger.warning("Circuit breaker: HALF_OPEN -> OPEN (test call failed)")
        elif self.failures >= self.failure_threshold:
            self.state = "open"
            logger.warning(f"Circuit breaker: CLOSED -> OPEN (failures={self.failures})")

    def can_execute(self) -> bool:
        """Check if request can proceed."""
        if self.state == "closed":
            return True

        if self.state == "open":
            self._check_recovery()
            if self.state == "half_open":
                return self.half_open_calls < self.half_open_max_calls
            return False

        if self.state == "half_open":
            return self.half_open_calls < self.half_open_max_calls

        return False


class LLMClientError(Exception):
    """Base exception for LLM client errors."""
    pass


class LLMTimeoutError(LLMClientError):
    """Raised when LLM API times out."""
    pass


class LLMCircuitOpenError(LLMClientError):
    """Raised when circuit breaker is open."""
    pass


class LLMClient:
    """
    Production-ready LLM client with:
    - Configurable timeouts
    - Automatic retry with exponential backoff
    - Circuit breaker for fault tolerance
    - Fallback responses
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str = "gpt-4",
        timeout_seconds: int = 30,
        max_retries: int = 3,
        retry_base_delay: float = 1.0,
        circuit_breaker_threshold: int = 5,
        circuit_breaker_timeout: int = 30
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout = aiohttp.ClientTimeout(
            total=timeout_seconds,
            connect=min(10, timeout_seconds // 3),
            sock_read=timeout_seconds
        )
        self.max_retries = max_retries
        self.retry_base_delay = retry_base_delay
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=circuit_breaker_threshold,
            recovery_timeout=circuit_breaker_timeout
        )
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session with connection pooling."""
        if self._session is None or self._session.closed:
            connector = aiohttp.TCPConnector(
                limit=100,  # Max connections
                limit_per_host=20,  # Max per host
                ttl_dns_cache=300  # DNS cache TTL
            )
            self._session = aiohttp.ClientSession(
                timeout=self.timeout,
                connector=connector
            )
        return self._session

    async def close(self):
        """Close the client session."""
        if self._session and not self._session.closed:
            await self._session.close()

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _build_payload(
        self,
        messages: List[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> dict:
        return {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

    async def chat_completion(
        self,
        messages: List[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        fallback_fn: Optional[Callable] = None
    ) -> str:
        """
        Send chat completion request with retry and circuit breaker.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            fallback_fn: Optional fallback function if all retries fail
            
        Returns:
            Response content string
            
        Raises:
            LLMTimeoutError: If request times out after all retries
            LLMCircuitOpenError: If circuit breaker is open
        """
        # Check circuit breaker
        if not self.circuit_breaker.can_execute():
            logger.warning("Circuit breaker is open, using fallback")
            if fallback_fn:
                return fallback_fn()
            raise LLMCircuitOpenError("LLM service temporarily unavailable")

        payload = self._build_payload(messages, temperature, max_tokens)
        last_error: Optional[Exception] = None

        for attempt in range(self.max_retries + 1):
            try:
                session = await self._get_session()

                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json=payload,
                    raise_for_status=True
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        # Non-retryable error (4xx)
                        if 400 <= response.status < 500:
                            logger.error(f"LLM API client error: {response.status} - {error_text}")
                            self.circuit_breaker._record_failure()
                            raise LLMClientError(f"LLM API error: {response.status}")
                        
                        # Retryable error (5xx)
                        raise LLMClientError(f"LLM API server error: {response.status}")

                    data = await response.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    self.circuit_breaker._record_success()
                    return content

            except asyncio.TimeoutError as e:
                last_error = e
                logger.warning(f"LLM timeout (attempt {attempt + 1}/{self.max_retries + 1})")
                
            except aiohttp.ClientError as e:
                last_error = e
                logger.warning(f"LLM connection error (attempt {attempt + 1}/{self.max_retries + 1}): {e}")

            except LLMClientError:
                raise

            # Retry with exponential backoff (skip on last attempt)
            if attempt < self.max_retries:
                delay = self.retry_base_delay * (2 ** attempt)
                await asyncio.sleep(delay)

        # All retries exhausted
        self.circuit_breaker._record_failure()
        
        if fallback_fn:
            logger.info("All LLM retries failed, using fallback")
            return fallback_fn()

        if isinstance(last_error, asyncio.TimeoutError):
            raise LLMTimeoutError(f"LLM request timed out after {self.max_retries + 1} attempts")
        
        raise LLMClientError(f"LLM request failed after {self.max_retries + 1} attempts: {last_error}")

    async def chat_completion_stream(
        self,
        messages: List[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ):
        """
        Stream chat completion response.
        
        Yields chunks of response content.
        """
        if not self.circuit_breaker.can_execute():
            raise LLMCircuitOpenError("LLM service temporarily unavailable")

        payload = self._build_payload(messages, temperature, max_tokens)
        payload["stream"] = True

        try:
            session = await self._get_session()
            try:
                import sys as _sys
                if _sys.version_info >= (3, 11):
                    import asyncio as _asyncio
                    _timeout_cm = _asyncio.timeout(30)
                else:
                    import async_timeout as _async_timeout
                    _timeout_cm = _async_timeout.timeout(30)
            except ImportError:
                # No timeout support; proceed without timeout guard
                _timeout_cm = None

            if _timeout_cm is None:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json=payload
                ) as response:
                    if response.status != 200:
                        raise LLMClientError(f"LLM stream error: {response.status}")
                    async for line in response.content:
                        line = line.decode("utf-8").strip()
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            import json
                            try:
                                data = json.loads(data_str)
                                content = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
                    self.circuit_breaker._record_success()
            else:
                async with _timeout_cm:
                    async with session.post(
                        f"{self.base_url}/chat/completions",
                        headers=self._get_headers(),
                        json=payload
                    ) as response:
                        if response.status != 200:
                            raise LLMClientError(f"LLM stream error: {response.status}")
                        async for line in response.content:
                            line = line.decode("utf-8").strip()
                            if line.startswith("data: "):
                                data_str = line[6:]
                                if data_str == "[DONE]":
                                    break
                                import json
                                try:
                                    data = json.loads(data_str)
                                    content = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                    if content:
                                        yield content
                                except json.JSONDecodeError:
                                    continue
                        self.circuit_breaker._record_success()

        except asyncio.TimeoutError:
            self.circuit_breaker._record_failure()
            raise LLMTimeoutError("LLM request timed out after 30 seconds")
        except Exception as e:
            self.circuit_breaker._record_failure()
            raise

    def get_circuit_status(self) -> dict:
        """Get circuit breaker status for monitoring."""
        return {
            "state": self.circuit_breaker.state,
            "failures": self.circuit_breaker.failures,
            "last_failure": self.circuit_breaker.last_failure_time.isoformat() 
                if self.circuit_breaker.last_failure_time else None
        }


# Singleton instance for app-wide use
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get or create singleton LLM client."""
    global _llm_client
    if _llm_client is None:
        from app.core.config import get_settings
        settings = get_settings()
        _llm_client = LLMClient(
            base_url=settings.llm_base_url,
            api_key=settings.llm_api_key,
            model=settings.llm_model,
            timeout_seconds=30,
            max_retries=3
        )
    return _llm_client


async def close_llm_client():
    """Close the singleton LLM client."""
    global _llm_client
    if _llm_client:
        await _llm_client.close()
        _llm_client = None

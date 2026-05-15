"""
Web Search Service for Travel Websites
Uses agent-browser for scraping travel sites like Traveloka, etc.
"""
import asyncio
import logging
import json
import re
import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

AGENT_BROWSER_CLI = "/home/nhannv/.cursor-server/bin/linux-x64/lib/node_modules/agent-browser/bin/agent-browser.js"
# Agent-browser daemon port (shared across commands in the same session).
# The CLI uses a daemon process that persists; pick a fixed port so that
# concurrent calls don't collide.
DAEMON_PORT = int(os.environ.get("AGENT_BROWSER_PORT", "9225"))


@dataclass
class TravelSearchResult:
    site: str
    title: str
    description: str
    url: str
    price: Optional[str] = None
    rating: Optional[str] = None
    location: Optional[str] = None


class WebSearchService:
    """
    Service for searching travel websites using agent-browser.

    The agent-browser CLI uses an interactive command-loop model:
      agent-browser open <url>
      agent-browser get title
      agent-browser get text @e1
      agent-browser snapshot -i
      ...

    Commands are chained with && so they share the same browser session.
    We use --json to get machine-readable output from get commands.
    """

    def __init__(self):
        self.browser_path = AGENT_BROWSER_CLI

    async def search_traveloka(
        self,
        query: str,
        location: Optional[str] = None
    ) -> List[TravelSearchResult]:
        """Search Traveloka for tours, hotels, flights."""
        url = self._build_traveloka_url(query, location)
        return await self._scrape_page(url, "traveloka")

    async def search_booking(
        self,
        query: str,
        location: Optional[str] = None
    ) -> List[TravelSearchResult]:
        """Search Booking.com for hotels."""
        url = self._build_booking_url(query, location)
        return await self._scrape_page(url, "booking")

    async def search_viator(
        self,
        query: str,
        location: Optional[str] = None
    ) -> List[TravelSearchResult]:
        """Search Viator for tours and activities."""
        url = f"https://www.viator.com/search/{location or ''}/{query}"
        return await self._scrape_page(url, "viator")

    async def search_multi(
        self,
        query: str,
        location: Optional[str] = None,
        search_types: List[str] = None
    ) -> Dict[str, List[TravelSearchResult]]:
        """Search multiple travel sites in parallel."""
        if search_types is None:
            search_types = ["traveloka", "viator", "booking"]

        tasks = []
        type_map = []
        if "traveloka" in search_types:
            tasks.append(self.search_traveloka(query, location))
            type_map.append("traveloka")
        if "booking" in search_types:
            tasks.append(self.search_booking(query, location))
            type_map.append("booking")
        if "viator" in search_types:
            tasks.append(self.search_viator(query, location))
            type_map.append("viator")

        results = await asyncio.gather(*tasks, return_exceptions=True)

        combined = {}
        for i, t in enumerate(type_map):
            try:
                combined[t] = results[i] if not isinstance(results[i], Exception) else []
            except Exception:
                combined[t] = []

        return combined

    async def _scrape_page(
        self,
        url: str,
        site_type: str,
        timeout_ms: int = 30000
    ) -> List[TravelSearchResult]:
        """
        Scrape a page and extract travel results using agent-browser CLI.

        Uses a single shell call with chained commands so they share one
        browser session. The daemon persists between commands.
        """
        try:
            timeout_s = max(10, timeout_ms // 1000)

            cmd = (
                f"timeout {timeout_s} {self.browser_path} "
                f"--daemon --port {DAEMON_PORT} "
                f"open {url} && "
                f"{self.browser_path} --daemon --port {DAEMON_PORT} "
                f"snapshot -i --json && "
                f"{self.browser_path} --daemon --port {DAEMON_PORT} "
                f"get title --json && "
                f"{self.browser_path} --daemon --port {DAEMON_PORT} "
                f"close"
            )

            proc = await asyncio.create_subprocess_exec(
                "sh", "-c", cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await proc.communicate()

            if proc.returncode != 0:
                stderr_text = stderr.decode(errors="replace")
                logger.error(f"Browser error (exit {proc.returncode}): {stderr_text}")
                return []

            return self._parse_output(stdout.decode(errors="replace"), site_type, url)

        except asyncio.TimeoutError:
            logger.error(f"Scraping timed out after {timeout_ms}ms for {url}")
            return []
        except Exception as e:
            logger.error(f"Scraping error for {url}: {e}")
            return []

    def _parse_output(
        self,
        raw_output: str,
        site_type: str,
        url: str
    ) -> List[TravelSearchResult]:
        """
        Parse structured output from agent-browser commands.

        Expected sections (each may be JSON or plain text):
          1. snapshot -i --json   -> accessibility tree
          2. get title --json     -> {"title": "..."}
          3. trailing stdout text
        """
        results = []

        if site_type == "traveloka":
            site_name = "traveloka.com"
        elif site_type == "booking":
            site_name = "booking.com"
        elif site_type == "viator":
            site_name = "viator.com"
        else:
            site_name = url.split("/")[2] if "/" in url else "unknown"

        # Extract title from JSON block if present.
        title = f"Search results from {site_name}"
        for line in raw_output.splitlines():
            stripped = line.strip()
            if stripped.startswith("{") or stripped.startswith("["):
                try:
                    data = json.loads(stripped)
                    if isinstance(data, dict):
                        title = data.get("title", title)
                except Exception:
                    pass

        # Fall back: find a "title:" line in non-JSON text.
        if title == f"Search results from {site_name}":
            title_match = re.search(r"title:\s*(.+)", raw_output, re.I)
            if title_match:
                title = title_match.group(1).strip().strip('"')

        # Collect all text from the output for pattern matching.
        # Remove JSON noise and extract readable text.
        content_lines = []
        for line in raw_output.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            # Skip pure JSON objects/arrays at the top level.
            if stripped.startswith("{") or stripped.startswith("["):
                try:
                    json.loads(stripped)
                    continue
                except Exception:
                    pass
            # Strip agent-browser ref prefixes like @e1, @e2, etc.
            text = re.sub(r"@\w+\s*", "", stripped)
            # Remove role tags like [heading], [link], etc.
            text = re.sub(r"\[[\w-]+\]\s*", "", text)
            text = text.strip()
            if text:
                content_lines.append(text)

        content = " ".join(content_lines)

        # Extract price patterns.
        price = None
        price_match = re.search(r"[\$€£]\s*[\d,]+\.?\d*", content)
        if not price_match:
            price_match = re.search(r"[\d,]+\.?\d*\s*(?:VND|USD|EUR|₫|€|£)", content)
        if price_match:
            price = price_match.group(0).strip()

        # Extract rating patterns.
        rating = None
        rating_match = re.search(r"[\d.]+\s*(?:star|sao|rating|reviews?)", content, re.I)
        if rating_match:
            rating = rating_match.group(0).strip()

        # Truncate description.
        description = content[:1500] if len(content) > 1500 else content
        description = re.sub(r"\s+", " ", description).strip()

        results.append(TravelSearchResult(
            site=site_name,
            title=title,
            description=description,
            url=url,
            price=price,
            rating=rating
        ))

        return results

    def _build_traveloka_url(self, query: str, location: Optional[str]) -> str:
        """Build Traveloka search URL."""
        base = "https://www.traveloka.com/en-vn/search"
        q = query.replace(" ", "+")
        if location:
            return f"{base}?query={q}&location={location.replace(' ', '+')}"
        return f"{base}?query={q}"

    def _build_booking_url(self, query: str, location: Optional[str]) -> str:
        """Build Booking.com search URL."""
        if location:
            loc = location.replace(" ", "+")
            return f"https://www.booking.com/searchresults.html?ss={loc}"
        return f"https://www.booking.com/searchresults.html?ss={query.replace(' ', '+')}"

    def format_results(self, results: List[TravelSearchResult]) -> str:
        """Format search results for display."""
        if not results:
            return "No results found."

        lines = ["**Search Results:**\n"]
        for i, r in enumerate(results, 1):
            lines.append(f"{i}. **{r.site}**")
            if r.price:
                lines.append(f"   Price: {r.price}")
            if r.rating:
                lines.append(f"   Rating: {r.rating}")
            lines.append(f"   {r.description[:300]}...")
            lines.append(f"   Link: {r.url}\n")

        return "\n".join(lines)


_web_search_service: Optional[WebSearchService] = None


def get_web_search_service() -> WebSearchService:
    """Get or create web search service singleton."""
    global _web_search_service
    if _web_search_service is None:
        _web_search_service = WebSearchService()
    return _web_search_service

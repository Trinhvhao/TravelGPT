// ============================================================
// Chat API — AI assistant with streaming support
// ============================================================
import { api, rateLimiter, storage } from "./api";
import type {
  ChatRequest,
  ChatResponse,
  ConversationHistory,
  SSEMessage,
  ChatSuggestion,
  BookingFlowData,
  Tour,
  // New types for missing endpoints
  ConversationStateResponse,
  PreTripRequest,
  PreTripResponse,
  PostTripRequest,
  PostTripResponse,
  RefundPolicyResponse,
} from "@/types";

export interface ChatStreamCallbacks {
  onStart?: () => void;
  onMessage?: (text: string) => void;
  onSuggestions?: (suggestions: ChatSuggestion[]) => void;
  onBookingFlow?: (step: string, data?: Partial<BookingFlowData>) => void;
  onBookingComplete?: (bookingCode: string, totalPrice: number) => void;
  onTourResults?: (tours: Tour[]) => void;
  onDone?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

export const chatApi = {
  /**
   * Send a chat message (non-streaming).
   * Checks rate limit (60/m) before sending.
   */
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const limit = rateLimiter.track();
    if (!limit.allowed) {
      throw {
        _type: "rate_limited",
        _retryAfter: limit.resetIn,
        message: `Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ ${Math.ceil(limit.resetIn / 1000)} giây.`,
      };
    }

    const response = await api.post<ChatResponse>("/chat/message", request);
    return response.data;
  },

  /**
   * Send a chat message with Mem0 memory enhancement.
   */
  sendMessageV2: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>("/chat/message-v2", request);
    return response.data;
  },

  /**
   * SSE streaming chat — reads incremental chunks from LLM in real-time.
   * Uses native fetch + ReadableStream (not Axios).
   * Returns a cleanup function to abort the stream.
   *
   * Backend sends SSE events:
   *   - { type: "start" }
   *   - { type: "content", content: "..." }  ← incremental chunks
   *   - { type: "complete", intent, suggestions, tours, response }
   *   - { type: "error", error: "..." }
   */
  sendMessageStream: async (
    request: ChatRequest,
    callbacks: ChatStreamCallbacks
  ): Promise<() => void> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = storage.getAccessToken();

    const controller = new AbortController();
    const signal = controller.signal;

    // Build SSE request using native fetch (Axios doesn't support streaming)
    const eventSource = fetch(`${baseUrl}/chat/message/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
      signal,
    });

    eventSource
      .then(async (response) => {
        if (!response.ok) {
          callbacks.onError?.(`HTTP ${response.status}: ${response.statusText}`);
          callbacks.onDone?.("");
          return;
        }

        if (!response.body) {
          callbacks.onError?.("Streaming not supported by server");
          callbacks.onDone?.("");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";

        try {
          callbacks.onStart?.();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages in buffer (separated by \n\n)
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? ""; // Keep incomplete last line in buffer

            for (const line of lines) {
              const event = chatApi.parseSSEEvent(line);
              if (!event) continue;

              if (event.type === "start") {
                // Stream beginning — nothing to render yet
              } else if (event.type === "content" && event.content !== undefined) {
                fullResponse += event.content;
                callbacks.onMessage?.(event.content);
              } else if (event.type === "complete") {
                const data = event as {
                  type: "complete";
                  intent?: string;
                  suggestions?: ChatSuggestion[];
                  response?: string;
                  tours?: Tour[];
                };
                callbacks.onSuggestions?.(data.suggestions ?? []);
                if (data.tours) {
                  callbacks.onTourResults?.(data.tours);
                }
              } else if (event.type === "error") {
                const err = event as { type: "error"; error?: string };
                callbacks.onError?.(err.error ?? "Unknown stream error");
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            const event = chatApi.parseSSEEvent(buffer);
            if (event?.type === "complete") {
              const data = event as {
                type: "complete";
                suggestions?: ChatSuggestion[];
                tours?: Tour[];
              };
              callbacks.onSuggestions?.(data.suggestions ?? []);
              if (data.tours) callbacks.onTourResults?.(data.tours);
            }
          }

          callbacks.onDone?.(fullResponse);
        } catch (err) {
          if ((err as Error).name === "AbortError") {
            // Stream was cancelled — not an error
            return;
          }
          callbacks.onError?.(String(err));
          callbacks.onDone?.(fullResponse);
        }
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        callbacks.onError?.(String(err));
        callbacks.onDone?.("");
      });

    // Cleanup function — aborts the fetch request
    return () => controller.abort();
  },

  /**
   * Parse SSE data lines from a ReadableStream (for future streaming endpoint).
   */
  parseSSEEvent: (line: string): SSEMessage | null => {
    if (!line.startsWith("data: ")) return null;
    const data = line.slice(6).trim();
    if (data === "[DONE]") return { type: "done" };
    try {
      const parsed = JSON.parse(data);
      return parsed as SSEMessage;
    } catch {
      return { type: "message", content: data };
    }
  },

  /**
   * Get chat history (conversations + messages).
   */
  getHistory: async (): Promise<ConversationHistory[]> => {
    const response = await api.get<ConversationHistory[]>("/chat/history");
    return response.data;
  },

  /**
   * Clear all chat history for current user.
   */
  clearHistory: async (): Promise<void> => {
    await api.delete("/chat/history");
  },

  /**
   * Get suggestions by intent (public endpoint).
   */
  getSuggestions: async (intent?: string): Promise<ChatSuggestion[]> => {
    const response = await api.get<ChatSuggestion[]>("/chat/suggestions", {
      params: intent ? { intent } : undefined,
    });
    return response.data;
  },

  // ── Cancellation / Reschedule flows ──────────────────────────────────────

  startCancellation: async (booking_code?: string) => {
    const response = await api.post<ChatResponse>("/chat/cancellation/start", {
      booking_code,
    });
    return response.data;
  },

  cancellationAction: async (action: string, data?: Record<string, unknown>) => {
    const response = await api.post<ChatResponse>("/chat/cancellation/action", {
      action,
      ...data,
    });
    return response.data;
  },

  startReschedule: async (booking_code?: string) => {
    const response = await api.post<ChatResponse>("/chat/reschedule/start", { booking_code });
    return response.data;
  },

  rescheduleAction: async (action: string, data?: Record<string, unknown>) => {
    const response = await api.post<ChatResponse>("/chat/reschedule/action", {
      action,
      ...data,
    });
    return response.data;
  },

  // ── Pre-trip / Post-trip ─────────────────────────────────────────────────

  preTripChecklist: async (booking_id?: string, destination?: string) => {
    const response = await api.post<{ checklist: Record<string, string[]> }>("/chat/pre-trip/checklist", {
      booking_id,
      destination,
    });
    return response.data;
  },

  postTripFeedback: async (booking_id: string) => {
    const response = await api.post<{ message: string; suggestions: ChatSuggestion[] }>(
      "/chat/post-trip/feedback",
      { booking_id }
    );
    return response.data;
  },

  // ── Pre-trip ──────────────────────────────────────────────

  /**
   * Get pre-trip weather reminder for a destination.
   */
  preTripWeather: async (params: PreTripRequest): Promise<PreTripResponse> => {
    const response = await api.post<PreTripResponse>("/chat/pre-trip/weather", params);
    return response.data;
  },

  /**
   * Get comprehensive pre-trip summary (weather + tips + packing + checklist).
   */
  preTripSummary: async (params: PreTripRequest): Promise<PreTripResponse> => {
    const response = await api.post<PreTripResponse>("/chat/pre-trip/summary", params);
    return response.data;
  },

  // ── Post-trip ─────────────────────────────────────────────

  /**
   * Get post-trip loyalty points calculation.
   */
  postTripLoyalty: async (params: PostTripRequest): Promise<PostTripResponse> => {
    const response = await api.post<PostTripResponse>("/chat/post-trip/loyalty", params);
    return response.data;
  },

  /**
   * Get post-trip review writing prompt.
   */
  postTripReviewPrompt: async (params: PostTripRequest): Promise<PostTripResponse> => {
    const response = await api.post<PostTripResponse>("/chat/post-trip/review-prompt", params);
    return response.data;
  },

  /**
   * Get comprehensive post-trip summary (feedback + loyalty + return reminder).
   */
  postTripSummary: async (params: PostTripRequest): Promise<PostTripResponse> => {
    const response = await api.post<PostTripResponse>("/chat/post-trip/summary", params);
    return response.data;
  },

  // ── Cancellation refund policy ────────────────────────────

  /**
   * Get refund policy details (public endpoint, no auth required).
   */
  getRefundPolicy: async (): Promise<RefundPolicyResponse> => {
    const response = await api.get<RefundPolicyResponse>("/chat/cancellation/refund-policy");
    return response.data;
  },

  // ── Multi-turn conversation state ─────────────────────────

  /**
   * Get current multi-turn conversation state (recent turns, active goal, collected entities).
   */
  getConversationState: async (session_id: string): Promise<ConversationStateResponse> => {
    const response = await api.get<ConversationStateResponse>(`/chat/conversation/${session_id}`);
    return response.data;
  },

  /**
   * Create a new goal for the conversation (e.g. "booking", "searching").
   */
  createConversationGoal: async (session_id: string, goal_type: string, target?: string) => {
    const response = await api.post<{ goal_id: string; message: string }>(
      `/chat/conversation/${session_id}/goal`,
      null,
      { params: { goal_type, target } }
    );
    return response.data;
  },

  /**
   * Cancel the active conversation goal.
   */
  cancelConversationGoal: async (session_id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/chat/conversation/${session_id}/goal`
    );
    return response.data;
  },
};

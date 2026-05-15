"use client";
import { useState, useCallback } from "react";
import { chatApi } from "@/lib/chat-api";
import type {
  ChatMessage,
  ChatResponse,
  ChatSuggestion,
  BookingFlowStep,
  BookingFlowData,
  // New: multi-turn conversation
  ConversationStateResponse,
} from "@/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * useChat — manages AI chat conversation state.
 *
 * Features:
 * - Send message, receive response
 * - Booking flow state tracking (mirrors backend BookingFlowStep)
 * - Suggestion chips
 * - SSE streaming (non-blocking for now)
 * - Rate limit awareness
 * - Multi-turn conversation state (recent turns, active goal, entities)
 */
export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<string>(sessionId ?? generateId());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Multi-turn conversation state
  const [conversationState, setConversationState] = useState<ConversationStateResponse | null>(null);

  // Booking flow state
  const [bookingFlowActive, setBookingFlowActive] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingFlowStep | null>(null);
  const [bookingData, setBookingData] = useState<Partial<BookingFlowData>>({});

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        created_at: new Date().toISOString(),
      };
      addMessage(userMsg);

      try {
        const response = await chatApi.sendMessage({
          message: text.trim(),
          session_id: session,
          conversation_id: conversationId ?? undefined,
        });

        handleChatResponse(response);
      } catch (err: unknown) {
        const msg = String(err);
        setError(msg);

        const errorMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: `Xin lỗi, đã xảy ra lỗi: ${msg}. Vui lòng thử lại.`,
          created_at: new Date().toISOString(),
        };
        addMessage(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [session, conversationId, addMessage]
  );

  const handleChatResponse = useCallback((response: ChatResponse) => {
    if (response.conversation_id) setConversationId(response.conversation_id);
    if (response.session_id) setSession(response.session_id);
    if (response.suggestions) setSuggestions(response.suggestions);
    else setSuggestions([]);

    if (response.booking_flow_active !== undefined) setBookingFlowActive(response.booking_flow_active);
    if (response.booking_step) setBookingStep(response.booking_step);
    if (response.booking_data) setBookingData((prev) => ({ ...prev, ...response.booking_data }));

    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: response.message,
      created_at: new Date().toISOString(),
      metadata: {
        intent: response.intent,
        booking_flow_active: response.booking_flow_active,
        booking_step: response.booking_step,
        booking_code: response.booking_code,
        booking_flow_complete: response.booking_flow_complete,
        tours: response.tours,
      },
    };
    addMessage(assistantMsg);
  }, [addMessage]);

  /**
   * Refresh multi-turn conversation state from backend.
   */
  const refreshConversationState = useCallback(async () => {
    try {
      const state = await chatApi.getConversationState(session);
      setConversationState(state);
      return state;
    } catch {
      return null;
    }
  }, [session]);

  /**
   * Start a new conversation goal (e.g. "booking", "searching").
   */
  const startConversationGoal = useCallback(async (goal_type: string, target?: string) => {
    try {
      const result = await chatApi.createConversationGoal(session, goal_type, target);
      await refreshConversationState();
      return result;
    } catch (err) {
      setError(String(err));
      return null;
    }
  }, [session, refreshConversationState]);

  /**
   * Cancel the active conversation goal.
   */
  const cancelConversationGoal = useCallback(async () => {
    try {
      const result = await chatApi.cancelConversationGoal(session);
      await refreshConversationState();
      return result;
    } catch (err) {
      setError(String(err));
      return null;
    }
  }, [session, refreshConversationState]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    setSuggestions([]);
    setBookingFlowActive(false);
    setBookingStep(null);
    setBookingData({});
    setConversationState(null);
    setError(null);
    try {
      await chatApi.clearHistory();
    } catch {
      // ignore — local state is already cleared
    }
  }, []);

  const updateBookingData = useCallback((data: Partial<BookingFlowData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  }, []);

  return {
    messages,
    session,
    conversationId,
    isLoading,
    suggestions,
    error,
    conversationState,
    bookingFlowActive,
    bookingStep,
    bookingData,
    sendMessage,
    clearHistory,
    updateBookingData,
    addMessage,
    refreshConversationState,
    startConversationGoal,
    cancelConversationGoal,
  };
}

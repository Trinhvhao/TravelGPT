// ============================================================
// Chat Store — enhanced with booking flow state + tool status + persist
// ============================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ChatMessage,
  BookingFlowStep,
  BookingFlowData,
  ChatSuggestion,
  ToolStatus,
  WebSearchResult,
} from "@/types";
import { v4 as uuidv4 } from "uuid";

// ─── Design Tokens ──────────────────────────────────────────────────────────────
export const CHAT_PRIMARY = "#0046C1";
export const CHAT_ACCENT = "#0391FF";
export const CHAT_SURFACE = "#F7F7F7";
export const CHAT_SURFACE_LIGHT = "#D9EEFF";
export const CHAT_NAVY = "#000E1A";
export const CHAT_GRAY = "#636363";

// ─── Message Reaction ────────────────────────────────────────────────────────────
export type MessageReaction = "helpful" | "not_helpful";

// ─── Bookmarked Message ─────────────────────────────────────────────────────────
export interface BookmarkedMessage {
  messageId: string;
  content: string;
  timestamp: string;
  tourRef?: string;
}

// ─── Conversation Summary (for list) ────────────────────────────────────────────
export interface ConversationSummary {
  sessionId: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

// ─── Chat Store State ────────────────────────────────────────────────────────────
interface ChatStoreState {
  // Messages & Sessions
  messages: ChatMessage[];
  sessionId: string;
  conversationId: string | null;
  conversations: ConversationSummary[]; // List of past conversations

  // Loading states
  isLoading: boolean;
  isStreaming: boolean;
  suggestions: ChatSuggestion[];
  error: string | null;

  // AI Tool Status (shown while LLM is calling tools)
  toolStatus: ToolStatus;
  toolLabel: string;

  // Web search results (from web_search_travel tool)
  webSearchResults: WebSearchResult[];
  webSearchQuery: string | null;

  // Message actions & metadata
  messageReactions: Record<string, MessageReaction>;
  bookmarkedMessages: BookmarkedMessage[];
  failedMessages: string[]; // IDs of messages that failed to send

  // Booking flow
  bookingFlowActive: boolean;
  bookingStep: BookingFlowStep | null;
  bookingData: Partial<BookingFlowData>;

  // Cancellation / reschedule
  cancellationFlowActive: boolean;
  rescheduleFlowActive: boolean;

  // Search
  searchQuery: string;
  searchResults: ChatMessage[];

  // Actions - Messages & Sessions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setSuggestions: (suggestions: ChatSuggestion[]) => void;
  setError: (error: string | null) => void;
  setSessionId: (id: string) => void;
  setConversationId: (id: string | null) => void;
  clearMessages: () => void;
  retryMessage: (messageId: string) => void;
  markMessageFailed: (messageId: string) => void;
  removeFailedMessage: (messageId: string) => void;

  // Actions - AI Tool Status
  setToolStatus: (status: ToolStatus, label?: string) => void;
  clearToolStatus: () => void;

  // Actions - Web Search
  setWebSearchResults: (results: WebSearchResult[], query?: string) => void;
  clearWebSearchResults: () => void;

  // Actions - Conversations
  addConversation: (conversation: ConversationSummary) => void;
  updateConversation: (sessionId: string, updates: Partial<ConversationSummary>) => void;
  deleteConversation: (sessionId: string) => void;
  loadConversations: (conversations: ConversationSummary[]) => void;
  clearAllConversations: () => void;

  // Actions - Reactions & Bookmarks
  addReaction: (messageId: string, reaction: MessageReaction) => void;
  removeReaction: (messageId: string) => void;
  toggleBookmark: (message: ChatMessage) => void;
  isBookmarked: (messageId: string) => boolean;

  // Actions - Booking flow
  setBookingFlow: (active: boolean, step?: BookingFlowStep, data?: Partial<BookingFlowData>) => void;
  updateBookingData: (data: Partial<BookingFlowData>) => void;
  setCancellationFlow: (active: boolean) => void;
  setRescheduleFlow: (active: boolean) => void;
  resetFlows: () => void;

  // Actions - Search
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ChatMessage[]) => void;
  clearSearch: () => void;
}

// ─── Helper: Generate conversation title from first message ───────────────────────
function generateConversationTitle(messages: ChatMessage[]): { title: string; preview: string; tags: string[] } {
  const userMessages = messages.filter((m) => m.role === "user");
  const firstUserMsg = userMessages[0]?.content || "Cuộc trò chuyện mới";
  const title = firstUserMsg.slice(0, 50) + (firstUserMsg.length > 50 ? "..." : "");
  const preview = messages.length > 0 ? messages[messages.length - 1].content.slice(0, 80) : "";
  const tags: string[] = [];

  const content = messages.map((m) => m.content).join(" ").toLowerCase();
  if (content.includes("đà nẵng") || content.includes("hội an")) tags.push("Đà Nẵng");
  if (content.includes("phú quốc") || content.includes("nha trang")) tags.push("Biển");
  if (content.includes("booking") || content.includes("đặt tour")) tags.push("Đặt tour");
  if (content.includes("hủy")) tags.push("Hủy");

  return { title, preview, tags };
}

// Clear persisted storage on load so stale messages never leak through after refresh
if (typeof window !== "undefined") {
  try { localStorage.removeItem("travelgpt-chat-store"); } catch { /* ignore */ }
}

// ─── Store ──────────────────────────────────────────────────────────────────────
export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      sessionId: uuidv4(),
      conversationId: null,
      conversations: [],

      isLoading: false,
      isStreaming: false,
      suggestions: [],
      error: null,

      // Tool status
      toolStatus: "idle",
      toolLabel: "",

      // Web search
      webSearchResults: [],
      webSearchQuery: null,

      messageReactions: {},
      bookmarkedMessages: [],
      failedMessages: [],

      bookingFlowActive: false,
      bookingStep: null,
      bookingData: {},

      cancellationFlowActive: false,
      rescheduleFlowActive: false,

      searchQuery: "",
      searchResults: [],

      // ── Messages & Sessions ──────────────────────────────────────────────
      addMessage: (message) =>
        set((state) => {
          const newMessages = [...state.messages, message];

          // Auto-save conversation summary when messages change
          if (message.role === "user") {
            const { title, preview, tags } = generateConversationTitle(newMessages);
            const existingIdx = state.conversations.findIndex((c) => c.sessionId === state.sessionId);
            const conversation: ConversationSummary = {
              sessionId: state.sessionId,
              title,
              preview: newMessages[newMessages.length - 1]?.content.slice(0, 80) || "",
              messageCount: newMessages.length,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags,
            };

            if (existingIdx >= 0) {
              const updated = [...state.conversations];
              updated[existingIdx] = {
                ...updated[existingIdx],
                ...conversation,
                updatedAt: new Date().toISOString(),
                messageCount: newMessages.length,
              };
              return { messages: newMessages, conversations: updated };
            } else {
              return {
                messages: newMessages,
                conversations: [conversation, ...state.conversations],
              };
            }
          }

          return { messages: newMessages };
        }),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      deleteMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id),
        })),

      setMessages: (messages) => set({ messages }),

      setLoading: (loading) => set({ isLoading: loading }),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      setSuggestions: (suggestions) => set({ suggestions }),

      setError: (error) => set({ error }),

      setSessionId: (id) => set({ sessionId: id }),

      setConversationId: (id) => set({ conversationId: id }),

      clearMessages: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("travelgpt-chat-store");
        }
        set({
          messages: [],
          suggestions: [],
          toolStatus: "idle",
          toolLabel: "",
          webSearchResults: [],
          webSearchQuery: null,
          bookingFlowActive: false,
          bookingStep: null,
          bookingData: {},
          cancellationFlowActive: false,
          rescheduleFlowActive: false,
          error: null,
          failedMessages: [],
          searchQuery: "",
          searchResults: [],
        });
      },

      retryMessage: (messageId) =>
        set((state) => ({
          failedMessages: state.failedMessages.filter((id) => id !== messageId),
        })),

      markMessageFailed: (messageId) =>
        set((state) => ({
          failedMessages: [...state.failedMessages, messageId],
        })),

      removeFailedMessage: (messageId) =>
        set((state) => ({
          failedMessages: state.failedMessages.filter((id) => id !== messageId),
        })),

      // ── Conversations ─────────────────────────────────────────────────────
      addConversation: (conversation) =>
        set((state) => {
          const exists = state.conversations.some((c) => c.sessionId === conversation.sessionId);
          if (exists) {
            return {
              conversations: state.conversations.map((c) =>
                c.sessionId === conversation.sessionId ? conversation : c
              ),
            };
          }
          return { conversations: [conversation, ...state.conversations] };
        }),

      updateConversation: (sessionId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.sessionId === sessionId ? { ...c, ...updates } : c
          ),
        })),

      deleteConversation: (sessionId) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.sessionId !== sessionId),
        })),

      loadConversations: (conversations) => set({ conversations }),

      clearAllConversations: () => set({ conversations: [], messages: [] }),

      // ── Reactions & Bookmarks ────────────────────────────────────────────
      addReaction: (messageId, reaction) =>
        set((state) => ({
          messageReactions: { ...state.messageReactions, [messageId]: reaction },
        })),

      removeReaction: (messageId) =>
        set((state) => {
          const { [messageId]: _, ...rest } = state.messageReactions;
          return { messageReactions: rest };
        }),

      toggleBookmark: (message) =>
        set((state) => {
          const existing = state.bookmarkedMessages.find((b) => b.messageId === message.id);
          if (existing) {
            return {
              bookmarkedMessages: state.bookmarkedMessages.filter((b) => b.messageId !== message.id),
            };
          }
          const bookmark: BookmarkedMessage = {
            messageId: message.id,
            content: message.content,
            timestamp: message.created_at || new Date().toISOString(),
          };
          return { bookmarkedMessages: [...state.bookmarkedMessages, bookmark] };
        }),

      isBookmarked: (messageId) => get().bookmarkedMessages.some((b) => b.messageId === messageId),

      // ── Booking flow ─────────────────────────────────────────────────────
      setBookingFlow: (active, step, data) =>
        set((state) => ({
          bookingFlowActive: active,
          bookingStep: step ?? state.bookingStep,
          bookingData: data ? { ...state.bookingData, ...data } : state.bookingData,
        })),

      updateBookingData: (data) =>
        set((state) => ({ bookingData: { ...state.bookingData, ...data } })),

      setCancellationFlow: (active) => set({ cancellationFlowActive: active }),

      setRescheduleFlow: (active) => set({ rescheduleFlowActive: active }),

      resetFlows: () =>
        set({
          bookingFlowActive: false,
          bookingStep: null,
          bookingData: {},
          cancellationFlowActive: false,
          rescheduleFlowActive: false,
        }),

      // ── Search ───────────────────────────────────────────────────────────
      setSearchQuery: (query) => {
        if (!query.trim()) {
          set({ searchQuery: "", searchResults: [] });
          return;
        }
        const results = get().messages.filter((m) =>
          m.content.toLowerCase().includes(query.toLowerCase())
        );
        set({ searchQuery: query, searchResults: results });
      },

      setSearchResults: (results) => set({ searchResults: results }),

      clearSearch: () => set({ searchQuery: "", searchResults: [] }),

      // ── AI Tool Status ───────────────────────────────────────────
      setToolStatus: (status, label = "") =>
        set({ toolStatus: status, toolLabel: label }),

      clearToolStatus: () => set({ toolStatus: "idle", toolLabel: "" }),

      // ── Web Search ───────────────────────────────────────────────
      setWebSearchResults: (results, query) =>
        set({ webSearchResults: results, webSearchQuery: query ?? null }),

      clearWebSearchResults: () =>
        set({ webSearchResults: [], webSearchQuery: null }),
    }),
    {
      name: "travelgpt-chat-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        messages: state.messages,
        sessionId: state.sessionId,
        conversationId: state.conversationId,
        conversations: state.conversations,
        bookmarkedMessages: state.bookmarkedMessages,
        messageReactions: state.messageReactions,
      }),
    }
  )
);

// ─── Selectors ──────────────────────────────────────────────────────────────────
export const selectRecentConversations = (limit = 10) => (state: ChatStoreState) =>
  state.conversations.slice(0, limit);

export const selectHasUnread = (state: ChatStoreState) =>
  state.messages.filter((m) => m.role === "assistant").length > 0;

export const selectLastAssistantMessage = (state: ChatStoreState) =>
  [...state.messages].reverse().find((m) => m.role === "assistant");

export const selectUserMessages = (state: ChatStoreState) =>
  state.messages.filter((m) => m.role === "user");

// ============================================================
// Chat/AI Types — mirrors backend schemas/chat.py + ai/graph.py
// ============================================================

export type MessageRole = "user" | "assistant" | "system";
export type ConversationState =
  | "IDLE"
  | "SEARCHING"
  | "BROWSING"
  | "BOOKING"
  | "MODIFYING"
  | "COMPLAINING"
  | "COMPLETED";

export type BookingFlowStep =
  | "GREETING"
  | "COLLECT_NAME"
  | "COLLECT_EMAIL"
  | "COLLECT_PHONE"
  | "COLLECT_TOUR"
  | "COLLECT_DATE"
  | "COLLECT_PARTICIPANTS"
  | "COLLECT_SPECIAL_REQUESTS"
  | "CONFIRM_BOOKING"
  | "PROCESSING"
  | "SUCCESS"
  | "COMPLETED";

export type CancellationStep =
  | "INIT"
  | "VERIFY_BOOKING"
  | "CONFIRM_CANCELLATION"
  | "SELECT_REASON"
  | "CALCULATE_REFUND"
  | "PROCESSING"
  | "SUCCESS";

export type RescheduleStep =
  | "INIT"
  | "VERIFY_BOOKING"
  | "CHECK_ELIGIBILITY"
  | "SELECT_NEW_DATE"
  | "CHECK_AVAILABILITY"
  | "CALCULATE_PRICE_DIFF"
  | "CONFIRM_RESCHEDULE"
  | "PROCESSING"
  | "SUCCESS";

// 15 intents from backend ai/intent.py
export type IntentType =
  | "greeting"
  | "search_tour"
  | "get_tour_detail"
  | "start_booking"
  | "provide_booking_info"
  | "cancel_booking"
  | "check_booking"
  | "modify_booking"
  | "web_search"
  | "payment"
  | "refund"
  | "complaint"
  | "goodbye"
  | "help"
  | "general_question"
  | "small_talk"
  | "compare_tour"
  | "price_inquiry"
  | "availability";

// ============================================================
// Chat Request/Response
// ============================================================

export interface ChatRequest {
  message: string;
  session_id?: string;
  conversation_id?: string;
  context?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatSuggestion {
  text: string;
  intent?: string;
  action?: string;
  type?: "quick_reply" | "suggestion" | "action";
}

export interface BookingFlowData {
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tour_id?: string;
  tour_name?: string;
  tour_price?: number;
  departure_date?: string;
  num_adults?: number;
  num_children?: number;
  special_requests?: string;
  total_price?: number;
  booking_code?: string;
  booking_id?: string;
}

export interface CancellationFlowData {
  booking_code?: string;
  booking_id?: string;
  reason?: string;
  refund_amount?: number;
  refund_percentage?: number;
}

export interface RescheduleFlowData {
  booking_code?: string;
  booking_id?: string;
  new_date?: string;
  price_difference?: number;
  available_dates?: string[];
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  session_id?: string;
  suggestions?: ChatSuggestion[];
  intent?: IntentType;
  booking_flow_active?: boolean;
  booking_step?: BookingFlowStep;
  booking_data?: BookingFlowData;
  booking_code?: string;
  booking_flow_complete?: boolean;
  cancellation_flow_active?: boolean;
  cancellation_step?: CancellationStep;
  cancellation_data?: CancellationFlowData;
  reschedule_flow_active?: boolean;
  reschedule_step?: RescheduleStep;
  reschedule_data?: RescheduleFlowData;
  tours?: import("@/types/tour").Tour[];
  metadata?: Record<string, unknown>;
}

// ============================================================
// SSE Streaming Types
// ============================================================

export type SSEEventType =
  | "message"
  | "start"
  | "content"
  | "complete"
  | "suggestions"
  | "booking_flow"
  | "booking_complete"
  | "tour_results"
  | "intent_detected"
  | "done"
  | "error";

/** Generic SSE event — covers all event types from /chat/message/stream */
export interface SSEMessage {
  type: SSEEventType;
  content?: string;
  data?: Record<string, unknown>;
}

/** SSE event: { type: "start" } — stream beginning signal */
export interface SSEStartEvent {
  type: "start";
}

/** SSE event: { type: "content", content: "..." } — incremental LLM chunk */
export interface SSEContentEvent {
  type: "content";
  content: string;
}

/** SSE event: { type: "complete", intent, suggestions, response, tours } — stream done */
export interface SSECompleteEvent {
  type: "complete";
  intent?: string;
  suggestions?: ChatSuggestion[];
  response?: string;
  tours?: import("@/types/tour").Tour[];
}

/** SSE event: { type: "error", error: "..." } — stream error */
export interface SSEErrorEvent {
  type: "error";
  error: string;
}

export interface SSETourResult {
  type: "tour_results";
  tours: import("@/types/tour").Tour[];
}

export interface SSEBookingComplete {
  type: "booking_complete";
  booking_code: string;
  total_price: number;
}

export interface SSEBookingFlow {
  type: "booking_flow";
  step: BookingFlowStep;
  data?: Partial<BookingFlowData>;
  message?: string;
}

// ============================================================
// Conversation History
// ============================================================

export interface ConversationTurn {
  turn: number;
  role: MessageRole;
  content: string;
  intent?: IntentType;
  timestamp: string;
}

export interface ConversationHistory {
  id: string;
  session_id: string;
  state: ConversationState;
  turns: ConversationTurn[];
  active_goal?: {
    type: string;
    description: string;
    progress?: number;
  };
  created_at: string;
  updated_at: string;
}

// ============================================================
// Conversation State (Multi-turn)
// ============================================================

export interface TurnInfo {
  turn_id: string;
  user_message: string;
  assistant_response: string;
  intent: string;
  timestamp: string;
}

export interface ConversationStateResponse {
  session_id: string;
  state: ConversationState;
  total_turns: number;
  turns_without_progress: number;
  needs_attention: boolean;
  active_goal_type: string | null;
  completed_goals: number;
  recent_turns: TurnInfo[];
  context: Record<string, unknown>;
  collected_entities: Record<string, unknown>;
}

// ============================================================
// Pre-trip / Post-trip
// ============================================================

export interface PreTripChecklist {
  general: string[];
  documents: string[];
  packing: string[];
  health: string[];
  electronics: string[];
  beach?: string[];
  mountain?: string[];
  city?: string[];
}

export interface PreTripRequest {
  destination?: string;
  departure_date?: string;
  return_date?: string;
  duration?: number;
  trip_type?: "beach" | "mountain" | "city" | "cultural";
}

export interface PreTripResponse {
  countdown_message: string | null;
  weather_info: string | null;
  local_tips: string[];
  packing_tips: string | null;
  checklist: string | null;
}

export interface PreTripWeather {
  destination: string;
  date: string;
  weather?: string;
  tips?: string[];
}

// ─── Post-trip ─────────────────────────────────────────────

export interface PostTripRequest {
  booking_code?: string;
  tour_name?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  num_adults?: number;
  num_children?: number;
  total_spent?: number;
  is_first_booking?: boolean;
}

export interface PostTripResponse {
  feedback_survey: string | null;
  review_prompt: string | null;
  loyalty_points: number | null;
  loyalty_tier: string | null;
  loyalty_benefits: string[];
  points_to_next_tier: number | null;
  return_reminder: string | null;
}

export interface PostTripLoyalty {
  current_tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  points_earned: number;
  total_points: number;
  next_tier?: string;
  benefits?: string[];
}

// ─── Refund Policy ────────────────────────────────────────

export interface RefundPolicyTier {
  days_before: string;
  refund_percent: number;
  description: string;
}

export interface RefundPolicyResponse {
  policy: RefundPolicyTier[];
  processing_fee_percent: number;
  note: string;
}

// ============================================================
// New Features Types
// ============================================================

export type MessageReaction = "helpful" | "not_helpful";

export interface BookmarkedMessage {
  messageId: string;
  content: string;
  timestamp: string;
  tourRef?: string;
}

export interface ConversationSummary {
  sessionId: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

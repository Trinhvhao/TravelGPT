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
  /** User attachments (images sent by user) */
  attachments?: ImageAttachment[];
  /** AI content blocks (structured rich content) */
  content_blocks?: ContentBlock[];
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
  original_date?: string;
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

/** SSE event: { type: "complete", intent, suggestions, response, tours, content_blocks } — stream done */
export interface SSECompleteEvent {
  type: "complete";
  intent?: string;
  suggestions?: ChatSuggestion[];
  response?: string;
  tours?: import("@/types/tour").Tour[];
  content_blocks?: ContentBlock[];
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
  messages: ChatMessageResponse[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessageResponse {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
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

// ============================================================
// Tool Calling / AI Agent Types
// ============================================================

export type ToolStatus =
  | "idle"
  | "searching_tours"
  | "fetching_tour_details"
  | "checking_bookings"
  | "cancelling_booking"
  | "searching_web"
  | "synthesizing";

export interface WebSearchResult {
  site: "traveloka" | "booking" | "viator";
  title: string;
  description: string;
  url: string;
  price?: string;
  rating?: number;
  location?: string;
}

export interface ToolResults {
  /** Tour results from search_tours or get_tour_details tool */
  tours?: WebSearchResult[];
  /** Web search results from web_search_travel tool */
  webResults?: WebSearchResult[];
  /** Whether the AI is currently executing a tool (streaming) */
  toolStatus?: ToolStatus;
  /** Intent label shown while tool is running */
  toolLabel?: string;
}

// ============================================================
// Rich Content Blocks (AI → User)
// ============================================================

export interface ContentBlockText {
  type: "text";
  content: string;
}

export interface ContentBlockImage {
  type: "image";
  url: string;
  caption?: string;
}

export interface ContentBlockGallery {
  type: "gallery";
  images: Array<{ url: string; caption?: string }>;
}

export interface ContentBlockTable {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface ContentBlockCardGrid {
  type: "card_grid";
  cards: Array<{ title: string; body: string; icon?: string }>;
}

export interface ContentBlockTimeline {
  type: "timeline";
  items: Array<{ day?: string; title: string; description?: string; icon?: string }>;
}

export interface ContentBlockStats {
  type: "stats";
  items: Array<{ icon?: string; label: string; value: string }>;
}

// ============================================================
// Rich Content Blocks (AI → User) — Extended for enhanced chat
// ============================================================

export interface ContentBlockText {
  type: "text";
  content: string;
}

export interface ContentBlockImage {
  type: "image";
  url: string;
  caption?: string;
}

export interface ContentBlockGallery {
  type: "gallery";
  images: Array<{ url: string; caption?: string }>;
}

export interface ContentBlockTable {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface ContentBlockCardGrid {
  type: "card_grid";
  cards: Array<{ title: string; body: string; icon?: string }>;
}

export interface ContentBlockTimeline {
  type: "timeline";
  items: Array<{ day?: string; title: string; description?: string; icon?: string }>;
}

export interface ContentBlockStats {
  type: "stats";
  items: Array<{ icon?: string; label: string; value: string }>;
}

export interface ContentBlockAlert {
  type: "alert";
  variant: "info" | "warning" | "success" | "error";
  content: string;
  title?: string;
}

// ─── Tour Card Block ─────────────────────────────────────────────────────────────
export interface ContentBlockTourCard {
  type: "tour_card";
  data: TourCardData;
}

export interface TourCardData {
  id: string;
  name: string;
  slug: string;
  destination: string;
  duration: string;
  price: number;
  discount_price?: number;
  price_display?: string;
  image?: string;
  images?: string[];
  rating?: number;
  review_count?: number;
  short_description?: string;
  is_featured?: boolean;
  category?: string;
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
  departure_dates?: string[];
  max_participants?: number;
  ctas?: Array<{
    label: string;
    action: "navigate" | "booking_flow" | "payment_link" | "external";
    href?: string;
    tourId?: string;
    url?: string;
  }>;
}

// ─── Tour Carousel Block ────────────────────────────────────────────────────────
export interface ContentBlockTourCarousel {
  type: "tour_carousel";
  data: TourCarouselData;
}

export interface TourCarouselData {
  title?: string;
  subtitle?: string;
  tours: TourCardData[];
}

// ─── Weather Block ─────────────────────────────────────────────────────────────
export interface ContentBlockWeather {
  type: "weather";
  data: WeatherData;
}

export interface WeatherData {
  destination: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    wind: string;
    icon: string;
    icon_emoji?: string;
  };
  forecast?: Array<{
    date: string;
    temperature_high: number;
    temperature_low: number;
    condition: string;
    icon: string;
  }>;
  best_time_to_visit?: string;
  travel_advice?: string;
  source?: string;
}

// ─── Booking Form Block ────────────────────────────────────────────────────────
export interface ContentBlockBookingForm {
  type: "booking_form";
  data: BookingFormData;
}

export interface BookingFormData {
  tour_id: string;
  tour_name: string;
  available_dates?: string[];
  base_price: number;
  base_price_label?: string;
  child_price?: number;
  child_price_label?: string;
  contact_fields?: Array<"name" | "email" | "phone" | "special_requests">;
}

// ─── Booking Preview Block ─────────────────────────────────────────────────────
export interface ContentBlockBookingPreview {
  type: "booking_preview";
  data: BookingPreviewData;
}

export interface BookingPreviewData {
  tour_name: string;
  tour_image?: string;
  departure_date: string;
  adults: number;
  children: number;
  total_price: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  special_requests?: string;
  booking_code?: string;
}

// ─── Action Button Block ───────────────────────────────────────────────────────
export interface ContentBlockActionButton {
  type: "action_button";
  data: ActionButtonData;
}

export interface ActionButtonData {
  label: string;
  action: "navigate" | "payment_link" | "external" | "copy" | "download";
  href?: string;
  url?: string;
  icon?: string;
  style?: "primary" | "secondary" | "outline" | "ghost";
  description?: string;
}

// ─── Suggestion Block ─────────────────────────────────────────────────────────
export interface ContentBlockSuggestion {
  type: "suggestion";
  data: SuggestionData;
}

export interface SuggestionData {
  suggestions: Array<{
    id: string;
    label: string;
    query: string;
    icon?: string;
  }>;
}

// ─── PreTrip Block ──────────────────────────────────────────────────────────────
export interface ContentBlockPreTrip {
  type: "pre_trip";
  data: PreTripData;
}

export interface PreTripData {
  destination?: string;
  departure_date?: string;
  return_date?: string;
  duration?: number;
  trip_type?: "beach" | "mountain" | "city" | "cultural";
  countdown_message?: string;
  weather_info?: string;
  local_tips?: string[];
  packing_tips?: string;
  checklist?: string;
  weather?: WeatherData;
  checklist_items?: string[];
}

// ─── PostTrip Block ────────────────────────────────────────────────────────────
export interface ContentBlockPostTrip {
  type: "post_trip";
  data: PostTripData;
}

export interface PostTripData {
  booking_code?: string;
  tour_name?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  num_adults?: number;
  num_children?: number;
  total_spent?: number;
  is_first_booking?: boolean;
  feedback_survey?: string;
  review_prompt?: string;
  loyalty_points?: number;
  loyalty_tier?: "Bronze" | "Silver" | "Gold" | "Platinum";
  loyalty_benefits?: string[];
  points_to_next_tier?: number;
  return_reminder?: string;
}

export type ContentBlock =
  | ContentBlockText
  | ContentBlockImage
  | ContentBlockGallery
  | ContentBlockTable
  | ContentBlockCardGrid
  | ContentBlockTimeline
  | ContentBlockStats
  | ContentBlockAlert
  | ContentBlockTourCard
  | ContentBlockTourCarousel
  | ContentBlockWeather
  | ContentBlockBookingForm
  | ContentBlockBookingPreview
  | ContentBlockActionButton
  | ContentBlockSuggestion
  | ContentBlockPreTrip
  | ContentBlockPostTrip;

// ============================================================
// Image Attachments (User → AI)
// ============================================================

export interface ImageAttachment {
  id: string;
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
}

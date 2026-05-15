/**
 * Static data for the homepage — extracted to reduce client bundle size.
 * These arrays are imported only when the page needs them.
 */

import type { ComponentType } from "react";

// ─── Design Tokens (must stay in sync with page.tsx COLORS) ──────────────────
export const COLORS = {
  primary: "#0046C1",
  accent: "#0391FF",
  navy: "#000E1A",
  textSecondary: "#4D4D4D",
  surface: "#F7F7F7",
  surfaceLight: "#D9EEFF",
  border: "#DDDDDD",
  success: "#77DD77",
  warning: "#E67E22",
  error: "#ED1D24",
} as const;

// ─── Icons Map ────────────────────────────────────────────────────────────────
export const ICONS = {
  Bot: "Bot",
  Map: "Map",
  ShieldCheck: "ShieldCheck",
  Heart: "Heart",
  Waves: "Waves",
  Palmtree: "Palmtree",
  Sun: "Sun",
  Mountain: "Mountain",
  Camera: "Camera",
  Users: "Users",
  Star: "Star",
  MapPin: "MapPin",
  MessageSquare: "MessageSquare",
  Globe: "Globe",
  Search: "Search",
  Calendar: "Calendar",
  Clock: "Clock",
  Sparkles: "Sparkles",
  ChevronRight: "ChevronRight",
  ArrowRight: "ArrowRight",
  CheckCircle2: "CheckCircle2",
  Zap: "Zap",
  Award: "Award",
  HeartPulse: "HeartPulse",
} as const;

// ─── Stats ─────────────────────────────────────────────────────────────────────
export interface HomeStat {
  value: number;
  suffix: string;
  label: string;
  iconKey: keyof typeof ICONS;
  color: string;
}

export const STATS: HomeStat[] = [
  { value: 500, suffix: "+", label: "Tour du lịch", iconKey: "Map", color: COLORS.primary },
  { value: 50, suffix: "K+", label: "Khách hàng", iconKey: "Users", color: COLORS.accent },
  { value: 4.9, suffix: "", label: "Đánh giá TB", iconKey: "Star", color: COLORS.warning },
  { value: 24, suffix: "/7", label: "Hỗ trợ AI", iconKey: "Bot", color: COLORS.success },
];

// ─── How It Works ─────────────────────────────────────────────────────────────
export interface HomeStep {
  num: string;
  iconKey: keyof typeof ICONS;
  title: string;
  description: string;
  color: string;
  image: string;
}

export const STEPS: HomeStep[] = [
  {
    num: "01",
    iconKey: "MessageSquare",
    title: "Trò chuyện với AI",
    description: "Chia sẻ điểm đến yêu thích, ngân sách và sở thích của bạn",
    color: COLORS.primary,
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80",
  },
  {
    num: "02",
    iconKey: "Search",
    title: "Nhận gợi ý",
    description: "AI phân tích và đề xuất tour phù hợp nhất từ hơn 500+ tour",
    color: COLORS.accent,
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80",
  },
  {
    num: "03",
    iconKey: "Calendar",
    title: "Chọn và đặt",
    description: "Đặt tour trực tiếp trong chat, thanh toán an toàn chỉ vài giây",
    color: COLORS.success,
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
  },
  {
    num: "04",
    iconKey: "CheckCircle2",
    title: "Tận hưởng",
    description: "Khám phá điểm đến tuyệt vời với hành trình được lên kế hoạch hoàn hảo",
    color: COLORS.warning,
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────
export interface HomeFeature {
  iconKey: keyof typeof ICONS;
  title: string;
  description: string;
  badge: string;
  color: string;
  image: string;
  span?: "wide" | "tall" | "normal";
}

export const FEATURES: HomeFeature[] = [
  {
    iconKey: "Bot",
    title: "AI thông minh",
    description: "Trò chuyện tự nhiên với AI để tìm tour phù hợp nhất cho bạn",
    badge: "Chatbot",
    color: COLORS.primary,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
    span: "wide",
  },
  {
    iconKey: "Map",
    title: "Hơn 500+ tour",
    description: "Đa dạng từ biển đảo, núi rừng, thành phố đến các điểm di sản",
    badge: "Du lịch",
    color: COLORS.accent,
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
  },
  {
    iconKey: "ShieldCheck",
    title: "Thanh toán an toàn",
    description: "Bảo mật tuyệt đối, hỗ trợ nhiều phương thức thanh toán",
    badge: "Bảo mật",
    color: COLORS.success,
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
  },
  {
    iconKey: "Heart",
    title: "Gợi ý cá nhân hóa",
    description: "AI phân tích sở thích để đề xuất tour hoàn hảo cho bạn",
    badge: "Cá nhân hóa",
    color: COLORS.warning,
    image: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=600&q=80",
  },
];

// ─── Popular Destinations ─────────────────────────────────────────────────────
export interface HomeDestination {
  name: string;
  region: string;
  tours: number;
  rating: number;
  image: string;
  images: string[];
  tag: string;
  iconKey: keyof typeof ICONS;
}

export const DESTINATIONS: HomeDestination[] = [
  {
    name: "Đà Nẵng",
    region: "Miền Trung",
    tours: 45,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80",
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80",
      "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=400&q=80",
    ],
    tag: "Biển & Núi",
    iconKey: "Waves",
  },
  {
    name: "Phú Quốc",
    region: "Miền Nam",
    tours: 38,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=80",
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80",
      "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=400&q=80",
    ],
    tag: "Đảo nhiệt đới",
    iconKey: "Palmtree",
  },
  {
    name: "Nha Trang",
    region: "Miền Trung",
    tours: 52,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
      "https://images.unsplash.com/photo-1559599238-308793637427?w=400&q=80",
      "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=400&q=80",
    ],
    tag: "Biển",
    iconKey: "Sun",
  },
  {
    name: "Sapa",
    region: "Miền Bắc",
    tours: 33,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80",
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80",
      "https://images.unsplash.com/photo-1559599238-308793637427?w=400&q=80",
    ],
    tag: "Núi & Trekking",
    iconKey: "Mountain",
  },
  {
    name: "Hội An",
    region: "Miền Trung",
    tours: 41,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=400&q=80",
      "https://images.unsplash.com/photo-1559599238-308793637427?w=400&q=80",
      "https://images.unsplash.com/photo-1559302504-90327ee9fafa?w=400&q=80",
    ],
    tag: "Di sản",
    iconKey: "Camera",
  },
  {
    name: "Phong Nha",
    region: "Miền Trung",
    tours: 22,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80",
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80",
      "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=400&q=80",
    ],
    tag: "Hang động",
    iconKey: "Map",
  },
];

// ─── Testimonials ──────────────────────────────────────────────────────────────
export interface HomeTestimonial {
  name: string;
  avatar: string;
  tour: string;
  rating: number;
  text: string;
}

export const TESTIMONIALS: HomeTestimonial[] = [
  {
    name: "Minh Anh",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80",
    tour: "Đà Nẵng 4N3Đ",
    rating: 5,
    text: "AI đã giúp tôi tìm được tour hoàn hảo chỉ trong vài phút. Thay vì lướt hàng trăm trang, tôi chỉ cần trò chuyện và nhận gợi ý cá nhân.",
  },
  {
    name: "Hoàng Nam",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    tour: "Phú Quốc 3N2Đ",
    rating: 5,
    text: "Quy trình đặt tour nhanh chóng, thanh toán dễ dàng. Đội ngũ hỗ trợ 24/7 luôn sẵn sàng giải đáp mọi thắc mắc.",
  },
  {
    name: "Thu Hà",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    tour: "Sapa Trekking 2N1Đ",
    rating: 5,
    text: "Tính năng AI chat rất thông minh. Nó nhớ được sở thích của tôi từ lần trò chuyện trước và đề xuất tour cực kỳ chính xác.",
  },
];

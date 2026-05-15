import type { Config } from "tailwindcss";

// Vietravel Design System — tailwind.config.ts
const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── 1. COLOR PALETTE ──────────────────────────────────────────────────
      colors: {
        // Primary
        navy: {
          DEFAULT: "#000E1A",
          50: "#E6EBEE",
          100: "#B3C4D1",
          200: "#809DB4",
          300: "#4D7697",
          400: "#264F7A",
          500: "#003A66",
          600: "#002540",
          700: "#00102A",
          800: "#000E1A",
          900: "#000810",
        },
        primary: {
          DEFAULT: "#0046C1",
          50: "#E6F0FF",
          100: "#B3D1FF",
          200: "#80B3FF",
          300: "#4D94FF",
          400: "#1A75FF",
          500: "#0046C1",
          600: "#0035A3",
          700: "#002540",
          800: "#001830",
          900: "#000B20",
        },
        bright: {
          DEFAULT: "#0391FF",
          50: "#E6F5FF",
          100: "#B3DEFF",
          200: "#80C8FF",
          300: "#4DB1FF",
          400: "#1A9AFF",
          500: "#0391FF",
          600: "#0274CC",
          700: "#015799",
          800: "#003A66",
          900: "#001D33",
        },
        // Accent
        lightblue: {
          DEFAULT: "#D9EEFF",
          50: "#FFFFFF",
          100: "#FFFFFF",
          200: "#FFFFFF",
          300: "#F5FAFF",
          400: "#E6F5FF",
          500: "#D9EEFF",
          600: "#A3D1F5",
          700: "#6DB4E0",
          800: "#3797CB",
          900: "#1A75FF",
        },
        // Semantic
        warning: {
          DEFAULT: "#F8C700",
          bright: "#FFD21C",
          light: "#FFF3B3",
        },
        error: {
          DEFAULT: "#ED1D24",
          dark: "#D40E00",
          light: "#FFE5E3",
        },
        success: {
          DEFAULT: "#77DD77",
          dark: "#2D7A2D",
          light: "#E5F8E5",
        },
        // Neutral
        charcoal: "#4D4D4D",
        "dark-gray": "#636363",
        "medium-gray": "#999999",
        "light-gray": "#DDDDDD",
        "lightest-gray": "#F7F7F7",
        // Surface
        white: "#FFFFFF",
        "off-white": "#F7F7F7",
        "pale-blue": "#E2E6EF",
        "near-black": "#191919",
        // Design token aliases
        border: "#DDDDDD",
        input: "#F7F7F7",
        ring: "#0046C1",
        background: "#FFFFFF",
        foreground: "#000E1A",
        card: "#FFFFFF",
        "card-foreground": "#000E1A",
        popover: "#FFFFFF",
        "popover-foreground": "#000E1A",
        secondary: {
          DEFAULT: "#D9EEFF",
          foreground: "#0046C1",
        },
        destructive: {
          DEFAULT: "#ED1D24",
          foreground: "#FFFFFF",
          dark: "#D40E00",
          light: "#FFE5E3",
        },
        muted: {
          DEFAULT: "#F7F7F7",
          foreground: "#636363",
        },
        accent: {
          DEFAULT: "#D9EEFF",
          foreground: "#0046C1",
        },
      },

      // ── 2. TYPOGRAPHY ─────────────────────────────────────────────────────
      fontFamily: {
        mulish: ["Mulish", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        "display-1": ["32px", { lineHeight: "40px", fontWeight: "700", letterSpacing: "0px" }],
        "display-2": ["28px", { lineHeight: "36px", fontWeight: "700", letterSpacing: "0px" }],
        "heading-1": ["24px", { lineHeight: "28px", fontWeight: "700", letterSpacing: "0px" }],
        "heading-2": ["20px", { lineHeight: "24px", fontWeight: "700", letterSpacing: "0px" }],
        "heading-3": ["16px", { lineHeight: "20px", fontWeight: "700", letterSpacing: "0px" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "500", letterSpacing: "0px" }],
        "body": ["14px", { lineHeight: "20px", fontWeight: "600", letterSpacing: "0px" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400", letterSpacing: "0px" }],
        "button": ["14px", { lineHeight: "20px", fontWeight: "600", letterSpacing: "0px" }],
        "input": ["16px", { lineHeight: "20px", fontWeight: "400", letterSpacing: "0px" }],
        "link": ["14px", { lineHeight: "20px", fontWeight: "600", letterSpacing: "0px" }],
        "metadata": ["12px", { lineHeight: "16px", fontWeight: "400", letterSpacing: "0px" }],
        "code": ["13px", { lineHeight: "16px", fontWeight: "400", letterSpacing: "0px" }],
      },

      // ── 3. SPACING ────────────────────────────────────────────────────────
      spacing: {
        "4.5": "18px",
        "13": "52px",
        "15": "60px",
        "18": "72px",
        "20": "80px",
        "25": "100px",
      },

      // ── 4. BORDER RADIUS ─────────────────────────────────────────────────
      borderRadius: {
        none: "0px",
        sm: "4px",
        DEFAULT: "8px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        full: "9999px",
      },

      // ── 5. SHADOWS (4 DEPTH LEVELS) ───────────────────────────────────────
      boxShadow: {
        // L0 – Flat: no shadow, border only
        flat: "none",
        // L1 – Raised: subtle hover
        raised: "0px 1px 3px 0px rgba(0, 0, 0, 0.05)",
        // L2 – Floating: cards, containers
        floating: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
        // L3 – Elevated: hovered cards, dropdown menus
        elevated: "0px 4px 12px 0px rgba(0, 0, 0, 0.12)",
        // L4 – Modal: overlays, dialogs
        modal: "0px 8px 24px 0px rgba(0, 0, 0, 0.20)",
        // Component-specific
        "card-hover": "0px 4px 12px 0px rgba(0, 0, 0, 0.15)",
        "tour-card": "0px 2px 6px 0px rgba(0, 0, 0, 0.10)",
        "tour-card-hover": "0px 4px 12px 0px rgba(0, 0, 0, 0.15)",
        "input-focus": "0px 0px 0px 3px rgba(0, 70, 193, 0.10)",
      },

      // ── 6. TRANSITIONS ────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-in-out",
      },

      // ── 7. BREAKPOINTS ────────────────────────────────────────────────────
      screens: {
        xs: "320px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },

      // ── 8. MAX WIDTHS ─────────────────────────────────────────────────────
      maxWidth: {
        container: "1440px",
        "prose-wide": "72ch",
      },

      // ── 9. Z-INDEX SCALE ─────────────────────────────────────────────────
      zIndex: {
        base: "0",
        raised: "10",
        dropdown: "100",
        sticky: "200",
        overlay: "300",
        modal: "400",
        toast: "500",
        tooltip: "600",
      },
    },
  },
  plugins: [],
};

export default config;

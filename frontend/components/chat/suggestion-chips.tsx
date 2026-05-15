"use client";
import { cn } from "@/lib/utils";
import type { ChatSuggestion } from "@/types";
import { Sparkles, ArrowRight } from "lucide-react";

// ─── Design Tokens (Airbnb Style) ──────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE_LIGHT = "#D9EEFF";
const NAVY = "#000E1A";
const GRAY = "#636363";

interface SuggestionChipsProps {
  suggestions: ChatSuggestion[];
  onSelect: (text: string) => void;
  className?: string;
}

export function SuggestionChips({ suggestions, onSelect, className }: SuggestionChipsProps) {
  if (!suggestions.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {suggestions.slice(0, 6).map((s, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(s.text)}
          className={cn(
            "text-[13px] px-4 py-2.5 font-medium transition-all cursor-pointer flex items-center gap-2"
          )}
          style={{
            backgroundColor: "#FFFFFF",
            color: PRIMARY,
            border: `1px solid ${SURFACE_LIGHT}`,
            borderRadius: "50px",
            boxShadow: "0 2px 8px rgba(0,70,193,0.08)",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.backgroundColor = SURFACE_LIGHT;
            btn.style.transform = "translateY(-2px)";
            btn.style.boxShadow = "0 4px 12px rgba(0,70,193,0.15)";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.backgroundColor = "#FFFFFF";
            btn.style.transform = "translateY(0)";
            btn.style.boxShadow = "0 2px 8px rgba(0,70,193,0.08)";
          }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} />
          {s.text}
          <ArrowRight className="h-3 w-3" style={{ color: ACCENT, marginLeft: "-4px", opacity: 0 }} />
        </button>
      ))}
    </div>
  );
}

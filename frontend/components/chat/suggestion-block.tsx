"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ContentBlockSuggestion, SuggestionData } from "@/types";
import { Sparkles, ArrowRight } from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE_LIGHT = "#D9EEFF";

interface SuggestionBlockProps {
  block: ContentBlockSuggestion;
  onSelect?: (query: string) => void;
}

export function SuggestionBlock({ block, onSelect }: SuggestionBlockProps) {
  const { suggestions } = block.data;

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="my-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} />
        <span className="text-[12px] font-semibold" style={{ color: GRAY }}>
          Gợi ý
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 6).map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect?.(s.query)}
            className="text-[13px] px-4 py-2.5 font-medium transition-all cursor-pointer flex items-center gap-2"
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
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.backgroundColor = "#FFFFFF";
              btn.style.transform = "translateY(0)";
            }}
          >
            {s.icon && <span className="text-sm">{s.icon}</span>}
            {s.label}
            <ArrowRight className="h-3 w-3" style={{ color: ACCENT }} />
          </button>
        ))}
      </div>
    </div>
  );
}

const GRAY = "#636363";

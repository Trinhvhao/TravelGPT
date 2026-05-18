// ============================================================
// Markdown-like content renderer for chat messages
// Supports: bold, italic, links, lists, line breaks
// ============================================================
import React from "react";
import { ExternalLink } from "lucide-react";

interface RenderContentProps {
  text: string;
  className?: string;
}

type InlineToken = {
  type: "text" | "bold" | "italic" | "link" | "strikethrough" | "code";
  value: string;
  url?: string;
};

/** Tokenize inline markdown patterns from a line of text */
function tokenize(line: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = line;

  // Handle horizontal rule (****, ----, ____)
  if (/^[*_\-]{3,}$/.test(remaining.trim())) {
    return [{ type: "text", value: "" }]; // Will be handled as HR in parent
  }

  const patterns: Array<{
    regex: RegExp;
    type: InlineToken["type"];
  }> = [
    { regex: /\*\*([^*]+)\*\*/, type: "bold" },
    { regex: /\*([^*]+)\*/, type: "italic" },
    { regex: /_([^_]+)_/, type: "italic" },
    { regex: /~~([^~]+)~~/, type: "strikethrough" },
    { regex: /`([^`]+)`/, type: "code" },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, type: "link" },
  ];

  while (remaining.length > 0) {
    let earliestIndex = remaining.length;
    let earliestMatch: { type: InlineToken["type"]; match: RegExpMatchArray } | null = null;

    for (const { regex, type } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index !== undefined && match.index < earliestIndex) {
        earliestIndex = match.index;
        earliestMatch = { type, match };
      }
    }

    if (earliestMatch) {
      const idx = earliestMatch.match.index!;
      if (idx > 0) {
        tokens.push({ type: "text", value: remaining.slice(0, idx) });
      }
      if (earliestMatch.type === "link") {
        tokens.push({
          type: "link",
          value: earliestMatch.match[1],
          url: earliestMatch.match[2],
        });
      } else {
        tokens.push({ type: earliestMatch.type, value: earliestMatch.match[1] });
      }
      remaining = remaining.slice(idx + earliestMatch.match[0].length);
    } else {
      tokens.push({ type: "text", value: remaining });
      break;
    }
  }

  return tokens;
}

function renderInlineToken(token: InlineToken, idx: number): React.ReactNode {
  switch (token.type) {
    case "bold":
      return <strong key={idx}>{token.value}</strong>;
    case "italic":
      return <em key={idx}>{token.value}</em>;
    case "strikethrough":
      return <s key={idx} className="opacity-70">{token.value}</s>;
    case "code":
      return (
        <code
          key={idx}
          className="px-1 py-0.5 rounded text-xs font-mono"
          style={{ backgroundColor: "#EEF4FF", color: "#0046C1" }}
        >
          {token.value}
        </code>
      );
    case "link":
      return (
        <a
          key={idx}
          href={token.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
          style={{ color: "#0046C1" }}
        >
          {token.value}
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      );
    default:
      return token.value;
  }
}

/**
 * Renders markdown-like text as React elements.
 * Supports: **bold**, *italic*, _italic_, ~~strikethrough~~, `code`,
 * [text](url), • list items, - list items, \n paragraph breaks.
 * Special handling for tour lists (numbered with price info).
 */
export function renderContent(text: string, className?: string): React.ReactNode {
  if (!text) return null;

  // Normalize horizontal rule markers to a single format
  const normalized = text.replace(/^(\*{3,}|_{3,}|-{3,})$/gm, "---HR---");
  const segments = normalized.split(/---HR---\n?/);

  return (
    <span className={className}>
      {segments.map((segment, sIdx) => {
        if (!segment.trim()) return null;

        const paragraphs = segment.split(/\n\n+/);

        return paragraphs.map((paragraph, pIdx) => {
          const lines = paragraph.split(/\n/);

          // Check if this is a tour list (numbered items with tour info)
          const tourListPattern = /^\s*\d+\.\s+\*\*Tour\s+/;
          const hasTourLists = lines.some(line => tourListPattern.test(line));

          if (hasTourLists) {
            return renderTourList(lines, sIdx, pIdx);
          }

          // Check if all non-empty lines are list items
          const nonEmptyLines = lines.filter((l) => l.trim());
          const isList =
            nonEmptyLines.length > 0 &&
            nonEmptyLines.every((l) => /^[•\-\*]\s/.test(l) || /^\d+\.\s/.test(l));

          if (isList) {
            return (
              <ul key={`${sIdx}-${pIdx}`} className="list-disc pl-4 my-1 space-y-0.5">
                {nonEmptyLines.map((line, lIdx) => {
                  const content = line.replace(/^[•\-\*]\s*/, "").replace(/^\d+\.\s*/, "");
                  const tokens = tokenize(content);
                  return (
                    <li key={lIdx}>
                      {tokens.map((token, tIdx) => renderInlineToken(token, tIdx))}
                    </li>
                  );
                })}
              </ul>
            );
          }

          return (
            <React.Fragment key={`${sIdx}-${pIdx}`}>
              {lines.map((line, lIdx) => {
                if (!line.trim()) {
                  return lIdx < lines.length - 1 ? <br key={`${sIdx}-${pIdx}-br-${lIdx}`} /> : null;
                }

                const tokens = tokenize(line);
                return (
                  <React.Fragment key={`${sIdx}-${pIdx}-${lIdx}`}>
                    {tokens.map((token, tIdx) => renderInlineToken(token, tIdx))}
                    {lIdx < lines.length - 1 && <br />}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        });
      })}
    </span>
  );
}

/**
 * Renders a tour list in a beautiful inline format.
 * Detects patterns like:
 * 1. **Tour Name**
 *    📍 Location | ⏱️ Duration
 *    Description
 *    💰 Price
 */
function renderTourList(lines: string[], sIdx: number, pIdx: number): React.ReactNode {
  const items: Array<{ title: string; location?: string; duration?: string; description?: string; price?: string }> = [];
  let currentItem: typeof items[0] | null = null;

  const parseLine = (line: string) => {
    const trimmed = line.trim();
    
    // Tour title: "1. **Tour Name**" or "**Tour Name**"
    const titleMatch = trimmed.match(/^\d+\.\s+\*\*([^*]+)\*\*/) || trimmed.match(/^\*\*([^*]+)\*\*/);
    if (titleMatch) {
      if (currentItem) items.push(currentItem);
      currentItem = { title: titleMatch[1] };
      return;
    }

    // Location: "📍 Location | ⏱️ Duration"
    const detailMatch = trimmed.match(/📍\s*([^|]+?)\s*(?:\|.*)?$/);
    if (detailMatch && currentItem) {
      const parts = detailMatch[1].split(/\|/).map(p => p.trim());
      currentItem.location = parts[0];
      const durationMatch = trimmed.match(/⏱️\s*([^|]+)/);
      if (durationMatch) currentItem.duration = durationMatch[1];
      return;
    }

    // Duration alone: "⏱️ Duration"
    const durationOnlyMatch = trimmed.match(/⏱️\s*(.+)/);
    if (durationOnlyMatch && currentItem && !currentItem.duration) {
      currentItem.duration = durationOnlyMatch[1];
      return;
    }

    // Description (plain text continuation)
    if (trimmed && !trimmed.startsWith("💰") && !trimmed.startsWith("**") && currentItem && !currentItem.description) {
      // Skip emoji-only lines and separators
      if (!/^[📍⏱💰🎉✅✈️🏨]+$/.test(trimmed)) {
        currentItem.description = trimmed;
      }
      return;
    }

    // Price: "💰 **Price**"
    const priceMatch = trimmed.match(/💰\s*(.+)/);
    if (priceMatch && currentItem) {
      currentItem.price = priceMatch[1];
      return;
    }
  };

  for (const line of lines) {
    parseLine(line);
  }
  if (currentItem) items.push(currentItem);

  if (items.length === 0) {
    // Fallback: render as regular list
    return (
      <div key={`${sIdx}-${pIdx}`} className="space-y-1 my-2">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          const tokens = tokenize(trimmed);
          return (
            <div key={lIdx} className="flex gap-2">
              <span className="text-[#0046C1] font-medium">{lIdx + 1}.</span>
              <span>{tokens.map((token, tIdx) => renderInlineToken(token, tIdx))}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div key={`${sIdx}-${pIdx}`} className="space-y-2 my-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2 p-2 rounded-lg transition-colors"
          style={{ backgroundColor: "#F8FAFC" }}
        >
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white mt-0.5"
            style={{ backgroundColor: "#0046C1" }}
          >
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px]" style={{ color: "#000E1A" }}>
              {item.title}
            </p>
            {(item.location || item.duration) && (
              <p className="text-[12px] mt-0.5" style={{ color: "#636363" }}>
                {item.location && <span className="inline-flex items-center gap-1">📍 {item.location}</span>}
                {item.location && item.duration && <span className="mx-1">|</span>}
                {item.duration && <span className="inline-flex items-center gap-1">⏱️ {item.duration}</span>}
              </p>
            )}
            {item.description && (
              <p className="text-[12px] mt-1" style={{ color: "#636363" }}>
                {item.description}
              </p>
            )}
            {item.price && (
              <p className="text-[14px] font-bold mt-1" style={{ color: "#0046C1" }}>
                💰 {item.price}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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
 */
export function renderContent(text: string, className?: string): React.ReactNode {
  if (!text) return null;

  const paragraphs = text.split(/\n\n+/);

  return (
    <span className={className}>
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split(/\n/);

        // Check if all non-empty lines are list items
        const nonEmptyLines = lines.filter((l) => l.trim());
        const isList =
          nonEmptyLines.length > 0 &&
          nonEmptyLines.every((l) => /^[•\-\*]\s/.test(l) || /^\d+\.\s/.test(l));

        if (isList) {
          return (
            <ul key={pIdx} className="list-disc pl-4 my-1 space-y-0.5">
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
          <React.Fragment key={pIdx}>
            {lines.map((line, lIdx) => {
              if (!line.trim()) {
                return lIdx < lines.length - 1 ? <br key={lIdx} /> : null;
              }

              const tokens = tokenize(line);
              return (
                <React.Fragment key={lIdx}>
                  {tokens.map((token, tIdx) => renderInlineToken(token, tIdx))}
                  {lIdx < lines.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
}

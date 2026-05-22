"use client";

import type { TourCardData } from "@/types/chat";

/** Parsed tour data from markdown text */
export interface ParsedTour {
  name: string;
  destination: string;
  duration: string;
  price: number;
  priceDisplay: string;
  rating?: number;
  reviewCount?: number;
  shortDescription?: string;
  category?: string;
}

/** Parse price string like "2.200.000đ" or "1,500,000 VND" into number */
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove currency symbols and separators
  const cleaned = priceStr
    .replace(/[đĐVNDvnd\$\.,]/g, "")
    .replace(/\s+/g, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Extract Vietnamese duration like "2 ngày 1 đêm" from text */
function extractDuration(text: string): string {
  const patterns = [
    /(\d+)\s*ngày\s*(\d+)\s*đêm/i,
    /(\d+)\s*days?\s*(\d+)\s*nights?/i,
    /(\d+)N(\d+)D/i,
    /(\d+)\s*days?/i,
    /(\d+)\s*nights?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes("N")) {
        return `${match[1]}N${match[2]}D`;
      }
      if (match[2]) {
        return `${match[1]} ngày ${match[2]} đêm`;
      }
      if (pattern.source.includes("ngày")) {
        return `${match[1]} ngày`;
      }
      return `${match[1]} đêm`;
    }
  }
  return "";
}

/** Check if a line is a tour list item */
function isTourListItem(line: string): boolean {
  const trimmed = line.trim();
  // Pattern: "1. Tour Đà Nẵng..." or "1) Tour..."
  if (/^\d+[\.\)]\s+Tour\s+/i.test(trimmed)) return true;
  // Pattern: "1. Tour vịnh Hạ Long..."
  if (/^\d+[\.\)]\s+.+\d+\s*(ngày|đêm|day|night|N|D)/i.test(trimmed)) return true;
  return false;
}

/**
 * Parse markdown text containing tour listings into structured tour data.
 * Handles formats like:
 * **1. Tour Hà Nội - Hạ Long 2N1Đ**
 * 📍 Hạ Long | ⏱️ 2 ngày 1 đêm
 * Tour 2 ngày 1 đêm vịnh Hạ Long
 * 💰 2.200.000đ
 */
export function parseToursFromMarkdown(text: string): ParsedTour[] {
  const tours: ParsedTour[] = [];
  const lines = text.split("\n");

  let currentTour: Partial<ParsedTour> = {};
  let currentName = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines but save current tour if we have enough data
    if (!trimmed) {
      if (currentTour.name && currentTour.price > 0) {
        tours.push(currentTour as ParsedTour);
      }
      currentTour = {};
      currentName = "";
      continue;
    }

    // Skip non-tour lines
    if (!isTourListItem(trimmed) &&
        !trimmed.startsWith("📍") &&
        !trimmed.startsWith("⏱️") &&
        !trimmed.startsWith("💰") &&
        !trimmed.startsWith("🎉") &&
        !trimmed.startsWith("✅") &&
        !/tìm thấy\s+\d+\s+tour/i.test(trimmed) &&
        !/^[*_\-]{3,}$/.test(trimmed) &&
        trimmed !== currentName) {
      continue;
    }

    // Parse tour name: **1. Tour Hà Nội - Hạ Long 2N1Đ** or 1. Tour...
    const nameMatch = trimmed.match(/^\*?\*?\d+[\.\)]\s*Tour\s+(.+?)(?:\s*[\|\$💰]|$)/i) ||
                      trimmed.match(/^(.+?)\s*[\|\$💰]/) ||
                      trimmed.match(/^\*?\*?\d+[\.\)]\s*(.+?)(?:\s*[\|\$💰]|$)/);
    if (nameMatch && !trimmed.startsWith("📍") && !trimmed.startsWith("⏱️") && !trimmed.startsWith("💰")) {
      // If we have a previous tour, save it
      if (currentTour.name && currentTour.price > 0) {
        tours.push(currentTour as ParsedTour);
      }
      currentTour = {};
      currentName = nameMatch[1].trim();
      // Clean up markdown bold markers
      currentTour.name = currentName.replace(/^\*\*|\*\*$/g, "").trim();
      // Extract duration from name if present
      const durationMatch = currentTour.name.match(/(\d+N\d+D|\d+\s*ngày\s*\d+\s*đêm|\d+\s*days?)/i);
      if (durationMatch) {
        currentTour.duration = extractDuration(durationMatch[1]);
      }
      continue;
    }

    // Parse location: 📍 Hạ Long | ⏱️ ...
    if (trimmed.startsWith("📍") || trimmed.includes("📍")) {
      const locationMatch = trimmed.match(/📍\s*(.+?)(?:[\|\n]|$)/);
      if (locationMatch && !currentTour.destination) {
        currentTour.destination = locationMatch[1].trim();
      }
    }

    // Parse duration: ⏱️ 2 ngày 1 đêm
    if (trimmed.startsWith("⏱️") || /\d+\s*ngày|\d+N\d+D/i.test(trimmed)) {
      const durationMatch = trimmed.match(/⏱️\s*(.+?)(?:[\|\n]|$)/) || trimmed.match(/(\d+\s*ngày\s*\d+\s*đêm|\d+N\d+D|\d+\s*days?\s*\d+\s*nights?)/i);
      if (durationMatch) {
        currentTour.duration = extractDuration(durationMatch[1]);
      }
    }

    // Parse price: 💰 2.200.000đ
    if (trimmed.startsWith("💰") || /[\d.,]+\s*đ/.test(trimmed)) {
      const priceMatch = trimmed.match(/💰\s*(.+?)(?:[\|\n]|$)/) ||
                        trimmed.match(/([\d.,]+)\s*đ/) ||
                        trimmed.match(/\$\s*([\d.,]+)/);
      if (priceMatch) {
        currentTour.price = parsePrice(priceMatch[1] || priceMatch[0]);
        currentTour.priceDisplay = priceMatch[1]?.trim() || priceMatch[0].trim();
      }
    }
  }

  // Don't forget the last tour
  if (currentTour.name && currentTour.price > 0) {
    tours.push(currentTour as ParsedTour);
  }

  return tours;
}

/** Check if text contains markdown tour listings */
export function hasMarkdownTours(text: string): boolean {
  const lines = text.split("\n");
  let tourCount = 0;

  for (const line of lines) {
    if (isTourListItem(line)) {
      tourCount++;
      if (tourCount >= 1) return true;
    }
  }

  return false;
}

/** Convert parsed tours to content blocks for rendering */
export function parsedToursToContentBlocks(tours: ParsedTour[]) {
  return tours.map((tour) => ({
    type: "tour_card" as const,
    data: {
      id: `parsed-${tour.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: tour.name,
      slug: tour.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      destination: tour.destination || "Việt Nam",
      duration: tour.duration || "N/A",
      price: tour.price || 0,
      price_display: tour.priceDisplay,
      rating: tour.rating || 0,
      short_description: tour.shortDescription,
      category: tour.category,
      ctas: [
        { label: "Chi tiết", action: "navigate" as const, href: `/tours/${tour.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}` },
        { label: "Đặt ngay", action: "booking_flow" as const }
      ]
    } satisfies TourCardData
  }));
}

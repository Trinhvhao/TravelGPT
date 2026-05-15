"use client";
import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, DollarSign, MapPin, SlidersHorizontal, X } from "lucide-react";

interface TourFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  className?: string;
}

export interface FilterValues {
  destination?: string;
  region?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
}

const REGIONS = [
  { value: "NORTH", label: "Miền Bắc" },
  { value: "CENTRAL", label: "Miền Trung" },
  { value: "SOUTH", label: "Miền Nam" },
  { value: "INTERNATIONAL", label: "Quốc tế" },
];

const CATEGORIES = [
  { value: "beach", label: "Biển" },
  { value: "mountain", label: "Núi" },
  { value: "city", label: "Thành phố" },
  { value: "island", label: "Đảo" },
  { value: "heritage", label: "Di sản" },
  { value: "adventure", label: "Mạo hiểm" },
];

const PRICE_RANGES = [
  { value: "0-1000000", label: "Dưới 1 triệu" },
  { value: "1000000-3000000", label: "1 - 3 triệu" },
  { value: "3000000-5000000", label: "3 - 5 triệu" },
  { value: "5000000-10000000", label: "5 - 10 triệu" },
  { value: "10000000-", label: "Trên 10 triệu" },
];

export function TourFilters({ onFilterChange, className }: TourFiltersProps) {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterValues>({
    search: searchParams.get("q") ?? "",
    region: searchParams.get("region") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  });

  const [priceRange, setPriceRange] = useState<string>(
    searchParams.get("min_price")
      ? `${searchParams.get("min_price")}-${searchParams.get("max_price") ?? ""}`
      : "all"
  );

  const [showMobile, setShowMobile] = useState(false);

  const applyFilters = useCallback(
    (newFilters: FilterValues, newPriceRange?: string) => {
      const applied = { ...newFilters };

      if (newPriceRange && newPriceRange !== "all") {
        const [min, max] = newPriceRange.split("-");
        applied.min_price = min ? parseInt(min) : undefined;
        applied.max_price = max ? parseInt(max) : undefined;
      } else {
        applied.min_price = undefined;
        applied.max_price = undefined;
      }

      onFilterChange(applied);
    },
    [onFilterChange]
  );

  const handleChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    applyFilters(newFilters, priceRange);
  };

  const handlePriceRangeChange = (value: string) => {
    setPriceRange(value);
    applyFilters(filters, value);
  };

  const handleClear = () => {
    setFilters({});
    setPriceRange("all");
    onFilterChange({});
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.region ||
    filters.category ||
    filters.destination ||
    priceRange !== "all"
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowMobile((v) => !v)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Bộ lọc
          {hasActiveFilters && (
            <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
              !
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
        showMobile ? "block" : "hidden lg:grid"
      )}>
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm tour..."
            value={filters.search ?? ""}
            onChange={(e) => handleChange("search", e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-white text-input text-navy placeholder:text-medium-gray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medium-gray" />
        </div>

        {/* Region */}
        <Select
          value={filters.region ?? "all"}
          onValueChange={(v) => handleChange("region", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Miền" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả miền</SelectItem>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        <Select
          value={filters.category ?? "all"}
          onValueChange={(v) => handleChange("category", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Loại tour" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range */}
        <Select value={priceRange} onValueChange={handlePriceRangeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Mức giá" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả giá</SelectItem>
            {PRICE_RANGES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-medium-gray gap-1" onClick={handleClear}>
            <X className="w-3 h-3" />
            Xóa bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
}

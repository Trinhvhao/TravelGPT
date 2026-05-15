"use client";
import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourGalleryProps {
  images: string[];
  tourName: string;
  className?: string;
}

export function TourGallery({ images, tourName, className }: TourGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goTo = (index: number) => setActiveIndex(index);

  if (!images.length) return null;

  const primaryImage = images[activeIndex];

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Main image */}
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-lightest-gray group">
          <Image
            src={primaryImage}
            alt={`${tourName} - ảnh ${activeIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 800px"
          />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-5 h-5 text-navy" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight className="w-5 h-5 text-navy" />
              </button>
            </>
          )}

          {/* Expand button */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Phóng to"
          >
            <Expand className="w-4 h-4 text-navy" />
          </button>

          {/* Counter */}
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/50 text-white text-metadata">
            {activeIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative w-20 h-14 rounded-md overflow-hidden flex-shrink-0 transition-all",
                  idx === activeIndex
                    ? "ring-2 ring-primary ring-offset-1"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-modal bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          <div
            className="relative w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeIndex]}
              alt={`${tourName} - ảnh ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === activeIndex ? "bg-white w-4" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

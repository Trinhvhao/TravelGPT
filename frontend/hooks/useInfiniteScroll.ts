"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number; // px from bottom to trigger load
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

/**
 * useInfiniteScroll — attaches an IntersectionObserver to a sentinel element.
 * Calls onLoadMore when the sentinel enters the viewport.
 *
 * Usage:
 *   const { sentinelRef } = useInfiniteScroll({ onLoadMore, hasMore, isLoading });
 *   <div ref={sentinelRef} />
 */
export function useInfiniteScroll({
  threshold = 200,
  onLoadMore,
  hasMore,
  isLoading,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observer) observer.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: `0px 0px ${threshold}px 0px` }
    );

    setObserver(obs);

    return () => obs.disconnect();
  }, [onLoadMore, hasMore, isLoading, threshold]);

  const attachSentinel = useCallback(
    (el: HTMLDivElement | null) => {
      sentinelRef.current = el;
      if (el && observer) observer.observe(el);
    },
    [observer]
  );

  return { sentinelRef: attachSentinel };
}

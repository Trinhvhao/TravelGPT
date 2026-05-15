"use client";
import { useState, useEffect } from "react";

/**
 * useDebounce — delays updating a value until after `delay` ms of inactivity.
 * Use for search inputs and filter changes.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

"use client";
import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * useNavigation — provides navigation helpers with loading states.
 */
export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useCallback(
    (href: string) => {
      setIsNavigating(true);
      router.push(href);
      // Reset after a short delay — actual navigation will replace the component anyway
      setTimeout(() => setIsNavigating(false), 500);
    },
    [router]
  );

  const replace = useCallback(
    (href: string) => {
      router.replace(href);
    },
    [router]
  );

  return { navigate, replace, isNavigating, pathname };
}

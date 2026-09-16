import { useSyncExternalStore } from "react";

function subscribeMinWidth(query: string, onChange: () => void): () => void {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True when the viewport is at least `px` wide. SSR snapshot is `false` (mobile-first). */
export function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`;
  return useSyncExternalStore(
    (onChange) => subscribeMinWidth(query, onChange),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Desktop layout breakpoint — matches Tailwind `lg` (1024px). */
export function useIsDesktop(): boolean {
  return useMinWidth(1024);
}

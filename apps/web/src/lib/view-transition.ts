import { flushSync } from "react-dom";

/**
 * Runs `update` inside `document.startViewTransition` when the browser has it,
 * flushing React synchronously so the new DOM is what gets snapshotted. Falls
 * back to a plain synchronous update. Reduced motion is honored in CSS on
 * `::view-transition-*`, not here.
 */
export function withViewTransition(update: () => void): void {
  if (typeof document === "undefined" || !("startViewTransition" in document)) {
    update();
    return;
  }
  document.startViewTransition(() => {
    flushSync(update);
  });
}

import { flushSync } from "react-dom";

/** `flushSync` so startViewTransition snapshots the committed DOM, not a pending setState. */
export function withViewTransition(update: () => void): void {
  if (typeof document === "undefined" || !("startViewTransition" in document)) {
    update();
    return;
  }
  document.startViewTransition(() => {
    flushSync(update);
  });
}

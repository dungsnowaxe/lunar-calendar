import { useEffect, useState } from "react";

declare global {
  interface Window {
    __fabOverlapReport?: typeof fabOverlapReport;
  }
}

const FAB_SIZE = 56;
const NAV_SELECTOR = 'nav[aria-label="Điều hướng di động"]';

/** Shared by the visibility hook and the overlap gate (also stamped on the nav). */
export const FAB_OBSTRUCT_SELECTOR = [
  "[data-countdown-value]",
  "[data-countdown-block]",
  "[data-memorial-title]",
  "[data-fab-obstruct]",
  "main button",
  "main a",
  'main [role="button"]',
  "article button",
  "article a",
].join(",");

function isFabHidden(fab: HTMLElement): boolean {
  return (
    fab.classList.contains("is-fab-hidden") ||
    fab.getAttribute("data-fab-visible") === "0" ||
    Number(getComputedStyle(fab).opacity) < 0.05
  );
}

/** Live FAB box when it is on screen; otherwise the right-aligned slot above the pill. */
function fabMeasureRect(): DOMRect {
  const fab = document.querySelector(".glass-fab");
  if (fab instanceof HTMLElement && !isFabHidden(fab)) {
    return fab.getBoundingClientRect();
  }
  const slot = document.querySelector("[data-fab-slot]");
  if (slot instanceof HTMLElement) {
    return slot.getBoundingClientRect();
  }
  const nav = document.querySelector(NAV_SELECTOR);
  const pill = nav?.querySelector(".glass-pill");
  if (pill instanceof HTMLElement) {
    const box = pill.getBoundingClientRect();
    const bottom = box.top - 12;
    const top = bottom - FAB_SIZE;
    const right = box.right;
    const left = right - FAB_SIZE;
    return new DOMRect(left, top, FAB_SIZE, FAB_SIZE);
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  return new DOMRect(width - 16 - FAB_SIZE, height - 100 - FAB_SIZE, FAB_SIZE, FAB_SIZE);
}

function intersects(a: DOMRect, b: DOMRect, pad = 2): boolean {
  return !(
    a.right + pad <= b.left ||
    b.right + pad <= a.left ||
    a.bottom + pad <= b.top ||
    b.bottom + pad <= a.top
  );
}

export type FabOverlapReport = {
  visible: boolean;
  clear: boolean;
  hits: number;
  reasons: string[];
  selector: string;
};

export function fabOverlapReport(): FabOverlapReport {
  const fabEl = document.querySelector(".glass-fab");
  const visible = fabEl instanceof HTMLElement && !isFabHidden(fabEl);
  const fab =
    visible && fabEl instanceof HTMLElement ? fabEl.getBoundingClientRect() : fabMeasureRect();
  const reasons: string[] = [];
  const nodes = document.querySelectorAll(FAB_OBSTRUCT_SELECTOR);
  for (const el of nodes) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.closest(NAV_SELECTOR)) continue;
    if (el.classList.contains("glass-fab") || el.closest(".glass-fab")) continue;
    if (el.closest("[data-fab-slot]")) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) continue;
    if (box.bottom < 0 || box.top > window.innerHeight) continue;
    if (intersects(fab, box)) {
      reasons.push(
        (
          el.getAttribute("aria-label") || el.tagName + " " + (el.textContent || "").slice(0, 32)
        ).trim(),
      );
    }
  }
  return {
    visible,
    clear: reasons.length === 0,
    hits: reasons.length,
    reasons,
    selector: FAB_OBSTRUCT_SELECTOR,
  };
}

export function fabLaneIsClear(): boolean {
  return fabOverlapReport().clear;
}

/**
 * Hide the FAB while the page is scrolling. On idle, reappear only when the
 * measured FAB rect is clear of countdowns, titles, buttons, and tagged heroes.
 */
export function useFabScrollVisibility(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    window.__fabOverlapReport = fabOverlapReport;

    let lastY = window.scrollY;
    let ticking = false;
    let stopTimer = 0;

    const nearBottom = () =>
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 120;

    const atTop = () => window.scrollY < 40;

    const evaluateIdle = () => {
      setVisible(fabLaneIsClear());
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = Math.abs(y - lastY);
        lastY = y;
        ticking = false;
        if (dy > 2) {
          if (!atTop() && !nearBottom()) {
            setVisible(false);
          } else {
            setVisible(fabLaneIsClear());
          }
        }
        window.clearTimeout(stopTimer);
        stopTimer = window.setTimeout(evaluateIdle, 180);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", evaluateIdle, { passive: true });
    const boot = window.setTimeout(evaluateIdle, 0);
    return () => {
      if (window.__fabOverlapReport === fabOverlapReport) delete window.__fabOverlapReport;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", evaluateIdle);
      window.clearTimeout(stopTimer);
      window.clearTimeout(boot);
    };
  }, []);

  return visible;
}

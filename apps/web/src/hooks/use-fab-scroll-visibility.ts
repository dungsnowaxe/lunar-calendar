import { useEffect, useState } from "react";

const FAB_SIZE = 56;
const NAV_SELECTOR = 'nav[aria-label="Điều hướng di động"]';

/** Match MobileGlassNav: FAB is right-aligned to the pill, 12px above it. */
function fabRestingRect(): DOMRect {
  const fab = document.querySelector(".glass-fab");
  if (fab instanceof HTMLElement) {
    const box = fab.getBoundingClientRect();
    const hidden = fab.classList.contains("is-fab-hidden");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dy = hidden && !reduce ? -12 : 0;
    return new DOMRect(box.left, box.top + dy, box.width || FAB_SIZE, box.height || FAB_SIZE);
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

/** Interactive / content the FAB must never cover when visible. */
function obstructingSelector(): string {
  return [
    "[data-countdown-value]",
    "[data-countdown-block]",
    "[data-memorial-title]",
    "[data-fab-obstruct]",
    "button",
    "a[href]",
    '[role="button"]',
  ].join(",");
}

export function fabLaneIsClear(): boolean {
  const fab = fabRestingRect();
  const nodes = document.querySelectorAll(obstructingSelector());
  for (const el of nodes) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.closest(NAV_SELECTOR)) continue;
    if (el.classList.contains("glass-fab") || el.closest(".glass-fab")) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) continue;
    if (box.bottom < 0 || box.top > window.innerHeight) continue;
    if (intersects(fab, box)) return false;
  }
  return true;
}

/**
 * Hide the FAB while the page is scrolling. On idle, reappear only when the
 * resting FAB rect is clear of countdowns, titles, and buttons.
 */
export function useFabScrollVisibility(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
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
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", evaluateIdle);
      window.clearTimeout(stopTimer);
      window.clearTimeout(boot);
    };
  }, []);

  return visible;
}

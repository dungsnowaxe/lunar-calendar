import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

test("BlurFade and NumberTicker honor prefers-reduced-motion via matchMedia", () => {
  const fade = src("./blur-fade.tsx");
  const ticker = src("../ui/number-ticker.tsx");
  assert.ok(fade.includes("usePrefersLessMotion"));
  assert.ok(!fade.includes("useReducedMotion"));
  assert.ok(ticker.includes("usePrefersLessMotion"));
  assert.ok(!ticker.includes("useReducedMotion"));
});

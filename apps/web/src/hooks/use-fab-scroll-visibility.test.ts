import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

test("visibility hook and overlap gate share one obstruction selector", () => {
  const hook = src("./use-fab-scroll-visibility.ts");
  const nav = src("../components/mobile-glass-nav.tsx");

  assert.ok(hook.includes("export const FAB_OBSTRUCT_SELECTOR"));
  assert.ok(hook.includes('"[data-fab-obstruct]"'));
  assert.ok(hook.includes("querySelectorAll(FAB_OBSTRUCT_SELECTOR)"));
  assert.ok(hook.includes("window.__fabOverlapReport = fabOverlapReport"));
  assert.ok(hook.includes("return fabOverlapReport().clear"));

  assert.ok(nav.includes("FAB_OBSTRUCT_SELECTOR"));
  assert.ok(nav.includes("data-fab-obstruct-selector={FAB_OBSTRUCT_SELECTOR}"));
});

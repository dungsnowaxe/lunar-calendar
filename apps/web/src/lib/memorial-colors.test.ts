import assert from "node:assert/strict";
import { test } from "node:test";

import { MEMORIAL_PALETTE, memorialColor, memorialColorCss } from "./memorial-colors.ts";

test("memorialColor is deterministic for the same id", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  assert.equal(memorialColor(id), memorialColor(id));
  assert.equal(memorialColor("abc"), memorialColor("abc"));
});

test("memorialColor stays inside the palette", () => {
  const ids = ["", "a", "z", "uuid-like", ...Array.from({ length: 64 }, (_, i) => `id-${i}`)];
  for (const id of ids) {
    assert.ok((MEMORIAL_PALETTE as readonly string[]).includes(memorialColor(id)));
  }
});

test("memorialColor spreads across palette entries", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 256; i++) {
    seen.add(memorialColor(`memorial-${i}`));
  }
  assert.equal(seen.size, MEMORIAL_PALETTE.length);
});

test("memorialColorCss uses the hashed palette token", () => {
  const id = "sample-id";
  assert.equal(memorialColorCss(id), `var(--color-mem-${memorialColor(id)})`);
});

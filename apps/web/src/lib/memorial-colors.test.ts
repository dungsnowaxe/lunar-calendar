import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MEMORIAL_COLOR_IDS,
  isMemorialColorId,
  migrateMemorialColors,
  nextUnusedMemorialColor,
  resolveMemorialColors,
  type MemorialColorCarrier,
  type MemorialColorId,
} from "./memorial-colors.ts";

test("nextUnusedMemorialColor returns the first palette id not in used", () => {
  assert.equal(nextUnusedMemorialColor([]), "persimmon");
  assert.equal(nextUnusedMemorialColor(["persimmon"]), "marigold");
  assert.equal(nextUnusedMemorialColor(["persimmon", "olive", "marigold"]), "jade");
});

test("nextUnusedMemorialColor wraps with used.length % 8 when the palette is full", () => {
  assert.equal(nextUnusedMemorialColor([...MEMORIAL_COLOR_IDS]), "persimmon");
  assert.equal(nextUnusedMemorialColor([...MEMORIAL_COLOR_IDS, "persimmon"]), "marigold");
  assert.equal(nextUnusedMemorialColor([...MEMORIAL_COLOR_IDS, "persimmon", "marigold"]), "olive");
});

test("migration assigns palette[i % 8] in creation-time ascending order", () => {
  const events: MemorialColorCarrier[] = [
    { id: "c", createdAt: "2026-01-03T00:00:00.000Z", colorId: null },
    { id: "a", createdAt: "2026-01-01T00:00:00.000Z", colorId: null },
    { id: "b", createdAt: "2026-01-02T00:00:00.000Z", colorId: null },
  ];
  const migrated = migrateMemorialColors(events);
  assert.deepEqual(
    migrated.map((event) => [event.id, event.colorId]),
    [
      ["c", "olive"],
      ["a", "persimmon"],
      ["b", "marigold"],
    ],
  );
});

test("migration falls back to list order then id when createdAt is missing", () => {
  const events: MemorialColorCarrier[] = [
    { id: "z", colorId: null },
    { id: "a", colorId: null },
    { id: "m", colorId: null },
  ];
  const migrated = migrateMemorialColors(events);
  assert.equal(migrated[0]?.colorId, "persimmon");
  assert.equal(migrated[1]?.colorId, "marigold");
  assert.equal(migrated[2]?.colorId, "olive");
});

test("migration is idempotent and never reshuffles existing colors", () => {
  const events = [
    { id: "a", createdAt: "2026-01-01T00:00:00.000Z", colorId: "jade" as const },
    { id: "b", createdAt: "2026-01-02T00:00:00.000Z", colorId: "persimmon" as const },
  ];
  const once = migrateMemorialColors(events);
  const twice = migrateMemorialColors(once);
  assert.deepEqual(
    twice.map((event) => event.colorId),
    ["jade", "persimmon"],
  );
});

test("partial migration keeps assigned colors and fills the rest with next unused", () => {
  const events: MemorialColorCarrier[] = [
    { id: "old", createdAt: "2026-01-01T00:00:00.000Z", colorId: "moss" },
    { id: "new", createdAt: "2026-01-02T00:00:00.000Z", colorId: null },
  ];
  const migrated = migrateMemorialColors(events);
  assert.equal(migrated.find((event) => event.id === "old")?.colorId, "moss");
  assert.equal(migrated.find((event) => event.id === "new")?.colorId, "persimmon");
});

test("palette wraps past eight memorials in creation order", () => {
  const events: MemorialColorCarrier[] = MEMORIAL_COLOR_IDS.concat(
    MEMORIAL_COLOR_IDS.slice(0, 2),
  ).map((id, index) => ({
    id,
    createdAt: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
    colorId: null,
  }));
  const migrated = migrateMemorialColors(events);
  assert.equal(migrated[8]?.colorId, "persimmon");
  assert.equal(migrated[9]?.colorId, "marigold");
});

test("isMemorialColorId rejects unknown values", () => {
  assert.equal(isMemorialColorId("persimmon"), true);
  assert.equal(isMemorialColorId("red"), false);
  assert.equal(isMemorialColorId(null), false);
});

test("resolveMemorialColors keeps remaining colors after a delete", () => {
  const stored: Record<string, MemorialColorId> = {
    a: "persimmon",
    b: "marigold",
    c: "olive",
  };
  const remaining: MemorialColorCarrier[] = [
    { id: "a", createdAt: "2026-01-01T00:00:00.000Z", colorId: null },
    { id: "c", createdAt: "2026-01-03T00:00:00.000Z", colorId: null },
  ];
  const resolved = resolveMemorialColors(remaining, stored);
  assert.deepEqual(
    resolved.events.map((event) => [event.id, event.colorId]),
    [
      ["a", "persimmon"],
      ["c", "olive"],
    ],
  );
});

test("resolveMemorialColors prefers stored colors and does not reshuffle them", () => {
  const events: MemorialColorCarrier[] = [
    { id: "a", createdAt: "2026-01-01T00:00:00.000Z", colorId: null },
    { id: "b", createdAt: "2026-01-02T00:00:00.000Z", colorId: null },
  ];
  const stored: Record<string, MemorialColorId> = { a: "plum", b: "rose" };
  const first = resolveMemorialColors(events, stored);
  const second = resolveMemorialColors(events, first.store);
  assert.deepEqual(
    first.events.map((event) => event.colorId),
    ["plum", "rose"],
  );
  assert.deepEqual(
    second.events.map((event) => event.colorId),
    ["plum", "rose"],
  );
  assert.deepEqual(first.persist, [
    { id: "a", colorId: "plum" },
    { id: "b", colorId: "rose" },
  ]);
  assert.deepEqual(second.persist, first.persist);
});

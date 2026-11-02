import assert from "node:assert/strict";
import { test } from "node:test";

import { sortByNextOccurrence } from "./memorial-sort.ts";

const TODAY = { day: 2, month: 11, year: 2026 };

test("sortByNextOccurrence orders events by soonest next solar date", () => {
  const events = [
    { id: "later", lunarDay: 5, lunarMonth: 4 },
    { id: "soon", lunarDay: 13, lunarMonth: 10 },
    { id: "mid", lunarDay: 4, lunarMonth: 11 },
  ];
  const sorted = sortByNextOccurrence(events, TODAY);
  assert.deepEqual(
    sorted.map((event) => event.id),
    ["soon", "mid", "later"],
  );
});

test("sortByNextOccurrence is stable for the same next date", () => {
  const events = [
    { id: "b", lunarDay: 13, lunarMonth: 10 },
    { id: "a", lunarDay: 13, lunarMonth: 10 },
  ];
  const sorted = sortByNextOccurrence(events, TODAY);
  assert.deepEqual(
    sorted.map((event) => event.id),
    ["b", "a"],
  );
});

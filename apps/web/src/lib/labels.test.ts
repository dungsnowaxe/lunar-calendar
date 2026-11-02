import assert from "node:assert/strict";
import { test } from "node:test";
import { formatSolar } from "@lunar/core";

import { daysBetween } from "./labels.ts";

/** Same calendar-day countdown MemorialTicket / MemorialRow pass to NumberTicker. */
const TODAY = { year: 2026, month: 11, day: 2 };

test("daysBetween from a fixed today matches settled countdown values", (t) => {
  const cases: { to: { year: number; month: number; day: number }; days: number }[] = [
    { to: { year: 2026, month: 11, day: 21 }, days: 19 },
    { to: { year: 2027, month: 2, day: 6 }, days: 96 },
    { to: { year: 2027, month: 4, day: 16 }, days: 165 },
    { to: { year: 2027, month: 8, day: 21 }, days: 292 },
    { to: { year: 2027, month: 9, day: 15 }, days: 317 },
  ];

  for (const { to, days } of cases) {
    const got = daysBetween(TODAY, to);
    t.diagnostic(`${formatSolar(to)} → ${got}`);
    assert.equal(got, days);
  }
});

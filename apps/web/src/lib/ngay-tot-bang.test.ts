import assert from "node:assert/strict";
import test from "node:test";

import { solarToLunar } from "@lunar/core";
import { scoreDay, type DanhGia, type DayQuality } from "@lunar/ngay-tot";

import {
  COLUMNS,
  DEFAULT_SORT,
  buildRows,
  nextSort,
  sortLabel,
  sortRows,
  type DayRow,
  type SortKey,
} from "./ngay-tot-bang.ts";
import { ngayTrongThang } from "./ngay-tot.ts";

function stubRow(day: number, score: number, danhGia: DanhGia): DayRow {
  const quality: DayQuality = {
    viec: "cat-toc",
    date: { day, month: 10, year: 2026 },
    score,
    danhGia,
    contributions: [],
    rawScore: score,
    clamped: false,
  };
  return {
    quality,
    day,
    weekday: "T2",
    lunar: `${day}/8`,
    reason: null,
    isToday: false,
    isPast: false,
  };
}

test("clicking the active column flips it, clicking another resets to that column's default", () => {
  assert.deepEqual(nextSort({ key: "score", direction: "desc" }, "score"), {
    key: "score",
    direction: "asc",
  });
  assert.deepEqual(nextSort({ key: "score", direction: "asc" }, "date"), {
    key: "date",
    direction: "asc",
  });
  assert.deepEqual(nextSort({ key: "date", direction: "asc" }, "assessment"), {
    key: "assessment",
    direction: "desc",
  });
});

test("ties break by day in every order, so the list is stable across re-sorts", () => {
  const rows = [stubRow(12, 70, "Tốt"), stubRow(3, 70, "Tốt"), stubRow(20, 40, "Xấu")];
  const tiedKeys: SortKey[] = ["assessment", "score"];
  for (const key of tiedKeys) {
    for (const direction of ["asc", "desc"] as const) {
      const listed = sortRows(rows, { key, direction });
      const tied = listed.filter((row) => row.quality.danhGia === "Tốt");
      assert.deepEqual(
        tied.map((row) => row.day),
        [3, 12],
        `${key} ${direction} should keep tied days in calendar order`,
      );
    }
  }
});

test("date order equals lunar order within a month, so lunar is not a sort key", () => {
  const days = ngayTrongThang(2026, 10).map((date) => scoreDay(date, "cat-toc"));
  const rows = buildRows(days, { day: 1, month: 10, year: 2026 });
  const listed = sortRows(rows, { key: "date", direction: "asc" });
  const lunars = listed.map((row) => solarToLunar(row.quality.date));
  const months = new Set(
    lunars.map((lunar) => `${lunar.year}-${lunar.month}-${lunar.isLeapMonth}`),
  );
  assert.ok(months.size > 1, "October 2026 should span more than one lunar month");

  for (let i = 1; i < lunars.length; i++) {
    const prev = lunars[i - 1]!;
    const next = lunars[i]!;
    const cmp =
      prev.year - next.year ||
      prev.month - next.month ||
      Number(prev.isLeapMonth) - Number(next.isLeapMonth) ||
      prev.day - next.day;
    assert.ok(
      cmp <= 0,
      `lunar went backwards between solar ${listed[i - 1]!.day} and ${listed[i]!.day}`,
    );
  }
});

test("only date, assessment, and score are sort keys", () => {
  const keys = COLUMNS.flatMap((col) => ("sort" in col ? [col.key] : []));
  assert.deepEqual(keys, ["date", "assessment", "score"]);
  assert.equal(DEFAULT_SORT.key, "score");
  assert.equal(DEFAULT_SORT.direction, "desc");
  assert.equal(sortLabel(DEFAULT_SORT), "Điểm, giảm dần");
});

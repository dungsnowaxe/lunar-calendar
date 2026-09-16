import { test } from "node:test";
import assert from "node:assert/strict";

import {
  addDays,
  canChiDay,
  canChiMonth,
  canChiYear,
  compareSolar,
  formatSolar,
  jdnToSolar,
  leapMonthOf,
  lunarMonthLength,
  lunarToSolar,
  nextOccurrences,
  occurrenceInLunarYear,
  solarDayOfWeek,
  solarToJdn,
  solarToLunar,
  solarToday,
  type SolarDate,
} from "../src/index.ts";

const solar = (day: number, month: number, year: number): SolarDate => ({
  day,
  month,
  year,
});

// Tết Nguyên Đán = mùng 1 tháng Giêng, verified against published Vietnamese
// calendars (2015–2026).
const TET: Array<[number, SolarDate]> = [
  [2015, solar(19, 2, 2015)],
  [2016, solar(8, 2, 2016)],
  [2017, solar(28, 1, 2017)],
  [2018, solar(16, 2, 2018)],
  [2019, solar(5, 2, 2019)],
  [2020, solar(25, 1, 2020)],
  [2021, solar(12, 2, 2021)],
  [2022, solar(1, 2, 2022)],
  [2023, solar(22, 1, 2023)],
  [2024, solar(10, 2, 2024)],
  [2025, solar(29, 1, 2025)],
  [2026, solar(17, 2, 2026)],
];

test("Tết Nguyên Đán matches published Vietnamese dates 2015–2026", () => {
  for (const [lunarYear, expected] of TET) {
    assert.deepEqual(
      lunarToSolar({ day: 1, month: 1, year: lunarYear, isLeapMonth: false }),
      expected,
      `Tết ${lunarYear}`,
    );
    assert.deepEqual(
      solarToLunar(expected),
      {
        day: 1,
        month: 1,
        year: lunarYear,
        isLeapMonth: false,
      },
      `solar→lunar for Tết ${lunarYear}`,
    );
  }
});

test("Tết 1985 is 21/01 in the Vietnamese calendar (diverges from Chinese by a month)", () => {
  // Chinese calendar has Tết on 20/02/1985 because its leap month differs.
  assert.deepEqual(solarToLunar(solar(21, 1, 1985)), {
    day: 1,
    month: 1,
    year: 1985,
    isLeapMonth: false,
  });
});

test("leap months match published Vietnamese data", () => {
  assert.equal(leapMonthOf(2023), 2, "2023 has tháng 2 nhuận");
  assert.equal(leapMonthOf(2025), 6, "2025 has tháng 6 nhuận");
  assert.equal(leapMonthOf(2024), null, "2024 is regular");
  assert.equal(leapMonthOf(2026), null, "2026 is regular");
});

test("tháng 6 nhuận 2025 runs 25/07–22/08 and has 29 days", () => {
  const first = solar(25, 7, 2025);
  assert.deepEqual(solarToLunar(first), {
    day: 1,
    month: 6,
    year: 2025,
    isLeapMonth: true,
  });
  assert.deepEqual(lunarToSolar({ day: 1, month: 6, year: 2025, isLeapMonth: true }), first);
  assert.equal(lunarMonthLength(2025, 6, true), 29);
  assert.equal(lunarToSolar({ day: 30, month: 6, year: 2025, isLeapMonth: true }), null);
  assert.equal(lunarMonthLength(2025, 6, false) > 0, true, "regular month 6 exists");
});

test("round-trip solar→lunar→solar is the identity for 2020–2027", () => {
  let date = solar(1, 1, 2020);
  const end = solar(31, 12, 2027);
  let checked = 0;
  while (compareSolar(date, end) <= 0) {
    const lunar = solarToLunar(date);
    const back = lunarToSolar(lunar);
    assert.deepEqual(back, date, `round trip for ${formatSolar(date)}`);
    checked++;
    date = addDays(date, 1);
  }
  assert.equal(checked, 2922);
});

test("every valid lunar date 2024–2026 round-trips lunar→solar→lunar", () => {
  for (const year of [2024, 2025, 2026]) {
    for (const month of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      for (const isLeapMonth of [false, true]) {
        if (isLeapMonth && leapMonthOf(year) !== month) continue;
        const length = lunarMonthLength(year, month, isLeapMonth);
        assert.ok([29, 30].includes(length), `${length} days for ${month}/${year}`);
        for (let day = 1; day <= length; day++) {
          const solarDate = lunarToSolar({ day, month, year, isLeapMonth });
          assert.ok(solarDate, `${day}/${month}${isLeapMonth ? " nhuận" : ""}/${year}`);
          const back = solarToLunar(solarDate!);
          assert.deepEqual(back, { day, month, year, isLeapMonth });
        }
      }
    }
  }
});

test("invalid lunar dates return null", () => {
  assert.equal(lunarToSolar({ day: 0, month: 1, year: 2026, isLeapMonth: false }), null);
  assert.equal(lunarToSolar({ day: 31, month: 1, year: 2026, isLeapMonth: false }), null);
  assert.equal(lunarToSolar({ day: 15, month: 13, year: 2026, isLeapMonth: false }), null);
  assert.equal(
    lunarToSolar({ day: 1, month: 5, year: 2026, isLeapMonth: true }),
    null,
    "2026 has no leap month",
  );
});

test("lunar month lengths are 29 or 30 days", () => {
  for (const year of [2024, 2025, 2026]) {
    const leap = leapMonthOf(year);
    for (let month = 1; month <= 12; month++) {
      const lengths =
        leap === month
          ? [lunarMonthLength(year, month, false), lunarMonthLength(year, month, true)]
          : [lunarMonthLength(year, month, false)];
      for (const length of lengths) {
        assert.ok(length === 29 || length === 30, `${length} days for ${month}/${year}`);
      }
    }
  }
});

test("well-known 2026 dates", () => {
  // Rằm tháng Giêng 2026
  assert.deepEqual(
    lunarToSolar({ day: 15, month: 1, year: 2026, isLeapMonth: false }),
    solar(3, 3, 2026),
  );
  // Trung thu 2026
  assert.deepEqual(
    lunarToSolar({ day: 15, month: 8, year: 2026, isLeapMonth: false }),
    solar(25, 9, 2026),
  );
});

test("occurrences: mùng 1 Tết event lands on published Tết dates", () => {
  const rule = { lunarDay: 1, lunarMonth: 1 };
  assert.deepEqual(occurrenceInLunarYear(rule, 2026), solar(17, 2, 2026));
  assert.deepEqual(occurrenceInLunarYear(rule, 2025), solar(29, 1, 2025));
});

test("occurrences: rằm tháng Tám event lands on Trung thu", () => {
  const rule = { lunarDay: 15, lunarMonth: 8 };
  assert.deepEqual(occurrenceInLunarYear(rule, 2026), solar(25, 9, 2026));
});

test("occurrences: ngày 30 tháng Chạp falls back to the last day of short months", () => {
  const rule = { lunarDay: 30, lunarMonth: 12 };
  // Giáp Thìn has a 30-day tháng Chạp: 30 Tết = 28/01/2025.
  assert.deepEqual(occurrenceInLunarYear(rule, 2024), solar(28, 1, 2025));
  // From Ất Tỵ (2025) on, tháng Chạp has 29 days for years: giỗ rơi vào 29 Chạp = 16/02/2026.
  assert.deepEqual(occurrenceInLunarYear(rule, 2025), solar(16, 2, 2026));
});

test("occurrences: events always follow the regular month (tháng thường)", () => {
  const rule = { lunarDay: 1, lunarMonth: 6 };
  // 2025 has two tháng 6; the event must use the regular one, not 25/07/2025.
  const occurrence = occurrenceInLunarYear(rule, 2025);
  assert.deepEqual(occurrence, lunarToSolar({ day: 1, month: 6, year: 2025, isLeapMonth: false }));
  assert.notDeepEqual(occurrence, solar(25, 7, 2025));
  // In years without a leap month nothing changes.
  assert.deepEqual(
    occurrenceInLunarYear(rule, 2026),
    lunarToSolar({ day: 1, month: 6, year: 2026, isLeapMonth: false }),
  );
});

test("nextOccurrences lists ascending future dates including today", () => {
  const rule = { lunarDay: 15, lunarMonth: 8 };
  const from = solar(20, 9, 2026);
  const occurrences = nextOccurrences(rule, from, 3);
  assert.equal(occurrences.length, 3);
  assert.deepEqual(occurrences[0], solar(25, 9, 2026));
  for (let i = 1; i < occurrences.length; i++) {
    assert.ok(compareSolar(occurrences[i]!, occurrences[i - 1]!) > 0);
  }
  // Exactly today counts as upcoming.
  const today = solar(25, 9, 2026);
  assert.deepEqual(nextOccurrences(rule, today, 1)[0], today);
});

test("nextOccurrences spans the lunar new year boundary", () => {
  // An event late in lunar month 12 recurs in early solar year N+1.
  const rule = { lunarDay: 15, lunarMonth: 12 };
  const from = solar(1, 12, 2026);
  const [first] = nextOccurrences(rule, from, 1);
  assert.ok(first && first.year === 2027 && first.month === 1);
});

test("solarToday uses Asia/Ho_Chi_Minh regardless of machine timezone", () => {
  // 17:30 UTC on 16 Feb is already 17 Feb in Vietnam (00:30 +7).
  assert.deepEqual(solarToday(new Date("2026-02-16T17:30:00Z")), solar(17, 2, 2026));
  // 16:59 UTC on 16 Feb is still 16 Feb in Vietnam (23:59 +7).
  assert.deepEqual(solarToday(new Date("2026-02-16T16:59:00Z")), solar(16, 2, 2026));
});

test("can chi names match known years and days", () => {
  assert.equal(canChiYear(2026), "Bính Ngọ");
  assert.equal(canChiYear(2025), "Ất Tỵ");
  assert.equal(canChiYear(1985), "Ất Sửu");
  // 01/01/2000 was ngày Mậu Ngọ.
  assert.equal(canChiDay(solar(1, 1, 2000)), "Mậu Ngọ");
  // Tháng Giêng of a Bính year starts with Canh Dần.
  assert.equal(canChiMonth({ day: 1, month: 1, year: 2026, isLeapMonth: false }), "Canh Dần");
  assert.equal(canChiMonth({ day: 1, month: 6, year: 2025, isLeapMonth: true }), null);
});

test("weekday numbering matches published data (Tết 2026 is a Tuesday)", () => {
  assert.equal(solarDayOfWeek(solar(17, 2, 2026)), 2);
  assert.equal(solarDayOfWeek(solar(29, 1, 2025)), 3);
});

test("julian day helpers are consistent", () => {
  assert.equal(solarToJdn(solar(1, 1, 2000)), 2451545);
  assert.deepEqual(jdnToSolar(2451545), solar(1, 1, 2000));
});

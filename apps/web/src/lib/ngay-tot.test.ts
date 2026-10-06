import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { DANH_GIA, scoreDay } from "@lunar/ngay-tot";

import {
  DANH_GIA_LOAI,
  TIN_NGUONG_DAN_GIAN,
  deltaLabel,
  lyDoChinh,
  ngayTrongThang,
} from "./ngay-tot.ts";

const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

/**
 * Strip comments so the vocabulary scan below reads only what ships.
 *
 * The `_Avoid_` lists in `GLOSSARY.md` govern user-facing copy, not source
 * comments — a comment is allowed to explain that a variable holds a tier while
 * the UI is required to say "đánh giá". The `[^:]` guard keeps `https://` in a
 * citation URL from being mistaken for a line comment.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/([^:\n])\/\/.*$/gm, "$1");
}

test("ngayTrongThang returns every day of the month, and no others", () => {
  assert.equal(ngayTrongThang(2026, 10).length, 31);
  assert.equal(ngayTrongThang(2026, 4).length, 30);
  assert.equal(ngayTrongThang(2026, 2).length, 28);
  assert.equal(ngayTrongThang(2024, 2).length, 29, "a leap February");

  const days = ngayTrongThang(2026, 10);
  assert.deepEqual(days[0], { day: 1, month: 10, year: 2026 });
  assert.deepEqual(days[30], { day: 31, month: 10, year: 2026 });
  assert.ok(
    days.every((d) => d.month === 10 && d.year === 2026),
    "a day from a neighbouring month leaked in",
  );
});

test("the dominant reason is never the baseline", () => {
  // 5/10/2026 = 98: baseline 50, hoàng đạo +18, sao Tất +10, Thiên Đức +9,
  // Nguyệt Đức +9, giờ +2. The baseline is the largest number in the list, so a
  // helper that simply took the biggest delta would answer "Điểm cơ sở" — which
  // is no reason at all.
  const q = scoreDay({ day: 5, month: 10, year: 2026 }, "cat-toc");
  const reason = lyDoChinh(q);
  assert.ok(reason);
  assert.equal(reason.rule, "Ngày hoàng đạo");
  assert.notEqual(reason.rule, "Điểm cơ sở");
  assert.ok(Math.abs(reason.delta) > 0);

  // A day whose largest non-baseline move is negative reports that instead.
  const bad = scoreDay({ day: 1, month: 1, year: 2026 }, "cat-toc");
  const badReason = lyDoChinh(bad);
  assert.ok(badReason);
  assert.notEqual(badReason.rule, "Điểm cơ sở");
});

test("every đánh giá has a colour, so no badge can render unstyled", () => {
  assert.deepEqual(Object.keys(DANH_GIA_LOAI).sort(), [...DANH_GIA].sort());
  for (const classes of Object.values(DANH_GIA_LOAI)) {
    assert.ok(classes.length > 0);
    // Both modes, since the tier colours are semantic rather than tokens.
    assert.ok(classes.includes("dark:"), `"${classes}" has no dark-mode variant`);
  }
});

test("deltas read with an explicit sign", () => {
  assert.equal(deltaLabel(18), "+18");
  assert.equal(deltaLabel(2), "+2");
  assert.equal(deltaLabel(-16), "-16");
  // Zero rows are dropped by the kernel, but the formatter must not invent a sign.
  assert.equal(deltaLabel(0), "0");
});

test("the disclaimer is one line, names the tradition, and disclaims science", () => {
  assert.ok(!TIN_NGUONG_DAN_GIAN.includes("\n"), "the disclaimer must stay one line");
  assert.ok(TIN_NGUONG_DAN_GIAN.includes("tín ngưỡng dân gian"));
  assert.ok(TIN_NGUONG_DAN_GIAN.includes("sách") || TIN_NGUONG_DAN_GIAN.includes("cổ"));
  assert.ok(TIN_NGUONG_DAN_GIAN.includes("khoa học"));
  // Attribution, not an interstitial: no wording that implies a prompt or a gate.
  assert.ok(!/đồng ý|tiếp tục|đóng lại|nhấn vào/i.test(TIN_NGUONG_DAN_GIAN));
});

test("the disclaimer stays in the day-quality detail panel", () => {
  assert.ok(!src("../components/today-card.tsx").includes("TIN_NGUONG_DAN_GIAN"));
  assert.ok(src("../components/ngay-chat-luong.tsx").includes("TIN_NGUONG_DAN_GIAN"));
});

test("chủ sự data has no network path", () => {
  // Task 4.1: a birth year is personal data with no bearing on anyone else's
  // calendar, so it stays on the device.
  for (const file of ["../lib/chu-su.ts", "../hooks/use-chu-su.ts"]) {
    // Comments are allowed to explain *why* there is no network path; only the
    // code is scanned.
    const source = stripComments(src(file));
    assert.ok(!source.includes("~/server"), `${file} imports a server function`);
    assert.ok(!/supabase/i.test(source), `${file} mentions Supabase`);
    assert.ok(
      !/fetch\(|createServerFn|createQuery|useMutation/.test(source),
      `${file} performs a request`,
    );
  }

  // Persistence is confined to the hook; the store logic stays pure so it can be
  // tested without a DOM — which is the only reason it has a test at all.
  assert.ok(!stripComments(src("../lib/chu-su.ts")).includes("localStorage"));
  assert.ok(stripComments(src("../hooks/use-chu-su.ts")).includes("localStorage"));
  assert.ok(stripComments(src("../hooks/use-chu-su.ts")).includes("CHU_SU_KEY"));

  // And nothing server-side knows the concept exists.
  const serverDir = new URL("../server/", import.meta.url);
  for (const name of readdirSync(serverDir)) {
    if (!name.endsWith(".ts")) continue;
    const source = readFileSync(new URL(name, serverDir), "utf8");
    assert.ok(
      !/chu[-_ ]?s[uự]|chuSu|tu[oổ]i/i.test(source),
      `src/server/${name} mentions chủ sự or tuổi`,
    );
  }
});

test("the calendar cells carry no day-quality markers", () => {
  // Task 6.6: the decision was TodayCard + month page, and explicitly not the
  // calendar grid. `MonthCalendar` and the event markers stay out of it.
  const source = src("../components/month-calendar.tsx");
  assert.ok(!source.includes("@lunar/ngay-tot"), "MonthCalendar imports the belief package");
  assert.ok(!/scoreDay|danhGia|DayQuality|ngay-tot/.test(source), "MonthCalendar shows a marker");
  assert.ok(!src("../lib/calendar-grid.ts").includes("@lunar/ngay-tot"));
});

test("TodayCard keeps its four original lines", () => {
  // Task 5.3: the day-quality line is additive. These are the four lines that
  // were there before, pinned so a rewrite cannot quietly drop one.
  const source = src("../components/today-card.tsx");
  for (const fragment of [
    'uppercase">Hôm nay</p>',
    "{weekdayLong(solarDayOfWeek(today))}, {formatSolar(today)}",
    "Âm lịch: {lunar.day} tháng {lunar.month}",
    '{lunar.isLeapMonth ? " (nhuận)" : ""} năm {canChiYear(lunar.year)}',
    "Ngày {canChiDay(today)}",
    "{canChiMonth(lunar) && <>, tháng {canChiMonth(lunar)}</>}",
  ]) {
    assert.ok(source.includes(fragment), `TodayCard lost: ${fragment}`);
  }
  // The new line links to the month page and names its việc.
  assert.ok(source.includes('to="/ngay-tot-cat-toc"'));
  assert.ok(source.includes("Cắt tóc:"), "the verdict does not name its việc");
  // No bare score number on the card.
  assert.ok(!source.includes("{quality.score}"), "TodayCard shows a bare score");
});

test("user-facing copy uses only GLOSSARY.md vocabulary", () => {
  // Task 7.3: the _Avoid_ lists are part of the contract, not suggestions.
  const surfaces = [
    "../components/today-card.tsx",
    "../components/ngay-chat-luong.tsx",
    "../components/ngay-tot-thang.tsx",
    "../components/chu-su-picker.tsx",
    "../routes/ngay-tot-cat-toc.tsx",
    "../lib/ngay-tot.ts",
  ];
  const avoid = [
    "auspicious",
    "lucky",
    "tier",
    "user",
    "gia chủ",
    "giờ tốt",
    "sao tốt",
    "clash day",
    "ngày khắc tuổi",
    "superstition",
    "phong thuỷ",
    "phong thủy",
    "mức độ",
    "ngày đẹp",
    "con giáp",
    "lunar mansion",
    "day officer",
    "đám giỗ",
    "ghost month",
  ];
  for (const file of surfaces) {
    const copy = stripComments(src(file)).toLowerCase();
    for (const term of avoid) {
      assert.ok(!copy.includes(term.toLowerCase()), `${file} uses the avoided term "${term}"`);
    }
  }
  // And it does use the preferred terms, so the scan above is not passing
  // merely because the files say nothing. Vietnamese copy capitalises these at
  // the start of a sentence, so the check is case-insensitive.
  const all = surfaces
    .map((f) => stripComments(src(f)))
    .join("\n")
    .toLowerCase();
  for (const term of ["chủ sự", "tuổi", "việc", "điểm", "tín ngưỡng dân gian"]) {
    assert.ok(all.includes(term), `no surface uses the glossary term "${term}"`);
  }
  for (const danhGia of DANH_GIA) {
    assert.ok(all.includes(danhGia.toLowerCase()), `no surface renders "${danhGia}"`);
  }
});

test("the month page ranks every day and filters none", () => {
  // Task 4.3. A ngày xung may lower a day's score and push it down the list, but
  // it can never remove it. Ranking is a sort; a `filter` here would be a veto by
  // another name, and special-casing ngày xung would be one too.
  const source = stripComments(src("../components/ngay-tot-thang.tsx"));
  assert.ok(source.includes(".sort("), "the month is not ranked");
  assert.ok(!source.includes(".filter("), "the month page filters days out");
  assert.ok(!/xung/i.test(source), "the month page special-cases ngày xung");
  assert.ok(source.includes("scoreDay"), "the month page does not score its days");
});

test("belief output is never presented as a computed fact", () => {
  // Task 7.2. The detail panel keeps the two claims in separate sections: the
  // computed one carries no favourability language, and the belief one is always
  // qualified by its việc.
  const panel = src("../components/ngay-chat-luong.tsx");
  // From the computed-value table through to the divider, so both the data and
  // the markup that renders it are inside the scanned region.
  const computedSection = panel.slice(
    panel.indexOf("const computed:"),
    panel.indexOf("<Separator />"),
  );
  assert.ok(computedSection.length > 0, "the computed section disappeared");
  for (const term of ["hoàng đạo", "hắc đạo", "tốt", "xấu", "điểm", "đánh giá"]) {
    assert.ok(!computedSection.includes(term), `the computed section presents "${term}" as a fact`);
  }
  for (const term of ["Âm lịch", "Can–Chi", "Tiết khí", "Trực", "Nhị thập bát tú", "Trực nhật"]) {
    assert.ok(computedSection.includes(term), `the computed section dropped "${term}"`);
  }
  // The belief section is headed by the việc, never by a bare verdict.
  assert.ok(panel.includes("Điểm cho việc {viec}"));
});

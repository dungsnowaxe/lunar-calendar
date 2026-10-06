import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { addDays, canChiDay, trucNhatOf, type SolarDate, type TrucNhatName } from "@lunar/core";

import {
  CAN_CHI,
  HOANG_DAO,
  VIEC_LABEL,
  WEIGHT_TABLES,
  danhGiaOf,
  gioHoangDaoTrongKhung,
  isCanChi,
  isHoangDao,
  isNgayHoangDao,
  laXungTuoi,
  rulesTrongNgay,
  scoreDay,
  tuoiXungCuaNgay,
  type DayQuality,
} from "../src/index.ts";

interface Fixture {
  /** ISO solar date. */
  d: string;
  /** The canon's own Julian day number. */
  jd: number;
  /** Lunar day. */
  ld: number;
  /** Lunar month. */
  lm: number;
  /** True when the day falls in a leap month. */
  ln: boolean;
  /** The canon's day Can–Chi, in the canon's own spelling. */
  cc: string;
  tr: string;
  tu: string;
  tui: number;
  /** Trực nhật deity. */
  dn: string;
  /** The canon's hoàng đạo flag for the day. */
  hd: number;
  st: string[];
  sx: string[];
  /** The twelve giờ deities, ordered Tý..Hợi. */
  g: string[];
  /** The canon's per-giờ favourable flags, ordered Tý..Hợi, as "0"/"1". */
  gt: string;
  /** The canon's count of favourable giờ inside 07h–19h. */
  nwin: number;
  /** The canon's tuổi-xung list, in the canon's own spelling. */
  tx: string[];
  /** The canon's published cat-toc score. */
  diem: number;
}

const fixtures = JSON.parse(
  readFileSync(new URL("./fixtures/day-scores.json", import.meta.url), "utf8"),
) as Fixture[];

function solarOf(f: Fixture): SolarDate {
  const [year, month, day] = f.d.split("-").map(Number);
  return { day: day!, month: month!, year: year! };
}

/**
 * The canon spells the sixth Chi "Tị" where `@lunar/core` spells it "Tỵ". Both
 * are accepted Vietnamese; the library's spelling is pre-existing and already
 * user-facing, so canon-derived strings are normalised here at the boundary
 * rather than the library being changed. See ADR-0002.
 */
function coreSpelling(canon: string): string {
  return canon.replace(/Tị/g, "Tỵ");
}

/**
 * The score the canon would publish for a day: our own divergences excluded,
 * then clamped the same way. Used to prove the canonical layers are exact.
 */
function canonScore(q: DayQuality): number {
  const raw = q.contributions.filter((c) => !c.divergence).reduce((n, c) => n + c.delta, 0);
  return Math.max(0, Math.min(100, raw));
}

function everyDay(check: (f: Fixture, s: SolarDate) => string | null): void {
  for (const f of fixtures) {
    const problem = check(f, solarOf(f));
    assert.equal(problem, null, `${f.d}: ${problem}`);
  }
}

test("the fixture is the window it claims to be", () => {
  assert.equal(fixtures.length, 579);
  assert.equal(fixtures[0]!.d, "2025-06-01");
  assert.equal(fixtures[578]!.d, "2026-12-31");
  // Guards against the assertions below passing vacuously.
  assert.ok(
    fixtures.some((f) => f.ln),
    "no leap-month days in the window",
  );
  assert.ok(
    fixtures.some((f) => f.cc.includes("Tị")),
    "no canon 'Tị' spelling in the window",
  );
  assert.ok(
    fixtures.some((f) => f.ld === 1),
    "no mùng 1 in the window",
  );
  assert.ok(
    fixtures.some((f) => f.ld === 15),
    "no ngày rằm in the window",
  );
  assert.ok(
    fixtures.some((f) => f.diem === 100),
    "no day clamped at 100",
  );
  assert.ok(
    fixtures.some((f) => f.diem === 0),
    "no day clamped at 0",
  );
});

test("the hoàng đạo set reproduces the canon's day flags", () => {
  everyDay((f, s) => {
    if (trucNhatOf(s) !== f.dn) return `trực nhật "${trucNhatOf(s)}" !== "${f.dn}"`;
    return (isNgayHoangDao(s) ? 1 : 0) === f.hd
      ? null
      : `hoàng đạo ${isNgayHoangDao(s)} !== ${f.hd === 1}`;
  });
  assert.equal(HOANG_DAO.size, 6);
});

test("the hoàng đạo set reproduces all 6,948 of the canon's giờ flags", () => {
  let hours = 0;
  everyDay((f, _s) => {
    for (let i = 0; i < 12; i++) {
      const deity = f.g[i]!;
      const expected = f.gt[i] === "1";
      hours++;
      if (isHoangDao(deity as TrucNhatName) !== expected) {
        return `giờ ${i} ${deity} hoàng đạo ${!expected}, canon says ${expected}`;
      }
    }
    return null;
  });
  assert.equal(hours, 579 * 12);
});

test("sao detection reproduces the canon's sao lists", () => {
  everyDay((f, s) => {
    const predicted = rulesTrongNgay(s)
      .filter((h) => !h.divergence)
      .map((h) => h.rule)
      .sort();
    const observed = [...f.st, ...f.sx].sort();
    return predicted.join("|") === observed.join("|")
      ? null
      : `sao [${predicted}] !== [${observed}]`;
  });
});

test("the sao tables follow the closed forms recorded in rules.ts", () => {
  // The tables were extracted from the canon's output, and each turned out to be
  // a clean cycle. Asserting the cycles — not just the 579 days — catches a table
  // edit that breaks the pattern rather than deliberately correcting it, and it
  // pins lunar months the harvested window happens not to reach.
  const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const forms: readonly (readonly [string, (month: number) => number])[] = [
    ["Thiên Đức", (m) => mod(m + 4, 12)],
    ["Nguyệt Đức", (m) => mod(8 - 2 * m, 8)],
    ["Thiên Hỷ", (m) => mod(m + 9, 12)],
    ["Sát Chủ", (m) => mod(8 - 3 * m, 12)],
    ["Thọ Tử", (m) => mod(1 - 5 * m, 12)],
  ];

  for (const [sao, form] of forms) {
    const byMonth = new Map<number, Set<number>>();
    for (const f of fixtures) {
      if (![...f.st, ...f.sx].includes(sao)) continue;
      const chi = CHI.indexOf(coreSpelling(f.cc).split(" ")[1]!);
      const set = byMonth.get(f.lm) ?? new Set<number>();
      set.add(chi);
      byMonth.set(f.lm, set);
    }
    assert.equal(byMonth.size, 12, `${sao} observed in ${byMonth.size} lunar months`);
    for (const [month, chis] of byMonth) {
      assert.deepEqual(
        [...chis].sort((a, b) => a - b),
        [form(month)],
        `${sao}, lunar month ${month}`,
      );
    }
  }

  // Dương Công Kỵ Nhật steps back two lunar days each month, wrapping at 30.
  const dck = new Map<number, Set<number>>();
  for (const f of fixtures) {
    if (![...f.st, ...f.sx].includes("Dương Công Kỵ Nhật")) continue;
    const set = dck.get(f.lm) ?? new Set<number>();
    set.add(f.ld);
    dck.set(f.lm, set);
  }
  assert.equal(dck.size, 12);
  for (const [month, days] of dck) {
    assert.deepEqual(
      [...days],
      [mod(15 - 2 * month - 1, 30) + 1],
      `Dương Công Kỵ Nhật, lunar month ${month}`,
    );
  }
});

test("the giờ window count matches the canon on every day", () => {
  everyDay((f, s) => {
    const n = gioHoangDaoTrongKhung(s).length;
    return n === f.nwin ? null : `${n} giờ hoàng đạo in window, canon says ${f.nwin}`;
  });
  assert.deepEqual(
    [...new Set(fixtures.map((f) => f.nwin))].sort(),
    [2, 3, 4],
    "the canon's own window counts should only ever be 2, 3 or 4",
  );
});

test("the giờ window count can only ever be 2, 3 or 4", () => {
  // `n` depends solely on the day's Chi, and there are twelve Chi, so twelve
  // consecutive dates decide this for every date the library supports — no need
  // to walk the 400-year range. This is why the giờ layer can never reach the
  // −4 or +8 that the canon's methodology page quotes for an unreachable domain.
  const start: SolarDate = { day: 1, month: 6, year: 2025 };
  const counts = new Set<number>();
  for (let i = 0; i < 12; i++) {
    counts.add(gioHoangDaoTrongKhung(addDays(start, i)).length);
  }
  assert.deepEqual([...counts].sort(), [2, 3, 4]);
});

test("the tuổi-xung rule reproduces the canon's list for all sixty day Can–Chi", () => {
  const seen = new Set<string>();
  everyDay((f, s) => {
    seen.add(coreSpelling(f.cc));
    const predicted = tuoiXungCuaNgay(s).slice().sort();
    const observed = f.tx.map(coreSpelling).sort();
    return predicted.join("|") === observed.join("|")
      ? null
      : `tuổi xung [${predicted}] !== [${observed}]`;
  });
  assert.equal(seen.size, 60, "the window should exercise all sixty day Can–Chi");
  // Every day names exactly two xung tuổi, never the five that share its
  // opposing Chi — which is why tuổi must be a Can–Chi and not an animal.
  assert.deepEqual([...new Set(fixtures.map((f) => f.tx.length))], [2]);
});

test("the canonical layers reproduce the canon's published score on all 579 days", () => {
  everyDay((f, s) => {
    const got = canonScore(scoreDay(s, "cat-toc"));
    return got === f.diem ? null : `scored ${got}, canon published ${f.diem}`;
  });
});

test("5/10/2026 — design.md's worked example — scores 98", () => {
  const q = scoreDay({ day: 5, month: 10, year: 2026 }, "cat-toc");
  assert.equal(q.score, 98);
  assert.equal(q.rawScore, 98);
  assert.equal(q.clamped, false);
  assert.equal(q.danhGia, "Rất tốt");
  // 50 baseline +18 hoàng đạo (Tư Mệnh) +10 sao Tất +2 giờ +9 Thiên Đức +9 Nguyệt Đức.
  assert.deepEqual(
    q.contributions.map((c) => [c.rule, c.delta]),
    [
      ["Điểm cơ sở", 50],
      ["Ngày hoàng đạo", 18],
      ["Sao Tất", 10],
      ["Thiên Đức", 9],
      ["Nguyệt Đức", 9],
      ["Giờ hoàng đạo", 2],
    ],
  );
  // Trực Bình is neutral, so it appears nowhere — a reader is never shown a "+0".
  assert.equal(q.contributions.filter((c) => c.rule === "Trực Bình").length, 0);
});

test("the breakdown always sums to the unclamped score", () => {
  everyDay((_f, s) => {
    const q = scoreDay(s, "cat-toc");
    const sum = q.contributions.reduce((n, c) => n + c.delta, 0);
    if (sum !== q.rawScore) return `contributions sum to ${sum}, rawScore is ${q.rawScore}`;
    if (q.contributions.some((c) => c.delta === 0)) return "a zero-delta row was shown";
    if (!q.contributions.some((c) => c.rule === "Điểm cơ sở")) return "no baseline row";
    if (q.danhGia !== danhGiaOf(q.score)) return "tier is not a function of the score";
    return null;
  });
});

test("scores are clamped to [0, 100] with every contribution still shown", () => {
  everyDay((_f, s) => {
    const q = scoreDay(s, "cat-toc");
    if (q.score < 0 || q.score > 100) return `score ${q.score} escaped the clamp`;
    if (q.clamped !== (q.rawScore !== q.score)) return "clamped flag disagrees with the sums";
    if (q.clamped && q.contributions.length === 0) return "a clamped day lost its breakdown";
    return null;
  });
  // The clamp must actually engage somewhere in the window, or the assertions
  // above prove nothing about clamping at all.
  const scored = fixtures.map((f) => scoreDay(solarOf(f), "cat-toc"));
  assert.ok(
    scored.some((q) => q.clamped),
    "no day in the window is clamped",
  );
  assert.ok(
    scored.some((q) => q.rawScore > 100),
    "no day exceeds 100 before clamping",
  );
  assert.ok(
    scored.some((q) => q.rawScore < 0),
    "no day falls below 0 before clamping",
  );
});

test("mùng 1 and ngày rằm are scored, flagged as divergences, and cited as such", () => {
  const weights = WEIGHT_TABLES["cat-toc"];
  let mung1 = 0;
  let ram = 0;
  everyDay((f, s) => {
    const q = scoreDay(s, "cat-toc");
    const divergent = q.contributions.filter((c) => c.divergence);
    for (const c of divergent) {
      if (c.citation.url !== null) return `divergence "${c.rule}" cites a canonical URL`;
      if (!c.citation.source.toLowerCase().includes("khác biệt")) {
        return `divergence "${c.rule}" is not labelled as one in its citation`;
      }
    }
    if (f.ld === 1) {
      mung1++;
      const hit = divergent.find((c) => c.rule === "Mùng 1");
      if (!hit) return "mùng 1 produced no divergence row";
      if (hit.delta !== weights.rule["Mùng 1"]) return `mùng 1 delta ${hit.delta}`;
    }
    if (f.ld === 15) {
      ram++;
      if (!divergent.some((c) => c.rule === "Ngày rằm")) return "ngày rằm produced no row";
    }
    if (f.ld !== 1 && f.ld !== 15 && divergent.length > 0) {
      return `unexpected divergence rows on lunar day ${f.ld}`;
    }
    return null;
  });
  assert.equal(mung1, 19);
  assert.equal(ram, 20);
  assert.equal(weights.rule["Mùng 1"], -13);
  assert.equal(weights.rule["Ngày rằm"], -13);
});

test("xung tuổi lowers the score without ever removing the day", () => {
  const weights = WEIGHT_TABLES["cat-toc"];
  assert.equal(weights.rule["Xung tuổi"], -9);

  // A day that scores well, judged for a tuổi that clashes with it.
  const date: SolarDate = { day: 5, month: 10, year: 2026 };
  const xung = tuoiXungCuaNgay(date);
  assert.equal(xung.length, 2);
  // A tuổi that does not clash — and note both of the day's clashing tuổi are
  // excluded, not just the first, which is the whole reason tuổi is a Can–Chi.
  const khongXung = CAN_CHI.find((c) => !xung.includes(c))!;
  const without = scoreDay(date, "cat-toc");
  const withXung = scoreDay(date, "cat-toc", { ten: "Ví dụ", tuoi: xung[0]! });
  const withOtherXung = scoreDay(date, "cat-toc", { ten: "Ví dụ", tuoi: xung[1]! });
  const withKhongXung = scoreDay(date, "cat-toc", { ten: "Ví dụ", tuoi: khongXung });

  assert.equal(without.score, 98);
  // Either clashing tuổi costs the same nine points; a third Ngọ year costs nothing.
  assert.equal(withXung.score, 89);
  assert.equal(withOtherXung.score, 89);
  assert.equal(withKhongXung.score, 98);
  assert.ok(laXungTuoi(date, xung[0]!));
  assert.ok(laXungTuoi(date, xung[1]!));
  assert.ok(!laXungTuoi(date, khongXung));

  const row = withXung.contributions.find((c) => c.rule === "Xung tuổi");
  assert.ok(row, "no xung tuổi row");
  assert.equal(row.delta, -9);
  assert.equal(row.divergence, true);
  // Lowered, not vetoed: still a full breakdown, still a score, still tiered.
  assert.ok(withXung.contributions.length >= without.contributions.length);
  assert.equal(withXung.danhGia, "Rất tốt");
  assert.equal(withXung.clamped, false);
});

test("a ngày xung never disqualifies a day, however badly it clashes", () => {
  // The spec forbids a veto. Even the worst day in the window, judged for a
  // clashing tuổi, must still come back with a score and a breakdown.
  let checked = 0;
  for (const f of fixtures) {
    const s = solarOf(f);
    const [xung] = tuoiXungCuaNgay(s);
    const q = scoreDay(s, "cat-toc", { ten: "Ví dụ", tuoi: xung! });
    assert.ok(q.score >= 0 && q.score <= 100);
    assert.ok(q.contributions.length > 0);
    assert.ok(q.danhGia.length > 0);
    checked++;
  }
  assert.equal(checked, 579);
});

test("the weight tables are exhaustive over every Trực and every tú", () => {
  const weights = WEIGHT_TABLES["cat-toc"];
  assert.equal(Object.keys(weights.truc).length, 12);
  assert.equal(Object.keys(weights.tu).length, 28);
  for (const v of Object.values(weights.truc)) assert.equal(typeof v, "number");
  for (const v of Object.values(weights.tu)) assert.equal(typeof v, "number");

  // The three tú tiers, and the canon's published kỵ set is exactly the −12 tier.
  const tiers = (w: number) =>
    Object.entries(weights.tu)
      .filter(([, d]) => d === w)
      .map(([k]) => k)
      .sort();
  assert.equal(tiers(10).length, 14);
  assert.equal(tiers(-4).length, 8);
  assert.deepEqual(tiers(-12), ["Cang", "Chủy", "Hư", "Liễu", "Nguy", "Quỷ"].sort());
  // Tỉnh is the entry most easily mis-filed into the −4 tier; it is +10.
  assert.equal(weights.tu["Tỉnh"], 10);
  // No tú is neutral for cắt tóc, so every day shows a tú line.
  assert.equal(tiers(0).length, 0);
});

test("tiers are calibrated to the measured distribution, and good days stay rare", () => {
  const scores = fixtures.map((f) => f.diem);
  const n = scores.length;
  const share = (lo: number, hi: number) => scores.filter((s) => s >= lo && s <= hi).length / n;

  assert.equal(danhGiaOf(100), "Rất tốt");
  assert.equal(danhGiaOf(80), "Rất tốt");
  assert.equal(danhGiaOf(79), "Tốt");
  assert.equal(danhGiaOf(60), "Tốt");
  assert.equal(danhGiaOf(59), "Trung bình");
  assert.equal(danhGiaOf(40), "Trung bình");
  assert.equal(danhGiaOf(39), "Xấu");
  assert.equal(danhGiaOf(20), "Xấu");
  assert.equal(danhGiaOf(19), "Rất xấu");
  assert.equal(danhGiaOf(0), "Rất xấu");

  // Measured over the harvest, not assumed. The top tier must be a minority.
  assert.ok(share(80, 100) < 0.5, "Rất tốt is not a minority");
  assert.ok(Math.abs(share(80, 100) - 0.161) < 0.01, `Rất tốt share ${share(80, 100)}`);
  assert.ok(Math.abs(share(60, 79) - 0.204) < 0.01);
  assert.ok(Math.abs(share(40, 59) - 0.301) < 0.01);
  assert.ok(Math.abs(share(20, 39) - 0.218) < 0.01);
  assert.ok(Math.abs(share(0, 19) - 0.117) < 0.01);
});

test("the selector's granularity matters: two of the five Ngọ tuổi clash, not all five", () => {
  // Task 4.2. Ngày 5/10/2026 is Nhâm Tý, whose opposing Chi is Ngọ. A
  // twelve-animal picker would flag every Ngọ tuổi and be wrong three times out
  // of five; the canon names only Bính Ngọ and Mậu Ngọ. This is the concrete
  // reason the selector offers sixty Can–Chi.
  const date: SolarDate = { day: 5, month: 10, year: 2026 };
  assert.equal(canChiDay(date), "Nhâm Tý");
  assert.deepEqual(tuoiXungCuaNgay(date).slice().sort(), ["Bính Ngọ", "Mậu Ngọ"]);

  const score = (tuoi: string) => scoreDay(date, "cat-toc", { ten: "Ví dụ", tuoi }).score;
  assert.equal(score("Bính Ngọ"), 89, "a clashing tuổi costs nine points");
  assert.equal(score("Mậu Ngọ"), 89, "and so does the other");
  assert.equal(score("Giáp Ngọ"), 98, "a non-clashing Ngọ tuổi costs nothing");
  assert.equal(score("Canh Ngọ"), 98);
  assert.equal(score("Nhâm Ngọ"), 98);
  assert.equal(scoreDay(date, "cat-toc").score, 98, "and no chủ sự at all costs nothing");
});

test("a month's ranking matches the canon's ordering for the same month", () => {
  // Task 6.2. The month page is a ranking, so agreement per day is not quite
  // enough to check on its own: the order the page shows must be the order the
  // canon would show. Ties break by date on both sides.
  const byMonth = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const key = f.d.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), f]);
  }
  const rank = (rows: { d: string; s: number }[]) =>
    rows.sort((a, b) => b.s - a.s || a.d.localeCompare(b.d)).map((r) => r.d);

  let months = 0;
  for (const [key, month] of byMonth) {
    assert.ok(month.length >= 28, `${key} is not a whole month`);
    months++;
    assert.deepEqual(
      rank(month.map((f) => ({ d: f.d, s: canonScore(scoreDay(solarOf(f), "cat-toc")) }))),
      rank(month.map((f) => ({ d: f.d, s: f.diem }))),
      `ranking differs for ${key}`,
    );
  }
  assert.equal(months, 19, "2025-06 through 2026-12");
});

test("the sixty tuổi are all selectable and validated", () => {
  assert.equal(CAN_CHI.length, 60);
  assert.equal(new Set(CAN_CHI).size, 60);
  assert.equal(CAN_CHI[0], "Giáp Tý");
  assert.equal(CAN_CHI[59], "Quý Hợi");
  // Core spells the sixth Chi "Tỵ", so five of the sixty carry that branch —
  // and they sit twelve apart in the cycle, which is the sixty-year rhythm.
  assert.deepEqual(
    CAN_CHI.map((c, i) => [i, c] as const).filter(([, c]) => c.endsWith("Tỵ")),
    [
      [5, "Kỷ Tỵ"],
      [17, "Tân Tỵ"],
      [29, "Quý Tỵ"],
      [41, "Ất Tỵ"],
      [53, "Đinh Tỵ"],
    ],
  );
  // Impossible pairings — odd Can against even Chi — are not among the sixty.
  assert.ok(!isCanChi("Giáp Sửu"));
  assert.ok(!isCanChi("Ất Tý"));
  assert.ok(!isCanChi(""));
  assert.ok(isCanChi("Ất Tỵ"));
  assert.ok(isCanChi("Giáp Tý"));
});

test("the kernel never branches on a việc name", () => {
  // Adding a việc must be a data change. The guard is that the kernel's source
  // mentions no việc slug at all: it reads `WEIGHT_TABLES[viec]` and
  // `VIEC_LABEL[viec]`, so there is nothing to branch on.
  const kernel = readFileSync(new URL("../src/score.ts", import.meta.url), "utf8");
  for (const slug of Object.keys(VIEC_LABEL)) {
    assert.ok(!kernel.includes(slug), `score.ts mentions "${slug}"`);
  }
  assert.ok(!kernel.includes("cắt tóc"), "score.ts hardcodes an activity label");
  // The slugs live only in the registry and the label table.
  for (const file of ["rules.ts", "hoang-dao.ts", "chu-su.ts"]) {
    const src = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
    assert.ok(!src.includes("cat-toc"), `${file} mentions a việc slug`);
  }
});

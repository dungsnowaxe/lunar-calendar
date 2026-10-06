import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  MAX_SOLAR_YEAR,
  MIN_SOLAR_YEAR,
  TRUC_NHAT,
  TU,
  addDays,
  canChiDay,
  canChiMonth,
  gioOf,
  solarToJdn,
  solarToLunar,
  tietKhiMonthChi,
  tietKhiOf,
  trucNhatOf,
  trucOf,
  tuOf,
  weekdayHanh,
  type SolarDate,
} from "../src/index.ts";

/**
 * Golden fixtures harvested from the reference canon's published day API
 * (xemlichngaytotxau.com/api/ngay/<d>-<m>-<yyyy>), 579 consecutive days
 * spanning 2025-06-01..2026-12-31.
 *
 * Astronomical fields only. Per ADR-0002 the belief layer (per-việc scores)
 * is fixture-tested in `packages/ngay-tot`, not here.
 */
interface Fixture {
  /** ISO solar date. */
  d: string;
  /** Julian day number. */
  jd: number;
  /** Can–Chi of the day. */
  cc: string;
  /** Can–Chi of the lunar month. */
  cm: string;
  /** Lunar [day, month, year, isLeapMonth]. */
  am: [number, number, number, number];
  /** Tiết khí in effect. */
  tk: string;
  /** Thập nhị trực. */
  tr: string;
  /** Nhị thập bát tú index (0-based). */
  tu: number;
  /** Tú name. */
  tn: string;
  /** Tú luminary. */
  th: string;
  /** Trực nhật (day-deity) name. */
  dn: string;
  /** The twelve giờ deity names, ordered Tý..Hợi. */
  g: string[];
  /** The twelve giờ start hours, ordered Tý..Hợi. */
  gb: number[];
  /** The twelve giờ Chi, ordered Tý..Hợi. */
  gc: string[];
}

const fixtures: Fixture[] = JSON.parse(
  readFileSync(new URL("./fixtures/almanac-days.json", import.meta.url), "utf8"),
);

function parseIso(iso: string): SolarDate {
  const [year, month, day] = iso.split("-").map(Number);
  return { day: day!, month: month!, year: year! };
}

/** Assert a per-day property across every fixture, naming the first failure. */
function everyDay(describe: (f: Fixture, s: SolarDate) => string | null): void {
  for (const f of fixtures) {
    const failure = describe(f, parseIso(f.d));
    if (failure) assert.fail(`${f.d}: ${failure}`);
  }
}

/**
 * The library spells the sixth Chi "Tỵ"; the reference canon spells it "Tị".
 * Both are accepted Vietnamese orthographies for the same branch. The library's
 * spelling is pre-existing and already user-facing in `TodayCard`, so this
 * change does not touch it — canon comparisons normalise the one variant.
 *
 * If `packages/ngay-tot` ever compares tuổi strings taken from canon data it
 * must normalise the same way.
 */
function canonChi(s: string | null): string | null {
  return s === null ? null : s.replaceAll("Tị", "Tỵ");
}

test("fixture set spans more than a year of consecutive days", () => {
  assert.equal(fixtures.length, 579);
  assert.equal(fixtures[0]!.d, "2025-06-01");
  assert.equal(fixtures.at(-1)?.d, "2026-12-31");
  // Consecutive: each Julian day number is exactly one greater than the last.
  for (let i = 1; i < fixtures.length; i++) {
    assert.equal(fixtures[i]!.jd, fixtures[i - 1]!.jd + 1, `gap before ${fixtures[i]!.d}`);
  }
});

test("solarToJdn matches the canon's published Julian day numbers", () => {
  // This is what makes harvested fixtures comparable with no offset correction.
  everyDay((f, s) => {
    const got = solarToJdn(s);
    return got === f.jd ? null : `jd ${got} !== ${f.jd}`;
  });
});

test("canChiDay matches on every fixture day", () => {
  everyDay((f, s) => {
    const got = canonChi(canChiDay(s));
    return got === canonChi(f.cc) ? null : `can chi ngày "${got}" !== "${f.cc}"`;
  });
});

test("canChiMonth matches on every non-leap fixture day", () => {
  // `canChiMonth` deliberately returns null for leap months: in the Vietnamese
  // tradition a tháng nhuận has no Can–Chi of its own. The canon publishes one
  // anyway. That is a pre-existing, documented design decision in this repo and
  // is not changed here, so leap-month days are excluded — but the exclusion is
  // asserted to be exercised rather than silently vacuous.
  let skipped = 0;
  everyDay((f, s) => {
    const lunar = solarToLunar(s);
    if (lunar.isLeapMonth) {
      skipped++;
      assert.equal(canChiMonth(lunar), null);
      return null;
    }
    const got = canonChi(canChiMonth(lunar));
    return got === canonChi(f.cm) ? null : `can chi tháng "${got}" !== "${f.cm}"`;
  });
  assert.ok(skipped > 0, "fixture window contains no leap-month days");
});

test("solarToLunar matches on every fixture day", () => {
  // Independent confirmation that exporting SunLongitude changed no behaviour.
  everyDay((f, s) => {
    const got = solarToLunar(s);
    const [day, month, year, leap] = f.am;
    return got.day === day &&
      got.month === month &&
      got.year === year &&
      (got.isLeapMonth ? 1 : 0) === leap
      ? null
      : `lunar ${got.day}/${got.month}/${got.year}${got.isLeapMonth ? " nhuận" : ""} !== ${day}/${month}/${year}${leap ? " nhuận" : ""}`;
  });
});

test("tiết khí matches on every fixture day", () => {
  const seen = new Set<string>();
  everyDay((f, s) => {
    const got = tietKhiOf(s);
    seen.add(got);
    return got === f.tk ? null : `tiết khí "${got}" !== "${f.tk}"`;
  });
  // The fixture window exercises the full 24-term cycle, not a subset of it.
  assert.equal(seen.size, 24);
});

test("trực matches on every fixture day", () => {
  everyDay((f, s) => {
    const got = trucOf(s);
    return got === f.tr ? null : `trực "${got}" !== "${f.tr}"`;
  });
});

test("nhị thập bát tú index, name and luminary match on every fixture day", () => {
  everyDay((f, s) => {
    const got = tuOf(s);
    if (got.index !== f.tu) return `tú index ${got.index} !== ${f.tu}`;
    if (got.name !== f.tn) return `tú "${got.name}" !== "${f.tn}"`;
    if (got.hanh !== f.th) return `tú hành "${got.hanh}" !== "${f.th}"`;
    return null;
  });
  assert.equal(TU.length, 28);
});

test("the 28-day tú rotation is pinned by two independent published anchors", () => {
  // Both anchors come from published almanacs, 29 years apart. Agreeing on both
  // fixes the +11 offset uniquely — a wrong offset cannot satisfy both, since
  // 28 and the gap between the dates share no convenient common factor.
  //
  // `index` is 0-based to match the reference canon's own API field (`idx: 18`
  // for Tất); the task notes quote the 1-based form (#19 Tất, #14 Bích).
  assert.deepEqual(tuOf({ day: 5, month: 10, year: 2026 }), {
    index: 18,
    name: "Tất",
    hanh: "Nguyệt",
  });
  assert.equal(solarToJdn({ day: 1, month: 1, year: 1997 }), 2450450);
  assert.deepEqual(tuOf({ day: 1, month: 1, year: 1997 }), {
    index: 13,
    name: "Bích",
    hanh: "Thủy",
  });
});

test("trực nhật matches on every fixture day", () => {
  // The deity name only. Which six deities count as hoàng đạo is belief data and
  // is asserted in `packages/ngay-tot`, which owns that set (ADR-0002) — so the
  // fixture's `hd` flag is deliberately not consulted here.
  everyDay((f, s) => {
    const got = trucNhatOf(s);
    return got === f.dn ? null : `trực nhật "${got}" !== "${f.dn}"`;
  });
  assert.equal(TRUC_NHAT.length, 12);
  // Every deity in the cycle is reached somewhere in the window, so a truncated
  // or reordered TRUC_NHAT cannot pass by accident.
  const seen = new Set(fixtures.map((f) => f.dn));
  assert.equal(seen.size, 12, `only ${seen.size} distinct trực nhật seen`);
});

test("trực nhật and thập nhị trực are anchored on DIFFERENT month bases", () => {
  // The most surprising fact in this module, and the one a future reader is most
  // likely to try to "fix". Both layers must hold simultaneously: where the
  // lunar and tiết-khí months disagree, trực nhật follows the LUNAR month while
  // the Trực follows the TIẾT KHÍ month. Unifying them on either basis breaks
  // roughly a third of all days.
  let divergent = 0;
  everyDay((f, s) => {
    const lunar = solarToLunar(s);
    const lunarChi = (lunar.month + 1) % 12;
    if (!lunar.isLeapMonth && lunarChi !== tietKhiMonthChi(s)) divergent++;
    const dn = trucNhatOf(s);
    if (dn !== f.dn) return `trực nhật "${dn}" !== "${f.dn}" (lunar-month anchor)`;
    const tr = trucOf(s);
    return tr === f.tr ? null : `trực "${tr}" !== "${f.tr}" (tiết-khí anchor)`;
  });
  // If the window contained no divergence this test would pass even with both
  // layers wrongly unified, so assert the case is genuinely exercised.
  assert.ok(divergent > 100, `only ${divergent} days where the two month bases differ`);
});

test("all twelve giờ match on every fixture day", () => {
  everyDay((f, s) => {
    const got = gioOf(s);
    for (const [i, chi] of f.gc.entries()) {
      const g = got[i]!;
      if (g.chi !== chi) return `giờ ${i} chi "${g.chi}" !== "${chi}"`;
      if (g.startHour !== f.gb[i]) {
        return `giờ ${chi} starts ${g.startHour}h !== ${f.gb[i]}h`;
      }
      if (g.than !== f.g[i]) return `giờ ${chi} deity "${g.than}" !== "${f.g[i]}"`;
    }
    return null;
  });
});

test("giờ Tý starts at 23h and the twelve giờ rotate through the full deity cycle", () => {
  // Belief-free structural check: the twelve giờ must be a permutation of the
  // twelve deities, which catches a broken anchor progression. Counting how many
  // of them are hoàng đạo belongs to `packages/ngay-tot`.
  everyDay((_f, s) => {
    const g = gioOf(s);
    const gioTy = g[0]!;
    if (gioTy.chi !== "Tý" || gioTy.startHour !== 23) return "giờ Tý does not start at 23h";
    if (g.length !== 12) return `${g.length} giờ, expected 12`;
    const distinct = new Set(g.map((x) => x.than));
    return distinct.size === 12 ? null : `${distinct.size} distinct deities over 12 giờ`;
  });
});

test("tú luminary matches the weekday luminary across the whole supported range", () => {
  // Guards the 28-day rotation offset and the mansion ordering: because 28 is a
  // multiple of 7, a tú always lands on the same weekday, so its luminary must
  // equal that weekday's planet. This holds by construction from the +11 offset,
  // so it catches a reordered TU/TU_HANH array rather than proving astronomy —
  // the fixture tests above are the independent evidence.
  let s: SolarDate = { day: 1, month: 1, year: MIN_SOLAR_YEAR };
  const end = solarToJdn({ day: 31, month: 12, year: MAX_SOLAR_YEAR });
  let checked = 0;
  while (solarToJdn(s) <= end) {
    const tu = tuOf(s);
    assert.equal(
      tu.hanh,
      weekdayHanh(s),
      `${s.year}-${s.month}-${s.day}: tú ${tu.name} hành ${tu.hanh} but weekday hành ${weekdayHanh(s)}`,
    );
    s = addDays(s, 1);
    checked++;
  }
  assert.ok(checked > 73000, `only walked ${checked} days`);
});

test("tiết-khí month and lunar month disagree on some days, and the Trực still matches", () => {
  // The whole reason for ADR-0001. If this ever reports zero divergences the
  // fixture window has stopped exercising the case the ADR exists for.
  let divergent = 0;
  let firstDivergence: string | null = null;
  everyDay((f, s) => {
    const lunar = solarToLunar(s);
    const lunarMonthChi = (lunar.month + 1) % 12;
    const tietKhiChi = tietKhiMonthChi(s);
    if (lunar.isLeapMonth) return null;
    if (lunarMonthChi !== tietKhiChi) {
      divergent++;
      if (!firstDivergence) firstDivergence = f.d;
    }
    // The Trực is still correct on those days because it uses the tiết-khí
    // month; assert that here so a regression to the lunar month fails loudly.
    return trucOf(s) === f.tr ? null : `trực "${trucOf(s)}" !== "${f.tr}"`;
  });
  assert.ok(divergent > 0, "no divergence between tiết-khí and lunar months in the fixture window");
});

test("5/10/2026 reproduces the canon's published day in full", () => {
  // The worked example used throughout design.md.
  const s: SolarDate = { day: 5, month: 10, year: 2026 };
  assert.equal(solarToJdn(s), 2461319);
  assert.equal(canChiDay(s), "Nhâm Tý");
  assert.equal(tietKhiOf(s), "Thu Phân");
  assert.equal(tietKhiMonthChi(s), 9); // Dậu
  assert.equal(trucOf(s), "Bình");
  assert.deepEqual(tuOf(s), { index: 18, name: "Tất", hanh: "Nguyệt" });
  assert.equal(trucNhatOf(s), "Tư Mệnh");

  // All twelve giờ exactly as the canon publishes them. Which of these count as
  // hoàng đạo — and therefore that the favourable set is Tý, Sửu, Mão, Ngọ,
  // Thân, Dậu, with three of them inside the 07h–19h window — is asserted in
  // `packages/ngay-tot`, which owns that classification.
  assert.deepEqual(
    gioOf(s).map((g) => `${g.chi} ${g.startHour}h ${g.than}`),
    [
      "Tý 23h Kim Quỹ",
      "Sửu 1h Bảo Quang",
      "Dần 3h Bạch Hổ",
      "Mão 5h Ngọc Đường",
      "Thìn 7h Thiên Lao",
      "Tị 9h Nguyên Vũ",
      "Ngọ 11h Tư Mệnh",
      "Mùi 13h Câu Trần",
      "Thân 15h Thanh Long",
      "Dậu 17h Minh Đường",
      "Tuất 19h Thiên Hình",
      "Hợi 21h Chu Tước",
    ],
  );
});

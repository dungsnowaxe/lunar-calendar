import { canChiDay, solarToLunar, type SolarDate } from "@lunar/core";
import type { Divergence, Sao } from "./types.ts";

/** A sao or divergence rule that applies to a given day. */
export type RuleName = Sao | Divergence;

export interface RuleHit {
  readonly rule: RuleName;
  /** Why it applies to *this* day, phrased the way the canon phrases it. */
  readonly explanation: string;
  /** True for the two lunar-day rules we score and the canon does not. */
  readonly divergence: boolean;
}

/*
 * The tables below are belief data, not astronomy (ADR-0002): nothing about
 * which Chi carries Thiên Đức in a given month is computable from the sky.
 *
 * They are stored as explicit twelve-entry tables rather than as the closed
 * forms they happen to follow, so that an erratum from the reference canon is a
 * one-word table edit rather than a formula change. The closed forms are
 * recorded here as a cross-check, and each is asserted in the tests:
 *
 *   Thiên Đức   chiIdx = (month + 4) mod 12
 *   Nguyệt Đức  chiIdx = (8 − 2·month) mod 8      (period 4, not 12)
 *   Thiên Hỷ    chiIdx = (month + 9) mod 12
 *   Sát Chủ     chiIdx = (8 − 3·month) mod 12     (period 4)
 *   Thọ Tử      chiIdx = (1 − 5·month) mod 12
 *   Dương Công  lunar day = ((15 − 2·month − 1) mod 30) + 1
 *
 * All five Chi tables and the Dương Công table were extracted from the canon's
 * own per-day output over 579 days and reproduce its `sao_tot` / `sao_xau`
 * lists exactly on all of them, including its 29 leap-month days. The canon
 * states each rule in prose in its `vi_sao` field — "Chi ngày Dậu ứng Thiên Đức
 * của tháng 5 âm lịch" — and every one of those statements names the *day's
 * Chi* against the *lunar* month, which is what these tables encode.
 *
 * Chi names use `@lunar/core`'s spelling, so the sixth is "Tỵ" here where the
 * canon writes "Tị". Six of the sixty table entries contain that branch;
 * transcribing them from the canon's pages without normalising would silently
 * never match. See ADR-0002.
 */

/** Indexed by lunar month − 1. */
const THIEN_DUC_CHI = [
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
] as const;

const NGUYET_DUC_CHI = [
  "Ngọ",
  "Thìn",
  "Dần",
  "Tý",
  "Ngọ",
  "Thìn",
  "Dần",
  "Tý",
  "Ngọ",
  "Thìn",
  "Dần",
  "Tý",
] as const;

const THIEN_HY_CHI = [
  "Tuất",
  "Hợi",
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
] as const;

const SAT_CHU_CHI = [
  "Tỵ",
  "Dần",
  "Hợi",
  "Thân",
  "Tỵ",
  "Dần",
  "Hợi",
  "Thân",
  "Tỵ",
  "Dần",
  "Hợi",
  "Thân",
] as const;

const THO_TU_CHI = [
  "Thân",
  "Mão",
  "Tuất",
  "Tỵ",
  "Tý",
  "Mùi",
  "Dần",
  "Dậu",
  "Thìn",
  "Hợi",
  "Ngọ",
  "Sửu",
] as const;

/** The fixed kỵ lunar day of each month, indexed by lunar month − 1. */
const DUONG_CONG_KY_NGAY = [13, 11, 9, 7, 5, 3, 1, 29, 27, 25, 23, 21] as const;

/** Tam Nương: the six lunar days of the month, as the canon states them. */
const TAM_NUONG_NGAY: ReadonlySet<number> = new Set([3, 7, 13, 18, 22, 27]);

/** Nguyệt Kỵ: the three lunar days whose digits sum to five. */
const NGUYET_KY_NGAY: ReadonlySet<number> = new Set([5, 14, 23]);

function at<T>(cycle: readonly T[], index: number): T {
  const value = cycle[index];
  if (value === undefined) {
    throw new RangeError(`index ${index} is outside a ${cycle.length}-entry cycle`);
  }
  return value;
}

/**
 * Every sao and divergence rule that applies to a date.
 *
 * Leap months use their base month number as-is, which is what the canon does:
 * its 29 leap-month days in the harvested window follow the same tables with no
 * adjustment, and `solarToLunar`'s `isLeapMonth` flag is therefore not consulted
 * here.
 */
export function rulesTrongNgay(s: SolarDate): readonly RuleHit[] {
  const lunar = solarToLunar(s);
  const monthIndex = lunar.month - 1;
  const day = lunar.day;
  const chi = canChiDay(s).split(" ")[1] ?? "";
  const hits: RuleHit[] = [];

  const saoTheoChi: readonly [Sao, string, readonly string[]][] = [
    ["Thiên Đức", "ứng", THIEN_DUC_CHI],
    ["Nguyệt Đức", "ứng", NGUYET_DUC_CHI],
    ["Thiên Hỷ", "ứng", THIEN_HY_CHI],
    ["Sát Chủ", "phạm", SAT_CHU_CHI],
    ["Thọ Tử", "phạm", THO_TU_CHI],
  ];
  for (const [sao, verb, table] of saoTheoChi) {
    if (chi === at(table, monthIndex)) {
      hits.push({
        rule: sao,
        explanation: `Chi ngày ${chi} ${verb} ${sao} của tháng ${lunar.month} âm lịch`,
        divergence: false,
      });
    }
  }

  if (TAM_NUONG_NGAY.has(day)) {
    hits.push({
      rule: "Tam Nương",
      explanation: `Ngày ${day} âm lịch nằm trong bộ 3–7–13–18–22–27`,
      divergence: false,
    });
  }
  if (NGUYET_KY_NGAY.has(day)) {
    hits.push({
      rule: "Nguyệt Kỵ",
      explanation: `Ngày ${day} âm lịch — cộng các chữ số đều bằng 5 (5, 1+4, 2+3)`,
      divergence: false,
    });
  }
  if (day === at(DUONG_CONG_KY_NGAY, monthIndex)) {
    hits.push({
      rule: "Dương Công Kỵ Nhật",
      explanation: `Tháng ${lunar.month} âm lịch có ngày kỵ cố định là mùng ${day}`,
      divergence: false,
    });
  }

  // Our two divergences. The canon's own score carries no lunar-day term at
  // all, so these are scored here and flagged, never presented as canonical.
  if (day === 1) {
    hits.push({
      rule: "Mùng 1",
      explanation: `Mùng ${day} tháng ${lunar.month} âm lịch`,
      divergence: true,
    });
  }
  if (day === 15) {
    hits.push({
      rule: "Ngày rằm",
      explanation: `Ngày rằm (15) tháng ${lunar.month} âm lịch`,
      divergence: true,
    });
  }

  return hits;
}

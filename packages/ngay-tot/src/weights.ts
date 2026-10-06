import type { TrucName, TuName } from "@lunar/core";
import type { RuleName } from "./rules.ts";
import type { DanhGia, Viec } from "./types.ts";

/**
 * Points every day starts from, before any rule applies.
 *
 * A module constant rather than a per-việc field because the canon's baseline is
 * uniform: all thirteen việc it publishes score from the same 50. If a future
 * việc needs a different baseline this moves into `WeightTable`, and the compiler
 * will then require every table to supply one.
 */
export const DIEM_CO_SO = 50;

export const DIEM_THAP_NHAT = 0;
export const DIEM_CAO_NHAT = 100;

/**
 * The rule name of the baseline row in a breakdown.
 *
 * Exported because surfaces need to exclude the baseline when they ask "what
 * moved this day's score the most" — a dominant reason of "Điểm cơ sở" is no
 * reason at all. Naming the constant beats matching a Vietnamese string literal
 * in three different components.
 */
export const QUY_TAC_DIEM_CO_SO = "Điểm cơ sở";

/**
 * The per-việc weights of every canonical layer.
 *
 * `Record<TrucName, number>` and `Record<TuName, number>` are deliberate: they
 * force all twelve Trực and all twenty-eight tú to carry an explicit weight, so
 * the spec's "none is left to a default or a guess" is enforced by the compiler
 * rather than by review. Omitting a tú is a build failure, not a silent zero.
 */
export interface WeightTable {
  readonly viec: Viec;
  /** Trực nhật, when the presiding deity is one of the six hoàng đạo. */
  readonly hoangDao: number;
  /** Trực nhật, when it is one of the six hắc đạo. */
  readonly hacDao: number;
  /** Thập nhị trực. Zero means neutral, and produces no line in the breakdown. */
  readonly truc: Readonly<Record<TrucName, number>>;
  /**
   * Nhị thập bát tú. For cắt tóc all three tiers are non-zero, so every day
   * shows a tú line; the type still permits a zero for a future việc.
   */
  readonly tu: Readonly<Record<TuName, number>>;
  /** Every sao and divergence rule, canonical and ours alike. */
  readonly rule: Readonly<Record<RuleName, number>>;
  /**
   * Giờ hoàng đạo: the contribution is `gioMoiGio × (n − gioTrungHoa)`, where
   * `n` is the number of hoàng đạo giờ inside 07h–19h.
   */
  readonly gioMoiGio: number;
  readonly gioTrungHoa: number;
}

/*
 * Every number below was recovered from the canon's own per-day scores, not read
 * off its prose. The prose is wrong in two places: it advertises flat ±16/±12 for
 * trực nhật and tú, and a giờ rule of "+2 each, max +8, −4 when few".
 *
 * The tables were fitted by least squares over 569 unclamped days and then
 * replayed against all 579 harvested days (2025-06-01..2026-12-31) with exact
 * agreement, including the 10 that clamp. Every coefficient is an integer. See
 * §2b of the change's design.md.
 *
 * The giờ rule is `2 × (n − 2)`. Over the full domain n ∈ [0, 6] that yields
 * exactly the −4 and +8 the canon's prose quotes — but n never leaves {2, 3, 4},
 * because six of the twelve giờ are always hoàng đạo and the window always spans
 * six giờ. So the prose describes an unreachable domain, and the real range is
 * 0, +2, +4.
 */
const CAT_TOC: WeightTable = {
  viec: "cat-toc",
  hoangDao: 18,
  hacDao: -18,
  truc: {
    Kiến: 0,
    Trừ: 14,
    Mãn: 0,
    Bình: 0,
    Định: 14,
    Chấp: 0,
    Phá: -16,
    Nguy: -16,
    Thành: 14,
    Thu: 0,
    Khai: 14,
    Bế: -16,
  },
  tu: {
    Giác: 10,
    Cang: -12,
    Đê: -4,
    Phòng: 10,
    Tâm: -4,
    Vĩ: 10,
    Cơ: 10,
    Đẩu: 10,
    Ngưu: -4,
    Nữ: -4,
    Hư: -12,
    Nguy: -12,
    Thất: 10,
    Bích: 10,
    Khuê: -4,
    Lâu: 10,
    Vị: 10,
    Mão: -4,
    Tất: 10,
    Chủy: -12,
    Sâm: 10,
    Tỉnh: 10,
    Quỷ: -12,
    Liễu: -12,
    Tinh: -4,
    Trương: 10,
    Dực: -4,
    Chẩn: 10,
  },
  rule: {
    "Thiên Đức": 9,
    "Nguyệt Đức": 9,
    "Thiên Hỷ": 5,
    "Tam Nương": -13,
    "Nguyệt Kỵ": -13,
    "Sát Chủ": -9,
    "Thọ Tử": -9,
    "Dương Công Kỵ Nhật": -9,
    // Our divergences. Mùng 1 and ngày rằm sit at the level the canon reserves
    // for Tam Nương / Nguyệt Kỵ. Xung tuổi sits one tier down, borrowing the −9
    // the canon already assigns to comparable personal/ritual incompatibilities
    // (Sát Chủ, Thọ Tử, Dương Công Kỵ Nhật) rather than inventing a magnitude —
    // it scores nothing for tuổi, so there is no number of its own to derive.
    // It stays a modifier and never a veto: a xung day is lowered, never removed.
    "Mùng 1": -13,
    "Ngày rằm": -13,
    "Xung tuổi": -9,
  },
  gioMoiGio: 2,
  gioTrungHoa: 2,
};

/**
 * The registry the kernel reads. Typed `Record<Viec, WeightTable>` so that
 * adding a việc to the union is a build failure until its table exists — which
 * is what makes "adding an activity is a data change" true rather than aspirational.
 */
export const WEIGHT_TABLES: Readonly<Record<Viec, WeightTable>> = {
  "cat-toc": CAT_TOC,
};

/**
 * Đánh giá thresholds as `[minimum score, tier]`, scanned from the top down.
 *
 * Calibrated against the measured `cat-toc` distribution over the 579-day
 * harvest, not against the canon's published "median ≈45, ~11% ≥80" — those
 * figures describe its `chung` score (measured median 48, 12.1% ≥80), not
 * `cat-toc` (measured median 49, 16.1% ≥80). The resulting bands are:
 *
 *   Rất tốt    ≥80   16.1%    Xấu        20–39   21.8%
 *   Tốt        60–79 20.4%    Rất xấu    <20     11.7%
 *   Trung bình 40–59 30.1%
 *
 * The distribution is bell-shaped around 50 and the top tier is reached by a
 * minority of days, which is what the spec's "good days stay rare" requires.
 */
const NGUONG_DANH_GIA: readonly (readonly [number, DanhGia])[] = [
  [80, "Rất tốt"],
  [60, "Tốt"],
  [40, "Trung bình"],
  [20, "Xấu"],
  [0, "Rất xấu"],
];

/** The tier for a score. A function of the score alone — never of anything else. */
export function danhGiaOf(score: number): DanhGia {
  for (const [minimum, danhGia] of NGUONG_DANH_GIA) {
    if (score >= minimum) return danhGia;
  }
  // Unreachable: the last threshold is 0 and scores are clamped to [0, 100].
  return "Rất xấu";
}

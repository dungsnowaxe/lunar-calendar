import type { SolarDate } from "@lunar/core";

/**
 * The activities the day-quality kernel can judge.
 *
 * Adding a việc is a data change, not a code change: extend this union and add a
 * matching entry to the weight-table registry. Because that registry is typed
 * `Record<Viec, WeightTable>`, the compiler refuses to build until the table
 * exists — and no scoring logic is touched. That exhaustiveness check is what
 * makes "keyed by việc" mean something rather than being a naming convention.
 *
 * The reference canon publishes thirteen việc under these exact slugs:
 * `cat-toc`, `chung`, `cuoi-hoi`, `dong-tho`, `nhap-trach`, `an-tang`,
 * `cau-tai`, `cung-le`, `khai-truong`, `mua-xe`, `nhan-viec`, `sinh-con`,
 * `xuat-hanh`. Only `cat-toc` ships in v1, but the slugs are kept verbatim so a
 * later việc lines up with the canon's own data without a migration.
 */
export type Viec = "cat-toc";

/**
 * The việc as written in prose, for explanations and UI copy.
 *
 * Typed `Record<Viec, string>` so that extending the `Viec` union without
 * giving the new việc a label is a build failure. Explanations are built from
 * this rather than naming an activity, which keeps the kernel free of any `if`
 * branch over việc names.
 */
export const VIEC_LABEL: Readonly<Record<Viec, string>> = {
  "cat-toc": "cắt tóc",
};

/**
 * The eight sao the reference canon surfaces at day level.
 *
 * Five are keyed on the day's Chi against the lunar month (Thiên Đức, Nguyệt
 * Đức, Thiên Hỷ, Sát Chủ, Thọ Tử) and three on the lunar day itself (Tam Nương,
 * Nguyệt Kỵ, Dương Công Kỵ Nhật).
 */
export type Sao =
  | "Thiên Đức"
  | "Nguyệt Đức"
  | "Thiên Hỷ"
  | "Tam Nương"
  | "Nguyệt Kỵ"
  | "Sát Chủ"
  | "Thọ Tử"
  | "Dương Công Kỵ Nhật";

/**
 * A rule we score that the canon names in prose but does not itself score.
 *
 * The canon's per-day score contains no lunar-day term and no tuổi term at all:
 * over 579 harvested days, mùng 1 and ngày rằm carry no penalty in its model,
 * and a fit reaching zero residual needs no tuổi feature — its `tuoi_xung` list
 * is published as information only. Scoring all three is our divergence,
 * recorded per the `day-quality` spec.
 */
export type Divergence = "Mùng 1" | "Ngày rằm" | "Xung tuổi";

/** Where a rule comes from, so every line of a breakdown can be sourced. */
export interface Citation {
  /** Human-readable source, e.g. the canon page that states the rule. */
  readonly source: string;
  /** Canonical URL, or null where no single page states the rule. */
  readonly url: string | null;
}

/**
 * One line of a day's breakdown.
 *
 * Zero-delta rows are dropped before this is produced, so `delta` is never 0 —
 * a Trực that is neutral for the việc simply does not appear.
 */
export interface Contribution {
  /** The rule as shown to the user, e.g. "Trực Thành" or "Sao Thiên Đức". */
  readonly rule: string;
  /** Signed points relative to the baseline. */
  readonly delta: number;
  /** Why this rule applies to this particular day, in plain Vietnamese. */
  readonly explanation: string;
  readonly citation: Citation;
  /**
   * True when this is our own scoring of a rule the canon describes but does not
   * score. A divergence must never be indistinguishable from a canonical rule.
   */
  readonly divergence: boolean;
}

/** The đánh giá tiers, worst first. A tier is a function of the score alone. */
export const DANH_GIA = ["Rất xấu", "Xấu", "Trung bình", "Tốt", "Rất tốt"] as const;

export type DanhGia = (typeof DANH_GIA)[number];

/** A birth-year Can–Chi, e.g. "Ất Tỵ". Always one of exactly sixty — see `CAN_CHI`. */
export type CanChi = string;

/**
 * A chủ sự: a named person whose birth-year tuổi may modify the score.
 *
 * Held on the client only and never written to the database. Tuổi is one of the
 * sixty Can–Chi, not one of twelve animals, because the canon's own clash list
 * is Can–Chi specific: for ngày Nhâm Tý it names Bính Ngọ and Mậu Ngọ, and says
 * nothing about the other three Ngọ years.
 */
export interface ChuSu {
  readonly ten: string;
  readonly tuoi: CanChi;
}

export interface DayQuality {
  readonly viec: Viec;
  readonly date: SolarDate;
  /** The sum of every contribution, clamped to [0, 100]. */
  readonly score: number;
  readonly danhGia: DanhGia;
  /**
   * Every non-zero contribution in canonical layer order, **including the
   * baseline**. The baseline is a listed row so that a reader can sum the
   * displayed deltas and reach the score — the spec's stated requirement — and
   * so a clamped day still shows all of its reasoning.
   */
  readonly contributions: readonly Contribution[];
  /** The unclamped sum, so a UI can explain why `score` differs from the visible deltas. */
  readonly rawScore: number;
  /** True when `rawScore` fell outside [0, 100] and `score` was clamped. */
  readonly clamped: boolean;
}

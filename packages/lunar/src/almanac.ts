/*
 * Almanac astronomy: tiết khí, thập nhị trực, nhị thập bát tú, trực nhật and
 * the twelve giờ.
 *
 * Everything here is COMPUTED and independently verifiable. Per ADR-0002 this
 * module must hold no belief data and no opinion about what a day is good for —
 * not even which deities count as hoàng đạo. It names the presiding deity;
 * `packages/ngay-tot` decides what that means, and depends on this, never the
 * reverse.
 *
 * Each layer is verified against 579 days of published almanac data spanning
 * 2025-06-01..2026-12-31 (see test/almanac.test.ts).
 */

import { SunLongitude, TIMEZONE } from "./hnd.ts";
import { solarToLunar } from "./lunar.ts";
import { solarDayOfWeek, solarToJdn, type SolarDate } from "./solar.ts";

const PI = Math.PI;

/**
 * The 24 solar terms, indexed by the 15° sector of the sun's longitude
 * measured from 0° (Xuân Phân). Index 12 is therefore Thu Phân (180°) and
 * index 21 is Lập Xuân (315°), the term that opens tháng Dần.
 *
 * Spelling follows the reference canon exactly (both words capitalised) so
 * golden-fixture assertions are strict string equality rather than normalised.
 */
const TIET_KHI = [
  "Xuân Phân",
  "Thanh Minh",
  "Cốc Vũ",
  "Lập Hạ",
  "Tiểu Mãn",
  "Mang Chủng",
  "Hạ Chí",
  "Tiểu Thử",
  "Đại Thử",
  "Lập Thu",
  "Xử Thử",
  "Bạch Lộ",
  "Thu Phân",
  "Hàn Lộ",
  "Sương Giáng",
  "Lập Đông",
  "Tiểu Tuyết",
  "Đại Tuyết",
  "Đông Chí",
  "Tiểu Hàn",
  "Đại Hàn",
  "Lập Xuân",
  "Vũ Thủy",
  "Kinh Trập",
] as const;

/** The twelve day-officers, in rotation order. Tháng Dần opens with Trực Kiến. */
export const TRUC = [
  "Kiến",
  "Trừ",
  "Mãn",
  "Bình",
  "Định",
  "Chấp",
  "Phá",
  "Nguy",
  "Thành",
  "Thu",
  "Khai",
  "Bế",
] as const;

/** The 28 lunar mansions, in rotation order (Giác … Chẩn). */
export const TU = [
  "Giác",
  "Cang",
  "Đê",
  "Phòng",
  "Tâm",
  "Vĩ",
  "Cơ",
  "Đẩu",
  "Ngưu",
  "Nữ",
  "Hư",
  "Nguy",
  "Thất",
  "Bích",
  "Khuê",
  "Lâu",
  "Vị",
  "Mão",
  "Tất",
  "Chủy",
  "Sâm",
  "Tỉnh",
  "Quỷ",
  "Liễu",
  "Tinh",
  "Trương",
  "Dực",
  "Chẩn",
] as const;

/**
 * Each tú's luminary (thất diệu). The 28-day cycle is a multiple of 7, so a
 * tú always falls on the same weekday and its luminary always matches that
 * weekday's planet.
 */
const TU_HANH = ["Mộc", "Kim", "Thổ", "Nhật", "Nguyệt", "Hỏa", "Thủy"] as const;

/** The weekday's luminary, indexed like `solarDayOfWeek` (0 = Chủ nhật). */
const WEEKDAY_HANH = ["Nhật", "Nguyệt", "Hỏa", "Thủy", "Mộc", "Kim", "Thổ"] as const;

/** The twelve day-deities, in rotation order. */
export const TRUC_NHAT = [
  "Thanh Long",
  "Minh Đường",
  "Thiên Hình",
  "Chu Tước",
  "Kim Quỹ",
  "Bảo Quang",
  "Bạch Hổ",
  "Ngọc Đường",
  "Thiên Lao",
  "Nguyên Vũ",
  "Tư Mệnh",
  "Câu Trần",
] as const;

/**
 * Literal unions over the three closed cycles above.
 *
 * These exist so the derivations below can return what they provably return.
 * `trucOf` does not produce an arbitrary string — it indexes `TRUC` — and saying
 * so lets a downstream weight table be typed `Record<TrucName, number>`, where
 * omitting a Trực becomes a build failure instead of a silent `undefined`.
 */
export type TrucName = (typeof TRUC)[number];
export type TuName = (typeof TU)[number];
export type TrucNhatName = (typeof TRUC_NHAT)[number];

/**
 * Which six of these deities are hoàng đạo (favourable) and which six are hắc
 * đạo is a *belief* judgment, not a computed one, so it deliberately does not
 * live here. `packages/ngay-tot` owns that set and the ±18 weight it carries.
 * This module supplies only the deity that presides — see ADR-0002.
 */

/** The twelve double-hours, in order, named for their Chi. */
const GIO_CHI = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tị",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

/**
 * Read one entry of a closed rotation cycle.
 *
 * Every table in this module is a fixed cycle addressed as `x mod n` — 24 solar
 * terms, 12 trực, 28 tú, 12 deities, 7 luminaries — so an in-range index is a
 * property of the arithmetic above, not of the data. This checks that property
 * in one place instead of scattering non-null assertions, and turns a future
 * off-by-one into a named error rather than a silent `undefined` reaching the UI.
 */
function at<T>(cycle: readonly T[], index: number): T {
  const value = cycle[index];
  if (value === undefined) {
    throw new RangeError(`index ${index} is outside a ${cycle.length}-entry cycle`);
  }
  return value;
}

/**
 * The Chi of the day-hour at which Thanh Long begins, given the Chi that anchors
 * the cycle. For ngày trực nhật the anchor is the month's Chi; for giờ hoàng đạo
 * it is the day's Chi. Both use the same lục diệu progression.
 */
function thanhLongStart(anchorChi: number): number {
  return (anchorChi * 2 + 8) % 12;
}

/** The sun's longitude in degrees at local (UTC+7) midnight opening a Julian day. */
function sunLongitudeDeg(jdn: number): number {
  return (SunLongitude(jdn - 0.5 - TIMEZONE / 24) * 180) / PI;
}

/**
 * The sun's longitude at the CLOSE of a solar date — local midnight opening the
 * next day.
 *
 * The almanac labels a whole date with the solar term that *begins* on it, so a
 * date is classified by where the sun ends up rather than where it started.
 * Sampling the opening midnight instead mislabels every term-boundary date:
 * 38 of the 579 fixture days.
 */
function sunLongitudeDegAtClose(s: SolarDate): number {
  return sunLongitudeDeg(solarToJdn(s) + 1);
}

/**
 * The solar term in effect on a date. A term runs from the moment the sun
 * reaches its 15° boundary until the next one, and the date on which a term
 * begins belongs to that new term.
 */
export function tietKhiOf(s: SolarDate): string {
  const sector = Math.floor(sunLongitudeDegAtClose(s) / 15);
  return at(TIET_KHI, sector);
}

/**
 * The Chi (0 = Tý … 11 = Hợi) of the TIẾT KHÍ month a date falls in — the
 * tháng Kiến that anchors the Trực.
 *
 * This is NOT the lunar month. Tháng Dần opens at Lập Xuân (315°) and each
 * following month at the next 30° boundary, so the tiết-khí month drifts
 * against the lunar month. Keying the Trực on the lunar month instead gets
 * 184 of the 579 fixture days wrong — see ADR-0001.
 *
 * Note that `trucNhatOf` deliberately uses the *lunar* month instead. The two
 * layers really are anchored differently; see that function.
 */
export function tietKhiMonthChi(s: SolarDate): number {
  const deg = sunLongitudeDegAtClose(s);
  const monthsFromDan = Math.floor(((((deg - 315) % 360) + 360) % 360) / 30);
  return (monthsFromDan + 2) % 12;
}

/**
 * The Trực of a day: the day-officer reached by counting forward from Trực Kiến
 * on the day whose Chi matches the tiết-khí month's Chi.
 */
export function trucOf(s: SolarDate): TrucName {
  const jdn = solarToJdn(s);
  const dayChi = (jdn + 1) % 12;
  return at(TRUC, (dayChi - tietKhiMonthChi(s) + 12) % 12);
}

export interface Tu {
  /** 0-based position in the 28-day rotation. */
  index: number;
  /** The tú's name, e.g. "Tất". */
  name: TuName;
  /** Its luminary, e.g. "Nguyệt". */
  hanh: string;
}

/**
 * The nhị thập bát tú of a day. The 28 mansions rotate on a continuous cycle
 * keyed to the Julian day, independent of the lunar month — no moon longitude
 * is involved.
 */
export function tuOf(s: SolarDate): Tu {
  const index = (solarToJdn(s) + 11) % 28;
  return { index, name: at(TU, index), hanh: at(TU_HANH, index % 7) };
}

/**
 * The trực nhật — the name of the day-deity presiding over a date.
 *
 * Returns the deity only. Whether that deity makes the day hoàng đạo or hắc đạo
 * is belief data and lives in `packages/ngay-tot` (ADR-0002).
 *
 * IMPORTANT: this layer is anchored on the **lunar** month's Chi, while
 * `trucOf` is anchored on the **tiết-khí** month's Chi. That asymmetry is not
 * an oversight and not a bug — it is what the reference canon computes, and it
 * was established empirically over 579 fixture days:
 *
 *   - trực nhật  — lunar month   579/579 ✓   (tiết-khí month: 395/579 ✗)
 *   - thập nhị trực — tiết-khí month 579/579 ✓   (lunar month: 395/579 ✗)
 *
 * Unifying the two on either basis silently breaks about a third of all days.
 * Do not "simplify" this without re-running both fixture assertions.
 *
 * For leap months the lunar month number is used directly, matching the canon.
 */
export function trucNhatOf(s: SolarDate): TrucNhatName {
  const jdn = solarToJdn(s);
  const dayChi = (jdn + 1) % 12;
  const lunarMonthChi = (solarToLunar(s).month + 1) % 12;
  return at(TRUC_NHAT, (dayChi - thanhLongStart(lunarMonthChi) + 12) % 12);
}

export interface Gio {
  /** The double-hour's Chi, e.g. "Tý". */
  chi: string;
  /** The hour the double-hour begins at, 0–23. Giờ Tý begins at 23. */
  startHour: number;
  /** The presiding deity, e.g. "Kim Quỹ". */
  than: TrucNhatName;
}

/**
 * All twelve double-hours of a date with their presiding deities, assigned from
 * the day's Chi.
 *
 * As with `trucNhatOf`, no giờ is labelled favourable here — that classification
 * belongs to `packages/ngay-tot`.
 *
 * Giờ Tý spans 23h–01h and so straddles midnight. This function deliberately
 * makes no claim about which day that first hour belongs to: the day-quality
 * layer counts hours inside a daytime window and never needs a clock, so no
 * midnight-boundary semantics are introduced. See ADR-0002 and the
 * `day-quality` spec.
 */
export function gioOf(s: SolarDate): Gio[] {
  const jdn = solarToJdn(s);
  const dayChi = (jdn + 1) % 12;
  const start = thanhLongStart(dayChi);
  return GIO_CHI.map((chi, i) => ({
    chi,
    startHour: i === 0 ? 23 : i * 2 - 1,
    than: at(TRUC_NHAT, (i - start + 12) % 12),
  }));
}

/**
 * The luminary a weekday carries, indexed like `solarDayOfWeek`. Exposed so the
 * tú ↔ weekday invariant can be asserted independently of `tuOf`'s internals.
 */
export function weekdayHanh(s: SolarDate): string {
  return at(WEEKDAY_HANH, solarDayOfWeek(s));
}

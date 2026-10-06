import { daysInSolarMonth, type SolarDate } from "@lunar/core";
import {
  QUY_TAC_DIEM_CO_SO,
  type Contribution,
  type DanhGia,
  type DayQuality,
} from "@lunar/ngay-tot";

/**
 * Presentation helpers for the day-quality surfaces.
 *
 * Nothing here decides a score, a tier, or a weight — the kernel owns all of
 * that. These functions only turn a `DayQuality` into something the two surfaces
 * (TodayCard and `/ngay-tot-cat-toc`) render identically, so the copy and the
 * colour mapping cannot drift apart between them.
 */

/** Every day of a solar month, in date order. */
export function ngayTrongThang(year: number, month: number): SolarDate[] {
  return Array.from({ length: daysInSolarMonth(year, month) }, (_, i) => ({
    day: i + 1,
    month,
    year,
  }));
}

/**
 * The contribution that moved a day's score the most, baseline excluded.
 *
 * TodayCard shows one line — "tier + dominant reason" — and a reason of "Điểm cơ
 * sở" is no reason at all, so the baseline is skipped even though it is by far
 * the largest number in most breakdowns. Null only when a day somehow has no
 * other row, which the caller renders as the tier alone.
 */
export function lyDoChinh(q: DayQuality): Contribution | null {
  let best: Contribution | null = null;
  for (const c of q.contributions) {
    if (c.rule === QUY_TAC_DIEM_CO_SO) continue;
    if (best === null || Math.abs(c.delta) > Math.abs(best.delta)) best = c;
  }
  return best;
}

/**
 * Colour per đánh giá, darkest green to darkest red.
 *
 * Kept as a full `Record<DanhGia, string>` so a new tier in the kernel is a build
 * failure here rather than an unstyled badge. Written with explicit `dark:`
 * variants because the tier colours are semantic and are not part of the app's
 * oklch token set.
 */
export const DANH_GIA_LOAI: Record<DanhGia, string> = {
  "Rất tốt": "bg-green-500/15 text-green-700 dark:text-green-400",
  Tốt: "bg-lime-500/15 text-lime-700 dark:text-lime-400",
  "Trung bình": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Xấu: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  "Rất xấu": "bg-red-500/15 text-red-700 dark:text-red-400",
};

/** A signed delta as shown in a breakdown, e.g. "+18" or "-16". */
export function deltaLabel(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

/**
 * The one-line disclaimer that appears on both day-quality surfaces.
 *
 * Deliberately a plain line of text rather than a modal, an interstitial, or a
 * dismissible banner: the attribution is the point, so it should be present
 * every time without the reader having to do anything. Stated once here so the
 * two surfaces cannot word it differently.
 */
export const TIN_NGUONG_DAN_GIAN =
  "Chọn ngày là tín ngưỡng dân gian, ghi lại từ các sách lịch cổ — không phải khuyến nghị khoa học.";

import { canChiYear, solarToJdn, type LunarDate, type SolarDate } from '@lunar/core'

/** Monday-first calendar column headers. */
export const CALENDAR_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

const WEEKDAY_LONG = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
] as const

export function weekdayLong(dayOfWeek: number): string {
  return WEEKDAY_LONG[dayOfWeek] ?? ''
}

export function monthTitle(year: number, month: number): string {
  return `Tháng ${month} năm ${year}`
}

/** Short lunar label for calendar cells, e.g. "1/7" or "1/7N" (nhuận). */
export function lunarShortLabel(l: LunarDate): string {
  return `${l.day}/${l.month}${l.isLeapMonth ? 'N' : ''}`
}

/** Long lunar label, e.g. "10 tháng 3 năm Bính Ngọ". */
export function lunarLongLabel(l: LunarDate): string {
  const leap = l.isLeapMonth ? ' (nhuận)' : ''
  return `${l.day} tháng ${l.month}${leap} năm ${canChiYear(l.year)}`
}

/** "Ngày 10 tháng 3 (âm lịch)" — the stored rule of an event. */
export function eventRuleLabel(e: {
  lunarDay: number
  lunarMonth: number
}): string {
  return `Ngày ${e.lunarDay} tháng ${e.lunarMonth} (âm lịch)`
}

export function daysBetween(from: SolarDate, to: SolarDate): number {
  return solarToJdn(to) - solarToJdn(from)
}

export function daysUntilLabel(days: number): string {
  if (days <= 0) return 'Hôm nay'
  if (days === 1) return 'Ngày mai'
  return `Còn ${days} ngày`
}

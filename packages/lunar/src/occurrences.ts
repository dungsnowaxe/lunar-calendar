import { lunarMonthLength, lunarToSolar, solarToLunar, type LunarDate } from './lunar.ts'
import { compareSolar, type SolarDate } from './solar.ts'

/**
 * The lunar rule of a recurring memorial event (ngày giỗ). This mirrors the
 * stored database columns and is the only thing needed to compute every future
 * occurrence.
 */
export interface MemorialRule {
  /** 1–30 */
  lunarDay: number
  /** 1–12 */
  lunarMonth: number
}

/**
 * The solar date the rule falls on in a given lunar year, or null when the
 * month does not exist. Occurrences always follow the regular month
 * (tháng thường) — the traditional convention for ngày giỗ — even in lunar
 * years that also have a leap occurrence (tháng nhuận) of that month. A day 30
 * in a 29-day month is observed on the last day of the month (quy ước: giỗ
 * vào ngày cuối cùng của tháng thiếu).
 */
export function occurrenceInLunarYear(
  rule: MemorialRule,
  lunarYear: number,
): SolarDate | null {
  const length = lunarMonthLength(lunarYear, rule.lunarMonth, false)
  if (length === 0) return null
  const date: LunarDate = {
    day: Math.min(rule.lunarDay, length),
    month: rule.lunarMonth,
    year: lunarYear,
    isLeapMonth: false,
  }
  return lunarToSolar(date)
}

/**
 * The next `count` occurrences (today included) of the rule at or after `from`,
 * in ascending order. Occurrences are generated per lunar year, so an event in
 * lunar month 12 correctly lands in early solar year N+1.
 */
export function nextOccurrences(
  rule: MemorialRule,
  from: SolarDate,
  count: number,
): SolarDate[] {
  const results: SolarDate[] = []
  if (!Number.isInteger(count) || count < 1) return results
  let lunarYear = solarToLunar(from).year
  // Safety bound: each lunar year contributes at most one occurrence, and the
  // first year may already be spent, so a few extra solar years is plenty.
  const lastLunarYear = from.year + 5
  while (results.length < Math.min(count, 12) && lunarYear <= lastLunarYear) {
    const occurrence = occurrenceInLunarYear(rule, lunarYear)
    if (occurrence && compareSolar(occurrence, from) >= 0) {
      results.push(occurrence)
    }
    lunarYear++
  }
  return results
}

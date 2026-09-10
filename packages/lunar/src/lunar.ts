import {
  getLunarMonth11,
  getLeapMonthOffset,
  jdToLunar,
  lunarToJd,
} from './hnd.ts'
import { jdnToSolar, solarToJdn, type SolarDate } from './solar.ts'

/**
 * A lunar date. This is the canonical representation of a recurring memorial
 * event; it must be stored and never replaced by a converted solar date.
 */
export interface LunarDate {
  /** 1–30 */
  day: number
  /** 1–12 */
  month: number
  /** Vietnamese lunar year, e.g. 2026 = Bính Ngọ */
  year: number
  /** True when the date is in the leap occurrence of `month` (tháng nhuận). */
  isLeapMonth: boolean
}

const CAN = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
] as const

const CHI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const

/** The leap month (tháng nhuận) of a lunar year, or null when the year is regular. */
export function leapMonthOf(lunarYear: number): number | null {
  const a11 = getLunarMonth11(lunarYear - 1)
  const b11 = getLunarMonth11(lunarYear)
  if (b11 - a11 <= 365) return null
  const leapOff = getLeapMonthOffset(a11)
  let leapMonth = leapOff - 2
  if (leapMonth < 0) leapMonth += 12
  return leapMonth
}

/** Number of days (29 or 30) in a lunar month; 0 when the month does not exist. */
export function lunarMonthLength(
  lunarYear: number,
  month: number,
  isLeapMonth: boolean,
): number {
  const start = lunarToJd(1, month, lunarYear, isLeapMonth ? 1 : 0)
  if (start === null) return 0
  // A non-existent leap month resolves to the regular month start; reject it.
  const check = jdToLunar(start)
  if (
    check.month !== month ||
    check.year !== lunarYear ||
    (check.leap === 1) !== isLeapMonth
  ) {
    return 0
  }
  // If day 29 is already the 1st of the next month, the month has 29 days.
  return jdToLunar(start + 29).day === 1 ? 29 : 30
}

export function solarToLunar(s: SolarDate): LunarDate {
  const l = jdToLunar(solarToJdn(s))
  return {
    day: l.day,
    month: l.month,
    year: l.year,
    isLeapMonth: l.leap === 1,
  }
}

/** The solar date a lunar date falls on, or null when it does not exist. */
export function lunarToSolar(l: LunarDate): SolarDate | null {
  if (
    !Number.isInteger(l.day) ||
    !Number.isInteger(l.month) ||
    !Number.isInteger(l.year) ||
    l.day < 1 ||
    l.day > 30 ||
    l.month < 1 ||
    l.month > 12
  ) {
    return null
  }
  const jd = lunarToJd(l.day, l.month, l.year, l.isLeapMonth ? 1 : 0)
  if (jd === null) return null
  // Guard against silently accepting day 30 of a 29-day month: the algorithm
  // would roll over into the next lunar month, which is not the requested date.
  const check = jdToLunar(jd)
  if (
    check.day !== l.day ||
    check.month !== l.month ||
    check.year !== l.year ||
    (check.leap === 1) !== l.isLeapMonth
  ) {
    return null
  }
  return jdnToSolar(jd)
}

/** Can chi (Giáp Tý…) of a lunar year, e.g. 2026 → "Bính Ngọ". */
export function canChiYear(lunarYear: number): string {
  return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`
}

/** Can chi of a solar day, e.g. 17/02/2026 → "Bính Dần". */
export function canChiDay(s: SolarDate): string {
  const jd = solarToJdn(s)
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`
}

/**
 * Can chi of a lunar month. Leap months have no can chi in the Vietnamese
 * tradition, so null is returned for them.
 */
export function canChiMonth(l: LunarDate): string | null {
  if (l.isLeapMonth) return null
  const yearCan = (l.year + 6) % 10
  const monthCan = yearCan * 2 + l.month + 1
  const monthChi = (l.month + 1) % 12
  return `${CAN[monthCan % 10]} ${CHI[monthChi]}`
}

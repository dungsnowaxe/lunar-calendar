import { jdFromDate, jdToDate } from './hnd.ts'

/** Timezone constant for all user-facing date computation. */
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'

export interface SolarDate {
  day: number
  month: number
  year: number
}

/** The supported range of the underlying Ho Ngoc Duc algorithm (1800–2199). */
export const MIN_SOLAR_YEAR = 1800
export const MAX_SOLAR_YEAR = 2199

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Today's date in Vietnam, regardless of the machine's timezone. */
export function solarToday(now: Date = new Date()): SolarDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

export function solarToJdn(s: SolarDate): number {
  return jdFromDate(s.day, s.month, s.year)
}

export function jdnToSolar(jdn: number): SolarDate {
  const [day, month, year] = jdToDate(jdn)
  return { day, month, year }
}

export function addDays(s: SolarDate, days: number): SolarDate {
  return jdnToSolar(solarToJdn(s) + days)
}

/** Negative when a < b, 0 when equal, positive when a > b. */
export function compareSolar(a: SolarDate, b: SolarDate): number {
  return solarToJdn(a) - solarToJdn(b)
}

export function daysInSolarMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** 0 = Chủ nhật, 1 = Thứ hai, … 6 = Thứ bảy (same numbering as Date#getDay). */
export function solarDayOfWeek(s: SolarDate): number {
  return (solarToJdn(s) + 1) % 7
}

export function formatSolar(s: SolarDate): string {
  return `${pad2(s.day)}/${pad2(s.month)}/${s.year}`
}

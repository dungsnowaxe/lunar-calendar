import { addDays, daysInSolarMonth, type SolarDate } from '@lunar/core'

export interface CalendarCell {
  date: SolarDate
  inMonth: boolean
}

/**
 * All days of a Monday-first month grid, padded with the neighbouring days of
 * adjacent months so the grid always contains whole weeks.
 */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const total = Math.ceil((lead + daysInSolarMonth(year, month)) / 7) * 7
  const first: SolarDate = { day: 1, month, year }
  return Array.from({ length: total }, (_, i) => {
    const date = addDays(first, i - lead)
    return { date, inMonth: date.month === month && date.year === year }
  })
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zero = year * 12 + (month - 1) + delta
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 }
}

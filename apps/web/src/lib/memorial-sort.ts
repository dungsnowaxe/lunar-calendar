import { nextOccurrences, solarToJdn, type SolarDate } from "@lunar/core";

export interface NextOccurrenceEvent {
  lunarDay: number;
  lunarMonth: number;
}

export function nextOccurrenceOf(
  event: NextOccurrenceEvent,
  today: SolarDate,
): SolarDate | undefined {
  return nextOccurrences({ lunarDay: event.lunarDay, lunarMonth: event.lunarMonth }, today, 1)[0];
}

/** Sort memorials by the next solar occurrence, soonest first. */
export function sortByNextOccurrence<T extends NextOccurrenceEvent>(
  events: readonly T[],
  today: SolarDate,
): T[] {
  return [...events].sort((a, b) => {
    const nextA = nextOccurrenceOf(a, today);
    const nextB = nextOccurrenceOf(b, today);
    if (!nextA && !nextB) return 0;
    if (!nextA) return 1;
    if (!nextB) return -1;
    return solarToJdn(nextA) - solarToJdn(nextB);
  });
}

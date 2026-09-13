import { cn } from '~/lib/utils'

export const EVENT_COLOR_COUNT = 12

/** FNV-1a 32-bit hash of the event id, mapped onto the 12-slot palette. */
export function eventColorIndex(eventId: string): number {
  let hash = 2166136261
  for (let i = 0; i < eventId.length; i++) {
    hash ^= eventId.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % EVENT_COLOR_COUNT
}

export function eventColorVar(eventId: string): string {
  return `var(--event-${eventColorIndex(eventId) + 1})`
}

export function EventColorDot({
  eventId,
  className,
}: {
  eventId: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-1.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: eventColorVar(eventId) }}
    />
  )
}

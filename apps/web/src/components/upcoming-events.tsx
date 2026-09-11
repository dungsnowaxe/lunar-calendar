import { Link } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CakeIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  formatSolar,
  nextOccurrences,
  solarToJdn,
  solarToday,
  type SolarDate,
} from '@lunar/core'
import { NumberTicker } from '~/components/ui/number-ticker'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { daysBetween, daysUntilLabel, eventRuleLabel } from '~/lib/labels'
import type { MemorialEvent } from '~/server/events'

interface UpcomingEventsProps {
  events: MemorialEvent[]
  /** How many occurrences to show. */
  count?: number
}

export function UpcomingEvents({ events, count = 5 }: UpcomingEventsProps) {
  const today = solarToday()

  const upcoming = events
    .map((event) => {
      const [next] = nextOccurrences(
        { lunarDay: event.lunarDay, lunarMonth: event.lunarMonth },
        today,
        1,
      )
      return next ? { event, date: next } : null
    })
    .filter((item): item is { event: MemorialEvent; date: SolarDate } => item !== null)
    .sort((a, b) => solarToJdn(a.date) - solarToJdn(b.date))
    .slice(0, count)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sắp tới</CardTitle>
        <CardAction>
          <Button render={<Link to="/su-kien" />} size="sm" variant="ghost">
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
            Thêm
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Chưa có sự kiện nào. Hãy thêm ngày giỗ đầu tiên của gia đình bạn.
          </p>
        )}
        {upcoming.map(({ event, date }) => {
          const days = daysBetween(today, date)
          return (
            <div key={event.id} className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                  <HugeiconsIcon
                    icon={CakeIcon}
                    className="size-4 shrink-0 text-primary"
                    strokeWidth={2}
                  />
                  {event.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {eventRuleLabel(event)}, {formatSolar(date)}
                </span>
              </div>
              {days === 0 ? (
                <Badge>Hôm nay</Badge>
              ) : (
                <span className="flex shrink-0 items-baseline gap-1 text-xs text-muted-foreground">
                  Còn
                  <NumberTicker
                    value={days}
                    className="text-sm font-semibold text-foreground tabular-nums"
                  />
                  ngày
                </span>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

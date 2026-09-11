import {
  canChiDay,
  canChiMonth,
  canChiYear,
  solarDayOfWeek,
  solarToLunar,
  solarToday,
} from '@lunar/core'
import { formatSolar } from '@lunar/core'
import { BorderBeam } from '~/components/ui/border-beam'
import { Card, CardContent } from '~/components/ui/card'
import { weekdayLong } from '~/lib/labels'

export function TodayCard() {
  const today = solarToday()
  const lunar = solarToLunar(today)

  return (
    <Card className="relative">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Hôm nay
        </p>
        <p className="font-heading text-2xl font-semibold">
          {weekdayLong(solarDayOfWeek(today))}, {formatSolar(today)}
        </p>
        <p className="text-sm text-muted-foreground">
          Âm lịch: {lunar.day} tháng {lunar.month}
          {lunar.isLeapMonth ? ' (nhuận)' : ''} năm {canChiYear(lunar.year)}
        </p>
        <p className="text-sm text-muted-foreground">
          Ngày {canChiDay(today)}
          {canChiMonth(lunar) && <>, tháng {canChiMonth(lunar)}</>}
        </p>
      </CardContent>
      <BorderBeam size={60} duration={8} />
    </Card>
  )
}

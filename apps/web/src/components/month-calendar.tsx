import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  compareSolar,
  formatSolar,
  occurrenceInLunarYear,
  solarDayOfWeek,
  solarToJdn,
  solarToLunar,
  solarToday,
  type SolarDate,
} from "@lunar/core";
import { monthGrid, shiftMonth } from "~/lib/calendar-grid";
import { EventColorDot } from "~/lib/event-colors";
import {
  CALENDAR_HEADERS,
  lunarLongLabel,
  lunarShortLabel,
  monthTitle,
  weekdayLong,
} from "~/lib/labels";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { MemorialEvent } from "~/server/events";
import { cn } from "~/lib/utils";

interface MonthCalendarProps {
  events: MemorialEvent[];
}

export function MonthCalendar({ events }: MonthCalendarProps) {
  const today = useMemo(() => solarToday(), []);
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<SolarDate>(today);

  function changeMonth(delta: number) {
    const next = shiftMonth(cursor.year, cursor.month, delta);
    setCursor(next);
    setSelected({ ...next, day: 1 });
  }

  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const lunarByJdn = useMemo(() => {
    const map = new Map<number, ReturnType<typeof solarToLunar>>();
    for (const cell of cells) {
      map.set(solarToJdn(cell.date), solarToLunar(cell.date));
    }
    return map;
  }, [cells]);

  // Occurrences of every event inside the visible month (with a one year
  // margin on each side to catch lunar months that straddle solar years).
  const eventsByJdn = useMemo(() => {
    const map = new Map<number, MemorialEvent[]>();
    for (const event of events) {
      const rule = { lunarDay: event.lunarDay, lunarMonth: event.lunarMonth };
      for (let lunarYear = cursor.year - 1; lunarYear <= cursor.year + 1; lunarYear++) {
        const occurrence = occurrenceInLunarYear(rule, lunarYear);
        if (!occurrence) continue;
        const jdn = solarToJdn(occurrence);
        const dayEvents = map.get(jdn);
        if (dayEvents) dayEvents.push(event);
        else map.set(jdn, [event]);
      }
    }
    return map;
  }, [events, cursor]);

  return (
    <Card className="almanac-calendar">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="calendar-month-title min-w-0 text-primary text-2xl sm:text-4xl">
            {monthTitle(cursor.year, cursor.month)}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tháng trước"
              onClick={() => changeMonth(-1)}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setCursor({ year: today.year, month: today.month });
                setSelected(today);
              }}
            >
              Hôm nay
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tháng sau"
              onClick={() => changeMonth(1)}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="calendar-weekdays grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
          {CALENDAR_HEADERS.map((header) => (
            <div key={header} className="py-3">
              {header}
            </div>
          ))}
        </div>
        <div className="calendar-grid grid grid-cols-7">
          {cells.map((cell) => (
            <CalendarCellButton
              key={solarToJdn(cell.date)}
              cell={cell}
              lunar={lunarByJdn.get(solarToJdn(cell.date))!}
              isToday={compareSolar(cell.date, today) === 0}
              isSelected={compareSolar(cell.date, selected) === 0}
              dayEvents={eventsByJdn.get(solarToJdn(cell.date)) ?? []}
              onSelect={() => setSelected(cell.date)}
            />
          ))}
        </div>
        <div aria-live="polite">
          {(eventsByJdn.get(solarToJdn(selected)) ?? []).length > 0 && (
            <section
              aria-label={`Ngày giỗ ${formatSolar(selected)}`}
              className="border-t border-border pt-4"
            >
              <p className="mb-2 text-sm font-medium">Ngày giỗ · {formatSolar(selected)}</p>
              <ul className="flex flex-col gap-2">
                {(eventsByJdn.get(solarToJdn(selected)) ?? []).map((event) => (
                  <li key={event.id} className="flex items-center gap-2 text-sm">
                    <EventColorDot eventId={event.id} className="size-2" />
                    {event.title}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarCellButton({
  cell,
  lunar,
  isToday,
  isSelected,
  dayEvents,
  onSelect,
}: {
  cell: { date: SolarDate; inMonth: boolean };
  lunar: ReturnType<typeof solarToLunar>;
  isToday: boolean;
  isSelected: boolean;
  dayEvents: MemorialEvent[];
  onSelect: () => void;
}) {
  const dayOfWeek = solarDayOfWeek(cell.date);
  const isFullMoon = lunar.day === 15;
  const isNewMoon = lunar.day === 1;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      aria-label={`${weekdayLong(dayOfWeek)}, ${formatSolar(cell.date)}, âm lịch ${lunarLongLabel(lunar)}${dayEvents.length ? `, ${dayEvents.map((event) => event.title).join(", ")}` : ""}`}
      className={cn(
        "calendar-day flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 py-2 text-sm transition-colors lg:min-h-24",
        "hover:bg-muted",
        !cell.inMonth && "text-muted-foreground/50",
        dayOfWeek === 0 && cell.inMonth && "text-red-600 dark:text-red-400",
        isSelected && "bg-accent text-primary ring-1 ring-primary ring-inset hover:bg-accent",
        isToday && !isSelected && "ring-2 ring-primary ring-inset",
      )}
    >
      <span
        className={cn(
          "font-heading text-xl leading-none font-medium sm:text-2xl",
          (isNewMoon || isFullMoon) && cell.inMonth && !isSelected && "text-primary",
        )}
      >
        {cell.date.day}
      </span>
      <span
        className={cn(
          "text-xs leading-none",
          isSelected ? "text-primary" : "text-muted-foreground",
        )}
      >
        {lunar.day === 1 ? lunarShortLabel(lunar) : lunar.day}
      </span>
      <span className="flex h-1.5 min-h-1.5 w-full max-w-full items-center justify-center gap-0.5 overflow-hidden">
        {dayEvents.map((event) => (
          <EventColorDot key={event.id} eventId={event.id} />
        ))}
      </span>
    </button>
  );
}

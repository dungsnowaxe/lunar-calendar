import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  canChiDay,
  canChiMonth,
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

  const selectedLunar = solarToLunar(selected);
  const selectedEvents = events.filter((event) => {
    const rule = { lunarDay: event.lunarDay, lunarMonth: event.lunarMonth };
    for (let lunarYear = selected.year - 1; lunarYear <= selected.year + 1; lunarYear++) {
      const occurrence = occurrenceInLunarYear(rule, lunarYear);
      if (occurrence && compareSolar(occurrence, selected) === 0) return true;
    }
    return false;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="min-w-0 truncate text-sm sm:text-lg">
            {monthTitle(cursor.year, cursor.month)}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Tháng trước"
              onClick={() => setCursor((c) => shiftMonth(c.year, c.month, -1))}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCursor({ year: today.year, month: today.month });
                setSelected(today);
              }}
            >
              Hôm nay
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Tháng sau"
              onClick={() => setCursor((c) => shiftMonth(c.year, c.month, 1))}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {CALENDAR_HEADERS.map((header) => (
            <div key={header} className="py-1">
              {header}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
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
        <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <p className="font-medium">
            {weekdayLong(solarDayOfWeek(selected))}, {formatSolar(selected)}
          </p>
          <p className="text-muted-foreground">
            Âm lịch: {lunarLongLabel(selectedLunar)}, ngày {canChiDay(selected)}
            {selectedLunar.isLeapMonth ? "" : `, tháng ${canChiMonth(selectedLunar)}`}
          </p>
          {selectedEvents.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {selectedEvents.map((event) => (
                <li key={event.id} className="flex items-center gap-1.5 text-foreground">
                  <EventColorDot eventId={event.id} className="size-2" />
                  {event.title}
                </li>
              ))}
            </ul>
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
      className={cn(
        "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-sm transition-colors",
        "hover:bg-muted",
        !cell.inMonth && "text-muted-foreground/50",
        dayOfWeek === 0 && cell.inMonth && "text-red-600 dark:text-red-400",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
        isToday && !isSelected && "ring-2 ring-primary ring-inset",
      )}
    >
      <span
        className={cn(
          "leading-none font-medium",
          (isNewMoon || isFullMoon) && cell.inMonth && !isSelected && "text-primary",
        )}
      >
        {cell.date.day}
      </span>
      <span
        className={cn(
          "text-[10px] leading-none",
          isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
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

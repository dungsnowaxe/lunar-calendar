import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

import { Button } from "~/components/ui/button";
import { monthGrid, shiftMonth } from "~/lib/calendar-grid";
import { COPY, monthHeading } from "~/lib/copy";
import { CALENDAR_HEADERS, lunarLongLabel, lunarShortLabel, weekdayLong } from "~/lib/labels";
import { memorialColorCss } from "~/lib/memorial-colors";
import { cn } from "~/lib/utils";
import type { MemorialEvent } from "~/server/events";

interface MonthCalendarProps {
  events: MemorialEvent[];
  cursor: { year: number; month: number };
  selected: SolarDate;
  onCursorChange: (cursor: { year: number; month: number }) => void;
  onSelect: (date: SolarDate) => void;
}

export function MonthCalendar({
  events,
  cursor,
  selected,
  onCursorChange,
  onSelect,
}: MonthCalendarProps) {
  const today = useMemo(() => solarToday(), []);
  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const lunarByJdn = useMemo(() => {
    const map = new Map<number, ReturnType<typeof solarToLunar>>();
    for (const cell of cells) {
      map.set(solarToJdn(cell.date), solarToLunar(cell.date));
    }
    return map;
  }, [cells]);

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

  function changeMonth(delta: number) {
    const next = shiftMonth(cursor.year, cursor.month, delta);
    onCursorChange(next);
    onSelect({ ...next, day: 1 });
  }

  return (
    <section className="paper-card flex h-full flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          data-slot="card-title"
          className="calendar-month-title min-w-0 shrink font-heading text-[17px] font-semibold tracking-tight whitespace-nowrap text-[var(--ink)] sm:text-2xl"
        >
          {monthHeading(cursor.month, cursor.year)}
        </h2>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-[44px] min-h-[44px] min-w-[44px]"
            aria-label="Tháng trước"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="secondary"
            className="h-[44px] min-h-[44px] rounded-full px-4"
            onClick={() => {
              onCursorChange({ year: today.year, month: today.month });
              onSelect(today);
            }}
          >
            {COPY.todayControl}
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-[44px] min-h-[44px] min-w-[44px]"
            aria-label="Tháng sau"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {CALENDAR_HEADERS.map((header) => (
          <div
            key={header}
            className={cn(
              "py-1 text-center text-[12px] font-semibold",
              header === "CN" ? "text-[var(--lacquer)]" : "text-[var(--ink-muted)]",
            )}
          >
            {header}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 content-start gap-1">
        {cells.map((cell) => (
          <CalendarCellButton
            key={solarToJdn(cell.date)}
            cell={cell}
            lunar={lunarByJdn.get(solarToJdn(cell.date))!}
            isToday={compareSolar(cell.date, today) === 0}
            isSelected={compareSolar(cell.date, selected) === 0}
            dayEvents={eventsByJdn.get(solarToJdn(cell.date)) ?? []}
            onSelect={() => onSelect(cell.date)}
          />
        ))}
      </div>
    </section>
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
  const isSunday = dayOfWeek === 0;
  const isMungMot = lunar.day === 1;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      aria-label={`${weekdayLong(dayOfWeek)}, ${formatSolar(cell.date)}, âm lịch ${lunarLongLabel(lunar)}${dayEvents.length ? `, ${dayEvents.map((event) => event.title).join(", ")}` : ""}`}
      className={cn(
        "relative flex min-h-[52px] flex-col items-center justify-start overflow-hidden rounded-[14px] p-1 transition-colors duration-150 sm:min-h-[72px] sm:rounded-[16px] lg:min-h-[88px] sm:p-1.5",
        "hover:bg-[var(--paper)] focus-visible:ring-2 focus-visible:ring-[var(--lacquer)]",
        !cell.inMonth && "opacity-40",
        isSelected &&
          "bg-[color-mix(in_oklch,var(--lacquer)_8%,var(--cream-elevated))] ring-2 ring-[var(--lacquer)]",
        !isSelected && isToday && "ring-1 ring-[var(--ink-muted)]",
      )}
    >
      <span
        className={cn(
          "font-heading text-[17px] leading-none font-semibold tabular-nums sm:text-[20px]",
          isSunday || isMungMot ? "text-[var(--lacquer)]" : "text-[var(--ink)]",
          isToday && "underline decoration-2 underline-offset-2",
        )}
      >
        {cell.date.day}
      </span>
      <span className="mt-0.5 text-[10px] leading-none text-[var(--ink-muted)] tabular-nums sm:text-[11px]">
        {lunar.day === 1 ? lunarShortLabel(lunar) : lunar.day}
      </span>
      {dayEvents.length > 0 && (
        <span className="mt-1 flex w-full min-w-0 flex-wrap items-center justify-center gap-0.5 overflow-hidden">
          {dayEvents.slice(0, 4).map((event) => (
            <span
              key={event.id}
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: memorialColorCss(event.id) }}
              title={event.title}
            />
          ))}
        </span>
      )}
    </button>
  );
}

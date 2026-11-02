import { Pencil, Trash2 } from "lucide-react";
import { formatSolar, nextOccurrences, solarToday } from "@lunar/core";

import { NumberTicker } from "~/components/ui/number-ticker";
import { Button } from "~/components/ui/button";
import { COPY, lunarRule, lunarToSolarLine } from "~/lib/copy";
import { daysBetween } from "~/lib/labels";
import { memorialColorCss } from "~/lib/memorial-colors";
import { cn } from "~/lib/utils";
import type { MemorialEvent } from "~/server/events";

export function MemorialTicket({
  event,
  onEdit,
  onDelete,
  className,
}: {
  event: MemorialEvent;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}) {
  const today = solarToday();
  const upcoming = nextOccurrences(
    { lunarDay: event.lunarDay, lunarMonth: event.lunarMonth },
    today,
    3,
  );
  const next = upcoming[0];
  const following = upcoming.slice(1, 3).map(formatSolar);
  const accent = memorialColorCss(event.id);
  const daysLeft = next ? daysBetween(today, next) : 0;

  return (
    <article className={cn("paper-card relative overflow-hidden", className)}>
      <span
        className="absolute top-0 bottom-0 left-0 w-1.5"
        style={{ background: accent }}
        aria-hidden
      />

      <div className="p-4 pt-4 pr-4 pb-3 pl-5 sm:px-5 sm:pt-4 sm:pr-5 sm:pb-3 sm:pl-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-heading text-[17px] leading-snug font-semibold text-[var(--ink)] sm:text-lg">
              {event.title}
            </h3>
            <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
              {lunarRule(event.lunarDay, event.lunarMonth)}
            </p>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex shrink-0 gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="size-[44px] min-h-[44px] min-w-[44px]"
                  onClick={onEdit}
                  aria-label={`${COPY.edit} ${event.title}`}
                >
                  <Pencil className="size-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="size-[44px] min-h-[44px] min-w-[44px]"
                  onClick={onDelete}
                  aria-label={`${COPY.delete} ${event.title}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {following.length > 0 && (
          <p className="mt-2.5 text-[13px] leading-snug text-[var(--ink-muted)]">
            <span className="font-medium text-[var(--ink)]">{COPY.followingPrefix}</span>{" "}
            {following.join(" · ")}
          </p>
        )}
        {event.notes ? (
          <p className="mt-2.5 text-[13px] leading-snug text-[var(--ink-muted)]">{event.notes}</p>
        ) : null}
      </div>

      <div className="ticket-notch relative">
        <div className="perforation mx-4" />
      </div>
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 pl-5 sm:px-5 sm:pl-6"
        style={{
          background: `color-mix(in oklch, ${accent} 8%, var(--cream-elevated))`,
        }}
      >
        <div className="min-w-0">
          <p className="text-[12px] text-[var(--ink-muted)]">{COPY.nextOccurrence}</p>
          <p className="text-[15px] font-medium text-[var(--ink)] tabular-nums">
            {next ? formatSolar(next) : "—"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[12px] text-[var(--ink-muted)]">{COPY.remaining}</p>
          <p className="font-heading text-2xl leading-none font-semibold">
            <NumberTicker
              value={daysLeft}
              className="text-2xl font-semibold tabular-nums"
              style={{ color: accent }}
            />
            <span className="ml-1 font-sans text-sm font-medium text-[var(--ink-muted)]">
              {COPY.days}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}

export function MemorialRow({ event, onClick }: { event: MemorialEvent; onClick?: () => void }) {
  const today = solarToday();
  const next = nextOccurrences(
    { lunarDay: event.lunarDay, lunarMonth: event.lunarMonth },
    today,
    1,
  )[0];
  const accent = memorialColorCss(event.id);
  const daysLeft = next ? daysBetween(today, next) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={event.title}
      className="flex min-h-14 w-full items-stretch overflow-hidden rounded-[16px] border border-[var(--border-warm)] bg-[var(--cream-elevated)] text-left transition-colors hover:bg-[var(--paper)]"
    >
      <span className="w-1.5 shrink-0" style={{ background: accent }} aria-hidden />
      <span className="min-w-0 flex-1 px-3 py-2.5">
        <span className="block truncate text-[14px] font-medium text-[var(--ink)]">
          {event.title}
        </span>
        <span className="mt-0.5 block text-[12px] text-[var(--ink-muted)]">
          {next
            ? lunarToSolarLine(event.lunarDay, event.lunarMonth, formatSolar(next))
            : lunarRule(event.lunarDay, event.lunarMonth)}
        </span>
      </span>
      <span className="shrink-0 border-l border-dashed border-[var(--border-warm)] px-3 py-2.5 text-right">
        <span className="block text-[11px] text-[var(--ink-muted)]">{COPY.remaining}</span>
        <span className="font-heading font-semibold tabular-nums">
          <NumberTicker
            value={daysLeft}
            className="font-semibold tabular-nums"
            style={{ color: accent }}
          />
          <span className="text-[var(--ink-muted)]"> {COPY.days}</span>
        </span>
      </span>
    </button>
  );
}

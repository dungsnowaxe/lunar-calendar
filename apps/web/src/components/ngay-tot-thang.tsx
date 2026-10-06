import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { solarDayOfWeek, solarToLunar, solarToday } from "@lunar/core";
import { VIEC_LABEL, scoreDay, type Viec } from "@lunar/ngay-tot";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ChuSuPicker } from "~/components/chu-su-picker";
import { NgayChatLuong } from "~/components/ngay-chat-luong";
import { shiftMonth } from "~/lib/calendar-grid";
import { chuSuDuocChon } from "~/lib/chu-su";
import { monthTitle } from "~/lib/labels";
import { DANH_GIA_LOAI, lyDoChinh, ngayTrongThang } from "~/lib/ngay-tot";
import { useChuSu } from "~/hooks/use-chu-su";
import { cn } from "~/lib/utils";

const VIEC: Viec = "cat-toc";

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

interface NgayTotThangProps {
  year: number;
  month: number;
  /** The day whose breakdown is open, or null to fall back to the month's best. */
  day: number | null;
}

/**
 * A solar month of ngày tốt for one việc, ranked.
 *
 * Both the month and the open day live in the URL rather than in component state.
 * That makes any day of any month server-rendered and shareable — a crawler, a
 * reader's bookmark, and a test all see exactly the HTML a click would produce.
 *
 * Ranked best first, ties in date order, so the same month always reads the same
 * way. Days are ranked and never filtered: a ngày xung lowers a day's score and
 * can push it down the list, but it cannot remove it — the spec forbids a veto,
 * and a month that silently dropped its worst days would be far more misleading
 * than one that shows them ranked last.
 */
export function NgayTotThang({ year, month, day }: NgayTotThangProps) {
  const today = useMemo(() => solarToday(), []);
  const { state } = useChuSu();

  const days = useMemo(() => {
    const chuSu = chuSuDuocChon(state);
    return ngayTrongThang(year, month).map((date) => scoreDay(date, VIEC, chuSu));
  }, [year, month, state]);

  const ranked = useMemo(
    () => [...days].sort((a, b) => b.score - a.score || a.date.day - b.date.day),
    [days],
  );

  // Falls back to the month's best day rather than to nothing, so a full
  // breakdown is present in the server-rendered HTML with no interaction at all.
  // A `day` that is not in this month simply fails to match and falls back.
  const selected = ranked.find((q) => q.date.day === day) ?? ranked[0]!;

  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <MonthLink to={previous} label="Tháng trước" icon={ArrowLeft01Icon} />
        <h2 className="font-heading text-base font-semibold">{monthTitle(year, month)}</h2>
        <MonthLink to={next} label="Tháng sau" icon={ArrowRight01Icon} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardContent className="flex flex-col gap-0.5">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Xếp theo điểm cho việc {VIEC_LABEL[VIEC]}
            </p>
            {ranked.map((q) => {
              const lunar = solarToLunar(q.date);
              const isToday =
                q.date.day === today.day &&
                q.date.month === today.month &&
                q.date.year === today.year;
              const isOpen = selected.date.day === q.date.day;
              const reason = lyDoChinh(q);
              return (
                <Link
                  key={q.date.day}
                  to="/ngay-tot-cat-toc"
                  search={{ nam: year, thang: month, ngay: q.date.day }}
                  aria-current={isOpen}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-muted/60",
                    isOpen && "bg-muted",
                  )}
                >
                  <span className="w-14 shrink-0 text-sm tabular-nums">
                    <span className={cn("font-medium", isToday && "text-primary")}>
                      {q.date.day}
                    </span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {WEEKDAY_SHORT[solarDayOfWeek(q.date)]}
                    </span>
                  </span>
                  <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">
                    {lunar.day}/{lunar.month}
                  </span>
                  <Badge className={cn(DANH_GIA_LOAI[q.danhGia], "w-24 justify-center")}>
                    {q.danhGia}
                  </Badge>
                  <span className="w-8 shrink-0 text-sm font-medium tabular-nums">{q.score}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {reason === null ? "" : reason.rule}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <ChuSuPicker />
          <NgayChatLuong quality={selected} />
        </div>
      </div>
    </div>
  );
}

function MonthLink({
  to,
  label,
  icon,
}: {
  to: { year: number; month: number };
  label: string;
  icon: typeof ArrowLeft01Icon;
}) {
  return (
    <Link
      to="/ngay-tot-cat-toc"
      search={{ nam: to.year, thang: to.month }}
      aria-label={label}
      className={buttonVariants({ variant: "outline", size: "icon-sm" })}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </Link>
  );
}

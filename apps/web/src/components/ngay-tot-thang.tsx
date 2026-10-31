import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  LayoutTable01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import {
  MAX_SOLAR_YEAR,
  MIN_SOLAR_YEAR,
  solarDayOfWeek,
  solarToLunar,
  solarToday,
} from "@lunar/core";
import { scoreDay, type DanhGia } from "@lunar/ngay-tot";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { ChuSuPicker } from "~/components/chu-su-picker";
import { NgayChatLuong } from "~/components/ngay-chat-luong";
import { shiftMonth } from "~/lib/calendar-grid";
import { chuSuDuocChon } from "~/lib/chu-su";
import { CALENDAR_HEADERS, lunarShortLabel, weekdayLong } from "~/lib/labels";
import { DANH_GIA_LOAI, TIN_NGUONG_DAN_GIAN, ngayTrongThang } from "~/lib/ngay-tot";
import {
  COLUMNS,
  DEFAULT_SORT,
  buildRows,
  nextSort,
  sortLabel,
  sortRows,
  type DayRow,
  type SortKey,
  type SortOrder,
} from "~/lib/ngay-tot-bang";
import { withViewTransition } from "~/lib/view-transition";
import { useChuSu } from "~/hooks/use-chu-su";
import { cn } from "~/lib/utils";

const DAY_TONE: Record<DanhGia, string> = {
  "Rất tốt": "good",
  Tốt: "good",
  "Trung bình": "neutral",
  Xấu: "poor",
  "Rất xấu": "poor",
};

interface NgayTotThangProps {
  year: number;
  month: number;
  day: number | null;
}

/** Calendar and ranking share the same scores. Selection stays server-rendered and shareable. */
export function NgayTotThang({ year, month, day }: NgayTotThangProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [order, setOrder] = useState<SortOrder>(DEFAULT_SORT);
  const today = useMemo(() => solarToday(), []);
  const { state } = useChuSu();
  const days = useMemo(() => {
    const chuSu = chuSuDuocChon(state);
    return ngayTrongThang(year, month).map((date) => scoreDay(date, "cat-toc", chuSu));
  }, [year, month, state]);
  const rows = useMemo(() => buildRows(days, today), [days, today]);
  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.quality.score - a.quality.score || a.day - b.day),
    [rows],
  );
  const listed = useMemo(() => sortRows(rows, order), [rows, order]);
  const selectedRow = ranked.find((row) => row.day === day) ?? ranked[0]!;
  const selected = selectedRow.quality;
  const lunar = solarToLunar(selected.date);
  const reason = selectedRow.reason;
  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const lead = (solarDayOfWeek(days[0]!.date) + 6) % 7;
  const trailing = (7 - ((lead + days.length) % 7)) % 7;
  const chuSu = chuSuDuocChon(state);

  return (
    <div className="haircut-workspace" data-view={view}>
      <section
        id="haircut-days"
        className="haircut-calendar min-w-0"
        aria-label="Lịch chọn ngày cắt tóc"
      >
        <fieldset className="haircut-view-switch">
          <legend className="sr-only">Cách xem ngày cắt tóc</legend>
          <button
            type="button"
            aria-label="Xem lịch tháng"
            title="Lịch tháng"
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
          >
            <HugeiconsIcon icon={Calendar03Icon} size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Xem bảng"
            title="Bảng"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <HugeiconsIcon
              icon={LayoutTable01Icon}
              size={20}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        </fieldset>
        <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
          <MonthLink to={previous} label="Tháng trước" icon={ArrowLeft01Icon} />
          <h2 className="flex-1 text-center font-heading text-xl sm:text-2xl">
            Tháng {month}, {year}
          </h2>
          <MonthLink to={next} label="Tháng sau" icon={ArrowRight01Icon} />
        </div>
        {view === "calendar" ? (
          <div key="calendar" className="haircut-view-pane">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Số nhỏ là ngày âm lịch.
              </p>
              <Link
                to="/ngay-tot-cat-toc"
                search={{ nam: today.year, thang: today.month, ngay: today.day }}
                resetScroll={false}
                className="flex min-h-11 items-center px-2 text-xs font-medium text-primary underline underline-offset-4"
              >
                Hôm nay
              </Link>
            </div>
            <div className="haircut-month">
              {CALENDAR_HEADERS.map((label) => (
                <div key={label} className="haircut-weekday">
                  {label}
                </div>
              ))}
              {Array.from({ length: lead }, (_, i) => (
                <div key={`lead-${i}`} className="haircut-empty" aria-hidden="true" />
              ))}
              {days.map((q) => {
                const l = solarToLunar(q.date);
                const isToday =
                  q.date.day === today.day && month === today.month && year === today.year;
                const isSelected = q.date.day === selected.date.day;
                return (
                  <Link
                    key={q.date.day}
                    to="/ngay-tot-cat-toc"
                    search={{ nam: year, thang: month, ngay: q.date.day }}
                    resetScroll={false}
                    aria-current={isSelected ? "true" : undefined}
                    aria-label={`${weekdayLong(solarDayOfWeek(q.date))}, ${q.date.day}/${month}/${year}, âm lịch ${lunarShortLabel(l)}, ${q.danhGia}, ${q.score}/100${isToday ? ", hôm nay" : ""}`}
                    className={cn("haircut-day", isToday && "is-today")}
                  >
                    <span className="haircut-solar">{q.date.day}</span>
                    <span className="haircut-lunar">{lunarShortLabel(l)}</span>
                    <span
                      className="haircut-dot"
                      data-tone={DAY_TONE[q.danhGia]}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
              {Array.from({ length: trailing }, (_, i) => (
                <div key={`tail-${i}`} className="haircut-empty" aria-hidden="true" />
              ))}
            </div>
            <div className="haircut-legend">
              <span>
                <i className="haircut-dot" data-tone="good" />
                Tốt / Rất tốt
              </span>
              <span>
                <i className="haircut-dot" data-tone="neutral" />
                Trung bình
              </span>
              <span>
                <i className="haircut-dot" data-tone="poor" />
                Xấu / Rất xấu
              </span>
            </div>
          </div>
        ) : (
          <div key="list" className="haircut-view-pane">
            <DayTable
              rows={listed}
              order={order}
              onSort={(key) => withViewTransition(() => setOrder(nextSort(order, key)))}
              selectedDay={selected.date.day}
              year={year}
              month={month}
            />
          </div>
        )}
      </section>

      <aside
        id="haircut-detail"
        className="haircut-detail min-w-0"
        aria-label="Chi tiết ngày đã chọn"
      >
        <div aria-live="polite" aria-atomic="true">
          {view === "list" && (
            <a
              href="#haircut-days"
              className="mb-4 flex min-h-11 items-center text-xs text-primary underline underline-offset-4 lg:hidden"
            >
              ← Quay lại danh sách
            </a>
          )}
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Ngày đang xem
          </p>
          <div className="my-4 flex items-center gap-5">
            <span className="w-[2ch] shrink-0 text-center font-heading text-7xl leading-none text-primary tabular-nums md:text-8xl">
              {selected.date.day}
            </span>
            <div>
              <h2 className="font-heading text-xl">{weekdayLong(solarDayOfWeek(selected.date))}</h2>
              <p className="mt-1 text-sm">
                Tháng {month}, {year}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {lunarShortLabel(lunar)} âm lịch{lunar.isLeapMonth ? " (nhuận)" : ""}
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">
              Điểm cho việc cắt tóc · {chuSu ? `${chuSu.ten} (${chuSu.tuoi})` : "Chưa xét tuổi"}
            </p>
            <div className="my-3 flex items-center gap-4">
              <p className="font-heading text-4xl tabular-nums">
                {selected.score}
                <span className="text-xl text-muted-foreground"> / 100</span>
              </p>
              <Badge className={cn(DANH_GIA_LOAI[selected.danhGia], "px-3 py-1 text-sm")}>
                {selected.danhGia}
              </Badge>
            </div>
            {reason && (
              <p className="text-sm leading-relaxed text-muted-foreground">{reason.explanation}</p>
            )}
          </div>
        </div>
        <details className="haircut-disclosure mt-5" key={`${year}-${month}-${selected.date.day}`}>
          <summary className="haircut-score-toggle">
            Xem cách tính điểm <span aria-hidden="true">＋</span>
          </summary>
          <div className="haircut-breakdown mt-5">
            <NgayChatLuong quality={selected} />
          </div>
        </details>
        <details className="haircut-disclosure mt-6 border-t border-border pt-5">
          <summary className="flex min-h-11 items-center justify-between gap-3 font-heading text-lg">
            Chọn tuổi của bạn{" "}
            <span className="text-xs font-sans text-muted-foreground">Tùy chọn ＋</span>
          </summary>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Xem điểm theo tuổi Can–Chi. Chỉ lưu trên thiết bị của bạn.
          </p>
          <div className="haircut-person mt-5">
            <ChuSuPicker />
          </div>
        </details>
        <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
          {TIN_NGUONG_DAN_GIAN}
        </p>
      </aside>

      {view === "calendar" && (
        <section className="haircut-ranking min-w-0" aria-label="Xếp hạng các ngày trong tháng">
          <h2 className="mb-5 font-heading text-xl">Điểm cao trong tháng</h2>
          <div className="haircut-picks">
            {ranked.slice(0, 3).map((row) => (
              <Link
                key={row.day}
                to="/ngay-tot-cat-toc"
                search={{ nam: year, thang: month, ngay: row.day }}
                resetScroll={false}
                aria-current={selected.date.day === row.day ? "true" : undefined}
                data-past={row.isBeforeToday || undefined}
                className="haircut-pick"
              >
                <span className="font-heading text-4xl leading-none">
                  {row.day}
                  <span className="text-base text-muted-foreground">/{month}</span>
                </span>
                <span className="mt-2 text-xs text-muted-foreground">
                  {weekdayLong(solarDayOfWeek(row.quality.date))}
                </span>
                <Badge className={cn(DANH_GIA_LOAI[row.quality.danhGia], "mt-3 self-start")}>
                  {row.quality.danhGia} · {row.quality.score}
                </Badge>
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="mt-6 flex min-h-11 w-full items-center justify-between border-t border-border pt-3 text-sm text-primary"
            onClick={() => {
              setView("list");
              document.getElementById("haircut-days")?.scrollIntoView({ block: "start" });
            }}
          >
            Xem tất cả {days.length} ngày <span aria-hidden="true">→</span>
          </button>
        </section>
      )}
    </div>
  );
}

interface DayTableProps {
  rows: readonly DayRow[];
  order: SortOrder;
  onSort: (key: SortKey) => void;
  selectedDay: number;
  year: number;
  month: number;
}

function DayTable({ rows, order, onSort, selectedDay, year, month }: DayTableProps) {
  return (
    <div className="haircut-table-view">
      <p className="sr-only" aria-live="polite">
        {sortLabel(order)}
      </p>
      <Table className="haircut-table">
        <TableCaption className="sr-only">
          Đánh giá từng ngày cho việc cắt tóc, xếp theo {sortLabel(order)}
        </TableCaption>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <SortHead key={col.key} col={col} order={order} onSort={onSort} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <DayTableRow
              key={row.day}
              row={row}
              selected={row.day === selectedDay}
              year={year}
              month={month}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function isSortableColumn(
  col: (typeof COLUMNS)[number],
): col is Extract<
  (typeof COLUMNS)[number],
  { sort: { defaultDirection: SortOrder["direction"] } }
> {
  return "sort" in col;
}

function SortHead({
  col,
  order,
  onSort,
}: {
  col: (typeof COLUMNS)[number];
  order: SortOrder;
  onSort: (key: SortKey) => void;
}) {
  const sortable = isSortableColumn(col);
  const active = sortable && col.key === order.key;
  return (
    <TableHead
      scope="col"
      aria-sort={active ? (order.direction === "asc" ? "ascending" : "descending") : undefined}
      data-hide-below-sm={"hideBelowSm" in col && col.hideBelowSm ? true : undefined}
      data-align={"align" in col ? col.align : undefined}
    >
      {sortable ? (
        <button
          type="button"
          className="haircut-sort-header"
          data-active={active || undefined}
          data-direction={active ? order.direction : undefined}
          aria-label={`Sắp xếp theo ${col.label}`}
          onClick={() => onSort(col.key)}
        >
          {col.label}
          <HugeiconsIcon icon={ArrowUp01Icon} size={14} aria-hidden="true" />
        </button>
      ) : (
        col.label
      )}
    </TableHead>
  );
}

function DayTableRow({
  row,
  selected,
  year,
  month,
}: {
  row: DayRow;
  selected: boolean;
  year: number;
  month: number;
}) {
  return (
    <TableRow
      data-past={row.isBeforeToday || undefined}
      data-today={row.isToday || undefined}
      style={{ viewTransitionName: `haircut-day-${row.day}` }}
    >
      <TableCell>
        <Link
          to="/ngay-tot-cat-toc"
          search={{ nam: year, thang: month, ngay: row.day }}
          hash="haircut-detail"
          resetScroll={false}
          aria-label={`Xem chi tiết ngày ${row.day}/${month}/${year}`}
          aria-current={selected ? "true" : undefined}
          className="haircut-table-date"
        >
          <span>{row.day}</span>
          <span>
            {row.weekday} · {row.lunar} âm lịch
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <Badge className={DANH_GIA_LOAI[row.quality.danhGia]}>{row.quality.danhGia}</Badge>
      </TableCell>
      <TableCell data-align="end" className="font-medium tabular-nums">
        {row.quality.score}
        <span className="sr-only"> trên 100</span>
      </TableCell>
      <TableCell data-hide-below-sm>{row.reason?.rule ?? "—"}</TableCell>
    </TableRow>
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
  const disabled = to.year < MIN_SOLAR_YEAR || to.year > MAX_SOLAR_YEAR;
  const className = cn(buttonVariants({ variant: "outline", size: "icon" }), "size-11 shrink-0");
  if (disabled)
    return (
      <span aria-label={label} aria-disabled="true" className={cn(className, "opacity-30")}>
        <HugeiconsIcon icon={icon} strokeWidth={1.5} />
      </span>
    );
  return (
    <Link
      to="/ngay-tot-cat-toc"
      search={{ nam: to.year, thang: to.month }}
      resetScroll={false}
      aria-label={label}
      className={className}
    >
      <HugeiconsIcon icon={icon} strokeWidth={1.5} />
    </Link>
  );
}

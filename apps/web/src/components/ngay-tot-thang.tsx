import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  LayoutTable01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import {
  MAX_SOLAR_YEAR,
  MIN_SOLAR_YEAR,
  solarDayOfWeek,
  solarToLunar,
  solarToday,
} from "@lunar/core";
import { scoreDay, DANH_GIA, type DanhGia } from "@lunar/ngay-tot";
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
import { DANH_GIA_LOAI, TIN_NGUONG_DAN_GIAN, lyDoChinh, ngayTrongThang } from "~/lib/ngay-tot";
import { useChuSu } from "~/hooks/use-chu-su";
import { cn } from "~/lib/utils";

const DAY_TONE: Record<DanhGia, string> = {
  "Rất tốt": "good",
  Tốt: "good",
  "Trung bình": "neutral",
  Xấu: "poor",
  "Rất xấu": "poor",
};

const SORT_COLUMNS = [
  { key: "date", label: "Ngày dương" },
  { key: "lunar", label: "Âm lịch" },
  { key: "assessment", label: "Đánh giá" },
  { key: "score", label: "Điểm" },
  { key: "reason", label: "Lý do nổi bật" },
] as const;
type SortKey = (typeof SORT_COLUMNS)[number]["key"];

interface NgayTotThangProps {
  year: number;
  month: number;
  day: number | null;
}

/** Calendar and ranking share the same scores. Selection stays server-rendered and shareable. */
export function NgayTotThang({ year, month, day }: NgayTotThangProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [sort, setSort] = useState<SortKey>("score");
  const [sortDirections, setSortDirections] = useState<Record<SortKey, "asc" | "desc">>({
    date: "asc",
    lunar: "asc",
    assessment: "desc",
    score: "desc",
    reason: "asc",
  });
  const direction = sortDirections[sort];
  const today = useMemo(() => solarToday(), []);
  const { state } = useChuSu();
  const days = useMemo(() => {
    const chuSu = chuSuDuocChon(state);
    return ngayTrongThang(year, month).map((date) => scoreDay(date, "cat-toc", chuSu));
  }, [year, month, state]);
  const ranked = useMemo(
    () => [...days].sort((a, b) => b.score - a.score || a.date.day - b.date.day),
    [days],
  );
  const listed = useMemo(
    () =>
      [...days].sort((a, b) => {
        let comparison: number;
        switch (sort) {
          case "date":
            comparison = a.date.day - b.date.day;
            break;
          case "lunar": {
            const left = solarToLunar(a.date);
            const right = solarToLunar(b.date);
            comparison =
              left.year - right.year ||
              left.month - right.month ||
              Number(left.isLeapMonth) - Number(right.isLeapMonth) ||
              left.day - right.day;
            break;
          }
          case "assessment":
            comparison = DANH_GIA.indexOf(a.danhGia) - DANH_GIA.indexOf(b.danhGia);
            break;
          case "reason":
            comparison = (lyDoChinh(a)?.rule ?? "").localeCompare(lyDoChinh(b)?.rule ?? "", "vi");
            break;
          case "score":
            comparison = a.score - b.score;
            break;
        }
        return (direction === "asc" ? comparison : -comparison) || a.date.day - b.date.day;
      }),
    [days, sort, direction],
  );

  function toggleDirection(key: SortKey) {
    setSortDirections((previous) => ({
      ...previous,
      [key]: previous[key] === "asc" ? "desc" : "asc",
    }));
  }

  function changeSort(key: SortKey) {
    if (key === sort) toggleDirection(key);
    setSort(key);
  }
  const selected = ranked.find((q) => q.date.day === day) ?? ranked[0]!;
  const lunar = solarToLunar(selected.date);
  const reason = lyDoChinh(selected);
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
            aria-label="Xem bảng hoặc thẻ"
            title="Bảng / thẻ"
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
          <>
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
          </>
        ) : (
          <>
            <div className="my-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>{days.length} ngày · Gồm cả ngày đã qua</p>
              <div className="flex items-center gap-2 md:hidden">
                <label className="flex items-center gap-2" htmlFor="haircut-sort">
                  Sắp xếp
                </label>
                <select
                  id="haircut-sort"
                  className="min-h-11 rounded-md border border-border bg-background px-2 text-foreground"
                  value={sort}
                  onChange={(event) => {
                    const column = SORT_COLUMNS.find((column) => column.key === event.target.value);
                    if (column) changeSort(column.key);
                  }}
                >
                  {SORT_COLUMNS.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-md border border-border text-foreground"
                  aria-label={
                    direction === "asc"
                      ? "Đang tăng dần, đổi sang giảm dần"
                      : "Đang giảm dần, đổi sang tăng dần"
                  }
                  onClick={() => toggleDirection(sort)}
                >
                  <HugeiconsIcon
                    icon={direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
                    size={18}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p className="hidden md:block">Nhấn tiêu đề cột để sắp xếp</p>
            </div>
            <div className="haircut-table-view">
              <Table className="haircut-table">
                <TableCaption className="sr-only">
                  Đánh giá từng ngày cho việc cắt tóc, xếp theo{" "}
                  {SORT_COLUMNS.find((column) => column.key === sort)?.label},{" "}
                  {direction === "asc" ? "tăng dần" : "giảm dần"}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    {SORT_COLUMNS.map((column) => (
                      <TableHead
                        key={column.key}
                        scope="col"
                        aria-sort={
                          sort === column.key
                            ? direction === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={() => changeSort(column.key)}
                          className="haircut-sort-header"
                          aria-label={`Sắp xếp theo ${column.label}`}
                        >
                          {column.label}
                          <HugeiconsIcon
                            icon={
                              sortDirections[column.key] === "asc" ? ArrowUp01Icon : ArrowDown01Icon
                            }
                            size={15}
                            aria-hidden="true"
                          />
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listed.map((q) => (
                    <TableRow key={q.date.day} data-selected={q.date.day === selected.date.day}>
                      <TableCell>
                        <Link
                          to="/ngay-tot-cat-toc"
                          search={{ nam: year, thang: month, ngay: q.date.day }}
                          hash="haircut-detail"
                          resetScroll={false}
                          aria-label={`Xem chi tiết ngày ${q.date.day}/${month}/${year}`}
                          aria-current={q.date.day === selected.date.day ? "true" : undefined}
                          className="haircut-table-date"
                        >
                          <span className="font-heading text-xl tabular-nums">
                            {q.date.day}/{month}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {weekdayLong(solarDayOfWeek(q.date))}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {lunarShortLabel(solarToLunar(q.date))}
                      </TableCell>
                      <TableCell>
                        <Badge className={DANH_GIA_LOAI[q.danhGia]}>{q.danhGia}</Badge>
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {q.score}
                        <span className="sr-only"> trên 100</span>
                      </TableCell>
                      <TableCell className="text-xs leading-relaxed text-muted-foreground">
                        {lyDoChinh(q)?.rule ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="haircut-day-cards" aria-label="Danh sách ngày cắt tóc">
              {listed.map((q) => (
                <li key={q.date.day}>
                  <Link
                    to="/ngay-tot-cat-toc"
                    search={{ nam: year, thang: month, ngay: q.date.day }}
                    hash="haircut-detail"
                    resetScroll={false}
                    aria-current={q.date.day === selected.date.day ? "true" : undefined}
                    className="haircut-day-card"
                  >
                    <div className="haircut-card-date">
                      <span className="font-heading text-5xl leading-none tabular-nums">
                        {q.date.day}
                      </span>
                      <span className="mt-2 text-sm text-muted-foreground">/{month}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {weekdayLong(solarDayOfWeek(q.date))}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {lunarShortLabel(solarToLunar(q.date))} âm lịch
                        </span>
                      </p>
                      <div className="my-3 flex flex-wrap items-center gap-3">
                        <Badge className={DANH_GIA_LOAI[q.danhGia]}>{q.danhGia}</Badge>
                        <span className="font-heading text-xl tabular-nums">
                          {q.score}
                          <span className="text-xs text-muted-foreground"> / 100</span>
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {lyDoChinh(q)?.rule ?? "—"}
                      </p>
                    </div>
                    <span className="haircut-card-action">
                      Xem chi tiết <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
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
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-xl">Điểm cao trong tháng</h2>
            <span className="text-xs text-muted-foreground">Xếp theo điểm, gồm cả ngày đã qua</span>
          </div>
          <div className="haircut-picks">
            {ranked.slice(0, 3).map((q) => (
              <Link
                key={q.date.day}
                to="/ngay-tot-cat-toc"
                search={{ nam: year, thang: month, ngay: q.date.day }}
                resetScroll={false}
                aria-current={selected.date.day === q.date.day ? "true" : undefined}
                className="haircut-pick"
              >
                <span className="font-heading text-4xl leading-none">
                  {q.date.day}
                  <span className="text-base text-muted-foreground">/{month}</span>
                </span>
                <span className="mt-2 text-xs text-muted-foreground">
                  {weekdayLong(solarDayOfWeek(q.date))}
                </span>
                <Badge className={cn(DANH_GIA_LOAI[q.danhGia], "mt-3 self-start")}>
                  {q.danhGia} · {q.score}
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

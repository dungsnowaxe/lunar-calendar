import { solarDayOfWeek, solarToJdn, solarToLunar, type SolarDate } from "@lunar/core";
import { DANH_GIA, type Contribution, type DayQuality } from "@lunar/ngay-tot";
import { CALENDAR_HEADERS, lunarShortLabel } from "./labels.ts";
import { lyDoChinh } from "./ngay-tot.ts";

export interface DayRow {
  readonly quality: DayQuality;
  readonly day: number;
  readonly weekday: string;
  readonly lunar: string;
  readonly reason: Contribution | null;
  readonly isToday: boolean;
  /** Strictly before today. Muted in the list so the copy "gồm cả ngày đã qua" is unnecessary. */
  readonly isPast: boolean;
}

export type SortDirection = "asc" | "desc";

interface Sortable {
  readonly defaultDirection: SortDirection;
  /** Ascending compare. Direction is applied by `sortRows`, never inside `compare`. */
  readonly compare: (a: DayRow, b: DayRow) => number;
}

export type Column =
  | {
      readonly key: string;
      readonly label: string;
      readonly align?: "start" | "end";
      readonly sort: Sortable;
      readonly hideBelowSm?: never;
    }
  | {
      readonly key: string;
      readonly label: string;
      readonly align?: "start" | "end";
      readonly sort?: never;
      readonly hideBelowSm?: boolean;
    };

export const COLUMNS = [
  {
    key: "date",
    label: "Ngày",
    sort: { defaultDirection: "asc", compare: (a: DayRow, b: DayRow) => a.day - b.day },
  },
  {
    key: "assessment",
    label: "Đánh giá",
    sort: {
      defaultDirection: "desc",
      compare: (a: DayRow, b: DayRow) =>
        DANH_GIA.indexOf(a.quality.danhGia) - DANH_GIA.indexOf(b.quality.danhGia),
    },
  },
  {
    key: "score",
    label: "Điểm",
    align: "end",
    sort: {
      defaultDirection: "desc",
      compare: (a: DayRow, b: DayRow) => a.quality.score - b.quality.score,
    },
  },
  { key: "reason", label: "Lý do nổi bật", hideBelowSm: true },
] as const satisfies readonly Column[];

export type SortKey = Extract<(typeof COLUMNS)[number], { sort: Sortable }>["key"];

export interface SortOrder {
  readonly key: SortKey;
  readonly direction: SortDirection;
}

export const DEFAULT_SORT: SortOrder = { key: "score", direction: "desc" };

function sortableColumn(key: SortKey) {
  for (const col of COLUMNS) {
    if (col.key === key && "sort" in col) return col;
  }
  throw new Error(`unknown sort key: ${key}`);
}

export function nextSort(current: SortOrder, key: SortKey): SortOrder {
  if (key === current.key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { key, direction: sortableColumn(key).sort.defaultDirection };
}

export function sortRows(rows: readonly DayRow[], order: SortOrder): DayRow[] {
  const { compare } = sortableColumn(order.key).sort;
  return [...rows].sort(
    (a, b) => (order.direction === "asc" ? compare(a, b) : compare(b, a)) || a.day - b.day,
  );
}

export function buildRows(days: readonly DayQuality[], today: SolarDate): DayRow[] {
  const todayJdn = solarToJdn(today);
  return days.map((quality) => {
    const { date } = quality;
    return {
      quality,
      day: date.day,
      weekday: CALENDAR_HEADERS[(solarDayOfWeek(date) + 6) % 7] ?? "",
      lunar: lunarShortLabel(solarToLunar(date)),
      reason: lyDoChinh(quality),
      isToday: date.day === today.day && date.month === today.month && date.year === today.year,
      isPast: solarToJdn(date) < todayJdn,
    };
  });
}

export function sortLabel(order: SortOrder): string {
  const direction = order.direction === "asc" ? "tăng dần" : "giảm dần";
  return `${sortableColumn(order.key).label}, ${direction}`;
}

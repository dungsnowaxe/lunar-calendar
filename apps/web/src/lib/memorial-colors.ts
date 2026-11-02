import { z } from "zod";

/** Memorial identity palette — 8 hues that sit with cream/lacquer. */

export const MEMORIAL_COLORS = [
  { id: "persimmon", label: "Hồng đỏ", cssVar: "--color-mem-persimmon" },
  { id: "marigold", label: "Cúc vàng", cssVar: "--color-mem-marigold" },
  { id: "olive", label: "Ô liu", cssVar: "--color-mem-olive" },
  { id: "jade", label: "Ngọc / teal", cssVar: "--color-mem-jade" },
  { id: "indigo", label: "Chàm đá", cssVar: "--color-mem-indigo" },
  { id: "plum", label: "Mận tím", cssVar: "--color-mem-plum" },
  { id: "rose", label: "Hồng gạch", cssVar: "--color-mem-rose" },
  { id: "moss", label: "Rêu", cssVar: "--color-mem-moss" },
] as const;

export type MemorialColorId = (typeof MEMORIAL_COLORS)[number]["id"];

export const MEMORIAL_COLOR_IDS: MemorialColorId[] = MEMORIAL_COLORS.map((c) => c.id);

export const memorialColorIdSchema = z.enum([
  "persimmon",
  "marigold",
  "olive",
  "jade",
  "indigo",
  "plum",
  "rose",
  "moss",
]);

export const MEMORIAL_COLOR_STORAGE_KEY = "memorial-color-ids";

export function memorialColorCss(id: MemorialColorId): string {
  return `var(--color-mem-${id})`;
}

/** Next unused palette slot; wraps if all 8 are taken. */
export function nextUnusedMemorialColor(used: MemorialColorId[]): MemorialColorId {
  const hit = MEMORIAL_COLORS.find((c) => !used.includes(c.id));
  if (hit) return hit.id;
  return MEMORIAL_COLORS[used.length % MEMORIAL_COLORS.length]!.id;
}

export function isMemorialColorId(value: unknown): value is MemorialColorId {
  return typeof value === "string" && MEMORIAL_COLOR_IDS.some((id) => id === value);
}

export interface MemorialColorCarrier {
  id: string;
  createdAt?: string | null;
  colorId?: MemorialColorId | null;
}

export interface ColoredMemorial {
  id: string;
  title: string;
  lunarDay: number;
  lunarMonth: number;
  notes: string | null;
  createdAt?: string;
  colorId: MemorialColorId;
}

/**
 * One-time assignment for memorials missing `colorId`.
 *
 * Sort by creation time ascending (fallback: current list order, then id).
 * When none have a color, assign `palette[i % 8]`. When some already have
 * colors, keep them and give the rest `nextUnusedMemorialColor`. Already-colored
 * memorials are never reshuffled.
 */
export function migrateMemorialColors<T extends MemorialColorCarrier>(
  events: readonly T[],
): Array<T & { colorId: MemorialColorId }> {
  if (events.length === 0) return [];

  const sorted = stableCreationOrder(events);
  const allMissing = events.every((event) => !isMemorialColorId(event.colorId));

  if (allMissing) {
    const byId = new Map(
      sorted.map((event, index) => [
        event.id,
        MEMORIAL_COLOR_IDS[index % MEMORIAL_COLOR_IDS.length]!,
      ]),
    );
    return events.map((event) => ({ ...event, colorId: byId.get(event.id)! }));
  }

  const used: MemorialColorId[] = [];
  const assigned = new Map<string, MemorialColorId>();
  for (const event of sorted) {
    if (isMemorialColorId(event.colorId)) {
      assigned.set(event.id, event.colorId);
      used.push(event.colorId);
    }
  }
  for (const event of sorted) {
    if (assigned.has(event.id)) continue;
    const colorId = nextUnusedMemorialColor(used);
    assigned.set(event.id, colorId);
    used.push(colorId);
  }

  return events.map((event) => ({ ...event, colorId: assigned.get(event.id)! }));
}

/** Creation time ascending; invalid timestamps keep list order, then id. */
export function stableCreationOrder<T extends MemorialColorCarrier>(events: readonly T[]): T[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const timeA = parseTime(a.event.createdAt);
      const timeB = parseTime(b.event.createdAt);
      if (timeA !== null && timeB !== null && timeA !== timeB) return timeA - timeB;
      if (timeA !== null && timeB === null) return -1;
      if (timeA === null && timeB !== null) return 1;
      if (a.index !== b.index) return a.index - b.index;
      return a.event.id.localeCompare(b.event.id);
    })
    .map(({ event }) => event);
}

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function readStoredMemorialColors(): Record<string, MemorialColorId> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEMORIAL_COLOR_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const result: Record<string, MemorialColorId> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (isMemorialColorId(value)) result[id] = value;
    }
    return result;
  } catch {
    return {};
  }
}

export function writeStoredMemorialColors(map: Record<string, MemorialColorId>): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(MEMORIAL_COLOR_STORAGE_KEY, JSON.stringify(map));
}

/**
 * Resolve colors for a loaded list: database wins, then localStorage, then
 * migrate. Newly assigned colors are merged into the store without overwriting
 * existing entries (never reshuffle).
 */
export function resolveMemorialColors<T extends MemorialColorCarrier>(
  events: readonly T[],
  stored: Record<string, MemorialColorId> = {},
): {
  events: Array<T & { colorId: MemorialColorId }>;
  store: Record<string, MemorialColorId>;
  persist: Array<{ id: string; colorId: MemorialColorId }>;
} {
  const nextStore: Record<string, MemorialColorId> = { ...stored };
  const persist: Array<{ id: string; colorId: MemorialColorId }> = [];

  const prepared = events.map((event) => {
    if (isMemorialColorId(event.colorId)) {
      if (nextStore[event.id] !== event.colorId) nextStore[event.id] = event.colorId;
      return { ...event, colorId: event.colorId };
    }
    const fromStore = nextStore[event.id];
    if (isMemorialColorId(fromStore)) {
      persist.push({ id: event.id, colorId: fromStore });
      return { ...event, colorId: fromStore };
    }
    return { ...event, colorId: null };
  });

  const migrated = migrateMemorialColors(prepared);
  const resolved = migrated.map((event) => {
    const storedColor = nextStore[event.id];
    if (isMemorialColorId(storedColor)) {
      return { ...event, colorId: storedColor };
    }
    nextStore[event.id] = event.colorId;
    persist.push({ id: event.id, colorId: event.colorId });
    return event;
  });

  return { events: resolved, store: nextStore, persist };
}

## Context

See `proposal.md` for motivation. Today the calendar uses a boolean `eventJdns` set and renders one undifferentiated primary dot per day (`month-calendar.tsx`). The upcoming-events sidebar (`upcoming-events.tsx`) uses the same primary color for every row. There is no shared color logic, no DB field for color, and the theme's `--chart-*` tokens are grayscale and unused.

Requirements are defined in `specs/event-color-assignment`, `specs/calendar-event-markers`, and `specs/upcoming-events-color-accent`.

## Goals / Non-Goals

**Goals:**

- One shared client module derives a stable color slot (0–11) from each event's UUID.
- Calendar cells, selected-day detail, and upcoming-events rows all use the same slot → CSS variable mapping.
- Twelve distinct hues with per-theme oklch values tuned for contrast on light cards and dark cards.
- Replace `eventJdns: Set<number>` with per-day event lists so multi-event days render multiple markers.

**Non-Goals:**

- Persisting color in Supabase or accepting user color input.
- Color assignment on the server.
- Updating `/su-kien` event cards in this change (can follow later using the same helper).
- Legend UI explaining which color maps to which person (color + title on select is enough for v1).

## Decisions

### 1. Color slot from event UUID hash (not list index)

**Choice:** `eventColorIndex(id: string): number` — FNV-1a-style 32-bit hash modulo 12.

**Alternatives considered:**

| Approach | Rejected because |
|----------|------------------|
| Array index in sorted list | Colors shift when a new event sorts before existing ones |
| `Math.random()` on mount | Different color every reload |
| DB `color_index` column | User opted out; adds migration for no UX gain |

**Rationale:** UUID hash is stable, zero backend work, and identical across calendar + sidebar + any future surface.

### 2. CSS custom properties for theme-aware palette

**Choice:** Add `--event-1` … `--event-12` in `app.css` under `:root` and `.dark`, plus Tailwind theme entries `--color-event-N: var(--event-N)`.

**Usage in components:**

```tsx
// Dot background
className="bg-[var(--event-3)]"

// Or via helper returning the var name
style={{ backgroundColor: `var(--event-${index + 1})` }}
```

**Palette (oklch):** twelve evenly spaced hues. Light mode uses lower lightness (~0.50–0.55); dark mode uses higher lightness (~0.72–0.78) with slightly reduced chroma.

| Slot | Hue | Light (`:root`) | Dark (`.dark`) |
|------|-----|-----------------|----------------|
| 1 | 25 | `oklch(0.55 0.18 25)` | `oklch(0.75 0.14 25)` |
| 2 | 145 | `oklch(0.50 0.16 145)` | `oklch(0.74 0.13 145)` |
| 3 | 250 | `oklch(0.52 0.18 250)` | `oklch(0.76 0.14 250)` |
| 4 | 310 | `oklch(0.50 0.17 310)` | `oklch(0.74 0.13 310)` |
| 5 | 55 | `oklch(0.55 0.15 55)` | `oklch(0.78 0.12 55)` |
| 6 | 200 | `oklch(0.48 0.14 200)` | `oklch(0.73 0.12 200)` |
| 7 | 350 | `oklch(0.52 0.16 350)` | `oklch(0.75 0.13 350)` |
| 8 | 85 | `oklch(0.47 0.12 85)` | `oklch(0.72 0.10 85)` |
| 9 | 180 | `oklch(0.50 0.15 180)` | `oklch(0.74 0.12 180)` |
| 10 | 270 | `oklch(0.48 0.14 270)` | `oklch(0.73 0.12 270)` |
| 11 | 15 | `oklch(0.52 0.16 15)` | `oklch(0.75 0.13 15)` |
| 12 | 120 | `oklch(0.50 0.13 120)` | `oklch(0.74 0.11 120)` |

### 3. Shared module: `apps/web/src/lib/event-colors.ts`

Exports:

- `EVENT_COLOR_COUNT = 12`
- `eventColorIndex(eventId: string): number` — returns 0–11
- `eventColorVar(eventId: string): string` — returns `'var(--event-N)'` for inline styles
- `EventColorDot` — small `size-1.5 rounded-full` span; accepts `eventId` and optional `className`

All surfaces import from this module; no duplicated hash logic.

### 4. Calendar data structure: `Map<jdn, MemorialEvent[]>`

Replace `eventJdns: Set<number>` with `eventsByJdn: Map<number, MemorialEvent[]>` built in the same `useMemo` loop. For each event occurrence in the visible window, append the event to the map entry for that JDN.

`CalendarCellButton` receives `dayEvents: MemorialEvent[]` instead of `hasEvent: boolean`.

**Marker layout:** absolute bottom row, `flex gap-0.5 justify-center`, max ~4 dots visible; if more than 4 events on one day (unlikely for a family app), show 3 dots + a tiny `+N` — defer unless needed.

**Selected cell:** dots keep their event color (not `primary-foreground`). Selected state already inverts day number text; colored dots remain identifiable. Add `ring-1 ring-background/80` on each dot when selected for separation from primary fill.

**Selected-day detail:** replace generic `CakeIcon` primary icon with `EventColorDot` beside each title (keep or drop cake icon — drop cake in detail to reduce noise; dot + title is sufficient).

### 5. Upcoming events: left border accent

Wrap each row in a container with:

```
border-l-[3px] pl-3
style={{ borderLeftColor: eventColorVar(event.id) }}
```

Remove `text-primary` from the cake icon (or replace icon with dot for consistency). Row background stays default; only the border carries color.

Today's badge (`Hôm nay`) unchanged — sits beside the countdown as today.

### 6. No server or schema changes

`MemorialEvent` type and Supabase queries stay unchanged. Color is purely presentational in the web app.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Hash collisions — two events share a slot | Acceptable with ≤12 events typical; 12 slots keep collision rate low; titles disambiguate on select |
| Selected cell dots hard to see on primary bg | White ring on dots when selected; pick saturated hues |
| More than 3–4 dots clutter a cell | Cap visible dots; family scale makes this rare |
| Color meaning not memorizable without legend | Left border + dot on same row reinforces link; user selects day to confirm |

## Migration Plan

No database migration. Deploy is a single frontend release:

1. Add CSS variables and `event-colors.ts`
2. Update `MonthCalendar` and `UpcomingEvents`
3. Verify light/dark mode manually on home page

**Rollback:** revert the frontend commit; no data impact.

## Open Questions

None — scope and technical choices are settled. Event card coloring on `/su-kien` is explicitly deferred.

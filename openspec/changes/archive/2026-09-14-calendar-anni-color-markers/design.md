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

**Palette (oklch):** twelve distinct hues (not strictly even spacing — neighboring warm hues were too similar). Light mode uses mid-high lightness (~0.60–0.70) so markers read as color, not ink, on white cards. Dark mode uses higher lightness (~0.78–0.84) with slightly reduced chroma.

| Slot | Hue | Light (`:root`) | Dark (`.dark`) |
|------|-----|-----------------|----------------|
| 1 | 12 | `oklch(0.64 0.19 12)` | `oklch(0.78 0.14 12)` |
| 2 | 150 | `oklch(0.62 0.16 150)` | `oklch(0.78 0.13 150)` |
| 3 | 255 | `oklch(0.62 0.16 255)` | `oklch(0.80 0.12 255)` |
| 4 | 305 | `oklch(0.64 0.15 305)` | `oklch(0.80 0.12 305)` |
| 5 | 85 | `oklch(0.70 0.14 85)` | `oklch(0.84 0.12 85)` |
| 6 | 195 | `oklch(0.62 0.12 195)` | `oklch(0.80 0.10 195)` |
| 7 | 340 | `oklch(0.66 0.16 340)` | `oklch(0.82 0.12 340)` |
| 8 | 115 | `oklch(0.60 0.13 115)` | `oklch(0.80 0.11 115)` |
| 9 | 220 | `oklch(0.66 0.10 220)` | `oklch(0.82 0.09 220)` |
| 10 | 280 | `oklch(0.60 0.14 280)` | `oklch(0.80 0.12 280)` |
| 11 | 55 | `oklch(0.70 0.16 55)` | `oklch(0.82 0.13 55)` |
| 12 | 125 | `oklch(0.66 0.15 125)` | `oklch(0.80 0.12 125)` |

### 3. Shared module: `apps/web/src/lib/event-colors.tsx`

Exports:

- `EVENT_COLOR_COUNT = 12`
- `eventColorIndex(eventId: string): number` — returns 0–11
- `eventColorVar(eventId: string): string` — returns `'var(--event-N)'` for inline styles
- `EventColorDot` — small `size-1.5 rounded-full` span; accepts `eventId` and optional `className`

All surfaces import from this module; no duplicated hash logic.

### 4. Calendar data structure: `Map<jdn, MemorialEvent[]>`

Replace `eventJdns: Set<number>` with `eventsByJdn: Map<number, MemorialEvent[]>` built in the same `useMemo` loop. For each event occurrence in the visible window, append the event to the map entry for that JDN.

`CalendarCellButton` receives `dayEvents: MemorialEvent[]` instead of `hasEvent: boolean`.

**Marker layout:** in-flow row under the lunar day (`flex h-1.5 items-center justify-center gap-0.5`), not absolutely positioned, so dots do not overlap the lunar number on small cells. Every cell reserves the same 6px row so the grid stays aligned when some days have no events.

**Selected cell:** dots keep their event color (not `primary-foreground`). No background-matching ring on the dots.

**Selected-day detail:** `EventColorDot` beside each title; no cake icon.

### 5. Upcoming events: left border accent

Wrap each row in a container with:

```
border-l-[3px] pl-3
style={{ borderLeftColor: eventColorVar(event.id) }}
```

Remove the cake icon and any title-adjacent color dot. Row background stays default; only the left border carries color.

Today's badge (`Hôm nay`) unchanged — sits beside the countdown as today.

Month header: `flex` with `whitespace-nowrap` title (`text-sm sm:text-lg`) and `shrink-0` prev / today / next controls so the nav stays on one row when the Vietnamese month title is long.

### 6. No server or schema changes

`MemorialEvent` type and Supabase queries stay unchanged. Color is purely presentational in the web app.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Hash collisions — two events share a slot | Acceptable with ≤12 events typical; 12 slots keep collision rate low; titles disambiguate on select |
| Selected cell dots hard to see on primary bg | Keep saturated event colors; no extra ring |
| More than 3–4 dots clutter a cell | Family scale makes this rare; in-flow row wraps with `gap-0.5` |
| Color meaning not memorizable without legend | Left border on upcoming rows + calendar dots share the same slot; user selects day to confirm |

## Migration Plan

No database migration. Deploy is a single frontend release:

1. Add CSS variables and `event-colors.tsx`
2. Update `MonthCalendar` and `UpcomingEvents`
3. Verify light/dark mode manually on home page

**Rollback:** revert the frontend commit; no data impact.

## Open Questions

None — scope and technical choices are settled. Event card coloring on `/su-kien` is explicitly deferred.

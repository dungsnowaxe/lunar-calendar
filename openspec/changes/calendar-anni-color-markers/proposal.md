## Why

When scanning the calendar for upcoming death anniversaries (ngày giỗ), every event looks the same — a single primary-colored dot on the date and identical styling in the upcoming list. Users must tap each day or read every list item to know *whose* anniversary it is. A shared color language between the calendar and the upcoming-events sidebar would let users spot marked days at a glance and immediately connect them to a person.

## What Changes

- Derive each event's **color slot** (0–11) **on the client** from the event — no DB column, no manual picker.
- Show **colored dots** on calendar date cells — one dot per event on that day, matching the event's color.
- Add a **left border accent** on each row in the Upcoming Events sidebar using the same color, so list and calendar are visually linked.
- When a day has multiple anniversaries, show multiple dots in a compact row at the bottom of the cell.
- Extend the selected-day detail panel to show each event with its color dot beside the title.
- Use a shared `eventColorIndex(event)` helper so calendar, upcoming list, and event cards always pick the same slot for the same event.
- Define a **12-color palette** as CSS variables with **separate light/dark values** tuned for contrast on calendar cells and list rows.

## Capabilities

### New Capabilities

- `calendar-event-markers`: Per-event colored dots on calendar date cells, including multi-event days and selected-day detail styling.
- `upcoming-events-color-accent`: Color-coded left border (and optional dot) on upcoming-event list rows, linked to the same event color.
- `event-color-assignment`: 12-slot contrast-safe palette (CSS vars per theme) and client-side `eventColorIndex(event)` — hash event `id` to a slot so color is stable across views and sessions without persisting it.

### Modified Capabilities

<!-- No existing specs yet; this is the first behavioral spec set for the project. -->

## Impact

- **Database / server**: No schema changes — color is computed in the UI layer only.
- **Calendar**: Refactor `MonthCalendar` / `CalendarCellButton` — replace boolean `eventJdns` Set with per-day event lists; render multi-color dots.
- **Upcoming Events**: Update `UpcomingEvents` row layout with left-border accent.
- **Events page**: Optionally show color on `EventCard` for consistency (lower priority).
- **Theme**: Add `--event-1` … `--event-12` in `app.css` with per-mode oklch values (distinct hues, higher lightness in dark mode); map slots via `bg-[var(--event-N)]` / `border-[var(--event-N)]`. No new dependencies.

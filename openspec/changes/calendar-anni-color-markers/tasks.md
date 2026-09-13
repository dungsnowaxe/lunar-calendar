## 1. Event color palette and shared module

- [x] 1.1 Add `--event-1` … `--event-12` oklch values to `:root` and `.dark` in `apps/web/src/styles/app.css` per design.md palette table, and verify all twelve vars resolve in DevTools for both themes
- [x] 1.2 Create `apps/web/src/lib/event-colors.ts` exporting `EVENT_COLOR_COUNT`, `eventColorIndex`, `eventColorVar`, and `EventColorDot`, and verify the same UUID always returns the same slot (0–11) across repeated calls
- [x] 1.3 Register `--color-event-1` … `--color-event-12` in the Tailwind theme block of `app.css` if needed for utility classes, and verify `bg-[var(--event-1)]` renders a visible swatch in a scratch element

## 2. Calendar event markers

- [x] 2.1 Replace `eventJdns: Set<number>` with `eventsByJdn: Map<number, MemorialEvent[]>` in `month-calendar.tsx`, and verify a day with two events yields two entries in the map for that JDN
- [x] 2.2 Update `CalendarCellButton` to accept `dayEvents` and render a row of `EventColorDot` components at the cell bottom, and verify multi-event days show one dot per event with distinct colors
- [x] 2.3 Add selected-state ring styling on dots (`ring-1 ring-background/80`) so markers stay visible on the primary selected cell background, and verify dots remain distinguishable when a date is selected
- [x] 2.4 Update the selected-day detail list to show `EventColorDot` beside each event title (remove generic primary cake icon), and verify dot colors match the calendar cell dots for the same event

## 3. Upcoming events color accent

- [x] 3.1 Wrap each upcoming-event row in `upcoming-events.tsx` with a 3px left border using `eventColorVar(event.id)`, and verify the border color matches the calendar dot for that event on its occurrence date
- [x] 3.2 Remove primary-colored cake icon styling from upcoming rows (use dot or neutral icon), and verify today's rows still show the `Hôm nay` badge alongside the color accent

## 4. Verification

- [x] 4.1 Run `pnpm --filter web typecheck` (or project equivalent) and confirm no TypeScript errors in changed files
- [x] 4.2 Manually verify on the home page in light and dark mode: calendar dots, selected-day detail, and upcoming list borders all use consistent per-event colors with no server or schema changes

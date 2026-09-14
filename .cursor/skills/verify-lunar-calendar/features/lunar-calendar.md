# Lunar month calendar

The home calendar lets a user browse solar months with lunar day labels, jump
back to today, and select a day to read its lunar (and Can-Chi) detail.

## Sub-features

- `cal-title` shows `Tháng <m> năm <yyyy>` for the visible solar month.
- `cal-next` / `cal-prev` move one solar month forward or back.
- `cal-homnay` jumps the grid to today's month and selects today.
- `cal-select` updates the detail panel under the grid when a day cell is pressed.
- `cal-markers` shows event dots on days that have memorial occurrences.

## How to get to it (user POV)

- Open `/` (default after launch).
- Choose the header link `Lịch Âm` or nav link `Lịch`.

## Driving it with Playwright / browser tools

Preconditions:

- `bin/doctor` passed for the active `RUN_ID`.
- Browser is on `$URL/` (from `runs/<RUN_ID>/env.sh`).

- **Confirm identity.** See brand link `Lịch Âm` and a card title matching
  `Tháng N năm YYYY`. Run `node bin/drive-calendar.mjs` or snapshot the page.
  The first `[data-slot="card-title"]` matches that pattern.
- **Next month.** Choose `Tháng sau`. Run click role `button` name `Tháng sau`.
  The month title advances by one month (year rolls after December).
- **Previous month.** Choose `Tháng trước`. Title returns to the prior value.
- **Hôm nay.** Navigate two months away, then choose `Hôm nay`. Title and
  selection return to the current solar month; detail text includes `Âm lịch:`.
- **Select a day.** Click any day cell button in the grid. The panel under the
  grid shows a weekday + solar date line and an `Âm lịch:` line for that day.
- **Proof.** Save before/after screenshots and `aria.yml` under
  `artifacts/<RUN_ID>/calendar/` (the helper does this). Titles in `drive.log`
  must show a change after next and a restore after prev.

## Gotchas

- Day cells have no accessible name — identify them by grid position or by the
  solar day number text inside the pressed button (`aria-pressed="true"`).
- `Hôm nay` both resets the visible month and selects today; do not assert only
  the title if you also need the selection panel.
- Event dots prove presence of an occurrence, not which event; open `/su-kien`
  or the selected-day list for titles.
- Prefer `$URL` from the run env, not `localhost:3000`.

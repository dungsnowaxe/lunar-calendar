# Home sidebar

The home sidebar shows today's solar + lunar + Can-Chi summary and the next
upcoming memorial occurrences with countdown labels.

## Sub-features

- `today-card` shows label `Hôm nay`, solar weekday/date, and lunar summary.
- `upcoming-list` lists upcoming events under title `Sắp tới` with rule + solar date.
- `upcoming-empty` shows empty copy when there are no events.
- `upcoming-add` offers a `Thêm` control that navigates to `/su-kien`.

## How to get to it (user POV)

- Open `/` and look at the right-hand column (below the calendar on narrow viewports).
- From `/su-kien`, choose `Lịch` or `Lịch Âm` to return home.

## Driving it with browser tools

Preconditions:

- `bin/doctor` passed.
- Page is `$URL/`.

- **Today card.** Snapshot the aside. Text `Hôm nay` appears with a solar date
  line and an `Âm lịch:` line that includes a Can-Chi year.
- **Upcoming list.** Find heading/title `Sắp tới`. If the shared database has
  events, each row shows a title, `Ngày D tháng M (âm lịch)`, a solar date, and
  either badge `Hôm nay` or `Còn N ngày`.
- **Add shortcut.** Choose `Thêm` in the `Sắp tới` card header. URL becomes
  `/su-kien` and heading `Sự kiện giỗ` is visible.
- **Proof.** Screenshot `artifacts/<RUN_ID>/home-sidebar/today-upcoming.png`
  with brand `Lịch Âm` in the header and both sidebar sections visible. Record
  whether the list was empty or named the titles observed (do not invent titles).

## Gotchas

- Countdown numbers animate (`NumberTicker`); assert the surrounding `Còn` /
  `ngày` text or wait briefly before reading the number.
- Empty vs populated depends on the shared Supabase data — observe what is
  actually rendered; do not seed via SQL for this feature.
- The Base UI warning about `Thêm` rendering a link as a button is a known
  console noise; it does not block navigation.

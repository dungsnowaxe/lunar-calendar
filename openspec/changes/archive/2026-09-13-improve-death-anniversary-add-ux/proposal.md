## Why

Adding a ngày giỗ currently feels like adding a birthday: a cake icon, one date per save, verbose lunar labels, and a homepage **Thêm** button that leaves the calendar for `/su-kien`. Families often record several death anniversaries together, and the UI should read as remembrance rather than celebration.

## What Changes

- Replace the birthday-cake icon wherever a death anniversary is shown (upcoming list, calendar day detail, events page, empty state) with an icon that does not signal happiness or celebration.
- Let the user add multiple lunar dates in one add session, with a flow that stays usable on a phone (thumb reach, no cramped stacked forms, clear add/remove of dates).
- Homepage **Thêm** opens the add overlay in place instead of navigating to `/su-kien`. The Sự kiện page remains available for managing the full list.
- Shorten date field labels from "Ngày âm lịch" / "Tháng âm lịch" to **Ngày** / **Tháng**. Death anniversaries are already lunar dates; the extra words are redundant.
- Show only the number in each day/month option (e.g. `10`, `1`), not "Ngày 10" / "Tháng 1", because the field label already names the dimension.
- Present add/edit as a **dialog on desktop** and a **bottom sheet on tablet and mobile**.
- Reset the add/edit form when the overlay closes (cancel, dismiss, or successful save) so the next open does not show leftover values, extra dates, or errors.

## Capabilities

### New Capabilities

- `memorial-events`: Family death-anniversary (ngày giỗ) events — adding one or more lunar dates, opening add from the homepage, date-field copy, overlay vs bottom sheet, remembrance iconography, and resetting the form when the overlay closes.

### Modified Capabilities

None. The project has no existing specs (`openspec list --specs` is empty).

## Impact

- Homepage upcoming card (`apps/web/src/components/upcoming-events.tsx`): **Thêm** currently links to `/su-kien`; it must open the add overlay instead. Cake icon on listed events.
- Add/edit form (`apps/web/src/components/event-form-dialog.tsx`): labels, option text, single-date submit, Dialog-only presentation, and state that only initializes on mount (reopening keeps leftover values). Needs multi-date entry, a sheet on smaller viewports, and a reset when the overlay closes. No sheet component exists yet.
- Calendar day detail (`apps/web/src/components/month-calendar.tsx`) and Sự kiện page (`apps/web/src/routes/su-kien.tsx`): cake icon on events and empty state.
- Homepage (`apps/web/src/routes/index.tsx`) must host the add overlay so it can open without leaving `/`.
- Create API (`apps/web/src/server/events.ts`) currently accepts one event per call; batching or repeated creates may be needed for multi-date save. No change to how lunar dates are stored (day + month, repeating yearly).

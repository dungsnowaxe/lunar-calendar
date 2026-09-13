## 1. Shared primitives

- [x] 1.1 Add the shadcn sheet primitive in `apps/web` (`side="bottom"`) styled like `dialog.tsx` (popover surface, `rounded-4xl`, close button) and verify `apps/web/src/components/ui/sheet.tsx` exists and `pnpm --filter web typecheck` passes
- [x] 1.2 Export a shared `HandPrayerIcon` helper for memorial events and verify every former `CakeIcon` call site can import it from one place
- [x] 1.3 Add a `useSyncExternalStore` `matchMedia('(min-width: 1024px)')` hook with SSR snapshot `false` and verify it returns `true` only at `lg+` (1024px)

## 2. Batch create API

- [x] 2.1 Add `createEventsFn` in `apps/web/src/server/events.ts` that validates `z.array(eventInputSchema).min(1).max(10)` and inserts all rows in one Supabase call; verify invalid payloads return an error and persist nothing
- [x] 2.2 Point add-save at `createEventsFn` (edit still uses `updateEventFn`) and remove `createEventFn` if unused; verify a two-event save creates two `memorial_events` rows or none if any entry is invalid

## 3. Add/edit overlay

- [x] 3.1 Rebuild the form as a viewport overlay (dialog at `lg+`, bottom sheet below) with lifted entry state and a shared field body; verify desktop shows a centered dialog and tablet/phone show a bottom sheet
- [x] 3.2 Change day/month labels to **Ngày** / **Tháng** and option text to numbers only; verify add and edit overlays and that no option reads "Ngày 10" or "Tháng 1"
- [x] 3.3 Implement multi-entry add: one card per event (title, day, month, notes), **Thêm ngày** up to 10, remove extra cards only when more than one remain; edit stays a single card; verify two complete cards save as two yearly lunar events and removing a card drops it from submit
- [x] 3.4 On phone/tablet, keep header and footer sticky, scroll only the cards, and use full-width day/month triggers; verify a multi-date add can be completed inside the sheet without leaving it
- [x] 3.5 Reset when `open` becomes false (Hủy, dismiss, successful save) to one empty card (day `10`, month `1`); on open, load edit from `event` or add defaults; verify cancelled add and add-after-edit are blank, and a failed save keeps the overlay open with typed values

## 4. Homepage and iconography

- [x] 4.1 Host the overlay on `/`, pass `onAdd` into `UpcomingEvents`, and change **Thêm** from a `/su-kien` link to a button that opens the overlay; verify the URL stays `/` and **Sắp tới** refreshes after save
- [x] 4.2 Replace `CakeIcon` on upcoming events, calendar selected-day list, sự kiện cards, and the empty state with the shared `HandPrayerIcon`; verify no `CakeIcon` remains in `apps/web/src`

## 5. Cross-checks

- [x] 5.1 Run `pnpm --filter web typecheck` and confirm it passes
- [x] 5.2 Manually walk the `memorial-events` spec scenarios (icon, homepage add, multi-date, labels, options, dialog vs sheet, reset on close) on desktop and a phone-sized viewport and confirm they match

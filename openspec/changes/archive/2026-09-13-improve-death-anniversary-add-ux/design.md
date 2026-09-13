## Context

See `proposal.md` for motivation and `specs/memorial-events/spec.md` for the behavior contract.

Today, add/edit is a centered `Dialog` only (`event-form-dialog.tsx`), create is one row per `createEventFn` call, and homepage **Thêm** is a `Link` to `/su-kien`. Form fields are `useState` initialized from props, so a mounted overlay keeps leftover values after close. There is no sheet primitive. The homepage already switches to a two-column layout at Tailwind `lg` (1024px). The stack is TanStack Start, shadcn **base-maia** (Base UI), Hugeicons free set, and a shared `memorial_events` table with no schema change needed for this work.

## Goals / Non-Goals

**Goals:**

- One overlay component that can host add (N entries) and edit (one entry), presented as dialog or bottom sheet by viewport.
- All-or-nothing persistence when saving several new events.
- Shared remembrance icon so list, calendar, and empty state cannot drift back to the cake.
- Form state cleared whenever the overlay closes so the next open is a blank add or a freshly loaded edit.

**Non-Goals:**

- Changing how a lunar date is stored (day + month, regular month only, solar date computed).
- Unique constraints, leap-month giỗ, or per-user lists.
- Swipe-to-dismiss as a required gesture (visual bottom sheet is enough).
- Redesigning the Sự kiện list or calendar besides the icon.

## Decisions

### 1. Viewport split: sheet below `lg`, dialog at `lg+`

Use `matchMedia('(min-width: 1024px)')` via `useSyncExternalStore` (SSR snapshot: `false`, mobile-first).

This matches the app’s existing “desktop” breakpoint: the calendar + upcoming aside only sit side by side at `lg`. Tablets (including `md` / 768px) stay on the bottom sheet, which is what the spec calls for.

**Alternatives:** `md` (768) would put many tablets in a centered dialog and fight the spec. CSS-only dual mount of Dialog + Sheet would leave two modal trees in the a11y tree.

### 2. Overlay chrome: shadcn Sheet (bottom) + existing Dialog, shared form body

Add a shadcn `sheet` primitive (`side="bottom"`) in the same visual language as `dialog.tsx` (popover surface, `rounded-4xl`, close button). Keep Dialog for desktop.

Extract the fields into a shared body. Lift entry state above the chrome so resizing across `lg` does not wipe the form. Rename the feature component to something overlay-shaped (the current `event-form-dialog.tsx` name would be wrong).

Sheet layout for phone/tablet:

- Max height ~90dvh; header and footer stay put; only the entries scroll.
- Full-width **Ngày** / **Tháng** triggers (existing two-column grid).
- Sticky footer: **Hủy** + primary save (`Thêm sự kiện` or `Thêm n sự kiện` when n > 1).

**Alternatives:** Base UI `Drawer` (`swipeDirection="down"`) is the native bottom-sheet primitive and supports flick-to-dismiss. Rejected for the form: a long multi-entry list will scroll, and swipe-dismiss is easy to trigger by accident. A Vaul-style drawer would add a dependency the app does not use.

### 3. Multi-date add: one card per event, not one title with many dates

The spec requires a title (and optional notes) on each entry. The add overlay starts with one card and **Thêm ngày** appends another. Each card has title, **Ngày**, **Tháng**, notes. Remove is an icon on the card header and is hidden when only one card remains. Edit mode stays a single card (no add/remove).

Cap a session at **10** entries so a phone sheet cannot grow without bound. Users who need more save and open add again.

On mobile, keep notes as the existing auto-sizing textarea (already `field-sizing-content`) rather than hiding it behind a disclosure — every field stays reachable without extra taps.

**Alternatives:** Shared title + a list of day/month chips would be denser, but it violates the spec (each giỗ has its own name). Wizard (save one, then “add another”) is extra round-trips and is not “at a time.”

### 4. Persist a batch in one insert

Add `createEventsFn` that validates `z.array(eventInputSchema).min(1).max(10)` and `insert`s the rows in one Supabase call. Postgres treats that as one statement, so a failure persists none of the rows — matching the invalid-batch scenario.

Client validates the same way before calling; if any card is missing title or date, show one error, call nothing, keep the overlay open.

Do not loop `createEventFn`: a mid-batch network error would leave a partial list and force compensating deletes.

Edit still uses `updateEventFn` (one row).

### 5. Homepage **Thêm** opens the overlay in place

`index.tsx` owns overlay open state, renders the overlay, and passes `onAdd` into `UpcomingEvents`. The **Thêm** control becomes a `Button`, not `Link to="/su-kien"`. After save, invalidate the homepage loader so **Sắp tới** refreshes. `/su-kien` keeps its own overlay for list management.

**Alternatives:** A root-layout overlay would share one instance across routes; that is extra plumbing for no user-visible gain. A query param (`/?add=1`) is unnecessary when the user asked not to navigate.

### 6. Icon: `HandPrayerIcon`, one shared export

Replace every `CakeIcon` (upcoming list, calendar selected-day events, sự kiện cards, empty state) with Hugeicons `HandPrayerIcon`. Export it once (e.g. next to other memorial UI helpers) so call sites cannot pick different icons.

The free set has no incense/candle. A generic `FlowerIcon` can still read as cheerful at 16px. Hands joined is unambiguously not a birthday cake and is a familiar remembrance gesture for giỗ.

### 7. Labels and select options

Field labels: **Ngày**, **Tháng**. Select `items` / item text: the number only (`1`…`30`, `1`…`12`). No other copy changes in this design.

### 8. Reset form state when `open` becomes false

Do not rely on `useState(...)` initializers; the overlay stays mounted while the page is open, which is why leftover values linger today.

When `open` goes from true to false (Hủy, close control, backdrop dismiss, or successful save), reset to the add defaults: one card, empty title and notes, lunar day `10` / month `1` (same defaults as today), no error, not pending. Extra cards are dropped.

When `open` becomes true with an `event` (edit), initialize that single card from the event. When it becomes true without an `event` (add), use the add defaults — including after a prior edit.

A failed save keeps the overlay open, so this reset does not run and typed values stay.

**Alternatives:** Remount with `key={`${open}-${event?.id ?? 'add'}`}` also clears state but fights the lifted-state overlay (Decision 2) and can reset mid-resize. Resetting explicitly on close is the reliable approach.

## Risks / Trade-offs

- **SSR overlay chrome** → First paint uses the sheet (mobile-first snapshot). A desktop window may flash sheet→dialog. Mitigation: snapshot is a one-frame layout change, not lost form state (state is lifted).
- **Sheet vs true drawer** → No swipe-to-dismiss. Mitigation: close button, overlay click, and **Hủy** remain; can swap Sheet internals to Base UI Drawer later without changing specs.
- **10-entry cap** → Not in the spec. Mitigation: it still allows “more than one”; document in the empty extra-card affordance if we ever need to raise it.
- **Partial unique / duplicates** → Unchanged; two identical titles/dates can still be saved. Out of scope.

## Migration Plan

No database migration. Deploy UI + `createEventsFn` together. Rollback is a revert of the web app; existing rows stay valid. `createEventFn` can remain for compatibility until nothing calls it, then delete.

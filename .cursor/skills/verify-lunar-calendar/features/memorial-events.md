# Memorial events

Sự kiện giỗ lets a user create, edit, and delete memorial events stored by
lunar day and lunar month, with a live next-occurrence preview and three
upcoming solar dates on each card.

## Sub-features

- `events-list` shows all events on `/su-kien` (or empty state copy).
- `events-create` opens `Thêm sự kiện giỗ`, saves, and toasts success.
- `events-edit` opens `Sửa sự kiện` from `Sửa <title>` and saves `Lưu thay đổi`.
- `events-delete` confirms via `Xóa sự kiện?` and removes the card.
- `events-preview` shows `Lần tới vào: <solar>` while the form is open.
- `events-home-echo` surfaces new events under home `Sắp tới`.

## How to get to it (user POV)

- Choose nav `Sự kiện`.
- From home `Sắp tới`, choose `Thêm`.
- On `/su-kien`, choose `Thêm sự kiện` (header or empty-state button).

## Driving it with browser tools

Preconditions:

- `bin/doctor` passed.
- Active `RUN_ID` known; fixture title will be
  `[verify-<RUN_ID>] Giỗ kiểm tra`.
- No existing event already uses that exact title.

- **Open create.** Go to `$URL/su-kien`. Choose role `button` name
  `Thêm sự kiện`. Dialog title `Thêm sự kiện giỗ` appears.
- **Fill title.** Fill `#event-title` with `[verify-<RUN_ID>] Giỗ kiểm tra`.
- **Set lunar date.** Use `#event-day` / `#event-month` selects (labels
  `Ngày âm lịch` / `Tháng âm lịch`). Prefer day `10` and month `1` unless the
  recipe needs another pair. Confirm `Lần tới vào:` shows a solar date.
- **Optional notes.** Fill `#event-notes` with `verify-only; safe to delete`.
- **Save.** Choose role `button` name `Thêm sự kiện` in the dialog footer
  (not `Hủy`). Toast `Đã thêm sự kiện` appears; a card titled with the fixture
  name is on the list with `Ngày 10 tháng 1 (âm lịch)`.
- **Confirm from home.** Navigate to `/` via `Lịch`. Under `Sắp tới`, the
  fixture title appears.
- **Edit.** On `/su-kien`, choose `Sửa [verify-<RUN_ID>] Giỗ kiểm tra`. Change
  notes and choose `Lưu thay đổi`. Toast `Đã cập nhật sự kiện`; card shows the
  new notes.
- **Delete.** Choose `Xóa [verify-<RUN_ID>] Giỗ kiểm tra` → confirm `Xóa`.
  Toast `Đã xóa "…"`. Card is gone; home `Sắp tới` no longer lists it.
- **Proof.** Screenshots under `artifacts/<RUN_ID>/memorial-events/` for
  create form, list-with-fixture, and list-after-delete. Prefer a short
  `PROOF.md` naming the fixture title and both entry points used.

## Gotchas

- **Shared database.** Only create/delete titles prefixed `[verify-<RUN_ID>]`.
  Never click delete on family events (e.g. real `Giỗ …` rows without the
  prefix).
- Base UI Select options render as `Ngày N` / `Tháng N`; open the trigger then
  choose the option by that accessible name.
- Dialog submit and page header both say `Thêm sự kiện` — scope the click to
  the open dialog.
- Cancel with `Hủy` must leave no new card for the typed title.
- Persistence proof requires the second view (home or reload of `/su-kien`),
  not the toast alone.

# Theme switch

The header theme control switches between light, dark, and system appearance
and persists the choice in `localStorage`.

## Sub-features

- `theme-light` forces light (`Sáng`, `aria-pressed=true`); `html` lacks `dark`.
- `theme-dark` forces dark (`Tối`); `html` has class `dark`.
- `theme-system` follows OS (`Theo hệ thống`); class `dark` matches
  `prefers-color-scheme`.
- `theme-persist` keeps the choice across reload via `localStorage.theme`.

## How to get to it (user POV)

- Use the segmented control in the sticky header on any page (`/` or `/su-kien`).

## Driving it with browser tools

Preconditions:

- `bin/doctor` passed.
- Page is `$URL/` (or `/su-kien`).

- **Locate control.** Find role `group` name `Chế độ giao diện` with buttons
  `Sáng`, `Tối`, `Theo hệ thống`.
- **Force dark.** Choose `Tối`. That button becomes `aria-pressed=true`;
  `document.documentElement.classList.contains('dark')` is true.
- **Force light.** Choose `Sáng`. `dark` class is absent.
- **System.** Choose `Theo hệ thống`. Pressed state moves to that button;
  `dark` class matches the OS scheme.
- **Persist.** With `Tối` selected, reload the page. `Tối` is still pressed and
  `dark` remains on `<html>`.
- **Proof.** Screenshots
  `artifacts/<RUN_ID>/theme/light.png` and `.../dark.png` showing the header
  control pressed state plus page background contrast. Optionally dump
  `localStorage.theme` into `theme.log`.

## Gotchas

- Initial paint may follow OS before hydration finishes; wait for the pressed
  state to stabilize before asserting.
- Do not treat Playwright `color-scheme` emulation alone as proof of the
  control — click the real buttons.
- Verification browsers may not share the user's normal profile; persistence
  only needs to hold inside the same browser context for the run.

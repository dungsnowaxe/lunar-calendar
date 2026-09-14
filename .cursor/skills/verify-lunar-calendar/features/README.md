# Lịch Âm verification map

This directory is the maintained source for verifying the user-facing behavior
of Lịch Âm. Read the index before driving the app, then use the matching
feature file as the recipe.

## Baseline preconditions

- Launch with `.cursor/skills/verify-lunar-calendar/bin/launch` so the app is
  on `http://127.0.0.1:4317` (or your `VERIFY_PORT`) and a `RUN_ID` is recorded.
- Run `bin/doctor` and require PASS before any drive.
- Put the skill's `node_modules` in place (`cd .cursor/skills/verify-lunar-calendar && npm ci`) when using Playwright helpers.
- Never drive an instance that was not started by this verification run
  (refuse everyday `pnpm dev` on port 3000).
- Memorial events live in a **shared** Supabase table. Prefix every created
  fixture title with `[verify-<RUN_ID>]` and delete only those rows.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names (Vietnamese) over CSS or coordinates.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Browser: Cursor `browser_*` tools or `node bin/drive-calendar.mjs`.
- Restore fixture data after a mutation. Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot or role-based assertion plus a screenshot
  with the brand `Lịch Âm` visible.
- Mutation proof includes a second user-facing view of the stored value
  (list card and/or home `Sắp tới`).
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the
user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with <harness>` starts with `Preconditions:` and uses labeled
   bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable
handles, required state, commands, and observable proof.

## Features

- [Lunar month calendar](./lunar-calendar.md) covers month navigation, Hôm nay, and day selection.
- [Home sidebar](./home-sidebar.md) covers the today card and upcoming memorial list.
- [Memorial events](./memorial-events.md) covers create, edit, delete, and persistence on `/su-kien`.
- [Theme switch](./theme.md) covers light / dark / system appearance.

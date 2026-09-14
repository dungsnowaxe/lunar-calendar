---
name: verify-lunar-calendar
description: >
  Drive the Lịch Âm web app (Vietnamese lunar calendar + memorial events) the
  way a user does: launch the TanStack Start UI, doctor the instance, exercise
  calendar/events/theme via Playwright or Cursor browser tools, and keep proof
  artifacts. Use whenever you need to prove UI behavior, reproduce a bug, or
  verify a change against the real app rather than unit tests alone.
---

# Verify Lịch Âm

Primary surface: **web UI** at `apps/web` (TanStack Start / Vite / React 19).
Secondary surfaces (not driven by this skill): `@lunar/core` unit tests via
`pnpm test`, Cloudflare deploy via `pnpm deploy`.

UI language is Vietnamese. Timezone for all lunar math is `Asia/Ho_Chi_Minh`.

## Interview facts agents must not forget

- **No auth.** One shared family `memorial_events` table; RLS grants `anon` full
  access. Mutations hit the real Supabase project configured in repo-root
  `.env` / `.dev.vars`.
- **Default `pnpm dev` uses port 3000.** Verification launches on **4317**
  (override with `VERIFY_PORT`) and binds **`127.0.0.1`** so curl/Playwright
  agree. Vite without `--host` may listen on `::1` only — never assume
  `127.0.0.1` works unless launch used `--host 127.0.0.1`.
- **Do not double-drive.** Never attach to a user's everyday `pnpm dev` on
  3000. Never launch a second instance for the same `RUN_ID` while the first
  still holds the port. Concurrent runs need distinct `RUN_ID` + `VERIFY_PORT`.
- **Data is not isolated.** There is no per-run database. For mutating proofs,
  title every fixture `[verify-<RUN_ID>] …` and delete only those rows in
  fixture cleanup. Never delete family events that lack that prefix.
- Feature map lives in [`features/`](./features/README.md). A proof that only
  covers one convenient entry point is incomplete when the map lists others.

## Launch

From the repo root:

```sh
.cursor/skills/verify-lunar-calendar/bin/launch
# optional: VERIFY_PORT=4321 .cursor/skills/verify-lunar-calendar/bin/launch my-run
```

What it does:

1. Requires repo-root `.env` or `.dev.vars` with `SUPABASE_URL` /
   `SUPABASE_ANON_KEY`.
2. Builds `@lunar/core`, then starts `vite dev --host 127.0.0.1 --port <PORT>
   --strictPort` under `nohup`.
3. Waits until `GET http://127.0.0.1:<PORT>/` succeeds.
4. Writes `runs/<RUN_ID>/env.sh`, `server.pid`, `server.log`, and
   `runs/CURRENT`.

Ready signal: HTTP 200 from `/` whose body contains `Lịch Âm`.

Teardown: `bin/cleanup` (see Cleanup). Artifacts under `artifacts/<RUN_ID>/`
survive cleanup.

## Doctor

```sh
.cursor/skills/verify-lunar-calendar/bin/doctor
# or: .../bin/doctor <RUN_ID>
```

Read-only checks: PID alive, port listener present, home HTML contains brand
`Lịch Âm` and `lang="vi"`, `/su-kien` returns 200, Supabase env file present.
Run doctor first whenever anything looks off. Exit non-zero on failure.

## Drive

Two equivalent harnesses. Prefer the helper for calendar smoke; use Cursor
browser tools when you need interactive debugging or a feature without a
scripted helper yet.

### A. Playwright helper (calendar)

```sh
# one-time inside the skill directory (deps stay local to the skill)
cd .cursor/skills/verify-lunar-calendar && npm install
# then, with an active run:
node bin/drive-calendar.mjs
```

Stable handles used by the helper and feature recipes:

| Control | Handle |
| --- | --- |
| Brand / home | role `link` name `Lịch Âm` |
| Nav calendar | role `link` name `Lịch` → `/` |
| Nav events | role `link` name `Sự kiện` → `/su-kien` |
| Prev / next month | role `button` name `Tháng trước` / `Tháng sau` |
| Jump to today | role `button` name `Hôm nay` |
| Month title | first `[data-slot="card-title"]` matching `Tháng N năm YYYY` |
| Today sidebar | text `Hôm nay` (uppercase label) |
| Upcoming sidebar | heading/title `Sắp tới` |
| Add event (events page) | role `button` name `Thêm sự kiện` |
| Add event (home) | role `button` name `Thêm` in `Sắp tới` — opens overlay on `/` |
| Event form title | label `Tên sự kiện` (IDs come from React `useId`, do not hard-code) |
| Lunar day / month | labels `Ngày` / `Tháng` (Base UI Select; options are bare numbers `1`–`30` / `1`–`12`) |
| Notes | label `Ghi chú` |
| Submit create | role `button` name `Thêm sự kiện` inside dialog `Thêm sự kiện giỗ` |
| Cancel form | role `button` name `Hủy` |
| Edit / delete | role `button` name `Sửa <title>` / `Xóa <title>` |
| Confirm delete | dialog `Xóa sự kiện?` → `Xóa` or `Giữ lại` |
| Theme group | role `group` name `Chế độ giao diện` |
| Theme options | role `button` name `Sáng` / `Tối` / `Theo hệ thống` (`aria-pressed`) |

### B. Cursor browser MCP

1. `browser_navigate` to `$URL` from `runs/<RUN_ID>/env.sh`.
2. `browser_lock` → `browser_snapshot` → act with roles/names above →
   re-snapshot.
3. `browser_take_screenshot` into `artifacts/<RUN_ID>/<feature>/`.
4. Unlock when finished.

Always start from the feature file under `features/`. Exercise the real UI
path (nav + dialogs), not server functions or Supabase SQL.

## Evidence

Proof root: `.cursor/skills/verify-lunar-calendar/artifacts/<RUN_ID>/`.

Standards:

- Drive the user path (links, buttons, dialogs). Do not call `createEventFn`
  from a script and claim UI proof.
- Capture the action and the resulting state (before + after screenshot, or
  ARIA snapshot that shows the changed title / toast / list row).
- For mutations, confirm a second view: e.g. create on `/su-kien`, then see
  the title under `Sắp tới` on `/`. Delete only `[verify-<RUN_ID>]` fixtures.
- Record `RUN_ID`, feature ID, and entry point in the artifact folder
  (`drive.log` or a short `PROOF.md`).
- Mocks are out of scope: the app talks to real Supabase through server
  functions.

`bin/drive-calendar.mjs` writes:

- `artifacts/<RUN_ID>/calendar/01-home-before.png`
- `artifacts/<RUN_ID>/calendar/02-after-next-month.png`
- `artifacts/<RUN_ID>/calendar/03-after-homnay.png`
- `artifacts/<RUN_ID>/calendar/aria.yml`
- `artifacts/<RUN_ID>/calendar/drive.log`

## Cleanup

```sh
.cursor/skills/verify-lunar-calendar/bin/cleanup
# or: .../bin/cleanup <RUN_ID>
```

Kills only the PID recorded for that run (and any leftover listener on that
run's port). Never kill by process name (`vite`, `node`, …). Removes
`runs/CURRENT` when it points at this run. Leaves `artifacts/<RUN_ID>/`
untouched. Fixture cleanup for memorial events (UI delete of
`[verify-<RUN_ID>] …` rows) is the agent's responsibility before or after
process teardown — see `features/memorial-events.md`.

## Helpers

All scripts are executable; invoke from repo root as shown.

| Script | Purpose |
| --- | --- |
| `bin/launch [RUN_ID]` | Start isolated Vite instance; print URL + RUN_ID |
| `bin/doctor [RUN_ID]` | Read-only readiness check |
| `bin/cleanup [RUN_ID]` | Stop the instance this skill started |
| `bin/drive-calendar.mjs [RUN_ID]` | Playwright proof for month calendar navigation |
| `bin/common.sh` | Shared path helpers (sourced by the shell scripts) |

Install Playwright deps once (uses the committed `package-lock.json`):

```sh
cd .cursor/skills/verify-lunar-calendar && npm ci && npx playwright install chromium
```

## Suggested first proof

1. `bin/launch`
2. `bin/doctor`
3. `node bin/drive-calendar.mjs` (feature `lunar-calendar`)
4. `bin/cleanup`
5. Confirm `artifacts/<RUN_ID>/calendar/` still exists

`RUN_ID` must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`. Cleanup only signals
processes whose command line still contains this run's `--host` and `--port`.

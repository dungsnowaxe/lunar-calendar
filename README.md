# Lịch Âm — Vietnamese lunar calendar & memorial events

A small web app for the Vietnamese lunar calendar (âm lịch): view today's lunar
date, browse a lunar month grid, save memorial / death-anniversary events
(ngày giỗ) by their lunar date, and see the upcoming occurrences every year.

- Stack: pnpm monorepo · TanStack Start (React 19, Vite) · Supabase · shadcn/ui (Base UI) · Magic UI · Tailwind CSS v4
- Timezone: everything is computed in `Asia/Ho_Chi_Minh` (UTC+7), regardless of the server's clock.
- UI language: Vietnamese only.

## Structure

```
apps/web          TanStack Start application (UI + server functions)
packages/lunar    @lunar/core — pure TypeScript lunar domain logic (no React)
supabase/migrations  SQL migrations for the Supabase project
```

### @lunar/core

Domain logic lives in `packages/lunar` and is independent of React:

- Solar ↔ lunar conversion using **Ho Ngoc Duc's** canonical Vietnamese lunar
  algorithm (astronomical algorithms from Meeus, computed at UTC+7). The
  algorithm is vendored verbatim in `src/hnd.ts` — do not modify the astronomy.
- Leap month (tháng nhuận) lookup, lunar month lengths, Can-Chi names.
- Yearly occurrence calculation for memorial events
  (`occurrenceInLunarYear`, `nextOccurrences`). Occurrences always follow the
  regular month (tháng thường), the traditional convention for ngày giỗ — leap
  months (tháng nhuận) are handled automatically by the calendar and never
  need to be selected. A day 30 in a 29-day month is observed on the last day
  of the month.

The test suite (`packages/lunar/test`) verifies the implementation against
published Vietnamese data, including Tết 2015–2026, the 1985 divergence from
the Chinese calendar (VN Tết 21/01 vs CN 20/02), and the 2025 leap month 6.

```sh
pnpm test        # run the lunar test suite
```

## Domain rules

- **The lunar date is canonical.** `memorial_events` stores only
  (`lunar_day`, `lunar_month`); solar occurrences are always computed with
  `@lunar/core` and never stored. Events recur on the regular lunar month,
  even in years that also have a leap occurrence of that month.
- **No authentication.** The app is one shared family list. The RLS policy
  grants the `anon` role full access — anyone with the project URL and
  publishable key can read and modify the events.
- All Supabase access happens in server functions (`apps/web/src/server`);
  the browser never talks to Supabase directly.
- User input is validated with Zod in every mutating server function and
  constrained again by `check` constraints in the database.

## Setup

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Configure Supabase (see `.env.example`) in the repo-root `.env`:

   ```env
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<publishable key>
   ```

3. Apply the database migration, either with the Supabase CLI
   (`supabase link && supabase db push`) or by pasting
   `supabase/migrations/20260911000000_memorial_events.sql` into the
   dashboard SQL editor. The migration creates the shared
   `public.memorial_events` table with row level security opened to the
   `anon` role (the app has no login).

4. Run the app:

   ```sh
   pnpm dev       # http://localhost:3000
   pnpm build     # production build (also runs tsc)
   ```

## Features

- `/` — lunar month calendar (solar grid with lunar day, month starts, full
  moons and event markers), today card (solar + lunar + Can-Chi), and the
  next upcoming events with countdowns.
- `/su-kien` — manage memorial events: create/edit with lunar day and lunar
  month (with a live "next occurrence" preview), delete with confirmation.
  Each event shows its next three occurrences.
- No login wall: the calendar and the shared event list are public.

## Why

Users of a Vietnamese lunar calendar routinely ask whether today is a good day to cut hair, and every competitor answers it. The app can already compute the astronomical inputs the traditional rule stack is built from — lunar date, `canChiDay`, `canChiMonth`, `canChiYear`, weekday — so what is missing is the rule layer, not new astronomy.

Research settled the question that motivated this feature: **the day a person was born is not a factor in any mainstream tradition.** Only Vedic muhurta uses real birth data, and it needs birth time and place, not a date. In the Vietnamese almanac tradition the sole personal factor is the birth **year** (tuổi), and it acts as a clash modifier on a day-quality judgement that is otherwise identical for everyone. This change therefore builds a day-quality kernel, not a birth-chart feature.

The reference canon is [xemlichngaytotxau.com](https://xemlichngaytotxau.com), chosen because it is the only high-usage source that publishes its formulas in enough detail to reimplement, exposes an open JSON API, and maintains a public errata log. Its arithmetic has been verified against `@lunar/core` and reproduces exactly (see `design.md`).

## What Changes

- Add **`packages/ngay-tot`** — a new workspace package holding the _belief_ layer: per-việc weight tables, ngày kỵ lists, việc definitions, and đánh giá thresholds. Depends on `@lunar/core`, never the reverse.
- Extend **`@lunar/core`** with astronomy only: tiết khí, thập nhị trực, nhị thập bát tú, trực nhật (hoàng đạo/hắc đạo), and giờ hoàng đạo. Requires exporting `SunLongitude` from `hnd.ts` — additive; the transcribed algorithms are not modified.
- Score a day **per việc** from a baseline of 50, summing itemised contributions from all six canonical layers, clamped to `[0, 100]`.
- Ship exactly one việc: **cắt tóc**.
- Add a **chủ sự** selector — several named people with their birth-year Can–Chi, held in `localStorage` only. Xung tuổi adjusts the score; it never vetoes a day.
- Surface the verdict as a **TodayCard line** (tier + dominant reason) and a ranked month page at **`/ngay-tot-cat-toc`**.
- Deliberately diverge from canon in one recorded place: **mùng 1 and ngày rằm are scored at −13** for cắt tóc, because the canon names them as taboos in prose but does not score them.
- Present the belief layer as _tín ngưỡng dân gian_ with its reasoning visible and a one-line disclaimer, while the astronomical layer remains verifiable and unqualified.

## Capabilities

### New Capabilities

- `day-quality`: the việc-keyed day-quality kernel — the score model, itemised contributions with citations, đánh giá tiers, chủ sự selection, xung-tuổi as a modifier, and the separation between verifiable astronomy and recorded folk belief.
- `haircut-days`: the cắt tóc activity — its rule set, its two surfaces (TodayCard line and ranked month page), its recorded divergence from canon, and the explicit exclusion of adjacent rituals.

### Modified Capabilities

None. No existing spec changes. In particular `calendar-event-markers` is untouched: this feature adds **no** calendar cell markers, because that capability already owns cell marker semantics with a documented colour-identity system.

## Impact

- **`packages/lunar` (`@lunar/core`)**: export `SunLongitude` from `hnd.ts` (visibility change only); add tiết khí, trực, tú, trực nhật and giờ hoàng đạo derivations. `getLunarMonth11` and `getLeapMonthOffset` keep their existing behaviour exactly. New exports from `index.ts`.
- **New `packages/ngay-tot`**: third workspace package; add to `pnpm-workspace.yaml`. Holds belief data and its own fixture source, separate from astronomy tests.
- **`apps/web`**: `TodayCard` gains one line; new route `ngay-tot-cat-toc.tsx` (regenerates `routeTree.gen.ts` — never hand-edit); new `localStorage`-backed chủ sự state. No changes to `MonthCalendar`, `UpcomingEvents`, or the memorial-event flows.
- **Supabase / database**: **no schema changes**. No personal data is persisted — the app has no login and `memorial_events` is an anon-shared family list whose RLS policy grants the anon role full read/write, which makes it an unacceptable home for birth data.
- **SEO**: new public route with metadata via `utils/seo.ts`, targeting the phrase _ngày tốt cắt tóc_.
- **Docs**: `GLOSSARY.md` (24 terms), `docs/adr/0001-truc-keyed-on-tiet-khi-month.md`, `docs/adr/0002-belief-data-outside-lunar-core.md` — all already written.

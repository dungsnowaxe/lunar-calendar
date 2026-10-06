## Context

See `proposal.md` for motivation. The app today computes lunar dates and Can–Chi for day, month and year (`packages/lunar/src/lunar.ts`), and `TodayCard` already renders `Ngày <Can Chi>, tháng <Can Chi>` alongside the lunar date. There is no concept anywhere in the codebase of a day being good or bad for anything, no person or birth-data model, and no time-of-day concept — `SolarDate` is date-only and `solarToday()` returns a date.

The two decisions that shape this design are already recorded as ADRs and are not re-litigated here:

- **ADR-0001** — thập nhị trực is keyed on the **tiết-khí** month, not the lunar month, so `SunLongitude` is exported from `hnd.ts`.
- **ADR-0002** — belief data lives in **`packages/ngay-tot`**, outside `@lunar/core`.

Requirements are defined in `specs/day-quality` and `specs/haircut-days`.

## Goals / Non-Goals

**Goals:**

- A day-quality kernel keyed by việc, so a second activity is a data change and not a refactor.
- Reproduce the reference canon's scores exactly, and prove it with golden fixtures harvested from its published API.
- Keep `@lunar/core` a package whose every claim is verifiable astronomy.
- Keep the model **date-only**: no clock, no time-of-day input, no midnight-boundary semantics.
- Keep every personal input client-side.

**Non-Goals:**

- **Tang chế / mourning windows** (49 ngày, 100 ngày, giỗ đầu). Deferred to its own change; it needs an optional death year on `memorial_events`, and inferring a window from a recurring anniversary would be actively wrong for any long-recorded giỗ.
- **Cắt tóc máu** (infant first haircut). A distinct việc with different rules — not a flag on cắt tóc.
- **The other 11 việc** the canon scores (cưới hỏi, động thổ, khai trương, …).
- **Giờ hoàng đạo as a displayed table**, can giờ (Ngũ thử độn), and any "current hour" indicator.
- **Nạp âm**, **xuất hành directions** (Hỷ thần / Tài thần / Hạc thần), **hoa giáp** position.
- **Tháng cô hồn** as a scored modifier — a month-level mechanism, not a day-level one.
- **Bắc/Nam regional variance.** One ruleset; the visible reasoning carries the ambiguity.
- **Historical legal timezones.** `hnd.ts` hardcodes `TIMEZONE = 7`; the canon adjusts the Sóc per period, which is how it reproduces Tết Mậu Thân 1968 differing by a day between North and South. Accepted divergence.
- **Calendar cell markers** for good days.
- **Any Supabase schema change.**

## Decisions

### 1. Verified constants — the canon reproduces against `@lunar/core` with no offset fiddling

Before choosing a canon, its arithmetic was checked against published values. All four checks pass, which is what makes golden-fixture testing viable.

| Check                  | Formula                                                               | Verified against                                                                                               |
| ---------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Can–Chi ngày           | `can = (JDN+9) mod 10`, `chi = (JDN+1) mod 12`                        | JD `2461319` → **Nhâm Tý** ✓ (identical to existing `canChiDay`)                                               |
| Nhị thập bát tú        | `tu = ((JDN+11) mod 28) + 1`, ordering Giác…Chẩn                      | 5/10/2026 → **#19 Tất** ✓; 1/1/1997 → **#14 Bích** ✓ — two anchors 29 years apart independently yield **k=11** |
| Tú ↔ weekday invariant | luminary of tú `n` is `LUM[(n-1) mod 7]` and must equal the weekday's | Tất = Nguyệt on Monday ✓; Bích = Thủy on Wednesday ✓                                                           |
| Thập nhị trực          | `truc = TRUC[(dayChi - monthChi) mod 12]`                             | ngày Tý, tháng Dậu → **Bình** ✓                                                                                |

The tú↔weekday invariant is a **unit-testable property of the whole 28-day cycle**, not just of two sample dates, and is asserted across all 146,097 days of `[MIN_SOLAR_YEAR, MAX_SOLAR_YEAR]`. It is weaker evidence than it first looks, though: because 28 is a multiple of 7 the invariant follows _by construction_ from the `+11` offset, so it guards the `TU`/`TU_HANH` ordering against a reorder rather than proving the astronomy. The independent evidence is the fixture comparison below.

**All four layers are now verified against 579 consecutive days of the canon's published API output** (2025-06-01 → 2026-12-31; 19 lunar months including 29 leap-month days). Tiết khí, trực, tú, trực nhật and all 6,948 giờ-deity assignments match exactly, as do `solarToJdn`, `canChiDay`, `canChiMonth` and `solarToLunar`. Two corrections fell out of that comparison:

- **A date belongs to the solar term that _begins_ on it**, so the sun must be sampled at the _close_ of the local day. Sampling the opening midnight mislabels 38 of 579 days — every one of them a term boundary, which is exactly where the Trực is most sensitive.
- **Trực nhật is anchored on the _lunar_ month, while the Trực is anchored on the _tiết-khí_ month.** Lunar month reproduces trực nhật 579/579 (tiết-khí: 395/579); tiết-khí reproduces the Trực 579/579 (lunar: 395/579). Unifying the two on either basis breaks about a third of all days. See ADR-0001.

Exporting `SunLongitude` was confirmed harmless beyond the type system: `getLunarMonth11` and `getLeapMonthOffset` behaviour is unchanged, verified by diffing 400 years of `leapMonthOf` and 146,097 days of `solarToLunar` against pristine `HEAD` — **0 differences**.

**The JD convention matches exactly**, so fixtures harvested from the canon's API can be compared directly against `solarToJdn` output.

### 2. Scoring is a sum of per-việc weighted contributions, clamped

**Choice:** baseline **50**, then add each applicable contribution, clamp to **[0, 100]**.

Weights are **per (việc × layer)**, not flat. This is not a stylistic preference — it is forced by the canon's own output for 5/10/2026:

|          | hoàng đạo | Trực Bình | sao Tất | Thiên Đức | Nguyệt Đức | giờ | raw | shown   |
| -------- | --------- | --------- | ------- | --------- | ---------- | --- | --- | ------- |
| Động thổ | +18       | **+14**   | +10     | +9        | +9         | +2  | 112 | **100** |
| Cắt tóc  | +18       | **0**     | +10     | +9        | +9         | +2  | 98  | **98**  |

The same Trực contributes **+14** for one việc and **0** for another, and the raw total is clamped. A binary hợp/kỵ model with flat ±16 / ±12 — the simplification the canon's methodology page publishes — **cannot** produce these two numbers from one day.

**Alternatives considered:**

| Approach                        | Rejected because                                                              |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Flat ±16 / ±12 per layer        | Provably cannot reproduce 98 and 100 from the same date                       |
| A scoring _function_ over rules | Hides data in code; an erratum becomes a code change; defeats itemisation     |
| Three-state verdict, no number  | Users compare days; and contributions are what let one kernel serve many việc |

**Contribution shape:** `{ rule, delta, explanation, citation }`. The contributions — not the total — are the domain object, because they carry the per-việc weights and the citations that make Q14's stance honest.

**Đánh giá thresholds** are derived from harvested fixtures. Measured over the 579-day window, `cat-toc` has median **49**, mean 50.3, and **16.1%** of days ≥80 (24.9% ≥70, 36.4% ≥60, 6.4% ≥90). The canon's published "median ≈45, ~11% ≥80" describes its `chung` (general) score rather than `cat-toc` — measured `chung` is median 48 with 12.1% ≥80. Thresholds are fixed against `cat-toc`'s own distribution in task 3.5, not guessed here.

### 2b. The derived `cat-toc` weight tables

These were not published as a table anywhere. They were recovered by least-squares fit over 569 unclamped fixture days and then **replayed against all 579 days with exact agreement**, including the 10 that clamp. Every coefficient is an integer.

| Layer           | Weights                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline        | **50**                                                                                                                                                                                      |
| Trực nhật       | hoàng đạo **+18**, hắc đạo **−18**                                                                                                                                                          |
| Thập nhị trực   | Trừ, Định, Thành, Khai **+14** · Phá, Nguy, Bế **−16** · Kiến, Mãn, Bình, Chấp, Thu **0**                                                                                                   |
| Nhị thập bát tú | **+10** ×14: Giác, Phòng, Vĩ, Cơ, Đẩu, Thất, Bích, Lâu, Vị, Tất, Sâm, Tỉnh, Trương, Chẩn · **−4** ×8: Đê, Tâm, Ngưu, Nữ, Khuê, Mão, Tinh, Dực · **−12** ×6: Cang, Hư, Nguy, Chủy, Quỷ, Liễu |
| Sao tháng       | Thiên Đức **+9**, Nguyệt Đức **+9**, Thiên Hỷ **+5**                                                                                                                                        |
| Ngày kỵ cố định | Tam Nương, Nguyệt Kỵ **−13** · Sát Chủ, Thọ Tử, Dương Công Kỵ Nhật **−9**                                                                                                                   |
| Giờ             | `2 × (n − 2)` where `n` = hoàng đạo giờ in 07h–19h ⇒ **0 / +2 / +4**                                                                                                                        |

Two things worth noting. The canon's published tú _kỵ_ set (Cang, Hư, Nguy, Chủy, Quỷ, Liễu) is **exactly** the −12 tier — the +10 and −4 tiers were never written down. And the fit needs **no** lunar-day term beyond those five sao xấu, which independently confirms decision 5's premise: the canon really does score mùng 1 and ngày rằm at zero, so our −13 is genuinely a divergence rather than a restatement.

### 3. Giờ hoàng đạo is score-only

**Choice:** compute how many of the day's 12 giờ hoàng đạo fall in **07h–19h**, from the day's Chi alone. Never render an hour table.

**Correction found during implementation:** the contribution is `2 × (n − 2)`, where `n` is that count — and `n` only ever takes the values **2, 3 or 4**, because exactly six of the twelve giờ are always hoàng đạo and the 07h–19h window always spans exactly six giờ. So the delta is **0 / +2 / +4**: never negative, and never the `max +8` or `−4 when few` the canon's methodology page advertises. That prose is a simplification its own output contradicts; the derived rule reproduces all 579 fixture days exactly.

Two reasons. The contribution is **day-derived in the canon itself** ("3/6 giờ hoàng đạo rơi vào khung 07h–19h"), so no clock is needed. And 07h–19h is when a salon is open, so the score already encodes "can I realistically book this day?" — which is the question a haircut actually asks.

Rendering hours would introduce the first time-of-day concept into a date-only model and force a decision on the **23:00 dạ-Tý boundary** (giờ Tý straddles midnight). It would also have nowhere to go: the chosen surfaces are a card line and a month list.

### 4. Chủ sự is a client-side, multi-person selector

**Choice:** several named chủ sự, each with a birth-year **Can–Chi** (60 options, not 12 animals), stored in `localStorage`.

The app has no login and its single table is a shared family list, so "your birth year" has no referent — a haircut belongs to one person while the calendar belongs to a family. One global tuổi would silently produce a verdict about someone else. Keying on full Can–Chi matches the canon, which reports "tuổi xung ngày: **Bính Ngọ, Mậu Ngọ**" for ngày Nhâm Tý — a subset of the five Ngọ years, so Chi-opposition alone is too coarse.

**Rejected:** persisting a `people` table. It would write personal birth data into an anon-accessible database. Note this is where the deferred tang-chế feature would eventually want to live, so the client-side model is a stepping stone rather than a dead end.

### 5. One recorded divergence: mùng 1 and ngày rằm

The canon's haircut page opens with _"Dân gian kiêng cắt tóc mùng 1 và ngày rằm"_ but scores neither. Shipping a feature where mùng 1 can display **98 · Rất tốt** would read as broken to every Vietnamese user.

**Choice:** score both at **−13** for cắt tóc — the same class and magnitude as Tam Nương / Nguyệt Kỵ, which the canon itself groups with them as _ngày kiêng cố định_. Each carries its own citation marking it as a divergence.

**Rejected:** a heavier penalty (−20). It would guarantee mùng 1 never surfaces, but it breaks the calibrated distribution and makes the divergence larger than it needs to be. If −13 still leaves mùng 1 scoring well on real dates, that is a signal to revisit — not to overcorrect now.

### 6. Surfaces

**TodayCard** gains one line: **tier + dominant reason** ("Rất tốt · Trực Thành"), linking to the month page. A bare number on a compact card invites "98 out of what?" with no room to answer; a bare verdict discards the reasoning. This mirrors the canon, which leads with a tier and puts the arithmetic behind a click.

**`/ngay-tot-cat-toc`** — ranked ngày tốt for the month, with full itemised contributions per day. Slug matches the dominant search phrase and the canon's own URL. The nested `/ngay-tot/cat-toc` shape is correct eventually but speculative with one activity, and `routeTree.gen.ts` is generated so restructuring is cheap.

**No calendar cell markers** — see Non-Goals.

## Risks / Trade-offs

| Risk                                                                                                                                                                                                                                | Mitigation                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ~~**The positive tú set for cắt tóc is unpublished.**~~ **RESOLVED.** Derived from fixtures: three tiers, +10 ×14 / −4 ×8 / −12 ×6. The canon's published _kỵ_ set is exactly the −12 tier.                                         | Recovered by least-squares fit over 569 unclamped days, then replayed against all 579 with exact agreement. **Do not** source from tuviquan: that page contradicts itself (Hư and Nguy listed as both đại cát and kỵ) and its 30-day table maps lunar days to tú, which is impossible given the continuous 28-day cycle. |
| ~~**The xung-tuổi delta magnitude is unpublished.**~~ **RESOLVED as not derivable.** The canon's `diem` contains no tuổi term at all — a zero-residual fit needs no tuổi feature, and `tuoi_xung` is published as information only. | Chosen **−9** by decision and recorded as a second divergence (task 3.4), borrowing the tier the canon already uses for comparable personal/ritual incompatibilities (Sát Chủ, Thọ Tử, Dương Công Kỵ Nhật). Score modifier only, never a veto.                                                                           |
| **A mis-transcribed weight table would be invisible.** The −4 tú tier is one entry away from the +10 tier; putting **Tỉnh** in the wrong one produces exactly 21 fixture mismatches of +14 and nothing else.                        | The 579-day replay is the safety net and must not be reduced to a spot check.                                                                                                                                                                                                                                            |
| Tiết khí changes `hnd.ts`, headed "do not modify the astronomy".                                                                                                                                                                    | Export is visibility-only; `getLunarMonth11` / `getLeapMonthOffset` untouched; existing test suite must pass unchanged before any new code lands.                                                                                                                                                                        |
| Using the lunar month for Trực would be _silently_ wrong near boundaries.                                                                                                                                                           | ADR-0001; fixtures include boundary dates where tiết-khí and lunar months disagree.                                                                                                                                                                                                                                      |
| Belief data drifting from canon after an erratum.                                                                                                                                                                                   | Weights are table data in `packages/ngay-tot`; erratum is a table edit, never an astronomy change.                                                                                                                                                                                                                       |
| A feature presenting folk belief as fact.                                                                                                                                                                                           | Itemised contributions with citations, tier + reason rather than bare number, one-line footer disclaimer (ADR-0002 boundary made visible in copy).                                                                                                                                                                       |
| `localStorage` chủ sự is per-device, so family members on different devices see different verdicts.                                                                                                                                 | Accepted — it is the direct consequence of refusing to persist birth data with no login. The selector is explicit about whose ngày is shown, so a wrong verdict is never silent.                                                                                                                                         |

## Migration Plan

Additive; no database migration, no change to existing behaviour.

1. Export `SunLongitude`; confirm the existing `@lunar/core` suite passes unchanged.
2. Add tiết khí → trực → tú → trực nhật → giờ hoàng đạo derivations, each with invariant tests.
3. Scaffold `packages/ngay-tot`; harvest fixtures; land weight tables and the scoring sum.
4. Wire the TodayCard line, then the month page.
5. `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm fmt`.

**Rollback:** revert the frontend commits and drop the new package. `@lunar/core` gains only new exports, so nothing existing breaks if they go unused.

## Open Questions

None. Both original unknowns were resolved from the canon's own published data during implementation — neither by guesswork nor from a secondary source.

1. **The positive tú set for cắt tóc** (task 3.2) — derived. Three tiers, +10 ×14 / −4 ×8 / −12 ×6; the canon's published _kỵ_ set turns out to be exactly the −12 tier. See §2b.
2. **The xung-tuổi delta magnitude** (task 3.4) — established as _not derivable_, because the canon scores no tuổi term at all. Chosen **−9** by decision and recorded as a second divergence.

Three further questions surfaced during implementation and were settled rather than left implicit:

3. **Does deity favourability belong in `@lunar/core`?** No — it is belief data. `hoangDao` was removed from core; the set lives in `packages/ngay-tot`. See ADR-0002.
4. **`Tỵ` (repo) vs `Tị` (canon)?** Keep the repo's pre-existing, already-user-facing spelling and normalise canon strings at the boundary. This matters: five of the sixty possible birth-year Can–Chi contain that branch, so an unnormalised comparison against `tuoi_xung` would silently never match them. See ADR-0002.
5. **Are the tháng-Kiến anchors shared across layers?** No — see §1. This was assumed, measured, and found false.

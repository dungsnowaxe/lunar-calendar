# Thập nhị trực keyed on the tiết-khí month, not the lunar month

The Trực of a day is derived from its Chi relative to the month's Chi, and the month that anchors it is the **tiết-khí month** (bounded by solar terms), not the lunar month. We compute tiết-khí boundaries by exporting `SunLongitude` from `packages/lunar/src/hnd.ts` at 15° resolution, rather than reusing the existing `canChiMonth`, which is lunar-month based.

The traditional rule is unambiguous on this point — the reference canon states _"Thập nhị trực an theo chi ngày so với tháng Kiến tính bằng tiết khí"_ — and a tiết-khí month drifts against a lunar month, so the two disagree near month boundaries. Using the lunar month would produce a **silently** wrong Trực on those days, with no error to catch it. Measured against 579 days of the canon's published output, the lunar month gets **184 days wrong — 32%**.

**Only the Trực is anchored this way.** Implementation found that trực nhật (the day-deity behind hoàng đạo / hắc đạo) is anchored on the **lunar** month instead, and reproduces the canon 579/579 on that basis while the tiết-khí month manages only 395/579 — the exact mirror of the Trực's result. The two layers are anchored differently, and unifying them on either basis breaks about a third of all days. This is surprising enough that a reader will assume it is a bug, so `trucNhatOf` carries the finding inline and a dedicated regression test asserts both anchors simultaneously over the whole fixture window.

## Considered Options

- **Reuse `canChiMonth` (lunar month).** Free, no new astronomy, and the function is already exported and displayed in `TodayCard`. Rejected: wrong near boundaries, and wrong in a way no test would surface unless we already knew the right answer.
- **Ship lunar month now, correct to tiết khí later.** Rejected: every verdict computed in the interim is wrong, golden test fixtures recorded against it would have to be regenerated, and any user-facing "why" copy would have been built on the wrong month.

## Consequences

- `hnd.ts` is a verbatim transcription of Hồ Ngọc Đức's reference implementation, headed _"Do not modify the astronomy"_. Exporting `SunLongitude` is **additive** — it changes visibility, not computation — but the constraint stands: the algorithms themselves remain untouched, and correctness stays guaranteed by the test suite. `TIMEZONE` was exported on the same terms so the `7`-hour offset is referenced rather than duplicated. Verified against pristine `HEAD`: 400 years of `leapMonthOf` and 146,097 days of `solarToLunar`, **0 differences**.
- `getSunLongitude` currently quantises to 6 sectors of 60° for month-11 detection. Tiết khí needs 24 sectors of 15°. The finer-grained function must not replace the coarser one; `getLunarMonth11` and `getLeapMonthOffset` keep their existing behaviour exactly.
- **A date belongs to the solar term that _begins_ on it**, so the sun must be sampled at the close of the local day, not the midnight that opens it. Opening-midnight sampling mislabels 38 of the 579 fixture days — every one of them a term boundary, which is exactly where the Trực is most sensitive.
- Tiết khí becomes a first-class computed concept, reusable by any later việc whose rules depend on solar terms.
- **Known non-goal:** `hnd.ts` hardcodes `TIMEZONE = 7`. The reference canon adjusts the Sóc to each period's _legal_ timezone, which is how it reproduces Tết Mậu Thân 1968 differing by a day between North and South. We accept that divergence for historical dates and do not attempt it.

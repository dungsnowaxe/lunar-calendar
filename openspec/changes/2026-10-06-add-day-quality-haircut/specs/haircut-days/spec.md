# haircut-days Specification

## Purpose

Applies the day-quality kernel to one việc: cutting hair. Defines which traditional rules govern it, where the verdict appears, and which adjacent rituals are deliberately excluded.

## ADDED Requirements

### Requirement: Cắt tóc is the only shipped việc

The system SHALL ship exactly one việc — cắt tóc — scored by the day-quality kernel. No other activity SHALL be scored or offered.

#### Scenario: Only haircut is offered

- **WHEN** a user reaches any day-quality surface
- **THEN** cắt tóc is the only việc available and no activity picker is presented

### Requirement: The cắt tóc rule set follows the reference canon

Cắt tóc SHALL be scored using the canonical layers: trực nhật, thập nhị trực, nhị thập bát tú, sao tháng, ngày kỵ cố định, and giờ hoàng đạo.

Trực take **three** levels: **Trừ, Thành, Khai, Định** SHALL be favourable at **+14**; **Phá, Bế, Nguy** SHALL be unfavourable at **−16**; the remaining five — Kiến, Mãn, Bình, Chấp, Thu — SHALL contribute **zero**.

Tú also take three levels, and here no level is zero: the six the canon names as kỵ (**Cang, Hư, Nguy, Chủy, Quỷ, Liễu**) SHALL be **−12**; a middle tier of eight (**Đê, Tâm, Ngưu, Nữ, Khuê, Mão, Tinh, Dực**) SHALL be **−4**; the remaining fourteen SHALL be **+10**. Because all 28 carry a non-zero weight, a tú line appears in every cắt tóc breakdown.

This requirement was originally written as a binary favourable/unfavourable/zero model, on the assumption that a tú was either in the canon's published kỵ set or neutral. Deriving the weights from the canon's own per-day scores (as the next requirement mandates) refuted that: the middle tier exists and is worth −4. The binary wording was corrected rather than the data discarded, because reproducing the canon exactly is a stated goal.

#### Scenario: A neutral Trực contributes nothing

- **WHEN** a day's Trực is Kiến, Mãn, Bình, Chấp or Thu
- **THEN** it contributes zero and no line for it appears in that day's breakdown

#### Scenario: Favourable Trực raises the score

- **WHEN** a day's Trực is Trừ, Thành, Khai, or Định
- **THEN** its contribution to the cắt tóc score is +14

#### Scenario: A middle-tier tú is a small penalty, not neutral

- **WHEN** a day's tú is one of Đê, Tâm, Ngưu, Nữ, Khuê, Mão, Tinh or Dực
- **THEN** it contributes −4 — unfavourable, but markedly less so than the canon's named kỵ set at −12

#### Scenario: Every day shows a tú line

- **WHEN** any day's cắt tóc breakdown is rendered
- **THEN** it includes exactly one tú contribution, which is +10, −4 or −12 and never zero

### Requirement: Tú weights are derived from canonical data only

The full tú weighting for cắt tóc is not published by the reference canon — it documents only the six kỵ tú. All three tiers SHALL be derived from the canon's own per-day scores. A tú weight MUST NOT be taken from a secondary source, and every one of the 28 tú SHALL have a determined weight for cắt tóc.

#### Scenario: Every tú has a determined weight

- **WHEN** the cắt tóc weight table is inspected
- **THEN** all 28 tú have an explicit weight and none is left to a default or a guess

#### Scenario: Secondary sources are not used

- **WHEN** a tú weight is recorded
- **THEN** its citation points to the reference canon's data and not to a secondary almanac site

#### Scenario: The derived table reproduces the canon

- **WHEN** the weight tables are replayed over the harvested fixture window
- **THEN** every day's computed cắt tóc score equals the score the canon published for it

### Requirement: Mùng 1 and ngày rằm are scored as a recorded divergence

Cắt tóc on **mùng 1** and on **ngày rằm** SHALL each reduce the score by 13, matching the magnitude the canon applies to Tam Nương and Nguyệt Kỵ. Both SHALL be stored and displayed as divergences from canon, since the canon names these taboos in prose but does not score them.

#### Scenario: Mùng 1 is penalised

- **WHEN** a day is mùng 1 of a lunar month
- **THEN** the cắt tóc score includes a −13 contribution marked as a divergence

#### Scenario: Ngày rằm is penalised

- **WHEN** a day is the 15th of a lunar month
- **THEN** the cắt tóc score includes a −13 contribution marked as a divergence

#### Scenario: Mùng 1 is not recommended as very good

- **WHEN** a month's days are ranked for cắt tóc
- **THEN** mùng 1 and ngày rằm do not appear in the top tier on the strength of their other qualities alone

### Requirement: TodayCard shows a tier and the dominant reason

The homepage TodayCard SHALL carry one line stating the cắt tóc đánh giá tier and the single strongest contribution to it. That line MUST NOT show a bare score number without a tier, and MUST NOT show a verdict without a reason. It SHALL link to the month page.

#### Scenario: Card shows tier and reason

- **WHEN** the homepage renders
- **THEN** the TodayCard shows a tier and a dominant reason on one line, and links to the month page

#### Scenario: Card reflects the selected chủ sự

- **WHEN** the user changes the selected chủ sự
- **THEN** the TodayCard line updates to that person's judgement

#### Scenario: Existing card content is unchanged

- **WHEN** the TodayCard renders
- **THEN** the weekday and solar date, the lunar date, and the Can–Chi day and month lines are all still present and unmodified

### Requirement: A ranked month page at the canonical route

The system SHALL provide a page at `/ngay-tot-cat-toc` listing the month's days ranked by cắt tóc score, with each day's tier and its full itemised contributions available on that page. The page SHALL support moving between months and SHALL be server-renderable.

#### Scenario: Days are ranked for the month

- **WHEN** a user opens `/ngay-tot-cat-toc`
- **THEN** the month's days appear ordered by cắt tóc score with their tiers

#### Scenario: Full breakdown is available

- **WHEN** a user opens a day's breakdown on the month page
- **THEN** every contribution is listed with rule, signed delta, explanation, and citation, and divergences are visually marked

### Requirement: No calendar cell markers for day quality

Day quality MUST NOT add markers to calendar date cells. The existing per-event marker behaviour of the memorial calendar SHALL remain unchanged.

#### Scenario: Calendar cells are untouched

- **WHEN** the month calendar renders
- **THEN** its cells show only the markers they showed before this capability existed

#### Scenario: Memorial marker semantics are unchanged

- **WHEN** a day carries both a memorial event and a favourable cắt tóc score
- **THEN** only the memorial event's marker is rendered in the cell

### Requirement: Adjacent rituals are excluded

**Cắt tóc máu** (an infant's first haircut) SHALL NOT be treated as cắt tóc; it is a distinct việc with different rules and is out of scope. **Tháng cô hồn** (the seventh lunar month) SHALL NOT be applied as a scored modifier. Nạp âm, xuất hành directions, hoa giáp position, and can giờ SHALL NOT be computed or displayed.

#### Scenario: Infant first haircut is not scored

- **WHEN** a user looks for guidance on cắt tóc máu
- **THEN** the system offers no verdict for it rather than returning the ordinary cắt tóc judgement

#### Scenario: Seventh lunar month is not penalised

- **WHEN** a day in the seventh lunar month is scored for cắt tóc
- **THEN** no contribution is applied on account of the month being tháng cô hồn

#### Scenario: Out-of-scope almanac data is absent

- **WHEN** any cắt tóc surface renders
- **THEN** no nạp âm, xuất hành direction, hoa giáp position, or can giờ is displayed

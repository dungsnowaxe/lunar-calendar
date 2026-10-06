# day-quality Specification

## Purpose

Judges whether a day suits a given việc, using the Vietnamese almanac tradition. Keeps two kinds of claim apart: the astronomical layer, which is computed and verifiable, and the belief layer, which is recorded tradition. Every judgement is for a việc and every judgement shows its reasoning.

## ADDED Requirements

### Requirement: Day quality is always for a việc

A day SHALL NOT be judged good or bad in isolation. Every score, tier, and verdict SHALL be qualified by the việc it applies to. The kernel SHALL be keyed by việc so that adding an activity is a data change and not a change to scoring logic.

#### Scenario: No unqualified verdict

- **WHEN** any surface displays a day's quality
- **THEN** the display names or implies the việc it refers to, and never presents a day as unconditionally good or bad

#### Scenario: Adding an activity does not touch scoring

- **WHEN** a second việc is registered with its own weight rows
- **THEN** it is scored by the same kernel without modifying the scoring code

### Requirement: Score is a clamped sum of itemised contributions

The score for a day and việc SHALL start from a baseline of 50, add every applicable contribution, and be clamped to the range 0 to 100 inclusive. Contributions SHALL NOT be flat per-layer values: each SHALL be weighted per việc and per layer, so the same Trực may contribute a positive amount for one việc and nothing for another.

#### Scenario: A day that exceeds the range is clamped

- **WHEN** a day's contributions sum above 100
- **THEN** the displayed score is 100 and the underlying contributions are still all shown

#### Scenario: The same Trực differs by việc

- **WHEN** a Trực is favourable for one việc and neutral for another on the same day
- **THEN** it contributes a positive amount to the first score and zero to the second

### Requirement: Contributions are visible with their citations

Every contribution to a score SHALL be available for display as a rule name, a signed delta, an explanation, and a citation to the source of the rule. A reader SHALL be able to sum the displayed contributions and reach the displayed score.

#### Scenario: The breakdown sums to the score

- **WHEN** a user opens the full breakdown for a day and việc
- **THEN** each contribution is listed with its rule, delta, explanation, and citation, and the visible deltas sum to the displayed score before clamping

### Requirement: Đánh giá is derived from the score

The đánh giá tier SHALL be a function of the score alone. A tier MUST NOT be produced independently of a score, and the tier thresholds SHALL be calibrated so the distribution over a year approximates the reference canon's.

#### Scenario: Tier follows score

- **WHEN** two days have the same score for the same việc
- **THEN** they receive the same đánh giá

#### Scenario: Good days stay rare

- **WHEN** a full year of days is scored for a việc
- **THEN** the top tier is reached by a minority of days rather than by most of them

### Requirement: Astronomy and belief are separated

Derivations that are computed and independently verifiable — lunar date, Can–Chi, tiết khí, thập nhị trực, nhị thập bát tú, trực nhật, and the twelve giờ with their presiding deities — SHALL live in the calendar core. Weight tables, kỵ lists, việc definitions, tier thresholds, **and the classification of which deities count as hoàng đạo** SHALL live outside it. The calendar core MUST NOT contain any opinion about what a day is good for.

#### Scenario: Core has no activity knowledge

- **WHEN** the calendar core's public surface is inspected
- **THEN** no export names a việc or expresses a favourable-or-unfavourable judgement

#### Scenario: An erratum is a data change

- **WHEN** the reference canon corrects a weight
- **THEN** the fix is a change to belief-layer table data and requires no change to the calendar core

### Requirement: Giờ hoàng đạo contributes without introducing time of day

The giờ hoàng đạo layer SHALL contribute to the score based on how many of the day's favourable double-hours fall within 07h–19h, derived from the day's Chi alone. The system SHALL NOT require a clock reading or a time-of-day input, and SHALL NOT assign any meaning to hours after 23h.

#### Scenario: Score needs no time input

- **WHEN** a day is scored
- **THEN** the giờ hoàng đạo contribution is determined by the date without any time being supplied

#### Scenario: No midnight-boundary semantics

- **WHEN** the day's giờ are considered
- **THEN** the double-hour straddling 23h–01h introduces no decision about which day it belongs to

### Requirement: Chủ sự is selectable and never persisted

A chủ sự SHALL be a named person with a birth-year Can–Chi. The system SHALL support several chủ sự and SHALL let the user choose whose judgement is shown. Chủ sự data MUST be held on the client only and MUST NOT be written to the database. Tuổi SHALL be one of the sixty Can–Chi combinations, not one of twelve animals.

#### Scenario: Birth data never reaches the server

- **WHEN** a chủ sự is created, edited, or selected
- **THEN** no request carries that birth-year data to the database

#### Scenario: Sixty tuổi, not twelve

- **WHEN** the user enters a chủ sự's tuổi
- **THEN** all sixty Can–Chi combinations are selectable

#### Scenario: Verdict is shown with no chủ sự

- **WHEN** no chủ sự has been entered
- **THEN** the day's quality is still shown for the việc, unchanged, with no prompt blocking it

### Requirement: Xung tuổi modifies the score but never vetoes

When a day is xung with the selected chủ sự's tuổi, the score SHALL be adjusted. A ngày xung MUST NOT by itself disqualify a day or remove it from consideration.

#### Scenario: A xung day remains visible

- **WHEN** the selected chủ sự's tuổi is xung with a day that scores well
- **THEN** the day's score is lowered but the day still appears in listings with its breakdown

### Requirement: Divergences from canon are recorded

Where the system scores a rule the reference canon describes but does not score, that rule SHALL be stored as belief-layer data explicitly marked as a divergence, with its own citation and justification. A divergence MUST NOT be indistinguishable from a canonical rule.

#### Scenario: A divergence is marked

- **WHEN** a divergence rule contributes to a score
- **THEN** its contribution is identifiable as a divergence rather than presented as canonical

### Requirement: Belief output is attributed, astronomical output is not

Scores and tiers SHALL be presented as recorded folk tradition with their reasoning visible, accompanied by a short disclaimer that states this is cultural reference and not scientific or professional advice. Computed astronomical values SHALL be presented without qualification. The disclaimer MUST NOT be presented as a modal or interstitial that blocks the content.

#### Scenario: Belief carries its status

- **WHEN** a score or tier is displayed
- **THEN** the surrounding copy attributes it to tradition and a disclaimer is visible on the same surface

#### Scenario: Astronomy carries no hedge

- **WHEN** a lunar date, Can–Chi, tiết khí, Trực, or tú is displayed
- **THEN** it is presented as a computed value with no disclaimer attached

#### Scenario: Disclaimer does not block

- **WHEN** a user opens any day-quality surface
- **THEN** the content is immediately readable and no acknowledgement is required

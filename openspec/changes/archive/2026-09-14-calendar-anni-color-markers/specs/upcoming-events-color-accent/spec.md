## Purpose

Links the upcoming-events sidebar to the calendar by giving each anniversary row a color accent that matches its calendar marker, so users can recognize whose giỗ is coming without reading every title.

## ADDED Requirements

### Requirement: Upcoming event rows show color accent

The system SHALL display each memorial event in the upcoming-events list with a left border accent in the event's assigned color slot. The accent MUST span the full height of the row.

#### Scenario: Upcoming row accent

- **WHEN** the upcoming-events list shows a memorial event
- **THEN** that row displays a left border in the same color slot used for the event's calendar marker

### Requirement: Accent matches calendar for the same event

For any memorial event shown in both the upcoming-events list and the calendar, the list accent color MUST equal the calendar marker color.

#### Scenario: Cross-surface color match

- **WHEN** an event appears in the upcoming list and also has a marker on its occurrence date in the calendar
- **THEN** the list left border and the calendar marker use the same color slot

### Requirement: Today's event is visually distinct

When a memorial event occurs today, the upcoming-events list MUST still show the event's color accent while preserving the existing "today" emphasis (e.g. badge or countdown treatment).

#### Scenario: Event occurring today

- **WHEN** a memorial event's next occurrence is today
- **THEN** the row shows the event's color accent and the existing today indicator together

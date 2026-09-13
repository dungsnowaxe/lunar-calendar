# calendar-event-markers Specification

## Purpose

Lets users scan the month calendar and immediately see which days have death anniversaries and which person each dot represents, using the same color identity as elsewhere in the app.

## Requirements

### Requirement: Calendar cells show per-event colored markers

The system SHALL display a small colored marker at the bottom of each calendar date cell for every memorial event occurring on that solar date. Each marker MUST use the color slot assigned to that event.

#### Scenario: Single event on a day

- **WHEN** one memorial event falls on a calendar date in the visible month
- **THEN** that date cell shows one colored marker matching the event's color slot

#### Scenario: Multiple events on the same day

- **WHEN** two or more memorial events fall on the same calendar date
- **THEN** that date cell shows one colored marker per event, arranged in a compact row without overlapping the day number

### Requirement: Selected-day detail shows matching colors

When a user selects a calendar date, the system SHALL list each memorial event on that date with a colored marker beside the event title. Each marker MUST match the marker shown on the calendar cell for that event.

#### Scenario: Detail panel matches cell markers

- **WHEN** the user selects a date that has memorial events
- **THEN** each event listed in the detail panel displays a marker in the same color slot as on the calendar cell

### Requirement: Markers remain visible on interactive cell states

Event color markers MUST remain distinguishable when the date cell is in its default, hover, today-highlight, or selected state.

#### Scenario: Selected date cell

- **WHEN** the user selects a date that has one or more memorial events
- **THEN** colored markers remain visible and identifiable on the selected cell

#### Scenario: Today highlight

- **WHEN** today's date has memorial events and is not selected
- **THEN** colored markers remain visible alongside the today ring highlight

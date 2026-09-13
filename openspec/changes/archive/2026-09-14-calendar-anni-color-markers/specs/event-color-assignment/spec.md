## Purpose

Provides a stable, automatic color identity for each memorial event so the calendar and upcoming-events list can visually distinguish anniversaries without storing colors in the database or asking users to pick one.

## ADDED Requirements

### Requirement: Event color is derived from event identity

The system SHALL assign each memorial event a color slot in the range 0–11 by deterministically hashing the event's unique identifier. The same event MUST receive the same color slot on every page load, view, and device.

#### Scenario: Same event, consistent color

- **WHEN** a memorial event appears in the calendar and in the upcoming-events list
- **THEN** both surfaces use the identical color slot for that event

#### Scenario: New session preserves color

- **WHEN** the user reloads the application
- **THEN** each existing memorial event retains the same color slot as before the reload

### Requirement: Palette supports light and dark themes

The system SHALL expose exactly twelve event color slots. Each slot MUST render with sufficient contrast against calendar cell backgrounds and upcoming-event row backgrounds in both light mode and dark mode.

#### Scenario: Light mode contrast

- **WHEN** the application is in light mode
- **THEN** event color markers and accents are clearly visible on white or near-white surfaces

#### Scenario: Dark mode contrast

- **WHEN** the application is in dark mode
- **THEN** event color markers and accents are clearly visible on dark calendar and list surfaces

### Requirement: No manual color selection or persistence

The system SHALL NOT require users to choose a color when creating or editing a memorial event. The system SHALL NOT persist event color in the database or server layer.

#### Scenario: Create event without color input

- **WHEN** a user creates a new memorial event with title and lunar date only
- **THEN** the event receives an automatic color slot without any color field in the form or API payload

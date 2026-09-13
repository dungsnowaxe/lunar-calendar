# memorial-events Specification

## Purpose

Lets families record death anniversaries (ngày giỗ) in a remembrance-appropriate way: add several lunar dates in one session, open add from the homepage without leaving the calendar, use short date labels, present the form as a dialog or bottom sheet by viewport, and start from a clean form each time the overlay opens.

## Requirements

### Requirement: Remembrance iconography
Wherever the product represents a death anniversary or the empty events list, it SHALL use an icon that does not convey celebration, birthday, or party. A birthday-cake icon MUST NOT be used.

#### Scenario: Event list and calendar use a non-celebratory icon
- **WHEN** a memorial event is shown in the upcoming list, the selected-day calendar detail, or the events list
- **THEN** the event is accompanied by a remembrance-appropriate icon and not a birthday cake

#### Scenario: Empty events state uses a non-celebratory icon
- **WHEN** the events page has no memorial events
- **THEN** the empty state uses a remembrance-appropriate icon and not a birthday cake

### Requirement: Homepage add opens overlay in place
Activating **Thêm** on the homepage SHALL open the add overlay without navigating away from the homepage. The Sự kiện page MUST remain available for managing the full list.

#### Scenario: Homepage Thêm opens add overlay
- **WHEN** the user activates **Thêm** on the homepage upcoming section
- **THEN** the add overlay opens and the user remains on the homepage

#### Scenario: Homepage Thêm does not go to Sự kiện
- **WHEN** the user activates **Thêm** on the homepage upcoming section
- **THEN** the app MUST NOT navigate to the Sự kiện page as the way to start adding

### Requirement: Multiple lunar dates in one add session
The add overlay SHALL let the user enter more than one death anniversary in a single session. Each entry MUST include a title and a lunar day and month, and MAY include notes. The user SHALL be able to add another entry and remove an extra entry before saving. On a phone-sized viewport, adding, removing, filling, and submitting entries MUST remain possible inside the overlay.

#### Scenario: User adds two dates then saves
- **WHEN** the user opens add, enters two complete death anniversaries, and saves
- **THEN** both events are persisted as yearly-repeating lunar dates and the overlay closes

#### Scenario: User removes an extra date before saving
- **WHEN** the user has more than one date entry in the add overlay and removes one
- **THEN** that entry is no longer submitted and the remaining entries stay

#### Scenario: Invalid batch is not saved
- **WHEN** the user tries to save and at least one entry is missing a title or lunar date
- **THEN** the system shows an error, persists none of the entries, and keeps the overlay open

#### Scenario: Phone can complete a multi-date add
- **WHEN** the user adds more than one date on a phone-sized viewport
- **THEN** they can select day and month, add or remove entries, and submit without leaving the overlay

### Requirement: Short lunar date field labels
In the add and edit overlay, the day field label SHALL be **Ngày** and the month field label SHALL be **Tháng**. Those labels MUST NOT include "âm lịch".

#### Scenario: Add overlay shows short labels
- **WHEN** the user opens the add overlay
- **THEN** the day field is labeled **Ngày** and the month field is labeled **Tháng**

#### Scenario: Edit overlay shows short labels
- **WHEN** the user opens the edit overlay
- **THEN** the day field is labeled **Ngày** and the month field is labeled **Tháng**

### Requirement: Numeric day and month options
Day and month options SHALL display only the numeric value (for example `10` and `1`). Option text MUST NOT repeat **Ngày** or **Tháng**.

#### Scenario: Day options are numbers only
- **WHEN** the user opens the day selector
- **THEN** each option shows the day number without the word **Ngày**

#### Scenario: Month options are numbers only
- **WHEN** the user opens the month selector
- **THEN** each option shows the month number without the word **Tháng**

### Requirement: Dialog on desktop, bottom sheet on tablet and mobile
The add and edit overlay SHALL appear as a centered dialog on a desktop-sized viewport and as a bottom sheet on tablet- and phone-sized viewports.

#### Scenario: Desktop uses a dialog
- **WHEN** the user opens add or edit on a desktop-sized viewport
- **THEN** the form is presented as a centered dialog

#### Scenario: Tablet uses a bottom sheet
- **WHEN** the user opens add or edit on a tablet-sized viewport
- **THEN** the form is presented as a bottom sheet

#### Scenario: Phone uses a bottom sheet
- **WHEN** the user opens add or edit on a phone-sized viewport
- **THEN** the form is presented as a bottom sheet

### Requirement: Form resets when the overlay closes
When the add or edit overlay closes, the form SHALL reset so the next open does not show the previous session’s values, extra date entries, or errors. Closing includes cancel, dismiss, and successful save. A failed save MUST NOT reset the form; the overlay stays open with the entered values.

#### Scenario: Cancelled add does not linger
- **WHEN** the user enters data in add, closes without saving, then opens add again
- **THEN** the form is a fresh add: one date entry, empty title and notes, no leftover extra dates, and no error

#### Scenario: Add after edit starts blank
- **WHEN** the user finishes or dismisses edit and then opens add
- **THEN** the overlay is in add mode with a fresh form, not the edited event’s values

#### Scenario: Failed save keeps input
- **WHEN** save fails validation or the server
- **THEN** the overlay stays open and the entered values remain

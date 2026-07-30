# Requirements Document

## Introduction

This document describes five enhancements to the existing To-Do List Life Dashboard — a standalone, client-side single-page application built with HTML, CSS, and vanilla JavaScript. The enhancements add user-preference features (light/dark theme, custom name), a configurable focus timer, and task-list quality improvements (duplicate prevention, sort order). All new state is persisted exclusively in the browser's Local Storage, consistent with the existing architecture. No new files, frameworks, or build steps are introduced.

## Glossary

- **Dashboard**: The existing single-page web application (`index.html`, `css/style.css`, `js/app.js`).
- **Theme_Manager**: The new JavaScript module responsible for reading, applying, and persisting the user's chosen color theme.
- **Theme_Toggle**: The UI control (button or switch) that switches between dark and light mode.
- **Dark_Theme**: The existing default color scheme using dark backgrounds and light text (CSS custom-property values currently set in `:root`).
- **Light_Theme**: The alternative color scheme using light backgrounds and dark text, applied via a CSS class or data attribute on the `<body>` element.
- **Name_Manager**: The new JavaScript module responsible for reading, storing, and providing the user's display name.
- **Name_Input**: The UI control (inline text field) inside the Greeting_Widget that lets the user enter or change their display name.
- **Display_Name**: The user-supplied string shown inside the greeting, e.g. "Good Morning, Ahmad!".
- **Greeting_Widget**: The existing UI section displaying the current time, date, and greeting (extended by this spec to include a Display_Name and Name_Input).
- **Timer_Config**: The new JavaScript module responsible for reading, storing, and providing the user's custom timer duration.
- **Duration_Input**: The UI control (number input) that lets the user set a custom Pomodoro duration in minutes before starting the timer.
- **Focus_Timer**: The existing countdown timer module, extended to accept a configurable initial duration.
- **Todo_Manager**: The existing JavaScript component managing task CRUD — extended by this spec to enforce duplicate detection.
- **Todo_List**: The existing UI renderer for tasks — extended to display an error message on duplicate submission and a sort control.
- **Sort_Control**: A `<select>` element in the Todo_List section that sets the active sort order.
- **Sort_Order**: One of four values: `creation` (default), `alpha-asc`, `alpha-desc`, `completed-last`.
- **LocalStorage_Manager**: The existing module for Local Storage reads/writes — extended to handle theme, name, timer duration, and sort-order keys.
- **Modern Browser**: Chrome (latest), Firefox (latest), Edge (latest), and Safari (latest).

---

## Requirements

### Requirement 1: Light / Dark Mode Toggle

**User Story:** As a user, I want to switch between a dark and a light color theme so that I can choose the appearance that is most comfortable for my environment.

#### Acceptance Criteria

1. THE Dashboard SHALL render a Theme_Toggle control that is always visible and accessible without scrolling.
2. WHEN the user activates the Theme_Toggle, THE Theme_Manager SHALL switch the active theme from Dark_Theme to Light_Theme, or from Light_Theme to Dark_Theme.
3. WHEN the Light_Theme is active, THE Dashboard SHALL apply a light-background, dark-text color scheme to all sections without leaving any section in the Dark_Theme colors.
4. WHEN the Theme_Manager switches the theme, THE Theme_Manager SHALL persist the new theme preference to Local Storage under the key `tld_theme` immediately.
5. WHEN the Dashboard loads, THE Theme_Manager SHALL read `tld_theme` from Local Storage and apply the saved theme before the first render, so that no theme flash occurs.
6. IF `tld_theme` is missing or contains an unrecognized value, THEN THE Theme_Manager SHALL apply the Dark_Theme as the default.
7. WHEN the active theme changes, THE Theme_Toggle SHALL update its accessible label to reflect the new state (e.g., "Switch to dark mode" when Light_Theme is active).

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting shows "Good Morning, [Name]!" and feels personalized.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display a Name_Input control that allows the user to enter or change their Display_Name.
2. WHEN the user submits a non-empty, non-whitespace-only string via the Name_Input, THE Name_Manager SHALL trim the value and persist it to Local Storage under the key `tld_name`.
3. WHEN a Display_Name is set and non-empty, THE Greeting_Widget SHALL display the greeting in the format "[Greeting], [Display_Name]!" (e.g., "Good Morning, Ahmad!").
4. WHEN no Display_Name is set or the stored value is empty, THE Greeting_Widget SHALL display the greeting without a name (e.g., "Good Morning") — matching the existing behavior.
5. WHEN the Dashboard loads, THE Name_Manager SHALL read `tld_name` from Local Storage and supply the value to the Greeting_Widget before the first render.
6. WHEN the user clears the Name_Input and submits an empty or whitespace-only value, THE Name_Manager SHALL remove the stored name and THE Greeting_Widget SHALL revert to the nameless greeting format.
7. IF `tld_name` is missing from Local Storage, THEN THE Name_Manager SHALL return an empty string, and THE Greeting_Widget SHALL display the nameless greeting.

---

### Requirement 3: Configurable Pomodoro Timer Duration

**User Story:** As a user, I want to set a custom timer duration so that I can adapt the focus session length to my workflow rather than being fixed at 25 minutes.

#### Acceptance Criteria

1. THE Focus_Timer section SHALL render a Duration_Input that accepts an integer number of minutes.
2. THE Duration_Input SHALL accept values between 1 and 180 (inclusive) and reject values outside this range.
3. WHEN the user sets a valid duration via the Duration_Input and the Focus_Timer is not running, THE Timer_Config SHALL persist the new duration (in minutes) to Local Storage under the key `tld_timer_duration` and THE Focus_Timer SHALL update its displayed countdown to the new duration without starting.
4. WHEN the Focus_Timer is running, THE Duration_Input SHALL be disabled so that the duration cannot be changed mid-session.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL reset to the currently configured duration (not necessarily 25 minutes) and THE Duration_Input SHALL be re-enabled.
6. WHEN the Dashboard loads, THE Timer_Config SHALL read `tld_timer_duration` from Local Storage and initialize the Focus_Timer display to the saved duration.
7. IF `tld_timer_duration` is missing or contains a value outside the range 1–180, THEN THE Timer_Config SHALL use 25 as the default duration.

---

### Requirement 4: Prevent Duplicate Tasks

**User Story:** As a user, I want the dashboard to block me from adding or editing a task to a description that already exists so that my list stays free of duplicates.

#### Acceptance Criteria

1. WHEN the user attempts to add a task whose description, after trimming and case-insensitive comparison, matches the description of any existing Task in the list, THE Todo_Manager SHALL reject the submission and return a duplicate-error signal.
2. WHEN a duplicate-error signal is received, THE Todo_List SHALL display an inline error message adjacent to the add input indicating that the task already exists. The error message SHALL disappear when the user modifies the input field.
3. WHEN the user attempts to save an edited task whose new description, after trimming and case-insensitive comparison, matches the description of any other Task in the list (excluding the task being edited), THE Todo_Manager SHALL reject the update and return a duplicate-error signal.
4. WHEN a duplicate-error signal is received during an edit, THE Todo_List SHALL display an inline error message adjacent to the edit input. The error message SHALL disappear when the user modifies the edit input.
5. THE Todo_Manager SHALL treat two descriptions as duplicates if and only if their trimmed, lower-cased values are equal.
6. WHEN a duplicate is rejected, THE Todo_List SHALL retain focus on the input that triggered the error to allow the user to correct the value.

---

### Requirement 5: Sort Tasks

**User Story:** As a user, I want to sort my task list by different criteria so that I can view my tasks in the order that is most useful to me at any given time.

#### Acceptance Criteria

1. THE Todo_List section SHALL render a Sort_Control that lets the user choose a Sort_Order.
2. THE Sort_Control SHALL offer exactly four options: creation order (default), alphabetical A→Z, alphabetical Z→A, and completed-last (incomplete tasks first, completed tasks last).
3. WHEN the user changes the Sort_Control selection, THE Todo_List SHALL re-render the task list in the new Sort_Order immediately without a page reload.
4. WHEN Sort_Order is `alpha-asc`, THE Todo_List SHALL render tasks sorted by description in ascending lexicographic order, case-insensitive.
5. WHEN Sort_Order is `alpha-desc`, THE Todo_List SHALL render tasks sorted by description in descending lexicographic order, case-insensitive.
6. WHEN Sort_Order is `completed-last`, THE Todo_List SHALL render incomplete tasks before completed tasks, preserving the relative creation order within each group.
7. WHEN Sort_Order is `creation` (the default), THE Todo_List SHALL render tasks in the order they were added to the list.
8. THE Sort_Control SHALL persist the selected Sort_Order to Local Storage under the key `tld_sort_order` whenever the selection changes.
9. WHEN the Dashboard loads, THE Todo_List SHALL read `tld_sort_order` from Local Storage and apply the saved Sort_Order on initial render.
10. IF `tld_sort_order` is missing or contains an unrecognized value, THEN THE Todo_List SHALL default to `creation` order.
11. WHEN tasks are added, edited, deleted, or their completion state is toggled, THE Todo_List SHALL re-render the list using the currently active Sort_Order.

---

### Requirement 6: Backward Compatibility and Constraints

**User Story:** As a developer, I want all enhancements to integrate into the existing single-file architecture without breaking current functionality so that the app remains easy to maintain and deploy.

#### Acceptance Criteria

1. THE Dashboard SHALL continue to be implemented using only HTML, CSS, and vanilla JavaScript with no external frameworks or build tools introduced by these enhancements.
2. THE Dashboard SHALL remain a single HTML file, one CSS file (`css/style.css`), and one JavaScript file (`js/app.js`) after the enhancements are applied.
3. THE Dashboard SHALL remain openable directly in a Modern Browser by loading the HTML file from the filesystem without a local server.
4. WHEN the enhancements are applied, all existing features (Greeting_Widget time/date display, Focus_Timer 25-minute default, To-Do list CRUD, Quick Links CRUD) SHALL continue to function as specified in the original requirements document.
5. THE LocalStorage_Manager SHALL add four new keys (`tld_theme`, `tld_name`, `tld_timer_duration`, `tld_sort_order`) without modifying or conflicting with the existing keys (`tld_tasks`, `tld_links`).
6. IF any of the four new Local Storage keys is missing or unparseable, THEN THE Dashboard SHALL fall back to the documented defaults for that feature without affecting other features.

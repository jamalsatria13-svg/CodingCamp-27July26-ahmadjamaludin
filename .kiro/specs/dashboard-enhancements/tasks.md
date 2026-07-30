# Implementation Plan: Dashboard Enhancements

## Overview

Implement five enhancements to the existing To-Do List Life Dashboard within the existing three files (`index.html`, `css/style.css`, `js/app.js`). The approach follows the module map in the design: extend `LocalStorage_Manager` first, then add the three new modules (`Theme_Manager`, `Name_Manager`, `Timer_Config`), extend the existing widgets, wire everything in the entry point, and update the HTML/CSS in parallel with the JS changes.

## Tasks

- [ ] 1. Extend LocalStorage_Manager with four new keys
  - [ ] 1.1 Add `theme`, `name`, `timerDuration`, and `sortOrder` keys to the `KEYS` constant in `LocalStorage_Manager` inside `js/app.js`
    - Add `theme: 'tld_theme'`, `name: 'tld_name'`, `timerDuration: 'tld_timer_duration'`, `sortOrder: 'tld_sort_order'` to the `KEYS` object
    - Add `saveTheme(theme)` / `loadTheme()` methods — `loadTheme` returns `''` (empty string) if key is missing
    - Add `saveName(name)` / `loadName()` methods — `loadName` returns `''` if key is missing
    - Add `saveTimerDuration(minutes)` / `loadTimerDuration()` methods — `loadTimerDuration` returns `null` if key is missing or the stored value cannot be parsed as a number
    - Add `saveSortOrder(order)` / `loadSortOrder()` methods — `loadSortOrder` returns `''` if key is missing
    - For string keys (`theme`, `name`, `sortOrder`), use `localStorage.getItem` / `localStorage.setItem` directly (no JSON wrapping needed); for `timerDuration` use `JSON.parse`/`JSON.stringify`
    - _Requirements: 1.4, 1.5, 2.2, 2.5, 3.3, 3.6, 5.8, 5.9, 6.5_

- [ ] 2. Add Theme_Manager module and inline no-flash script
  - [ ] 2.1 Add the inline no-flash `<script>` block to `index.html` inside `<head>`, before the `<link rel="stylesheet">` tag
    - Script reads `localStorage.getItem('tld_theme')` and sets `document.documentElement.dataset.theme` to `'light'` if the value equals `'light'`, otherwise `'dark'`
    - _Requirements: 1.5, 1.6_
  - [ ] 2.2 Add the `Theme_Manager` IIFE module in `js/app.js` (place it after `LocalStorage_Manager` and before `Greeting_Widget`)
    - Declare `THEMES = { DARK: 'dark', LIGHT: 'light' }` and `DEFAULT_THEME = THEMES.DARK`
    - Implement `_apply(theme)`: sets `document.documentElement.dataset.theme = theme`; updates the `#theme-toggle` button's `aria-label` to `'Switch to dark mode'` when `'light'`, `'Switch to light mode'` when `'dark'`; updates button text emoji accordingly (`☀️` when `light`, `🌙` when `dark`)
    - Implement `getTheme()`: returns current in-memory theme value
    - Implement `setTheme(theme)`: validates that `theme` is `'dark'` or `'light'`; if valid, updates memory, calls `_apply(theme)`, calls `LocalStorage_Manager.saveTheme(theme)`; otherwise does nothing
    - Implement `toggle()`: calls `setTheme` with the opposite of `getTheme()`
    - Implement `init()`: reads `LocalStorage_Manager.loadTheme()`, resolves to `DEFAULT_THEME` if the loaded value is not `'light'` or `'dark'`, calls `_apply()` with the resolved theme, binds a `'click'` listener on `#theme-toggle` that calls `toggle()`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_
  - [ ]* 2.3 Write property tests for Theme_Manager
    - **Property 1: Theme toggle is a self-inverse (round-trip)**
    - **Validates: Requirements 1.2**
    - **Property 2: Theme persistence round-trip**
    - **Validates: Requirements 1.4**
    - **Property 3: Invalid stored theme defaults to dark**
    - **Validates: Requirements 1.6**

- [ ] 3. Add theme toggle button to index.html and light-theme CSS overrides to style.css
  - [ ] 3.1 Add the `#theme-toggle` button to `index.html` immediately after `<body>` opens, before the `.dashboard` div
    - Use the markup from the design: `<button id="theme-toggle" class="btn btn-ghost theme-toggle-btn" type="button" aria-label="Switch to light mode">🌙</button>`
    - _Requirements: 1.1, 1.7_
  - [ ] 3.2 Add the light-theme CSS rule and all new component styles to `css/style.css`
    - Add `[data-theme="light"]` block overriding the seven custom properties (`--clr-bg`, `--clr-surface`, `--clr-surface-alt`, `--clr-border`, `--clr-text`, `--clr-text-muted`, `--clr-shadow-card`) with the light values from the design
    - Add `.theme-toggle-btn` rule: `position: fixed; top: var(--sp-4); right: var(--sp-4); z-index: 100; font-size: var(--fs-lg); padding: var(--sp-2); border-radius: var(--radius-sm); line-height: 1;`
    - Add `.duration-row`, `.duration-label`, `.duration-input`, `.duration-input:disabled` rules from the design
    - Add `.sort-row`, `.sort-label`, `.sort-select`, `.sort-select:focus` rules from the design
    - Add `.name-form` rule from the design
    - Add `.field-error` and `.field-error[hidden]` rules from the design
    - _Requirements: 1.3, 3.4, 5.1, 2.1, 4.2_

- [ ] 4. Add Name_Manager module and Name_Input HTML
  - [ ] 4.1 Add the `Name_Manager` IIFE module in `js/app.js` (place after `Theme_Manager`)
    - Declare a private `_name` variable initialized to `''`
    - Implement `getName()`: returns `_name`
    - Implement `setName(raw)`: trims `raw`; if result is non-empty, sets `_name` to trimmed value and calls `LocalStorage_Manager.saveName(trimmed)`; if result is empty, sets `_name` to `''` and calls `LocalStorage_Manager.saveName('')`; after updating `_name`, calls `Greeting_Widget.updateGreeting()` to re-render the greeting
    - Implement `init()`: sets `_name` to `LocalStorage_Manager.loadName()` (already trimmed from storage, defaults to `''`)
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 2.7_
  - [ ]* 4.2 Write property tests for Name_Manager
    - **Property 6: setName trims and stores non-empty input**
    - **Validates: Requirements 2.2**
    - **Property 7: setName with whitespace-only input clears the name**
    - **Validates: Requirements 2.6**
  - [ ] 4.3 Add `#name-form` HTML to `index.html` inside the greeting card, below the `.date-display` paragraph
    - Use the markup from the design: form with `id="name-form"` containing `id="name-input"` text input and a submit button
    - _Requirements: 2.1_

- [ ] 5. Extend Greeting_Widget to support Display_Name
  - [ ] 5.1 Add `formatGreeting(hour, name)` pure function inside `Greeting_Widget`
    - If `name.trim()` is non-empty: return `` `${getGreeting(hour)}, ${name.trim()}!` ``
    - If `name.trim()` is empty: return `getGreeting(hour)` (no punctuation, no suffix)
    - _Requirements: 2.3, 2.4_
  - [ ] 5.2 Add `updateGreeting()` method to `Greeting_Widget`'s public API
    - Reads the current hour from `new Date()`, calls `formatGreeting(hour, Name_Manager.getName())`, and sets `document.getElementById('greeting-text').textContent` to the result
    - _Requirements: 2.3, 2.4_
  - [ ] 5.3 Update `_tick()` inside `Greeting_Widget` to call `formatGreeting(now.getHours(), Name_Manager.getName())` instead of `getGreeting(now.getHours())` when setting `elGreeting.textContent`
    - _Requirements: 2.3, 2.4_
  - [ ] 5.4 Bind the `#name-form` submit event inside `Greeting_Widget.init()` (or a new `Name_Manager.bindForm()` helper called from the entry point)
    - On submit: prevent default, call `Name_Manager.setName(nameInput.value)`, clear the input field if a name was set, or leave it if empty was submitted
    - _Requirements: 2.1, 2.2, 2.6_
  - [ ]* 5.5 Write property tests for Greeting_Widget.formatGreeting
    - **Property 4: formatGreeting with non-empty name produces "[greeting], [name]!" format**
    - **Validates: Requirements 2.3**
    - **Property 5: formatGreeting with empty name returns plain greeting with no suffix**
    - **Validates: Requirements 2.4**

- [ ] 6. Checkpoint — verify theme and name features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add Timer_Config module and Duration_Input HTML
  - [ ] 7.1 Add the `Timer_Config` IIFE module in `js/app.js` (place after `Name_Manager`, before `Greeting_Widget`)
    - Declare `TIMER_MIN = 1`, `TIMER_MAX = 180`, `TIMER_DEFAULT = 25` and a private `_duration` variable
    - Implement `getDuration()`: returns `_duration`
    - Implement `setDuration(minutes)`: validates that `minutes` is an integer in [1, 180]; if valid, sets `_duration = minutes`, calls `LocalStorage_Manager.saveTimerDuration(minutes)`, and returns `true`; if invalid, returns `false` without changing state
    - Implement `init()`: reads `LocalStorage_Manager.loadTimerDuration()`; if the loaded value is an integer in [1, 180], sets `_duration` to it; otherwise sets `_duration = TIMER_DEFAULT`
    - _Requirements: 3.2, 3.3, 3.6, 3.7_
  - [ ]* 7.2 Write property tests for Timer_Config
    - **Property 8: setDuration returns true iff minutes is an integer in [1, 180]**
    - **Validates: Requirements 3.2**
    - **Property 9: Timer duration persistence round-trip**
    - **Validates: Requirements 3.3**
    - **Property 11: Invalid stored timer duration defaults to 25**
    - **Validates: Requirements 3.7**
  - [ ] 7.3 Add `#timer-duration` Duration_Input HTML to `index.html` inside the timer card, above the `#timer-display` element
    - Use the markup from the design: `<div class="duration-row">` containing `<label for="timer-duration">` and the `<input id="timer-duration" type="number" min="1" max="180" value="25">`
    - _Requirements: 3.1, 3.2_

- [ ] 8. Extend Focus_Timer to use Timer_Config
  - [ ] 8.1 Replace the hardcoded `INITIAL_SECONDS = 25 * 60` in `Focus_Timer` with a dynamic value sourced from `Timer_Config.getDuration() * 60`
    - Move `INITIAL_SECONDS` from a module-level const to a `let` local variable inside the IIFE, initialized lazily in `init()` from `Timer_Config.getDuration() * 60`
    - Update `reset()` to reset `state.remaining` to `Timer_Config.getDuration() * 60` (not the old hardcoded value)
    - _Requirements: 3.5, 3.6, 3.7_
  - [ ] 8.2 Add `Focus_Timer.setInitialSeconds(seconds)` public method
    - Sets the internal initial-seconds reference so that `reset()` uses the new value
    - If the timer is not running, also updates `state.remaining` to `seconds` and calls `_render()`
    - _Requirements: 3.3_
  - [ ] 8.3 Bind the `#timer-duration` input's `'change'` event inside `Focus_Timer.init()`
    - Cache `_elDuration = document.getElementById('timer-duration')` alongside the other cached elements
    - On `change`: parse the input's value as an integer; call `Timer_Config.setDuration(parsed)`; if it returns `true`, call `Focus_Timer.setInitialSeconds(parsed * 60)`; otherwise revert `_elDuration.value` to `Timer_Config.getDuration()`
    - Set `_elDuration.value = Timer_Config.getDuration()` during `init()` to reflect the loaded duration
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 8.4 Update `Focus_Timer._render()` to toggle `_elDuration.disabled = state.running` so the duration input is disabled while the timer is running and re-enabled after stop/reset
    - _Requirements: 3.4, 3.5_
  - [ ]* 8.5 Write property test for timer reset uses configured duration
    - **Property 10: After setDuration(n) and reset(), getState().remaining equals n * 60**
    - **Validates: Requirements 3.5**

- [ ] 9. Checkpoint — verify timer features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Extend Todo_Manager with duplicate detection
  - [ ] 10.1 Add `_isDuplicate(description, excludeId)` internal helper inside `Todo_Manager`
    - Returns `true` if any task whose `id !== excludeId` has `task.description.trim().toLowerCase() === description.trim().toLowerCase()`
    - `excludeId` is `null` for add operations (compare against all tasks), or the task's own `id` for edit operations (exclude the task being edited)
    - _Requirements: 4.5_
  - [ ]* 10.2 Write property tests for Todo_Manager duplicate detection
    - **Property 12: _isDuplicate is case-insensitive and trim-aware**
    - **Validates: Requirements 4.5**
    - **Property 13: Duplicate add leaves the list unchanged**
    - **Validates: Requirements 4.1**
    - **Property 14: Duplicate edit leaves the task unchanged**
    - **Validates: Requirements 4.3**
  - [ ] 10.3 Update `addTask(description)` in `Todo_Manager` to call `_isDuplicate(trimmed, null)` after the empty-check; return `{ type: 'duplicate' }` if a duplicate is found; otherwise continue with existing create logic
    - _Requirements: 4.1_
  - [ ] 10.4 Update `updateTask(id, description)` in `Todo_Manager` to call `_isDuplicate(trimmed, id)` after the empty/not-found checks; return `{ type: 'duplicate' }` if a duplicate is found; otherwise continue with existing update logic
    - _Requirements: 4.3_

- [ ] 11. Add Sort_Control HTML, extend Todo_List with sort and error display
  - [ ] 11.1 Add `#todo-sort` Sort_Control HTML to `index.html` inside the todo card, between `.section-title` and `#todo-add-form`
    - Use the markup from the design: `<div class="sort-row">` with `<label for="todo-sort">` and `<select id="todo-sort">` containing the four `<option>` elements (`creation`, `alpha-asc`, `alpha-desc`, `completed-last`)
    - _Requirements: 5.1, 5.2_
  - [ ] 11.2 Add `#todo-add-error` error placeholder HTML to `index.html` immediately after the `#todo-add-form` closing tag
    - Use the markup from the design: `<p id="todo-add-error" class="field-error" role="alert" aria-live="polite" hidden></p>`
    - _Requirements: 4.2_
  - [ ] 11.3 Add `_sortTasks(tasks, order)` pure helper function inside `Todo_List`
    - `'creation'`: return `tasks.slice()` (preserves original order)
    - `'alpha-asc'`: sort by `description.toLowerCase()` ascending
    - `'alpha-desc'`: sort by `description.toLowerCase()` descending
    - `'completed-last'`: stable-sort so `completed === false` tasks come first, `completed === true` tasks last, preserving relative order within each group
    - _Requirements: 5.4, 5.5, 5.6, 5.7_
  - [ ]* 11.4 Write property tests for Todo_List._sortTasks
    - **Property 15: alpha-asc produces non-decreasing case-insensitive order**
    - **Validates: Requirements 5.4**
    - **Property 16: alpha-desc produces non-increasing case-insensitive order**
    - **Validates: Requirements 5.5**
    - **Property 17: completed-last places all incomplete tasks before all completed tasks**
    - **Validates: Requirements 5.6**
    - **Property 18: creation sort preserves original array order**
    - **Validates: Requirements 5.7**
  - [ ] 11.5 Add `_sortOrder` private variable (initialized to `'creation'`) and update `render()` inside `Todo_List` to call `_sortTasks(Todo_Manager.getTasks(), _sortOrder)` and render the sorted result instead of the raw task array
    - _Requirements: 5.3, 5.7, 5.11_
  - [ ] 11.6 Bind the sort control inside `Todo_List.init()`: cache `_elSort = document.getElementById('todo-sort')`; on `init()`, read `LocalStorage_Manager.loadSortOrder()` and set `_sortOrder` to the loaded value if it is one of the four valid strings, otherwise `'creation'`; set `_elSort.value = _sortOrder`; add a `'change'` listener that updates `_sortOrder`, calls `LocalStorage_Manager.saveSortOrder(_sortOrder)`, and calls `render()`
    - _Requirements: 5.3, 5.8, 5.9, 5.10_
  - [ ]* 11.7 Write property test for sort order persistence round-trip and invalid default
    - **Property 19: saveSortOrder then loadSortOrder returns the same value**
    - **Validates: Requirements 5.8**
    - **Property 20: Invalid stored sort order defaults to creation**
    - **Validates: Requirements 5.10**

- [ ] 12. Add duplicate error display to Todo_List
  - [ ] 12.1 Implement `_showAddError(message)` and `_clearAddError()` inside `Todo_List`
    - `_showAddError`: caches `_elAddError = document.getElementById('todo-add-error')`; removes the `hidden` attribute; sets `textContent = message`
    - `_clearAddError`: adds the `hidden` attribute back; clears `textContent`
    - _Requirements: 4.2_
  - [ ] 12.2 Update the `#todo-add-form` submit handler inside `Todo_List.init()` to handle the `{ type: 'duplicate' }` return value
    - If `Todo_Manager.addTask()` returns `{ type: 'duplicate' }`: call `_showAddError('A task with this description already exists.')` and call `_elInput.focus()`; do not clear the input
    - If the result is a valid task: call `_clearAddError()`, clear the input, call `render()`
    - Bind an `'input'` event on `_elInput` that calls `_clearAddError()` so the error dismisses when the user starts typing
    - _Requirements: 4.2, 4.6_
  - [ ] 12.3 Update `_exitEditMode(id, save, newValue)` inside `Todo_List` to handle the `{ type: 'duplicate' }` return from `updateTask`
    - If `Todo_Manager.updateTask()` returns `{ type: 'duplicate' }`: display an inline error message in the edit row (set a `<span class="field-error">` next to the edit input, or reuse a per-row error element); keep focus on the edit input; do not call `render()`
    - Bind an `'input'` event on the edit input that clears the per-row error
    - If `updateTask` returns `true`: call `render()` as before
    - _Requirements: 4.3, 4.4, 4.6_

- [ ] 13. Wire new modules into the entry point
  - [ ] 13.1 Update the `DOMContentLoaded` entry point in `js/app.js` to initialize all new modules in the correct order
    - Call `Timer_Config.init()` before `Focus_Timer.init()` (so `getDuration()` is ready)
    - Call `Name_Manager.init()` before `Greeting_Widget.init()` (so `getName()` is ready)
    - Call `Theme_Manager.init()` (binds the toggle button; theme data-attribute is already applied by the inline script)
    - Ensure the final order is: `Todo_Manager.init()`, `QuickLinks_Manager.init()`, `Timer_Config.init()`, `Name_Manager.init()`, `Theme_Manager.init()`, `Greeting_Widget.init()`, `Focus_Timer.init()`, `Todo_List.init()`, `QuickLinks_Panel.init()`
    - _Requirements: 6.4, 1.5, 2.5, 3.6_

- [ ] 14. Final checkpoint — full regression and integration pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation before moving to the next feature area
- Property tests validate universal correctness invariants for pure functions; unit tests cover DOM integration and edge cases
- The inline no-flash script (task 2.1) must be the very first script tag in `<head>` and run before the stylesheet so the correct theme variables are resolved on first paint
- `LocalStorage_Manager` uses plain `getItem`/`setItem` (no JSON) for string keys; `loadTimerDuration` is the only new key that uses JSON parsing
- The `_isDuplicate` helper can be extracted and tested in isolation without a DOM since it only operates on the in-memory `_tasks` array

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.2", "7.1", "10.1"] },
    { "id": 2, "tasks": ["2.3", "3.1", "4.1", "7.2", "7.3", "10.2", "10.3", "10.4", "11.1", "11.2", "11.3"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.1", "5.2", "5.3", "8.1", "8.2", "8.3", "8.4", "11.4", "11.5", "11.6", "12.1"] },
    { "id": 4, "tasks": ["5.4", "5.5", "7.2", "8.5", "11.7", "12.2", "12.3"] },
    { "id": 5, "tasks": ["13.1"] }
  ]
}
```

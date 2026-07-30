# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement the To-Do List Life Dashboard as a single-page vanilla JavaScript web application. The implementation proceeds in layers: project scaffolding → shared storage utility → individual feature modules (Greeting, Focus Timer, To-Do List, Quick Links) → full wiring and integration. Each layer is validated before the next begins.

---

## Tasks

- [ ] 1. Set up project structure and HTML shell
  - [ ] 1.1 Create the directory structure and base files
    - Create `index.html` at the project root
    - Create `css/` directory with `style.css`
    - Create `js/` directory with `app.js`
    - `index.html` links `css/style.css` in `<head>` and `js/app.js` as `<script defer>` before `</body>`
    - Add semantic HTML sections: `#greeting`, `#focus-timer`, `#todo-list`, `#quick-links`
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 1.2 Add base CSS layout and typography
    - CSS reset (box-sizing, margin, padding)
    - CSS custom properties (color palette, font sizes, spacing)
    - Responsive grid/flex layout placing the four sections in a clean dashboard grid
    - Readable font stack, sufficient contrast ratios
    - Viewport meta tag in HTML for mobile scaling
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 2. Implement LocalStorage_Manager module
  - [ ] 2.1 Write the LocalStorage_Manager module in `app.js`
    - Expose `saveTasks(tasks)`, `loadTasks()`, `saveLinks(links)`, `loadLinks()`
    - Use storage keys `tld_tasks` and `tld_links`
    - Wrap `JSON.parse` in try/catch; return `[]` on failure
    - Wrap `localStorage.setItem` in try/catch to handle storage quota errors silently
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ]* 2.2 Write property test for task persistence round-trip (Property 1)
    - **Property 1: Task list persistence round-trip**
    - **Validates: Requirements 2.2, 2.3**
    - Use fast-check: `fc.array(taskArbitrary)` → `saveTasks` → `loadTasks` → deep-equal original
    - Tag: `Feature: todo-life-dashboard, Property 1`
  - [ ]* 2.3 Write property test for links persistence round-trip (Property 2)
    - **Property 2: Quick links persistence round-trip**
    - **Validates: Requirements 2.2, 2.4**
    - Use fast-check: `fc.array(linkArbitrary)` → `saveLinks` → `loadLinks` → deep-equal original
    - Tag: `Feature: todo-life-dashboard, Property 2`
  - [ ]* 2.4 Write property test for corrupted storage fallback (Property 3)
    - **Property 3: Corrupted storage returns empty lists**
    - **Validates: Requirements 2.5**
    - Use fast-check with arbitrary non-JSON strings; verify `[]` is returned
    - Tag: `Feature: todo-life-dashboard, Property 3`

- [ ] 3. Implement Greeting_Widget module
  - [ ] 3.1 Write the Greeting_Widget module in `app.js`
    - Implement `getGreeting(hour)` pure function: hours 5–11 → "Good Morning", 12–17 → "Good Afternoon", else → "Good Evening"
    - Implement `formatTime(date)` → "HH:MM:SS" with zero-padding
    - Implement `formatDate(date)` → "Weekday, DD Month YYYY"
    - Implement `init()` that calls `_tick()` and sets a 1000ms interval
    - `_tick()` reads `new Date()` and updates DOM elements `#time`, `#date`, `#greeting-text`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 3.2 Write property tests for greeting logic (Properties 4 and 5)
    - **Property 4: Greeting covers every hour of the day**
    - **Property 5: Greeting correctness by range**
    - **Validates: Requirements 3.3, 3.4, 3.5**
    - Use fast-check `fc.integer({min:0,max:23})` to verify coverage and correct bucket assignment
    - Tag: `Feature: todo-life-dashboard, Property 4` and `Property 5`

- [ ] 4. Implement Focus_Timer module
  - [ ] 4.1 Write the Focus_Timer module in `app.js`
    - Internal state: `{ remaining: 1500, running: false, intervalId: null }`
    - Implement `init()` — renders 25:00 and binds Start/Stop/Reset button event listeners
    - Implement `start()` — sets `running = true`, starts `setInterval(_tick, 1000)`, updates button visual state
    - Implement `stop()` — clears interval, sets `running = false`, updates button visual state
    - Implement `reset()` — calls `stop()`, sets `remaining = 1500`, re-renders display
    - Implement `_tick()` — decrements `remaining`; if it reaches 0, calls `stop()` and shows 00:00
    - Implement `formatDisplay(seconds)` → "MM:SS" with zero-padding
    - Add CSS class `.timer-running` to the timer section while active for visual feedback
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.4_
  - [ ]* 4.2 Write property test for timer reset idempotency (Property 6)
    - **Property 6: Timer reset is idempotent to initial state**
    - **Validates: Requirements 4.5**
    - Use fast-check `fc.integer({min:0,max:1500})` as arbitrary remaining value; call reset; verify remaining === 1500 and running === false
    - Tag: `Feature: todo-life-dashboard, Property 6`

- [ ] 5. Implement Todo_Manager module
  - [ ] 5.1 Write the Todo_Manager module in `app.js`
    - Internal state: `tasks` array loaded from `LocalStorage_Manager.loadTasks()` on `init()`
    - Implement `_generateId()` → `Date.now() + '_' + Math.random().toString(36).substr(2,5)`
    - Implement `getTasks()` → returns copy of tasks array
    - Implement `addTask(description)` — trims description; returns `null` if empty; creates `{id, description, completed: false}`; pushes to array; calls `LocalStorage_Manager.saveTasks`; returns new task
    - Implement `updateTask(id, description)` — trims; returns `false` if empty or not found; updates description; saves; returns `true`
    - Implement `toggleComplete(id)` — finds task; flips `completed`; saves; returns `true` or `false` if not found
    - Implement `deleteTask(id)` — filters out task; saves; returns `true` or `false` if not found
    - _Requirements: 5.2, 5.3, 6.2, 6.3, 6.4, 6.6_
  - [ ]* 5.2 Write property tests for task CRUD invariants (Properties 7–11)
    - **Property 7: addTask grows list by 1** — `Validates: Requirements 5.2`
    - **Property 8: Whitespace input leaves list unchanged** — `Validates: Requirements 5.3`
    - **Property 9: All task IDs are unique** — `Validates: Requirements 5.2`
    - **Property 10: toggleComplete is a round-trip** — `Validates: Requirements 6.4`
    - **Property 11: deleteTask removes exactly that task** — `Validates: Requirements 6.6`
    - Use fast-check with arbitrary string and task array generators
    - Tag each with `Feature: todo-life-dashboard, Property N`

- [ ] 6. Implement Todo_List renderer
  - [ ] 6.1 Write the Todo_List renderer in `app.js`
    - Implement `init()` — binds the add-task form (input + button), calls `render()`
    - Implement `render()` — clears `#todo-list-items`, maps `Todo_Manager.getTasks()` to DOM elements via `_renderTask`, appends them
    - Implement `_renderTask(task)` — creates a `<li>` containing:
      - A checkbox input (checked if `task.completed`)
      - A `<span>` with task description (adds `.completed` class if `task.completed`)
      - An "Edit" button
      - A "Delete" button
    - Implement `_bindAddForm()` — on submit (Enter or button click): trim input value; call `Todo_Manager.addTask`; if successful, clear input and call `render()`
    - Implement `_enterEditMode(id)` — replaces the description `<span>` with a pre-filled `<input>` and Save/Cancel buttons
    - Implement `_exitEditMode(id, save)` — if `save`, calls `Todo_Manager.updateTask`; in all cases calls `render()`
    - Bind checkbox change → `Todo_Manager.toggleComplete(id)` → `render()`
    - Bind delete button → `Todo_Manager.deleteTask(id)` → `render()`
    - _Requirements: 5.1, 5.4, 5.5, 6.1, 6.2, 6.3, 6.5, 8.5_

- [ ] 7. Checkpoint — core features complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the page opens in a browser: greeting shows, timer controls work, tasks can be added/edited/deleted and persist across page reload.

- [ ] 8. Implement QuickLinks_Manager module
  - [ ] 8.1 Write the QuickLinks_Manager module in `app.js`
    - Internal state: `links` array loaded from `LocalStorage_Manager.loadLinks()` on `init()`
    - Implement `getLinks()` → returns copy of links array
    - Implement `addLink(label, url)` — trims both; returns `null` if either is empty; creates `{id, label, url}`; pushes; saves; returns new link
    - Implement `removeLink(id)` — filters out link; saves; returns `true` or `false` if not found
    - _Requirements: 7.4, 7.5, 7.7_
  - [ ]* 8.2 Write property tests for quick links CRUD invariants (Properties 12–14)
    - **Property 12: addLink grows list by 1** — `Validates: Requirements 7.4`
    - **Property 13: Invalid addLink leaves list unchanged** — `Validates: Requirements 7.5`
    - **Property 14: removeLink removes exactly that link** — `Validates: Requirements 7.7`
    - Use fast-check with arbitrary string generators
    - Tag each with `Feature: todo-life-dashboard, Property N`

- [ ] 9. Implement QuickLinks_Panel renderer
  - [ ] 9.1 Write the QuickLinks_Panel renderer in `app.js`
    - Implement `init()` — binds the add-link form, calls `render()`
    - Implement `render()` — clears `#quick-links-list`, maps `QuickLinks_Manager.getLinks()` to DOM elements via `_renderLink`, appends them
    - Implement `_renderLink(link)` — creates a container with:
      - An `<a>` or `<button>` that opens `link.url` in a new tab (`window.open(link.url, '_blank')`)
      - A "Remove" button that calls `QuickLinks_Manager.removeLink(link.id)` then `render()`
    - Implement `_bindAddForm()` — on submit: trim label and url inputs; call `QuickLinks_Manager.addLink`; if successful, clear inputs and call `render()`
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7_

- [ ] 10. Wire all modules and finalize CSS
  - [ ] 10.1 Initialize all modules in the correct order in `app.js`
    - Call init functions in order: `LocalStorage_Manager` (implicit, no init), `Todo_Manager.init()`, `QuickLinks_Manager.init()`, `Greeting_Widget.init()`, `Focus_Timer.init()`, `Todo_List.init()`, `QuickLinks_Panel.init()`
    - Wrap in `DOMContentLoaded` event listener to ensure HTML is parsed before script runs
    - _Requirements: 1.1, 1.3_
  - [ ] 10.2 Polish CSS for all sections
    - Style the Focus_Timer section: large countdown display, three clearly labeled buttons, `.timer-running` class changes button appearance (e.g., Start button becomes green when active)
    - Style the Todo_List: each task row lays out checkbox, text, and action buttons horizontally; `.completed` class applies `text-decoration: line-through` and reduced opacity
    - Style the QuickLinks_Panel: link buttons display in a flex-wrap row; add/remove form below the links
    - Apply responsive breakpoints: single-column layout below 600px, two-column grid at 600px+, four-column or two-column quad layout at wider viewports
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 6.5_

- [ ] 11. Final checkpoint — complete integration
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` directly in Chrome, Firefox, and Edge. Verify all four sections render, all interactions work, and data persists after tab close and reopen.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP implementation
- The property-based tests require Node.js and `npm install fast-check`; the application itself requires no build tooling
- Each task references specific requirements for full traceability
- Checkpoints at tasks 7 and 11 ensure incremental validation before moving on
- All four modules share the single `app.js` file, organized with comment banners for clarity

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2"] }
  ]
}
```

/**
 * Life Dashboard — app.js
 * Single vanilla-JS file containing all modules:
 *   1. LocalStorage_Manager
 *   2. Theme_Manager
 *   3. Name_Manager
 *   4. Timer_Config
 *   5. Greeting_Widget
 *   6. Focus_Timer
 *   7. Todo_Manager
 *   8. Todo_List
 *   9. QuickLinks_Manager
 *  10. QuickLinks_Panel
 *
 * Entry point at the bottom: DOMContentLoaded → init all modules.
 */

'use strict';

/* ============================================================
   1. LocalStorage_Manager
   ============================================================ */
const LocalStorage_Manager = (() => {
  const KEYS = {
    tasks:         'tld_tasks',
    links:         'tld_links',
    theme:         'tld_theme',          // 'dark' | 'light'
    name:          'tld_name',           // string
    timerDuration: 'tld_timer_duration', // number (minutes, 1–180)
    sortOrder:     'tld_sort_order',     // 'creation'|'alpha-asc'|'alpha-desc'|'completed-last'
  };

  /**
   * Safely get an item from localStorage and parse it as JSON.
   * Returns the parsed value, or `fallback` on any error.
   */
  function _load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  /**
   * Safely serialise `value` to JSON and store it under `key`.
   * Silently ignores storage errors (e.g. private browsing quota).
   */
  function _save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_e) {
      // Storage unavailable — data is held in memory for this session.
    }
  }

  return {
    /** @returns {Task[]} */
    loadTasks() {
      return _load(KEYS.tasks, []);
    },
    /** @param {Task[]} tasks */
    saveTasks(tasks) {
      _save(KEYS.tasks, tasks);
    },
    /** @returns {QuickLink[]} */
    loadLinks() {
      return _load(KEYS.links, []);
    },
    /** @param {QuickLink[]} links */
    saveLinks(links) {
      _save(KEYS.links, links);
    },

    // ── Theme ────────────────────────────────────────────────
    /** @param {string} theme */
    saveTheme(theme) {
      try {
        localStorage.setItem(KEYS.theme, theme);
      } catch (_e) { /* storage unavailable */ }
    },
    /** @returns {string} '' if key is missing */
    loadTheme() {
      try {
        const val = localStorage.getItem(KEYS.theme);
        return val !== null ? val : '';
      } catch (_e) {
        return '';
      }
    },

    // ── Name ─────────────────────────────────────────────────
    /** @param {string} name */
    saveName(name) {
      try {
        localStorage.setItem(KEYS.name, name);
      } catch (_e) { /* storage unavailable */ }
    },
    /** @returns {string} '' if key is missing */
    loadName() {
      try {
        const val = localStorage.getItem(KEYS.name);
        return val !== null ? val : '';
      } catch (_e) {
        return '';
      }
    },

    // ── Timer Duration ────────────────────────────────────────
    /** @param {number} minutes */
    saveTimerDuration(minutes) {
      try {
        localStorage.setItem(KEYS.timerDuration, JSON.stringify(minutes));
      } catch (_e) { /* storage unavailable */ }
    },
    /** @returns {number|null} null if key is missing or value cannot be parsed as a number */
    loadTimerDuration() {
      try {
        const raw = localStorage.getItem(KEYS.timerDuration);
        if (raw === null) return null;
        const parsed = JSON.parse(raw);
        return typeof parsed === 'number' && !isNaN(parsed) ? parsed : null;
      } catch (_e) {
        return null;
      }
    },

    // ── Sort Order ────────────────────────────────────────────
    /** @param {string} order */
    saveSortOrder(order) {
      try {
        localStorage.setItem(KEYS.sortOrder, order);
      } catch (_e) { /* storage unavailable */ }
    },
    /** @returns {string} '' if key is missing */
    loadSortOrder() {
      try {
        const val = localStorage.getItem(KEYS.sortOrder);
        return val !== null ? val : '';
      } catch (_e) {
        return '';
      }
    },
  };
})();


/* ============================================================
   2. Theme_Manager
   ============================================================ */
const Theme_Manager = (() => {
  const THEMES = { DARK: 'dark', LIGHT: 'light' };
  const DEFAULT_THEME = THEMES.DARK;

  let _currentTheme = DEFAULT_THEME;

  /**
   * Applies the given theme to the document and updates the toggle button.
   * @param {string} theme  'dark' | 'light'
   */
  function _apply(theme) {
    document.documentElement.dataset.theme = theme;

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      if (theme === THEMES.LIGHT) {
        btn.setAttribute('aria-label', 'Switch to dark mode');
        btn.textContent = '☀️';
      } else {
        btn.setAttribute('aria-label', 'Switch to light mode');
        btn.textContent = '🌙';
      }
    }
  }

  /**
   * Returns the current active theme.
   * @returns {'dark'|'light'}
   */
  function getTheme() {
    return _currentTheme;
  }

  /**
   * Validates and applies a theme, persisting it to LocalStorage.
   * Does nothing if `theme` is not 'dark' or 'light'.
   * @param {string} theme
   */
  function setTheme(theme) {
    if (theme !== THEMES.DARK && theme !== THEMES.LIGHT) return;
    _currentTheme = theme;
    _apply(theme);
    LocalStorage_Manager.saveTheme(theme);
  }

  /**
   * Switches to the opposite of the current theme.
   */
  function toggle() {
    setTheme(_currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  }

  return {
    THEMES,
    DEFAULT_THEME,
    getTheme,
    setTheme,
    toggle,
    _apply,
    init() {
      const stored = LocalStorage_Manager.loadTheme();
      const resolved = (stored === THEMES.LIGHT || stored === THEMES.DARK)
        ? stored
        : DEFAULT_THEME;
      _currentTheme = resolved;
      _apply(resolved);

      const btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', toggle);
      }
    },
  };
})();


/* ============================================================
   3. Name_Manager
   ============================================================ */
const Name_Manager = (function() {
  let _name = '';

  /**
   * Returns the current stored display name.
   * @returns {string}
   */
  function getName() {
    return _name;
  }

  /**
   * Trims `raw` and updates the stored name.
   * - If trimmed is non-empty: stores it and persists to localStorage.
   * - If trimmed is empty: clears the name and persists '' to localStorage.
   * Always calls Greeting_Widget.updateGreeting() to re-render the greeting.
   * @param {string} raw
   */
  function setName(raw) {
    const trimmed = (raw || '').trim();
    if (trimmed !== '') {
      _name = trimmed;
      LocalStorage_Manager.saveName(trimmed);
    } else {
      _name = '';
      LocalStorage_Manager.saveName('');
    }
    Greeting_Widget.updateGreeting();
  }

  /**
   * Loads the persisted name from localStorage.
   * Already trimmed by loadName(); defaults to '' if absent.
   */
  function init() {
    _name = LocalStorage_Manager.loadName();
  }

  return { getName, setName, init };
})();


/* ============================================================
   4. Timer_Config
   ============================================================ */
const Timer_Config = (() => {
  const TIMER_MIN     = 1;
  const TIMER_MAX     = 180;
  const TIMER_DEFAULT = 25;

  let _duration = TIMER_DEFAULT;

  /**
   * Returns the current timer duration in minutes.
   * @returns {number}
   */
  function getDuration() {
    return _duration;
  }

  /**
   * Sets the timer duration if `minutes` is a valid integer in [1, 180].
   * Persists the new value via LocalStorage_Manager on success.
   * @param {number} minutes
   * @returns {boolean} true if valid and applied; false otherwise
   */
  function setDuration(minutes) {
    if (!Number.isInteger(minutes) || minutes < TIMER_MIN || minutes > TIMER_MAX) {
      return false;
    }
    _duration = minutes;
    LocalStorage_Manager.saveTimerDuration(minutes);
    return true;
  }

  /**
   * Loads the persisted duration from localStorage.
   * If the stored value is a valid integer in [1, 180], uses it;
   * otherwise falls back to TIMER_DEFAULT (25).
   */
  function init() {
    const loaded = LocalStorage_Manager.loadTimerDuration();
    if (Number.isInteger(loaded) && loaded >= TIMER_MIN && loaded <= TIMER_MAX) {
      _duration = loaded;
    } else {
      _duration = TIMER_DEFAULT;
    }
  }

  return {
    TIMER_MIN,
    TIMER_MAX,
    TIMER_DEFAULT,
    getDuration,
    setDuration,
    init,
  };
})();


/* ============================================================
   4. Greeting_Widget
   ============================================================ */
const Greeting_Widget = (() => {
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  let _intervalId = null;

  /**
   * Returns a zero-padded string of length 2.
   * @param {number} n
   * @returns {string}
   */
  function _pad(n) {
    return String(n).padStart(2, '0');
  }

  /**
   * Pure function — returns the greeting for a given 24-hour value.
   * @param {number} hour  0–23
   * @returns {string}
   */
  function getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  /**
   * Pure function — returns a personalised greeting string.
   * If name.trim() is non-empty: returns "${getGreeting(hour)}, ${name.trim()}!"
   * If name.trim() is empty:     returns getGreeting(hour) with no suffix.
   * @param {number} hour  0–23
   * @param {string} name
   * @returns {string}
   */
  function formatGreeting(hour, name) {
    const trimmedName = (name || '').trim();
    if (trimmedName !== '') {
      return `${getGreeting(hour)}, ${trimmedName}!`;
    }
    return getGreeting(hour);
  }

  /**
   * Returns "HH:MM:SS" for the given Date.
   * @param {Date} date
   * @returns {string}
   */
  function formatTime(date) {
    return `${_pad(date.getHours())}:${_pad(date.getMinutes())}:${_pad(date.getSeconds())}`;
  }

  /**
   * Returns "Weekday, DD Month YYYY" for the given Date.
   * @param {Date} date
   * @returns {string}
   */
  function formatDate(date) {
    const day     = DAYS[date.getDay()];
    const dd      = _pad(date.getDate());
    const month   = MONTHS[date.getMonth()];
    const year    = date.getFullYear();
    return `${day}, ${dd} ${month} ${year}`;
  }

  /** Updates DOM with current time, date, and greeting. */
  function _tick() {
    const now = new Date();
    const elTime     = document.getElementById('time');
    const elDate     = document.getElementById('date');
    const elGreeting = document.getElementById('greeting-text');

    if (elTime)     elTime.textContent     = formatTime(now);
    if (elDate)     elDate.textContent     = formatDate(now);
    if (elGreeting) elGreeting.textContent = formatGreeting(now.getHours(), Name_Manager.getName());
  }

  return {
    getGreeting,
    formatGreeting,
    formatTime,
    formatDate,
    /**
     * Re-reads the current name and hour, then updates the greeting DOM element.
     * Called by Name_Manager.setName() whenever the name changes.
     */
    updateGreeting() {
      const elGreeting = document.getElementById('greeting-text');
      if (elGreeting) {
        const hour = new Date().getHours();
        elGreeting.textContent = formatGreeting(hour, Name_Manager.getName());
      }
    },
    init() {
      // Bind the name form submit event
      const nameForm  = document.getElementById('name-form');
      const nameInput = document.getElementById('name-input');
      if (nameForm) {
        nameForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const raw = nameInput ? nameInput.value : '';
          Name_Manager.setName(raw);
          // Clear the input only when a non-empty name was set
          if (nameInput && raw.trim() !== '') {
            nameInput.value = '';
          }
        });
      }

      _tick(); // render immediately — no blank flash
      _intervalId = setInterval(_tick, 1000);
    },
  };
})();


/* ============================================================
   5. Focus_Timer
   ============================================================ */
const Focus_Timer = (() => {
  // 8.1 — no longer a hardcoded constant; initialised lazily in init()
  // from Timer_Config.getDuration() * 60.
  let _initialSeconds = 25 * 60; // default until init() runs

  const state = {
    remaining:  _initialSeconds,
    running:    false,
    intervalId: null,
  };

  let _elDisplay  = null;
  let _elStart    = null;
  let _elStop     = null;
  let _elReset    = null;
  let _elCard     = null;
  let _elDuration = null; // 8.3 — cached reference to #timer-duration input

  /**
   * Returns "MM:SS" for the given number of seconds.
   * @param {number} totalSeconds
   * @returns {string}
   */
  function formatDisplay(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function _render() {
    if (_elDisplay) _elDisplay.textContent = formatDisplay(state.remaining);
    if (_elCard) {
      _elCard.classList.toggle('timer-running', state.running);
    }
    // 8.4 — disable duration input while timer is running; re-enable when stopped/reset
    if (_elDuration) _elDuration.disabled = state.running;
  }

  function _tick() {
    state.remaining -= 1;
    if (state.remaining <= 0) {
      state.remaining = 0;
      _render();
      stop();
      return;
    }
    _render();
  }

  function start() {
    if (state.running) return;
    if (state.remaining <= 0) return; // nothing left to count
    state.running    = true;
    state.intervalId = setInterval(_tick, 1000);
    _render();
  }

  function stop() {
    if (!state.running && state.intervalId === null) return;
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.running    = false;
    _render();
  }

  function reset() {
    stop();
    // 8.1 — use configured duration rather than the old hardcoded constant
    state.remaining = Timer_Config.getDuration() * 60;
    _render();
  }

  /**
   * 8.2 — Sets the reference initial-seconds value.
   * If the timer is not currently running, also updates the visible countdown
   * and re-renders so the display reflects the new duration immediately.
   * @param {number} seconds
   */
  function setInitialSeconds(seconds) {
    _initialSeconds = seconds;
    if (!state.running) {
      state.remaining = seconds;
      _render();
    }
  }

  return {
    formatDisplay,
    setInitialSeconds, // 8.2 — public API
    init() {
      _elDisplay  = document.getElementById('timer-display');
      _elStart    = document.getElementById('timer-start');
      _elStop     = document.getElementById('timer-stop');
      _elReset    = document.getElementById('timer-reset');
      _elCard     = document.querySelector('.timer-card');
      _elDuration = document.getElementById('timer-duration'); // 8.3

      // 8.1 — seed initial seconds from Timer_Config (loaded before this runs)
      _initialSeconds     = Timer_Config.getDuration() * 60;
      state.remaining     = _initialSeconds;

      // 8.3 — reflect loaded duration value in the input
      if (_elDuration) {
        _elDuration.value = Timer_Config.getDuration();

        // 8.3 — bind change event to update Timer_Config and reset display
        _elDuration.addEventListener('change', () => {
          const parsed = parseInt(_elDuration.value, 10);
          if (Timer_Config.setDuration(parsed)) {
            // Valid value — update timer and display
            setInitialSeconds(parsed * 60);
          } else {
            // Invalid value — revert input to last known-good duration
            _elDuration.value = Timer_Config.getDuration();
          }
        });
      }

      _render();

      if (_elStart) _elStart.addEventListener('click', start);
      if (_elStop)  _elStop.addEventListener('click', stop);
      if (_elReset) _elReset.addEventListener('click', reset);
    },
    // Expose for testing
    start,
    stop,
    reset,
    getState() {
      return { remaining: state.remaining, running: state.running };
    },
  };
})();


/* ============================================================
   6. Todo_Manager
   ============================================================ */
const Todo_Manager = (() => {
  /** @type {Task[]} */
  let _tasks = [];

  /**
   * Generates a unique ID string.
   * @returns {string}
   */
  function _generateId() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  function _persist() {
    LocalStorage_Manager.saveTasks(_tasks);
  }

  /**
   * Internal helper — checks whether a description already exists in the task list.
   *
   * Comparison is case-insensitive and trim-aware on both sides.
   *
   * @param {string}      description  The candidate description to check.
   * @param {string|null} excludeId    For add operations pass `null` so all tasks
   *                                   are checked.  For edit operations pass the
   *                                   task's own id so the task being edited is
   *                                   excluded from the comparison.
   * @returns {boolean}  `true` if a duplicate exists, `false` otherwise.
   */
  function _isDuplicate(description, excludeId) {
    const normalized = description.trim().toLowerCase();
    return _tasks.some(
      t => t.id !== excludeId && t.description.trim().toLowerCase() === normalized
    );
  }

  return {
    init() {
      _tasks = LocalStorage_Manager.loadTasks();
    },

    /** @returns {Task[]} shallow copy */
    getTasks() {
      return _tasks.slice();
    },

    /**
     * Creates and stores a new task.
     * @param {string} description
     * @returns {Task|null|{type:'duplicate'}} null if description is empty/whitespace;
     *   { type: 'duplicate' } if the description already exists (case-insensitive, trim-aware)
     */
    addTask(description) {
      const trimmed = (description || '').trim();
      if (!trimmed) return null;
      if (_isDuplicate(trimmed, null)) return { type: 'duplicate' };
      const task = { id: _generateId(), description: trimmed, completed: false };
      _tasks.push(task);
      _persist();
      return task;
    },

    /**
     * Updates the description of an existing task.
     * @param {string} id
     * @param {string} description
     * @returns {boolean|{type:'duplicate'}} false if empty/whitespace or task not found;
     *   { type: 'duplicate' } if the new description already exists on another task
     *   (case-insensitive, trim-aware); true on success
     */
    updateTask(id, description) {
      const trimmed = (description || '').trim();
      if (!trimmed) return false;
      const task = _tasks.find(t => t.id === id);
      if (!task) return false;
      if (_isDuplicate(trimmed, id)) return { type: 'duplicate' };
      task.description = trimmed;
      _persist();
      return true;
    },

    /**
     * Toggles the completed state of a task.
     * @param {string} id
     * @returns {boolean} false if task not found
     */
    toggleComplete(id) {
      const task = _tasks.find(t => t.id === id);
      if (!task) return false;
      task.completed = !task.completed;
      _persist();
      return true;
    },

    /**
     * Deletes a task by ID.
     * @param {string} id
     * @returns {boolean} false if task not found
     */
    deleteTask(id) {
      const idx = _tasks.findIndex(t => t.id === id);
      if (idx === -1) return false;
      _tasks.splice(idx, 1);
      _persist();
      return true;
    },

    // Exposed for testing and for use by Todo_List error display
    _isDuplicate,
  };
})();


/* ============================================================
   7. Todo_List  (renderer)
   ============================================================ */
const Todo_List = (() => {
  let _elList     = null;
  let _elForm     = null;
  let _elInput    = null;
  let _elSort     = null;
  let _elAddError = null;

  let _sortOrder = 'creation';

  /**
   * Pure helper — returns a sorted copy of `tasks` according to `order`.
   * Does NOT mutate the input array.
   *
   * @param {Task[]} tasks  The source array (not mutated).
   * @param {string} order  One of: 'creation' | 'alpha-asc' | 'alpha-desc' | 'completed-last'
   * @returns {Task[]}      A new array sorted as requested.
   */
  function _sortTasks(tasks, order) {
    if (order === 'creation') {
      // Preserve original insertion order; just return a shallow copy.
      return tasks.slice();
    }

    if (order === 'alpha-asc') {
      return tasks.slice().sort((a, b) => {
        const la = a.description.toLowerCase();
        const lb = b.description.toLowerCase();
        if (la < lb) return -1;
        if (la > lb) return  1;
        return 0;
      });
    }

    if (order === 'alpha-desc') {
      return tasks.slice().sort((a, b) => {
        const la = a.description.toLowerCase();
        const lb = b.description.toLowerCase();
        if (la > lb) return -1;
        if (la < lb) return  1;
        return 0;
      });
    }

    if (order === 'completed-last') {
      // Stable partition: incomplete (false) first, completed (true) last.
      // Using index-based stable sort to guarantee relative order within each group.
      return tasks
        .map((task, index) => ({ task, index }))
        .sort((a, b) => {
          // false (0) < true (1), so incomplete tasks sort before completed ones.
          const diff = (a.task.completed ? 1 : 0) - (b.task.completed ? 1 : 0);
          // Preserve original relative order within each group via the original index.
          return diff !== 0 ? diff : a.index - b.index;
        })
        .map(({ task }) => task);
    }

    // Unknown order — fall back to creation order.
    return tasks.slice();
  }

  /**
   * Shows the add-form error message.
   * Lazily caches the #todo-add-error element on first call.
   * @param {string} message
   */
  function _showAddError(message) {
    _elAddError = _elAddError || document.getElementById('todo-add-error');
    if (!_elAddError) return;
    _elAddError.removeAttribute('hidden');
    _elAddError.textContent = message;
  }

  /**
   * Hides and clears the add-form error message.
   */
  function _clearAddError() {
    if (!_elAddError) return;
    _elAddError.setAttribute('hidden', '');
    _elAddError.textContent = '';
  }

  /**
   * Re-renders the entire task list from Todo_Manager state,
   * sorted according to the current _sortOrder.
   */
  function render() {
    if (!_elList) return;
    // Clear current list
    while (_elList.firstChild) _elList.removeChild(_elList.firstChild);

    const tasks = _sortTasks(Todo_Manager.getTasks(), _sortOrder);
    tasks.forEach(task => {
      _elList.appendChild(_renderTask(task));
    });
  }

  /**
   * Builds a <li> element for a single task.
   * @param {Task} task
   * @returns {HTMLLIElement}
   */
  function _renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

    // Checkbox
    const checkbox       = document.createElement('input');
    checkbox.type        = 'checkbox';
    checkbox.className   = 'task-checkbox';
    checkbox.checked     = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.description}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => {
      Todo_Manager.toggleComplete(task.id);
      render();
    });

    // Description span
    const span      = document.createElement('span');
    span.className  = 'task-description' + (task.completed ? ' completed' : '');
    span.textContent = task.description;

    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    // Edit button
    const editBtn     = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.className = 'btn btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.description}`);
    editBtn.addEventListener('click', () => _enterEditMode(task.id));

    // Delete button
    const delBtn     = document.createElement('button');
    delBtn.type      = 'button';
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Delete task: ${task.description}`);
    delBtn.addEventListener('click', () => {
      Todo_Manager.deleteTask(task.id);
      render();
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);

    return li;
  }

  /**
   * Replaces the description span with an editable input and save/cancel buttons.
   * @param {string} id
   */
  function _enterEditMode(id) {
    const li = _elList.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    const tasks       = Todo_Manager.getTasks();
    const task        = tasks.find(t => t.id === id);
    if (!task) return;

    // Replace span with input
    const span = li.querySelector('.task-description');
    if (!span) return;

    const editInput       = document.createElement('input');
    editInput.type        = 'text';
    editInput.className   = 'task-edit-input';
    editInput.value       = task.description;
    editInput.maxLength   = 200;
    editInput.setAttribute('aria-label', 'Edit task description');
    li.replaceChild(editInput, span);
    editInput.focus();
    editInput.select();

    // Replace action buttons with Save / Cancel
    const actions = li.querySelector('.task-actions');
    if (actions) {
      while (actions.firstChild) actions.removeChild(actions.firstChild);

      const saveBtn      = document.createElement('button');
      saveBtn.type       = 'button';
      saveBtn.className  = 'btn btn-primary btn-sm';
      saveBtn.textContent = 'Save';
      saveBtn.setAttribute('aria-label', 'Save task edit');
      saveBtn.addEventListener('click', () => _exitEditMode(id, true, editInput.value));

      const cancelBtn      = document.createElement('button');
      cancelBtn.type       = 'button';
      cancelBtn.className  = 'btn btn-ghost btn-sm';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.setAttribute('aria-label', 'Cancel task edit');
      cancelBtn.addEventListener('click', () => _exitEditMode(id, false, null));

      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
    }

    // Also allow Enter / Escape keys in the edit input
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  _exitEditMode(id, true,  editInput.value);
      if (e.key === 'Escape') _exitEditMode(id, false, null);
    });
  }

  /**
   * @param {string}      id
   * @param {boolean}     save
   * @param {string|null} newValue
   */
  function _exitEditMode(id, save, newValue) {
    if (save && newValue !== null) {
      const result = Todo_Manager.updateTask(id, newValue);
      if (result && result.type === 'duplicate') {
        // Show inline error in the edit row; keep focus on edit input
        const li = _elList.querySelector(`[data-id="${id}"]`);
        if (li) {
          // Remove any existing field-error span in this row
          const existing = li.querySelector('.field-error');
          if (existing) existing.remove();

          const errSpan = document.createElement('span');
          errSpan.className = 'field-error';
          errSpan.textContent = 'A task with this description already exists.';

          const editInput = li.querySelector('.task-edit-input');
          if (editInput) {
            editInput.insertAdjacentElement('afterend', errSpan);
            editInput.focus();

            // Clear the per-row error when the user starts typing
            editInput.addEventListener('input', () => {
              errSpan.remove();
            }, { once: true });
          }
        }
        // Do NOT call render()
        return;
      }
      // result === true → fall through to render()
    }
    render();
  }

  return {
    render,
    // Exposed for testing
    _sortTasks,
    init() {
      _elList  = document.getElementById('todo-list-items');
      _elForm  = document.getElementById('todo-add-form');
      _elInput = document.getElementById('todo-input');
      _elSort  = document.getElementById('todo-sort');

      // Load and apply persisted sort order
      const VALID_ORDERS = ['creation', 'alpha-asc', 'alpha-desc', 'completed-last'];
      const loaded = LocalStorage_Manager.loadSortOrder();
      if (VALID_ORDERS.includes(loaded)) {
        _sortOrder = loaded;
      } else {
        _sortOrder = 'creation';
      }
      if (_elSort) {
        _elSort.value = _sortOrder;
        _elSort.addEventListener('change', () => {
          _sortOrder = _elSort.value;
          LocalStorage_Manager.saveSortOrder(_sortOrder);
          render();
        });
      }

      // Bind add form
      if (_elForm) {
        _elForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const result = Todo_Manager.addTask(_elInput ? _elInput.value : '');
          if (result && result.type === 'duplicate') {
            // Show error, keep input focused — do NOT clear or render
            _showAddError('A task with this description already exists.');
            if (_elInput) _elInput.focus();
          } else if (result) {
            // Valid task created
            _clearAddError();
            if (_elInput) _elInput.value = '';
            render();
          }
          // result === null means empty input — do nothing
        });
      }

      // Clear the add-error whenever the user types in the input
      if (_elInput) {
        _elInput.addEventListener('input', () => {
          _clearAddError();
        });
      }

      render();
    },
  };
})();


/* ============================================================
   8. QuickLinks_Manager
   ============================================================ */
const QuickLinks_Manager = (() => {
  /** @type {QuickLink[]} */
  let _links = [];

  function _generateId() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  function _persist() {
    LocalStorage_Manager.saveLinks(_links);
  }

  return {
    init() {
      _links = LocalStorage_Manager.loadLinks();
    },

    /** @returns {QuickLink[]} shallow copy */
    getLinks() {
      return _links.slice();
    },

    /**
     * Adds a new quick link.
     * @param {string} label
     * @param {string} url
     * @returns {QuickLink|null} null if either field is empty/whitespace
     */
    addLink(label, url) {
      const tLabel = (label || '').trim();
      const tUrl   = (url   || '').trim();
      if (!tLabel || !tUrl) return null;
      const link = { id: _generateId(), label: tLabel, url: tUrl };
      _links.push(link);
      _persist();
      return link;
    },

    /**
     * Removes a quick link by ID.
     * @param {string} id
     * @returns {boolean} false if not found
     */
    removeLink(id) {
      const idx = _links.findIndex(l => l.id === id);
      if (idx === -1) return false;
      _links.splice(idx, 1);
      _persist();
      return true;
    },
  };
})();


/* ============================================================
   9. QuickLinks_Panel  (renderer)
   ============================================================ */
const QuickLinks_Panel = (() => {
  let _elGrid       = null;
  let _elForm       = null;
  let _elLabelInput = null;
  let _elUrlInput   = null;

  function render() {
    if (!_elGrid) return;
    while (_elGrid.firstChild) _elGrid.removeChild(_elGrid.firstChild);

    const links = QuickLinks_Manager.getLinks();
    links.forEach(link => {
      _elGrid.appendChild(_renderLink(link));
    });
  }

  /**
   * Builds a link entry element.
   * @param {QuickLink} link
   * @returns {HTMLElement}
   */
  function _renderLink(link) {
    const entry = document.createElement('div');
    entry.className = 'link-entry';

    // Clickable button that opens the URL in a new tab
    const btn       = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'link-btn';
    btn.textContent = link.label;
    btn.title       = link.url;
    btn.setAttribute('aria-label', `Open ${link.label} in new tab`);
    btn.addEventListener('click', () => {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    });

    // Remove button
    const removeBtn       = document.createElement('button');
    removeBtn.type        = 'button';
    removeBtn.className   = 'link-remove-btn';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', `Remove link: ${link.label}`);
    removeBtn.addEventListener('click', () => {
      QuickLinks_Manager.removeLink(link.id);
      render();
    });

    entry.appendChild(btn);
    entry.appendChild(removeBtn);
    return entry;
  }

  return {
    render,
    init() {
      _elGrid       = document.getElementById('quick-links-list');
      _elForm       = document.getElementById('link-add-form');
      _elLabelInput = document.getElementById('link-label-input');
      _elUrlInput   = document.getElementById('link-url-input');

      if (_elForm) {
        _elForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const label = _elLabelInput ? _elLabelInput.value : '';
          const url   = _elUrlInput   ? _elUrlInput.value   : '';
          const link  = QuickLinks_Manager.addLink(label, url);
          if (link) {
            if (_elLabelInput) _elLabelInput.value = '';
            if (_elUrlInput)   _elUrlInput.value   = '';
            render();
          }
        });
      }

      render();
    },
  };
})();


/* ============================================================
   Entry Point
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Initialise data managers first (they load from LocalStorage)
  Todo_Manager.init();
  QuickLinks_Manager.init();

  // Timer_Config must be ready before Focus_Timer.init() reads getDuration()
  Timer_Config.init();
  // Name_Manager must be ready before Greeting_Widget.init() calls getName()
  Name_Manager.init();

  // Initialise UI modules
  Theme_Manager.init();
  Greeting_Widget.init();
  Focus_Timer.init();
  Todo_List.init();
  QuickLinks_Panel.init();
});

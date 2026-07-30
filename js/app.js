/**
 * Life Dashboard — app.js
 * Single vanilla-JS file containing all modules:
 *   1. LocalStorage_Manager
 *   2. Greeting_Widget
 *   3. Focus_Timer
 *   4. Todo_Manager
 *   5. Todo_List
 *   6. QuickLinks_Manager
 *   7. QuickLinks_Panel
 *
 * Entry point at the bottom: DOMContentLoaded → init all modules.
 */

'use strict';

/* ============================================================
   1. LocalStorage_Manager
   ============================================================ */
const LocalStorage_Manager = (() => {
  const KEYS = {
    tasks: 'tld_tasks',
    links: 'tld_links',
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
  };
})();


/* ============================================================
   2. Greeting_Widget
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
    if (elGreeting) elGreeting.textContent = getGreeting(now.getHours());
  }

  return {
    getGreeting,
    formatTime,
    formatDate,
    init() {
      _tick(); // render immediately — no blank flash
      _intervalId = setInterval(_tick, 1000);
    },
  };
})();


/* ============================================================
   3. Focus_Timer
   ============================================================ */
const Focus_Timer = (() => {
  const INITIAL_SECONDS = 25 * 60; // 1500

  const state = {
    remaining:  INITIAL_SECONDS,
    running:    false,
    intervalId: null,
  };

  let _elDisplay  = null;
  let _elStart    = null;
  let _elStop     = null;
  let _elReset    = null;
  let _elCard     = null;

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
    state.remaining = INITIAL_SECONDS;
    _render();
  }

  return {
    formatDisplay,
    init() {
      _elDisplay = document.getElementById('timer-display');
      _elStart   = document.getElementById('timer-start');
      _elStop    = document.getElementById('timer-stop');
      _elReset   = document.getElementById('timer-reset');
      _elCard    = document.querySelector('.timer-card');

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
   4. Todo_Manager
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
     * @returns {Task|null} null if description is empty/whitespace
     */
    addTask(description) {
      const trimmed = (description || '').trim();
      if (!trimmed) return null;
      const task = { id: _generateId(), description: trimmed, completed: false };
      _tasks.push(task);
      _persist();
      return task;
    },

    /**
     * Updates the description of an existing task.
     * @param {string} id
     * @param {string} description
     * @returns {boolean} false if empty/whitespace or task not found
     */
    updateTask(id, description) {
      const trimmed = (description || '').trim();
      if (!trimmed) return false;
      const task = _tasks.find(t => t.id === id);
      if (!task) return false;
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
  };
})();


/* ============================================================
   5. Todo_List  (renderer)
   ============================================================ */
const Todo_List = (() => {
  let _elList  = null;
  let _elForm  = null;
  let _elInput = null;

  /**
   * Re-renders the entire task list from Todo_Manager state.
   */
  function render() {
    if (!_elList) return;
    // Clear current list
    while (_elList.firstChild) _elList.removeChild(_elList.firstChild);

    const tasks = Todo_Manager.getTasks();
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
      // updateTask handles whitespace-only rejection internally
      Todo_Manager.updateTask(id, newValue);
    }
    render();
  }

  return {
    render,
    init() {
      _elList  = document.getElementById('todo-list-items');
      _elForm  = document.getElementById('todo-add-form');
      _elInput = document.getElementById('todo-input');

      // Bind add form
      if (_elForm) {
        _elForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const desc = _elInput ? _elInput.value : '';
          const task = Todo_Manager.addTask(desc);
          if (task) {
            if (_elInput) _elInput.value = '';
            render();
          }
        });
      }

      render();
    },
  };
})();


/* ============================================================
   6. QuickLinks_Manager
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
   7. QuickLinks_Panel  (renderer)
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

  // Initialise UI modules
  Greeting_Widget.init();
  Focus_Timer.init();
  Todo_List.init();
  QuickLinks_Panel.init();
});

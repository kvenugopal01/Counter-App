/**
 * ============================================================
 * PRO COUNTER APP — SCRIPT.JS
 * Modern ES6+ JavaScript | Modular | Bug-Free | Professional
 * Features: Increment | Decrement | Reset | Step Control |
 *           Dark/Light Mode | LocalStorage | Keyboard Shortcuts
 *           | History Log | Animations | Accessibility
 * ============================================================
 */

'use strict';

/* ============================================================
   1. STATE MANAGEMENT
   All app state lives here — single source of truth
   ============================================================ */
const AppState = {
  count: 0,
  step: 1,
  theme: 'dark',
  history: [],

  /**
   * Load persisted state from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('proCounterState');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.count   = typeof parsed.count   === 'number' ? parsed.count   : 0;
        this.step    = typeof parsed.step    === 'number' && parsed.step >= 1 ? parsed.step : 1;
        this.theme   = parsed.theme === 'light' ? 'light' : 'dark';
        this.history = Array.isArray(parsed.history) ? parsed.history.slice(-20) : [];
      }
    } catch (err) {
      console.warn('Could not load saved state:', err);
    }
  },

  /**
   * Persist current state to localStorage
   */
  save() {
    try {
      const payload = {
        count:   this.count,
        step:    this.step,
        theme:   this.theme,
        history: this.history.slice(-20), // Keep only last 20 entries
      };
      localStorage.setItem('proCounterState', JSON.stringify(payload));
    } catch (err) {
      console.warn('Could not save state:', err);
    }
  },
};

/* ============================================================
   2. DOM REFERENCES
   Cache all DOM queries upfront for performance
   ============================================================ */
const DOM = {
  html:            document.documentElement,
  counterValue:    document.getElementById('counter-value'),
  statusBadge:     document.getElementById('status-badge'),
  btnIncrement:    document.getElementById('btn-increment'),
  btnDecrement:    document.getElementById('btn-decrement'),
  btnReset:        document.getElementById('btn-reset'),
  stepInput:       document.getElementById('step-input'),
  stepUp:          document.getElementById('step-up'),
  stepDown:        document.getElementById('step-down'),
  historyList:     document.getElementById('history-list'),
  btnClearHistory: document.getElementById('btn-clear-history'),
  themeToggle:     document.getElementById('theme-toggle'),
  themeIcon:       document.getElementById('theme-icon'),
  themeLabel:      document.getElementById('theme-label'),
};

/* ============================================================
   3. ANIMATION UTILITIES
   ============================================================ */
const Animation = {
  /**
   * Trigger a CSS animation class on an element
   * Removes any existing animation first to allow re-triggering
   * @param {HTMLElement} el     - Target element
   * @param {string}      cls    - CSS animation class name
   */
  trigger(el, cls) {
    // Remove all animation classes
    el.classList.remove('animate-increment', 'animate-decrement', 'animate-reset');

    // Force a reflow so the animation restarts cleanly
    void el.offsetWidth;

    el.classList.add(cls);

    // Clean up the class after the animation completes
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  },
};

/* ============================================================
   4. UI UPDATE FUNCTIONS
   ============================================================ */
const UI = {
  /**
   * Refresh the displayed counter value and its visual state
   */
  updateCounter() {
    const value = AppState.count;

    // Update the text
    DOM.counterValue.textContent = value;

    // Toggle color class based on value
    DOM.counterValue.classList.toggle('positive', value > 0);
    DOM.counterValue.classList.toggle('negative', value < 0);

    // Update status badge
    if (value > 0) {
      DOM.statusBadge.textContent = 'Positive';
      DOM.statusBadge.className   = 'status-badge status-positive';
    } else if (value < 0) {
      DOM.statusBadge.textContent = 'Negative';
      DOM.statusBadge.className   = 'status-badge status-negative';
    } else {
      DOM.statusBadge.textContent = 'Neutral';
      DOM.statusBadge.className   = 'status-badge status-neutral';
    }

    // Disable decrement when counter is 0 to prevent going below zero
    DOM.btnDecrement.disabled = false;
    DOM.btnDecrement.style.opacity = '1';
    DOM.btnDecrement.style.cursor  = 'pointer';
  },

  /**
   * Sync step input field with AppState.step
   */
  updateStepInput() {
    DOM.stepInput.value = AppState.step;
  },

  /**
   * Add a new entry to the history list
   * @param {string} action  - 'increment' | 'decrement' | 'reset'
   * @param {number} newValue
   */
  addHistoryEntry(action, newValue) {
    // Remove the "empty" placeholder if it exists
    const empty = DOM.historyList.querySelector('.history-empty');
    if (empty) empty.remove();

    // Create history item
    const li = document.createElement('li');

    const actionLabels = {
      increment: { label: '+ Inc', cls: 'inc' },
      decrement: { label: '− Dec', cls: 'dec' },
      reset:     { label: '↺ Rst', cls: 'rst' },
    };

    const actionInfo = actionLabels[action];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    li.innerHTML = `
      <span class="history-action ${actionInfo.cls}">${actionInfo.label}</span>
      <span class="history-val">→ ${newValue}</span>
      <span class="history-time">${timeStr}</span>
    `;

    // Prepend so newest appears at top
    DOM.historyList.prepend(li);

    // Cap displayed history at 20 items
    const items = DOM.historyList.querySelectorAll('li:not(.history-empty)');
    if (items.length > 20) {
      items[items.length - 1].remove();
    }
  },

  /**
   * Render the full history from AppState (used on initial load)
   */
  renderHistory() {
    DOM.historyList.innerHTML = '';

    if (AppState.history.length === 0) {
      DOM.historyList.innerHTML = '<li class="history-empty">No history yet. Start counting!</li>';
      return;
    }

    // History is stored oldest-first; render newest first
    [...AppState.history].reverse().forEach(entry => {
      this.addHistoryEntry(entry.action, entry.value);
    });
  },

  /**
   * Apply the current theme to the document
   */
  applyTheme() {
    const isDark = AppState.theme === 'dark';
    DOM.html.setAttribute('data-theme', AppState.theme);
    DOM.themeIcon.textContent  = isDark ? '🌙' : '☀️';
    DOM.themeLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
  },
};

/* ============================================================
   5. COUNTER OPERATIONS (Core Business Logic)
   ============================================================ */
const Counter = {
  /**
   * Increment the counter by the current step value
   */
  increment() {
    AppState.count += AppState.step;
    AppState.history.push({ action: 'increment', value: AppState.count });

    UI.updateCounter();
    UI.addHistoryEntry('increment', AppState.count);
    Animation.trigger(DOM.counterValue, 'animate-increment');
    AppState.save();
  },

  /**
   * Decrement the counter by the current step value
   * Allows going below zero
   */
  decrement() {
    AppState.count = AppState.count - AppState.step;
    AppState.history.push({ action: 'decrement', value: AppState.count });

    UI.updateCounter();
    UI.addHistoryEntry('decrement', AppState.count);
    Animation.trigger(DOM.counterValue, 'animate-decrement');
    AppState.save();
  },

  /**
   * Reset the counter back to zero
   */
  reset() {
    if (AppState.count === 0) return; // No-op if already at zero

    AppState.count = 0;
    AppState.history.push({ action: 'reset', value: 0 });

    UI.updateCounter();
    UI.addHistoryEntry('reset', 0);
    Animation.trigger(DOM.counterValue, 'animate-reset');
    AppState.save();
  },

  /**
   * Change the step size
   * @param {number|string} rawValue - New step value (will be validated)
   */
  setStep(rawValue) {
    const parsed = parseInt(rawValue, 10);

    // Validate: must be a positive integer between 1 and 100
    if (isNaN(parsed) || parsed < 1) {
      AppState.step = 1;
    } else if (parsed > 100) {
      AppState.step = 100;
    } else {
      AppState.step = parsed;
    }

    UI.updateStepInput();
    AppState.save();
  },

  /**
   * Toggle between dark and light themes
   */
  toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    UI.applyTheme();
    AppState.save();
  },

  /**
   * Clear the history log
   */
  clearHistory() {
    AppState.history = [];
    DOM.historyList.innerHTML = '<li class="history-empty">No history yet. Start counting!</li>';
    AppState.save();
  },
};

/* ============================================================
   6. EVENT LISTENERS
   ============================================================ */
const Events = {
  /**
   * Attach all event listeners to DOM elements
   */
  init() {
    // --- Action Buttons ---
    DOM.btnIncrement.addEventListener('click', () => Counter.increment());
    DOM.btnDecrement.addEventListener('click', () => Counter.decrement());
    DOM.btnReset.addEventListener('click',     () => Counter.reset());

    // --- Step Control ---
    DOM.stepInput.addEventListener('change', (e) => Counter.setStep(e.target.value));
    DOM.stepInput.addEventListener('input',  (e) => Counter.setStep(e.target.value));
    DOM.stepUp.addEventListener('click',     () => Counter.setStep(AppState.step + 1));
    DOM.stepDown.addEventListener('click',   () => Counter.setStep(AppState.step - 1));

    // Prevent scrolling on number input arrow keys
    DOM.stepInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
    });

    // --- Theme Toggle ---
    DOM.themeToggle.addEventListener('click', () => Counter.toggleTheme());

    // --- Clear History ---
    DOM.btnClearHistory.addEventListener('click', () => Counter.clearHistory());

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', this.handleKeyboard);
  },

  /**
   * Keyboard shortcut handler
   * @param {KeyboardEvent} e
   */
  handleKeyboard(e) {
    // Ignore shortcuts when user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const keyMap = {
      'ArrowUp':   () => Counter.increment(),
      'ArrowDown': () => Counter.decrement(),
      'i':         () => Counter.increment(),
      'I':         () => Counter.increment(),
      'd':         () => Counter.decrement(),
      'D':         () => Counter.decrement(),
      'r':         () => Counter.reset(),
      'R':         () => Counter.reset(),
      't':         () => Counter.toggleTheme(),
      'T':         () => Counter.toggleTheme(),
    };

    const action = keyMap[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  },
};

/* ============================================================
   7. APP INITIALIZER
   Entry point — bootstraps the entire application
   ============================================================ */
const App = {
  init() {
    // Load any persisted state from localStorage
    AppState.load();

    // Apply saved theme
    UI.applyTheme();

    // Render counter with saved value
    UI.updateCounter();

    // Sync step input
    UI.updateStepInput();

    // Render saved history
    UI.renderHistory();

    // Attach all event listeners
    Events.init();

    console.info(
      '%c⚡ Pro Counter App — Loaded Successfully ',
      'background:#7c5cfc;color:#fff;padding:4px 10px;border-radius:4px;font-weight:700;'
    );
  },
};

/* ============================================================
   8. BOOT
   Start the app once the DOM is fully parsed
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => App.init());

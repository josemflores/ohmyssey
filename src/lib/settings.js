// Player settings, kept in localStorage. Every read and write is guarded:
// a private window can refuse storage, and the game still runs.

const KEY = 'ohmyssey.settings';

export const DEFAULT_SETTINGS = {
  brightness: 100, // percent, applied to the game canvas
  largeText: false,
  devMode: false,
  hitboxes: false,
};

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage refused. The settings still apply for this visit.
  }
}

// Settings that live in CSS: brightness of the canvas, and text size.
export function applySettings(settings) {
  const root = document.documentElement;
  root.style.setProperty('--game-brightness', String(settings.brightness / 100));
  root.classList.toggle('large-text', Boolean(settings.largeText));
}

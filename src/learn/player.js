/**
 * Display name for the demo gate.
 * The login form does not collect a password.
 *
 * ohmyssey.player is a plain string, 2–20 characters.
 * getPlayerName() is what other screens should greet with.
 * It falls back to Odysseus when nobody has signed in yet.
 */

export const PLAYER_STORAGE_KEY = 'ohmyssey.player';
export const GUEST_NAME = 'Odysseus';

const MIN_LENGTH = 2;
const MAX_LENGTH = 20;
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '\u2019.-]*$/u;

// Kept only when the browser refuses localStorage, so this visit can still greet.
let sessionName = '';

export function normalizePlayerName(raw) {
  return String(raw ?? '').replace(/\s+/g, ' ').trim();
}

export function playerNameError(raw) {
  const name = normalizePlayerName(raw);
  if (!name) return 'Enter a username to sign in.';
  if (name.length < MIN_LENGTH) return 'Use at least 2 characters.';
  if (name.length > MAX_LENGTH) return 'Keep the username to 20 characters.';
  if (!NAME_PATTERN.test(name)) {
    return 'Use letters and numbers. Spaces, apostrophes, and hyphens are fine.';
  }
  return '';
}

export function rememberPlayer(name, storage = defaultStorage()) {
  const clean = normalizePlayerName(name);
  if (playerNameError(clean)) return '';
  try {
    storage?.setItem(PLAYER_STORAGE_KEY, clean);
  } catch {
    // Private mode can refuse the write. The name still stands for this visit.
  }
  if (isBrowserStore(storage)) sessionName = clean;
  return clean;
}

export function storedPlayerName(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(PLAYER_STORAGE_KEY);
    if (typeof raw !== 'string' || !raw) return '';
    const name = normalizePlayerName(raw);
    if (playerNameError(name)) {
      try {
        storage?.removeItem(PLAYER_STORAGE_KEY);
      } catch {
        // Leave a locked store alone. Callers still treat the name as missing.
      }
      return '';
    }
    return name;
  } catch {
    return '';
  }
}

export function getPlayerName(storage = defaultStorage()) {
  // This visit wins over a stored name when the browser refused the write.
  if (isBrowserStore(storage) && sessionName) return sessionName;
  return storedPlayerName(storage) || GUEST_NAME;
}

function isBrowserStore(storage) {
  const browser = defaultStorage();
  return storage === browser || (storage == null && browser == null);
}

function defaultStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

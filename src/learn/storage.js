/**
 * Study progress stays in this browser, separate from the bench voyage.
 * Shape:
 *   { difficulty, completed: [1, 2], inventory: [...], notebook: [...] }
 */

export const LEARN_STORAGE_KEY = 'ohmyssey.learn.v1';

const DIFFICULTIES = ['easy', 'normal', 'hard'];

export function emptyLearnProgress() {
  return { difficulty: 'normal', completed: [], inventory: [], notebook: [] };
}

export function loadLearnProgress(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(LEARN_STORAGE_KEY);
    if (!raw) return emptyLearnProgress();
    const parsed = JSON.parse(raw);
    return sanitize(parsed);
  } catch {
    return emptyLearnProgress();
  }
}

export function withDifficulty(progress, difficulty, storage = defaultStorage()) {
  const next = sanitize({ ...progress, difficulty });
  persist(next, storage);
  return next;
}

export function recordWin(progress, level, storage = defaultStorage()) {
  const current = sanitize(progress);
  const completed = current.completed.includes(level.id)
    ? current.completed
    : [...current.completed, level.id];
  const reward = level.reward;
  const inventory = reward && !current.inventory.some((item) => item.id === reward.id)
    ? [...current.inventory, { id: reward.id, name: reward.name, note: reward.note || '', levelId: level.id }]
    : current.inventory;
  const note = level.notebook;
  const notebook = note && !current.notebook.some((item) => item.levelId === level.id)
    ? [...current.notebook, {
      levelId: level.id,
      title: level.title,
      concept: note.concept,
      summary: note.summary,
    }]
    : current.notebook;
  const next = { ...current, completed, inventory, notebook };
  persist(next, storage);
  return next;
}

export function clearLearnProgress(storage = defaultStorage()) {
  const next = emptyLearnProgress();
  try {
    storage?.removeItem(LEARN_STORAGE_KEY);
  } catch {
    // Ignore a locked or missing store. The in-memory copy is already empty.
  }
  return next;
}

function sanitize(value) {
  const source = value && typeof value === 'object' ? value : {};
  const completed = Array.isArray(source.completed)
    ? [...new Set(source.completed.map(Number).filter((id) => Number.isInteger(id)))]
    : [];
  const inventory = Array.isArray(source.inventory)
    ? source.inventory.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
    : [];
  const notebook = Array.isArray(source.notebook)
    ? source.notebook.filter((item) => item && Number.isInteger(item.levelId) && typeof item.concept === 'string')
    : [];
  const difficulty = DIFFICULTIES.includes(source.difficulty) ? source.difficulty : 'normal';
  return { difficulty, completed, inventory, notebook };
}

function persist(progress, storage) {
  try {
    storage?.setItem(LEARN_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private mode can refuse the write. The voyage still works for this tab.
  }
}

function defaultStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

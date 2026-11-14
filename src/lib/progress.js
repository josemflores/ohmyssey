/**
 * Progress lives in the browser only, under one localStorage key.
 * There is no account and no server save. Clearing site data resets the voyage.
 *
 * Shape: { "completed": [1, 2] }
 * Level N is unlocked when N is 1, or when N - 1 is in that list.
 */

const STORAGE_KEY = 'ohmyssey.progress.v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [] };
    const parsed = JSON.parse(raw);
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.map(Number).filter((id) => Number.isInteger(id))
      : [];
    return { completed: [...new Set(completed)] };
  } catch {
    return { completed: [] };
  }
}

export function markComplete(levelId) {
  const progress = loadProgress();
  if (!progress.completed.includes(levelId)) {
    progress.completed.push(levelId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
  return progress;
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isUnlocked(levelId, progress) {
  if (levelId <= 1) return true;
  return progress.completed.includes(levelId - 1);
}

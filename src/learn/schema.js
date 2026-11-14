/**
 * LevelData is plain JSON. The study screens read it, and `grade` decides
 * a win from `puzzle.kind`. A backend may replace the bundled file by
 * serving the same shape from VITE_LEVELS_API_URL.
 *
 * Island numbers in the brief run 0–5. This voyage stores that as
 * `specIndex` and uses `id` 1–6 so the study map lines up with the bench.
 */

export const LEVEL_KINDS = ['closed-loop', 'ohms', 'series-parallel', 'rc', 'flyback', 'astable'];

export function isLevelData(value) {
  if (!value || typeof value !== 'object') return false;
  if (!Number.isInteger(value.id)) return false;
  if (typeof value.title !== 'string' || !value.title.trim()) return false;
  if (typeof value.concept !== 'string' || !value.concept.trim()) return false;
  if (!value.puzzle || !LEVEL_KINDS.includes(value.puzzle.kind)) return false;
  if (!Array.isArray(value.hints) || value.hints.some((hint) => typeof hint !== 'string')) return false;
  if (!value.map || typeof value.map.x !== 'number' || typeof value.map.y !== 'number') return false;
  return true;
}

export function isLevelList(value) {
  if (!Array.isArray(value) || value.length < 6) return false;
  if (!value.every(isLevelData)) return false;
  const ids = new Set(value.map((level) => level.id));
  return ids.size === value.length;
}

export function coerceLevels(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.levels)) return payload.levels;
  return null;
}

/**
 * VITE_LEVELS_API_URL when set. An empty string skips the network.
 * Undefined uses the same-origin /api/levels route.
 */
export function resolveLevelsUrl(configured) {
  if (configured === '') return '';
  if (typeof configured === 'string') return configured;
  return '/api/levels';
}

/** Keep a valid API payload. Anything else falls back to the bundled mock. */
export function selectLevels(payload, mock) {
  const levels = coerceLevels(payload);
  if (!isLevelList(levels)) return { levels: mock, source: 'mock' };
  return { levels, source: 'api' };
}

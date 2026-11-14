/**
 * Load LevelData for the study voyage.
 *
 * VITE_LEVELS_API_URL, when set, is fetched first. Unset, the app calls
 * GET /api/levels (the Vite dev server and the Vercel function). An empty
 * value skips the network. A failed or ill-shaped response uses the
 * bundled mock so the six islands still open.
 */

import mockLevels from './mock/levels.json';
import { resolveLevelsUrl, selectLevels } from './schema.js';

export function levelsEndpoint(configured) {
  return resolveLevelsUrl(configured === undefined ? readConfiguredUrl() : configured);
}

function readConfiguredUrl() {
  try {
    return import.meta.env.VITE_LEVELS_API_URL;
  } catch {
    return undefined;
  }
}

export async function loadLevelData({
  fetchImpl = fetch,
  url = levelsEndpoint(undefined),
  mock = mockLevels,
} = {}) {
  if (!url) return { levels: mock, source: 'mock' };
  try {
    const response = await fetchImpl(url);
    if (!response?.ok) return { levels: mock, source: 'mock' };
    const payload = await response.json();
    return selectLevels(payload, mock);
  } catch {
    return { levels: mock, source: 'mock' };
  }
}

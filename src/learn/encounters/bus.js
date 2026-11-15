/**
 * The seam between Phaser and the React encounter overlay.
 *
 * Kevin calls requestEncounter from src/game. He does not import React.
 * Jose mounts <EncounterHost /> once in App. The host listens for this
 * event, shows the fight, and answers on ENCOUNTER_RESULT_EVENT.
 *
 * detail on the result: { win: boolean, reason: 'win' | 'lose' | 'flee' }
 */

export const ENCOUNTER_EVENT = 'ohmyssey:encounter';
export const ENCOUNTER_RESULT_EVENT = 'ohmyssey:encounter-result';

export function requestEncounter(level, options = {}) {
  const detail = { level: Number(level) };
  if (options && options.monsterId) detail.monsterId = String(options.monsterId);
  if (typeof window === 'undefined') return detail;
  window.dispatchEvent(new CustomEvent(ENCOUNTER_EVENT, { detail }));
  return detail;
}

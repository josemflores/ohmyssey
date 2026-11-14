/**
 * The board a puzzle opens on. Difficulty can reverse the LED, hide the
 * answer inside a slider, or leave the pickers empty.
 */

import { resolveTune } from './grade.js';

export function initialState(level, difficulty = 'normal') {
  const tune = resolveTune(level, difficulty);
  const puzzle = level?.puzzle || {};
  if (puzzle.kind === 'closed-loop') {
    const slotIds = puzzle.slotIds || ['s1', 's2', 's3'];
    return {
      slots: Object.fromEntries(slotIds.map((id) => [id, null])),
      switchClosed: false,
      ledForward: !tune.ledStartsReversed,
      truth: {},
    };
  }
  if (puzzle.kind === 'ohms') {
    return { ohms: null, predictionMa: 10 };
  }
  if (puzzle.kind === 'series-parallel') {
    return { topology: null, truth: {} };
  }
  if (puzzle.kind === 'rc') {
    return {
      ohms: tune.control === 'picker' ? null : (tune.initialOhms ?? puzzle.resistorOhms?.[0] ?? null),
      farads: tune.control === 'picker' ? null : (tune.initialFarads ?? puzzle.capacitorFarads?.[0] ?? null),
    };
  }
  if (puzzle.kind === 'flyback') {
    return { diode: null, truth: {} };
  }
  if (puzzle.kind === 'astable') {
    return {
      r1: tune.control === 'picker' ? null : (tune.initialR1 ?? puzzle.r1Ohms?.[0] ?? null),
      r2: tune.control === 'picker' ? null : (tune.initialR2 ?? puzzle.r2Ohms?.[0] ?? null),
      farads: tune.control === 'picker' ? null : (tune.initialFarads ?? puzzle.capacitorFarads?.[0] ?? null),
    };
  }
  return {};
}

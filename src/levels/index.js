/**
 * The voyage, in order.
 *
 * Adding an island: copy levelTemplate.js, give it the next id, import it
 * here, and put it at the end of `levels`. The map, the locks, and the
 * level screen all read this list. There is no second registry.
 *
 * Unlock rule (also in src/lib/progress.js): level 1 is always open.
 * Level N opens after level N−1 is in localStorage as completed.
 * A stub whose check() never returns complete: true will hold every
 * island after it shut. That is on purpose.
 */

import { level1 } from './level1.js';
import { level2 } from './level2.js';
import { level3 } from './level3.js';
import { level4 } from './level4.js';
import { level5 } from './level5.js';
import { level6 } from './level6.js';

export const levels = [level1, level2, level3, level4, level5, level6];

export function getLevel(id) {
  return levels.find((level) => level.id === id) || null;
}

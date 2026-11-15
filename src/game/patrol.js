// Fight numbers for the walk to the gate.
// There are no soldiers on the map. Walking for a while opens the battle screen.

import { HATCH_QUESTIONS } from './hatchQuestions.js';

export const WALK_SPEED = 80;
export const RUN_SPEED = 136;

export const HERO_MAX = 30;
export const FOE_MAX = 12;
export const FULL_HIT = 6;
export const WEAK_HIT = 4.5;
export const FOE_HIT = 4;

// Seconds of walking between battles.
export const WALK_FIGHT_SECONDS = 10;

export function createQuestions() {
  let index = 0;
  return {
    next() {
      const q = HATCH_QUESTIONS[index % HATCH_QUESTIONS.length];
      index += 1;
      return {
        id: q.id,
        prompt: q.prompt,
        choices: q.choices.slice(),
        answer: q.answer,
      };
    },
  };
}

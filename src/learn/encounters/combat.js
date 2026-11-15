/**
 * Fight rules with no React in them, so the overlay and a sanity check
 * share one definition of a blow.
 */

const LETTERS = { a: 0, b: 1, c: 2, d: 3 };

/** Keyboard answer: 1–4 or A–D. Returns a choice index, or null. */
export function choiceFromKey(key, count) {
  if (typeof key !== 'string' || !count) return null;
  let index = null;
  if (/^[1-9]$/.test(key)) index = Number(key) - 1;
  else if (LETTERS[key.toLowerCase()] != null) index = LETTERS[key.toLowerCase()];
  if (index == null || index < 0 || index >= count) return null;
  return index;
}

/**
 * A correct answer deals heroStrike to the foe.
 * A wrong answer deals foeDamage to the hero.
 * outcome is 'hit', 'hurt', 'win', or 'lose'.
 */
export function applyAnswer({ heroHp, foeHp, correct, foeDamage = 1, heroStrike = 1 }) {
  const strike = Math.max(0, heroStrike);
  const bite = Math.max(0, foeDamage);
  if (correct) {
    const next = Math.max(0, foeHp - strike);
    return { heroHp, foeHp: next, outcome: next === 0 ? 'win' : 'hit' };
  }
  const next = Math.max(0, heroHp - bite);
  return { heroHp: next, foeHp, outcome: next === 0 ? 'lose' : 'hurt' };
}

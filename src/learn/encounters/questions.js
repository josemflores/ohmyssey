/**
 * Question bank for monster encounters, plus easy Ohm's-law rolls.
 *
 * The JSON file is the authored pool (level 1 Troy, level 2 Ithaca).
 * generateOhmsQuestion builds a fresh whole-number V = I × R item so a
 * long fight never runs out, and so a few arithmetic questions show up
 * even in a short one. buildDeck shuffles those into the opening of a fight.
 */

import bank from './questions.json';

const FORMS = ['current', 'voltage', 'resistance'];

export function isQuestion(value) {
  if (!value || typeof value !== 'object') return false;
  if (typeof value.id !== 'string' || !value.id.trim()) return false;
  if (value.level !== 1 && value.level !== 2) return false;
  if (typeof value.prompt !== 'string' || !value.prompt.trim()) return false;
  if (!Array.isArray(value.choices) || value.choices.length < 3 || value.choices.length > 4) return false;
  if (value.choices.some((choice) => typeof choice !== 'string' || !choice.trim())) return false;
  if (new Set(value.choices).size !== value.choices.length) return false;
  if (!Number.isInteger(value.answerIndex)) return false;
  if (value.answerIndex < 0 || value.answerIndex >= value.choices.length) return false;
  if (typeof value.explanation !== 'string' || !value.explanation.trim()) return false;
  if (value.flavor != null && typeof value.flavor !== 'string') return false;
  return true;
}

export function questionsForLevel(level) {
  const n = Number(level);
  return bank.filter((question) => isQuestion(question) && question.level === n);
}

export function shuffle(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

function intIn(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function distractors(answer) {
  const seeds = [answer + 1, answer + 2, answer + 3, answer * 2, answer + 4];
  const picked = [];
  for (const value of seeds) {
    if (!Number.isInteger(value) || value <= 0 || value === answer || picked.includes(value)) continue;
    picked.push(value);
    if (picked.length === 3) return picked;
  }
  let extra = answer + 5;
  while (picked.length < 3) {
    if (extra !== answer && !picked.includes(extra)) picked.push(extra);
    extra += 1;
  }
  return picked;
}

/**
 * One easy Ohm's-law question with whole-number volts, ohms, and amps.
 * rng is a function that returns a number in [0, 1), same contract as Math.random.
 */
export function generateOhmsQuestion(rng = Math.random, level = 1) {
  const form = pick(rng, FORMS);
  const current = intIn(rng, 1, 4);
  const resistance = intIn(rng, 1, 6);
  const voltage = current * resistance;
  const place = Number(level) === 2 ? 2 : 1;

  let prompt;
  let answer;
  let unit;
  let explanation;
  if (form === 'current') {
    prompt = `A ${voltage} V source feeds a ${resistance} Ω resistor. What current flows?`;
    answer = current;
    unit = 'A';
    explanation = `I = V / R = ${voltage} / ${resistance} = ${current} A.`;
  } else if (form === 'voltage') {
    prompt = `${current} A flows through a ${resistance} Ω resistor. What is the voltage across it?`;
    answer = voltage;
    unit = 'V';
    explanation = `V = I × R = ${current} × ${resistance} = ${voltage} V.`;
  } else {
    prompt = `You need ${current} A from a ${voltage} V battery. What resistance does that take?`;
    answer = resistance;
    unit = 'Ω';
    explanation = `R = V / I = ${voltage} / ${current} = ${resistance} Ω.`;
  }

  const labeled = shuffle(rng, [answer, ...distractors(answer)].map((n) => `${n} ${unit}`));
  const stamp = Math.floor(rng() * 1e9).toString(36);
  return {
    id: `ohm-${place}-${form}-${voltage}v-${resistance}r-${stamp}`,
    level: place,
    prompt,
    choices: labeled,
    answerIndex: labeled.indexOf(`${answer} ${unit}`),
    explanation,
    flavor: place === 2
      ? 'The hall lamp at Ithaca waits on the same three numbers.'
      : 'Count it on the sand at Troy. Small whole numbers, then strike.',
  };
}

/**
 * Authored questions for the level, with three generated Ohm's-law items
 * mixed into the opening so a short fight still meets one.
 */
export function buildDeck(level, rng = Math.random) {
  const authored = shuffle(rng, questionsForLevel(level));
  const generated = [0, 1, 2].map(() => generateOhmsQuestion(rng, level));
  if (authored.length === 0) return generated;
  const opening = shuffle(rng, [...authored.slice(0, 5), ...generated]);
  return [...opening, ...authored.slice(5)];
}

export function questionAt(deck, index, level, rng = Math.random) {
  if (deck && index >= 0 && index < deck.length) return deck[index];
  return generateOhmsQuestion(rng, level);
}

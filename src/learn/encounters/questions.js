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

/**
 * Mix the choices so the right answer is not always in the same place.
 * Works with either `answer` or `answerIndex`, and returns a copy.
 */
export function shuffleChoices(question, rng = Math.random) {
  if (!question || !Array.isArray(question.choices)) return question;
  const key = Number.isInteger(question.answer) ? 'answer' : 'answerIndex';
  const right = question.choices[question[key]];
  const choices = shuffle(rng, question.choices);
  return { ...question, choices, [key]: choices.indexOf(right) };
}

// Wrong answers come from real slips, so the right one cannot be spotted by
// size alone: multiplying instead of dividing, adding, subtracting, or
// flipping the fraction. Duplicates and non-positive values are skipped.
function slipChoices(answer, slips, unit) {
  const out = [];
  for (const value of slips) {
    if (!(value > 0) || value === answer || out.includes(value)) continue;
    out.push(value);
    if (out.length === 3) break;
  }
  for (let extra = answer * 3; out.length < 3; extra += 1) {
    if (extra !== answer && !out.includes(extra)) out.push(extra);
  }
  return [answer, ...out].map((n) => `${formatNumber(n)} ${unit}`);
}

function formatNumber(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/**
 * One Ohm's-law question. Half use small whole amps and ohms; half use the
 * beach-lamp scale (volts, kilohms, milliamps), where V ÷ kΩ = mA.
 * rng is a function that returns a number in [0, 1), same contract as Math.random.
 */
export function generateOhmsQuestion(rng = Math.random, level = 1) {
  const form = pick(rng, FORMS);
  const lamp = rng() < 0.5;
  const current = intIn(rng, lamp ? 2 : 1, lamp ? 9 : 4);
  const resistance = intIn(rng, 2, 6);
  const voltage = current * resistance;
  const place = Number(level) === 2 ? 2 : 1;
  const I = lamp ? 'mA' : 'A';
  const R = lamp ? 'kΩ' : 'Ω';
  const ohms = `${resistance} ${R}`;

  let prompt;
  let choices;
  let explanation;
  if (form === 'current') {
    prompt = `A ${voltage} V battery feeds a ${ohms} resistor. What current flows?`;
    choices = slipChoices(current, [voltage * resistance, voltage + resistance, resistance / voltage, voltage], I);
    explanation = `I = V / R = ${voltage} ÷ ${resistance} = ${current} ${I}.${lamp ? ' Volts ÷ kΩ gives mA.' : ''}`;
  } else if (form === 'voltage') {
    prompt = `${current} ${I} flows through a ${ohms} resistor. What is the voltage across it?`;
    choices = slipChoices(voltage, [current + resistance, resistance / current, Math.abs(resistance - current), resistance], 'V');
    explanation = `V = I × R = ${current} × ${resistance} = ${voltage} V.${lamp ? ' mA × kΩ gives volts.' : ''}`;
  } else {
    prompt = `You want ${current} ${I} from a ${voltage} V battery. What resistance does that take?`;
    choices = slipChoices(resistance, [voltage * current, voltage + current, voltage - current, current / voltage], R);
    explanation = `R = V / I = ${voltage} ÷ ${current} = ${resistance} ${R}.`;
  }

  const right = choices[0];
  const labeled = shuffle(rng, choices);
  const stamp = Math.floor(rng() * 1e9).toString(36);
  return {
    id: `ohm-${place}-${form}-${voltage}v-${resistance}r-${stamp}`,
    level: place,
    prompt,
    choices: labeled,
    answerIndex: labeled.indexOf(right),
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
  const authored = shuffle(rng, questionsForLevel(level)).map((q) => shuffleChoices(q, rng));
  const generated = [0, 1, 2].map(() => generateOhmsQuestion(rng, level));
  if (authored.length === 0) return generated;
  const opening = shuffle(rng, [...authored.slice(0, 5), ...generated]);
  return [...opening, ...authored.slice(5)];
}

export function questionAt(deck, index, level, rng = Math.random) {
  if (deck && index >= 0 && index < deck.length) return deck[index];
  return generateOhmsQuestion(rng, level);
}

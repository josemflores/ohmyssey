// Questions for the battle, picked by the attack the player chose.
//
// Light Attack is easy: recall, or one step of V = I × R with small
// whole numbers. Heavy Attack is hard: series or parallel first, then
// the current, an LED drop, or the power that follows. Authored
// questions come from the encounter bank and the horse hatch. A
// `difficulty` field wins; otherwise a short heuristic reads the prompt.

import { HATCH_QUESTIONS } from './hatchQuestions.js';
import {
  generateOhmsQuestion,
  questionsForLevel,
  shuffle,
  shuffleChoices,
} from '../learn/encounters/questions.js';

export const ATTACKS = {
  light: {
    id: 'light',
    label: 'Light Attack',
    damage: 5,
    difficulty: 'easy',
    anim: 'jab',
    hint: 'Easy',
  },
  heavy: {
    id: 'heavy',
    label: 'Heavy Attack',
    damage: 10,
    difficulty: 'hard',
    anim: 'heavy',
    hint: 'Hard',
  },
};

const HATCH_DIFFICULTY = {
  'lamp-current': 'medium',
  'open-switch': 'easy',
  'bigger-resistor': 'easy',
};

export function attackById(id) {
  return ATTACKS[id] || ATTACKS.light;
}

// Used when the generator throws or comes back without a prompt and four choices.
export const GATE_FALLBACK = {
  id: 'gate-fallback',
  prompt: 'A 12 V battery feeds a 4 Ω resistor. What current flows?',
  choices: ['3 A', '48 A', '16 A', '8 A'],
  answer: 0,
  hint: 'I = V / R = 12 / 4 = 3 A. Multiplying, adding or subtracting gives the other three.',
};

function asGateQuestion(question) {
  if (!question || typeof question.prompt !== 'string' || !question.prompt.trim()) return null;
  if (!Array.isArray(question.choices) || question.choices.length < 4) return null;
  if (!question.choices.every((choice) => typeof choice === 'string' && choice.trim())) return null;
  const answer = Number.isInteger(question.answer) ? question.answer : question.answerIndex;
  if (!Number.isInteger(answer) || answer < 0 || answer >= question.choices.length) return null;
  return {
    id: question.id || 'gate-ohm',
    prompt: question.prompt,
    choices: question.choices.slice(),
    answer,
    hint: question.explanation || question.hint || 'Try I = V / R.',
  };
}

// One medium step of Ohm's law for the shut gate. A new roll each time.
export function nextGateQuestion(rng = Math.random) {
  try {
    const made = asGateQuestion(generateOhmsQuestion(rng, 1));
    if (made) return shuffleChoices(made, rng);
  } catch {
    // The bank can fail to load. The gate still has to ask something.
  }
  return shuffleChoices({
    ...GATE_FALLBACK,
    choices: GATE_FALLBACK.choices.slice(),
  }, rng);
}

export function classifyQuestion(question) {
  if (question.difficulty === 'easy' || question.difficulty === 'medium' || question.difficulty === 'hard') {
    return question.difficulty;
  }
  const prompt = String(question.prompt || '');
  const lower = prompt.toLowerCase();
  const numbers = prompt.match(/\d+/g) || [];
  const topology = lower.includes('series') || lower.includes('parallel');
  const asksCurrent = lower.includes('current') || lower.includes('flows');
  const asksLaw = asksCurrent || lower.includes('resistance') || lower.includes('voltage') || lower.includes('ω');
  if (topology && numbers.length >= 2 && asksCurrent) return 'hard';
  if (topology && numbers.length >= 1) return 'medium';
  if (numbers.length >= 1 && asksLaw) return 'medium';
  return 'easy';
}

function pack(question) {
  const answer = Number.isInteger(question.answer) ? question.answer : question.answerIndex;
  return {
    id: question.id,
    prompt: question.prompt,
    choices: question.choices.slice(),
    answer,
    difficulty: classifyQuestion(question),
    hint: question.explanation || question.hint || '',
  };
}

function intIn(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function lead(n) {
  return `${/^(8|11|18)/.test(String(n)) ? 'An' : 'A'} ${n}`;
}

// Right answer first, then the wrong ones; shuffled before it is shown.
function choicesFrom(rng, answer, wrongs, unit) {
  const labels = [answer];
  for (const wrong of wrongs) {
    if (labels.length === 4) break;
    if (typeof wrong === 'string' && wrong !== answer && !labels.includes(wrong)) labels.push(wrong);
  }
  for (let n = 2; labels.length < 4; n += 1) {
    const filler = `${n * 7} ${unit}`;
    if (!labels.includes(filler)) labels.push(filler);
  }
  const order = shuffle(rng, labels);
  return { choices: order, answer: order.indexOf(answer) };
}

// Red LEDs keep about 2 V, blue and white about 3 V. Every row gives a
// whole number of milliamps and a resistor a beginner would meet.
const LED_ROWS = [
  { battery: 3, led: 2, ohms: 100, ma: 10 },
  { battery: 5, led: 2, ohms: 150, ma: 20 },
  { battery: 5, led: 2, ohms: 300, ma: 10 },
  { battery: 6, led: 2, ohms: 200, ma: 20 },
  { battery: 6, led: 2, ohms: 400, ma: 10 },
  { battery: 9, led: 2, ohms: 1000, ma: 7 },
  { battery: 9, led: 3, ohms: 300, ma: 20 },
  { battery: 9, led: 3, ohms: 600, ma: 10 },
  { battery: 12, led: 2, ohms: 500, ma: 20 },
  { battery: 12, led: 2, ohms: 1000, ma: 10 },
  { battery: 12, led: 3, ohms: 900, ma: 10 },
];

function tenth(n) {
  return Math.round(n * 10) / 10;
}

function ohmsLabel(ohms) {
  return ohms >= 1000 ? `${ohms / 1000} kΩ` : `${ohms} Ω`;
}

function ledName(volts) {
  return volts === 2 ? 'a red LED (2 V)' : 'a blue LED (3 V)';
}

// Two steps every time: combine resistors, or take off the LED's volts,
// then use Ohm's law. Wrong answers are the step a beginner skips.
function generateHardOhmsQuestion(rng) {
  const stamp = Math.floor(rng() * 1e9).toString(36);
  const roll = rng();

  if (roll < 0.2) {
    // Series: resistances add. Slips: one resistor only, or treat as parallel.
    const r1 = intIn(rng, 1, 4);
    const r2 = intIn(rng, 1, 5);
    const current = intIn(rng, 1, 4);
    const total = r1 + r2;
    const voltage = current * total;
    const parallel = (voltage * total) / (r1 * r2);
    const made = choicesFrom(rng, `${current} mA`, [
      `${tenth(voltage / r1)} mA`,
      `${tenth(parallel)} mA`,
      `${voltage * total} mA`,
      `${tenth(voltage / r2)} mA`,
    ], 'mA');
    return {
      id: `ohm-hard-series-${stamp}`,
      prompt: `${lead(voltage)} V battery drives a ${r1} kΩ and a ${r2} kΩ resistor in series. What current flows?`,
      ...made,
      hint: `Series resistances add: ${total} kΩ. I = ${voltage} ÷ ${total} = ${current} mA.`,
      difficulty: 'hard',
    };
  }

  if (roll < 0.4) {
    // Parallel, equal branches. Slips: one branch only, or add like series.
    const branch = intIn(rng, 1, 4) * 2;
    const each = intIn(rng, 1, 3);
    const voltage = each * branch;
    const made = choicesFrom(rng, `${each * 2} mA`, [
      `${each} mA`,
      `${Math.round((voltage / (branch * 2)) * 10) / 10} mA`,
      `${each * 4} mA`,
    ], 'mA');
    return {
      id: `ohm-hard-parallel-${stamp}`,
      prompt: `${lead(voltage)} V battery feeds two ${branch} kΩ resistors in parallel. What current leaves the battery?`,
      ...made,
      hint: `Each branch gets all ${voltage} V: ${voltage} ÷ ${branch} = ${each} mA, and two branches make ${each * 2} mA.`,
      difficulty: 'hard',
    };
  }

  if (roll < 0.55) {
    // Power in a resistor. Slips: forget mA → A, or V ÷ I, or V + I.
    const current = intIn(rng, 2, 9);
    const ohms = intIn(rng, 1, 4);
    const voltage = current * ohms;
    const mw = voltage * current;
    const made = choicesFrom(rng, `${mw} mW`, [
      `${mw} W`,
      `${voltage + current} mW`,
      `${Math.round((voltage / current) * 10) / 10} mW`,
    ], 'mW');
    return {
      id: `ohm-hard-power-${stamp}`,
      prompt: `A ${ohms} kΩ resistor carries ${current} mA. How much power does it turn into heat?`,
      ...made,
      hint: `First V = ${current} mA × ${ohms} kΩ = ${voltage} V. Then P = V × I = ${voltage} V × ${current} mA = ${mw} mW.`,
      difficulty: 'hard',
    };
  }

  const row = LED_ROWS[intIn(rng, 0, LED_ROWS.length - 1)];
  const left = row.battery - row.led;
  if (roll < 0.78) {
    // LED current. Slips: forget the LED, use only the LED's volts, add them.
    const per = (v) => `${Math.round((v / row.ohms) * 1000 * 10) / 10} mA`;
    const made = choicesFrom(rng, `${row.ma} mA`, [
      per(row.battery),
      per(row.led),
      per(row.battery + row.led),
    ], 'mA');
    return {
      id: `ohm-hard-led-current-${stamp}`,
      prompt: `${lead(row.battery)} V battery, ${ledName(row.led)}, and a ${ohmsLabel(row.ohms)} resistor are in series. What current flows?`,
      ...made,
      hint: `The resistor gets ${row.battery} − ${row.led} = ${left} V. I = ${left} V ÷ ${ohmsLabel(row.ohms)} = ${row.ma} mA.`,
      difficulty: 'hard',
    };
  }

  // Pick the LED's resistor. Same slips, the other way round.
  const amps = row.ma / 1000;
  const per = (v) => ohmsLabel(Math.round(v / amps));
  const made = choicesFrom(rng, ohmsLabel(row.ohms), [
    per(row.battery),
    per(row.led),
    per(row.battery + row.led),
  ], 'Ω');
  return {
    id: `ohm-hard-led-pick-${stamp}`,
    prompt: `You want ${row.ma} mA through ${ledName(row.led)} from a ${row.battery} V battery. Which resistor?`,
    ...made,
    hint: `The resistor gets ${row.battery} − ${row.led} = ${left} V. R = ${left} V ÷ ${row.ma} mA = ${ohmsLabel(row.ohms)}.`,
    difficulty: 'hard',
  };
}

function take(deck, cursor, refill) {
  if (!deck.length) return refill();
  if (cursor.index >= deck.length) {
    const extra = refill();
    if (extra) deck.push(extra);
  }
  const question = deck[cursor.index % deck.length];
  cursor.index += 1;
  return shuffleChoices({
    id: question.id,
    prompt: question.prompt,
    choices: question.choices.slice(),
    answer: question.answer,
    difficulty: question.difficulty,
    hint: question.hint,
  });
}

export function createBattleQuestions(rng = Math.random) {
  const easy = [];
  const hard = [];

  const authored = questionsForLevel(1).map((question) => pack(question));
  const hatch = HATCH_QUESTIONS.map((question) => pack({
    ...question,
    difficulty: HATCH_DIFFICULTY[question.id] || 'easy',
  }));

  for (const question of authored.concat(hatch)) {
    // One-step V = I × R sits with the recall items. Multi-step stays hard.
    if (question.difficulty === 'hard') hard.push(question);
    else if (question.id === 'lamp-current') continue;
    else easy.push({ ...question, difficulty: 'easy' });
  }

  for (let i = 0; i < 6; i += 1) {
    easy.push(pack({ ...generateOhmsQuestion(rng, 1), difficulty: 'easy' }));
  }
  for (let i = 0; i < 8; i += 1) hard.push(generateHardOhmsQuestion(rng));

  const decks = {
    easy: shuffle(rng, easy),
    hard: shuffle(rng, hard),
  };
  const cursors = { easy: { index: 0 }, hard: { index: 0 } };

  return {
    next(difficulty) {
      if (difficulty === 'hard') {
        return take(decks.hard, cursors.hard, () => generateHardOhmsQuestion(rng));
      }
      return take(decks.easy, cursors.easy, () => pack({
        ...generateOhmsQuestion(rng, 1),
        difficulty: 'easy',
      }));
    },
  };
}

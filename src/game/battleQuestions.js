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
  choices: ['3 A', '6 A', '2 A', '8 A'],
  answer: 0,
  hint: 'I = V / R = 12 / 4 = 3 A.',
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
    if (made) return made;
  } catch {
    // The bank can fail to load. The gate still has to ask something.
  }
  return {
    ...GATE_FALLBACK,
    choices: GATE_FALLBACK.choices.slice(),
  };
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
  };
}

function intIn(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function lead(n) {
  return `${/^(8|11|18)/.test(String(n)) ? 'An' : 'A'} ${n}`;
}

function withChoices(rng, answer, wrongs) {
  const labels = [answer];
  for (const wrong of wrongs) {
    if (typeof wrong === 'string' && wrong !== answer && !labels.includes(wrong)) labels.push(wrong);
  }
  let extra = 2;
  while (labels.length < 4) {
    const filler = `${extra} A`;
    extra += 1;
    if (!labels.includes(filler)) labels.push(filler);
  }
  return shuffle(rng, labels.slice(0, 4));
}

// Two resistors, then the current. Whole amps, so the arithmetic stays fair.
function generateHardOhmsQuestion(rng) {
  const stamp = Math.floor(rng() * 1e9).toString(36);
  const roll = rng();

  if (roll < 0.25) {
    const r1 = intIn(rng, 2, 5);
    const r2 = intIn(rng, 2, 5);
    const current = intIn(rng, 1, 3);
    const total = r1 + r2;
    const voltage = current * total;
    const answer = `${current} A`;
    const choices = withChoices(rng, answer, [
      `${current + r1} A`,
      `${total} Ω`,
      `${current + 1} A`,
    ]);
    return {
      id: `ohm-hard-series-${stamp}`,
      prompt: `${lead(voltage)} V battery feeds a ${r1} Ω resistor and a ${r2} Ω resistor in series. What current flows?`,
      choices,
      answer: choices.indexOf(answer),
      difficulty: 'hard',
    };
  }

  if (roll < 0.5) {
    const branch = intIn(rng, 2, 4) * 2;
    const equivalent = branch / 2;
    const current = intIn(rng, 1, 2) * 2;
    const voltage = current * equivalent;
    const answer = `${current} A`;
    const oneBranch = voltage / branch;
    const choices = withChoices(rng, answer, [
      `${oneBranch} A`,
      `${equivalent} Ω`,
      `${current + 2} A`,
    ]);
    return {
      id: `ohm-hard-parallel-${stamp}`,
      prompt: `${lead(voltage)} V battery feeds two ${branch} Ω resistors in parallel. What current leaves the battery?`,
      choices,
      answer: choices.indexOf(answer),
      difficulty: 'hard',
    };
  }

  if (roll < 0.75) {
    const r1 = intIn(rng, 2, 4);
    const r2 = intIn(rng, 2, 4);
    const current = intIn(rng, 1, 3);
    const total = r1 + r2;
    const voltage = current * total;
    const power = voltage * current;
    const answer = `${power} W`;
    const choices = withChoices(rng, answer, [
      `${voltage * total} W`,
      `${current * total} W`,
      `${power + voltage} W`,
    ]);
    return {
      id: `ohm-hard-power-${stamp}`,
      prompt: `${lead(voltage)} V battery feeds a ${r1} Ω resistor and a ${r2} Ω resistor in series. How much power does the battery supply?`,
      choices,
      answer: choices.indexOf(answer),
      difficulty: 'hard',
    };
  }

  const drops = [
    { battery: 9, led: 2, ohms: '1 kΩ', ma: 7 },
    { battery: 9, led: 2, ohms: '700 Ω', ma: 10 },
    { battery: 12, led: 2, ohms: '1 kΩ', ma: 10 },
    { battery: 12, led: 3, ohms: '1.5 kΩ', ma: 6 },
  ];
  const drop = drops[intIn(rng, 0, drops.length - 1)];
  const answer = `${drop.ma} mA`;
  const choices = withChoices(rng, answer, [
    `${drop.battery} mA`,
    `${drop.ma} A`,
    `${drop.led} mA`,
  ]);
  return {
    id: `ohm-hard-drop-${stamp}`,
    prompt: `${lead(drop.battery)} V battery, an LED that keeps ${drop.led} V, and a ${drop.ohms} resistor are in series. What current flows?`,
    choices,
    answer: choices.indexOf(answer),
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
  return {
    id: question.id,
    prompt: question.prompt,
    choices: question.choices.slice(),
    answer: question.answer,
    difficulty: question.difficulty,
  };
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

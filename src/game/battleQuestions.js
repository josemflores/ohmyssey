// Questions for the gate battle, picked by the attack the player chose.
//
// Light Attack asks an easy recall question. Strike asks a one-step
// calculation. Heavy Attack asks a generated multi-step Ohm's law item
// (series or parallel, then the current). Authored questions come from
// the encounter bank and the horse hatch. A `difficulty` field wins;
// otherwise a short heuristic reads the prompt.

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
    hint: 'Easy question · 5 damage',
  },
  strike: {
    id: 'strike',
    label: 'Strike',
    damage: 7,
    difficulty: 'medium',
    anim: 'strike',
    hint: 'Medium question · 7 damage',
  },
  heavy: {
    id: 'heavy',
    label: 'Heavy Attack',
    damage: 10,
    difficulty: 'hard',
    anim: 'heavy',
    hint: 'Hard question · 10 damage',
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

  if (roll < 0.34) {
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
      prompt: `A ${voltage} V battery feeds a ${r1} Ω resistor and a ${r2} Ω resistor in series. What current flows?`,
      choices,
      answer: choices.indexOf(answer),
      difficulty: 'hard',
    };
  }

  if (roll < 0.67) {
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
      prompt: `A ${voltage} V battery feeds two ${branch} Ω resistors in parallel. What current leaves the battery?`,
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
    prompt: `A ${drop.battery} V battery, an LED that keeps ${drop.led} V, and a ${drop.ohms} resistor are in series. What current flows?`,
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
  const medium = [];
  const hard = [];

  const authored = questionsForLevel(1).map((question) => pack(question));
  const hatch = HATCH_QUESTIONS.map((question) => pack({
    ...question,
    difficulty: HATCH_DIFFICULTY[question.id] || 'easy',
  }));

  for (const question of authored.concat(hatch)) {
    if (question.difficulty === 'hard') hard.push(question);
    else if (question.difficulty === 'medium') medium.push(question);
    else easy.push(question);
  }

  for (let i = 0; i < 4; i += 1) {
    medium.push(pack({ ...generateOhmsQuestion(rng, 1), difficulty: 'medium' }));
  }
  for (let i = 0; i < 6; i += 1) hard.push(generateHardOhmsQuestion(rng));

  const decks = {
    easy: shuffle(rng, easy),
    medium: shuffle(rng, medium),
    hard: shuffle(rng, hard),
  };
  const cursors = { easy: { index: 0 }, medium: { index: 0 }, hard: { index: 0 } };

  return {
    next(difficulty) {
      const key = decks[difficulty] && decks[difficulty].length ? difficulty : 'medium';
      if (key === 'hard') {
        return take(decks.hard, cursors.hard, () => generateHardOhmsQuestion(rng));
      }
      if (key === 'medium') {
        return take(decks.medium, cursors.medium, () => pack({
          ...generateOhmsQuestion(rng, 1),
          difficulty: 'medium',
        }));
      }
      return take(decks.easy, cursors.easy, () => pack({
        ...generateOhmsQuestion(rng, 1),
        difficulty: 'easy',
      }));
    },
  };
}

// Questions for the hatch in the horse. Each one is multiple choice.
// `answer` is the index of the right choice as written here; the choices
// are shuffled every time a question is shown, so the right one moves.
// Wrong answers are real beginner slips, not jokes.

import { shuffleChoices } from '../learn/encounters/questions.js';

export const HATCH_QUESTIONS = [
  {
    id: 'lamp-current',
    prompt: 'The beach lamp: the red LED keeps 2 V. Find the current I.',
    circuit: {
      layout: 'series',
      source: '9 V',
      parts: [{ kind: 'resistor', label: '1 kΩ' }, { kind: 'led', label: '2 V' }],
      ask: { type: 'current' },
    },
    choices: ['7 mA', '9 mA', '2 mA', '7 A'],
    answer: 0,
    hint: 'Only the resistor\'s 7 V counts: 7 V ÷ 1 kΩ = 7 mA. Using all 9 V forgets the LED.',
  },
  {
    id: 'open-switch',
    prompt: 'The switch in that lamp is open. Why does the meter read 0 mA?',
    choices: [
      'The loop is broken, so current cannot get back to the battery',
      'The resistor uses up all the current before the LED',
      'An open switch lets too much current through, so the meter maxes out',
      'The battery only pushes current while the LED is lit',
    ],
    answer: 0,
    hint: 'An open switch breaks the loop, so charge cannot travel out of the battery and back in.',
  },
  {
    id: 'bigger-resistor',
    prompt: 'The resistor is changed from 330 Ω to 1 kΩ. What happens to the current through the LED?',
    choices: [
      'It goes down, because I = V / R',
      'It goes up, because more ohms push harder',
      'It stays the same, because the battery did not change',
      'It becomes zero, because 1 kΩ blocks all current',
    ],
    answer: 0,
    hint: 'A larger resistor leaves less current for the same voltage. I = V / R.',
  },
];

export function firstHatchQuestion() {
  return copyQuestion(HATCH_QUESTIONS[0]);
}

// The next one after a miss. Wraps around so a long streak still has a question.
export function hatchQuestionAfter(id) {
  const index = HATCH_QUESTIONS.findIndex((q) => q.id === id);
  const next = HATCH_QUESTIONS[(index + 1) % HATCH_QUESTIONS.length];
  return copyQuestion(next);
}

function copyQuestion(question) {
  return shuffleChoices({
    id: question.id,
    prompt: question.prompt,
    choices: question.choices.slice(),
    answer: question.answer,
    hint: question.hint,
    ...(question.circuit ? { circuit: question.circuit } : {}),
  });
}

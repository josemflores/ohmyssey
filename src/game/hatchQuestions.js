// Placeholder questions for the hatch in the horse.
// A real lesson can replace this list later. Each one is multiple choice.
// `answer` is the index of the right choice.

export const HATCH_QUESTIONS = [
  {
    id: 'lamp-current',
    prompt: 'The beach lamp uses a 9 V battery and a red LED that keeps 2 V. A 1 kΩ resistor gets the other 7 V. What is the current?',
    choices: ['7 mA', '70 mA', '0.7 A', '9 A'],
    answer: 0,
  },
  {
    id: 'open-switch',
    prompt: 'The switch in that lamp is open. Why does the meter read 0 mA?',
    choices: [
      'The loop is broken, so current cannot get back to the battery',
      'The LED is the wrong color for 9 volts',
      'An open switch stores the current in the resistor',
      '9 volts is too small to move any charge',
    ],
    answer: 0,
  },
  {
    id: 'bigger-resistor',
    prompt: 'The resistor is changed from 330 Ω to 1 kΩ. What happens to the current through the LED?',
    choices: [
      'It goes down, because I = V / R',
      'It goes up, because more ohms push harder',
      'It stays the same, because the battery did not change',
      'It becomes zero, because 1 kΩ is an open circuit',
    ],
    answer: 0,
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
  return {
    id: question.id,
    prompt: question.prompt,
    choices: question.choices.slice(),
    answer: question.answer,
  };
}

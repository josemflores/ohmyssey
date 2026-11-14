/**
 * Turn a LevelData puzzle plus the player's controls into pass/fail.
 * The win rule is the visible objective list, so the checklist and the
 * banner cannot disagree. Hints stay in the level JSON. This file never
 * prints the winning part on a failed attempt.
 */

import { classifyLed } from '../lib/ohm.js';
import { formatPlain, formatSi } from './format.js';
import { astableHz, astableTimes, equivalentOhms, ledCurrentMa, timeConstant } from './physics.js';

export const TUNE_DEFAULTS = {
  hintsShown: 0,
  solutionAfterFails: 3,
  requireTruth: false,
  hideDecoys: true,
  ledStartsReversed: true,
  requirePrediction: false,
  predictionToleranceMa: 3,
  control: 'picker',
  sliderMode: 'detent',
  labelStyle: 'plain',
  targetTau: null,
  tolerance: null,
  initialOhms: null,
  initialFarads: null,
  initialR1: null,
  initialR2: null,
};

export function resolveTune(level, difficulty = 'normal') {
  const chosen = level?.tuning?.[difficulty];
  return { ...TUNE_DEFAULTS, ...(chosen || {}) };
}

export function solutionUnlocked({ tune, misses, complete }) {
  if (complete) return true;
  if (tune?.solutionAfterFails == null) return false;
  return misses >= tune.solutionAfterFails;
}

export function grade(level, state, difficulty = 'normal') {
  const tune = resolveTune(level, difficulty);
  const kind = level?.puzzle?.kind;
  if (kind === 'closed-loop') return gradeClosedLoop(level, state || {}, tune);
  if (kind === 'ohms') return gradeOhms(level, state || {}, tune);
  if (kind === 'series-parallel') return gradeSeries(level, state || {}, tune);
  if (kind === 'rc') return gradeRc(level, state || {}, tune);
  if (kind === 'flyback') return gradeFlyback(level, state || {}, tune);
  if (kind === 'astable') return gradeAstable(level, state || {}, tune);
  return pack(level, tune, {}, {
    tone: 'idle',
    kicker: 'Study',
    headline: 'This island has no puzzle yet.',
    detail: 'The level pack did not name a puzzle kind the study screens know.',
    equation: '',
    coach: '',
  });
}

function gradeClosedLoop(level, state, tune) {
  const placed = Object.values(state.slots || {});
  const count = (id) => placed.filter((part) => part === id).length;
  const filled = placed.filter(Boolean).length;
  const decoy = placed.some((part) => part && !['battery', 'switch', 'led'].includes(part));
  const partsOk = count('battery') === 1 && count('switch') === 1 && count('led') === 1;
  const switchOnBoard = count('switch') === 1;
  const ledOnBoard = count('led') === 1;
  const switchClosed = switchOnBoard && Boolean(state.switchClosed);
  const ledForward = ledOnBoard && Boolean(state.ledForward);
  const table = truthOf(level, state, tune);
  const flags = {
    parts: partsOk,
    switch: switchClosed,
    polarity: ledForward,
    truth: table.ok,
  };

  let tone = 'idle';
  let headline = 'The beach is still dark.';
  let detail = 'Drag the battery, the switch, and the LED into the three slots. A gap in the loop means the current is zero.';
  let coach = '';
  let equation = 'I = 0 while the loop is open.';

  if (decoy) {
    tone = 'fail';
    headline = 'That part does not close the lamp.';
    detail = 'A loose wire does not light the beach, and a resistor is a later lesson. The loop wants a source, a switch, and the LED.';
    coach = 'Walk the slots again. The lamp is the LED, the door is the switch, and the source is the battery.';
  } else if (!partsOk) {
    headline = filled === 0 ? 'The slots are empty.' : 'The loop still has a gap.';
    detail = 'Every slot needs a part, and the three parts are the battery, the switch, and the LED. Order does not matter.';
    coach = filled ? 'An empty slot is a cut wire. Current cannot jump it.' : '';
  } else if (!switchClosed) {
    tone = 'fail';
    headline = 'The switch is open.';
    detail = 'The parts are in the loop, and the door is still open. Current cannot cross an open switch.';
    coach = 'An open switch is a hole in the wire. Close it before you judge the lamp.';
    equation = 'I = 0 while the switch is open.';
  } else if (!ledForward) {
    tone = 'fail';
    headline = 'The LED is backwards.';
    detail = 'An LED is a diode. Current has to enter the anode, the wide side of the triangle, and leave at the bar. Flip it.';
    coach = 'Look at the triangle. Conventional current wants to go in the direction the triangle points, from anode to cathode.';
    equation = 'A backwards LED blocks the loop, so I = 0.';
  } else if (table.needed && table.blank) {
    headline = 'The lamp is ready. Finish the table.';
    detail = 'The loop would light. Mark what the lamp does for each row before Troy lets the boat go.';
    coach = 'Only one row should be lit: the switch closed, and the LED pointing forward.';
    equation = 'Closed switch, forward LED: current can make the round trip.';
  } else if (table.needed && table.wrong) {
    tone = 'fail';
    headline = 'A row in the table does not match the lamp.';
    detail = 'An open switch stays dark. A backwards LED stays dark. The lamp lights only when both are right.';
    coach = 'Cover the lamp with your hand and say each row out loud. Two of them are dark.';
    equation = 'Closed switch, forward LED: the only row that lights.';
  } else {
    tone = 'pass';
    headline = 'The lamp holds. Troy is behind you.';
    detail = 'The loop is closed, the switch is shut, and the LED points the only way it can light.';
    coach = '';
    equation = 'Battery, closed switch, forward LED. Current leaves the positive terminal and comes home.';
  }

  return pack(level, tune, flags, {
    tone,
    kicker: 'Loop',
    headline,
    detail,
    equation,
    coach,
    lamp: partsOk && switchClosed && ledForward ? 'lit' : 'off',
  });
}

function gradeOhms(level, state, tune) {
  const puzzle = level.puzzle;
  const ohms = Number(state.ohms);
  const known = (puzzle.choices || []).some((choice) => choice.ohms === ohms);
  const volts = puzzle.supplyVolts ?? 9;
  const ledVf = puzzle.ledVf ?? 2;
  const current = known ? ledCurrentMa({ volts, ledVf, ohms }) : 0;
  const lamp = known ? classifyLed(current) : 'off';
  const safe = lamp === 'lit';
  const predicted = Number(state.predictionMa);
  const predictionOk = !tune.requirePrediction
    || (known && Number.isFinite(predicted) && Math.abs(predicted - current) <= tune.predictionToleranceMa);
  const flags = { choice: known, safe, prediction: predictionOk };
  const equation = known
    ? `I = (${volts} V − ${ledVf} V) / ${formatSi(ohms, 'Ω')} = ${formatSi(current / 1000, 'A')}`
    : `I = (${volts} V − ${ledVf} V) / R`;
  const meter = known ? { label: 'LED current', value: formatSi(current / 1000, 'A') } : null;

  let tone = 'idle';
  let headline = 'Pick a resistor from the pouch.';
  let detail = `The supply is ${volts} V and the red LED keeps about ${ledVf} V. The resistor sees the rest. Too small burns the lamp. Too big leaves it dim.`;
  let coach = '';

  if (!known) {
    headline = 'The pouch is waiting.';
    detail = 'Choose one resistor. Then read the current. A small red LED wants roughly 5 to 20 mA, and it is in trouble above about 30 mA.';
  } else if (lamp === 'burnt') {
    tone = 'fail';
    headline = 'The LED burned out.';
    detail = `${formatSi(current / 1000, 'A')} is more than a small red LED can take. More ohms means less current.`;
    coach = 'Use the voltage left after the LED, not the whole battery, and remember that a smaller resistor lets more current through.';
  } else if (lamp === 'dim' || lamp === 'off') {
    tone = 'fail';
    headline = 'The lamp is only a faint coal.';
    detail = `${formatSi(current / 1000, 'A')} is under about 5 mA. The cave stays dark. Less resistance lets more current through.`;
    coach = 'Turn the target into amps before you divide. About 18 mA is 0.018 A. Resistance is 7 V divided by that current.';
  } else if (!predictionOk) {
    tone = 'fail';
    headline = 'The meter and your prediction disagree.';
    detail = `The lamp is in the working range at ${formatSi(current / 1000, 'A')}, but the cave also wants your predicted current within ${tune.predictionToleranceMa} mA of that meter.`;
    coach = 'Read I = V / R with V = 7 V, then set the slider next to the meter. The slider does not change the circuit.';
  } else {
    tone = 'pass';
    headline = 'The eye glows at a safe current.';
    detail = `${formatSi(current / 1000, 'A')} sits between 5 and 30 mA. The resistor is doing the job Ohm's law asked for.`;
    coach = '';
  }

  return pack(level, tune, flags, { tone, kicker: 'Current', headline, detail, equation, coach, meter, lamp });
}

function gradeSeries(level, state, tune) {
  const puzzle = level.puzzle;
  const topology = state.topology === 'series' || state.topology === 'parallel' ? state.topology : null;
  const ohms = topology ? equivalentOhms(puzzle.resistors, topology) : 0;
  const parallel = topology === 'parallel';
  const table = truthOf(level, state, tune);
  const flags = { topology: Boolean(topology), parallel, truth: table.ok };
  const equation = !topology
    ? 'Series: R = R1 + R2. Parallel: R = (R1 × R2) / (R1 + R2).'
    : topology === 'series'
      ? `R = ${formatSi(puzzle.resistors[0], 'Ω')} + ${formatSi(puzzle.resistors[1], 'Ω')} = ${formatSi(ohms, 'Ω')}`
      : `R = (${formatSi(puzzle.resistors[0], 'Ω')} × ${formatSi(puzzle.resistors[1], 'Ω')}) / (${formatSi(puzzle.resistors[0], 'Ω')} + ${formatSi(puzzle.resistors[1], 'Ω')}) = ${formatSi(ohms, 'Ω')}`;

  let tone = 'idle';
  let headline = 'How should the crew lanterns be wired?';
  let detail = 'Two 1 kΩ resistors can make 2 kΩ in series, or 500 Ω in parallel. The crew needs the wiring that stays lit if one lantern opens.';
  let coach = '';

  if (!topology) {
    headline = 'Choose series or parallel.';
    detail = 'Series is one path, so the same current visits both lanterns. Parallel is two paths, and both lanterns feel the battery.';
  } else if (!parallel) {
    tone = 'fail';
    headline = 'One path is not enough for the crew.';
    detail = `Series adds to ${formatSi(ohms, 'Ω')}. If either lantern opens, the only path opens, and the whole string goes dark.`;
    coach = 'The crew asked for lanterns that do not share a single fate. Two paths share the voltage. One path shares the current.';
  } else if (table.needed && table.blank) {
    headline = 'The lanterns are in parallel. Finish the table.';
    detail = `The pair is ${formatSi(ohms, 'Ω')}. Mark what the other lantern does when one of them opens.`;
    coach = 'Ask what happens to the second path if the first path is cut.';
  } else if (table.needed && table.wrong) {
    tone = 'fail';
    headline = 'The table does not match the wiring.';
    detail = 'In series, opening one lantern opens the only path. In parallel, the other branch is still tied across the battery.';
    coach = 'Put a finger on each branch. If you lift one lantern out of a parallel pair, the other branch is still a closed loop.';
  } else {
    tone = 'pass';
    headline = 'The crew keeps a light.';
    detail = `Parallel of two 1 kΩ resistors is ${formatSi(ohms, 'Ω')}. One lantern can go dark without taking the other with it.`;
    coach = '';
  }

  return pack(level, tune, flags, {
    tone,
    kicker: 'Resistance',
    headline,
    detail,
    equation,
    coach,
    meter: topology ? { label: 'Equivalent resistance', value: formatSi(ohms, 'Ω') } : null,
    lamp: topology ? 'lit' : 'off',
  });
}

function gradeRc(level, state, tune) {
  const puzzle = level.puzzle;
  const ohms = Number(state.ohms);
  const farads = Number(state.farads);
  const ready = ohms > 0 && farads > 0;
  const tau = ready ? timeConstant(ohms, farads) : 0;
  const target = tune.targetTau ?? puzzle.targetTau ?? 1;
  const tolerance = tune.tolerance ?? puzzle.tolerance ?? 0.05;
  const close = ready && Math.abs(tau - target) <= Math.abs(target) * tolerance;
  const flags = { parts: ready, tau: close };
  const volts = puzzle.supplyVolts ?? 9;
  const atTarget = ready ? volts * (1 - Math.exp(-target / tau)) : 0;
  const equation = ready
    ? `τ = ${formatSi(ohms, 'Ω')} × ${formatSi(farads, 'F')} = ${formatSi(tau, 's')}. At ${formatSi(target, 's')}, V = ${formatPlain(atTarget, 'V', 2)}.`
    : `τ = R × C. The winds asked for ${formatSi(target, 's')}.`;

  let tone = 'idle';
  let headline = 'Choose R and C.';
  let detail = `The sack should reach about 63% of ${volts} V in ${formatSi(target, 's')}. That time is one τ, and τ = R × C.`;
  let coach = '';

  if (!ready) {
    headline = 'The sack has no size yet.';
    detail = 'Set both the resistor and the capacitor. The curve stays flat until both are chosen.';
  } else if (tau + 1e-9 < target * (1 - tolerance)) {
    tone = 'fail';
    headline = 'The sack fills too quickly.';
    detail = `${formatSi(tau, 's')} is shorter than ${formatSi(target, 's')}. A larger resistor or a larger capacitor stretches the time.`;
    coach = 'τ is a product. If the curve hits 63% early, multiply a bigger R by C, or a bigger C by R.';
  } else if (!close) {
    tone = 'fail';
    headline = 'The sack is too slow for this wind.';
    detail = `${formatSi(tau, 's')} is longer than ${formatSi(target, 's')}. Shrink R or C until one time constant matches the mark.`;
    coach = 'Ohms times farads is seconds. If you are past the mark, one of the two parts is larger than this wind needs.';
  } else {
    tone = 'pass';
    headline = 'The sack opens on time.';
    detail = `τ = ${formatSi(tau, 's')}, inside the window around ${formatSi(target, 's')}. At one time constant the capacitor is about 63% charged.`;
    coach = '';
  }

  return pack(level, tune, flags, {
    tone,
    kicker: 'Time constant',
    headline,
    detail,
    equation,
    coach,
    meter: ready ? { label: 'τ', value: formatSi(tau, 's') } : null,
    wave: ready
      ? {
        kind: 'rc',
        volts,
        tau,
        target,
        yMax: volts,
        xMax: Math.max(tau, target) * 5,
      }
      : null,
  });
}

function gradeFlyback(level, state, tune) {
  const diode = ['none', 'forward', 'flyback'].includes(state.diode) ? state.diode : null;
  const direction = diode === 'flyback';
  const table = truthOf(level, state, tune);
  const flags = { choice: Boolean(diode), direction, truth: table.ok };

  let tone = 'idle';
  let headline = 'The coil has no second path yet.';
  let detail = 'Place a diode across the coil, or leave it bare. The safe diode waits while the switch is closed, then conducts when the switch opens.';
  let coach = '';
  let equation = 'Opening the switch forces di/dt. V = L di/dt spikes if the current has nowhere to go.';

  if (!diode) {
    headline = 'Choose what sits across the coil.';
  } else if (diode === 'none') {
    tone = 'fail';
    headline = 'The switch will see the spike.';
    detail = 'The coil will not stop its current just because the switch opened. With no second loop, the voltage jumps.';
    coach = 'The current needs a door that is shut while the switch is closed, and open the moment the switch opens.';
    equation = 'No diode: the opening switch interrupts I, so V = L di/dt spikes.';
  } else if (diode === 'forward') {
    tone = 'fail';
    headline = 'That diode fights the supply.';
    detail = 'The arrow conducts while the switch is still closed, so the diode is a short across the coil instead of a shelter for the spike.';
    coach = 'A flyback diode is reverse-biased during normal operation. The cathode points at the positive rail.';
    equation = 'Forward across the coil: the diode conducts as soon as the switch closes.';
  } else if (table.needed && table.blank) {
    headline = 'The diode is aimed. Finish the table.';
    detail = 'Match each placement to what happens when the switch opens.';
    coach = 'Three placements, three outcomes: a spike, a short while the switch is closed, or a safe loop.';
    equation = 'Flyback diode: reverse-biased while the switch is closed, then a path for the coil current.';
  } else if (table.needed && table.wrong) {
    tone = 'fail';
    headline = 'A row in the table does not match the coil.';
    detail = 'No diode means a spike. The conducting direction shorts the supply. The flyback direction conducts only after the switch opens.';
    coach = 'Say which way the diode arrow points while the switch is closed. If it already conducts, it is not waiting for the spike.';
  } else {
    tone = 'pass';
    headline = 'The whirlpool has a drain.';
    detail = 'The diode points at the positive rail. It stays off while the switch is closed, then gives the coil current a short safe loop.';
    coach = '';
    equation = 'Flyback diode, cathode toward the supply. The spike forward-biases it, and the switch survives.';
  }

  return pack(level, tune, flags, { tone, kicker: 'Flyback', headline, detail, equation, coach, lamp: direction ? 'lit' : 'off' });
}

function gradeAstable(level, state, tune) {
  const puzzle = level.puzzle;
  const r1 = Number(state.r1);
  const r2 = Number(state.r2);
  const farads = Number(state.farads);
  const ready = r1 > 0 && r2 > 0 && farads > 0;
  const hz = ready ? astableHz(r1, r2, farads) : 0;
  const times = ready ? astableTimes(r1, r2, farads) : { high: 0, low: 0, period: 0 };
  const min = puzzle.targetMinHz ?? 0.5;
  const max = puzzle.targetMaxHz ?? 2;
  const inBand = ready && hz >= min && hz <= max;
  const flags = { parts: ready, frequency: inBand };
  const equation = ready
    ? `f = 1.44 / ((${formatSi(r1, 'Ω')} + 2 × ${formatSi(r2, 'Ω')}) × ${formatSi(farads, 'F')}) = ${formatSi(hz, 'Hz')}`
    : `f = 1.44 / ((R1 + 2 R2) C), between ${min} Hz and ${max} Hz.`;

  let tone = 'idle';
  let headline = 'Choose R1, R2, and C.';
  let detail = `Ithaca wants a blink between ${min} Hz and ${max} Hz. The 555 sets that from R1, R2, and the capacitor.`;
  let coach = '';

  if (!ready) {
    headline = 'The beacon has no timing parts yet.';
  } else if (hz < min) {
    tone = 'fail';
    headline = 'The blink is too slow to find the coast.';
    detail = `${formatSi(hz, 'Hz')} is under ${min} Hz. A smaller capacitor, or a smaller R2, raises the frequency.`;
    coach = 'R2 is in both halves of the blink, and it is doubled in the formula. Shrinking R2 or C shortens the period.';
  } else if (hz > max) {
    tone = 'fail';
    headline = 'The beacon flickers too fast to read.';
    detail = `${formatSi(hz, 'Hz')} is above ${max} Hz. Growing R2 or C slows the blink.`;
    coach = 'The period is (R1 + 2 R2) C, up to the 1.44 factor. More resistance or more capacitance means a slower light.';
  } else {
    tone = 'pass';
    headline = 'The lighthouse keeps its watch.';
    detail = `${formatSi(hz, 'Hz')} sits between ${min} and ${max} Hz. Home is a blinking coast.`;
    coach = '';
  }

  return pack(level, tune, flags, {
    tone,
    kicker: 'Frequency',
    headline,
    detail,
    equation,
    coach,
    meter: ready ? { label: 'Blink rate', value: formatSi(hz, 'Hz') } : null,
    lamp: inBand ? 'lit' : ready ? 'dim' : 'off',
    wave: ready
      ? {
        kind: 'astable',
        volts: puzzle.supplyVolts ?? 9,
        high: times.high,
        low: times.low,
        period: times.period,
        hz,
      }
      : null,
  });
}

function truthOf(level, state, tune) {
  const table = level.puzzle?.truth;
  const needed = Boolean(tune.requireTruth && table?.rows?.length);
  if (!needed) return { needed: false, ok: true, blank: false, wrong: false };
  let blank = false;
  let wrong = false;
  table.rows.forEach((row, index) => {
    const picked = state.truth?.[index] ?? state.truth?.[String(index)];
    if (!picked) blank = true;
    else if (picked !== row.answer) wrong = true;
  });
  return { needed, ok: !blank && !wrong, blank, wrong };
}

function pack(level, tune, flags, fields) {
  const list = objectives(level, flags, tune);
  const complete = list.length > 0 && list.every((item) => item.done);
  return {
    complete,
    tone: complete ? 'pass' : fields.tone,
    kicker: fields.kicker,
    headline: complete && fields.tone === 'pass' ? fields.headline : fields.headline,
    detail: fields.detail,
    equation: fields.equation,
    coach: complete ? '' : fields.coach,
    meter: fields.meter || null,
    lamp: fields.lamp || 'off',
    wave: fields.wave || null,
    objectives: list,
  };
}

function objectives(level, flags, tune) {
  return (level.objectives || [])
    .filter((item) => {
      if (!item || typeof item.text !== 'string') return false;
      if (item.when === 'truth') return Boolean(tune.requireTruth && level.puzzle?.truth);
      if (item.when === 'prediction') return Boolean(tune.requirePrediction);
      return true;
    })
    .map((item) => ({
      id: item.id,
      text: item.text,
      done: Boolean(flags[item.id]),
    }));
}

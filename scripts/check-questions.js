/**
 * Checks the Level 1 question pools: the authored bank, the hatch, the gate,
 * and both battle generators. Run: node scripts/check-questions.js
 *
 * - Every question has 4 different choices and a valid right answer.
 * - The right answer moves around (it used to always be the first choice).
 * - The right answer is not always the smallest number.
 * - Generated answers are recomputed from the numbers in the prompt.
 *
 * questions.json is imported the Vite way, so this loads modules through Vite.
 */

import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const bank = await vite.ssrLoadModule('/src/learn/encounters/questions.js');
  const hatch = await vite.ssrLoadModule('/src/game/hatchQuestions.js');
  const battle = await vite.ssrLoadModule('/src/game/battleQuestions.js');

  let seed = 7;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const answerOf = (q) => (Number.isInteger(q.answer) ? q.answer : q.answerIndex);
  function wellFormed(q, where) {
    assert.ok(q && typeof q.prompt === 'string' && q.prompt.trim(), `${where}: prompt`);
    assert.equal(q.choices.length, 4, `${where}: 4 choices in ${q.id}`);
    assert.equal(new Set(q.choices).size, 4, `${where}: duplicate choice in ${q.id}: ${q.choices}`);
    for (const c of q.choices) assert.ok(!/NaN|Infinity|undefined|null/.test(c), `${where}: bad label ${c}`);
    const a = answerOf(q);
    assert.ok(Number.isInteger(a) && a >= 0 && a < 4, `${where}: answer index in ${q.id}`);
  }
  const value = (label) => {
    const m = String(label).match(/^(-?[\d.]+)\s*(k?)/);
    return m ? Number(m[1]) * (m[2] ? 1000 : 1) : NaN;
  };

  // ---- Circuits: shape, and the answer solved from the drawing alone ----
  const si = (label) => {
    const m = String(label).match(/(-?[\d.]+)\s*(k|m|µ)?\s*(Ω|V|A|F|H|C|J|s)(?![a-zA-Z])/);
    if (!m) return NaN;
    return Number(m[1]) * ({ k: 1000, m: 0.001, µ: 0.000001 }[m[2]] || 1);
  };
  function checkCircuitShape(c, where) {
    assert.ok(c.layout === 'series' || c.layout === 'parallel', `${where}: layout`);
    assert.ok(Array.isArray(c.parts) && c.parts.length >= 1 && c.parts.length <= 3, `${where}: 1-3 parts`);
    if (c.layout === 'parallel') assert.equal(c.parts.length, 2, `${where}: parallel has two branches`);
    for (const part of c.parts) {
      assert.ok(['resistor', 'diode', 'led', 'capacitor', 'inductor'].includes(part.kind), `${where}: only sources, resistors, diodes, LEDs, capacitors and inductors (${part.kind})`);
      if (c.layout === 'parallel') assert.equal(part.kind, 'resistor', `${where}: parallel branches are resistors`);
    }
    if (c.ask) {
      assert.ok(['current', 'voltage', 'resistance'].includes(c.ask.type), `${where}: ask type`);
      if (c.ask.type !== 'current') {
        const part = c.parts[c.ask.part];
        assert.ok(part, `${where}: ask points at a real part`);
        if (c.ask.type === 'resistance') assert.equal(part.kind, 'resistor', `${where}: unknown R is on a resistor`);
      }
    }
  }
  // Solve the drawn circuit for whatever is marked unknown. SI units.
  function solve(c) {
    const V = si(c.source);
    if (c.layout === 'parallel') {
      const rs = c.parts.map((part) => si(part.label));
      if (c.ask.branch != null) return V / rs[c.ask.branch];
      return rs.reduce((sum, r) => sum + V / r, 0);
    }
    // Capacitors and inductors in a DC loop, at the moment the drawing says.
    // Just after switch-on: an empty capacitor is a wire, an inductor passes
    // nothing yet. Long after: a full capacitor passes nothing, an inductor
    // is a wire. A part that passes nothing takes the voltage that is left.
    const reactive = c.parts.map((part) => part.kind === 'capacitor' || part.kind === 'inductor');
    if (reactive.some(Boolean)) {
      const blocks = c.parts.some((part) => (part.kind === 'capacitor' && c.moment === 'settled') || (part.kind === 'inductor' && c.moment === 'start'));
      const diodeDrop = c.parts.filter((part) => part.kind === 'diode' || part.kind === 'led').reduce((sum, part) => sum + si(part.label), 0);
      const rTotal = c.parts.filter((part) => part.kind === 'resistor').reduce((sum, part) => sum + si(part.label), 0);
      const current = blocks ? 0 : (V - diodeDrop) / rTotal;
      if (c.ask.type === 'current') return current;
      if (c.ask.type === 'voltage') {
        const part = c.parts[c.ask.part];
        if (part.kind === 'resistor') return current * si(part.label);
        const thisBlocks = (part.kind === 'capacitor' && c.moment === 'settled') || (part.kind === 'inductor' && c.moment === 'start');
        return thisBlocks ? V - diodeDrop : 0;
      }
    }
    const drops = c.parts.filter((part) => part.kind !== 'resistor');
    if (drops.some((part) => part.reversed)) return 0;
    const drop = drops.reduce((sum, part) => sum + si(part.label), 0);
    // Labeled resistors other than the asked one; an unlabeled one counts as unknown.
    const others = c.parts
      .map((part, i) => (part.kind === 'resistor' && i !== c.ask.part ? si(part.label) : 0))
      .map((r) => (Number.isFinite(r) ? r : 0));
    const otherR = others.reduce((a, b) => a + b, 0);
    const asked = c.ask.part != null ? si(c.parts[c.ask.part].label) : NaN;
    const known = c.current ? si(c.current) : NaN;
    const totalR = otherR + (Number.isFinite(asked) ? asked : 0);
    const current = Number.isFinite(known) ? known : (V - drop) / totalR;
    if (c.ask.type === 'current') return current;
    if (c.ask.type === 'voltage') {
      if (Number.isFinite(asked)) return current * asked;
      // The only unknown is this resistor: it takes what the rest leaves.
      return V - drop - (otherR ? otherR * current : 0);
    }
    return (V - drop - otherR * current) / current;
  }
  let circuitsSolved = 0;
  function checkCircuit(q, where) {
    if (!q.circuit) return;
    checkCircuitShape(q.circuit, `${where} ${q.id}`);
    if (!q.circuit.ask) return;
    const want = solve(q.circuit);
    const got = si(q.choices[answerOf(q)]);
    assert.ok(Number.isFinite(want) && Number.isFinite(got), `${where} ${q.id}: cannot read ${q.choices[answerOf(q)]} or solve the drawing`);
    assert.ok(Math.abs(got - want) <= Math.max(1e-9, Math.abs(want) * 0.02), `${where} ${q.id}: drawing solves to ${want}, marked answer is ${got} (${q.prompt})`);
    // A drawn question keeps its prompt short; the drawing carries the numbers.
    assert.ok(q.prompt.length <= 90, `${where} ${q.id}: prompt should be short with a drawing`);
    circuitsSolved += 1;
  }

  // ---- Authored bank ----
  const level1 = bank.questionsForLevel(1);
  assert.ok(level1.length >= 40, `Level 1 bank has ${level1.length} questions`);
  const ids = new Set();
  for (const q of level1) {
    wellFormed(q, 'bank');
    assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
    ids.add(q.id);
    assert.ok(q.difficulty === 'easy' || q.difficulty === 'hard', `${q.id} needs a difficulty`);
    assert.ok(q.explanation && q.explanation.length > 20, `${q.id} needs an explanation`);
    // The right answer must not give itself away by being much the longest.
    const right = q.choices[q.answerIndex];
    const longestWrong = Math.max(...q.choices.filter((c) => c !== right).map((c) => c.length));
    assert.ok(right.length <= longestWrong * 1.5, `${q.id}: the right answer is much longer than the rest`);
  }
  for (const q of level1) checkCircuit(q, 'bank');
  const drawnBank = level1.filter((q) => q.circuit).length;
  assert.ok(drawnBank >= 8 && drawnBank <= level1.length / 2, `some, not all, written questions have a drawing (${drawnBank}/${level1.length})`);
  const hardCount = level1.filter((q) => q.difficulty === 'hard').length;
  assert.ok(hardCount >= 12, `only ${hardCount} hard authored questions`);

  // ---- Serving shuffles the answer position ----
  const slots = [0, 0, 0, 0];
  for (let i = 0; i < 400; i += 1) {
    const q = bank.shuffleChoices(level1[i % level1.length], rng);
    slots[answerOf(q)] += 1;
    assert.equal(q.choices[answerOf(q)], level1[i % level1.length].choices[level1[i % level1.length].answerIndex]);
  }
  for (const n of slots) assert.ok(n > 60, `answer slots are lopsided: ${slots}`);

  // ---- Hatch ----
  const hatchSlots = new Set();
  let h = hatch.firstHatchQuestion();
  for (let i = 0; i < 60; i += 1) {
    wellFormed(h, 'hatch');
    checkCircuit(h, 'hatch');
    hatchSlots.add(answerOf(h));
    h = hatch.hatchQuestionAfter(h.id);
  }
  assert.ok(hatchSlots.size >= 3, 'hatch answers always sit in the same slot');

  // ---- Easy generator: recompute from the prompt ----
  let notSmallest = 0;
  let easyDrawn = 0;
  for (let i = 0; i < 3000; i += 1) {
    const q = bank.generateOhmsQuestion(rng, 1);
    wellFormed(q, 'easy generator');
    if (q.circuit) {
      easyDrawn += 1;
      checkCircuit(q, 'easy generator');
      continue;
    }
    const nums = q.prompt.match(/\d+(\.\d+)?/g).map(Number);
    // Units match the prompt (V with kΩ and mA, or V with Ω and A), so compare bare numbers.
    const bare = (label) => parseFloat(label);
    const right = bare(q.choices[q.answerIndex]);
    if (/What current flows/.test(q.prompt)) assert.equal(right, nums[0] / nums[1], q.prompt);
    else if (/voltage across/.test(q.prompt)) assert.equal(right, nums[0] * nums[1], q.prompt);
    else assert.equal(right, nums[1] / nums[0], q.prompt);
    const all = q.choices.map(bare);
    if (right !== Math.min(...all)) notSmallest += 1;
  }
  assert.ok(notSmallest > 450, `easy answers are nearly always the smallest choice (${notSmallest} text-only not)`);
  assert.ok(easyDrawn > 900 && easyDrawn < 2100, `about half the easy rolls are drawn (${easyDrawn}/3000)`);

  // ---- Battle decks, including the hard generator ----
  const decks = battle.createBattleQuestions(rng);
  const hardSlots = [0, 0, 0, 0];
  for (let i = 0; i < 3000; i += 1) {
    const q = decks.next(i % 2 ? 'hard' : 'easy');
    wellFormed(q, 'battle');
    if (i % 2) hardSlots[answerOf(q)] += 1;
    if (q.circuit) {
      checkCircuit(q, 'battle');
      continue;
    }
    const right = q.choices[answerOf(q)];
    const n = q.prompt.match(/\d+(\.\d+)?/g)?.map(Number) || [];
    if (q.id.startsWith('ohm-hard-series')) assert.equal(value(right), n[0] / (n[1] + n[2]), q.prompt);
    if (q.id.startsWith('ohm-hard-parallel')) assert.equal(value(right), (n[0] / n[1]) * 2, q.prompt);
    if (q.id.startsWith('ohm-hard-power')) assert.equal(value(right), n[1] * n[0] * n[1], q.prompt);
    if (q.id.startsWith('ohm-hard-led-current')) {
      const [battery, led] = n;
      const ohms = value(q.prompt.match(/([\d.]+ k?Ω)/)[1]);
      assert.equal(value(right), Math.round(((battery - led) / ohms) * 1000), q.prompt);
    }
    if (q.id.startsWith('ohm-hard-led-pick')) {
      const [ma, led, battery] = n;
      assert.equal(value(right), Math.round((battery - led) / (ma / 1000)), q.prompt);
    }
  }
  for (const k of hardSlots) assert.ok(k > 200, `hard answer slots are lopsided: ${hardSlots}`);

  // ---- Gate ----
  const gateSlots = new Set();
  for (let i = 0; i < 80; i += 1) {
    const q = battle.nextGateQuestion(rng);
    wellFormed(q, 'gate');
    checkCircuit(q, 'gate');
    gateSlots.add(q.answer);
  }
  assert.equal(gateSlots.size, 4, 'gate answers do not move');

  // ---- Ithaca: the hall-door pool (capacitors and inductors) ----
  const hall = await vite.ssrLoadModule('/src/game/level2/hallQuestions.js');
  const hallIds = new Set();
  for (const raw of hall.HALL_QUESTIONS) {
    assert.ok(!hallIds.has(raw.id), `hall: duplicate id ${raw.id}`);
    hallIds.add(raw.id);
    const q = { ...raw };
    wellFormed(q, 'hall');
    assert.ok(q.hint && q.hint.length > 20, `hall ${q.id}: needs a hint`);
    assert.ok(q.prompt.length <= 110, `hall ${q.id}: keep the prompt short`);
    if (q.circuit && q.circuit.ask && !q.circuit.moment && q.circuit.parts.some((part) => part.kind === 'capacitor' || part.kind === 'inductor')) {
      assert.fail(`hall ${q.id}: a capacitor or inductor question with an unknown needs a moment (start or settled)`);
    }
    checkCircuit(q, 'hall');
  }
  const topical = hall.HALL_QUESTIONS.filter((q) => /capacit|inductor|coil|µF|mH|τ/.test(`${q.prompt} ${q.hint} ${JSON.stringify(q.circuit || {})}`)).length;
  assert.ok(topical >= hall.HALL_QUESTIONS.length * 0.75, `hall pool should be mostly capacitors and inductors (${topical}/${hall.HALL_QUESTIONS.length})`);
  const hallSlots = new Set();
  let hq = hall.firstHallQuestion(rng);
  for (let i = 0; i < 80; i += 1) {
    wellFormed(hq, 'hall serve');
    hallSlots.add(answerOf(hq));
    hq = hall.hallQuestionAfter(hq.id, rng);
  }
  assert.ok(hallSlots.size >= 3, 'hall answers always sit in the same slot');

  console.log(`Question checks passed: ${level1.length} authored (${hardCount} hard, ${drawnBank} drawn), generators verified on 6,000 rolls, ${circuitsSolved} drawings solved, ${hall.HALL_QUESTIONS.length} hall questions.`);
} finally {
  await vite.close();
}

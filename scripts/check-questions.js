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
    hatchSlots.add(answerOf(h));
    h = hatch.hatchQuestionAfter(h.id);
  }
  assert.ok(hatchSlots.size >= 3, 'hatch answers always sit in the same slot');

  // ---- Easy generator: recompute from the prompt ----
  let notSmallest = 0;
  for (let i = 0; i < 3000; i += 1) {
    const q = bank.generateOhmsQuestion(rng, 1);
    wellFormed(q, 'easy generator');
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
  assert.ok(notSmallest > 900, `easy answers are nearly always the smallest choice (${notSmallest}/3000 not)`);

  // ---- Battle decks, including the hard generator ----
  const decks = battle.createBattleQuestions(rng);
  const hardSlots = [0, 0, 0, 0];
  for (let i = 0; i < 3000; i += 1) {
    const q = decks.next(i % 2 ? 'hard' : 'easy');
    wellFormed(q, 'battle');
    if (i % 2) hardSlots[answerOf(q)] += 1;
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
    gateSlots.add(q.answer);
  }
  assert.equal(gateSlots.size, 4, 'gate answers do not move');

  console.log(`Question checks passed: ${level1.length} authored (${hardCount} hard), generators verified on 6,000 rolls.`);
} finally {
  await vite.close();
}

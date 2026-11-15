/**
 * Checks the hint helper without a real Gemini key.
 * The key must stay in the request header and out of the URL.
 */

import assert from 'node:assert/strict';
import { LIMITS, createAthenaReply } from '../api/athenaLogic.js';
import { RATE_LIMITS, checkRate } from '../api/rateLimit.js';

const sample = {
  levelId: 1,
  title: 'Leaving Troy',
  concept: 'Closed loop',
  goal: 'Light the LED safely.',
  athenaNote: 'Do not give the ohm value.',
  circuit: { slots: [] },
  feedback: 'The beach is dark.',
  attempt: 1,
};

const missing = await createAthenaReply({ body: sample, apiKey: '' });
assert.equal(missing.fallback, true);
assert.equal(missing.reason, 'no_key');
assert.equal(missing.hint, undefined);

let seenUrl = '';
const ok = await createAthenaReply({
  body: sample,
  apiKey: 'test-key-should-not-leak',
  model: 'gemini-3.5-flash-lite',
  fetchImpl: async (url, options) => {
    seenUrl = url;
    assert.equal(options.headers['x-goog-api-key'], 'test-key-should-not-leak');
    assert.equal(options.method, 'POST');
    const payload = JSON.parse(options.body);
    assert.ok(payload.contents[0].parts[0].text.includes('Leaving Troy'));
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { thought: true, text: 'hidden reasoning the player must not see' },
                { text: 'Count the empty slots. A gap means the current is zero.' },
              ],
            },
          },
        ],
      }),
    };
  },
});

assert.equal(ok.source, 'gemini');
assert.equal(ok.hint, 'Count the empty slots. A gap means the current is zero.');
assert.ok(!seenUrl.includes('test-key-should-not-leak'));
assert.ok(seenUrl.includes('gemini-3.5-flash-lite'));

const down = await createAthenaReply({
  body: sample,
  apiKey: 'test-key',
  fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({}) }),
});
assert.equal(down.fallback, true);
assert.equal(down.reason, 'upstream');

const canned = await createAthenaReply({
  body: { ...sample, cannedHints: ['Count the gaps.', 'Close the switch.'] },
  apiKey: '',
});
assert.equal(canned.source, 'canned');
assert.equal(canned.reason, 'no_key');
assert.equal(canned.hint, 'Count the gaps.');

const cannedLater = await createAthenaReply({
  body: { ...sample, attempt: 2, cannedHints: ['Count the gaps.', 'Close the switch.'] },
  apiKey: '',
});
assert.equal(cannedLater.hint, 'Close the switch.');

// ---- Chat mode (the Ask Athena menu) ----
const chatBody = {
  mode: 'chat',
  question: 'Why does an LED need a resistor?',
  place: 'Level 1 · Troy',
  title: 'Leaving Troy',
  concept: 'Closed loop',
  athenaNote: 'Do not name the winning part.',
  cannedHints: ['Current only moves in a closed loop.', 'A red LED keeps about 2 V. The resistor gets the rest.'],
  history: [
    { role: 'athena', text: 'stray opening line from Athena is dropped' },
    { role: 'you', text: 'What is current?' },
    { role: 'athena', text: 'Current is the flow of charge.' },
    { role: 'you', text: 'unanswered line is dropped' },
  ],
};

const chatOffline = await createAthenaReply({ body: chatBody, apiKey: '' });
assert.equal(chatOffline.source, 'canned');
assert.equal(chatOffline.reason, 'no_key');
assert.equal(chatOffline.hint, 'A red LED keeps about 2 V. The resistor gets the rest.', 'offline picks the closest note');

const chatNoMatch = await createAthenaReply({ body: { ...chatBody, question: 'zzzz qqqq', cannedHints: [] }, apiKey: '' });
assert.match(chatNoMatch.hint, /island notes/);

let chatPayload = null;
const chatOk = await createAthenaReply({
  body: { ...chatBody, question: 'x'.repeat(5000) },
  apiKey: 'chat-key',
  fetchImpl: async (url, options) => {
    assert.ok(!url.includes('chat-key'));
    assert.equal(options.headers['x-goog-api-key'], 'chat-key');
    chatPayload = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'An LED takes only what it needs.' }] } }] }) };
  },
});
assert.equal(chatOk.source, 'gemini');
assert.equal(chatOk.hint, 'An LED takes only what it needs.');
const roles = chatPayload.contents.map((c) => c.role);
assert.deepEqual(roles, ['user', 'model', 'user'], 'history alternates and starts with the user');
assert.match(chatPayload.systemInstruction.parts[0].text, /Athena/);
const last = chatPayload.contents.at(-1).parts[0].text;
assert.ok(last.length < LIMITS.question + 1200, 'question is clipped');

// A retired model name (404) falls back to the backup model once.
const tried = [];
const fallback = await createAthenaReply({
  body: chatBody,
  apiKey: 'k',
  model: 'gemini-old-name',
  fetchImpl: async (url) => {
    tried.push(url);
    if (url.includes('gemini-old-name')) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Backup speaks.' }] } }] }) };
  },
});
assert.equal(tried.length, 2);
assert.equal(fallback.hint, 'Backup speaks.');

// Gemini down in chat: still answers from the notes, never throws.
const chatDown = await createAthenaReply({
  body: chatBody,
  apiKey: 'k',
  fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) }),
});
assert.equal(chatDown.source, 'canned');
assert.equal(chatDown.reason, 'upstream');

// Rate limit: a burst from one visitor is cut off, another visitor is not.
const t0 = 1_000_000;
for (let i = 0; i < RATE_LIMITS.PER_MINUTE; i += 1) assert.equal(checkRate('1.2.3.4', t0 + i).ok, true);
assert.equal(checkRate('1.2.3.4', t0 + 100).ok, false);
assert.equal(checkRate('5.6.7.8', t0 + 100).ok, true);
assert.equal(checkRate('1.2.3.4', t0 + 61_000).ok, true, 'the minute window resets');

console.log('Athena checks passed.');

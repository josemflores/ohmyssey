/**
 * Checks the hint helper without a real Gemini key.
 * The key must stay in the request header and out of the URL.
 */

import assert from 'node:assert/strict';
import { createAthenaReply } from '../api/athenaLogic.js';

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

console.log('Athena checks passed.');

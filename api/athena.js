/**
 * Vercel serves this file at POST /api/athena.
 *
 * GEMINI_API_KEY is read here, on the server. The browser only sends the
 * question, a few earlier lines of the chat, and public lesson text.
 * Local `npm run dev` does not execute this file. The Vite plugin in
 * vite.config.js calls api/athenaLogic.js with the same rules.
 */

import { createAthenaReply } from './athenaLogic.js';
import { checkRate, visitorId } from './rateLimit.js';

const MAX_BODY_BYTES = 20_000;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (raw.length > MAX_BODY_BYTES) {
    res.status(413).json({ error: 'Too long' });
    return;
  }

  const rate = checkRate(visitorId(req));
  if (!rate.ok) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    res.status(429).json({
      hint: 'Rest a moment, traveler. Even a goddess needs a breath between questions.',
      source: 'canned',
      reason: 'rate_limited',
    });
    return;
  }

  const body = readJsonBody(req);
  const result = await createAthenaReply({
    body,
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || '',
  });
  res.status(200).json(result);
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

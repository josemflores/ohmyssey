/**
 * Vercel serves this file at POST /api/athena.
 *
 * GEMINI_API_KEY is read here, on the server. The browser only sends the
 * level id, the public lesson text, and the parts currently in the slots.
 * Local `npm run dev` does not execute this file. The Vite plugin in
 * vite.config.js calls api/athenaLogic.js with the same rules.
 */

import { createAthenaReply } from './athenaLogic.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
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

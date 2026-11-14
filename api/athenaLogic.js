/**
 * Athena's one job: turn the player's board into a short Socratic hint.
 *
 * Both the Vercel function (api/athena.js) and the local Vite dev server
 * call this file, so the prompt lives in one place.
 *
 * The Gemini API key stays on the server. Callers pass it in. This file
 * never reads import.meta.env, and it never puts the key in the URL.
 * If the key is missing or Gemini fails, we return { fallback: true }
 * and the browser uses the hints written on the level.
 */

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

const SYSTEM_PROMPT = `You are Athena, goddess of wisdom, teaching a beginner electronics through the voyage of Odysseus. The game is called Ohmyssey.

Rules for every reply:
- Write 2 or 3 short sentences, then stop.
- Be Socratic. Point at the idea they should use, and ask them to look again. Do not hand over the finished parts list or the exact winning resistor value.
- Use plain words. You may name Ohm's law, volts, milliamps, and ohms.
- Stay on this level. Do not bring in later islands.
- No slang, no emoji, no bullet list, no heading.`;

export async function createAthenaReply({ body, apiKey, model, fetchImpl = fetch }) {
  if (!apiKey) {
    return { fallback: true, reason: 'no_key' };
  }

  try {
    const hint = await requestHint({
      apiKey,
      model: model || DEFAULT_MODEL,
      body: body && typeof body === 'object' ? body : {},
      fetchImpl,
    });
    if (!hint) return { fallback: true, reason: 'empty' };
    return { hint, source: 'gemini' };
  } catch (error) {
    console.error('Athena could not reach Gemini:', error instanceof Error ? error.message : 'unknown error');
    return { fallback: true, reason: 'upstream' };
  }
}

async function requestHint({ apiKey, model, body, fetchImpl }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Header, not query string, so a log of the URL cannot leak the key.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: buildUserPrompt(body) }] }],
      generationConfig: {
        maxOutputTokens: 512,
        // Flash-Lite accepts thinkingLevel. If you change GEMINI_MODEL and
        // the call starts failing, delete this thinkingConfig block.
        thinkingConfig: { thinkingLevel: 'MINIMAL' },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini responded with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((part) => part && !part.thought && typeof part.text === 'string')
    .map((part) => part.text)
    .join(' ')
    .trim();
  return shorten(text);
}

function buildUserPrompt(body) {
  const attempt = Number(body.attempt) || 1;
  return [
    `Level ${body.levelId ?? '?'}: ${body.title || 'Unknown island'}`,
    `Concept: ${body.concept || ''}`,
    `Goal: ${body.goal || ''}`,
    `Tutor note, do not read this aloud: ${body.athenaNote || ''}`,
    `Player's circuit: ${JSON.stringify(body.circuit || {})}`,
    `Feedback already on the player's screen: ${body.feedback || ''}`,
    `This is hint request number ${attempt}. If it is past 1, take a different angle than a first hint would.`,
    'Give one hint now.',
  ].join('\n');
}

function shorten(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= 500) return clean;
  const slice = clean.slice(0, 500);
  const period = slice.lastIndexOf('.');
  if (period > 80) return slice.slice(0, period + 1);
  return `${slice.trim()}…`;
}

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
// Tried once if the chosen model answers 404 (renamed or retired).
const BACKUP_MODEL = 'gemini-3.1-flash-lite';

// Caps on what a browser can send, so one request cannot run up the bill.
export const LIMITS = {
  question: 500,
  historyTurns: 8,
  historyChars: 600,
};

const SYSTEM_PROMPT = `You are Athena, goddess of wisdom, teaching a beginner electronics through the voyage of Odysseus. The game is called Ohmyssey.

Rules for every reply:
- Write 2 or 3 short sentences, then stop.
- Be Socratic. Point at the idea they should use, and ask them to look again. Do not hand over the finished parts list or the exact winning resistor value.
- Use plain words. You may name Ohm's law, volts, milliamps, and ohms.
- Stay on this level. Do not bring in later islands.
- No slang, no emoji, no bullet list, no heading.`;

// The open "Ask Athena" menu: a conversation, not a single board hint.
const CHAT_PROMPT = `You are Athena, goddess of wisdom, the guide in Ohmyssey, a game where Odysseus sails home from Troy to Ithaca and learns electronics on the way. The player is a beginner, often a student.

How to answer:
- Answer what they asked, in 2 to 4 short sentences. Plain words. Speak as Athena, warm and calm, never stiff.
- Teach electronics freely: voltage, current, resistance, Ohm's law, LEDs, series and parallel, capacitors, the 555 timer. Use a small worked number when it helps.
- If they ask for the answer to a game puzzle (which part, which value), do not hand it over. Give the idea or the formula and ask them to try it, then offer to check their thinking.
- If they ask about the game, the story, or the controls, help: WASD to walk, Shift to run, E to use things, H for Athena, L for lessons, Esc for the menu.
- If they ask about something far from the voyage or electronics, say kindly that you guide this voyage and bring them back.
- Never ask for or repeat personal details. No emoji, no bullet lists, no headings.`;

export async function createAthenaReply({ body, apiKey, model, fetchImpl = fetch }) {
  const safeBody = body && typeof body === 'object' ? body : {};
  if (safeBody.mode === 'chat') return createChatReply({ body: safeBody, apiKey, model, fetchImpl });
  const canned = pickCanned(safeBody);

  if (!apiKey) {
    if (canned) return { hint: canned, source: 'canned', reason: 'no_key' };
    return { fallback: true, reason: 'no_key' };
  }

  try {
    const hint = await requestHint({
      apiKey,
      model: model || DEFAULT_MODEL,
      body: safeBody,
      fetchImpl,
    });
    if (!hint) {
      if (canned) return { hint: canned, source: 'canned', reason: 'empty' };
      return { fallback: true, reason: 'empty' };
    }
    return { hint, source: 'gemini' };
  } catch (error) {
    console.error('Athena could not reach Gemini:', error instanceof Error ? error.message : 'unknown error');
    if (canned) return { hint: canned, source: 'canned', reason: 'upstream' };
    return { fallback: true, reason: 'upstream' };
  }
}

function pickCanned(body) {
  const lines = Array.isArray(body.cannedHints)
    ? body.cannedHints.map((line) => (typeof line === 'string' ? line.trim() : '')).filter(Boolean)
    : [];
  if (lines.length === 0) return '';
  const attempt = Math.max(1, Number(body.attempt) || 1);
  return lines[(attempt - 1) % lines.length];
}

async function requestHint({ apiKey, model, body, fetchImpl }) {
  return callGemini({
    apiKey,
    model,
    fetchImpl,
    system: SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(body) }] }],
  });
}

// One call to Gemini. The key goes in a header, never in the URL, so a log
// of the URL cannot leak it. A 404 means the model name is wrong or retired;
// the backup model gets one try.
async function callGemini({ apiKey, model, fetchImpl, system, contents }) {
  let response = await postGenerate({ apiKey, model, fetchImpl, system, contents });
  if (response.status === 404 && model !== BACKUP_MODEL) {
    response = await postGenerate({ apiKey, model: BACKUP_MODEL, fetchImpl, system, contents });
  }
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

function postGenerate({ apiKey, model, fetchImpl, system, contents }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  return fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        maxOutputTokens: 512,
        // Flash-Lite accepts thinkingLevel. If you change GEMINI_MODEL and
        // the call starts failing, delete this thinkingConfig block.
        thinkingConfig: { thinkingLevel: 'MINIMAL' },
      },
    }),
  });
}

// ---- Chat (the Ask Athena menu) -------------------------------------------

async function createChatReply({ body, apiKey, model, fetchImpl }) {
  const question = clip(body.question, LIMITS.question);
  if (!question) return { hint: 'Ask me anything about the voyage or its circuits.', source: 'canned', reason: 'empty_question' };

  if (!apiKey) return { hint: offlineAnswer(body, question), source: 'canned', reason: 'no_key' };

  try {
    const hint = await callGemini({
      apiKey,
      model: model || DEFAULT_MODEL,
      fetchImpl,
      system: CHAT_PROMPT,
      contents: buildChatContents(body, question),
    });
    if (!hint) return { hint: offlineAnswer(body, question), source: 'canned', reason: 'empty' };
    return { hint, source: 'gemini' };
  } catch (error) {
    console.error('Athena could not reach Gemini:', error instanceof Error ? error.message : 'unknown error');
    return { hint: offlineAnswer(body, question), source: 'canned', reason: 'upstream' };
  }
}

// Earlier turns, newest last, trimmed. Gemini needs the roles to alternate
// and to start with the user, so stray turns are dropped.
function buildChatContents(body, question) {
  const context = [
    `Where the player is: ${clip(body.place, 120) || 'the voyage'}.`,
    body.title ? `Lesson in focus: ${clip(body.title, 120)}. ${clip(body.concept, 300)}` : '',
    body.athenaNote ? `Tutor note, do not read this aloud: ${clip(body.athenaNote, 600)}` : '',
  ].filter(Boolean).join('\n');

  const history = Array.isArray(body.history) ? body.history.slice(-LIMITS.historyTurns) : [];
  const turns = [];
  for (const turn of history) {
    const role = turn?.role === 'athena' ? 'model' : turn?.role === 'you' ? 'user' : '';
    const text = clip(turn?.text, LIMITS.historyChars);
    if (!role || !text) continue;
    if (turns.length === 0 && role !== 'user') continue;
    if (turns.length && turns[turns.length - 1].role === role) continue;
    turns.push({ role, parts: [{ text }] });
  }
  if (turns.length && turns[turns.length - 1].role === 'user') turns.pop();

  return [
    ...turns,
    { role: 'user', parts: [{ text: `${context}\n\nThe player asks: ${question}` }] },
  ];
}

// Without a key Athena still says something useful: the closest line from
// the island notes, else a short note that she is offline.
function offlineAnswer(body, question) {
  const hints = Array.isArray(body.cannedHints)
    ? body.cannedHints.map((line) => clip(line, 400)).filter(Boolean)
    : [];
  const words = question.toLowerCase().match(/[a-z]{4,}/g) || [];
  let best = '';
  let bestScore = 0;
  for (const line of hints) {
    const lower = line.toLowerCase();
    const score = words.reduce((n, word) => n + (lower.includes(word) ? 1 : 0), 0);
    if (score > bestScore) {
      best = line;
      bestScore = score;
    }
  }
  if (best) return best;
  return 'The way to Olympus is clouded right now, so I can only speak from the island notes. Open Lessons (L) for the full lesson, and ask me again later.';
}

function clip(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
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
    body.question ? `The player asked: ${String(body.question).slice(0, 500)}` : '',
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

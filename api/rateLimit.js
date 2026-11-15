/**
 * A small per-visitor limit for /api/athena, so one person (or a script)
 * cannot drain the Gemini quota. It lives in memory, so each serverless
 * instance keeps its own count. That is a speed bump, not a wall: the real
 * ceiling is the quota or budget you set on the key in Google's console.
 */

const WINDOW_MS = 60_000;
const PER_MINUTE = 12;
const PER_DAY = 150;
const DAY_MS = 24 * 60 * 60_000;

const visitors = new Map();

export function checkRate(id, now = Date.now()) {
  const key = id || 'unknown';
  let entry = visitors.get(key);
  if (!entry || now - entry.dayStart > DAY_MS) {
    entry = { dayStart: now, day: 0, recent: [] };
    visitors.set(key, entry);
  }
  entry.recent = entry.recent.filter((t) => now - t < WINDOW_MS);
  if (entry.recent.length >= PER_MINUTE) return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - entry.recent[0])) / 1000) };
  if (entry.day >= PER_DAY) return { ok: false, retryAfter: Math.ceil((DAY_MS - (now - entry.dayStart)) / 1000) };
  entry.recent.push(now);
  entry.day += 1;
  // Keep memory bounded on a long-lived instance.
  if (visitors.size > 5000) visitors.delete(visitors.keys().next().value);
  return { ok: true };
}

export function visitorId(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0];
  return first.trim() || req.socket?.remoteAddress || 'unknown';
}

export const RATE_LIMITS = { PER_MINUTE, PER_DAY };

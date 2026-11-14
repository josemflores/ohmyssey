/**
 * "Ask Athena" calls POST /api/athena.
 * A real hint comes back only when the server has GEMINI_API_KEY and Gemini answers.
 * Any other outcome uses the `hints` array on the level, in order.
 * The key is never in this file.
 */

import { useState } from 'react';
import { summarizeCircuit } from '../lib/parts.js';

export default function AthenaPanel({ level, slots, feedback }) {
  const [hint, setHint] = useState('');
  const [source, setSource] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function ask() {
    const nextAttempt = attempt + 1;
    setAttempt(nextAttempt);
    setLoading(true);
    let spoken = '';
    let nextReason = 'network';
    try {
      const response = await fetch('/api/athena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelId: level.id,
          title: level.title,
          concept: level.concept,
          goal: level.goal,
          athenaNote: level.athenaNote,
          circuit: summarizeCircuit(level, slots),
          feedback,
          attempt: nextAttempt,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (data && typeof data.hint === 'string' && data.hint.trim()) {
        spoken = data.hint.trim();
      } else if (data && data.reason) {
        nextReason = data.reason;
      }
    } catch {
      spoken = '';
      nextReason = 'network';
    }

    if (spoken) {
      setHint(spoken);
      setSource('athena');
      setReason('');
    } else {
      setHint(localHint(level, nextAttempt - 1));
      setSource('notes');
      setReason(nextReason);
    }
    setLoading(false);
  }

  return (
    <section className="athena card">
      <div className="athena-head">
        <Owl />
        <div>
          <h2>Athena</h2>
          <p>A hint, not the answer. She would rather you do the arithmetic.</p>
        </div>
      </div>
      <button className="btn btn-primary" type="button" onClick={ask} disabled={loading}>
        {loading ? 'Athena is listening…' : hint ? 'Ask again' : 'Ask Athena'}
      </button>
      {hint && (
        <blockquote className={source === 'athena' ? 'hint hint-live' : 'hint'}>
          <p>{hint}</p>
          <footer>{sourceLabel(source, reason)}</footer>
        </blockquote>
      )}
    </section>
  );
}

function localHint(level, index) {
  const hints = Array.isArray(level.hints) ? level.hints.filter(Boolean) : [];
  if (hints.length === 0) {
    return 'Trace the loop with your finger. If there is a gap, the current is zero.';
  }
  return hints[index % hints.length];
}

function sourceLabel(source, reason) {
  if (source === 'athena') return 'Spoken by Athena, through Gemini.';
  if (reason === 'no_key') {
    return 'A prepared hint from this level. Add GEMINI_API_KEY on the server when you want Athena to speak.';
  }
  if (reason === 'upstream' || reason === 'empty') {
    return 'A prepared hint from this level. Athena’s call did not succeed, so the game used the notes.';
  }
  return 'A prepared hint from this level. The hint service did not answer.';
}

function Owl() {
  return (
    <svg className="owl" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="26" r="14" fill="#1f3d4d" />
      <circle cx="18" cy="24" r="5" fill="#f4e6c8" />
      <circle cx="30" cy="24" r="5" fill="#f4e6c8" />
      <circle cx="18" cy="24" r="2" fill="#1c1612" />
      <circle cx="30" cy="24" r="2" fill="#1c1612" />
      <path d="M22 30 h4 l-2 3 z" fill="#e6c27a" />
      <path d="M10 20 q6-14 14-8" fill="none" stroke="#e6c27a" strokeWidth="2" />
      <path d="M38 20 q-6-14-14-8" fill="none" stroke="#e6c27a" strokeWidth="2" />
    </svg>
  );
}

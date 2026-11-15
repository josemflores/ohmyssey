/**
 * Athena's side of the study. A typed question goes to POST /api/athena.
 * With no Gemini key, the route returns the next canned hint from this level.
 * Recording an attempt also speaks the local coach line, which never names
 * the winning part.
 */

import { useEffect, useState } from 'react';

export default function AthenaDialogue({ level, result, misses }) {
  const [lines, setLines] = useState(() => [
    {
      role: 'athena',
      source: 'notes',
      text: level.greeting || 'Ask, and I will point at the idea. I will not hand you the part.',
    },
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!misses || !result?.coach) return;
    const text = result.coach;
    setLines((prev) => [...prev, { role: 'athena', source: 'notes', text }]);
    // `result` is a fresh object every render. The attempt counter is the event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [misses]);

  async function ask(event) {
    event.preventDefault();
    const text = question.trim() || result?.headline || 'Look at what I built.';
    setQuestion('');
    setLines((prev) => [...prev, { role: 'you', text }]);
    setLoading(true);
    const attempt = misses + 1;
    let spoken = '';
    let source = 'notes';
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
          circuit: {
            puzzle: level.puzzle?.kind,
            headline: result?.headline || '',
            meter: result?.meter || null,
          },
          feedback: result?.detail || result?.headline || '',
          question: text,
          attempt,
          cannedHints: level.hints || [],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (data && typeof data.hint === 'string' && data.hint.trim()) {
        spoken = data.hint.trim();
        source = data.source === 'gemini' ? 'gemini' : 'notes';
      }
    } catch {
      spoken = '';
    }
    if (!spoken) {
      const hints = Array.isArray(level.hints) ? level.hints : [];
      spoken = hints.length
        ? hints[(attempt - 1) % hints.length]
        : 'Trace the loop. A gap means the current is zero.';
      source = 'notes';
    }
    setLines((prev) => [...prev, { role: 'athena', source, text: spoken }]);
    setLoading(false);
  }

  return (
    <section className="card dialogue">
      <div className="athena-head">
        <Owl />
        <div>
          <h2>Athena</h2>
          <p>Ask about this board. She points you at the idea, not the answer.</p>
        </div>
      </div>
      <ol className="dialogue-log">
        {lines.map((line, index) => (
          <li key={`${line.role}-${index}`} className={line.role === 'you' ? 'dialogue-you' : 'dialogue-athena'}>
            <span>{line.role === 'you' ? 'You' : 'Athena'}</span>
            <p>{line.text}</p>
            {line.role === 'athena' && (
              <small>{line.source === 'gemini' ? 'Spoken through Gemini.' : 'From the island notes.'}</small>
            )}
          </li>
        ))}
      </ol>
      <form className="dialogue-form" onSubmit={ask}>
        <label htmlFor="athena-question">Ask about this board</label>
        <input
          id="athena-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Why is the lamp dark?"
          maxLength={400}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Athena is listening…' : 'Ask Athena'}
        </button>
      </form>
    </section>
  );
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

/**
 * The "Ask Athena" menu over the world (H). Athena introduces herself, says
 * how she can help, then leaves room for any question.
 *
 * Questions go to POST /api/athena with mode "chat". The server holds the
 * Gemini key; this file never sees it. Without a key, or if Gemini is down,
 * the server answers from the island notes and the panel says so.
 *
 * The conversation is kept in memory for this visit, so closing and
 * reopening the panel does not wipe it.
 */

import { useEffect, useRef, useState } from 'react';
import './AthenaChat.css';

const INTRO = [
  'I am Athena, goddess of wisdom. I have watched over you since the walls of Troy, and I will see you home to Ithaca.',
  'Ask me anything about the circuits on this voyage: what a resistor does, why a lamp stays dark, how Ohm’s law works, or what to try next. I will help you reason it out. On a puzzle I point at the idea and let you find the answer, because that is how it stays with you.',
];

// Starter questions for each lesson in focus. Keys are study-pack ids.
const STARTERS = {
  1: ['What is a closed loop?', 'Why does an LED need a resistor?', 'What does Ohm’s law say?'],
  6: ['How does a 555 timer blink?', 'What does a capacitor do?', 'Why is R2 counted twice?'],
};
const GENERIC = ['What is voltage?', 'What is current?', 'How do I play?'];

let saved = [];

export default function AthenaChat({ topic, place }) {
  const [lines, setLines] = useState(saved);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const log = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    saved = lines;
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    input.current?.focus();
  }, []);

  async function ask(text) {
    const q = text.trim();
    if (!q || busy) return;
    setQuestion('');
    const history = lines.slice(-8).map(({ role, text: t }) => ({ role, text: t }));
    setLines((prev) => [...prev, { role: 'you', text: q }]);
    setBusy(true);
    let reply = '';
    let source = 'canned';
    try {
      const response = await fetch('/api/athena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          question: q,
          history,
          place,
          levelId: topic?.id,
          title: topic?.title,
          concept: topic?.concept,
          athenaNote: topic?.athenaNote,
          cannedHints: topic?.hints || [],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (typeof data.hint === 'string' && data.hint.trim()) {
        reply = data.hint.trim();
        source = data.source === 'gemini' ? 'gemini' : 'canned';
      }
    } catch {
      reply = '';
    }
    if (!reply) {
      reply = 'I cannot reach Olympus from here. Check that the game server is running, then ask again.';
    }
    setOffline(source !== 'gemini');
    setLines((prev) => [...prev, { role: 'athena', text: reply, source }]);
    setBusy(false);
    input.current?.focus();
  }

  function submit(event) {
    event.preventDefault();
    ask(question);
  }

  function clearChat() {
    setLines([]);
    setOffline(false);
  }

  const starters = STARTERS[topic?.id] || GENERIC;

  return (
    <section className="card athena-chat" aria-label="Ask Athena">
      <header className="athena-chat-head">
        <AthenaFace />
        <div>
          <h2>Athena</h2>
          <p>Goddess of wisdom</p>
        </div>
      </header>

      <div ref={log} className="athena-chat-log" aria-live="polite">
        {INTRO.map((text) => (
          <p key={text} className="athena-chat-line is-athena">{text}</p>
        ))}
        {lines.length === 0 && (
          <div className="athena-chat-starters">
            <p>Try asking:</p>
            {starters.map((text) => (
              <button key={text} type="button" onClick={() => ask(text)} disabled={busy}>{text}</button>
            ))}
          </div>
        )}
        {lines.map((line, index) => (
          <p
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`athena-chat-line ${line.role === 'you' ? 'is-you' : 'is-athena'}`}
          >
            {line.role === 'you' && <span className="sr-only">You: </span>}
            {line.text}
          </p>
        ))}
        {busy && <p className="athena-chat-line is-athena is-thinking">Athena is thinking…</p>}
      </div>

      <form className="athena-chat-form" onSubmit={submit}>
        <label htmlFor="athena-chat-input" className="sr-only">Your question for Athena</label>
        <input
          ref={input}
          id="athena-chat-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask Athena anything…"
          maxLength={500}
          autoComplete="off"
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !question.trim()}>
          Ask
        </button>
      </form>
      <p className="athena-chat-foot">
        {offline
          ? 'Athena is offline, so she is answering from the island notes.'
          : 'Athena answers through Google Gemini. Don’t share personal details.'}
        {lines.length > 0 && (
          <button type="button" className="athena-chat-clear" onClick={clearChat}>Start over</button>
        )}
      </p>
    </section>
  );
}

// Her face from the game sprite (art/scripts/build_ithaca_people_lpc.py):
// bronze helmet, orange crest, curly chestnut hair, at full LPC size.
function AthenaFace() {
  return (
    <img
      className="athena-face"
      src="/assets/sprites/npcs/athena/athena_head.png"
      alt=""
      aria-hidden="true"
    />
  );
}

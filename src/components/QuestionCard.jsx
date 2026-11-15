/**
 * Pieces shared by the hatch riddle, the gate, and battle questions, so all
 * three look like the login card: a parchment card, a gold eyebrow, a
 * Cinzel title, a meander rule, and answers lettered Α Β Γ Δ.
 * Keys 1–4 also pick an answer.
 */

import { useEffect } from 'react';
import './QuestionCard.css';

export const GREEK_LETTERS = ['Α', 'Β', 'Γ', 'Δ'];

export function QuestionHeader({ eyebrow, title }) {
  return (
    <>
      {eyebrow && <p className="q-eyebrow">{eyebrow}</p>}
      <h2 className="q-title">{title}</h2>
      <div className="q-rule" aria-hidden="true" />
    </>
  );
}

// Short answers (numbers) sit two by two; sentences get a row each.
export function choicesClass(choices) {
  const long = choices.some((choice) => String(choice).length > 24);
  return long ? 'q-choices is-long' : 'q-choices';
}

export function ChoiceLabel({ index, children }) {
  return (
    <>
      <span className="q-letter" aria-hidden="true">{GREEK_LETTERS[index] || index + 1}</span>
      <span>{children}</span>
    </>
  );
}

export function KeysHint({ count }) {
  return (
    <p className="q-keys">
      Click an answer, or press <kbd>1</kbd>–<kbd>{count}</kbd>.
    </p>
  );
}

// Number keys 1..count call onPick(index) while `enabled` is true.
export function useChoiceKeys(enabled, count, onPick) {
  useEffect(() => {
    if (!enabled) return undefined;
    function onKey(event) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (document.querySelector('.pause-card')) return;
      const n = Number(event.key);
      if (Number.isInteger(n) && n >= 1 && n <= count) {
        event.preventDefault();
        onPick(n - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, count, onPick]);
}

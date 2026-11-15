import { useEffect, useRef } from 'react';
import './LessonsTip.css';

// A short word before the first level: where help lives. Shown for about
// five seconds between the story intro and the horse, or until the player
// presses Enter / Space or clicks Continue.
const TIP_MS = 5500;

export default function LessonsTip({ onDone }) {
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      onDoneRef.current?.();
    };
    const timer = setTimeout(finish, TIP_MS);
    function onKey(event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
        event.preventDefault();
        finish();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="lessons-tip" role="dialog" aria-labelledby="lessons-tip-title">
      <div className="lessons-tip-glow" aria-hidden="true" />
      <div className="q-card lessons-tip-card">
        <p className="q-eyebrow">Ω · Before the horse</p>
        <h2 id="lessons-tip-title" className="q-title">Athena&rsquo;s Counsel</h2>
        <div className="q-rule" aria-hidden="true" />
        <p className="lessons-tip-lead">
          Every gate and every battle asks a question about circuits. If one stumps you, help is a key away.
        </p>
        <ul className="lessons-tip-keys">
          <li>
            <kbd>L</kbd>
            <span>
              <strong>Lessons</strong>
              Short guides to every idea in the game: resistors, Ohm&rsquo;s law, diodes and more.
            </span>
          </li>
          <li>
            <kbd>H</kbd>
            <span>
              <strong>Ask Athena</strong>
              Ask the goddess anything. She will point you toward the answer.
            </span>
          </li>
        </ul>
        <p className="lessons-tip-note">You can open them any time you are walking, from the buttons on the left.</p>
        <div className="lessons-tip-bar" aria-hidden="true"><span style={{ animationDuration: `${TIP_MS}ms` }} /></div>
        <button
          type="button"
          className="q-action lessons-tip-go"
          onClick={() => {
            if (done.current) return;
            done.current = true;
            onDone?.();
          }}
          autoFocus
        >
          Into the horse
        </button>
      </div>
    </div>
  );
}

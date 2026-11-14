/**
 * One island. The story, the lesson cards, the board, and Athena all read
 * the level object. Winning calls onComplete(level.id), which writes
 * localStorage and unlocks the next island.
 */

import { useEffect, useState } from 'react';
import CircuitBuilder from './CircuitBuilder.jsx';
import AthenaPanel from './AthenaPanel.jsx';

export default function LevelScreen({ level, onComplete, onBack }) {
  const [slots, setSlots] = useState(() => level.slots.map((slot) => ({ id: slot.id, part: null })));

  const result = level.check({
    slots,
    supply: level.supply,
    ledVf: level.led.vf,
  });

  useEffect(() => {
    if (result.complete) onComplete(level.id);
  }, [result.complete, level.id, onComplete]);

  return (
    <main className="level-screen">
      <header className="level-bar">
        <button className="btn btn-quiet" type="button" onClick={onBack}>
          ← The map
        </button>
        <div>
          <p className="eyebrow">
            Island {level.id}
            {level.stub ? ' · sketch' : ''} · {level.place}
          </p>
          <h1>{level.title}</h1>
          <p className="epithet">{level.epithet}</p>
        </div>
      </header>

      <div className="level-layout">
        <div className="level-read">
          <article className="card story">
            <h2>The telling</h2>
            <p>{level.story}</p>
          </article>
          <ol className="lessons">
            {level.lessons.map((card, index) => (
              <li key={card.title} className="card lesson">
                <span className="lesson-index">{index + 1}</span>
                <div>
                  <h2>{card.title}</h2>
                  <p>{card.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <AthenaPanel level={level} slots={slots} feedback={result.headline} />
        </div>

        <div className="level-play">
          {level.stub && (
            <p className="stub-banner">
              This island is a sketch for the team. You can drop parts on the board, but the
              puzzle cannot be won until <code>check()</code> in this level’s file returns a win.
            </p>
          )}
          <CircuitBuilder level={level} slots={slots} onSlotsChange={setSlots} result={result} />
          {result.complete && (
            <button className="btn btn-primary btn-large sail-on" type="button" onClick={onBack}>
              Return to the map
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Six islands on one sea. Positions come from each level's `map` field,
 * so moving an island is a pair of numbers, not a layout edit.
 */

import { useState } from 'react';
import { levels } from '../levels/index.js';
import { isUnlocked } from '../lib/progress.js';

export default function VoyageMap({ progress, onOpen, onReset }) {
  const [note, setNote] = useState('');
  const charted = progress.completed.length;
  const frontier = levels.find((level) => isUnlocked(level.id, progress) && !progress.completed.includes(level.id));

  function handleIsland(level) {
    if (!isUnlocked(level.id, progress)) {
      const previous = levels.find((item) => item.id === level.id - 1);
      setNote(
        previous
          ? `${level.place} stays shut until you finish ${previous.title}.`
          : 'That island is still shut.',
      );
      return;
    }
    setNote('');
    onOpen(level.id);
  }

  return (
    <main className="map-screen">
      <header className="map-bar">
        <div>
          <p className="eyebrow">The Aegean</p>
          <h1>The voyage home</h1>
        </div>
        <p className="charted">
          Islands charted
          <strong>
            {charted} / {levels.length}
          </strong>
        </p>
      </header>

      <div className="sea">
        <svg className="sea-art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {levels.slice(0, -1).map((level, index) => {
            const next = levels[index + 1];
            const sailed = progress.completed.includes(level.id);
            return (
              <line
                key={level.id}
                x1={level.map.x}
                y1={level.map.y}
                x2={next.map.x}
                y2={next.map.y}
                className={sailed ? 'route sailed' : 'route'}
              />
            );
          })}
        </svg>
        <div className="compass-rose" aria-hidden="true">
          N
        </div>

        {levels.map((level) => {
          const unlocked = isUnlocked(level.id, progress);
          const done = progress.completed.includes(level.id);
          const current = frontier?.id === level.id;
          return (
            <div
              key={level.id}
              className="island-anchor"
              style={{ left: `${level.map.x}%`, top: `${level.map.y}%` }}
            >
              <button
                type="button"
                className={[
                  'island',
                  done ? 'done' : '',
                  unlocked ? 'open' : 'locked',
                  current ? 'current' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-disabled={!unlocked}
                onClick={() => handleIsland(level)}
              >
                <IslandGlyph done={done} locked={!unlocked} lighthouse={level.id === 6} />
                <span className="island-index">{level.id}</span>
                <span className="island-title">{level.title}</span>
                <span className="island-epithet">{level.epithet}</span>
                <span className="island-state">
                  {done ? 'Charted' : unlocked ? (level.stub ? 'Ashore · sketch' : 'Go ashore') : 'Locked'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <footer className="map-foot">
        <p>{note || 'Islands open in order. A gold ring is the coast you can reach.'}</p>
        <button className="btn btn-quiet" type="button" onClick={onReset}>
          Clear saved progress
        </button>
      </footer>
    </main>
  );
}

function IslandGlyph({ done, locked, lighthouse }) {
  const sand = locked ? '#8aa0aa' : '#e2c27a';
  const hill = locked ? '#6d8688' : '#2f6b45';
  return (
    <svg className="island-glyph" viewBox="0 0 86 58" aria-hidden="true">
      <ellipse cx="43" cy="40" rx="34" ry="12" fill={sand} />
      <ellipse cx="43" cy="36" rx="22" ry="8" fill={locked ? '#9bb0b4' : '#f0d7a0'} />
      {lighthouse ? (
        <>
          <rect x="39" y="14" width="8" height="22" fill={locked ? '#607880' : '#f4e6c8'} />
          <rect x="36" y="12" width="14" height="4" fill={locked ? '#4d636b' : '#9c3b2e'} />
          <circle cx="43" cy="16" r="2" fill={done ? '#ffd27a' : '#e23b2f'} />
        </>
      ) : (
        <>
          <path d="M43 34 L43 16" stroke={hill} strokeWidth="2" />
          <circle cx="43" cy="14" r="7" fill={hill} />
        </>
      )}
      {done && (
        <path d="M18 30 q6-10 10-2 q4-8 8-1" fill="none" stroke="#2f6b45" strokeWidth="2" />
      )}
    </svg>
  );
}

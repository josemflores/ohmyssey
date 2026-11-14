/**
 * Topic select for the study voyage. Every island is open. The gold ring
 * marks the next one that is not in the notebook yet.
 */

import { useState } from 'react';
import { Inventory, Notebook, ProgressPips } from './StudyPanels.jsx';

export default function LearnMap({ levels, progress, source, onOpen, onDifficulty, onReset, onTitle }) {
  const [note, setNote] = useState('');
  const ordered = [...levels].sort((a, b) => (a.specIndex ?? a.id) - (b.specIndex ?? b.id));
  const suggested = ordered.find((level) => !progress.completed.includes(level.id));

  return (
    <main className="map-screen">
      <header className="map-bar">
        <div>
          <p className="eyebrow">Study voyage · {progress.difficulty}</p>
          <h1>Choose an island</h1>
        </div>
        <ProgressPips levels={ordered} completed={progress.completed} />
      </header>

      <div className="sea">
        <svg className="sea-art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {ordered.slice(0, -1).map((level, index) => {
            const next = ordered[index + 1];
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
        {ordered.map((level) => {
          const done = progress.completed.includes(level.id);
          const current = suggested?.id === level.id;
          return (
            <div key={level.id} className="island-anchor" style={{ left: `${level.map.x}%`, top: `${level.map.y}%` }}>
              <button
                type="button"
                className={['island', 'open', done ? 'done' : '', current ? 'current' : ''].filter(Boolean).join(' ')}
                onClick={() => {
                  setNote('');
                  onOpen(level.id);
                }}
              >
                <IslandGlyph done={done} lighthouse={level.specIndex === 5 || level.id === 6} />
                <span className="island-index">{level.specIndex != null ? level.specIndex + 1 : level.id}</span>
                <span className="island-title">{level.title}</span>
                <span className="island-epithet">{level.epithet}</span>
                <span className="island-state">{done ? 'Studied' : current ? 'Suggested next' : 'Open'}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="study-dock">
        <Notebook entries={progress.notebook} />
        <Inventory items={progress.inventory} />
      </div>

      <footer className="map-foot">
        <p>
          {note || 'Pick any coast. The notebook and the pouch stay in this browser.'}
          {' '}
          {source === 'api' ? 'Level pack: backend.' : 'Level pack: the copy bundled with the ship.'}
        </p>
        <div className="map-actions">
          <button className="btn btn-quiet" type="button" onClick={onDifficulty}>Change the wind</button>
          <button className="btn btn-quiet" type="button" onClick={onReset}>Clear study progress</button>
          <button className="btn btn-quiet" type="button" onClick={onTitle}>Title</button>
        </div>
      </footer>
    </main>
  );
}

function IslandGlyph({ done, lighthouse }) {
  const sand = '#e2c27a';
  const hill = '#2f6b45';
  return (
    <svg className="island-glyph" viewBox="0 0 86 58" aria-hidden="true">
      <ellipse cx="43" cy="40" rx="34" ry="12" fill={sand} />
      <ellipse cx="43" cy="36" rx="22" ry="8" fill="#f0d7a0" />
      {lighthouse ? (
        <>
          <rect x="39" y="14" width="8" height="22" fill="#f4e6c8" />
          <rect x="36" y="12" width="14" height="4" fill="#9c3b2e" />
          <circle cx="43" cy="16" r="2" fill={done ? '#ffd27a' : '#e23b2f'} />
        </>
      ) : (
        <>
          <path d="M43 34 L43 16" stroke={hill} strokeWidth="2" />
          <circle cx="43" cy="14" r="7" fill={hill} />
        </>
      )}
    </svg>
  );
}

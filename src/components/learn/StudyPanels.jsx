/** Objectives, the pouch, the notebook, and how much of the voyage is studied. */

export function Objectives({ items }) {
  const list = items || [];
  const done = list.filter((item) => item.done).length;
  return (
    <section className="card study-panel">
      <h2>Objectives</h2>
      <p className="panel-kicker">{done} / {list.length}</p>
      <ul className="objective-list">
        {list.map((item) => (
          <li key={item.id} className={item.done ? 'objective-done' : ''}>
            <span aria-hidden="true">{item.done ? '✓' : '○'}</span>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Inventory({ items }) {
  return (
    <section className="card study-panel">
      <h2>Pouch</h2>
      {items?.length ? (
        <ul className="inventory-list">
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              {item.note && <p>{item.note}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p>The pouch is empty. Win an island and the part stays with the ship.</p>
      )}
    </section>
  );
}

export function Notebook({ entries }) {
  return (
    <section className="card study-panel">
      <h2>Study notebook</h2>
      {entries?.length ? (
        <ul className="notebook-list">
          {entries.map((entry) => (
            <li key={entry.levelId}>
              <h3>{entry.concept}</h3>
              <p>{entry.summary}</p>
              <p className="notebook-from">{entry.title}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nothing copied down yet. Win an island and the idea stays in this browser.</p>
      )}
    </section>
  );
}

export function ProgressPips({ levels, completed }) {
  const done = new Set(completed || []);
  const count = (levels || []).filter((level) => done.has(level.id)).length;
  return (
    <div className="learn-progress">
      <p>
        Islands studied
        <strong>{count} / {levels?.length || 0}</strong>
      </p>
      <div className="pips" aria-hidden="true">
        {(levels || []).map((level) => (
          <span key={level.id} className={done.has(level.id) ? 'pip on' : 'pip'} />
        ))}
      </div>
    </div>
  );
}

export default function TitleScreen({ hasProgress, hasStudy, onBegin, onStudy }) {
  return (
    <main className="title-screen">
      <div className="title-sea" aria-hidden="true">
        <Ship />
      </div>
      <section className="title-card card">
        <p className="eyebrow">hackUTA 2026</p>
        <h1>
          <span className="omega" aria-hidden="true">
            Ω
          </span>
          Ohmyssey
        </h1>
        <p className="lede">
          Odysseus can sail. He cannot yet light a lamp. You will take him from a closed
          loop on the beach at Troy to the lighthouse that marks Ithaca, and pick up the
          current along the way.
        </p>
        <ol className="how">
          <li>Read the short lesson on each island.</li>
          <li>Set the parts into the loop and watch the milliamps.</li>
          <li>Ask Athena if the lamp will not behave.</li>
        </ol>
        <div className="title-actions">
          <button className="btn btn-primary btn-large" type="button" onClick={onBegin}>
            {hasProgress ? 'Continue the voyage' : 'Begin the voyage'}
          </button>
          {onStudy && (
            <button className="btn btn-quiet btn-large" type="button" onClick={onStudy}>
              {hasStudy ? 'Continue studying' : 'Study with Athena'}
            </button>
          )}
        </div>
        <p className="fine">
          The bench builds the early lamps. Study with Athena is the lesson for all six islands.
          Progress stays in this browser.
        </p>
      </section>
    </main>
  );
}

function Ship() {
  return (
    <svg className="ship" viewBox="0 0 280 120" aria-hidden="true">
      <path d="M20 78 Q140 108 260 78 L240 96 Q140 112 40 96 Z" fill="#1b2c38" />
      <rect x="132" y="28" width="6" height="52" fill="#e6c27a" />
      <path d="M138 30 L196 58 L138 58 Z" fill="#f4e6c8" />
      <path d="M138 60 L188 78 L138 78 Z" fill="#efe0c4" />
      <circle cx="46" cy="86" r="4" fill="#e23b2f" />
    </svg>
  );
}

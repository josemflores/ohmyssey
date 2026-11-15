/**
 * A study island as a book with tabs: Overview, Concepts, Equations,
 * Examples and Practice. The reading comes from src/learn/lessonBook.js;
 * Practice is the level pack's puzzle with its objectives, Athena, hints,
 * the gated worked solution and the results card (what LearnLevel showed
 * on one long page).
 */

import { useEffect, useMemo, useState } from 'react';
import { grade, resolveTune, solutionUnlocked } from '../../learn/grade.js';
import { initialState } from '../../learn/initialState.js';
import { lessonBookFor } from '../../learn/lessonBook.js';
import AthenaDialogue from './AthenaDialogue.jsx';
import FeedbackBanner from './FeedbackBanner.jsx';
import PuzzleBoard from './PuzzleBoard.jsx';
import { Inventory, Notebook, Objectives, ProgressPips } from './StudyPanels.jsx';
import './LessonBook.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'concepts', label: 'Concepts' },
  { id: 'equations', label: 'Equations' },
  { id: 'examples', label: 'Examples' },
  { id: 'practice', label: 'Practice' },
];

export default function LessonBook({
  level,
  levels,
  difficulty,
  progress,
  onWin,
  onBack,
  backLabel = '← Lessons',
  doneLabel = 'Back to the lessons',
  kicker = '',
}) {
  const book = lessonBookFor(level.id);
  const tabs = book ? TABS : TABS.filter((tab) => tab.id === 'practice');
  const [tab, setTab] = useState(tabs[0].id);

  // Arrow keys move between tabs when the tab bar has focus.
  function onTabKey(event) {
    const index = tabs.findIndex((t) => t.id === tab);
    if (event.key === 'ArrowRight') setTab(tabs[(index + 1) % tabs.length].id);
    else if (event.key === 'ArrowLeft') setTab(tabs[(index - 1 + tabs.length) % tabs.length].id);
    else return;
    event.preventDefault();
  }

  return (
    <main className="lesson-book" data-level={level.id}>
      <header className="lesson-book-head">
        <button className="lesson-book-back" type="button" onClick={onBack}>{backLabel}</button>
        <div className="lesson-book-title">
          <p className="lesson-book-kicker">{kicker}</p>
          <h1>{level.title}</h1>
          <p className="lesson-book-epithet">{book ? book.background.lead : level.epithet}</p>
        </div>
        <ProgressPips levels={levels} completed={progress.completed} />
      </header>

      <nav className="lesson-book-tabs" role="tablist" aria-label="Lesson sections" onKeyDown={onTabKey}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`lb-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`lb-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={tab === t.id ? 'is-on' : ''}
            onClick={() => setTab(t.id)}
          >
            <span className="lesson-book-tab-num" aria-hidden="true">{toGreek(i + 1)}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <section className="lesson-book-panel" role="tabpanel" id={`lb-panel-${tab}`} aria-labelledby={`lb-tab-${tab}`} key={tab}>
        {tab === 'overview' && <Overview book={book} level={level} onNext={() => setTab('concepts')} />}
        {tab === 'concepts' && <Concepts concepts={book.concepts} onDone={() => setTab('equations')} />}
        {tab === 'equations' && <Equations equations={book.equations} />}
        {tab === 'examples' && <Examples examples={book.examples} onPractice={() => setTab('practice')} />}
        {tab === 'practice' && (
          <Practice
            level={level}
            difficulty={difficulty}
            progress={progress}
            onWin={onWin}
            onBack={onBack}
            doneLabel={doneLabel}
          />
        )}
      </section>
    </main>
  );
}

// ---- Overview ----------------------------------------------------------------

function Overview({ book, level, onNext }) {
  return (
    <div className="lb-overview">
      <div className="lb-overview-main">
        {book.background.sections.map((section) => (
          <article key={section.title} className="lb-card">
            <h2>{section.title}</h2>
            {section.paragraphs.map((p) => <p key={p}>{p}</p>)}
          </article>
        ))}
      </div>
      <aside className="lb-overview-side">
        <div className="lb-card lb-map">
          <h2>In this lesson</h2>
          <ol>
            {book.concepts.map((c) => (
              <li key={c.id}>
                <strong>{c.title}</strong>
                <span>{c.summary}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="lb-btn" onClick={onNext}>Start with the concepts →</button>
        </div>
        <div className="lb-card lb-quest">
          <h2>The practice puzzle</h2>
          <p>{level.goal}</p>
        </div>
      </aside>
    </div>
  );
}

// ---- Concepts: one topic at a time, chosen from a side list ------------------

function Concepts({ concepts, onDone }) {
  const [index, setIndex] = useState(0);
  const topic = concepts[index];
  return (
    <div className="lb-concepts">
      <ol className="lb-topics" aria-label="Topics">
        {concepts.map((c, i) => (
          <li key={c.id}>
            <button type="button" className={i === index ? 'is-on' : ''} aria-current={i === index ? 'step' : undefined} onClick={() => setIndex(i)}>
              <span className="lb-topic-num">{i + 1}</span>
              <span className="lb-topic-text">
                <strong>{c.title}</strong>
                <small>{c.summary}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <article className="lb-card lb-topic" key={topic.id}>
        <p className="lb-topic-kicker">Concept {index + 1} of {concepts.length}</p>
        <h2>{topic.title}</h2>
        {topic.paragraphs.map((p) => <p key={p}>{p}</p>)}
        {topic.equation && (
          <figure className="lb-equation">
            <div className="lb-equation-main">{topic.equation}</div>
            {topic.where && <figcaption>{topic.where}</figcaption>}
          </figure>
        )}
        {topic.remember && (
          <p className="lb-remember"><span>Remember</span>{topic.remember}</p>
        )}
        <div className="lb-topic-nav">
          <button type="button" className="lb-btn is-quiet" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button>
          {index + 1 < concepts.length ? (
            <button type="button" className="lb-btn" onClick={() => setIndex(index + 1)}>Next concept →</button>
          ) : (
            <button type="button" className="lb-btn" onClick={onDone}>On to the equations →</button>
          )}
        </div>
      </article>
    </div>
  );
}

// ---- Equations: a formula sheet ------------------------------------------------

function Equations({ equations }) {
  return (
    <div className="lb-sheet">
      {equations.map((eq) => (
        <article key={eq.name} className="lb-card lb-formula">
          <h2>{eq.name}</h2>
          <div className="lb-equation-main">{eq.equation}</div>
          <dl className="lb-terms">
            {eq.terms.map(([symbol, meaning, unit]) => (
              <div key={symbol + meaning}>
                <dt>{symbol}</dt>
                <dd>{meaning}{unit && <em>{unit}</em>}</dd>
              </div>
            ))}
          </dl>
          <p className="lb-formula-example"><span>e.g.</span>{eq.example}</p>
        </article>
      ))}
    </div>
  );
}

// ---- Examples: try it, then reveal the steps ---------------------------------

function Examples({ examples, onPractice }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (i) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });
  return (
    <div className="lb-examples">
      {examples.map((ex, i) => (
        <article key={ex.title} className="lb-card lb-example">
          <p className="lb-topic-kicker">Example {i + 1}</p>
          <h2>{ex.title}</h2>
          <p className="lb-example-q">{ex.question}</p>
          {open.has(i) ? (
            <>
              <ol className="lb-steps">
                {ex.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
              <p className="lb-answer"><span>Answer</span>{ex.answer}</p>
              <button type="button" className="lb-btn is-quiet" onClick={() => toggle(i)}>Hide the working</button>
            </>
          ) : (
            <button type="button" className="lb-btn" onClick={() => toggle(i)}>Try it, then show the working</button>
          )}
        </article>
      ))}
      <div className="lb-examples-end">
        <button type="button" className="lb-btn" onClick={onPractice}>Ready? Try the practice puzzle →</button>
      </div>
    </div>
  );
}

// ---- Practice: the puzzle from the level pack --------------------------------

function Practice({ level, difficulty, progress, onWin, onBack, doneLabel }) {
  const tune = resolveTune(level, difficulty);
  const [board, setBoard] = useState(() => initialState(level, difficulty));
  const [misses, setMisses] = useState(0);
  const [hintCount, setHintCount] = useState(tune.hintsShown || 0);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const result = useMemo(() => grade(level, board, difficulty), [level, board, difficulty]);
  const hints = level.hints || [];
  const unlocked = solutionUnlocked({ tune, misses, complete: result.complete });

  useEffect(() => {
    if (result.complete) onWin(level);
  }, [result.complete, level, onWin]);

  return (
    <div className="lb-practice">
      <div className="lb-practice-main">
        <article className="lb-card lb-telling">
          <h2>The telling</h2>
          <p>{level.story}</p>
          {(level.lessons || []).length > 0 && (
            <ul className="lb-telling-notes">
              {level.lessons.map((card) => (
                <li key={card.title}><strong>{card.title}.</strong> {card.body}</li>
              ))}
            </ul>
          )}
        </article>

        {result.complete && (
          <section className="lb-card lb-results">
            <p className="lb-topic-kicker">Results</p>
            <h2>{level.results?.title || 'Island studied'}</h2>
            <p>{level.results?.body || result.detail}</p>
            <p className="lb-equation-main is-small">{result.equation}</p>
            {level.reward && <p>Added to the pouch: <strong>{level.reward.name}</strong>. {level.reward.note}</p>}
            {level.notebook && <p>Copied into the notebook: <strong>{level.notebook.concept}</strong></p>}
            <h3>{level.workedSolution?.title || 'Worked solution'}</h3>
            <ol className="lb-steps">
              {(level.workedSolution?.steps || []).map((step) => <li key={step}>{step}</li>)}
            </ol>
            <button className="lb-btn" type="button" onClick={onBack}>{doneLabel}</button>
          </section>
        )}

        <div className="lb-board">
          <PuzzleBoard level={level} tune={tune} state={board} onChange={setBoard} result={result} />
          <FeedbackBanner result={result} />
        </div>
      </div>

      <aside className="lb-practice-side">
        <Objectives items={result.objectives} />
        <AthenaDialogue level={level} result={result} misses={misses} />

        <section className="card hint-drawer">
          <h2>Hints</h2>
          {hintCount === 0 ? (
            <p>No hint is open yet. Athena would rather you try the arithmetic.</p>
          ) : (
            <ol className="hint-list">
              {hints.slice(0, hintCount).map((hint) => <li key={hint}>{hint}</li>)}
            </ol>
          )}
          <button
            className="btn btn-quiet"
            type="button"
            onClick={() => setHintCount((count) => Math.min(hints.length, count + 1))}
            disabled={hintCount >= hints.length}
          >
            {hintCount >= hints.length ? 'No further hints' : 'Show a hint'}
          </button>
        </section>

        <section className="card solution-drawer">
          <h2>Worked solution</h2>
          {unlocked ? (
            <>
              <button className="btn btn-quiet" type="button" onClick={() => setSolutionOpen((o) => !o)}>
                {solutionOpen ? 'Hide the steps' : 'Show the steps'}
              </button>
              {solutionOpen && (
                <ol className="solution-steps">
                  {(level.workedSolution?.steps || []).map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
            </>
          ) : (
            <p>
              {tune.solutionAfterFails == null
                ? 'The steps open when this island is won.'
                : `Record ${Math.max(0, tune.solutionAfterFails - misses)} more missed attempt${tune.solutionAfterFails - misses === 1 ? '' : 's'} to open the steps.`}
            </p>
          )}
          {!result.complete && (
            <button className="btn btn-primary" type="button" onClick={() => setMisses((c) => c + 1)}>
              Record this attempt ({misses})
            </button>
          )}
        </section>

        <details className="lb-more">
          <summary>Notebook and pouch</summary>
          <Notebook entries={progress.notebook} />
          <Inventory items={progress.inventory} />
        </details>
      </aside>
    </div>
  );
}

function toGreek(n) {
  return ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ϛ'][n - 1] || String(n);
}

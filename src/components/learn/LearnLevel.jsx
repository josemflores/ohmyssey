/**
 * One study island: story, objectives, the puzzle, Athena, hints,
 * a gated worked solution, and the results card once it is won.
 */

import { useEffect, useMemo, useState } from 'react';
import { grade, resolveTune, solutionUnlocked } from '../../learn/grade.js';
import { initialState } from '../../learn/initialState.js';
import AthenaDialogue from './AthenaDialogue.jsx';
import FeedbackBanner from './FeedbackBanner.jsx';
import PuzzleBoard from './PuzzleBoard.jsx';
import { Inventory, Notebook, Objectives, ProgressPips } from './StudyPanels.jsx';

export default function LearnLevel({
  level,
  levels,
  difficulty,
  progress,
  onWin,
  onBack,
  backLabel = '← The map',
  doneLabel = 'Back to the map',
  kicker = '',
}) {
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
    <main className="level-screen learn-screen">
      <header className="level-bar">
        <button className="btn btn-quiet" type="button" onClick={onBack}>
          {backLabel}
        </button>
        <div>
          <p className="eyebrow">
            {kicker || `Island ${level.specIndex != null ? level.specIndex + 1 : level.id} · ${level.place} · ${difficulty}`}
          </p>
          <h1>{level.title}</h1>
          <p className="epithet">{level.epithet}</p>
        </div>
        <ProgressPips levels={levels} completed={progress.completed} />
      </header>

      <div className="level-layout">
        <div className="level-read">
          <article className="card story">
            <h2>The telling</h2>
            <p>{level.story}</p>
          </article>
          <ol className="lessons">
            {(level.lessons || []).map((card, index) => (
              <li key={card.title} className="card lesson">
                <span className="lesson-index">{index + 1}</span>
                <div>
                  <h2>{card.title}</h2>
                  <p>{card.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Objectives items={result.objectives} />
          <AthenaDialogue level={level} result={result} misses={misses} />
          <Notebook entries={progress.notebook} />
          <Inventory items={progress.inventory} />
        </div>

        <div className="learn-play">
          {result.complete && (
            <section className="results-screen card">
              <p className="eyebrow">Results</p>
              <h2>{level.results?.title || 'Island studied'}</h2>
              <p>{level.results?.body || result.detail}</p>
              <p className="equation">{result.equation}</p>
              {level.reward && (
                <p>Added to the pouch: <strong>{level.reward.name}</strong>. {level.reward.note}</p>
              )}
              {level.notebook && (
                <p>Copied into the notebook: <strong>{level.notebook.concept}</strong></p>
              )}
              <h3>{level.workedSolution?.title || 'Worked solution'}</h3>
              <ol className="solution-steps">
                {(level.workedSolution?.steps || []).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <button className="btn btn-primary btn-large" type="button" onClick={onBack}>
                {doneLabel}
              </button>
            </section>
          )}

          <PuzzleBoard level={level} tune={tune} state={board} onChange={setBoard} result={result} />
          <FeedbackBanner result={result} />

          <section className="card hint-drawer">
            <h2>Hints</h2>
            {hintCount === 0 ? (
              <p>No hint is open yet. Athena would rather you try the arithmetic.</p>
            ) : (
              <ol className="hint-list">
                {hints.slice(0, hintCount).map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
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
                <button className="btn btn-quiet" type="button" onClick={() => setSolutionOpen((open) => !open)}>
                  {solutionOpen ? 'Hide the steps' : 'Show the steps'}
                </button>
                {solutionOpen && (
                  <ol className="solution-steps">
                    {(level.workedSolution?.steps || []).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
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
              <button className="btn btn-primary" type="button" onClick={() => setMisses((count) => count + 1)}>
                Record this attempt ({misses})
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

import { useCallback, useEffect, useState } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import VoyageMap from './components/VoyageMap.jsx';
import LevelScreen from './components/LevelScreen.jsx';
import DifficultyScreen from './components/learn/DifficultyScreen.jsx';
import LearnLevel from './components/learn/LearnLevel.jsx';
import LearnMap from './components/learn/LearnMap.jsx';
import { loadLevelData } from './learn/loadLevels.js';
import { clearLearnProgress, loadLearnProgress, recordWin, withDifficulty } from './learn/storage.js';
import { getLevel } from './levels/index.js';
import { clearProgress, loadProgress, markComplete } from './lib/progress.js';

export default function App() {
  const [screen, setScreen] = useState('title');
  const [levelId, setLevelId] = useState(1);
  const [progress, setProgress] = useState(() => loadProgress());
  const [learnLevels, setLearnLevels] = useState(null);
  const [learnSource, setLearnSource] = useState('mock');
  const [learnProgress, setLearnProgress] = useState(() => loadLearnProgress());
  const [studyId, setStudyId] = useState(1);

  const handleComplete = useCallback((id) => {
    setProgress(markComplete(id));
  }, []);

  const handleStudyWin = useCallback((level) => {
    setLearnProgress((prev) => recordWin(prev, level));
  }, []);

  useEffect(() => {
    let cancel = false;
    loadLevelData().then((loaded) => {
      if (cancel) return;
      setLearnLevels(loaded.levels);
      setLearnSource(loaded.source);
    });
    return () => {
      cancel = true;
    };
  }, []);

  function handleReset() {
    clearProgress();
    setProgress(loadProgress());
  }

  const level = getLevel(levelId);
  const studyLevel = learnLevels?.find((item) => item.id === studyId) || null;

  return (
    <div className="app-shell">
      {screen === 'title' && (
        <TitleScreen
          hasProgress={progress.completed.length > 0}
          hasStudy={learnProgress.completed.length > 0}
          onBegin={() => setScreen('map')}
          onStudy={() => setScreen('difficulty')}
        />
      )}
      {screen === 'map' && (
        <VoyageMap
          progress={progress}
          onOpen={(id) => {
            setLevelId(id);
            setScreen('level');
          }}
          onReset={handleReset}
        />
      )}
      {screen === 'level' && level && (
        <LevelScreen
          key={level.id}
          level={level}
          onComplete={handleComplete}
          onBack={() => setScreen('map')}
          onStudy={() => {
            setStudyId(level.id);
            setScreen('learn');
          }}
        />
      )}
      {screen === 'difficulty' && (
        <DifficultyScreen
          current={learnProgress.difficulty}
          onChoose={(difficulty) => {
            setLearnProgress((prev) => withDifficulty(prev, difficulty));
            setScreen('learn-map');
          }}
          onBack={() => setScreen('title')}
        />
      )}
      {screen === 'learn-map' && (
        learnLevels ? (
          <LearnMap
            levels={learnLevels}
            progress={learnProgress}
            source={learnSource}
            onOpen={(id) => {
              setStudyId(id);
              setScreen('learn');
            }}
            onDifficulty={() => setScreen('difficulty')}
            onReset={() => setLearnProgress(clearLearnProgress())}
            onTitle={() => setScreen('title')}
          />
        ) : (
          <main className="map-screen">
            <p className="map-foot">Charting the study voyage…</p>
          </main>
        )
      )}
      {screen === 'learn' && !learnLevels && (
        <main className="map-screen">
          <p className="map-foot">Charting the study voyage…</p>
        </main>
      )}
      {screen === 'learn' && studyLevel && (
        <LearnLevel
          key={`${studyLevel.id}-${learnProgress.difficulty}`}
          level={studyLevel}
          levels={learnLevels}
          difficulty={learnProgress.difficulty}
          progress={learnProgress}
          onWin={handleStudyWin}
          onBack={() => setScreen('learn-map')}
        />
      )}
      {screen === 'learn' && learnLevels && !studyLevel && (
        <main className="level-screen">
          <p>That island is not in this level pack.</p>
          <button className="btn btn-quiet" type="button" onClick={() => setScreen('learn-map')}>
            Back to the map
          </button>
        </main>
      )}
    </div>
  );
}

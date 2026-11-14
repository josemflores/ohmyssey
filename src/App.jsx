import { useCallback, useState } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import VoyageMap from './components/VoyageMap.jsx';
import LevelScreen from './components/LevelScreen.jsx';
import { getLevel } from './levels/index.js';
import { clearProgress, loadProgress, markComplete } from './lib/progress.js';

export default function App() {
  const [screen, setScreen] = useState('title');
  const [levelId, setLevelId] = useState(1);
  const [progress, setProgress] = useState(() => loadProgress());

  const handleComplete = useCallback((id) => {
    setProgress(markComplete(id));
  }, []);

  function handleReset() {
    clearProgress();
    setProgress(loadProgress());
  }

  const level = getLevel(levelId);

  return (
    <div className="app-shell">
      {screen === 'title' && (
        <TitleScreen hasProgress={progress.completed.length > 0} onBegin={() => setScreen('map')} />
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
        <LevelScreen key={level.id} level={level} onComplete={handleComplete} onBack={() => setScreen('map')} />
      )}
    </div>
  );
}

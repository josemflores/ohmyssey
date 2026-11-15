import { useState } from 'react';
import IntroScreen from './components/IntroScreen.jsx';
import Level2World from './components/Level2World.jsx';
import LessonsTip from './components/LessonsTip.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import PauseMenu from './components/PauseMenu.jsx';
import TroyLearn from './components/TroyLearn.jsx';
import TroyWorld from './components/TroyWorld.jsx';
import JourneyMap from './components/JourneyMap.jsx';
import VoyageScreen from './components/VoyageScreen.jsx';
import { applySettings, loadSettings } from './lib/settings.js';

// The playable path for the hackathon demo:
//   login → story intro → a word on Lessons → Troy → journey map → a short
//   sail → Ithaca
//
// Dev mode and ?level2 open Ithaca directly. They skip the map and the sail.
// ?voyage still plays the long card sequence. ?journeymap opens the map.
//
// TroyLearn sits on top of the city. It opens Ask Athena and the two
// lessons in the current scope (Troy, then Ithaca). It does not replace
// the login, the story, or the walk.

function openingScreen() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('level2')) return 'level2';
  if (params.has('voyage')) return 'voyage';
  if (params.has('journeymap')) return 'journey';
  return 'login';
}

// Brightness and text size apply before the first screen draws.
applySettings(loadSettings());

const LEVEL_NAMES = { world: 'Level 1 · Troy', level2: 'Level 2 · Ithaca' };

export default function App() {
  const [screen, setScreen] = useState(openingScreen);
  // Bumping this remounts the world, which restarts the level from scratch.
  const [run, setRun] = useState(0);

  function goto(next) {
    setScreen(next);
    setRun((n) => n + 1);
  }

  return (
    <div className="app-shell">
      {screen === 'login' && <LoginScreen onEnter={() => setScreen('intro')} />}
      {screen === 'intro' && <IntroScreen onBegin={() => setScreen('tip')} />}
      {screen === 'tip' && <LessonsTip onDone={() => setScreen('world')} />}
      {screen === 'world' && (
        <>
          <TroyWorld
            key={run}
            onSail={() => goto('journey')}
            onHome={() => goto('login')}
            onRestart={() => setRun((n) => n + 1)}
          />
          <TroyLearn />
        </>
      )}
      {screen === 'journey' && <JourneyMap key={run} onChoose={() => goto('sail')} />}
      {screen === 'sail' && <VoyageScreen brief key={run} onArrive={() => goto('level2')} />}
      {screen === 'voyage' && <VoyageScreen key={run} onArrive={() => goto('level2')} />}
      {screen === 'level2' && (
        <>
          <Level2World key={run} onHome={() => goto('login')} />
          <TroyLearn />
        </>
      )}
      {LEVEL_NAMES[screen] && (
        <PauseMenu
          levelName={LEVEL_NAMES[screen]}
          onHome={() => goto('login')}
          onReset={() => setRun((n) => n + 1)}
          onGoto={goto}
        />
      )}
    </div>
  );
}

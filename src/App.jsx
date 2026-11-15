import { useState } from 'react';
import IntroScreen from './components/IntroScreen.jsx';
import Level2World from './components/Level2World.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import PauseMenu from './components/PauseMenu.jsx';
import TroyLearn from './components/TroyLearn.jsx';
import TroyWorld from './components/TroyWorld.jsx';
import { applySettings, loadSettings } from './lib/settings.js';

// The playable path for the hackathon demo:
//   login  →  story intro  →  Troy at night
//
// TroyLearn sits on top of the city. It opens Ask Athena and the two
// lessons in the current scope (Troy, then Ithaca). It does not replace
// the login, the story, or the walk.

// ?level2 in the URL opens Level 2 (Ithaca) directly, for building and
// testing it before it joins the story flow.
function openingScreen() {
  return new URLSearchParams(window.location.search).has('level2') ? 'level2' : 'login';
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
      {screen === 'intro' && <IntroScreen onBegin={() => setScreen('world')} />}
      {screen === 'world' && (
        <>
          <TroyWorld key={run} />
          <TroyLearn />
        </>
      )}
      {screen === 'level2' && (
        <>
          <Level2World key={run} />
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

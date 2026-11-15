import { useState } from 'react';
import IntroScreen from './components/IntroScreen.jsx';
import Level2World from './components/Level2World.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import TroyWorld from './components/TroyWorld.jsx';

// The playable path for the hackathon demo:
//   login  →  story intro  →  Troy at night
//
// The older voyage (islands, circuits, the study map) still lives in
// src/components, src/learn, and src/levels. It is not mounted here.
// Wire those screens back in when the circuit lessons rejoin the story.

// ?level2 in the URL opens Level 2 (Ithaca) directly, for building and
// testing it before it joins the story flow.
function openingScreen() {
  return new URLSearchParams(window.location.search).has('level2') ? 'level2' : 'login';
}

export default function App() {
  const [screen, setScreen] = useState(openingScreen);

  return (
    <div className="app-shell">
      {screen === 'login' && <LoginScreen onEnter={() => setScreen('intro')} />}
      {screen === 'intro' && <IntroScreen onBegin={() => setScreen('world')} />}
      {screen === 'world' && <TroyWorld />}
      {screen === 'level2' && <Level2World />}
    </div>
  );
}

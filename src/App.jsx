import { useState } from 'react';
import IntroScreen from './components/IntroScreen.jsx';
import IthacaWorld from './components/IthacaWorld.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import TroyWorld from './components/TroyWorld.jsx';

// The playable path for the hackathon demo:
//   login  →  story intro  →  Troy at night  →  Ithaca (catalog level 6)
//
// The rest of the voyage still lives in src/components, src/learn, and
// src/levels. Ithaca is the one circuit lesson wired into the walk.

function openingScreen() {
  const query = new URLSearchParams(window.location.search);
  if (query.has('ithaca')) return 'ithaca';
  if (query.has('world')) return 'world';
  return 'login';
}

export default function App() {
  const [screen, setScreen] = useState(openingScreen);

  return (
    <div className="app-shell">
      {screen === 'login' && <LoginScreen onEnter={() => setScreen('intro')} />}
      {screen === 'intro' && <IntroScreen onBegin={() => setScreen('world')} />}
      {screen === 'world' && <TroyWorld onSail={() => setScreen('ithaca')} />}
      {screen === 'ithaca' && <IthacaWorld />}
    </div>
  );
}

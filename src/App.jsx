import { useState } from 'react';
import EncounterHost from './components/EncounterHost.jsx';
import IntroScreen from './components/IntroScreen.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import TroyWorld from './components/TroyWorld.jsx';

// The playable path for the hackathon demo:
//   login  →  story intro  →  Troy at night
//
// The older voyage (islands, circuits, the study map) still lives in
// src/components, src/learn, and src/levels. It is not mounted here.
// Wire those screens back in when the circuit lessons rejoin the story.

export default function App() {
  const [screen, setScreen] = useState('login');

  return (
    <div className="app-shell">
      {screen === 'login' && <LoginScreen onEnter={() => setScreen('intro')} />}
      {screen === 'intro' && <IntroScreen onBegin={() => setScreen('world')} />}
      {screen === 'world' && <TroyWorld />}
      <EncounterHost />
    </div>
  );
}

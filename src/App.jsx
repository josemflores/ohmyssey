import { useState } from 'react';
import IntroScreen from './components/IntroScreen.jsx';
import Level2World from './components/Level2World.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import TroyLearn from './components/TroyLearn.jsx';
import TroyWorld from './components/TroyWorld.jsx';

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

export default function App() {
  const [screen, setScreen] = useState(openingScreen);

  return (
    <div className="app-shell">
      {screen === 'login' && <LoginScreen onEnter={() => setScreen('intro')} />}
      {screen === 'intro' && <IntroScreen onBegin={() => setScreen('world')} />}
      {screen === 'world' && (
        <>
          <TroyWorld />
          <TroyLearn />
        </>
      )}
      {screen === 'level2' && (
        <>
          <Level2World />
          <TroyLearn />
        </>
      )}
    </div>
  );
}

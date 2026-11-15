import { useEffect, useRef, useState } from 'react';
import { pauseActiveGame, resumeActiveGame, setHitboxes } from '../lib/activeGame.js';
import { applySettings, loadSettings, saveSettings } from '../lib/settings.js';
import { getPlayerName, playerNameError, rememberPlayer } from '../learn/player.js';
import './PauseMenu.css';

// Esc opens this over any world screen. It pauses the Phaser game, and
// offers Resume, Home, Settings, and (when switched on) a dev panel to reset
// the level or jump between levels.
//
// Esc is read in the capture phase, before the world's own handlers. If a
// dialog is already open (a talk box, the hatch quiz, a battle), Esc is left
// for that dialog to close, and the menu stays shut.
// Anything open that already owns Esc: talk boxes, the hatch quiz, battles,
// the Level 1 card, and Athena's lessons.
const DIALOGS = '[role="dialog"]:not(.pause-card), .troy-learn-lesson';

export default function PauseMenu({ levelName, onHome, onReset, onGoto }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('main');
  const [settings, setSettings] = useState(loadSettings);
  const [name, setName] = useState(getPlayerName);
  const [nameNote, setNameNote] = useState('');
  const panel = useRef(null);

  useEffect(() => {
    function onKey(event) {
      // While paused, no key reaches the world or its hotkeys (H, L, E...).
      // Typing still works: stopping propagation does not cancel the keystroke.
      if (open && event.key !== 'Escape') {
        event.stopPropagation();
        return;
      }
      if (event.key !== 'Escape' || event.repeat) return;
      if (!open && document.querySelector(DIALOGS)) return;
      event.preventDefault();
      event.stopPropagation();
      if (open && view !== 'main') setView('main');
      else setOpen((was) => !was);
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, view]);

  // Pause and resume the world with the menu. Resume when the screen leaves.
  useEffect(() => {
    if (!open) return undefined;
    pauseActiveGame();
    setView('main');
    setName(getPlayerName());
    setNameNote('');
    const focusTimer = window.setTimeout(() => panel.current?.querySelector('button')?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      resumeActiveGame();
    };
  }, [open]);

  // Hitboxes follow the setting, also after a level loads or resets.
  useEffect(() => {
    const show = settings.devMode && settings.hitboxes;
    const timer = window.setTimeout(() => setHitboxes(show), 400);
    return () => window.clearTimeout(timer);
  }, [settings.devMode, settings.hitboxes, levelName]);

  function update(patch) {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      applySettings(next);
      return next;
    });
  }

  function saveName(event) {
    event.preventDefault();
    const problem = playerNameError(name);
    if (problem) {
      setNameNote(problem);
      return;
    }
    rememberPlayer(name);
    setNameNote('Saved.');
  }

  function leave(action) {
    setOpen(false);
    action();
  }

  if (!open) {
    return (
      <button className="pause-tab" type="button" onClick={() => setOpen(true)} aria-label="Pause menu (Esc)">
        <kbd>Esc</kbd>
        <span className="pause-tab-word">Menu</span>
      </button>
    );
  }

  return (
    <div className="pause-shade">
      <div ref={panel} className="pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <p className="pause-kicker">{levelName}</p>
        <h2 id="pause-title" className="pause-title">
          {view === 'settings' ? 'Settings' : view === 'dev' ? 'Dev mode' : 'Paused'}
        </h2>

        {view === 'main' && (
          <div className="pause-list">
            <button className="btn btn-primary" type="button" onClick={() => setOpen(false)}>Resume</button>
            <button className="btn btn-quiet" type="button" onClick={() => setView('settings')}>Settings</button>
            {settings.devMode && (
              <button className="btn btn-quiet" type="button" onClick={() => setView('dev')}>Dev mode</button>
            )}
            <button className="btn btn-quiet" type="button" onClick={() => leave(onHome)}>Home</button>
            <p className="pause-note">Home goes back to the sign-in screen. This level starts over next time.</p>
          </div>
        )}

        {view === 'settings' && (
          <div className="pause-list">
            <label className="pause-row">
              <span>Brightness <b>{settings.brightness}%</b></span>
              <input
                type="range"
                min="70"
                max="160"
                step="5"
                value={settings.brightness}
                onChange={(event) => update({ brightness: Number(event.target.value) })}
              />
            </label>
            <label className="pause-check">
              <input
                type="checkbox"
                checked={settings.largeText}
                onChange={(event) => update({ largeText: event.target.checked })}
              />
              <span>Larger text</span>
            </label>
            <form className="pause-name" onSubmit={saveName}>
              <label htmlFor="pause-name-input">Your name</label>
              <div>
                <input
                  id="pause-name-input"
                  value={name}
                  maxLength={20}
                  onChange={(event) => { setName(event.target.value); setNameNote(''); }}
                />
                <button className="btn btn-quiet" type="submit">Save</button>
              </div>
              {nameNote && <p className="pause-note" role="status">{nameNote}</p>}
            </form>
            <label className="pause-check">
              <input
                type="checkbox"
                checked={settings.devMode}
                onChange={(event) => update({ devMode: event.target.checked })}
              />
              <span>Dev mode (reset and skip levels)</span>
            </label>
            <button className="btn btn-quiet" type="button" onClick={() => setView('main')}>← Back</button>
          </div>
        )}

        {view === 'dev' && (
          <div className="pause-list">
            <button className="btn btn-quiet" type="button" onClick={() => leave(onReset)}>Reset this level</button>
            <button className="btn btn-quiet" type="button" onClick={() => leave(() => onGoto('world'))}>Go to Level 1: Troy</button>
            <button className="btn btn-quiet" type="button" onClick={() => leave(() => onGoto('level2'))}>Go to Level 2: Ithaca</button>
            <label className="pause-check">
              <input
                type="checkbox"
                checked={settings.hitboxes}
                onChange={(event) => update({ hitboxes: event.target.checked })}
              />
              <span>Show hitboxes</span>
            </label>
            <button className="btn btn-quiet" type="button" onClick={() => setView('main')}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

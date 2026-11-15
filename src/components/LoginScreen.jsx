import { useEffect, useRef, useState } from 'react';
import {
  GUEST_NAME,
  normalizePlayerName,
  playerNameError,
  rememberPlayer,
  storedPlayerName,
} from '../learn/player.js';
import NightBackdrop from './NightBackdrop.jsx';
import './NightBackdrop.css';
import './LoginScreen.css';

const SIGN_IN_MS = 1200;

// Demo gate. The only thing kept is a display name in this browser.
export default function LoginScreen({ onEnter }) {
  const [remembered] = useState(() => storedPlayerName());
  const [username, setUsername] = useState(remembered);
  const [nameError, setNameError] = useState('');
  const [pending, setPending] = useState('');
  const usernameRef = useRef(null);
  const lock = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    const field = usernameRef.current;
    if (!field) return;
    field.focus();
    if (remembered) field.select();
  }, [remembered]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const nextNameError = playerNameError(username);
    setNameError(nextNameError);
    if (nextNameError) {
      usernameRef.current?.focus();
      return;
    }
    lock.current = true;
    setPending('sign-in');
    rememberPlayer(normalizePlayerName(username));
    timer.current = setTimeout(() => onEnter(), SIGN_IN_MS);
  }

  function playAsGuest() {
    if (lock.current) return;
    lock.current = true;
    setPending('guest');
    rememberPlayer(GUEST_NAME);
    onEnter();
  }

  const busy = Boolean(pending);
  const usernameDescribedBy = nameError
    ? 'login-username-hint login-username-error'
    : 'login-username-hint';

  return (
    <NightBackdrop ship>
      <main className="card login-card" data-screen="login" aria-labelledby="login-title">
        <p className="eyebrow">Ω · hackUTA · the gate</p>
        <h1 className="login-title" id="login-title">
          <Torch />
          <span>OHMYSSEY</span>
          <Torch />
        </h1>
        <div className="meander-rule" aria-hidden="true" />
        <p className="login-lede">The night the wooden horse came through the gates.</p>
        {remembered && (
          <p className="login-back">Welcome back, {remembered}. Your name is filled in.</p>
        )}
        <form onSubmit={submit} noValidate autoComplete="off" aria-busy={busy}>
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              ref={usernameRef}
              name="username"
              value={username}
              autoComplete="off"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="go"
              required
              aria-required="true"
              aria-invalid={nameError ? 'true' : 'false'}
              aria-describedby={usernameDescribedBy}
              disabled={busy}
              maxLength={40}
              onChange={(event) => {
                setUsername(event.target.value);
                if (nameError) setNameError('');
              }}
            />
            <p id="login-username-hint" className="login-hint">2–20 characters.</p>
            {nameError && (
              <p id="login-username-error" className="login-error" role="alert">
                {nameError}
              </p>
            )}
          </div>
          <div className="login-actions">
            <button className="btn login-submit" type="submit" disabled={busy}>
              {pending === 'sign-in' ? 'Signing in…' : 'Log in'}
            </button>
            <button
              className="btn login-skip"
              type="button"
              onClick={playAsGuest}
              disabled={busy}
            >
              <span className="login-skip-label">Skip</span>
              <span className="login-skip-as">Play as {GUEST_NAME}</span>
            </button>
          </div>
          <p className="login-sr" role="status">
            {pending === 'sign-in' ? 'Signing in' : ''}
          </p>
          <p className="login-note">
            Only your display name stays in this browser. Nothing is sent away.
          </p>
        </form>
      </main>
    </NightBackdrop>
  );
}

function Torch() {
  return (
    <svg className="torch" viewBox="0 0 28 48" aria-hidden="true">
      <path className="flame" d="M14 2 C10 10 8 14 10 20 C8 16 6 16 6 22 C6 30 14 32 14 32 C14 32 22 30 22 22 C22 16 20 16 18 20 C20 14 18 10 14 2 Z" />
      <rect x="12" y="30" width="4" height="16" rx="1" fill="#6b4224" />
    </svg>
  );
}

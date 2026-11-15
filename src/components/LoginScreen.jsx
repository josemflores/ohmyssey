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
const PASSWORD_MIN = 4;
const PASSWORD_MAX = 64;

// Demo gate. The username is remembered in this browser.
// The password is checked only so the form can complain, then thrown away.
export default function LoginScreen({ onEnter }) {
  const [remembered] = useState(() => storedPlayerName());
  const [username, setUsername] = useState(remembered);
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pending, setPending] = useState('');
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
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
    const nextPasswordError = optionalPasswordError(password);
    setNameError(nextNameError);
    setPasswordError(nextPasswordError);
    if (nextNameError) {
      usernameRef.current?.focus();
      return;
    }
    if (nextPasswordError) {
      passwordRef.current?.focus();
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
    setPassword('');
    rememberPlayer(GUEST_NAME);
    onEnter();
  }

  const busy = Boolean(pending);
  const usernameDescribedBy = nameError
    ? 'login-username-hint login-username-error'
    : 'login-username-hint';
  const passwordDescribedBy = passwordError
    ? 'login-password-hint login-password-error'
    : 'login-password-hint';

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
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              ref={passwordRef}
              type="password"
              value={password}
              autoComplete="off"
              spellCheck="false"
              enterKeyHint="go"
              aria-invalid={passwordError ? 'true' : 'false'}
              aria-describedby={passwordDescribedBy}
              disabled={busy}
              maxLength={80}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) setPasswordError('');
              }}
            />
            <p id="login-password-hint" className="login-hint">Optional. Not saved.</p>
            {passwordError && (
              <p id="login-password-error" className="login-error" role="alert">
                {passwordError}
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
            Only your name stays in this browser. The password is not saved, and nothing is sent away.
          </p>
        </form>
      </main>
    </NightBackdrop>
  );
}

function optionalPasswordError(value) {
  if (value.trim() === '') return '';
  if (value.trim().length < PASSWORD_MIN) {
    return 'Leave the password blank, or use at least 4 characters.';
  }
  if (value.length > PASSWORD_MAX) return 'Keep the password under 64 characters.';
  return '';
}

function Torch() {
  return (
    <svg className="torch" viewBox="0 0 28 48" aria-hidden="true">
      <path className="flame" d="M14 2 C10 10 8 14 10 20 C8 16 6 16 6 22 C6 30 14 32 14 32 C14 32 22 30 22 22 C22 16 20 16 18 20 C20 14 18 10 14 2 Z" />
      <rect x="12" y="30" width="4" height="16" rx="1" fill="#6b4224" />
    </svg>
  );
}

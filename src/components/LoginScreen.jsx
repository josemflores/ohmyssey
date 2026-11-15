import { useEffect, useRef, useState } from 'react';
import {
  beginPasswordReset,
  clearResetQuery,
  createAccount,
  deliverResetLink,
  finishPasswordReset,
  googleRedirectUri,
  googleSignInUrl,
  profileFromIdToken,
  readGoogleReturn,
  readResetTokenFromLocation,
  rememberGoogleState,
  resetLink,
  signInWithGoogleProfile,
  signInWithPassword,
  takeGoogleState,
} from '../learn/auth.js';
import { GUEST_NAME, rememberPlayer } from '../learn/player.js';
import NightBackdrop from './NightBackdrop.jsx';
import './NightBackdrop.css';
import './LoginScreen.css';

const SIGN_IN_MS = 700;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Gate into the story. Email and password stay in this browser.
// Google leaves this page for Google's account chooser, then comes back
// with the name, email, and photo. Forgot password mails a reset link.
export default function LoginScreen({ onEnter }) {
  const resetToken = useRef(readResetTokenFromLocation());
  const [mode, setMode] = useState(resetToken.current ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetHref, setResetHref] = useState('');
  const [pending, setPending] = useState('');
  const [googleAccount, setGoogleAccount] = useState(null);
  const emailRef = useRef(null);
  const lock = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const returned = readGoogleReturn();
    if (!returned) return;
    const expected = takeGoogleState();
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    if (returned.error) {
      setFormError('Google sign-in was cancelled.');
      return;
    }
    if (!returned.idToken || !expected || returned.state !== expected) return;
    try {
      const profile = profileFromIdToken(returned.idToken);
      const result = signInWithGoogleProfile(profile);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setGoogleAccount(result.profile);
      setMode('google');
    } catch {
      setFormError('Google did not return a usable account.');
    }
  }, []);

  function enterWorld(name) {
    rememberPlayer(name);
    timer.current = setTimeout(() => onEnter(), SIGN_IN_MS);
  }

  function fail(message) {
    lock.current = false;
    setPending('');
    setFormError(message);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (lock.current) return;
    setFormError('');
    setNotice('');
    lock.current = true;

    try {
      if (mode === 'forgot') {
        setPending('forgot');
        const started = beginPasswordReset(email);
        if (!started.ok) {
          fail(started.error);
          return;
        }
        if (started.sent) {
          const link = resetLink(started.token);
          const mailed = await deliverResetLink(email, link);
          lock.current = false;
          setPending('');
          if (mailed.ok) {
            setNotice('If that email has a password account, a reset link is on its way.');
          } else {
            setResetHref(link);
            setNotice('The mail service did not accept the note from this network. The reset link for that email is here.');
          }
          return;
        }
        lock.current = false;
        setPending('');
        setNotice('If that email has a password account, a reset link is on its way.');
        return;
      }

      if (mode === 'reset') {
        if (password !== confirm) {
          fail('The two passwords do not match.');
          return;
        }
        setPending('reset');
        const result = await finishPasswordReset({ token: resetToken.current, password });
        if (!result.ok) {
          fail(result.error);
          return;
        }
        clearResetQuery();
        setPending('sign-in');
        enterWorld(result.name);
        return;
      }

      if (mode === 'create' && password !== confirm) {
        fail('The two passwords do not match.');
        return;
      }

      setPending(mode === 'create' ? 'create' : 'sign-in');
      const result = mode === 'create'
        ? await createAccount({ email, password })
        : await signInWithPassword({ email, password });
      if (!result.ok) {
        fail(result.error);
        return;
      }
      enterWorld(result.name);
    } catch {
      fail('Something went wrong on this gate. Try again.');
    }
  }

  function playAsGuest() {
    if (lock.current) return;
    lock.current = true;
    setPending('guest');
    rememberPlayer(GUEST_NAME);
    onEnter();
  }

  function switchMode(next) {
    if (lock.current) return;
    setMode(next);
    setFormError('');
    setNotice('');
    setResetHref('');
    setPassword('');
    setConfirm('');
  }

  function onGoogle() {
    if (lock.current) return;
    setFormError('');
    setNotice('');
    if (!GOOGLE_CLIENT_ID) {
      setFormError('Google sign-in is not configured for this gate.');
      return;
    }
    const state = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    const nonce = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    rememberGoogleState(state);
    window.location.assign(googleSignInUrl({
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: googleRedirectUri(),
      state,
      nonce,
    }));
  }

  function continueWithGoogle() {
    if (!googleAccount || lock.current) return;
    lock.current = true;
    setPending('sign-in');
    enterWorld(googleAccount.name);
  }

  const busy = Boolean(pending);
  const emailProblem = formError && (mode !== 'reset');
  const title = mode === 'forgot'
    ? 'Forgot password'
    : mode === 'reset'
      ? 'New password'
      : mode === 'create'
        ? 'Create account'
        : 'Log in';

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
        <p className="login-mode">{mode === 'google' ? 'Google account' : title}</p>

        {mode === 'google' && googleAccount && (
          <section className="login-google-card" aria-label="Google account">
            {googleAccount.picture && (
              <img className="login-google-photo" src={googleAccount.picture} alt="" referrerPolicy="no-referrer" />
            )}
            <p className="login-hint">Continue as</p>
            <p className="login-google-name">{googleAccount.name}</p>
            <p className="login-google-email">{googleAccount.email}</p>
            <button className="btn login-submit" type="button" onClick={continueWithGoogle} disabled={busy}>
              {pending === 'sign-in' ? 'Signing in…' : 'Continue'}
            </button>
          </section>
        )}

        {mode !== 'google' && (
        <form onSubmit={onSubmit} noValidate autoComplete="on" aria-busy={busy}>
          {mode !== 'reset' && (
            <div className="login-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                ref={emailRef}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                required
                aria-required="true"
                aria-invalid={emailProblem ? 'true' : 'false'}
                aria-describedby={emailProblem ? 'login-form-error' : undefined}
                disabled={busy}
                maxLength={80}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (formError) setFormError('');
                }}
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-password">{mode === 'reset' ? 'New password' : 'Password'}</label>
                {mode === 'login' && (
                  <button
                    className="login-text-btn"
                    type="button"
                    onClick={() => switchMode('forgot')}
                    disabled={busy}
                  >
                    Forgot password
                  </button>
                )}
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                required
                aria-required="true"
                aria-invalid={formError && mode !== 'forgot' ? 'true' : 'false'}
                disabled={busy}
                maxLength={64}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (formError) setFormError('');
                }}
              />
              {mode !== 'login' && <p className="login-hint">At least 8 characters.</p>}
            </div>
          )}

          {(mode === 'create' || mode === 'reset') && (
            <div className="login-field">
              <label htmlFor="login-confirm">Confirm password</label>
              <input
                id="login-confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                required
                aria-required="true"
                disabled={busy}
                maxLength={64}
                onChange={(event) => {
                  setConfirm(event.target.value);
                  if (formError) setFormError('');
                }}
              />
            </div>
          )}

          {formError && (
            <p id="login-form-error" className="login-error" role="alert">{formError}</p>
          )}
          {notice && (
            <p className="login-notice" role="status">
              {notice}
              {resetHref && (
                <>
                  {' '}
                  <a href={resetHref}>Open the reset link</a>
                </>
              )}
            </p>
          )}

          <div className="login-actions">
            <button className="btn login-submit" type="submit" disabled={busy}>
              {submitLabel(mode, pending)}
            </button>
            {mode === 'login' && (
              <button className="btn login-skip" type="button" onClick={playAsGuest} disabled={busy}>
                <span className="login-skip-label">Skip</span>
                <span className="login-skip-as">Play as {GUEST_NAME}</span>
              </button>
            )}
          </div>

          {mode === 'login' && (
            <button className="btn login-google" type="button" onClick={onGoogle} disabled={busy}>
              <GoogleMark />
              <span>{pending === 'google' ? 'Opening Google…' : 'Log in with Google'}</span>
            </button>
          )}

          <p className="login-switch">
            {mode === 'login' && (
              <button type="button" className="login-text-btn" onClick={() => switchMode('create')} disabled={busy}>
                New here? Create an account
              </button>
            )}
            {mode !== 'login' && (
              <button type="button" className="login-text-btn" onClick={() => switchMode('login')} disabled={busy}>
                Back to log in
              </button>
            )}
          </p>

          <p className="login-sr" role="status">{pending === 'sign-in' ? 'Signing in' : ''}</p>
          <p className="login-note">
            The account stays in this browser. Forgot password emails a reset link when the mail host accepts it.
          </p>
        </form>
        )}
      </main>
    </NightBackdrop>
  );
}

function submitLabel(mode, pending) {
  if (pending === 'sign-in') return 'Signing in…';
  if (pending === 'create') return 'Creating…';
  if (pending === 'forgot') return 'Sending…';
  if (pending === 'reset') return 'Saving…';
  if (mode === 'create') return 'Create account';
  if (mode === 'forgot') return 'Send reset link';
  if (mode === 'reset') return 'Save password';
  return 'Log in';
}

function Torch() {
  return (
    <svg className="torch" viewBox="0 0 28 48" aria-hidden="true">
      <path className="flame" d="M14 2 C10 10 8 14 10 20 C8 16 6 16 6 22 C6 30 14 32 14 32 C14 32 22 30 22 22 C22 16 20 16 18 20 C20 14 18 10 14 2 Z" />
      <rect x="12" y="30" width="4" height="16" rx="1" fill="#6b4224" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg className="login-google-mark" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3L15 2.3A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
    </svg>
  );
}

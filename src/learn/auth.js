/**
 * Accounts for the gate. They stay in this browser.
 * A password is stored as a PBKDF2 hash, never as itself.
 * A reset link is a random token kept here, and mailed to the address.
 */

import { normalizePlayerName, playerNameError, rememberPlayer } from './player.js';

const ACCOUNTS_KEY = 'ohmyssey.accounts';
const RESET_KEY = 'ohmyssey.reset';
const GOOGLE_PROFILE_KEY = 'ohmyssey.google.profile';
const GOOGLE_STATE_KEY = 'ohmyssey.google.state';
const RESET_MS = 30 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 64;

export function normalizeEmail(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

export function emailError(raw) {
  const email = normalizeEmail(raw);
  if (!email) return 'Enter the email on the account.';
  if (!EMAIL_PATTERN.test(email) || email.length > 80) return 'That email does not look complete.';
  return '';
}

export function passwordError(raw) {
  const password = String(raw ?? '');
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD) return 'Use at least 8 characters.';
  if (password.length > MAX_PASSWORD) return 'Keep the password to 64 characters.';
  return '';
}

export function nameFromEmail(email) {
  const local = normalizeEmail(email).split('@')[0] || '';
  const cleaned = local.replace(/[^\p{L}\p{N} '\u2019.-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 20);
  if (!playerNameError(cleaned)) return cleaned;
  const letters = local.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 20);
  if (!playerNameError(letters)) return letters;
  return 'Voyager';
}

export async function createAccount({ email, password }) {
  const emailProblem = emailError(email);
  if (emailProblem) return { ok: false, error: emailProblem };
  const passwordProblem = passwordError(password);
  if (passwordProblem) return { ok: false, error: passwordProblem };
  const address = normalizeEmail(email);
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === address)) {
    return { ok: false, error: 'That email already has an account. Log in instead.' };
  }
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  accounts.push({ email: address, salt, hash, google: false });
  writeAccounts(accounts);
  const name = rememberPlayer(nameFromEmail(address));
  return { ok: true, name };
}

export async function signInWithPassword({ email, password }) {
  const emailProblem = emailError(email);
  if (emailProblem) return { ok: false, error: emailProblem };
  const passwordProblem = passwordError(password);
  if (passwordProblem) return { ok: false, error: passwordProblem };
  const address = normalizeEmail(email);
  const account = readAccounts().find((item) => item.email === address);
  if (!account || account.google) {
    return { ok: false, error: 'No password account for that email. Create one, or use Google.' };
  }
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.hash) return { ok: false, error: 'That password does not match.' };
  const name = rememberPlayer(nameFromEmail(address));
  return { ok: true, name };
}

export function signInWithGoogleProfile({ email, name, picture }) {
  const emailProblem = emailError(email);
  if (emailProblem) return { ok: false, error: 'Google did not share an email.' };
  const address = normalizeEmail(email);
  const accounts = readAccounts();
  const existing = accounts.find((item) => item.email === address);
  if (!existing) {
    accounts.push({ email: address, salt: '', hash: '', google: true });
    writeAccounts(accounts);
  }
  const display = displayName(name, address);
  rememberPlayer(display);
  const profile = {
    email: address,
    name: display,
    picture: typeof picture === 'string' ? picture : '',
  };
  try {
    sessionStorage.setItem(GOOGLE_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // The name is still stored. The portrait is only for this visit.
  }
  return { ok: true, name: display, profile };
}

export function googleProfile() {
  try {
    const raw = sessionStorage.getItem(GOOGLE_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.email !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

// Full-page handoff to Google's account chooser. The browser leaves this
// site and comes back with an access token in the hash.
export function googleSignInUrl({ clientId, redirectUri, state, nonce }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token token',
    scope: 'openid email profile',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    nonce,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function googleRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

export function readGoogleReturn(hash = window.location.hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw || (!raw.includes('id_token') && !raw.includes('access_token') && !raw.includes('error='))) return null;
  const params = new URLSearchParams(raw);
  return {
    accessToken: params.get('access_token') || '',
    idToken: params.get('id_token') || '',
    state: params.get('state') || '',
    error: params.get('error') || '',
  };
}

// The id token already carries the name, email, and photo. Reading it here
// avoids a second request that the browser would block.
export function profileFromIdToken(idToken) {
  const payload = String(idToken || '').split('.')[1] || '';
  if (!payload) return { email: '', name: '', picture: '' };
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const data = JSON.parse(json);
  return {
    email: data.email || '',
    name: data.name || data.given_name || '',
    picture: data.picture || '',
  };
}

export function takeGoogleState() {
  try {
    const state = sessionStorage.getItem(GOOGLE_STATE_KEY) || '';
    sessionStorage.removeItem(GOOGLE_STATE_KEY);
    return state;
  } catch {
    return '';
  }
}

export function rememberGoogleState(state) {
  sessionStorage.setItem(GOOGLE_STATE_KEY, state);
}

export async function fetchGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Google profile was not returned.');
  const data = await response.json();
  return {
    email: data.email || '',
    name: data.name || data.given_name || '',
    picture: data.picture || '',
  };
}

function displayName(name, email) {
  const clean = normalizePlayerName(name);
  if (clean && !playerNameError(clean)) return clean;
  const clipped = clean.slice(0, 20).trim();
  if (clipped && !playerNameError(clipped)) return clipped;
  return nameFromEmail(email);
}

// Starts a reset only when the email has a password account.
// The same sentence is shown either way, so the form does not reveal who is signed up.
export function beginPasswordReset(email) {
  const emailProblem = emailError(email);
  if (emailProblem) return { ok: false, error: emailProblem };
  const address = normalizeEmail(email);
  const account = readAccounts().find((item) => item.email === address && !item.google && item.hash);
  if (!account) return { ok: true, sent: false };
  const token = randomHex(24);
  const record = { email: address, token, exp: Date.now() + RESET_MS };
  try {
    localStorage.setItem(RESET_KEY, JSON.stringify(record));
  } catch {
    return { ok: false, error: 'This browser blocked the reset. Allow storage and try again.' };
  }
  return { ok: true, sent: true, token };
}

export function resetLink(token) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('reset', token);
  return url.toString();
}

export async function deliverResetLink(email, link) {
  try {
    const response = await fetch('/api/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, link }),
    });
    const data = await response.json().catch(() => ({}));
    const ok = response.ok && data.ok === true;
    // A production build drops this branch. The token stays off the page.
    if (!import.meta.env.DEV) return { ok: true };
    const devLink = typeof data.devLink === 'string' ? data.devLink : '';
    return { ok, devLink };
  } catch {
    return import.meta.env.DEV ? { ok: false, devLink: '' } : { ok: true };
  }
}

export async function finishPasswordReset({ token, password }) {
  const passwordProblem = passwordError(password);
  if (passwordProblem) return { ok: false, error: passwordProblem };
  const record = readReset();
  if (!record || record.token !== token || record.exp < Date.now()) {
    clearReset();
    return { ok: false, error: 'That reset link has expired. Ask for a new one.' };
  }
  const accounts = readAccounts();
  const account = accounts.find((item) => item.email === record.email && !item.google);
  if (!account) {
    clearReset();
    return { ok: false, error: 'That account is no longer on this browser.' };
  }
  account.salt = randomHex(16);
  account.hash = await hashPassword(password, account.salt);
  writeAccounts(accounts);
  clearReset();
  const name = rememberPlayer(nameFromEmail(account.email));
  return { ok: true, name };
}

export function readResetTokenFromLocation(search = window.location.search) {
  const token = new URLSearchParams(search).get('reset') || '';
  return /^[a-f0-9]{32,64}$/.test(token) ? token : '';
}

export function clearResetQuery() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('reset')) return;
  url.searchParams.delete('reset');
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', next);
}

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  );
  return bufferToHex(bits);
}

function readAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.email === 'string') : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readReset() {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.token !== 'string' || typeof parsed.email !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearReset() {
  try {
    localStorage.removeItem(RESET_KEY);
  } catch {
    // A locked store just leaves the old token to expire.
  }
}

function randomHex(bytes) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return bufferToHex(buffer);
}

function bufferToHex(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

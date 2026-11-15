// Mails a password reset link. The browser never talks to the mail host,
// so a blocked provider cannot throw a page error.
//
// The HTTP response is a separate question. Production always gets the same
// sentence and never the token. A local dev server may echo the link only
// when it opts in and mail did not go out.

export const RESET_PUBLIC_MESSAGE = 'If that email exists, a link is on its way.';

export function devResetLinkAllowed({ dev = false, env = process.env } = {}) {
  if (env.NODE_ENV === 'production') return false;
  return dev === true || env.OHMYSSEY_RESET_DEV === '1';
}

export function publicResetBody({ link, mailed, dev = false } = {}, env = process.env) {
  const body = { ok: true, message: RESET_PUBLIC_MESSAGE };
  const failed = mailed === false;
  if (failed && devResetLinkAllowed({ dev, env }) && typeof link === 'string' && link) {
    body.devLink = link;
  }
  return body;
}

export async function sendResetMail({ email, link }) {
  if (!email || !link) return { ok: false };
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: 'Reset your Ohmyssey password',
        _template: 'box',
        _captcha: 'false',
        message: `Open this link to choose a new Ohmyssey password. It expires in 30 minutes.\n\n${link}\n\nIf you did not ask, ignore this note.`,
      }),
    });
    const data = await response.json().catch(() => ({}));
    const success = data.success === true || data.success === 'true';
    return { ok: response.ok && success };
  } catch {
    return { ok: false };
  }
}

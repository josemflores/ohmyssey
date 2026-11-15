// Mails a password reset link. The browser never talks to the mail host,
// so a blocked provider cannot throw a page error.

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

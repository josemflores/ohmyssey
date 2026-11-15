import { sendResetMail } from './passwordResetLogic.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }
  const body = readJsonBody(req);
  const result = await sendResetMail({ email: body.email, link: body.link });
  res.status(200).json(result);
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

import { sendResetMail } from './passwordResetLogic.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const result = await sendResetMail({ email: body.email, link: body.link });
  res.status(200).json(result);
}

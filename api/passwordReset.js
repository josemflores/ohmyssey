import { publicResetBody, sendResetMail } from './passwordResetLogic.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json(publicResetBody());
    return;
  }
  const body = readJsonBody(req);
  let mailed = false;
  if (body.email && body.link) {
    const result = await sendResetMail({ email: body.email, link: body.link });
    mailed = result.ok === true;
  }
  // Same body whether or not that address has an account. No token in production.
  res.status(200).json(publicResetBody({ link: body.link, mailed }));
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

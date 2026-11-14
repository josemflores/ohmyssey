/**
 * GET /api/levels
 *
 * The study voyage fetches this before it uses the copy bundled in the
 * client. The body is `{ levels: LevelData[] }`. Vercel has to include the
 * JSON file; see includeFiles in vercel.json.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(dirname(fileURLToPath(import.meta.url)), '../src/learn/mock/levels.json');

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Use GET' });
    return;
  }
  const levels = JSON.parse(readFileSync(file, 'utf8'));
  res.status(200).json({ levels });
}

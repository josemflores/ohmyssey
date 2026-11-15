import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createAthenaReply } from './api/athenaLogic.js';
import { sendResetMail } from './api/passwordResetLogic.js';

/**
 * Vite only bundles the React app. This plugin adds POST /api/athena while
 * you are in `npm run dev`, so Athena can be tried on a laptop before the
 * project is on Vercel. The key is read from .env here, in Node, and is
 * not given a VITE_ prefix, so it is not shipped to the browser.
 *
 * `npm run build` and `vite preview` do not run this plugin. On Vercel the
 * real function is api/athena.js.
 */
function athenaDevPlugin({ apiKey, model }) {
  return {
    name: 'ohmyssey-athena',
    configureServer(server) {
      server.middlewares.use('/api/athena', (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Use POST' });
          return;
        }

        const chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
          size += chunk.length;
          if (size > 100_000) {
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });
        req.on('end', async () => {
          let body = {};
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }
          const result = await createAthenaReply({ body, apiKey, model });
          sendJson(res, 200, result);
        });
        req.on('error', () => {
          if (!res.writableEnded) sendJson(res, 400, { fallback: true, reason: 'upstream' });
        });
      });
    },
  };
}

function levelsDevPlugin() {
  const file = fileURLToPath(new URL('./src/learn/mock/levels.json', import.meta.url));
  return {
    name: 'ohmyssey-levels',
    configureServer(server) {
      server.middlewares.use('/api/levels', (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          sendJson(res, 405, { error: 'Use GET' });
          return;
        }
        try {
          const levels = JSON.parse(readFileSync(file, 'utf8'));
          sendJson(res, 200, { levels });
        } catch {
          sendJson(res, 500, { error: 'Level pack missing' });
        }
      });
    },
  };
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function passwordResetDevPlugin() {
  return {
    name: 'ohmyssey-password-reset',
    configureServer(server) {
      server.middlewares.use('/api/password-reset', (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false });
          return;
        }
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          let body = {};
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }
          const result = await sendResetMail({ email: body.email, link: body.link });
          sendJson(res, 200, result);
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // The empty prefix loads GEMINI_API_KEY from .env into this Node process.
  // Only names that start with VITE_ are exposed to React.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      levelsDevPlugin(),
      athenaDevPlugin({
        apiKey: env.GEMINI_API_KEY || '',
        model: env.GEMINI_MODEL || '',
      }),
      passwordResetDevPlugin(),
    ],
  };
});

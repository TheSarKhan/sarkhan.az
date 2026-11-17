import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const port = Number.parseInt(process.env.DEV_PORT || '3000', 10);
const host = '127.0.0.1';
const distDir = fileURLToPath(new URL('../../frontend/dist', import.meta.url));

const env = { ...process.env };
if (env.NODE_ENV !== 'production' && !env.TURNSTILE_SITE_KEY && !env.TURNSTILE_SECRET_KEY) {
  env.TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
  env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';
}
const app = createApp({ env, allowTurnstileTestKeys: env.NODE_ENV !== 'production' });
app.get(/^\/zehra(?:\/index\.html|\/)?$/, (req, res) => {
  return res.redirect(301, '/zara/' + req.originalUrl.slice(req.path.length));
});
app.get(/^\/(?:index\.html|(?:en|card|en\/card|zara|layiheler\/[a-z0-9-]+|en\/projects\/[a-z0-9-]+)\/index\.html)$/, (req, res) => {
  const route = req.path.slice(0, -'index.html'.length);
  return res.redirect(301, route + req.originalUrl.slice(req.path.length));
});
app.get('/404.html', (_req, res) => res.status(404).sendFile('404.html', { root: distDir }));
app.use(express.static(distDir, { extensions: ['html'] }));
app.use((_req, res) => res.status(404).sendFile('404.html', { root: distDir }));

app.listen(port, host, () => {
  console.log(`[sarkhan-local] Running at http://${host}:${port}`);
});

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { getWalletConfig } from './config.js';
import { buildSignedPkpass, loadSigningCredentials } from './passkit.js';
import { generateVCard } from './vcard.js';
import { fetchWalletWalletPkpass } from './walletwallet.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d(). -]{7,32}$/;
const CONTACT_TOPICS = new Set(['project', 'job', 'other']);
const TURNSTILE_ACTION = 'contact';

/**
 * Create the Express application for Sarkhan Digital Identity APIs.
 * @param {{ env?: NodeJS.ProcessEnv, credentialsOverride?: object, fetchImpl?: typeof fetch, contactLogPath?: string, allowTurnstileTestKeys?: boolean }} [options]
 */
export function createApp({
  env = process.env,
  credentialsOverride = null,
  fetchImpl = fetch,
  contactLogPath = resolve(env.CONTACT_LOG_PATH || './data/messages.jsonl'),
  allowTurnstileTestKeys = false,
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));
  const challengeOrigin = 'https://challenges.cloudflare.com';
  const siteKey = (env.TURNSTILE_SITE_KEY || '').trim();
  const secretKey = (env.TURNSTILE_SECRET_KEY || '').trim();
  const testKeys = /^[123]x0{20,}/.test(siteKey) || /^[123]x0{20,}/.test(secretKey);
  const configured = Boolean(siteKey && secretKey && (!testKeys || allowTurnstileTestKeys));
  const hostnames = new Set((env.TURNSTILE_HOSTNAMES || 'sarkhan.az,www.sarkhan.az')
    .split(',').map((host) => host.trim().toLowerCase()).filter(Boolean));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", challengeOrigin],
          frameSrc: [challengeOrigin, 'https://open.spotify.com'],
          imgSrc: ["'self'", 'data:', 'https://wimg.mk.co.kr', 'https://kpophaven.shop'],
        },
      },
    }),
  );

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again shortly.' },
  });

  app.use('/api', apiLimiter);

  app.get('/api/health', (_req, res) => {
    const walletConfig = getWalletConfig(env);
    res.json({
      status: 'ok',
      walletConfigured: Boolean(credentialsOverride) || walletConfig.configured,
    });
  });

  app.get('/api/wallet/status', (_req, res) => {
    const walletConfig = getWalletConfig(env);
    res.set('Cache-Control', 'no-store');
    res.json({
      configured: Boolean(credentialsOverride) || walletConfig.configured,
    });
  });

  app.get('/api/wallet/apple', async (_req, res) => {
    const walletConfig = getWalletConfig(env);
    const hasOverride = Boolean(credentialsOverride);

    if (!hasOverride && !walletConfig.configured) {
      return res.status(503).json({
        error: 'Apple Wallet pass signing is not configured on this server yet.',
        code: 'WALLET_NOT_CONFIGURED',
      });
    }

    try {
      let pkpassBuffer;

      if (hasOverride || walletConfig.mode === 'local') {
        const credentials =
          credentialsOverride ||
          loadSigningCredentials({
            certPath: walletConfig.certPath,
            keyPath: walletConfig.keyPath,
            p12Path: walletConfig.p12Path,
            password: walletConfig.password,
            wwdrPath: walletConfig.wwdrPath,
          });

        const passTypeId = walletConfig.passTypeId || 'pass.az.sarkhan.test';
        const teamId = walletConfig.teamId || 'TESTTEAMID';

        pkpassBuffer = await buildSignedPkpass({
          passTypeId,
          teamId,
          serialNumber: walletConfig.serialNumber,
          credentials,
        });
      } else {
        pkpassBuffer = await fetchWalletWalletPkpass({
          apiKey: walletConfig.walletWalletApiKey,
          fetchImpl,
        });
      }

      res.set({
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="sarkhan-digital-card.pkpass"',
        'Content-Length': String(pkpassBuffer.length),
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.send(pkpassBuffer);
    } catch (error) {
      console.error('[wallet] Failed to generate signed pass:', error.message);
      return res.status(500).json({
        error: 'Unable to generate Apple Wallet pass right now.',
        code: 'WALLET_GENERATION_FAILED',
      });
    }
  });

  app.get('/api/contact/vcard', (req, res) => {
    const lang = req.query.lang === 'en' ? 'en' : 'az';
    const vcard = generateVCard({ lang });
    const buffer = Buffer.from(vcard, 'utf8');

    res.set({
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sarkhan-babayev.vcf"',
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.send(buffer);
  });

  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many messages sent. Please try again later.' },
  });

  app.get('/api/contact/turnstile', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!configured) return res.status(503).json({ error: 'Verification is unavailable.' });
    return res.json({ siteKey, action: TURNSTILE_ACTION });
  });

  app.post('/api/contact/message', contactLimiter, async (req, res) => {
    const body = req.body || {};
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return res.status(201).json({ ok: true });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const token = typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : '';

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Invalid name (2–100 characters required).' });
    }
    if (!EMAIL_RE.test(email) || email.length > 150) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    const phoneDigits = phone.replace(/\D/g, '').length;
    if (!PHONE_RE.test(phone) || phoneDigits < 7 || phoneDigits > 15) {
      return res.status(400).json({ error: 'Invalid contact number.' });
    }
    if (!CONTACT_TOPICS.has(topic)) {
      return res.status(400).json({ error: 'Invalid contact topic.' });
    }
    if (message.length < 10 || message.length > 2000) {
      return res.status(400).json({ error: 'Message must be between 10 and 2000 characters.' });
    }

    if (!configured) return res.status(503).json({ code: 'TURNSTILE_UNAVAILABLE' });
    if (!token || token.length > 2048) {
      return res.status(400).json({ code: 'TURNSTILE_FAILED' });
    }

    try {
      const response = await fetchImpl(`${challengeOrigin}/turnstile/v0/siteverify`, {
        method: 'POST',
        body: new URLSearchParams({ secret: secretKey, response: token }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return res.status(503).json({ code: 'TURNSTILE_UNAVAILABLE' });
      const result = await response.json();
      if (result.success !== true || (!testKeys && (
        result.action !== TURNSTILE_ACTION || !hostnames.has(result.hostname?.toLowerCase())
      ))) {
        return res.status(400).json({ code: 'TURNSTILE_FAILED' });
      }
    } catch {
      return res.status(503).json({ code: 'TURNSTILE_UNAVAILABLE' });
    }

    try {
      mkdirSync(dirname(contactLogPath), { recursive: true });
      const entry = {
        receivedAt: new Date().toISOString(),
        name,
        email,
        phone,
        topic,
        message,
      };
      appendFileSync(contactLogPath, `${JSON.stringify(entry)}\n`, 'utf8');
      return res.status(201).json({ ok: true });
    } catch (error) {
      console.error('[contact] Failed to persist message:', error.message);
      return res.status(500).json({ error: 'Unable to save message right now.' });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

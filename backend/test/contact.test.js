import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApp } from '../src/app.js';

const payload = {
  name: 'Aysel Məmmədova',
  email: 'aysel@example.com',
  phone: '+994 50 123 45 67',
  topic: 'project',
  message: 'Salam Sərxan, yeni layihə barədə danışmaq istəyirəm.',
  turnstileToken: 'verified-token',
};

function submitContact(base, body) {
  return fetch(`${base}/api/contact/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('contact requires Turnstile and stores the phone and selected topic', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'sarkhan-contact-'));
  const logPath = join(dir, 'messages.jsonl');
  const calls = [];
  const app = createApp({
    env: { TURNSTILE_SITE_KEY: 'public-key', TURNSTILE_SECRET_KEY: 'server-key' },
    contactLogPath: logPath,
    fetchImpl: async (url, options) => {
      calls.push([url, options.body]);
      return Response.json({
        success: true,
        action: options.body.get('response') === payload.turnstileToken ? 'contact' : 'unrelated',
        hostname: 'sarkhan.az',
      });
    },
  });
  const server = app.listen(0, '127.0.0.1');
  t.after(() => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const config = await fetch(`${base}/api/contact/turnstile`);
  assert.deepEqual(await config.json(), { siteKey: 'public-key', action: 'contact' });

  for (const change of [{ phone: '123' }, { topic: 'unknown' }, { turnstileToken: '' }]) {
    const response = await submitContact(base, { ...payload, ...change });
    assert.equal(response.status, 400);
  }
  assert.equal(calls.length, 0);
  assert.equal((await submitContact(base, { ...payload, turnstileToken: 'wrong-action' })).status, 400);
  assert.equal(existsSync(logPath), false);

  const response = await submitContact(base, payload);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  const [url, data] = calls.at(-1);
  assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(data.get('secret'), 'server-key');
  assert.equal(data.get('response'), payload.turnstileToken);
  const saved = JSON.parse(readFileSync(logPath, 'utf8'));
  assert.equal(saved.phone, payload.phone);
  assert.equal(saved.topic, payload.topic);
  assert.equal(saved.email, payload.email);
  assert.equal(Object.hasOwn(saved, 'turnstileToken'), false);
});

test('contact stays protected when production keys are missing', async (t) => {
  const server = createApp({ env: {} }).listen(0, '127.0.0.1');
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await submitContact(base, payload);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: 'TURNSTILE_UNAVAILABLE' });
});

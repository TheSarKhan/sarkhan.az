import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import JSZip from 'jszip';
import forge from 'node-forge';
import { buildPassJson } from '../../wallet/pass-template.mjs';
import { createApp } from '../src/app.js';
import { buildSignedPkpass } from '../src/passkit.js';

/**
 * Generate ephemeral in-memory self-signed test fixture credentials (NOT valid for Apple iOS).
 * Used solely to verify PKCS#7 packaging, manifest hashes, and ZIP structure in automated tests.
 */
function createInMemoryTestCredentials() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(Date.now() - 60_000);
  cert.validity.notAfter = new Date(Date.now() + 86_400_000);
  const attrs = [{ name: 'commonName', value: 'Sarkhan Test Fixture Pass' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return { signerCert: cert, privateKey: keys.privateKey, wwdrCert: cert };
}

test('buildPassJson produces valid generic pass metadata and QR barcode', () => {
  const pass = buildPassJson({
    passTypeIdentifier: 'pass.az.sarkhan.card',
    teamIdentifier: 'ABCD123456',
  });
  assert.equal(pass.formatVersion, 1);
  assert.equal(pass.passTypeIdentifier, 'pass.az.sarkhan.card');
  assert.equal(pass.teamIdentifier, 'ABCD123456');
  assert.equal(pass.organizationName, 'Sarkhan Digital Identity');
  assert.equal(pass.backgroundColor, 'rgb(6, 78, 59)');
  assert.equal(pass.labelColor, 'rgb(212, 175, 103)');
  assert.equal(pass.foregroundColor, 'rgb(248, 247, 243)');
  assert.equal(pass.barcode.format, 'PKBarcodeFormatQR');
  assert.equal(pass.barcode.message, 'https://sarkhan.az/card/');
  assert.equal(pass.barcodes[0].message, 'https://sarkhan.az/card/');
  assert.ok(pass.generic.primaryFields.length > 0);
});

test('buildSignedPkpass packages assets, manifest SHA-1 hashes, and PKCS#7 signature', async () => {
  const credentials = createInMemoryTestCredentials();
  const buffer = await buildSignedPkpass({
    passTypeId: 'pass.az.sarkhan.card',
    teamId: 'ABCD123456',
    credentials,
  });

  const zip = await JSZip.loadAsync(buffer);
  const expectedFiles = [
    'pass.json',
    'manifest.json',
    'signature',
    'icon.png',
    'icon@2x.png',
    'logo.png',
    'logo@2x.png',
    'thumbnail.png',
    'thumbnail@2x.png',
  ];

  for (const name of expectedFiles) {
    assert.ok(zip.file(name), `Missing ${name} in .pkpass archive`);
  }

  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  for (const [name, expectedHash] of Object.entries(manifest)) {
    const fileBuf = await zip.file(name).async('nodebuffer');
    const actualHash = createHash('sha1').update(fileBuf).digest('hex');
    assert.equal(actualHash, expectedHash, `SHA-1 mismatch for ${name}`);
  }

  const sigBuf = await zip.file('signature').async('nodebuffer');
  assert.ok(sigBuf.length > 100, 'PKCS#7 signature should be non-empty');
  const asn1 = forge.asn1.fromDer(forge.util.createBuffer(sigBuf.toString('binary'), 'raw'));
  const p7 = forge.pkcs7.messageFromAsn1(asn1);
  assert.equal(p7.certificates.length, 2);
});

test('GET /api/wallet/apple returns 503 when unconfigured and 200 pkpass when configured', async () => {
  const unconfiguredApp = createApp({ env: {} });
  const srv1 = unconfiguredApp.listen(0);
  try {
    const { port } = srv1.address();
    const statusRes = await fetch(`http://127.0.0.1:${port}/api/wallet/status`);
    assert.equal(statusRes.status, 200);
    assert.deepEqual(await statusRes.json(), { configured: false });

    const passRes = await fetch(`http://127.0.0.1:${port}/api/wallet/apple`);
    assert.equal(passRes.status, 503);
    const body = await passRes.json();
    assert.equal(body.code, 'WALLET_NOT_CONFIGURED');
  } finally {
    srv1.close();
  }

  const credentials = createInMemoryTestCredentials();
  const configuredApp = createApp({ env: {}, credentialsOverride: credentials });
  const srv2 = configuredApp.listen(0);
  try {
    const { port } = srv2.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/wallet/apple`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/vnd.apple.pkpass');
    assert.equal(
      res.headers.get('content-disposition'),
      'attachment; filename="sarkhan-digital-card.pkpass"',
    );
    const arr = new Uint8Array(await res.arrayBuffer());
    assert.ok(arr.byteLength > 1000);
  } finally {
    srv2.close();
  }
});

test('GET /api/wallet/apple uses WalletWallet API when WALLETWALLET_API_KEY is configured', async () => {
  let capturedUrl = '';
  let capturedAuth = '';
  let capturedBody = null;
  const fakePkpass = Buffer.from('PK\x03\x04fake-pkpass-bytes');

  const mockFetch = async (url, init) => {
    capturedUrl = url;
    capturedAuth = init.headers.Authorization;
    capturedBody = JSON.parse(init.body);
    return new Response(fakePkpass, {
      status: 200,
      headers: { 'Content-Type': 'application/vnd.apple.pkpass' },
    });
  };

  const app = createApp({
    env: { WALLETWALLET_API_KEY: 'ww_test_dummy_key' },
    fetchImpl: mockFetch,
  });

  const srv = app.listen(0);
  try {
    const { port } = srv.address();
    const statusRes = await fetch(`http://127.0.0.1:${port}/api/wallet/status`);
    assert.deepEqual(await statusRes.json(), { configured: true });

    const passRes = await fetch(`http://127.0.0.1:${port}/api/wallet/apple`);
    assert.equal(passRes.status, 200);
    assert.equal(passRes.headers.get('content-type'), 'application/vnd.apple.pkpass');
    assert.equal(
      passRes.headers.get('content-disposition'),
      'attachment; filename="sarkhan-digital-card.pkpass"',
    );
    assert.equal(capturedUrl, 'https://api.walletwallet.dev/api/pkpass');
    assert.equal(capturedAuth, 'Bearer ww_test_dummy_key');
    assert.equal(capturedBody.logoText, 'sarkhan.az');
    assert.equal(capturedBody.barcodeValue, 'https://sarkhan.az');
    assert.equal(capturedBody.barcodeFormat, 'QR');
    assert.equal(capturedBody.color, '#FFFFFF');
  } finally {
    srv.close();
  }
});


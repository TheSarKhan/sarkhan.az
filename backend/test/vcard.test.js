import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { escapeVCardValue, generateVCard } from '../src/vcard.js';

test('escapeVCardValue prevents CRLF injection and escapes reserved characters', () => {
  const dirty = 'Sərxan;Test\r\nTEL:12345\\Path,More';
  const clean = escapeVCardValue(dirty);
  assert.equal(clean.includes('\r'), false);
  assert.equal(clean.includes('\n'), false);
  assert.equal(clean, 'Sərxan\\;Test\\nTEL:12345\\\\Path\\,More');
});

test('generateVCard produces valid vCard 3.0 with Azerbaijani UTF-8 and no fabricated fields', () => {
  const vcfAz = generateVCard({ lang: 'az' });
  assert.match(vcfAz, /^BEGIN:VCARD\r\nVERSION:3\.0\r\n/);
  assert.match(vcfAz, /N;CHARSET=UTF-8:Babayev;Sərxan;;;/);
  assert.match(vcfAz, /FN;CHARSET=UTF-8:Sərxan Babayev/);
  assert.match(vcfAz, /EMAIL;TYPE=INTERNET,WORK:serxan\.babayev\.06@gmail\.com/);
  assert.match(vcfAz, /URL;TYPE=WORK:https:\/\/sarkhan\.az\/card/);
  assert.equal(vcfAz.includes('TEL;'), false, 'Should not include fabricated phone number');
  assert.equal(vcfAz.includes('ORG;'), false, 'Should not include fabricated company');
  assert.match(vcfAz, /\r\nEND:VCARD\r\n$/);

  const vcfEn = generateVCard({ lang: 'en' });
  assert.match(vcfEn, /FN;CHARSET=UTF-8:Sarkhan Babayev/);
});

test('GET /api/contact/vcard returns proper headers and UTF-8 vCard payload', async () => {
  const app = createApp({ env: {} });
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/contact/vcard?lang=az`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/vcard/i);
    assert.equal(
      res.headers.get('content-disposition'),
      'attachment; filename="sarkhan-babayev.vcf"',
    );
    const body = await res.text();
    assert.match(body, /FN;CHARSET=UTF-8:Sərxan Babayev/);
  } finally {
    server.close();
  }
});

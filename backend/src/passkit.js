import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import forge from 'node-forge';
import { buildPassJson } from '../../wallet/pass-template.mjs';

const WALLET_ASSETS_DIR = fileURLToPath(new URL('../../wallet/assets', import.meta.url));

/**
 * Parse a PEM or DER certificate file into a node-forge certificate object.
 * @param {Buffer} raw
 * @returns {forge.pki.Certificate}
 */
function parseCertificate(raw) {
  const text = raw.toString('utf8');
  if (text.includes('-----BEGIN CERTIFICATE-----')) {
    return forge.pki.certificateFromPem(text);
  }
  const derBuffer = forge.util.createBuffer(raw.toString('binary'), 'raw');
  const asn1 = forge.asn1.fromDer(derBuffer);
  return forge.pki.certificateFromAsn1(asn1);
}

/**
 * Load signer certificate, private key, and WWDR intermediate certificate.
 * Supports either PEM (cert + key) or PKCS#12 (.p12/.pfx).
 */
export function loadSigningCredentials({
  certPath,
  keyPath,
  p12Path,
  password = '',
  wwdrPath,
}) {
  const wwdrCert = parseCertificate(readFileSync(wwdrPath));

  if (p12Path) {
    const p12Der = forge.util.createBuffer(readFileSync(p12Path).toString('binary'), 'raw');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || [];
    const keyBags =
      p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
        forge.pki.oids.pkcs8ShroudedKeyBag
      ] ||
      p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] ||
      [];

    if (!certBags.length || !keyBags.length) {
      throw new Error('PKCS#12 bundle does not contain both a certificate and private key.');
    }

    return {
      signerCert: certBags[0].cert,
      privateKey: keyBags[0].key,
      wwdrCert,
    };
  }

  const signerCert = parseCertificate(readFileSync(certPath));
  const keyPem = readFileSync(keyPath, 'utf8');
  const privateKey = password
    ? forge.pki.decryptRsaPrivateKey(keyPem, password)
    : forge.pki.privateKeyFromPem(keyPem);

  if (!privateKey) {
    throw new Error('Failed to parse or decrypt Pass Type ID private key.');
  }

  return { signerCert, privateKey, wwdrCert };
}

/**
 * Create a PKCS#7 detached DER signature for manifest.json.
 * @param {Buffer} manifestBuffer
 * @param {{ signerCert: forge.pki.Certificate, privateKey: forge.pki.PrivateKey, wwdrCert: forge.pki.Certificate }} creds
 * @returns {Buffer}
 */
export function signManifest(manifestBuffer, { signerCert, privateKey, wwdrCert }) {
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestBuffer.toString('binary'), 'raw');
  p7.addCertificate(signerCert);
  p7.addCertificate(wwdrCert);
  p7.addSigner({
    key: privateKey,
    certificate: signerCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date(),
      },
    ],
  });

  p7.sign({ detached: true });
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return Buffer.from(der, 'binary');
}

/**
 * Assemble and sign a complete Apple Wallet .pkpass archive buffer.
 * @param {{
 *   passTypeId: string,
 *   teamId: string,
 *   serialNumber?: string,
 *   credentials: { signerCert: forge.pki.Certificate, privateKey: forge.pki.PrivateKey, wwdrCert: forge.pki.Certificate }
 * }} options
 * @returns {Promise<Buffer>}
 */
export async function buildSignedPkpass({ passTypeId, teamId, serialNumber, credentials }) {
  const passJson = buildPassJson({
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    serialNumber,
  });

  const files = new Map();
  files.set('pass.json', Buffer.from(JSON.stringify(passJson, null, 2), 'utf8'));

  const assetNames = readdirSync(WALLET_ASSETS_DIR).filter((name) => name.endsWith('.png'));
  if (!assetNames.includes('icon.png')) {
    throw new Error('Missing required icon.png in wallet/assets.');
  }
  for (const name of assetNames) {
    files.set(name, readFileSync(join(WALLET_ASSETS_DIR, name)));
  }

  const manifest = {};
  for (const [name, content] of files.entries()) {
    manifest[name] = createHash('sha1').update(content).digest('hex');
  }
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const signatureBuffer = signManifest(manifestBuffer, credentials);

  const zip = new JSZip();
  for (const [name, content] of files.entries()) {
    zip.file(name, content);
  }
  zip.file('manifest.json', manifestBuffer);
  zip.file('signature', signatureBuffer);

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

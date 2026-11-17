import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Resolve optional path relative to backend root.
 * @param {string | undefined} raw
 * @returns {string}
 */
function resolvePath(raw) {
  if (!raw || !raw.trim()) return '';
  return resolve(raw.trim());
}

/**
 * Load Apple Wallet signing configuration exclusively from server environment variables.
 * Never log or return raw secrets or filesystem paths in HTTP responses.
 */
export function getWalletConfig(env = process.env) {
  const passTypeId = (env.APPLE_PASS_TYPE_ID || '').trim();
  const teamId = (env.APPLE_TEAM_ID || '').trim();
  const serialNumber = (env.APPLE_PASS_SERIAL_NUMBER || 'sarkhan-babayev-digital-card-v1').trim();
  const certPath = resolvePath(env.APPLE_PASS_CERTIFICATE_PATH);
  const keyPath = resolvePath(env.APPLE_PASS_PRIVATE_KEY_PATH);
  const p12Path = resolvePath(env.APPLE_PASS_P12_PATH);
  const password = env.APPLE_PASS_CERTIFICATE_PASSWORD || '';
  const wwdrPath = resolvePath(env.APPLE_WWDR_CERTIFICATE_PATH);

  const missing = [];
  if (!passTypeId) missing.push('APPLE_PASS_TYPE_ID');
  if (!teamId) missing.push('APPLE_TEAM_ID');
  if (!wwdrPath) missing.push('APPLE_WWDR_CERTIFICATE_PATH');

  const hasPemPair = Boolean(certPath && keyPath);
  const hasP12 = Boolean(p12Path);
  if (!hasPemPair && !hasP12) {
    missing.push('APPLE_PASS_CERTIFICATE_PATH + APPLE_PASS_PRIVATE_KEY_PATH (or APPLE_PASS_P12_PATH)');
  }

  let filesReadable = true;
  const requiredFiles = [wwdrPath, ...(hasP12 ? [p12Path] : [certPath, keyPath])].filter(Boolean);
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      filesReadable = false;
      break;
    }
  }

  const localConfigured = missing.length === 0 && filesReadable;
  const walletWalletApiKey = (env.WALLETWALLET_API_KEY || '').trim();
  const walletWalletConfigured = Boolean(walletWalletApiKey);

  const mode = localConfigured
    ? 'local'
    : walletWalletConfigured
      ? 'walletwallet'
      : 'none';

  return {
    configured: mode !== 'none',
    mode,
    missingCount: missing.length,
    filesReadable,
    passTypeId,
    teamId,
    serialNumber,
    certPath,
    keyPath,
    p12Path,
    password,
    wwdrPath,
    walletWalletApiKey,
  };
}

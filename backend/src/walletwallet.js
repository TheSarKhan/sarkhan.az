import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const identityPath = fileURLToPath(new URL('../../shared/digitalIdentity.json', import.meta.url));
const digitalIdentity = JSON.parse(readFileSync(identityPath, 'utf8'));

const WALLETWALLET_ENDPOINT = 'https://api.walletwallet.dev/api/pkpass';

/**
 * Build the WalletWallet API payload from centralized digitalIdentity.json.
 */
export function buildWalletWalletPayload() {
  const { palette } = digitalIdentity.brand;
  const baseUrl = digitalIdentity.website;

  return {
    barcodeValue: digitalIdentity.website,
    barcodeFormat: 'QR',
    barcodeAltText: 'sarkhan.az',
    organizationName: digitalIdentity.brand.organizationName,
    description: digitalIdentity.brand.description,
    logoText: 'sarkhan.az',
    color: '#FFFFFF',
    foregroundColor: '#1B4332',
    labelColor: '#40795C',
    iconURL: `${baseUrl}/assets/wallet/icon-v3.png`,
    logoURL: `${baseUrl}/assets/wallet/logo-v3.png`,
    thumbnailURL: `${baseUrl}/assets/wallet/thumbnail-v5.png`,
    headerFields: [],
    primaryFields: [
      {
        label: 'RƏQƏMSAL KART',
        value: digitalIdentity.fullName,
      },
    ],
    secondaryFields: [
      {
        label: 'SAHƏ',
        value: digitalIdentity.roles[0],
      },
      {
        label: 'SAYT',
        value: 'sarkhan.az',
      },
    ],
    auxiliaryFields: [
      {
        label: 'İXTİSASLAR',
        value: digitalIdentity.roles.slice(1).join(' · '),
      },
    ],
    backFields: [
      {
        label: 'Rəqəmsal Vizit Kartı',
        value: digitalIdentity.cardUrl,
      },
      {
        label: 'E-poçt',
        value: digitalIdentity.email,
      },
      {
        label: 'LinkedIn',
        value: digitalIdentity.linkedin,
      },
      {
        label: 'GitHub',
        value: digitalIdentity.github,
      },
      {
        label: 'Portfolio',
        value: digitalIdentity.website,
      },
    ],
  };
}

/**
 * Request a signed .pkpass binary from WalletWallet server-side.
 * Never logs or exposes the Bearer API key.
 * @param {{ apiKey: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<Buffer>}
 */
export async function fetchWalletWalletPkpass({ apiKey, fetchImpl = fetch }) {
  if (!apiKey) {
    throw new Error('WALLETWALLET_API_KEY is required');
  }

  const response = await fetchImpl(WALLETWALLET_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildWalletWalletPayload()),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`WalletWallet upstream responded with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length === 0) {
    throw new Error('WalletWallet returned an empty .pkpass payload');
  }
  return buffer;
}

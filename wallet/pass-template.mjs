import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const identityPath = fileURLToPath(new URL('../shared/digitalIdentity.json', import.meta.url));
const digitalIdentity = JSON.parse(readFileSync(identityPath, 'utf8'));

/**
 * Convert #RRGGBB hex string to Apple Wallet "rgb(r, g, b)" format.
 * @param {string} hex
 * @returns {string}
 */
export function hexToAppleRgb(hex) {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Build a standards-compliant Apple Wallet generic pass.json object.
 * @param {{ passTypeIdentifier: string, teamIdentifier: string, serialNumber?: string }} config
 */
export function buildPassJson({
  passTypeIdentifier,
  teamIdentifier,
  serialNumber = 'sarkhan-babayev-digital-card-v1',
}) {
  if (!passTypeIdentifier || !teamIdentifier) {
    throw new Error('passTypeIdentifier and teamIdentifier are required to build pass.json');
  }

  const { palette } = digitalIdentity.brand;
  const barcode = {
    format: 'PKBarcodeFormatQR',
    message: digitalIdentity.cardUrl,
    messageEncoding: 'iso-8859-1',
    altText: 'sarkhan.az/card',
  };

  return {
    formatVersion: 1,
    passTypeIdentifier,
    serialNumber,
    teamIdentifier,
    organizationName: digitalIdentity.brand.organizationName,
    description: digitalIdentity.brand.description,
    logoText: 'SARKHAN',
    foregroundColor: hexToAppleRgb(palette.ivory),
    backgroundColor: hexToAppleRgb(palette.deepGreen),
    labelColor: hexToAppleRgb(palette.goldAccent),
    sharingProhibited: false,
    barcode,
    barcodes: [barcode],
    generic: {
      headerFields: [
        {
          key: 'location',
          label: 'LOCATION',
          value: digitalIdentity.location,
        },
      ],
      primaryFields: [
        {
          key: 'name',
          label: 'DIGITAL IDENTITY',
          value: digitalIdentity.fullName,
        },
      ],
      secondaryFields: [
        {
          key: 'role',
          label: 'ROLE',
          value: digitalIdentity.roles[0],
        },
        {
          key: 'website',
          label: 'WEBSITE',
          value: 'sarkhan.az',
        },
      ],
      auxiliaryFields: [
        {
          key: 'supportingRoles',
          label: 'DISCIPLINES',
          value: digitalIdentity.roles.slice(1).join(' · '),
        },
      ],
      backFields: [
        {
          key: 'cardUrl',
          label: 'Digital Business Card',
          value: digitalIdentity.cardUrl,
        },
        {
          key: 'email',
          label: 'Email',
          value: digitalIdentity.email,
        },
        {
          key: 'linkedin',
          label: 'LinkedIn',
          value: digitalIdentity.linkedin,
        },
        {
          key: 'github',
          label: 'GitHub',
          value: digitalIdentity.github,
        },
        {
          key: 'portfolio',
          label: 'Portfolio',
          value: digitalIdentity.website,
        },
      ],
    },
  };
}

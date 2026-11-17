import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const identityPath = fileURLToPath(new URL('../../shared/digitalIdentity.json', import.meta.url));
const digitalIdentity = JSON.parse(readFileSync(identityPath, 'utf8'));

/**
 * Sanitize and escape a vCard 3.0 text value to prevent CRLF injection and malformed fields.
 * @param {string} value
 * @returns {string}
 */
export function escapeVCardValue(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim();
}

/**
 * Validate a URL string for safe inclusion in a vCard URL field.
 * @param {string} raw
 * @returns {string}
 */
function safeUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

/**
 * Generate a standards-compliant vCard 3.0 string from digitalIdentity.json.
 * Omits any empty or unverified fields.
 * @param {{ lang?: 'az' | 'en' }} [options]
 * @returns {string}
 */
export function generateVCard({ lang = 'az' } = {}) {
  const safeLang = lang === 'en' ? 'en' : 'az';
  const names = digitalIdentity.localizedNames?.[safeLang] || {
    fullName: digitalIdentity.fullName,
    firstName: digitalIdentity.firstName,
    lastName: digitalIdentity.lastName,
  };
  const roles = digitalIdentity.localizedRoles?.[safeLang] || digitalIdentity.roles || [];

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N;CHARSET=UTF-8:${escapeVCardValue(names.lastName)};${escapeVCardValue(names.firstName)};;;`,
    `FN;CHARSET=UTF-8:${escapeVCardValue(names.fullName)}`,
  ];

  if (digitalIdentity.company) {
    lines.push(`ORG;CHARSET=UTF-8:${escapeVCardValue(digitalIdentity.company)}`);
  }

  if (roles.length > 0) {
    lines.push(`TITLE;CHARSET=UTF-8:${escapeVCardValue(roles.join(' · '))}`);
  }

  if (digitalIdentity.phone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCardValue(digitalIdentity.phone)}`);
  }

  if (digitalIdentity.email) {
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCardValue(digitalIdentity.email)}`);
  }

  const cardUrl = safeUrl(digitalIdentity.cardUrl);
  if (cardUrl) {
    lines.push(`URL;TYPE=WORK:${cardUrl}`);
  }

  const website = safeUrl(digitalIdentity.website);
  if (website && website !== cardUrl) {
    lines.push(`URL;TYPE=HOME:${website}`);
  }

  if (digitalIdentity.location) {
    // ADR format: PO Box;Extended;Street;Locality;Region;PostalCode;Country
    const parts = digitalIdentity.location.split(',').map((s) => escapeVCardValue(s.trim()));
    const city = parts[0] || '';
    const country = parts[1] || '';
    lines.push(`ADR;TYPE=WORK;CHARSET=UTF-8:;;${city ? `;${city}` : ';'};;;${country}`);
  }

  const linkedin = safeUrl(digitalIdentity.linkedin);
  if (linkedin) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${linkedin}`);
  }

  const github = safeUrl(digitalIdentity.github);
  if (github) {
    lines.push(`X-SOCIALPROFILE;TYPE=github:${github}`);
  }

  const noteParts = [];
  if (linkedin) noteParts.push(`LinkedIn: ${linkedin}`);
  if (github) noteParts.push(`GitHub: ${github}`);
  if (noteParts.length > 0) {
    lines.push(`NOTE;CHARSET=UTF-8:${escapeVCardValue(noteParts.join('\n'))}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
}

# Apple Wallet PassKit Setup Guide (`sarkhan.az`)

This guide explains how to configure real Apple Wallet signing for `/api/wallet/apple` on your VPS.

## 1. Certificate Types: What You Need vs. What You Do NOT Need

| Certificate / Entitlement | Purpose | Needed for Sarkhan Digital Card? |
|---|---|---|
| **Pass Type ID Certificate** | Signs `.pkpass` files (generic, membership, event, store cards) so iOS Wallet accepts them. | **YES (Required)** |
| **Apple Pay Merchant Certificate** | Decrypts Apple Pay payment tokens for e-commerce checkout. | **NO** (Do not purchase or configure Apple Pay processing) |
| **NFC-Enabled Wallet Pass Entitlement** | Special Apple-approved entitlement for proprietary NFC VAS readers. Standard iPhones cannot emulate NTAG213/MIFARE tags via generic Wallet passes. | **NO** (Use the built-in QR code for Wallet-to-phone sharing) |

---

## 2. Apple Developer Account & Pass Type ID Registration

1. Enroll in the **Apple Developer Program** (individual or organization).
2. Sign in to **Certificates, Identifiers & Profiles** at `https://developer.apple.com/account/resources/identifiers/list/passTypeId`.
3. Click **+** -> select **Pass Type IDs** -> **Continue**.
4. Enter:
   - **Description:** `Sarkhan Digital Business Card`
   - **Identifier:** `pass.az.sarkhan.card` (must start with `pass.`)
5. Register the Pass Type ID.

---

## 3. Generate Private Key & Pass Type ID Certificate

### Option A — Using OpenSSL (Recommended for VPS)

```bash
# 1. Generate a 2048-bit RSA private key (keep this secret!)
openssl genrsa -out pass-key.pem 2048
chmod 600 pass-key.pem

# 2. Create a Certificate Signing Request (CSR)
openssl req -new -key pass-key.pem -out pass.csr \
  -subj "/CN=Sarkhan Digital Card/O=Sarkhan Babayev/C=AZ"
```

1. In Apple Developer Portal, open your Pass Type ID (`pass.az.sarkhan.card`) and click **Create Certificate**.
2. Upload `pass.csr` and download `pass.cer`.
3. Convert `pass.cer` (DER) to PEM:

```bash
openssl x509 -inform DER -in pass.cer -out pass-cert.pem
```

### Option B — Using macOS Keychain Access (`.p12` export)

1. Open **Keychain Access** -> **Certificate Assistant** -> **Request a Certificate From a Certificate Authority** -> save to disk.
2. Upload CSR to Apple Developer Portal and download `pass.cer`.
3. Double-click `pass.cer` to import it into Keychain Access.
4. Expand the certificate, select both the certificate and its private key, right-click -> **Export 2 items…** -> save as `pass.p12` with a strong password.

---

## 4. Download Apple WWDR Intermediate Certificate

Download Apple's **Worldwide Developer Relations (WWDR G4)** intermediate certificate from Apple's PKI page (`https://www.apple.com/certificateauthority/`):

```bash
curl -fsSL https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer -o AppleWWDRCAG4.cer
```

---

## 5. Server Environment Configuration (VPS)

Place certificates in a root/service-owned directory **outside** the web root and **never** inside Git:

```bash
sudo mkdir -p /etc/sarkhan-wallet/certs
sudo chmod 750 /etc/sarkhan-wallet /etc/sarkhan-wallet/certs
# Copy pass-cert.pem, pass-key.pem (or pass.p12), and AppleWWDRCAG4.cer into /etc/sarkhan-wallet/certs/
sudo chmod 640 /etc/sarkhan-wallet/certs/*
```

Create `/etc/sarkhan-wallet/sarkhan-api.env` (see `backend/.env.example`):

```env
PORT=3001
HOST=127.0.0.1
APPLE_PASS_TYPE_ID=pass.az.sarkhan.card
APPLE_TEAM_ID=YOUR_10_CHAR_TEAM_ID
APPLE_PASS_SERIAL_NUMBER=sarkhan-babayev-digital-card-v1
APPLE_PASS_CERTIFICATE_PATH=/etc/sarkhan-wallet/certs/pass-cert.pem
APPLE_PASS_PRIVATE_KEY_PATH=/etc/sarkhan-wallet/certs/pass-key.pem
APPLE_PASS_CERTIFICATE_PASSWORD=
APPLE_WWDR_CERTIFICATE_PATH=/etc/sarkhan-wallet/certs/AppleWWDRCAG4.cer
```

---

## 6. Local Testing & Real iPhone Verification

1. Run backend automated tests (uses ephemeral in-memory test keys, not Apple certs):
   ```bash
   cd backend && npm test
   ```
2. Once real Apple credentials are configured in `backend/.env`:
   - Start backend: `cd backend && npm start`
   - Check status: `curl http://127.0.0.1:3001/api/wallet/status` -> `{"configured":true}`
   - Download pass: `curl -I http://127.0.0.1:3001/api/wallet/apple` -> `Content-Type: application/vnd.apple.pkpass`
   - Open `https://sarkhan.az/card` on a **real iPhone in Safari** and tap **Apple Wallet-a əlavə et**. Confirm the native Wallet preview sheet opens and **Add** succeeds.

---

## 7. VPS Deployment (Nginx + systemd)

Reference templates are provided in:
- `backend/deploy/nginx.conf.example`
- `backend/deploy/sarkhan-api.service.example`

---

## 8. Certificate Renewal Procedure

Apple Pass Type ID certificates are valid for **1 year**. Before expiration:
1. Create a new CSR using your existing (or newly rotated) private key.
2. Generate a new Pass Type ID certificate in Apple Developer Portal.
3. Replace `pass-cert.pem` (and `pass-key.pem` if rotated) in `/etc/sarkhan-wallet/certs/`.
4. Restart the backend service: `sudo systemctl restart sarkhan-api`.
5. Existing passes already installed on users' iPhones remain valid, while new downloads use the renewed certificate.

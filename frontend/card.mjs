import QRCode from 'qrcode';

const CANONICAL_CARD_URL = 'https://sarkhan.az/card';

function isAppleWalletCapable() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isMacSafari =
    /Macintosh/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/i.test(ua);
  return isIOS || isIPadOS || isMacSafari;
}

function initModals() {
  const triggers = document.querySelectorAll('[data-modal-open]');
  let lastFocused = null;

  const closeModal = (dialog) => {
    if (!dialog || !dialog.open) return;
    dialog.close();
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  };

  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-open');
      const dialog = document.getElementById(targetId);
      if (!dialog) return;
      lastFocused = btn;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    });
  });

  document.querySelectorAll('dialog.card-dialog').forEach((dialog) => {
    dialog.querySelectorAll('[data-modal-close]').forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => closeModal(dialog));
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeModal(dialog);
    });
  });
}

async function renderBrandedQr(canvas, width) {
  await QRCode.toCanvas(canvas, CANONICAL_CARD_URL, {
    width,
    margin: 3,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#1B4332',
      light: '#FFFFFF',
    },
  });

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  await new Promise((resolve) => {
    const logo = new Image();
    logo.onload = () => {
      const boxSize = Math.round(canvas.width * 0.22);
      const x = Math.round((canvas.width - boxSize) / 2);
      const y = Math.round((canvas.height - boxSize) / 2);
      const r = Math.round(boxSize * 0.22);

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(x, y, boxSize, boxSize, r);
      ctx.fill();

      const pad = Math.round(boxSize * 0.14);
      ctx.drawImage(logo, x + pad, y + pad, boxSize - pad * 2, boxSize - pad * 2);
      resolve();
    };
    logo.onerror = () => resolve();
    logo.src = '/assets/wallet/logo.png';
  });
}

async function initQrExperience() {
  const canvas = document.getElementById('card-qr-canvas');
  const downloadBtn = document.getElementById('qr-download-btn');
  const copyBtn = document.getElementById('qr-copy-btn');
  const copyStatus = document.getElementById('qr-copy-status');
  if (!canvas) return;

  try {
    await renderBrandedQr(canvas, 260);
  } catch (err) {
    console.error('[qr] Failed to render QR canvas:', err);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      try {
        const exportCanvas = document.createElement('canvas');
        await renderBrandedQr(exportCanvas, 1024);
        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'sarkhan-card-qr.png';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        console.error('[qr] Failed to export PNG:', err);
      }
    });
  }

  if (copyBtn && copyStatus) {
    copyBtn.addEventListener('click', async () => {
      const ok = await copyText(CANONICAL_CARD_URL);
      copyStatus.textContent = ok
        ? copyBtn.dataset.copiedText || 'Copied'
        : copyBtn.dataset.copyFailText || CANONICAL_CARD_URL;
    });
  }
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function initShareButton() {
  const shareBtn = document.getElementById('share-profile-btn');
  const statusEl = document.getElementById('share-status');
  const fallbackBox = document.getElementById('share-manual-fallback');
  const fallbackInput = document.getElementById('share-manual-input');
  if (!shareBtn || !statusEl) return;

  shareBtn.addEventListener('click', async () => {
    const title = shareBtn.dataset.shareTitle || 'Sərxan Babayev — Digital Business Card';
    const text =
      shareBtn.dataset.shareText || 'Product Owner · IT Project Manager · Business Analyst';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: CANONICAL_CARD_URL });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    const copied = await copyText(CANONICAL_CARD_URL);
    if (copied) {
      statusEl.textContent = shareBtn.dataset.copiedMsg || 'Link copied';
      statusEl.hidden = false;
      if (fallbackBox) fallbackBox.hidden = true;
      setTimeout(() => {
        statusEl.hidden = true;
      }, 3200);
    } else if (fallbackBox && fallbackInput) {
      fallbackInput.value = CANONICAL_CARD_URL;
      fallbackBox.hidden = false;
      fallbackInput.focus();
      fallbackInput.select();
    }
  });
}

async function initAppleWalletButton() {
  const btn = document.getElementById('apple-wallet-btn');
  const noteEl = document.getElementById('wallet-state-note');
  if (!btn || !noteEl) return;

  const messages = {
    loading: btn.dataset.msgLoading || 'Checking Apple Wallet status…',
    ready: btn.dataset.msgReady || '',
    unavailable:
      btn.dataset.msgUnavailable ||
      'Apple Wallet signing is not configured yet. Use Save Contact or QR Code.',
    unsupported:
      btn.dataset.msgUnsupported ||
      'Apple Wallet requires iPhone, iPad, or Mac Safari. Use Save Contact or QR Code on this device.',
    error:
      btn.dataset.msgError ||
      'Unable to reach the Wallet service right now. Please use Save Contact.',
    downloading:
      btn.dataset.msgDownloading ||
      'Opening Apple Wallet pass preview… Confirm "Add" in Wallet to save.',
  };

  const setState = (state, customNote) => {
    btn.dataset.walletState = state;
    const isInteractive = state === 'ready' || state === 'idle';
    btn.disabled = !isInteractive;
    btn.setAttribute('aria-disabled', String(!isInteractive));
    const text = customNote !== undefined ? customNote : messages[state] || '';
    noteEl.textContent = text;
    noteEl.hidden = !text;
  };

  setState('loading');

  let configured = false;
  try {
    const res = await fetch('/api/wallet/status', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      configured = Boolean(data && data.configured);
    }
  } catch {
    setState('unavailable');
    return;
  }

  if (!configured) {
    setState('unavailable');
    return;
  }

  if (!isAppleWalletCapable()) {
    setState('unsupported');
    return;
  }

  setState('ready');

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    setState('loading', messages.loading);
    try {
      const probe = await fetch('/api/wallet/status', { cache: 'no-store' });
      if (!probe.ok) {
        setState('error');
        return;
      }
      const status = await probe.json();
      if (!status.configured) {
        setState('unavailable');
        return;
      }
      setState('ready', messages.downloading);
      window.location.assign('/api/wallet/apple');
    } catch {
      setState('error');
    }
  });
}

function initEmailCopy() {
  const btn = document.getElementById('copy-email-btn');
  const status = document.getElementById('copy-email-status');
  if (!btn || !status) return;
  btn.addEventListener('click', async () => {
    const email = btn.dataset.email || '';
    const ok = await copyText(email);
    status.textContent = ok ? btn.dataset.copiedText || 'Copied' : email;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  initQrExperience();
  initShareButton();
  initAppleWalletButton();
  initEmailCopy();
});

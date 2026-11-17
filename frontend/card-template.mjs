const cardCopy = {
  az: {
    pageTitle: 'Sərxan Babayev | Digital Business Card',
    pageDescription:
      'Sərxan Babayev — Product Owner, IT Project Manager və Biznes Analitik. Əlaqə məlumatları və rəqəmsal vizit kartı.',
    badge: 'Rəqəmsal Vizit Kartı',
    saveContact: 'Kontaktı yadda saxla',
    addToWallet: 'Apple Wallet-a əlavə et',
    shareProfile: 'Profili paylaş',
    showQr: 'QR kodu göstər',
    shareIphone: 'iPhone ilə paylaş',
    contactMe: 'Əlaqə saxla',
    copiedLink: 'Keçid buferə kopyalandı',
    manualCopyLabel: 'Keçidi əl ilə kopyalayın:',
    walletMsgLoading: 'Apple Wallet statusu yoxlanılır…',
    walletMsgUnavailable:
      'Apple Wallet imzalanması hazırda serverdə aktiv deyil. Kontaktı yadda saxla və ya QR koddan istifadə edin.',
    walletMsgUnsupported:
      'Apple Wallet yalnız iPhone, iPad və ya Mac Safari-də dəstəklənir. Bu cihazda Kontaktı yadda saxla və ya QR koddan istifadə edin.',
    walletMsgError:
      'Apple Wallet xidməti ilə əlaqə yaradılmadı. Kontaktı yadda saxla düyməsindən istifadə edin.',
    walletMsgDownloading:
      'Apple Wallet kartı açılır… Əlavə etmək üçün Wallet pəncərəsində "Add" seçin.',
    aboutTitle: 'Haqqımda',
    linksTitle: 'Profillər və Əlaqə',
    projectsTitle: 'Seçilmiş Layihələr',
    cvTitle: 'CV Yüklə (PDF)',
    collabTitle: 'Əməkdaşlıq',
    collabText:
      'Yeni məhsul, IT layihə idarəçiliyi və ya biznes analizi üzrə əməkdaşlıq üçün birbaşa əlaqə saxlaya bilərsiniz.',
    qrModalTitle: 'QR Kod',
    qrDownload: 'PNG Yüklə',
    qrCopy: 'Linki kopyala',
    qrCopied: 'Kopyalandı ✓',
    close: 'Bağla',
    nameDropTitle: 'iPhone ilə paylaş (NameDrop)',
    nameDropIntro:
      'NameDrop Apple-ın sistem daxili funksiyasıdır və vebsayt tərəfindən avtomatik işə salına bilməz. iPhone-dan kontakt kartınızı paylaşmaq üçün:',
    nameDropSteps: [
      'iPhone-da Contacts (Kontaktlar) tətbiqini açın və yuxarıdakı "My Card" bölməsinə daxil olun.',
      'Şəxsi məlumatlarınızı, şəklinizi və sarkhan.az/card vebsayt ünvanını əlavə edib Contact Poster yaradın.',
      'Settings → General → AirDrop bölməsində "Bringing Devices Together" seçimini aktiv edin.',
      'İki uyğun iPhone-un üst hissəsini bir-birinə yaxınlaşdırın və paylaşmaq istədiyiniz məlumatı seçin.',
    ],
    nameDropNote:
      'Qeyd: NameDrop sizin iPhone Kontakt kartınızı paylaşır, Apple Wallet kartını deyil. Qarşı tərəfə rəqəmsal vizit kartınızı dərhal ötürmək üçün aşağıdakı vCard yükləməsindən və ya Apple Wallet QR kodundan istifadə edə bilərsiniz.',
    contactModalTitle: 'Birbaşa Əlaqə',
    copyEmail: 'E-poçtu kopyala',
    emailCopied: 'E-poçt kopyalandı ✓',
  },
  en: {
    pageTitle: 'Sarkhan Babayev | Digital Business Card',
    pageDescription:
      'Sarkhan Babayev — Product Owner, IT Project Manager and Business Analyst. Contact details and digital business card.',
    badge: 'Digital Business Card',
    saveContact: 'Save Contact',
    addToWallet: 'Add to Apple Wallet',
    shareProfile: 'Share Profile',
    showQr: 'Show QR Code',
    shareIphone: 'Share with iPhone',
    contactMe: 'Contact',
    copiedLink: 'Card URL copied to clipboard',
    manualCopyLabel: 'Copy link manually:',
    walletMsgLoading: 'Checking Apple Wallet status…',
    walletMsgUnavailable:
      'Apple Wallet signing is not configured on this server yet. Use Save Contact or QR Code.',
    walletMsgUnsupported:
      'Apple Wallet is supported on iPhone, iPad, or Mac Safari. Use Save Contact or QR Code on this device.',
    walletMsgError:
      'Could not reach the Wallet service right now. Please use Save Contact.',
    walletMsgDownloading:
      'Opening Apple Wallet pass preview… Confirm "Add" in Wallet to save.',
    aboutTitle: 'About',
    linksTitle: 'Profiles & Links',
    projectsTitle: 'Featured Projects',
    cvTitle: 'Download CV (PDF)',
    collabTitle: 'Collaboration',
    collabText:
      'Reach out directly for product strategy, IT project management, or business analysis opportunities.',
    qrModalTitle: 'QR Code',
    qrDownload: 'Download PNG',
    qrCopy: 'Copy URL',
    qrCopied: 'Copied ✓',
    close: 'Close',
    nameDropTitle: 'Share with iPhone (NameDrop)',
    nameDropIntro:
      'NameDrop is a native Apple iOS feature and cannot be triggered programmatically from a website. To share your contact card on iPhone:',
    nameDropSteps: [
      'Open the Contacts app on iPhone and tap "My Card" at the top.',
      'Add your details, photo, and sarkhan.az/card website, and customize your Contact Poster.',
      'Ensure Settings → General → AirDrop → "Bringing Devices Together" is enabled.',
      'Hold the top of your iPhone close to another compatible iPhone and choose what to share.',
    ],
    nameDropNote:
      'Note: NameDrop shares your native iPhone Contact Card rather than an Apple Wallet pass. You can also use Save Contact (.vcf) below or share the Wallet QR code.',
    contactModalTitle: 'Direct Contact',
    copyEmail: 'Copy email',
    emailCopied: 'Email copied ✓',
  },
};

export function getCardMeta(lang) {
  return cardCopy[lang === 'en' ? 'en' : 'az'];
}

export function renderCardPage({ lang, identity, projects, siteCopy, escape }) {
  const m = getCardMeta(lang);
  const name = identity.localizedNames?.[lang]?.fullName || identity.fullName;
  const roles = identity.localizedRoles?.[lang] || identity.roles;
  const featuredSlugs = ['voint', 'avankart', 'ces', 'fanus', 'testup'];
  const featured = featuredSlugs
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter(Boolean);
  const projectHref = (p) => `${lang === 'en' ? '/en/projects' : '/layiheler'}/${p.slug}/`;

  return `<div class="card-shell">
  <section class="identity-card" aria-label="${escape(m.badge)}">
    <div class="identity-top">
      <div class="identity-brand">
        <img class="identity-logo" src="/assets/wallet/logo.png" alt="sarkhan.az" width="28" height="28">
        <span>sarkhan.az</span>
      </div>
      <span class="identity-location">${escape(identity.location)}</span>
    </div>
    <div class="identity-center">
      <div class="identity-avatar-ring">
        <img class="identity-avatar" src="${identity.avatarUrl}" alt="${escape(name)}" fetchpriority="high">
      </div>
      <h1 class="identity-name">${escape(name)}</h1>
      <p class="identity-pill">${escape(roles[0])}</p>
      <p class="identity-subroles">${escape(roles.slice(1).join(' · '))}</p>
    </div>
    <svg class="identity-waves" viewBox="0 0 600 72" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,42 C140,12 280,62 440,30 C515,15 565,24 600,34 L600,72 L0,72 Z" fill="#E6F0E8"/>
      <path d="M0,52 C160,68 310,20 470,46 C535,56 575,48 600,42 L600,72 L0,72 Z" fill="#B5D1BC"/>
      <path d="M0,62 C180,44 360,74 600,50 L600,72 L0,72 Z" fill="#2E6644"/>
    </svg>
  </section>

  <section class="card-actions" aria-label="Actions">
    <a class="btn-primary-contact" href="/api/contact/vcard?lang=${lang}" download="sarkhan-babayev.vcf">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      <span>${escape(m.saveContact)}</span>
    </a>

    <button
      id="apple-wallet-btn"
      class="btn-apple-wallet"
      type="button"
      data-msg-loading="${escape(m.walletMsgLoading)}"
      data-msg-unavailable="${escape(m.walletMsgUnavailable)}"
      data-msg-unsupported="${escape(m.walletMsgUnsupported)}"
      data-msg-error="${escape(m.walletMsgError)}"
      data-msg-downloading="${escape(m.walletMsgDownloading)}"
    >
      <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="22.5" height="16.5" rx="3.25" fill="#1C1C1E" stroke="#D4AF67" stroke-width="1.2"/>
        <rect x="2.5" y="3" width="19" height="3" rx="1" fill="#064E3B"/>
        <rect x="2.5" y="6.5" width="19" height="3" rx="1" fill="#D4AF67"/>
        <rect x="2.5" y="10" width="19" height="5" rx="1" fill="#F8F7F3"/>
      </svg>
      <span>${escape(m.addToWallet)}</span>
    </button>
    <p id="wallet-state-note" class="wallet-note" role="status" aria-live="polite" hidden></p>

    <div class="compact-actions">
      <button
        id="share-profile-btn"
        class="btn-compact"
        type="button"
        data-share-title="${escape(m.pageTitle)}"
        data-share-text="${escape(roles.join(' · '))}"
        data-copied-msg="${escape(m.copiedLink)}"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        <span>${escape(m.shareProfile)}</span>
      </button>

      <button class="btn-compact" type="button" data-modal-open="qr-modal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h3"/></svg>
        <span>${escape(m.showQr)}</span>
      </button>

      <button class="btn-compact" type="button" data-modal-open="namedrop-modal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        <span>${escape(m.shareIphone)}</span>
      </button>

      <button class="btn-compact" type="button" data-modal-open="contact-modal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span>${escape(m.contactMe)}</span>
      </button>
    </div>

    <p id="share-status" class="share-feedback" role="status" aria-live="polite" hidden></p>
    <div id="share-manual-fallback" class="share-fallback" hidden>
      <label for="share-manual-input" class="role">${escape(m.manualCopyLabel)}</label>
      <input id="share-manual-input" type="text" readonly value="${identity.cardUrl}">
    </div>
  </section>

  <section class="card-section">
    <h2>${escape(m.linksTitle)}</h2>
    <div class="card-links-grid">
      <a class="card-ext-link" href="${identity.linkedin}" target="_blank" rel="noopener noreferrer"><span>LinkedIn</span><span aria-hidden="true">↗</span></a>
      <a class="card-ext-link" href="${identity.github}" target="_blank" rel="noopener noreferrer"><span>GitHub</span><span aria-hidden="true">↗</span></a>
    </div>
  </section>

  <section class="card-section">
    <h2>${escape(m.aboutTitle)}</h2>
    <p>${escape(siteCopy.aboutText)}</p>
  </section>

  <section class="card-section">
    <h2>${escape(m.projectsTitle)}</h2>
    <ul class="card-projects-list">
      ${featured
        .map(
          (p) => `<li><a href="${projectHref(p)}"><div><strong>${escape(p.name)}</strong><small>${escape(p.role)}</small></div><span aria-hidden="true">↗</span></a></li>`,
        )
        .join('')}
    </ul>
  </section>

  <section class="card-section">
    <h2>${escape(m.cvTitle)}</h2>
    <div class="card-cv-grid">
      <a href="${identity.cvUrls[lang].po}" download>Product Owner <span>PDF ↓</span></a>
      <a href="${identity.cvUrls[lang].itPm}" download>${escape(siteCopy.pm)} <span>PDF ↓</span></a>
      <a href="${identity.cvUrls[lang].itBa}" download>${escape(siteCopy.ba)} <span>PDF ↓</span></a>
    </div>
  </section>

  <section class="card-section">
    <h2>${escape(m.collabTitle)}</h2>
    <p>${escape(m.collabText)}</p>
  </section>
</div>

<dialog id="qr-modal" class="card-dialog" aria-labelledby="qr-modal-title">
  <div class="dialog-body">
    <div class="dialog-head">
      <h3 id="qr-modal-title">${escape(m.qrModalTitle)} — ${escape(name)}</h3>
      <button class="dialog-close" type="button" data-modal-close aria-label="${escape(m.close)}">✕</button>
    </div>
    <div class="qr-frame">
      <canvas id="card-qr-canvas" width="260" height="260" aria-label="QR code for ${identity.cardUrl}"></canvas>
    </div>
    <p class="qr-url">${identity.cardUrl}</p>
    <div class="dialog-actions">
      <button id="qr-download-btn" class="btn-compact" type="button">${escape(m.qrDownload)}</button>
      <button id="qr-copy-btn" class="btn-compact" type="button" data-copied-text="${escape(m.qrCopied)}" data-copy-fail-text="${identity.cardUrl}">${escape(m.qrCopy)}</button>
    </div>
    <p id="qr-copy-status" class="qr-url" role="status" aria-live="polite"></p>
  </div>
</dialog>

<dialog id="namedrop-modal" class="card-dialog" aria-labelledby="namedrop-modal-title">
  <div class="dialog-body">
    <div class="dialog-head">
      <h3 id="namedrop-modal-title">${escape(m.nameDropTitle)}</h3>
      <button class="dialog-close" type="button" data-modal-close aria-label="${escape(m.close)}">✕</button>
    </div>
    <p style="font-size:0.9rem;line-height:1.5;color:var(--muted);">${escape(m.nameDropIntro)}</p>
    <ol class="namedrop-steps">
      ${m.nameDropSteps
        .map(
          (step, idx) =>
            `<li><span class="step-icon" aria-hidden="true">${idx + 1}</span><span>${escape(step)}</span></li>`,
        )
        .join('')}
    </ol>
    <p class="namedrop-callout">${escape(m.nameDropNote)}</p>
    <a class="btn-primary-contact" href="/api/contact/vcard?lang=${lang}" download="sarkhan-babayev.vcf">${escape(m.saveContact)}</a>
  </div>
</dialog>

<dialog id="contact-modal" class="card-dialog" aria-labelledby="contact-modal-title">
  <div class="dialog-body">
    <div class="dialog-head">
      <h3 id="contact-modal-title">${escape(m.contactModalTitle)}</h3>
      <button class="dialog-close" type="button" data-modal-close aria-label="${escape(m.close)}">✕</button>
    </div>
    <div class="contact-modal-list">
      <a class="contact-modal-item" href="mailto:${identity.email}">
        <strong>Email</strong><span>${escape(identity.email)}</span>
      </a>
      <button id="copy-email-btn" class="btn-compact" type="button" data-email="${escape(identity.email)}" data-copied-text="${escape(m.emailCopied)}">${escape(m.copyEmail)}</button>
      <p id="copy-email-status" class="qr-url" role="status" aria-live="polite"></p>
      <a class="contact-modal-item" href="${identity.linkedin}" target="_blank" rel="noopener noreferrer">
        <strong>LinkedIn</strong><span>/in/sarkhan-babayev ↗</span>
      </a>
      <a class="contact-modal-item" href="${identity.github}" target="_blank" rel="noopener noreferrer">
        <strong>GitHub</strong><span>@TheSarKhan ↗</span>
      </a>
    </div>
  </div>
</dialog>`;
}

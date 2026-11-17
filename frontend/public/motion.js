const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const illustrationModule = document.body.dataset.illustrations;
if (illustrationModule && 'IntersectionObserver' in window) {
  const artwork = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    artwork.disconnect();
    import(illustrationModule).catch(() => {});
  }, { rootMargin: '200px' });
  document.querySelectorAll('[data-illustration]').forEach((element) => artwork.observe(element));
}
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const illustrations = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.add('is-animated');
      illustrations.unobserve(target);
    }
  }, { threshold: 0.25 });
  document.querySelectorAll('.work-flow, .work-edge-art').forEach((element) => illustrations.observe(element));
}

const workSection = document.querySelector('#work');

if (workSection && !reducedMotion.matches && 'IntersectionObserver' in window) {
  const narrow = matchMedia('(max-width: 720px)').matches;
  const heading = workSection.querySelector('h2');
  const targets = narrow ? workSection.querySelectorAll('.project-list li') : [heading];
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      if (reducedMotion.matches) continue;
      (narrow ? target : workSection).animate(
        [{ opacity: 0.35, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, easing: 'cubic-bezier(.22, 1, .36, 1)' },
      );
    }
  }, { threshold: 0.2 });
  targets.forEach((target) => observer.observe(target));
}

const work = document.querySelector('[data-work]');
if (work) {
  const preview = work.querySelector('.preview');
  const picture = preview.querySelector('.preview-image');
  const title = preview.querySelector('.preview-title');
  const links = [...work.querySelectorAll('.project-link')];
  let current = links[0];

  function selectProject(link) {
    if (link === current) return;
    current.classList.remove('active');
    current = link;
    current.classList.add('active');
    const { preview: source, title: name } = link.dataset;
    if (source) picture.src = source;
    picture.hidden = !source;
    title.textContent = source ? name : '';
    title.hidden = !source;
  }

  for (const link of links) {
    link.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') selectProject(link);
    });
    link.addEventListener('focus', () => selectProject(link));
  }
}

const cvOrbits = document.querySelector('[data-cv-orbits]');
const cvDialog = document.querySelector('.cv-dialog');
if (cvOrbits && cvDialog) {
  const orbits = [...cvOrbits.querySelectorAll('details')];
  const title = cvDialog.querySelector('h3');
  const image = cvDialog.querySelector('.cv-dialog-page img');
  const page = cvDialog.querySelector('.cv-dialog-page');
  const download = cvDialog.querySelector('.cv-download');
  const openPdf = cvDialog.querySelector('.cv-open');

  for (const orbit of orbits) {
    orbit.querySelector('summary').addEventListener('click', () => {
      for (const other of orbits) {
        if (other !== orbit) other.open = false;
      }
    });
  }

  cvOrbits.addEventListener('click', (event) => {
    const link = event.target.closest('[data-cv-image]');
    if (!link || !cvDialog.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const role = link.closest('details').dataset.cvTitle;
    const language = link.getAttribute('aria-label');
    title.textContent = `${role} · ${language}`;
    image.alt = `${title.dataset.previewLabel} · ${role} · ${language}`;
    image.src = link.dataset.cvImage;
    download.href = openPdf.href = link.href;
    cvDialog.showModal();
    page.scrollTop = 0;
  });

  cvDialog.addEventListener('click', (event) => {
    if (event.target === cvDialog) cvDialog.close();
  });
}

const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  const statusEl = contactForm.querySelector('.contact-form-status');
  const submitBtn = contactForm.querySelector('.contact-submit');
  const message = contactForm.querySelector('textarea');
  const count = contactForm.querySelector('.contact-count');
  const challenge = contactForm.querySelector('[data-contact-turnstile]');
  const progressRegion = contactForm.querySelector('.contact-progress');
  const progress = progressRegion.querySelector('progress');
  const progressCount = progressRegion.querySelector('.contact-progress-count');
  const fields = [...contactForm.querySelectorAll('.contact-field :is(input, select, textarea)')];
  let widgetId;
  let initializing;
  if (message && count) {
    const updateCount = () => { count.textContent = `${message.value.length} / ${message.maxLength}`; };
    count.hidden = false;
    updateCount();
    message.addEventListener('input', updateCount);
    contactForm.addEventListener('reset', () => queueMicrotask(updateCount));
  }

  function updateProgress() {
    let complete = 0;
    for (const field of fields) {
      const value = field.value.trim();
      const validPhone = field.type !== 'tel' ||
        (/^\+?[\d(). -]{7,32}$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g, '')));
      const ready = Boolean(value && field.validity.valid && validPhone &&
        (typeof field.minLength !== 'number' || value.length >= field.minLength));
      field.closest('.contact-field').classList.toggle('is-complete', ready);
      if (ready) complete++;
    }
    progress.value = complete;
    progressCount.textContent = `${complete} / ${fields.length}`;
    contactForm.dataset.completion = String(complete);
  }

  progressRegion.hidden = false;
  updateProgress();
  contactForm.addEventListener('input', updateProgress);
  contactForm.addEventListener('change', updateProgress);
  contactForm.addEventListener('reset', () => queueMicrotask(updateProgress));

  function showStatus(text, error = true) {
    statusEl.textContent = text;
    statusEl.hidden = false;
    statusEl.classList.toggle('is-error', error);
  }

  async function renderChallenge() {
    const response = await fetch('/api/contact/turnstile', { cache: 'no-store' });
    if (!response.ok) throw new Error('Turnstile configuration unavailable');
    const { siteKey, action } = await response.json();
    if (!window.turnstile) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(new Error('Turnstile script unavailable'));
        };
        document.head.append(script);
      });
    }
    widgetId = window.turnstile.render(challenge, {
      sitekey: siteKey,
      action,
      theme: 'light',
      size: message.clientWidth < 300 ? 'compact' : 'flexible',
      appearance: 'interaction-only',
      callback: () => {
        if (statusEl.textContent === contactForm.dataset.verify) statusEl.hidden = true;
      },
      'error-callback': () => {
        showStatus(contactForm.dataset.verifyError);
        return true;
      },
    });
  }

  function ensureChallenge() {
    if (widgetId !== undefined) return Promise.resolve(true);
    initializing ??= renderChallenge().then(() => true, () => false).finally(() => { initializing = undefined; });
    return initializing;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void ensureChallenge();
    }, { rootMargin: '160px' });
    observer.observe(contactForm);
  }

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitBtn.disabled) return;

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = contactForm.dataset.sending || 'Sending…';
    statusEl.hidden = true;
    statusEl.classList.remove('is-error');

    let sentToApi = false;
    try {
      if (!await ensureChallenge()) {
        showStatus(contactForm.dataset.verifyError);
        return;
      }
      const turnstileToken = window.turnstile.getResponse(widgetId);
      if (!turnstileToken) {
        showStatus(contactForm.dataset.verify);
        return;
      }
      const payload = {};
      const formData = new FormData(contactForm);
      for (const name of ['name', 'email', 'phone', 'topic', 'message', 'website']) {
        payload[name] = String(formData.get(name) || '').trim();
      }
      payload.turnstileToken = turnstileToken;
      contactForm.dataset.contactState = 'sending';
      sentToApi = true;
      const res = await fetch('/api/contact/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { code } = await res.json().catch(() => ({}));
        showStatus(code === 'TURNSTILE_FAILED' ? contactForm.dataset.verify :
          code === 'TURNSTILE_UNAVAILABLE' ? contactForm.dataset.verifyError : contactForm.dataset.error);
        return;
      }
      contactForm.reset();
      contactForm.dispatchEvent(new Event('contact:sent'));
      showStatus(contactForm.dataset.sent, false);
    } catch {
      showStatus(contactForm.dataset.error);
    } finally {
      delete contactForm.dataset.contactState;
      if (sentToApi) window.turnstile.reset(widgetId);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

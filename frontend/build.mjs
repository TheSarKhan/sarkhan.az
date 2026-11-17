import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { getCardMeta, renderCardPage } from './card-template.mjs';
import { renderZehraPage, zehraRoute } from './zehra-template.mjs';

const digitalIdentity = JSON.parse(await readFile(new URL('../shared/digitalIdentity.json', import.meta.url)));
const projects = JSON.parse(await readFile(new URL('./projects.json', import.meta.url)));
const domain = digitalIdentity.website;
const linkedin = digitalIdentity.linkedin;
const portraitFile = digitalIdentity.avatarUrl;
const email = digitalIdentity.email;
const github = digitalIdentity.github;
const output = new URL('./dist/', import.meta.url);
const { outputFiles: [illustrations] } = await build({
  entryPoints: [fileURLToPath(new URL('./illustrations.mjs', import.meta.url))],
  bundle: true, minify: true, format: 'esm', write: false,
});
const { outputFiles: [cardBundle] } = await build({
  entryPoints: [fileURLToPath(new URL('./card.mjs', import.meta.url))],
  bundle: true, minify: true, format: 'iife', write: false,
});
const illustrationVersion = createHash('sha256').update(illustrations.contents).digest('hex').slice(0, 12);
const cardBundleVersion = createHash('sha256').update(cardBundle.contents).digest('hex').slice(0, 12);
const assetVersions = Object.fromEntries(await Promise.all(
  ['styles.css', 'card.css', 'motion.js', 'story.js', 'zehra.css'].map(async (name) => {
    const content = await readFile(new URL(`./public/${name}`, import.meta.url));
    return [name, createHash('sha256').update(content).digest('hex').slice(0, 12)];
  }),
));
const featured = ['voint', 'avankart', 'ces', 'fanus', 'testup', 'industry4', 'rrgroup'];

const copy = {
  az: {
    name: 'Sərxan Babayev', role: 'Product Owner və IT biznes analitik',
    description: 'Sərxan Babayevin portfoliosu, məhsul və IT layihələrində təcrübəsi, CV-ləri və əlaqə məlumatları.',
    intro: 'Məhsul strategiyası, yol xəritəsi və texniki komandalarla layihələrin icrası üzərində işləyirəm.',
    workflow: ['Tələblər', 'Yol xəritəsi', 'İcra'],
    work: 'Layihələr', about: 'Haqqımda', contact: 'Əlaqə', cv: 'CV-lər', live: 'Layihənin saytı',
    digitalCard: 'Rəqəmsal vizit kartı',
    aboutText: 'Backend developer kimi başlamışam. Sonra məhsul və layihə idarəçiliyinə keçmişəm. Construction Equipment Services-də məhsul strategiyası və komanda qurulması, Martech-də isə IT layihələrinin idarə olunması üzərində çalışmışam.',
    cvPreview: 'CV önizləməsi', cvDownload: 'PDF yüklə', cvOpen: 'PDF-i aç', close: 'Bağla',
    cvLanguages: ['Azərbaycan dili', 'İngilis dili'],
    contactText: 'İş təklifi və ya yeni layihə üçün mənə yaz.',
    formName: 'Adınız', formEmail: 'E-poçt ünvanınız', formMessage: 'Mesajınız',
    emailContact: 'E-poçtla əlaqə',
    formMessageHint: 'Layihəniz və ya təklifiniz haqqında yazın.',
    formProgress: 'Formanın tamamlanması',
    formPhone: 'Əlaqə nömrəniz', formTopic: 'Müraciət mövzusu', formChooseTopic: 'Mövzu seçin',
    formTopics: ['Layihə və əməkdaşlıq', 'İş təklifi', 'Digər'],
    formVerify: 'Göndərməzdən əvvəl təhlükəsizlik yoxlamasını tamamlayın.',
    formVerifyError: 'Təhlükəsizlik yoxlaması hazırda əlçatan deyil. Bir az sonra yenidən yoxlayın.',
    formSend: 'Mesaj göndər', formSending: 'Göndərilir…',
    formSent: 'Mesajınız göndərildi. Təşəkkür edirəm!',
    formError: 'Göndərmək alınmadı. Zəhmət olmasa sahələri yoxlayın.',
    showreel: 'Layihə vitrini', pause: 'Arxa videonu dayandır', play: 'Arxa videonu oynat',
    scrollToProjects: 'Layihələrə keçmək üçün aşağı sürüşdür',
    ba: 'IT biznes analitik', pm: 'IT layihə meneceri', back: 'Bütün layihələr',
  },
  en: {
    name: 'Sarkhan Babayev', role: 'Product Owner and IT Business Analyst',
    description: 'Sarkhan Babayev’s portfolio, product and IT project experience, CVs, and contact information.',
    intro: 'I work on product strategy, roadmaps, and delivery with technical teams.',
    workflow: ['Requirements', 'Roadmap', 'Delivery'],
    work: 'Work', about: 'About', contact: 'Contact', cv: 'CVs', live: 'Project website',
    digitalCard: 'Digital business card',
    aboutText: 'I started as a backend developer and moved into product and project management. At Construction Equipment Services, I worked on product strategy and team building. At Martech, I managed IT projects.',
    cvPreview: 'CV preview', cvDownload: 'Download PDF', cvOpen: 'Open PDF', close: 'Close',
    cvLanguages: ['Azerbaijani', 'English'],
    contactText: 'Get in touch about a job opportunity or a new project.',
    formName: 'Your name', formEmail: 'Your email', formMessage: 'Message',
    emailContact: 'Email me',
    formMessageHint: 'Tell me about your project or proposal.',
    formProgress: 'Form completion',
    formPhone: 'Contact number', formTopic: 'Topic', formChooseTopic: 'Choose a topic',
    formTopics: ['Project or collaboration', 'Job opportunity', 'Other'],
    formVerify: 'Complete the security check before sending.',
    formVerifyError: 'The security check is currently unavailable. Please try again shortly.',
    formSend: 'Send message', formSending: 'Sending…',
    formSent: 'Your message has been sent. Thank you!',
    formError: 'Could not send message. Please check all fields.',
    showreel: 'Project showcase', pause: 'Pause background video', play: 'Play background video',
    scrollToProjects: 'Scroll down to explore the projects',
    ba: 'IT Business Analyst', pm: 'IT Project Manager', back: 'All projects',
  },
};

const escape = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const href = (lang, project) => {
  const base = lang === 'en' ? '/en/' : '/';
  return project ? `${base}${lang === 'en' ? 'projects' : 'layiheler'}/${project.slug}/` : base;
};
const image = (slug) => `/assets/${slug}.webp`;
const cardHref = (lang) => `${href(lang)}card/`;
const languages = ['az', 'en'];
const alternates = (routeFor) => [...languages, 'x-default'].map((lang) => [
  lang, domain + routeFor(lang === 'x-default' ? 'az' : lang),
]);
const personId = `${domain}/#person`;
const websiteId = `${domain}/#website`;
const icons = `<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" type="image/png" href="/favicon.png" sizes="96x96">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">`;

function searchMetadata({ lang, title, description, routeFor, cover, coverAlt, profile, project }) {
  const c = copy[lang];
  const canonical = domain + routeFor(lang);
  const coverUrl = domain + cover;
  const profilePhoto = domain + digitalIdentity.profilePhotoUrl;
  const person = {
    '@type': 'Person', '@id': personId, name: c.name,
    alternateName: copy[lang === 'az' ? 'en' : 'az'].name,
    url: `${domain}/`, image: profilePhoto,
    jobTitle: digitalIdentity.localizedRoles[lang], sameAs: [linkedin, github],
  };
  const graph = [
    {
      '@type': project ? 'WebPage' : 'ProfilePage',
      '@id': `${canonical}#page`,
      name: title, description, url: canonical, inLanguage: lang,
      isPartOf: { '@id': websiteId },
      primaryImageOfPage: { '@type': 'ImageObject', url: coverUrl, width: 1200, height: 630 },
      ...(project
        ? { author: { '@id': personId }, breadcrumb: { '@id': `${canonical}#breadcrumb` } }
        : { mainEntity: { '@id': personId } }),
    },
    person,
    {
      '@type': 'WebSite', '@id': websiteId, name: digitalIdentity.fullName,
      alternateName: copy.en.name, url: `${domain}/`, inLanguage: languages,
    },
  ];
  if (project) {
    graph.push({
      '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: c.name, item: domain + href(lang) },
        { '@type': 'ListItem', position: 2, name: project.name, item: canonical },
      ],
    });
  }
  const structured = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `${icons}
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${escape(canonical)}">
${alternates(routeFor).map(([code, url]) => `<link rel="alternate" hreflang="${code}" href="${escape(url)}">`).join('\n')}
<meta property="og:type" content="${profile ? 'profile' : 'website'}">
<meta property="og:site_name" content="${escape(digitalIdentity.fullName)}">
<meta property="og:locale" content="${lang === 'az' ? 'az_AZ' : 'en_US'}">
<meta property="og:locale:alternate" content="${lang === 'az' ? 'en_US' : 'az_AZ'}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${escape(canonical)}">
<meta property="og:image" content="${escape(coverUrl)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(coverAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${escape(coverUrl)}">
<meta name="twitter:image:alt" content="${escape(coverAlt)}">
<script type="application/ld+json">${structured}</script>`;
}
const label = (lang, project) => {
  if (project.role === 'IT Project Manager') return copy[lang].pm;
  if (project.role === 'IT Biznes Analitik') return copy[lang].ba;
  return project.role;
};

function homepage(lang, c) {
  const items = featured.map((slug) => projects.find((project) => project.slug === slug));
  const showcase = ['avankart', 'ces', 'testup'].map((slug) => projects.find((project) => project.slug === slug));
  return `<section class="intro story-screen">
    <div class="intro-copy-block"><h1>${c.name.replace(' ', '<br>')}</h1><p class="role">${c.role}</p><p class="intro-copy">${c.intro}</p><a class="reel-link" href="#film">${c.showreel} <span aria-hidden="true">↓</span></a></div>
    <div class="portrait-frame"><img class="portrait" src="${portraitFile}" srcset="/assets/portrait-seated-small.webp 640w, ${portraitFile} 1050w" sizes="(max-width: 720px) 100vw, 50vw" width="1050" height="1313" alt="${c.name}" fetchpriority="high"></div>
  </section>
  <section class="film-track" id="film" data-film aria-label="${c.showreel}">
    <div class="film-stop film-stop-start" aria-hidden="true"></div><div class="film-stop film-stop-reveal" aria-hidden="true"></div>
    <div class="film-screen">
      <video class="film-background" src="/assets/motion-background.mp4" poster="/assets/motion-background.webp" muted playsinline loop preload="none" aria-hidden="true"></video>
      <div class="film-foreground">
        <div class="film-cards" data-film-cards>
          ${showcase.map((project) => `<a class="film-card" href="${project.url}" draggable="false">
            <span class="film-card-media"><img src="${image(project.slug)}" alt="${escape(project.name)}" loading="lazy" draggable="false"></span>
          </a>`).join('')}
        </div>
      </div>
      <a class="film-next" href="#work" hidden>${c.scrollToProjects} <span aria-hidden="true">↓</span></a>
      <button class="film-control" type="button" hidden data-pause="${c.pause}" data-play="${c.play}" aria-label="${c.pause}"><span aria-hidden="true">Ⅱ</span></button>
    </div>
  </section>
  <section id="work" class="story-screen">
    <div class="work-edge-art" aria-hidden="true">
      <div class="work-edge-plan"><i></i><i></i><i></i></div>
      <div class="work-edge-delivery"><i></i><i></i><i></i></div>
    </div>
    <div class="projects-content">
      <h2>${c.work}</h2>
      <div class="work" data-work>
        <ul class="project-list">${items.map((project, index) => `<li><a class="project-link${index === 0 ? ' active' : ''}" href="${href(lang, project)}" data-preview="${project.hasImage === false ? '' : image(project.slug)}" data-title="${escape(project.name)}">
          <div><span>${escape(project.name)}</span><small>${escape(label(lang, project))}</small></div><span aria-hidden="true">↗</span>
        </a></li>`).join('')}</ul>
        <div class="preview">
          <ol class="work-flow">
            <li><div class="flow-art flow-brief" aria-hidden="true"><i></i><i></i><i></i></div><strong>${c.workflow[0]}</strong></li>
            <li><div class="flow-art flow-roadmap" aria-hidden="true"><i></i><i></i><i></i></div><strong>${c.workflow[1]}</strong></li>
            <li><div class="flow-art flow-delivery" aria-hidden="true"><i></i></div><strong>${c.workflow[2]}</strong></li>
          </ol>
          <img class="preview-image" alt="" hidden>
          <div class="preview-title" hidden></div>
        </div>
      </div>
    </div>
  </section>
  <section class="about story-screen" id="about">
    <div class="about-intro"><h2>${c.about}</h2><p>${c.aboutText}</p></div>
    <div class="about-orbits" data-cv-orbits aria-label="${c.cv}">
      <div class="about-atom" data-illustration="about" aria-hidden="true"><div class="atom-fallback"><i></i><i></i><i></i><b></b></div></div>
      ${[['it-pm', c.pm, 'IT PM'], ['it-ba', c.ba, 'IT BA'], ['po', 'Product Owner', 'PO']].map(([id, title, label], index) => `<details class="cv-orbit" style="--orbit-start:${[8, 40, 73][index]}%" data-cv-title="${escape(title)}">
        <summary aria-label="${escape(title)}" title="${escape(title)}">${label}</summary>
        <div class="orbit-languages">
          ${[['az', '🇦🇿'], ['en', '🇬🇧']].map(([code, flag], langIndex) => `<a href="/cv/${id}-${code}.pdf" data-cv-image="/cv/${id}-${code}.webp" aria-label="${escape(c.cvLanguages[langIndex])}" title="${escape(c.cvLanguages[langIndex])}"><span aria-hidden="true">${flag} ${code.toUpperCase()}</span></a>`).join('')}
        </div>
      </details>`).join('')}
    </div>
    <dialog class="cv-dialog" aria-labelledby="cv-dialog-title">
      <div class="cv-dialog-bar">
        <h3 id="cv-dialog-title" data-preview-label="${c.cvPreview}">${c.cvPreview}</h3>
        <form method="dialog"><button type="submit" aria-label="${c.close}">×</button></form>
      </div>
      <div class="cv-dialog-page"><img alt=""></div>
      <div class="cv-dialog-actions"><a class="cv-open" target="_blank" rel="noopener">${c.cvOpen}</a><a class="cv-download" download>${c.cvDownload} ↓</a></div>
    </dialog>
  </section>`;

}

function page(lang, project) {
  const c = copy[lang];
  const home = href(lang);
  const other = lang === 'az' ? 'en' : 'az';
  const title = project ? `${project.name} | ${c.name}` : `${c.name} | ${c.role}`;
  const metadata = searchMetadata({
    lang, title, description: project ? project[lang] : c.description,
    routeFor: (locale) => href(locale, project),
    cover: `/assets/social-${project && project.hasImage !== false ? project.slug : 'profile'}.jpg`,
    coverAlt: project && project.hasImage !== false ? project.name : c.name,
    profile: !project, project,
  });
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${metadata}
<link rel="stylesheet" href="/styles.css?v=${assetVersions['styles.css']}"><script src="/motion.js?v=${assetVersions['motion.js']}" defer></script>
${project ? '' : `<script src="/story.js?v=${assetVersions['story.js']}" defer></script>`}
</head><body data-illustrations="/illustrations.js?v=${illustrationVersion}"${project ? '' : ' class="home-page"'}>
<header class="top"><a class="brand" href="${home}" aria-label="${escape(c.name)}"><img src="/assets/sarkhan-mark.webp" width="160" height="147" alt=""></a><nav>
<a href="${home}#work">${c.work}</a><a href="${home}#about">${c.about}</a><a href="#contact">${c.contact}</a>
<a class="language" href="${href(other, project)}" lang="${other}" hreflang="${other}">${other.toUpperCase()}</a>
</nav></header>
<main>${project ? `<article class="case">
<a href="${home}#work">← ${c.back}</a><h1>${project.name}</h1><p class="role">${label(lang, project)}</p>
<p class="case-copy">${escape(project[lang])}</p>
${project.hasImage === false ? '' : `<img class="case-image" src="${image(project.slug)}" alt="${project.name}" fetchpriority="high">`}
${project.url ? `<a class="external" href="${project.url}">${c.live} ↗</a>` : ''}</article>` : homepage(lang, c)}</main>
<footer id="contact" class="contact-section${project ? '' : ' story-screen'}">
<div class="contact-intro"><h2>${c.contact}</h2><p>${c.contactText}</p>
<div class="contact-figure" data-illustration="contact" aria-hidden="true"><div class="envelope-fallback"></div></div>
<div class="contact-links">
  <a href="${linkedin}" aria-label="LinkedIn" title="LinkedIn"><span class="contact-icon contact-icon-linkedin" aria-hidden="true">in</span></a>
  <a href="mailto:${email}" aria-label="${escape(c.emailContact)}" title="${escape(email)}"><span class="contact-icon contact-icon-mail" aria-hidden="true"></span></a>
  <a href="${github}" aria-label="GitHub" title="GitHub"><span class="contact-icon contact-icon-github" aria-hidden="true"></span></a>
  <a href="${cardHref(lang)}" aria-label="${escape(c.digitalCard)}" title="${escape(c.digitalCard)}"><span class="contact-icon contact-icon-card" aria-hidden="true"></span></a>
</div></div>
<div class="contact-compose">
<div class="compose-paper compose-paper-back" aria-hidden="true"></div>
<div class="compose-paper compose-paper-front" aria-hidden="true"></div>
<form class="contact-form" data-contact-form data-sending="${c.formSending}" data-sent="${c.formSent}" data-error="${c.formError}" data-verify="${c.formVerify}" data-verify-error="${c.formVerifyError}">
  <div class="contact-form-top">
    <div class="contact-progress" hidden>
      <label for="contact-progress">${c.formProgress}</label><span class="contact-progress-count" aria-hidden="true"></span>
      <progress id="contact-progress" value="0" max="5"></progress>
    </div>
    <div class="compose-flight" aria-hidden="true">
      <div class="compose-plane"><i></i><i></i><i></i></div>
    </div>
  </div>
  <div class="contact-form-row">
    <div class="contact-field"><label for="contact-name">${c.formName}</label><input id="contact-name" type="text" name="name" autocomplete="name" required minlength="2" maxlength="100"></div>
    <div class="contact-field"><label for="contact-email">${c.formEmail}</label><input id="contact-email" type="email" name="email" autocomplete="email" required maxlength="150"></div>
  </div>
  <div class="contact-form-row">
    <div class="contact-field"><label for="contact-phone">${c.formPhone}</label><input id="contact-phone" type="tel" name="phone" autocomplete="tel" required minlength="7" maxlength="32"></div>
    <div class="contact-field"><label for="contact-topic">${c.formTopic}</label><select id="contact-topic" name="topic" required>
      <option value="" disabled selected>${c.formChooseTopic}</option>${['project', 'job', 'other'].map((topic, index) => `<option value="${topic}">${c.formTopics[index]}</option>`).join('')}
    </select></div>
  </div>
  <input type="text" name="website" tabindex="-1" autocomplete="off" class="contact-hp" aria-hidden="true">
  <div class="contact-field">
    <div class="contact-message-line"><label for="contact-message">${c.formMessage}</label><span class="contact-count" aria-hidden="true" hidden></span></div>
    <textarea id="contact-message" name="message" rows="5" required minlength="10" maxlength="2000" placeholder="${c.formMessageHint}"></textarea>
  </div>
  <div class="contact-form-actions">
    <div class="contact-turnstile" data-contact-turnstile></div>
    <button type="submit" class="contact-submit">${c.formSend}</button>
    <p class="contact-form-status" role="status" aria-live="polite" hidden></p>
  </div>
</form>
</div>
</footer>
</body></html>`;
}

function cardPage(lang) {
  const c = copy[lang];
  const m = getCardMeta(lang);
  const home = href(lang);
  const other = lang === 'az' ? 'en' : 'az';
  const metadata = searchMetadata({
    lang, title: m.pageTitle, description: m.pageDescription, routeFor: cardHref,
    cover: '/assets/social-profile.jpg', coverAlt: c.name, profile: true,
  });

  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${metadata}
<link rel="stylesheet" href="/styles.css?v=${assetVersions['styles.css']}">
<link rel="stylesheet" href="/card.css?v=${assetVersions['card.css']}">
<script src="/card.js?v=${cardBundleVersion}" defer></script>
</head><body class="card-page">
<header class="top"><a class="brand" href="${home}" aria-label="${escape(c.name)}"><img src="/assets/sarkhan-mark.webp" width="160" height="147" alt=""></a><nav>
<a href="${home}#work">${c.work}</a><a href="${home}#about">${c.about}</a><a href="#contact">${c.contact}</a>
<a class="language" href="${cardHref(other)}" lang="${other}" hreflang="${other}">${other.toUpperCase()}</a>
</nav></header>
<main>${renderCardPage({ lang, identity: digitalIdentity, projects, siteCopy: c, escape })}</main>
<footer id="contact"><h2>${c.contact}</h2><div><p>${c.contactText}</p>
<div class="contact-links"><a href="${linkedin}">LinkedIn ↗</a><a href="mailto:${email}">${email}</a><a href="${github}">GitHub ↗</a></div></div>
</footer>
</body></html>`;
}

await mkdir(output, { recursive: true });
await cp(new URL('./public/', import.meta.url), output, { recursive: true });
await writeFile(new URL('illustrations.js', output), illustrations.contents);
await writeFile(new URL('card.js', output), cardBundle.contents);
await cp(new URL('./node_modules/three/LICENSE', import.meta.url), new URL('three-license.txt', output));
const routes = [];
for (const lang of languages) {
  for (const project of [null, ...projects]) {
    const route = href(lang, project);
    routes.push({ route, routeFor: (locale) => href(locale, project) });
    const directory = new URL(`.${route}`, output);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('index.html', directory), page(lang, project));
  }
  const cardRoute = cardHref(lang);
  routes.push({ route: cardRoute, routeFor: cardHref });
  const cardDir = new URL(`.${cardRoute}`, output);
  await mkdir(cardDir, { recursive: true });
  await writeFile(new URL('index.html', cardDir), cardPage(lang));
}
const zehraDirectory = new URL(`.${zehraRoute}`, output);
await mkdir(zehraDirectory, { recursive: true });
await writeFile(new URL('index.html', zehraDirectory), renderZehraPage({
  domain, icons, stylesheet: `/zehra.css?v=${assetVersions['zehra.css']}`,
}));
routes.push({ route: zehraRoute });
await writeFile(new URL('robots.txt', output), `User-agent: *
Disallow: /api/

Sitemap: ${domain}/sitemap.xml
`);
const sitemapUrls = routes.map(({ route, routeFor }) => [
  '  <url>',
  `    <loc>${escape(domain + route)}</loc>`,
  ...(routeFor ? alternates(routeFor).map(([lang, url]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escape(url)}"/>`) : []),
  '  </url>',
].join('\n'));
await writeFile(new URL('sitemap.xml', output), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...sitemapUrls,
  '</urlset>',
  '',
].join('\n'));

await writeFile(new URL('404.html', output), `<!doctype html>
<html lang="az"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Səhifə tapılmadı | ${escape(copy.az.name)}</title>
${icons}
<link rel="stylesheet" href="/styles.css?v=${assetVersions['styles.css']}">
</head><body><main class="case">
<h1>Səhifə tapılmadı</h1>
<p class="case-copy">Ana səhifəyə qayıda və ya ingilis versiyasını aça bilərsiniz.</p>
<p class="case-copy"><a href="/">Ana səhifə</a> <a href="/en/" lang="en">English home</a></p>
</main></body></html>`);

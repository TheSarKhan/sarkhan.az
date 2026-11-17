export const zehraRoute = '/zara/';

export function renderZehraPage({ domain, stylesheet, icons }) {
  const album = 'https://open.spotify.com/album/3ukkRHDHbN8tNRPKsGZR1h';
  const profile = 'https://open.spotify.com/user/fgzeg3ncv4179s7ds8lca1xsu';
  const playlist = 'https://open.spotify.com/playlist/37i9dQZF1E8OhRzQFG3ny6';
  const tracks = [
    ['Black Swan', '6wH3AP7b01vpzKYRJhreMy'],
    ['SWIM', '68lbSrXDORS51pmyjZv712'],
    ['We are Bulletproof : the Eternal', '44WLOqH7QayQOQdeUHeKUK'],
  ];
  // [ad, səviyyə, A1–C2 şkalasında dolu pillə sayı, qısa izah]
  const languages = [
    ['Azərbaycan dili', 'C2', 6, 'Sərbəst səviyyə'],
    ['Türk dili', 'C2', 6, 'Sərbəst səviyyə'],
    ['Rus dili', 'C1', 5, 'İrəli səviyyə'],
    ['İngilis dili', 'B2', 4, 'Orta-yuxarı səviyyə'],
    ['Koreya dili', 'A2', 2, 'Elementar səviyyə'],
    ['Fransız dili', 'A2+', 2.5, 'Elementar səviyyə'],
  ];
  const concertDate = '2026-12-06';
  const concertStart = '2026-12-06T00:00:00+07:00';
  const left = Math.max(0, Date.parse(concertStart) - Date.now());
  const initial = { days: Math.floor(left / 864e5), hours: Math.floor(left / 36e5) % 24, minutes: Math.floor(left / 6e4) % 60, seconds: Math.floor(left / 1e3) % 60 };
  const units = [['days', 'gün'], ['hours', 'saat'], ['minutes', 'dəqiqə'], ['seconds', 'saniyə']];
  const title = 'Zara Babayeva | BTS və K-pop';
  const description = 'Zara Babayevanın K-pop səhifəsi. BTS OT7, ARIRANG albomu, Stray Kids favoritləri və Spotify pleylisti.';
  const url = domain + zehraRoute;
  const art = '/assets/zehra-record.webp';

  return `<!doctype html>
<html lang="az"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#1b0b37">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="az_AZ">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${domain + art}">
<meta property="og:image:alt" content="Bənövşəyi və qırmızı rənglərdə vinil plastinka illüstrasiyası">
<meta name="twitter:card" content="summary_large_image">
${icons}
<link rel="stylesheet" href="${stylesheet}">
<script src="/zehra-motion.js" defer></script>
</head><body>
<header class="masthead">
  <a class="wordmark" href="/zara/" aria-label="Zara Babayeva"><img src="/assets/zehra-logo.webp" alt="" width="360" height="164"></a>
  <nav aria-label="Səhifə bölmələri"><a href="#favoritler">Favoritlər</a><a href="#konsert">Konsert</a><a href="#spotify">Spotify</a></nav>
</header>
<main>
  <section class="cover" aria-labelledby="zara-title">
    <div class="cover-copy">
      <h1 id="zara-title">Zara<br>Babayeva</h1>
      <p>Atatürk Liseyində oxuyuram. Ən sevdiyim qrup BTS-dir və 2017-ci ildən ARMY-yəm. Koreya dilini bilirəm və öyrənməyə davam edirəm.</p>
      <a class="cover-link" href="${playlist}" target="_blank" rel="noopener">Spotify pleylistinə keç <span aria-hidden="true">↗</span></a>
    </div>
    <figure class="cover-art"><img src="/assets/zehra-portrait.webp" alt="Bənövşəyi BTS fonunda Zara Babayevanın portreti" width="960" height="1200" fetchpriority="high"></figure>
    <ul class="cover-facts" aria-label="Qısa məlumat">
      <li><strong>2017</strong><span>ildən ARMY-yəm</span></li>
      <li><strong>BTS</strong><span>sevimli qrup</span></li>
      <li><strong>06.12.2026</strong><span>BTS konserti</span></li>
      <li><strong>A2</strong><span>Koreya dili</span></li>
    </ul>
  </section>
  <section class="favorites" id="favoritler" aria-labelledby="favorites-title">
    <h2 id="favorites-title">Favoritlərim</h2>
    <div class="favorite-lineup">
      <article class="favorite-bts">
        <img src="/assets/zehra-bts.webp" alt="BTS qrupunun yeddi üzvü" width="1077" height="1075" loading="lazy">
        <div class="favorite-content">
        <img class="favorite-logo" src="/assets/zehra-bts-logo.svg" alt="" width="466" height="990" loading="lazy">
        <h3>BTS</h3>
        <p class="favorite-detail">OT7</p>
        <p class="favorite-song">Sevimli mahnım <a href="https://open.spotify.com/track/6wH3AP7b01vpzKYRJhreMy">Black Swan ↗</a></p>
        </div>
      </article>
      <article class="favorite-skz">
        <img src="/assets/zehra-skz.webp" alt="Stray Kids qrupunun səkkiz üzvü" width="736" height="736" loading="lazy">
        <div class="favorite-content">
        <img class="favorite-logo" src="/assets/zehra-skz-logo.webp" alt="" width="900" height="463" loading="lazy">
        <h3>Stray Kids</h3>
        <p class="favorite-detail">Seungmin və Changbin</p>
        <p class="favorite-song">Sevimli mahnım <a href="https://open.spotify.com/track/3dxcr1h2eM5dgYeWjCQ41H">Social Path ↗</a></p>
        </div>
      </article>
    </div>
    <a class="album" href="${album}" aria-label="ARIRANG, BTS albomu. Spotify-da dinlə">
      <img class="album-mark" src="/assets/zehra-arirang.webp" alt="" width="940" height="304" loading="lazy">
      <span class="album-copy"><span class="album-title">ARIRANG</span><span class="album-ko" lang="ko">아리랑</span></span>
      <span class="album-action">Spotify-da dinlə <span aria-hidden="true">↗</span></span>
    </a>
  </section>
  <section class="concert" id="konsert" aria-labelledby="concert-title">
    <p class="concert-eyebrow">BTS WORLD TOUR ‘ARIRANG’</p>
    <h2 id="concert-title">Konsertə gedirəm</h2>
    <div class="concert-body">
      <div class="concert-ticket">
        <time class="concert-date" datetime="${concertDate}">06.12.2026</time>
        <dl class="concert-facts">
          <div><dt>Şəhər</dt><dd>Banqkok, Tailand</dd></div>
          <div><dt>Məkan</dt><dd>Rajamangala Milli Stadionu</dd></div>
          <div><dt>Gün</dt><dd>Bazar</dd></div>
        </dl>
      </div>
      <div class="countdown" data-countdown="${concertStart}" role="timer" aria-label="Konsertə qalan vaxt">${units.map(([key, label]) => `
        <div><strong data-unit="${key}">${String(initial[key]).padStart(2, '0')}</strong><span>${label}</span></div>`).join('')}
      </div>
    </div>
  </section>
  <section class="languages" aria-labelledby="languages-title">
    <h2 id="languages-title">Dil biliklərim</h2>
    <ul class="language-grid">${languages.map(([name, level, steps, note]) => `
      <li class="language" style="--level:${steps / 6}">
        <span class="language-name">${name}</span>
        <strong class="language-level">${level}</strong>
        <span class="language-note">${note}</span>
        <span class="language-bar" aria-hidden="true"><i></i></span>
        <span class="language-scale" aria-hidden="true"><b>A1</b><b>A2</b><b>B1</b><b>B2</b><b>C1</b><b>C2</b></span>
      </li>`).join('')}
    </ul>
  </section>
  <section class="player" id="spotify" aria-labelledby="spotify-title">
    <div class="player-heading"><h2 id="spotify-title">Sevimli mahnılarım</h2></div>
    <div class="track-list">${tracks.map(([name, id]) => `<div class="track">
      <iframe title="Spotify — ${name}" src="https://open.spotify.com/embed/track/${id}" width="100%" height="352" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <a href="https://open.spotify.com/track/${id}">${name} Spotify-da ↗</a>
    </div>`).join('')}</div>
    <a class="album profile" href="${profile}" rel="noopener">
      <span class="album-disc" aria-hidden="true"><i></i></span>
      <span class="album-copy"><span class="album-title">Spotify profilim</span><span>Daha çox mahnı və pleylist</span></span>
      <span class="album-action">Profilə keç <span aria-hidden="true">↗</span></span>
    </a>
  </section>
</main>
</body></html>`;
}

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

if ('IntersectionObserver' in window) {
  const scenes = document.querySelectorAll('.favorites, .concert, .languages, .player');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (!motionPreference.matches) entry.target.classList.add('scene-enter');
    }
  }, { threshold: 0.18 });
  scenes.forEach((scene) => observer.observe(scene));
}

const countdown = document.querySelector('[data-countdown]');
if (countdown) {
  const target = Date.parse(countdown.dataset.countdown);
  const cells = Object.fromEntries([...countdown.querySelectorAll('[data-unit]')].map((el) => [el.dataset.unit, el]));
  const pad = (value) => String(value).padStart(2, '0');
  const tick = () => {
    const left = Math.max(0, target - Date.now());
    cells.days.textContent = pad(Math.floor(left / 864e5));
    cells.hours.textContent = pad(Math.floor(left / 36e5) % 24);
    cells.minutes.textContent = pad(Math.floor(left / 6e4) % 60);
    cells.seconds.textContent = pad(Math.floor(left / 1e3) % 60);
    if (left === 0) clearInterval(timer);
  };
  const timer = setInterval(tick, 1000);
  tick();
}

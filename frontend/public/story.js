const track = document.querySelector('[data-film]');

if (track) {
  const viewport = track.querySelector('.film-screen');
  const foreground = track.querySelector('.film-foreground');
  const backgroundVideo = track.querySelector('.film-background');
  const next = track.querySelector('.film-next');
  const control = track.querySelector('.film-control');
  const icon = control.querySelector('span');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let userPlayback;
  let frame = 0;

  function syncPlayback(video, playing) {
    if (playing && video.paused) video.play().catch(() => {});
    else if (!playing && !video.paused) video.pause();
  }

  function render() {
    frame = 0;
    const bounds = track.getBoundingClientRect();
    const stageHeight = viewport.clientHeight;
    if (!stageHeight) return;
    const travel = track.clientHeight - stageHeight;
    const progress = travel ? Math.max(0, Math.min(1, -bounds.top / travel)) : 0;
    const exit = Math.max(0, Math.min(1, (progress - 0.08) / 0.75));
    const eased = exit * exit * (3 - 2 * exit);
    foreground.style.setProperty('--film-shift', `${reducedMotion.matches ? 0 : -(eased * 66)}svh`);
    foreground.style.setProperty('--film-scale', reducedMotion.matches ? '1' : String(1 - eased * 0.35));
    foreground.style.setProperty('--film-turn', `${reducedMotion.matches ? 0 : (eased * -13)}deg`);
    const opacity = reducedMotion.matches ? Number(progress < 0.55) : 1 - eased;
    foreground.style.setProperty('--film-opacity', String(opacity));
    foreground.inert = opacity < 0.06;
    next.hidden = opacity >= 0.06;
    const inView = bounds.top < stageHeight * 0.85 && bounds.bottom > stageHeight * 0.15;
    const enabled = userPlayback ?? !reducedMotion.matches;
    foreground.classList.toggle('is-moving', inView && enabled && opacity > 0.1 && !reducedMotion.matches);
    syncPlayback(backgroundVideo, inView && enabled);
    control.setAttribute('aria-label', enabled ? control.dataset.pause : control.dataset.play);
    icon.textContent = enabled ? 'Ⅱ' : '▷';
    control.hidden = false;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  control.addEventListener('click', () => {
    userPlayback = !(userPlayback ?? !reducedMotion.matches);
    schedule();
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  reducedMotion.addEventListener('change', schedule);
  schedule();
}

const rail = document.querySelector('[data-film-cards]');
if (rail) {
  const cards = [...rail.querySelectorAll('.film-card')];
  const reducedDragMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let drag;
  let suppressClick = false;

  function nearestCard() {
    const railBounds = rail.getBoundingClientRect();
    const center = railBounds.left + railBounds.width / 2;
    return cards.reduce((nearest, card, index) => {
      const bounds = card.getBoundingClientRect();
      const distance = Math.abs(bounds.left + bounds.width / 2 - center);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Infinity }).index;
  }

  function select(index) {
    const card = cards[index];
    const left = card.offsetLeft + (card.offsetWidth - rail.clientWidth) / 2;
    rail.scrollTo({ left, behavior: reducedDragMotion.matches ? 'auto' : 'smooth' });
  }

  function updateActiveCard() {
    const index = nearestCard();
    cards.forEach((card, position) => card.classList.toggle('is-active', position === index));
  }

  const clampIndex = (index) => Math.max(0, Math.min(cards.length - 1, index));
  rail.addEventListener('scroll', updateActiveCard, { passive: true });
  window.addEventListener('resize', updateActiveCard);
  updateActiveCard();

  rail.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const index = clampIndex(nearestCard() + (event.key === 'ArrowRight' ? 1 : -1));
    cards[index].focus({ preventScroll: true });
    select(index);
  });
  rail.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    drag = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      scroll: rail.scrollLeft, startIndex: nearestCard(), moved: false,
    };
  });
  rail.addEventListener('pointermove', (event) => {
    if (!drag) {
      if (event.pointerType !== 'mouse' || reducedDragMotion.matches) return;
      const card = event.target.closest('.film-card.is-active');
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--card-x', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 9}deg`);
      card.style.setProperty('--card-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 12}deg`);
      return;
    }
    if (event.pointerId !== drag.id) return;
    const offset = event.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(offset) < 7 || Math.abs(offset) <= Math.abs(event.clientY - drag.y)) return;
      drag.moved = true;
      rail.classList.add('is-dragging');
      rail.setPointerCapture(event.pointerId);
    }
    const distance = cards[1].offsetLeft - cards[0].offsetLeft;
    rail.scrollLeft = drag.scroll - Math.max(-distance, Math.min(distance, offset));
  });
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const { moved, startIndex, x } = drag;
    drag = undefined;
    if (!moved) return;
    suppressClick = true;
    const offset = event.clientX - x;
    const advance = event.type === 'pointerup' && Math.abs(offset) >= 28 ? -Math.sign(offset) : 0;
    const index = clampIndex(startIndex + advance);
    rail.classList.remove('is-dragging');
    select(index);
  }
  window.addEventListener('pointerup', finishDrag);
  rail.addEventListener('pointercancel', finishDrag);
  for (const card of cards) {
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--card-x');
      card.style.removeProperty('--card-y');
    });
  }
  rail.addEventListener('click', (event) => {
    if (!suppressClick || event.detail === 0) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

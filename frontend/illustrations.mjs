import {
  AmbientLight, BufferAttribute, BufferGeometry, DirectionalLight, DoubleSide,
  Group, IcosahedronGeometry, MathUtils, Mesh, MeshBasicMaterial, Object3D,
  MeshStandardMaterial, OctahedronGeometry, OrthographicCamera, Points,
  PointsMaterial, Scene, Shape, ShapeGeometry, SphereGeometry,
  TorusGeometry, Vector3, WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const material = (color, roughness = 0.42) => new MeshStandardMaterial({ color, roughness, metalness: 0.08 });
const green = material('#1e7a4c');
const forest = material('#113b2b');
const porcelain = material('#e3e8d8', 0.55);

function aboutSculpture() {
  const root = new Group();
  const goldMat = material('#d4af67', 0.25, 0.55);
  const wireMat = new MeshBasicMaterial({ color: '#1e7a4c', wireframe: true, transparent: true, opacity: 0.42 });

  // 1. Central faceted emerald core + outer geodesic wireframe cage
  const core = new Mesh(new IcosahedronGeometry(0.76, 0), forest);
  const cage = new Mesh(new IcosahedronGeometry(1.06, 1), wireMat);
  const innerGem = new Mesh(new OctahedronGeometry(0.45, 0), goldMat);
  root.add(core, cage, innerGem);

  // 2. Three gyroscopic orbital rings
  const ringSpecs = [
    { r: 1.38, tube: 0.026, rx: 1.05, ry: 0.35, mat: green },
    { r: 1.68, tube: 0.018, rx: -0.78, ry: 0.62, mat: goldMat },
    { r: 1.98, tube: 0.015, rx: 0.42, ry: -0.92, mat: porcelain },
  ];
  const rings = ringSpecs.map(({ r, tube, rx, ry, mat }, idx) => {
    const holder = new Group();
    holder.rotation.set(rx, ry, 0);
    holder.add(new Mesh(new TorusGeometry(r, tube, 14, 96), mat));
    // Add 4 satellite nodes per ring
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI * 2;
      const sat = new Mesh(
        j % 2 === 0 ? new OctahedronGeometry(0.095, 0) : new SphereGeometry(0.075, 14, 14),
        j === 0 ? goldMat : idx % 2 === 0 ? green : porcelain,
      );
      sat.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      holder.add(sat);
    }
    holder.userData = { speedX: (idx + 1) * 0.22, speedY: (idx % 2 === 0 ? 1 : -1) * 0.38, speedZ: 0.28 + idx * 0.14 };
    root.add(holder);
    return holder;
  });

  // 3. Swirling 3D particle aura (90 particles)
  const count = 90;
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 1.15 + Math.random() * 1.45;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    positions[i * 3] = basePositions[i * 3] = x;
    positions[i * 3 + 1] = basePositions[i * 3 + 1] = y;
    positions[i * 3 + 2] = basePositions[i * 3 + 2] = z;
  }
  const pGeo = new BufferGeometry();
  pGeo.setAttribute('position', new BufferAttribute(positions, 3));
  const aura = new Points(
    pGeo,
    new PointsMaterial({ color: '#1e7a4c', size: 0.085, transparent: true, opacity: 0.65 }),
  );
  root.add(aura);

  const cvTrack = new Group();
  cvTrack.rotation.set(0.34, -0.18, -0.16);
  cvTrack.add(new Mesh(new TorusGeometry(2.02, 0.014, 8, 96), green));
  const cvParticles = Array.from({ length: 3 }, () => {
    const particle = new Object3D();
    cvTrack.add(particle);
    return particle;
  });
  root.add(cvTrack);

  root.userData = { core, cage, innerGem, rings, aura, basePositions, cvParticles };
  return [root];
}

function connectAboutSculpture(host, parts, schedule, camera) {
  const [root] = parts.map(({ object }) => object);
  const { core, cage, innerGem, rings, aura, basePositions, cvParticles } = root.userData;
  const orbitField = host.closest('.about-orbits');
  const controls = [...orbitField.querySelectorAll('.cv-orbit')];
  const projected = new Vector3();
  let orbitAngle = 0.58;
  let previousFrame;
  let burst = 0;

  host.style.cursor = 'pointer';
  host.addEventListener('click', () => {
    burst = 1;
    schedule();
  });

  return (now, reduced) => {
    const delta = previousFrame === undefined ? 0 : Math.min(50, now - previousFrame);
    previousFrame = now;
    if (!reduced && !orbitField.matches(':has(.cv-orbit:is(:hover, :focus-within, [open]))')) {
      orbitAngle += delta * 0.00024;
    }
    cvParticles.forEach((particle, index) => {
      const phase = orbitAngle + index * Math.PI * 2 / cvParticles.length;
      particle.position.set(2.02 * Math.cos(phase), 2.02 * Math.sin(phase), 0);
      particle.getWorldPosition(projected).project(camera);
      const x = projected.x * host.clientWidth / 2;
      const y = -projected.y * host.clientHeight / 2;
      const control = controls[index];
      const limit = orbitField.clientWidth / 2 - 58;
      control.style.setProperty('--particle-x', `${x.toFixed(1)}px`);
      control.style.setProperty('--particle-y', `${y.toFixed(1)}px`);
      control.style.setProperty('--flag-shift', `${MathUtils.clamp(x, -limit, limit) - x}px`);
      control.classList.toggle('orbit-pop-up', y > orbitField.clientHeight / 2 - 82);
    });
    if (reduced) return false;
    const t = now * 0.001;
    burst = Math.max(0, burst - 0.025);
    const boost = 1 + burst * 4.5;

    // Breathing & counter-rotating geometric core
    const pulse = 1 + Math.sin(t * 2.1) * 0.06 + burst * 0.12;
    core.scale.setScalar(pulse);
    core.rotation.y = t * 0.55 * boost;
    core.rotation.x = Math.sin(t * 0.4) * 0.35;

    cage.scale.setScalar(1 + Math.cos(t * 1.6) * 0.05);
    cage.rotation.y = -t * 0.32 * boost;
    cage.rotation.z = t * 0.24;

    innerGem.rotation.y = t * 1.4 * boost;
    innerGem.rotation.x = t * 0.9;

    // Independent gyroscopic rings
    rings.forEach((holder) => {
      const { speedX, speedY, speedZ } = holder.userData;
      holder.rotation.x += 0.004 * speedX * boost;
      holder.rotation.y += 0.006 * speedY * boost;
      holder.rotation.z += 0.008 * speedZ * boost;
    });

    // Swirling particle aura
    aura.rotation.y = t * 0.18;
    aura.rotation.z = Math.sin(t * 0.25) * 0.15;
    const posAttr = aura.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      const wave = 1 + Math.sin(t * 1.5 + i * 0.35) * 0.07;
      posAttr.setXYZ(i, bx * wave, by * wave, bz * wave);
    }
    posAttr.needsUpdate = true;

    return true;
  };
}

function envelopeFold(points, color) {
  const shape = new Shape();
  shape.moveTo(...points[0]);
  points.slice(1).forEach((point) => shape.lineTo(...point));
  shape.closePath();
  const surface = material(color);
  surface.side = DoubleSide;
  return new Mesh(new ShapeGeometry(shape), surface);
}

function contactSculpture() {
  const envelope = new Group();
  envelope.rotation.set(-0.09, 0.05, -0.16);
  const body = new Mesh(new RoundedBoxGeometry(2.5, 1.52, 0.18, 4, 0.055), forest);
  envelope.add(body);

  const letter = new Group();
  letter.position.set(0, 0.03, 0.1);
  letter.add(new Mesh(new RoundedBoxGeometry(1.87, 1.24, 0.055, 3, 0.025), porcelain));
  const ink = material('#5f8b73');
  const lines = [1.11, 0.91, 1.05, 0.73, 0.99].map((width, index) => {
    const line = new Group();
    const stroke = new Mesh(new RoundedBoxGeometry(width, 0.048, 0.013, 2, 0.005), ink);
    stroke.position.x = width / 2;
    line.position.set(-0.59, 0.4 - index * 0.17, 0.033);
    line.scale.x = 0;
    line.add(stroke);
    letter.add(line);
    return line;
  });
  envelope.add(letter);

  const left = envelopeFold([[-1.25, -0.75], [-1.25, 0.75], [0.32, -0.75]], '#4e8c68');
  const right = envelopeFold([[1.25, -0.75], [1.25, 0.75], [-0.32, -0.75]], '#29734e');
  const bottom = envelopeFold([[-1.25, -0.75], [1.25, -0.75], [0, 0.23]], '#639878');
  left.position.z = right.position.z = 0.175;
  bottom.position.z = 0.19;
  envelope.add(left, right, bottom);

  const lid = envelopeFold([[-1.25, 0], [1.25, 0], [0, -0.8]], '#377f57');
  lid.position.set(0, 0.75, 0.2);
  envelope.add(lid);
  envelope.userData = { letter, lid, lines };
  return [envelope];
}

function connectContactSculpture(host, parts, schedule) {
  const envelope = parts[0].object;
  const { letter, lid, lines } = envelope.userData;
  const form = host.closest('.contact-section').querySelector('form');
  let openness = 0;
  let sentAt;

  form.addEventListener('focusin', schedule);
  form.addEventListener('focusout', schedule);
  new MutationObserver(schedule).observe(form, {
    attributes: true, attributeFilter: ['data-completion', 'data-contact-state'],
  });
  form.addEventListener('contact:sent', () => {
    sentAt = performance.now();
    schedule();
  });

  return (now, reduced) => {
    const elapsed = sentAt === undefined ? 1 : MathUtils.clamp((now - sentAt) / 950, 0, 1);
    const complete = Number(form.dataset.completion || 0);
    const sending = form.dataset.contactState === 'sending';
    const goal = elapsed < 1 ? 1 : sending ? 0.12 :
      form.matches(':focus-within') ? 0.85 + 0.15 * (complete / lines.length) : 0.62;
    openness = reduced ? goal : MathUtils.lerp(openness, goal, 0.11);
    const flight = reduced ? 0 : Math.sin(elapsed * Math.PI) ** 1.2;
    lid.rotation.x = MathUtils.smoothstep(openness, 0, 0.62) * 2.66;
    letter.position.y = 0.03 + MathUtils.smoothstep(openness, 0.28, 1) * 1.14 + flight * 0.76;
    letter.position.x = flight * 0.74;
    letter.rotation.z = flight * -0.4;
    let drawing = false;
    lines.forEach((line, index) => {
      const width = index < complete || elapsed < 1 ? 1 : 0;
      line.scale.x = reduced ? width : MathUtils.lerp(line.scale.x, width, 0.16);
      if (Math.abs(width - line.scale.x) > 0.002) drawing = true;
    });
    return !reduced && (drawing || elapsed < 1 || Math.abs(goal - openness) > 0.002);
  };
}

const designs = {
  about: { create: aboutSculpture, span: 4.8, angle: 0.24, connect: connectAboutSculpture },
  contact: { create: contactSculpture, span: 3.85, angle: -0.21, connect: connectContactSculpture },
};

function setup(host) {
  const design = designs[host.dataset.illustration];
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { antialias: true, alpha: true });
  if (!context) return;
  const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  const scene = new Scene();
  scene.add(new AmbientLight('#f3f2eb', 1.8));
  const key = new DirectionalLight('#fff9e8', 2.45);
  key.position.set(-4, 6, 5);
  scene.add(key);
  const fill = new DirectionalLight('#e3f4e5', 0.85);
  fill.position.set(5, -2, -4);
  scene.add(fill);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  camera.position.set(0, 0, 10);
  const sculpture = new Group();
  const restingTilt = 0.22;
  sculpture.rotation.set(restingTilt, design.angle, 0);
  scene.add(sculpture);
  const parts = design.create().map((object) => {
    sculpture.add(object);
    return { object, rest: object.position.y, angle: object.rotation.z };
  });

  const entrance = performance.now();
  let targetX = 0;
  let targetY = 0;
  let request = 0;
  let visible = true;
  let contextLost = false;
  let updateArtwork;

  function draw(now) {
    request = 0;
    if (!visible || contextLost) return;
    const reduced = motion.matches;
    const progress = reduced ? 1 : Math.min(1, (now - entrance) / 1200);
    const settle = 1 - (1 - progress) ** 3;
    const desiredTilt = restingTilt + targetY;
    sculpture.rotation.x = reduced ? restingTilt : MathUtils.lerp(sculpture.rotation.x, desiredTilt, 0.15);
    const desired = design.angle + (reduced ? 0 : targetX) - (1 - settle) * 0.55;
    sculpture.rotation.y = reduced ? desired : MathUtils.lerp(sculpture.rotation.y, desired, 0.14);
    parts.forEach(({ object, rest, angle }, index) => {
      const flight = 1 - MathUtils.smoothstep(progress, index * 0.07, 0.66 + index * 0.07);
      object.position.y = rest + (index - (parts.length - 1) / 2) * flight * 0.66;
      object.rotation.z = angle + flight * 0.54;
    });
    const artworkMoving = updateArtwork?.(now, reduced);
    renderer.render(scene, camera);
    if (!reduced && (artworkMoving || progress < 1 || Math.abs(sculpture.rotation.y - desired) > 0.002 ||
      Math.abs(sculpture.rotation.x - desiredTilt) > 0.002)) schedule();
  }

  function schedule() {
    if (!request && visible && !contextLost) request = requestAnimationFrame(draw);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) return;
    const scale = design.span / Math.min(width, height);
    const frameWidth = width * scale;
    const frameHeight = height * scale;
    camera.left = -frameWidth / 2;
    camera.right = frameWidth / 2;
    camera.top = frameHeight / 2;
    camera.bottom = -frameHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    schedule();
  }

  canvas.addEventListener('webglcontextlost', () => {
    contextLost = true;
    host.classList.remove('has-3d');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    host.classList.add('has-3d');
    resize();
  });
  host.addEventListener('pointermove', (event) => {
    if (motion.matches || event.pointerType === 'touch') return;
    const bounds = host.getBoundingClientRect();
    targetX = (event.clientX - bounds.left - bounds.width / 2) / bounds.width * 0.95;
    targetY = (event.clientY - bounds.top - bounds.height / 2) / bounds.height * 0.44;
    schedule();
  });
  host.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    schedule();
  });
  motion.addEventListener('change', schedule);
  host.append(canvas);
  resize();
  host.classList.add('has-3d');
  updateArtwork = design.connect?.(host, parts, schedule, camera);
  new ResizeObserver(resize).observe(host);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  visibility.observe(host);
}

const loader = new IntersectionObserver((entries) => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    loader.unobserve(target);
    setup(target);
  }
}, { threshold: 0.08 });
document.querySelectorAll('[data-illustration]').forEach((host) => loader.observe(host));

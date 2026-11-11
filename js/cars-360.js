// 360° viewer: no 3D at all. Each model is 36 photos taken 10° apart;
// dragging just swaps which photo is showing.

const FRAMES = 36;
const frameSrc = (model, i) => `images/cars/${model}/frame-${String(i + 1).padStart(2, '0')}.webp`;

const MODELS = [
  {
    key: 'toro', name: 'Toro', color: '#f2b705', eyebrow: 'V12 · Coupé',
    tagline: 'The original. A naturally aspirated V12 behind your shoulders and nothing between you and the road.',
    specs: [['780', 'hp'], ['2.8s', '0–100 km/h'], ['340', 'km/h top'], ['6.5L', 'V12']],
  },
  {
    key: 'minotaur', name: 'Minotaur', color: '#ff4d12', eyebrow: 'Track edition',
    tagline: 'Lighter, louder, with a fixed rear wing. Built for lap times first and car parks second.',
    specs: [['830', 'hp'], ['2.5s', '0–100 km/h'], ['350', 'km/h top'], ['−90kg', 'vs Toro']],
  },
  {
    key: 'aurelio', name: 'Aurelio', color: '#3a5bd9', eyebrow: 'Grand tourer',
    tagline: 'Midnight paint, polished wheels and a cabin made for crossing borders rather than chasing apexes.',
    specs: [['720', 'hp'], ['3.1s', '0–100 km/h'], ['325', 'km/h top'], ['880km', 'range']],
  },
];

const stage = document.getElementById('stage');
const img = document.getElementById('car');
const angle = document.getElementById('angle');
const loading = document.getElementById('loading');
const bar = document.getElementById('bar');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let model = MODELS[0];
let frame = 0;
let cache = {};          // model key -> array of preloaded Image objects
let autoSpin = !reduceMotion;
let idleTimer = null;

// ---- Preload all frames of a model so swapping is instant ----
function preload(m) {
  if (cache[m.key]) return Promise.resolve(cache[m.key]);
  loading.classList.remove('done');
  let loaded = 0;
  const images = Array.from({ length: FRAMES }, (_, i) => {
    const im = new Image();
    im.src = frameSrc(m.key, i);
    return new Promise((res) => {
      const done = () => { loaded++; bar.style.width = `${(loaded / FRAMES) * 100}%`; res(im); };
      im.onload = done; im.onerror = done;
    });
  });
  return Promise.all(images).then((list) => {
    cache[m.key] = list;
    loading.classList.add('done');
    return list;
  });
}

// ---- Show a frame ----
function show(i) {
  frame = ((i % FRAMES) + FRAMES) % FRAMES;
  img.src = frameSrc(model.key, frame);
  angle.value = frame;
}

// ---- Switch model ----
async function selectModel(m) {
  document.querySelectorAll('.model').forEach((b) => b.setAttribute('aria-pressed', b.dataset.key === m.key));
  document.documentElement.style.setProperty('--accent', m.color);
  img.classList.add('fading');
  document.getElementById('bg-name').style.opacity = 0;

  await Promise.all([preload(m), new Promise((r) => setTimeout(r, 300))]);
  model = m;
  show(frame);                         // keep the same angle when switching
  img.alt = `Taurus ${m.name}`;
  document.getElementById('bg-name').textContent = m.name.toUpperCase();
  document.getElementById('bg-name').style.opacity = 1;
  document.getElementById('name').textContent = m.name;
  document.getElementById('eyebrow').textContent = m.eyebrow;
  document.getElementById('tagline').textContent = m.tagline;
  document.getElementById('specs').innerHTML = m.specs
    .map(([v, l]) => `<div class="spec"><b>${v}</b><small>${l}</small></div>`).join('');
  requestAnimationFrame(() => img.classList.remove('fading'));
}

// ---- Model buttons ----
const modelsEl = document.getElementById('models');
MODELS.forEach((m) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'model';
  b.dataset.key = m.key;
  b.style.setProperty('--c', m.color);
  b.innerHTML = `<i></i>${m.name}`;
  b.addEventListener('click', () => selectModel(m));
  modelsEl.appendChild(b);
});

// ---- Interaction pauses the slow auto-spin, which resumes after a few idle seconds ----
function interacted() {
  autoSpin = false;
  clearTimeout(idleTimer);
  if (!reduceMotion) idleTimer = setTimeout(() => (autoSpin = true), 4000);
}

// ---- Drag to rotate ----
let dragging = false, lastX = 0, carry = 0, velocity = 0;
const pxPerFrame = () => Math.max(6, stage.clientWidth / 90);

stage.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; carry = 0; velocity = 0;
  stage.classList.add('dragging');
  stage.setPointerCapture(e.pointerId);
  interacted();
});
stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX;
  carry += dx;
  velocity = dx;
  const steps = Math.trunc(carry / pxPerFrame());
  if (steps) {
    show(frame - steps);           // drag right = car turns with your hand
    carry -= steps * pxPerFrame();
  }
});
const endDrag = () => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove('dragging');
  coast(velocity);
  interacted();
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

// A flick keeps turning for a moment, slowing down.
function coast(v) {
  if (reduceMotion || Math.abs(v) < 4) return;
  let speed = v;
  let acc = 0;
  const step = () => {
    if (dragging) return;
    acc += speed;
    const steps = Math.trunc(acc / pxPerFrame());
    if (steps) { show(frame - steps); acc -= steps * pxPerFrame(); }
    speed *= 0.92;
    if (Math.abs(speed) > 0.5) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---- Buttons, slider and keyboard ----
document.getElementById('prev').addEventListener('click', () => { interacted(); show(frame + 1); });
document.getElementById('next').addEventListener('click', () => { interacted(); show(frame - 1); });
angle.addEventListener('input', () => { interacted(); show(Number(angle.value)); });
document.addEventListener('keydown', (e) => {
  if (e.target === angle) return;                   // the slider handles its own arrows
  if (e.key === 'ArrowLeft') { interacted(); show(frame + 1); }
  if (e.key === 'ArrowRight') { interacted(); show(frame - 1); }
});

// ---- Slow showroom spin ----
setInterval(() => {
  if (autoSpin && !dragging && !document.hidden && cache[model.key]) show(frame - 1);
}, 140);

selectModel(MODELS[0]);

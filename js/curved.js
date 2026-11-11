// Curved gallery: cards sit on the inside wall of a cylinder and the viewer
// stands inside it. Perspective makes far cards (middle) small and near cards (edges) big.

// Public-domain paintings on Wikimedia Commons.
const ART = [
  ['The Great Wave off Kanagawa', 'Katsushika Hokusai, c. 1831', 'b/b3/Katsushika_Hokusai_-_Thirty-Six_Views_of_Mount_Fuji-_The_Great_Wave_Off_the_Coast_of_Kanagawa_-_Google_Art_Project.jpg'],
  ['The Starry Night', 'Vincent van Gogh, 1889', 'e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg'],
  ['Impression, Sunrise', 'Claude Monet, 1872', '5/54/Claude_Monet%2C_Impression%2C_soleil_levant.jpg'],
  ['Wanderer above the Sea of Fog', 'Caspar David Friedrich, c. 1818', 'b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg'],
  ['Girl with a Pearl Earring', 'Johannes Vermeer, c. 1665', '6/66/Johannes_Vermeer_%281632-1675%29_-_The_Girl_With_The_Pearl_Earring_%281665%29.jpg'],
  ['The Kiss', 'Gustav Klimt, 1908', 'f/f3/Gustav_Klimt_016.jpg'],
  ['Water Lilies', 'Claude Monet, 1906', 'a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg'],
  ['Hunters in the Snow', 'Pieter Bruegel the Elder, 1565', 'd/d8/Pieter_Bruegel_the_Elder_-_Hunters_in_the_Snow_%28Winter%29_-_Google_Art_Project.jpg'],
  ['Self-Portrait', 'Vincent van Gogh, 1887', '4/4c/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%28454045%29.jpg'],
  ['The Birth of Venus', 'Sandro Botticelli, c. 1485', '0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg'],
  ['Red Fuji', 'Katsushika Hokusai, c. 1831', '5/57/Red_Fuji_southern_wind_clear_morning.jpg'],
  ['Woman with a Parasol', 'Claude Monet, 1875', '1/1b/Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg'],
  ['The Scream', 'Edvard Munch, 1893', 'c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg'],
  ['A Sunday on La Grande Jatte', 'Georges Seurat, 1884', 'b/b7/Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_--_1884_-_Google_Art_Project.jpg'],
  ['Wheatfield with Crows', 'Vincent van Gogh, 1890', 'b/ba/Vincent_van_Gogh_-_Wheatfield_with_crows_-_Google_Art_Project.jpg'],
  ['The Gleaners', 'Jean-François Millet, 1857', '1/1f/Jean-Fran%C3%A7ois_Millet_-_Gleaners_-_Google_Art_Project_2.jpg'],
  ['The Bedroom', 'Vincent van Gogh, 1889', '0/0b/Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg'],
  ['Poppy Field', 'Claude Monet, 1873', '8/89/Claude_Monet_-_Poppy_Field_-_Google_Art_Project.jpg'],
];

const PASTELS = ['#e2dcf5', '#d4e4f7', '#f6dccf', '#d8ecdc'];
const CARD_COUNT = 24;          // slots on the ring; paintings repeat to fill them
const STEP = 360 / CARD_COUNT;   // degrees between cards
const AUTO_SPEED = 4;            // degrees per second when idle

const stage = document.getElementById('stage');
const ring = document.getElementById('ring');
const nowShowing = document.getElementById('now-showing');

let R = 1000, W = 300, H = 400;  // ring radius and card size, set by sizeRing()
let rot = 0;                     // current rotation of the ring in degrees
let velocity = 0;                // degrees per frame after a drag (inertia)
let target = null;               // rotation we're animating towards after a click
let hovering = false;
let dragging = false;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Build cards ----
const cards = Array.from({ length: CARD_COUNT }, (_, i) => {
  const [title, artist, path] = ART[i % ART.length];
  const card = document.createElement('figure');
  card.className = 'card';
  card.style.background = PASTELS[i % PASTELS.length];
  card.dataset.index = i;
  card.innerHTML = `
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/500px-${path.split('/').pop()}" alt="${title} by ${artist}" draggable="false">
    <figcaption>${title}<small>${artist}</small></figcaption>`;
  ring.appendChild(card);
  return card;
});

// ---- Size everything from the screen width ----
function sizeRing() {
  const vw = window.innerWidth;
  const narrow = vw < 760;
  R = narrow ? 900 : Math.max(520, vw * 0.75);        // cylinder radius
  // Viewer stands inside the cylinder. A deeper perspective on phones makes cards bigger.
  stage.style.perspective = `${R * (narrow ? 0.6 : 0.35)}px`;
  W = (2 * Math.PI * R / CARD_COUNT) * 0.92;          // card width leaves a small gap
  H = W * 1.3;
  cards.forEach((c) => { c.style.width = `${W}px`; c.style.height = `${H}px`; });
  render();
}

// Wrap an angle into -180..180
const wrap = (a) => ((a + 180) % 360 + 360) % 360 - 180;

// ---- Place each card on the cylinder ----
function render() {
  let front = null, frontAngle = 999;
  cards.forEach((card, i) => {
    const a = wrap(i * STEP + rot);
    card.style.transform =
      `translate(-50%, -50%) rotateY(${a}deg) translateZ(${-R}px)`;

    // Cards beside or behind the viewer fade out instead of filling the screen.
    const c = Math.cos(a * Math.PI / 180);
    const vis = Math.min(1, Math.max(0, (c - 0.02) / 0.12));
    card.style.opacity = vis;
    card.style.pointerEvents = vis > 0.5 ? 'auto' : 'none';

    if (Math.abs(a) < frontAngle) { frontAngle = Math.abs(a); front = card; }
  });
  // Readable caption for whichever card is nearest the middle.
  const [title, artist] = ART[Number(front.dataset.index) % ART.length];
  const text = `${title} — ${artist}`;
  if (nowShowing.textContent !== text) nowShowing.textContent = text;
}

// ---- Animation loop ----
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (target !== null) {
    // Ease towards a clicked card
    const diff = wrap(target - rot);
    rot += diff * Math.min(1, dt * 6);
    if (Math.abs(diff) < 0.05) { rot = target; target = null; }
  } else if (!dragging) {
    if (Math.abs(velocity) > 0.01) {
      rot += velocity;           // coast after a drag
      velocity *= 0.94;
    } else if (!hovering && !reduceMotion) {
      rot -= AUTO_SPEED * dt;    // slow idle rotation
    }
  }
  render();
  requestAnimationFrame(tick);
}

// ---- Drag to rotate ----
let startX = 0, lastX = 0, moved = 0;
stage.addEventListener('pointerdown', (e) => {
  dragging = true; target = null; velocity = 0;
  startX = lastX = e.clientX; moved = 0;
  stage.classList.add('dragging');
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX;
  moved += Math.abs(dx);
  const d = dx * (STEP / W) * 1.6;   // pixels → degrees
  rot += d;
  velocity = d;
});
const endDrag = (e) => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove('dragging');
  // A tap (not a drag) on a card brings it to the front.
  if (moved < 5) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el && el.closest('.card');
    if (card) {
      velocity = 0;
      target = rot + wrap(-(Number(card.dataset.index) * STEP + rot));
    }
  }
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

// Pause the idle spin while the mouse is over the gallery.
stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
stage.addEventListener('pointerleave', () => { hovering = false; });

// Trackpad sideways swipe rotates too.
stage.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    e.preventDefault();
    target = null;
    velocity = -e.deltaX * 0.02;
  }
}, { passive: false });

// Arrow keys
document.addEventListener('keydown', (e) => {
  const nearest = Math.round(-rot / STEP);
  if (e.key === 'ArrowRight') target = -(nearest + 1) * STEP;
  if (e.key === 'ArrowLeft') target = -(nearest - 1) * STEP;
});

window.addEventListener('resize', sizeRing);
sizeRing();
requestAnimationFrame(tick);

// Fullscreen slider: one fixed viewport with overflow hidden.
// .track-x holds the sections side by side and moves left/right.
// Inside the parks section, .track-y holds slides stacked vertically and moves up/down.

const SPEED = 800; // ms, matches --speed in the CSS

const IMG = (path) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/960px-${path.split('/').pop()}`;

const PARKS = [
  { name: 'Yosemite', state: 'California', fact: 'Home to El Capitan and Half Dome, carved by glaciers.',
    img: '1/12/Yosemite_National_Park.jpg', credit: 'Rainer Marks, public domain',
    page: 'https://commons.wikimedia.org/wiki/File:Yosemite_National_Park.jpg' },
  { name: 'Grand Canyon', state: 'Arizona', fact: 'Over a mile deep, exposing nearly 2 billion years of rock.',
    img: 'd/d0/Grand_Canyon_National_Park_GRCA9861.jpg', credit: 'National Park Service, public domain',
    page: 'https://commons.wikimedia.org/wiki/File:Grand_Canyon_National_Park_GRCA9861.jpg' },
  { name: 'Yellowstone', state: 'Wyoming', fact: 'The first national park (1872); Grand Prismatic Spring is its largest hot spring.',
    img: 'a/a9/Grand_Prismatic_Spring_%2830_August_2011%29_29_%2814299247140%29.jpg', credit: 'James St. John, CC BY 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Grand_Prismatic_Spring_(30_August_2011)_29_(14299247140).jpg' },
  { name: 'Zion', state: 'Utah', fact: 'Towering sandstone cliffs cut by the Virgin River.',
    img: 'e/e9/Zion_National_Park_ZION4523.jpg', credit: 'National Park Service, public domain',
    page: 'https://commons.wikimedia.org/wiki/File:Zion_National_Park_ZION4523.jpg' },
  { name: 'Arches', state: 'Utah', fact: 'Over 2,000 natural stone arches, including Delicate Arch.',
    img: '8/81/Delicate_Arch%2C_Arches_National_Park%2C_Utah_%2825%29_%286991764963%29.jpg', credit: 'Ken Lund, CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Delicate_Arch,_Arches_National_Park,_Utah_(25)_(6991764963).jpg' },
];

const PARKS_SECTION = 1;

const trackX = document.getElementById('track-x');
const trackY = document.getElementById('track-y');
const dotsEl = document.getElementById('dots');
const counter = document.getElementById('counter');
const sections = [...trackX.querySelectorAll('.section')];
const navButtons = [...document.querySelectorAll('.nav [data-goto]')];

let section = 0;   // which section is showing (horizontal)
let slide = 0;     // which park is showing (vertical)
let busy = false;  // blocks input while an animation runs

// ---- Build the park slides and dots ----
PARKS.forEach((park, i) => {
  const el = document.createElement('div');
  el.className = 'slide';
  el.dataset.bg = park.img;
  el.innerHTML = `
    <div class="content">
      <small>${park.state}</small>
      <h1>${park.name}</h1>
      <p>${park.fact}</p>
      <span class="credit">Photo: <a href="${park.page}" target="_blank" rel="noopener">${park.credit}</a></span>
    </div>`;
  trackY.appendChild(el);

  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', park.name);
  dot.addEventListener('click', () => goToSlide(i));
  dotsEl.appendChild(dot);
});

// Every slide's background comes from its data-bg path.
document.querySelectorAll('.slide[data-bg]').forEach((el) => {
  el.style.backgroundImage = `url("${IMG(el.dataset.bg)}")`;
});

const parkSlides = [...trackY.children];
const dots = [...dotsEl.children];

// ---- State → screen ----
function lock() {
  busy = true;
  setTimeout(() => (busy = false), SPEED);
}

function render() {
  // The two moves: percentages are relative to the track itself, i.e. one screen.
  trackX.style.transform = `translateX(${-section * 100}%)`;
  trackY.style.transform = `translateY(${-slide * 100}%)`;

  // Mark the visible slide active (triggers the text animation).
  document.querySelectorAll('.slide').forEach((s) => s.classList.remove('is-active'));
  const visible = section === PARKS_SECTION ? parkSlides[slide] : sections[section].querySelector('.slide');
  visible.classList.add('is-active');

  // Off-screen content can't be tabbed into or read out.
  sections.forEach((s, i) => (s.inert = i !== section));
  parkSlides.forEach((s, i) => (s.inert = i !== slide));

  dots.forEach((d, i) => d.setAttribute('aria-current', i === slide));
  navButtons.forEach((b) => b.setAttribute('aria-current', Number(b.dataset.goto) === section));
  counter.textContent = `${String(slide + 1).padStart(2, '0')} / ${String(PARKS.length).padStart(2, '0')}`;
}

function goToSection(i) {
  if (busy || i < 0 || i >= sections.length || i === section) return;
  section = i;
  lock();
  render();
}

function goToSlide(j) {
  if (busy || j < 0 || j >= PARKS.length || j === slide) return;
  slide = j;
  lock();
  render();
}

// Down/up: move through parks, then spill over into the next/previous section.
function step(dir) {
  if (section === PARKS_SECTION) {
    const target = slide + dir;
    if (target >= 0 && target < PARKS.length) return goToSlide(target);
  }
  goToSection(section + dir);
}

// ---- Inputs ----
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-goto]');
  if (btn) goToSection(Number(btn.dataset.goto));
});

document.addEventListener('keydown', (e) => {
  const keys = {
    ArrowRight: () => goToSection(section + 1),
    ArrowLeft: () => goToSection(section - 1),
    ArrowDown: () => step(1),
    PageDown: () => step(1),
    ArrowUp: () => step(-1),
    PageUp: () => step(-1),
  };
  if (keys[e.key]) {
    e.preventDefault();
    keys[e.key]();
  }
});

// Mouse wheel / trackpad. Small deltas are ignored so a trackpad flick moves one slide.
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (Math.abs(e.deltaY) < 20 && Math.abs(e.deltaX) < 20) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) goToSection(section + Math.sign(e.deltaX));
  else step(Math.sign(e.deltaY));
}, { passive: false });

// Touch swipes.
let touchStart = null;
window.addEventListener('touchstart', (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = touchStart.x - e.changedTouches[0].clientX;
  const dy = touchStart.y - e.changedTouches[0].clientY;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return; // a tap, not a swipe
  if (Math.abs(dx) > Math.abs(dy)) goToSection(section + Math.sign(dx));
  else step(Math.sign(dy));
});

render();

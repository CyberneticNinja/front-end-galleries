// Card slider: cards sit in a row at the bottom right. Every few seconds the
// first card expands into the background, and the old background moves to the end of the row.

const INTERVAL = 5000;   // ms each background stays before advancing
const SPEED = 900;       // ms for the move/expand animation (matches --speed in CSS)
const MARGIN = 40;       // px from the right and bottom edges

const IMG = (path) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/960px-${path.split('/').pop()}`;

const PARKS = [
  { name: 'Yosemite', state: 'California', fact: 'Home to El Capitan and Half Dome, carved by glaciers.',
    img: IMG('1/12/Yosemite_National_Park.jpg'),
    page: 'https://commons.wikimedia.org/wiki/File:Yosemite_National_Park.jpg', credit: 'Rainer Marks, public domain' },
  { name: 'Grand Canyon', state: 'Arizona', fact: 'Over a mile deep, exposing nearly 2 billion years of rock.',
    img: IMG('d/d0/Grand_Canyon_National_Park_GRCA9861.jpg'),
    page: 'https://commons.wikimedia.org/wiki/File:Grand_Canyon_National_Park_GRCA9861.jpg', credit: 'National Park Service, public domain' },
  { name: 'Yellowstone', state: 'Wyoming', fact: 'The first national park (1872); Grand Prismatic Spring is its largest hot spring.',
    img: IMG('a/a9/Grand_Prismatic_Spring_%2830_August_2011%29_29_%2814299247140%29.jpg'),
    page: 'https://commons.wikimedia.org/wiki/File:Grand_Prismatic_Spring_(30_August_2011)_29_(14299247140).jpg', credit: 'James St. John, CC BY 2.0' },
  { name: 'Zion', state: 'Utah', fact: 'Towering sandstone cliffs cut by the Virgin River.',
    img: IMG('e/e9/Zion_National_Park_ZION4523.jpg'),
    page: 'https://commons.wikimedia.org/wiki/File:Zion_National_Park_ZION4523.jpg', credit: 'National Park Service, public domain' },
  { name: 'Arches', state: 'Utah', fact: 'Over 2,000 natural stone arches, including Delicate Arch.',
    img: IMG('8/81/Delicate_Arch%2C_Arches_National_Park%2C_Utah_%2825%29_%286991764963%29.jpg'),
    page: 'https://commons.wikimedia.org/wiki/File:Delicate_Arch,_Arches_National_Park,_Utah_(25)_(6991764963).jpg', credit: 'Ken Lund, CC BY-SA 2.0' },
];

const stage = document.getElementById('stage');
const info = document.getElementById('info');
const bar = document.getElementById('bar');
const toggleBtn = document.getElementById('toggle');
const nextBtn = document.getElementById('next');

let order = [];      // order[0] is the background, the rest are the cards left → right
let timer = null;
let busy = false;
let playing = true;

// Create one element per park.
order = PARKS.map((park) => {
  const el = document.createElement('div');
  el.className = 'slide';
  el.style.backgroundImage = `url("${park.img}")`;
  el.park = park;
  el.innerHTML = `<div class="label"><small>${park.state}</small><strong>${park.name}</strong></div>`;
  stage.appendChild(el);
  return el;
});

function cardSize() {
  const css = getComputedStyle(document.documentElement);
  return {
    w: parseFloat(css.getPropertyValue('--card-w')),
    h: parseFloat(css.getPropertyValue('--card-h')),
    gap: parseFloat(css.getPropertyValue('--gap')),
  };
}

// Where card number `slot` (1 = leftmost card) sits.
function slotRect(slot) {
  const { w, h, gap } = cardSize();
  const count = order.length - 1;
  const rowWidth = count * w + (count - 1) * gap;
  const startX = window.innerWidth - MARGIN - rowWidth;
  return { left: startX + (slot - 1) * (w + gap), top: window.innerHeight - MARGIN - h, width: w, height: h };
}

function place(el, rect) {
  el.style.left = rect.left + 'px';
  el.style.top = rect.top + 'px';
  el.style.width = rect.width + 'px';
  el.style.height = rect.height + 'px';
}

// Put every element where it belongs for the current order.
function layout() {
  order.forEach((el, i) => {
    if (i === 0) {
      el.classList.add('is-bg');
      el.style.zIndex = 2;
      place(el, { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
    } else {
      el.classList.remove('is-bg');
      el.style.zIndex = 10 + i;
      place(el, slotRect(i));
    }
  });
}

function showInfo(park) {
  info.classList.remove('fade');
  info.innerHTML = `
    <small>${park.state}</small>
    <h1>${park.name}</h1>
    <p>${park.fact}<br><span class="credit">Photo: <a href="${park.page}" target="_blank" rel="noopener">${park.credit}</a></span></p>`;
  void info.offsetWidth;          // restart the CSS animation
  info.classList.add('fade');
}

function startProgress() {
  bar.style.transition = 'none';
  bar.style.width = '0';
  void bar.offsetWidth;
  if (playing) {
    bar.style.transition = `width ${INTERVAL}ms linear`;
    bar.style.width = '100%';
  }
}

function schedule() {
  clearTimeout(timer);
  startProgress();
  if (playing) timer = setTimeout(next, INTERVAL);
}

// The main step: first card → background, old background → end of the row.
function next() {
  if (busy) return;
  busy = true;

  const oldBg = order.shift();
  order.push(oldBg);
  const newBg = order[0];

  // Old background drops underneath while the new one grows over it.
  oldBg.style.zIndex = 1;
  newBg.style.zIndex = 2;
  newBg.classList.add('is-bg');
  place(newBg, { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });

  // Remaining cards slide one slot to the left.
  order.slice(1, -1).forEach((el, i) => {
    el.style.zIndex = 10 + i + 1;
    place(el, slotRect(i + 1));
  });

  showInfo(newBg.park);

  // Once the expansion finishes, snap the old background into the last slot and fade it in.
  setTimeout(() => {
    oldBg.classList.add('no-anim');
    oldBg.classList.remove('is-bg');
    oldBg.style.opacity = 0;
    oldBg.style.zIndex = 10 + order.length - 1;
    place(oldBg, slotRect(order.length - 1));
    void oldBg.offsetWidth;
    oldBg.classList.remove('no-anim');
    oldBg.style.opacity = 1;
    busy = false;
  }, SPEED);

  schedule();
}

toggleBtn.addEventListener('click', () => {
  playing = !playing;
  toggleBtn.textContent = playing ? 'Pause' : 'Play';
  schedule();
});

nextBtn.addEventListener('click', next);

// Click a card to jump straight to it.
stage.addEventListener('click', (e) => {
  const el = e.target.closest('.slide');
  if (!el || busy || el === order[0]) return;
  const steps = order.indexOf(el);
  for (let i = 1; i < steps; i++) order.push(order.splice(1, 1)[0]); // rotate it to the front of the row
  next();
});

window.addEventListener('resize', () => {
  order.forEach((el) => el.classList.add('no-anim'));
  layout();
  requestAnimationFrame(() => order.forEach((el) => el.classList.remove('no-anim')));
});

// Initial state: no animation on first paint.
order.forEach((el) => el.classList.add('no-anim'));
layout();
requestAnimationFrame(() => order.forEach((el) => el.classList.remove('no-anim')));
showInfo(order[0].park);
schedule();

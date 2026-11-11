// Prime-style rows: tiles sit edge to edge, scroll horizontally, and grow on hover.

const WIKI = (path) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/960px-${path.split('/').pop()}`;
const PICSUM = (seed) => `https://picsum.photos/seed/${seed}/480/270`;

const PARK_IMGS = [
  WIKI('1/12/Yosemite_National_Park.jpg'),
  WIKI('d/d0/Grand_Canyon_National_Park_GRCA9861.jpg'),
  WIKI('a/a9/Grand_Prismatic_Spring_%2830_August_2011%29_29_%2814299247140%29.jpg'),
  WIKI('e/e9/Zion_National_Park_ZION4523.jpg'),
  WIKI('8/81/Delicate_Arch%2C_Arches_National_Park%2C_Utah_%2825%29_%286991764963%29.jpg'),
];

// Invented titles for the demo.
const ROWS = [
  {
    title: 'National park originals',
    items: [
      ['Valley of Giants', PARK_IMGS[0], 2024, '98% match', 'Climbers and rangers spend a year beneath El Capitan.'],
      ['Two Billion Years', PARK_IMGS[1], 2023, '95% match', 'The Grand Canyon, told one rock layer at a time.'],
      ['Hot Water', PARK_IMGS[2], 2025, '97% match', "Inside Yellowstone's restless geothermal heart."],
      ['Red Walls', PARK_IMGS[3], 2022, '91% match', 'Flash floods, condors, and the cliffs of Zion.'],
      ['Stone Windows', PARK_IMGS[4], 2024, '93% match', 'How wind and water carved 2,000 arches.'],
      ['Valley at Night', PARK_IMGS[0], 2025, '89% match', 'What happens in Yosemite after the crowds leave.'],
      ['Rim to River', PARK_IMGS[1], 2021, '90% match', 'A 9-day rafting trip down the Colorado.'],
      ['The First Park', PARK_IMGS[2], 2020, '94% match', 'How Yellowstone became the world\'s first national park.'],
    ],
  },
  { title: 'Trending now', seedPrefix: 'trend' },
  { title: 'Because you watched Hot Water', seedPrefix: 'because' },
  { title: 'Award-winning films', seedPrefix: 'award' },
];

const NAMES = ['Northern Light', 'The Long Road', 'Saltwater', 'Echo Ridge', 'Last Harbor', 'Quiet Hours',
  'Ironwood', 'Blue Hour', 'Wildfire Season', 'Paper Moons', 'The Crossing', 'Afterglow'];
const BLURBS = ['A slow-burn drama about a town that refuses to change.', 'Two strangers, one road trip, no plan.',
  'A fishing crew faces its hardest winter.', 'A detective returns to the town she left.'];

// Fill rows that only have a seed prefix with generated items.
ROWS.forEach((row, r) => {
  if (row.items) return;
  row.items = NAMES.map((name, i) => [
    name, PICSUM(`${row.seedPrefix}${i}`), 2018 + ((i + r) % 8), `${85 + ((i * 7 + r) % 14)}% match`, BLURBS[(i + r) % BLURBS.length],
  ]);
});

// ---- Build the page ----
const main = document.getElementById('rows');

function createTile([title, img, year, match, blurb]) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.tabIndex = 0;
  tile.style.backgroundImage = `url("${img}")`;
  tile.setAttribute('aria-label', title);
  tile.innerHTML = `
    <div class="title">${title}</div>
    <div class="details">
      <strong>${title}</strong>
      <div class="meta"><b>${match}</b> · ${year} · HD</div>
      <p>${blurb}</p>
      <div class="actions"><span class="play">&#9654;</span><span class="add">+</span></div>
    </div>`;
  return tile;
}

function createRow(row) {
  const section = document.createElement('section');
  section.className = 'row';
  section.innerHTML = `
    <h2>${row.title}</h2>
    <button class="arrow prev" type="button" aria-label="Scroll left" hidden>&#8249;</button>
    <div class="scroller"></div>
    <button class="arrow next" type="button" aria-label="Scroll right">&#8250;</button>`;

  const scroller = section.querySelector('.scroller');
  row.items.forEach((item) => scroller.appendChild(createTile(item)));

  const prev = section.querySelector('.prev');
  const next = section.querySelector('.next');

  // Arrows scroll one "page" of tiles.
  prev.addEventListener('click', () => scroller.scrollBy({ left: -scroller.clientWidth * 0.9 }));
  next.addEventListener('click', () => scroller.scrollBy({ left: scroller.clientWidth * 0.9 }));

  // Hide an arrow when there's nothing more in that direction.
  const updateArrows = () => {
    prev.hidden = scroller.scrollLeft < 5;
    next.hidden = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 5;
  };
  scroller.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  requestAnimationFrame(updateArrows);

  // Tiles at the visible edges grow inward so they don't get cut off.
  const setOrigin = (e) => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    const t = tile.getBoundingClientRect();
    const s = scroller.getBoundingClientRect();
    const edge = parseFloat(getComputedStyle(scroller).paddingLeft);
    tile.classList.toggle('origin-left', t.left - s.left < edge + t.width * 0.5);
    tile.classList.toggle('origin-right', s.right - t.right < edge + t.width * 0.5);
  };
  scroller.addEventListener('mouseover', setOrigin);
  scroller.addEventListener('focusin', setOrigin);

  return section;
}

ROWS.forEach((row) => main.appendChild(createRow(row)));

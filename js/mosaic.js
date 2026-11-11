// Mosaic hero: one image shown through a checkerboard of rounded tiles.
// Each column is split at two heights (b1, b2). Even columns show the image
// above b1 and below b2; odd columns show it between b1 and b2.
// Every few seconds the split heights change and the tiles morph to the new shape.

const IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Johannes_Vermeer_%281632-1675%29_-_The_Girl_With_The_Pearl_Earring_%281665%29.jpg/1280px-Johannes_Vermeer_%281632-1675%29_-_The_Girl_With_The_Pearl_Earring_%281665%29.jpg';
const COLUMNS = 4;
const MORPH_EVERY = 4500;      // ms between shape changes
const GAP = 0.012;             // small vertical gap so diagonal tiles don't touch

const mosaic = document.getElementById('mosaic');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (min, max) => min + Math.random() * (max - min);

// ---- Build tiles: even columns get 2 tiles, odd columns get 1 ----
const columns = Array.from({ length: COLUMNS }, (_, c) => {
  const count = c % 2 === 0 ? 2 : 1;
  const tiles = Array.from({ length: count }, () => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.setProperty('--x', c / COLUMNS);
    tile.style.setProperty('--w', 1 / COLUMNS);
    tile.innerHTML = `<img src="${IMAGE}" alt="">`;
    mosaic.appendChild(tile);
    return tile;
  });
  return { index: c, tiles };
});

// Random split heights. Even columns get a short blank gap in the middle;
// odd columns get a tall image tile with short blanks above and below.
// That keeps roughly two thirds of the picture visible, like the reference.
function randomSplits(even) {
  if (even) {
    const b1 = rand(0.28, 0.42);
    return [b1, b1 + rand(0.26, 0.34)];
  }
  return [rand(0.1, 0.24), rand(0.74, 0.9)];
}

function setTile(tile, y, h, delay = 0) {
  tile.style.transitionDelay = `${delay}ms`;
  tile.style.setProperty('--y', y);
  tile.style.setProperty('--h', Math.max(0, h));
}

// Apply a shape. `stagger` adds a small delay per column for a wave effect.
function applyShape(stagger = 90) {
  columns.forEach(({ index, tiles }) => {
    const [b1, b2] = randomSplits(tiles.length === 2);
    const delay = index * stagger;
    if (tiles.length === 2) {
      setTile(tiles[0], 0, b1 - GAP / 2, delay);
      setTile(tiles[1], b2 + GAP / 2, 1 - b2 - GAP / 2, delay + 60);
    } else {
      setTile(tiles[0], b1 + GAP / 2, b2 - b1 - GAP, delay);
    }
  });
}

// ---- Intro: tiles start collapsed at their centre lines, then open ----
columns.forEach(({ tiles }) => {
  tiles.forEach((tile, i) => {
    tile.style.transition = 'none';
    const centre = tiles.length === 2 ? (i === 0 ? 0.15 : 0.85) : 0.5;
    setTile(tile, centre, 0);
  });
});
mosaic.getBoundingClientRect();                   // commit the collapsed state
columns.forEach(({ tiles }) => tiles.forEach((t) => (t.style.transition = '')));
requestAnimationFrame(() => applyShape(140));

// ---- Keep morphing (skipped for reduced motion) ----
if (!reduceMotion) {
  setInterval(() => { if (!document.hidden) applyShape(); }, MORPH_EVERY);
}

// ---- Gentle parallax: the image drifts slightly with the mouse ----
if (!reduceMotion) {
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const dx = (e.clientX / window.innerWidth - 0.5) * -14;
    const dy = (e.clientY / window.innerHeight - 0.5) * -14;
    mosaic.style.setProperty('--px', `${dx.toFixed(1)}px`);
    mosaic.style.setProperty('--py', `${dy.toFixed(1)}px`);
  });
}

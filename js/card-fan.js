// Card fan: cards rest slightly fanned like a hand of cards, fan out fully on hover.
// All the movement is CSS. JS only builds the cards and gives each one its position
// in the hand (--t), plus tap support for touch screens.

const UNSPLASH = (id) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

const CARDS = [
  { title: 'Boardwalk to the peaks', place: 'Mount Bierstadt, Colorado', img: UNSPLASH('photo-1760685468640-dddb93b7a10b') },
  { title: 'Still water, tall pines', place: 'Photo: Bruno da Costa', img: UNSPLASH('photo-1793622316804-e3902369044e') },
  { title: 'Drifters', place: 'Photo: Rafael Garcin', img: UNSPLASH('photo-1767462737177-f0ea19a917d8') },
  { title: 'Morning mist', place: 'Sidmouth, Devon', img: UNSPLASH('photo-1793443751969-f4f952e790c0') },
];

const hand = document.getElementById('hand');
const hint = document.getElementById('hint');
const middle = (CARDS.length - 1) / 2;

CARDS.forEach((card, i) => {
  const el = document.createElement('figure');
  el.className = 'card';
  el.style.setProperty('--t', i - middle);  // -1.5, -0.5, 0.5, 1.5 for four cards
  el.style.setProperty('--i', i);           // small stagger as the hand opens
  el.innerHTML = `
    <img src="${card.img}" alt="${card.title}" draggable="false">
    <span class="idx tl">${i + 1}</span>
    <span class="idx br">${i + 1}</span>
    <figcaption class="label">${card.title}<small>${card.place}</small></figcaption>`;
  hand.appendChild(el);
});

// ---- Touch screens: tap to open the hand, tap a card to pick it, tap outside to close ----
const isTouch = matchMedia('(hover: none)').matches;
if (isTouch) hint.textContent = 'Tap to fan the cards';

hand.addEventListener('click', (e) => {
  if (!isTouch) return;
  const card = e.target.closest('.card');
  if (!hand.classList.contains('is-open')) {
    hand.classList.add('is-open');
    return;
  }
  hand.querySelectorAll('.card').forEach((c) => c.classList.toggle('is-picked', c === card && !c.classList.contains('is-picked')));
});

document.addEventListener('click', (e) => {
  if (isTouch && !hand.contains(e.target)) {
    hand.classList.remove('is-open');
    hand.querySelectorAll('.is-picked').forEach((c) => c.classList.remove('is-picked'));
  }
});

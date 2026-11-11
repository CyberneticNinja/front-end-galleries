// Park data. Images are hosted on Wikimedia Commons (public domain or CC, credited on each card).
const PARKS = [
  {
    name: 'Yosemite',
    state: 'California',
    fact: 'Home to El Capitan and Half Dome, carved by glaciers.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Yosemite_National_Park.jpg/960px-Yosemite_National_Park.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Yosemite_National_Park.jpg',
    credit: 'Rainer Marks, public domain',
  },
  {
    name: 'Grand Canyon',
    state: 'Arizona',
    fact: 'Over a mile deep, exposing nearly 2 billion years of rock.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Grand_Canyon_National_Park_GRCA9861.jpg/960px-Grand_Canyon_National_Park_GRCA9861.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Grand_Canyon_National_Park_GRCA9861.jpg',
    credit: 'National Park Service, public domain',
  },
  {
    name: 'Yellowstone',
    state: 'Wyoming',
    fact: 'The first national park (1872); Grand Prismatic Spring is its largest hot spring.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Grand_Prismatic_Spring_%2830_August_2011%29_29_%2814299247140%29.jpg/960px-Grand_Prismatic_Spring_%2830_August_2011%29_29_%2814299247140%29.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Grand_Prismatic_Spring_(30_August_2011)_29_(14299247140).jpg',
    credit: 'James St. John, CC BY 2.0',
  },
  {
    name: 'Zion',
    state: 'Utah',
    fact: 'Towering sandstone cliffs cut by the Virgin River.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Zion_National_Park_ZION4523.jpg/960px-Zion_National_Park_ZION4523.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Zion_National_Park_ZION4523.jpg',
    credit: 'National Park Service, public domain',
  },
  {
    name: 'Arches',
    state: 'Utah',
    fact: 'Over 2,000 natural stone arches, including Delicate Arch.',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Delicate_Arch%2C_Arches_National_Park%2C_Utah_%2825%29_%286991764963%29.jpg/960px-Delicate_Arch%2C_Arches_National_Park%2C_Utah_%2825%29_%286991764963%29.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Delicate_Arch,_Arches_National_Park,_Utah_(25)_(6991764963).jpg',
    credit: 'Ken Lund, CC BY-SA 2.0',
  },
];

const deck = document.getElementById('deck');
const delayInput = document.getElementById('delay');
const delayOut = document.getElementById('delay-out');
const playBtn = document.getElementById('play');
const resetBtn = document.getElementById('reset');

let timers = [];

// Build one card element from a park object.
function createCard(park, index) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="face face--back" aria-hidden="true">
      <div>
        <div class="badge">${index + 1}</div>
        <small>National park</small>
      </div>
    </div>
    <div class="face face--front">
      <img src="${park.img}" alt="${park.name} National Park" loading="lazy">
      <div class="body">
        <h2>${park.name}</h2>
        <p class="state">${park.state}</p>
        <p class="fact">${park.fact}</p>
        <p class="credit">Photo: <a href="${park.page}" target="_blank" rel="noopener">${park.credit}</a></p>
      </div>
    </div>`;
  return card;
}

// Cancel any reveal that's still running.
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function resetCards() {
  clearTimers();
  deck.querySelectorAll('.card').forEach(c => c.classList.remove('is-open'));
}

// The timed part: each card opens `delay` ms after the previous one.
function revealCards() {
  resetCards();
  const delay = Number(delayInput.value);
  const cards = [...deck.querySelectorAll('.card')];

  cards.forEach((card, i) => {
    const id = setTimeout(() => card.classList.add('is-open'), 300 + i * delay);
    timers.push(id);
  });
}

PARKS.forEach((park, i) => deck.appendChild(createCard(park, i)));

delayInput.addEventListener('input', () => {
  delayOut.textContent = `${delayInput.value} ms`;
});
playBtn.addEventListener('click', revealCards);
resetBtn.addEventListener('click', resetCards);

// Click a single card to toggle it manually.
deck.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (card && !e.target.closest('a')) card.classList.toggle('is-open');
});

revealCards();

// Real rewards: set by Mum and Dad (starting menu from the design). 100 koins = $1.
export const REAL_REWARDS = [
  { id: 'tv', name: "Pick what's on TV tonight", price: 150, icon: 'tv' },
  { id: 'late', name: 'Stay up 60 min later on a weekend', price: 200, icon: 'moon' },
  { id: 'movie', name: 'Pick the family movie or game, and snacks', price: 300, icon: 'popcorn' },
  { id: 'cash5', name: '$5 pocket money', price: 500, icon: 'cash' },
  { id: 'lego', name: 'Small Lego set or toy', price: 2000, icon: 'brick' },
  { id: 'dayout', name: 'A day or night out you choose', price: 4000, icon: 'ticket' },
  { id: 'nintendo', name: 'A new Nintendo game', price: 7000, icon: 'controller' }
];

// Game items: cosmetic, bought straight away. Room items 100 to 1,500; hero items 50 to 400.
export const GAME_ITEMS = [
  { id: 'chair', type: 'room', name: 'Gaming chair', price: 600 },
  { id: 'bunk', type: 'room', name: 'Bunk bed with a slide', price: 1200 },
  { id: 'telescope', type: 'room', name: 'Space telescope', price: 900 },
  { id: 'terrarium', type: 'room', name: 'Bug terrarium', price: 700 },
  { id: 'stars', type: 'room', name: 'Glow-in-the-dark stars', price: 300 },
  { id: 'table', type: 'room', name: 'Building table', price: 800 },
  { id: 'pixel', type: 'hero', name: 'Pixel Quest outfit', price: 400, desc: 'Turns your hero into retro pixels' },
  { id: 'cape', type: 'hero', name: 'Cape', price: 250, extra: 'cape' },
  { id: 'headphones', type: 'hero', name: 'Headphones', price: 200, extra: 'headphones' },
  { id: 'glasses', type: 'hero', name: 'Glasses', price: 150, extra: 'glasses' },
  { id: 'backpack', type: 'hero', name: 'Backpack', price: 200, extra: 'backpack' },
  { id: 'cap', type: 'hero', name: 'Cap', price: 150, extra: 'cap' }
];
export const GAME_ITEM_BY_ID = Object.fromEntries(GAME_ITEMS.map((i) => [i.id, i]));
export const REWARD_BY_ID = Object.fromEntries(REAL_REWARDS.map((r) => [r.id, r]));

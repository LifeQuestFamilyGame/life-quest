// The family's players, as designed in the Life Quest Studio on 1 November 2026.
// loginHash is the SHA-256 of each Firebase login email, so the emails never appear in the published code.

export const FAMILY_PLAYERS = [
  {
    id: 'kaelen', role: 'kid', name: 'Kaelen', loginHash: '3136dbcdbe73e65c8eee9ec36314a5b38b7b3705c39381d0ebebb868995ed9ad',
    heroName: 'ooooogaboogabooga!',
    hero: { skin: 0, hairStyle: 'short', hairColour: 'black', eyes: 'round', outfit: 'tshirt', outfitColour: 4, extra: 'none' },
    pet: { type: 'turtle', name: 'Kelpy' }, tint: '#FFF1C9', wishlist: ['chair', 'bunk']
  },
  {
    id: 'xavier', role: 'kid', name: 'Xavier', loginHash: '4feb5b40de112adff61c3767884e75c22b82c89bde03ab9698d168a56ac23992',
    heroName: 'Xavier',
    hero: { skin: 1, hairStyle: 'short', hairColour: 'brown', eyes: 'round', outfit: 'hoodie', outfitColour: 4, extra: 'cap' },
    pet: { type: 'turtle', name: 'Scutie' }, tint: '#DDF6EA', wishlist: ['terrarium', 'telescope']
  },
  {
    id: 'debora', role: 'parent', name: 'Debora', loginHash: '5e2af83223e14b74edbd5aaf3d58b45148b0dc4cf455803c2d05eda0b4ba4d6c',
    heroName: 'Messy',
    hero: { skin: 1, hairStyle: 'long', hairColour: 'brown', eyes: 'happy', outfit: 'jersey', outfitColour: 4, extra: 'glasses' },
    pet: { type: 'puppy', name: 'Bix' }, tint: '#FFE3EE', wishlist: ['table', 'telescope']
  },
  {
    id: 'jonathan', role: 'parent', name: 'Jonathan', loginHash: 'e53dfebb58ebd1528a8629bd7ceecc111bc9de5375c44c57a7cda45e9503f15e',
    heroName: 'Dadenator 2000',
    hero: { skin: 1, hairStyle: 'short', hairColour: 'brown', eyes: 'round', outfit: 'labcoat', outfitColour: 3, extra: 'cap' },
    pet: { type: 'shrimp', name: 'Ariel' }, tint: '#E8E3FF', wishlist: ['stars', 'telescope']
  }
];

export const KIDS = FAMILY_PLAYERS.filter((p) => p.role === 'kid').map((p) => p.id);

// Bix eats once a day; the boys take turns on alternate evenings.
// On BIX_ROSTER.startDate the first boy feeds him; the turn swaps every day after that.
export const BIX_ROSTER = { startDate: '2026-11-01', first: 'kaelen' };

export const ECONOMY = {
  weeklyCaps: [600, 700, 800, 900, 1000],
  interestRate: 0.02,
  interestCeiling: 5000,
  streakWeekBonus: 50,
  startStat: 40
};

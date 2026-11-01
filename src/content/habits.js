// The boys' shared habit list, from the Life Quest design (v1.0).
// when: 'today' habits are ticked at the 5pm session for that day;
//       'lastNight' habits happen after the session and are ticked the next day.
// freq: daily | days (fixed weekdays, 0 = Sunday) | weekly (target per Monday-to-Sunday week,
//       optionally only on some weekdays) | roster (Bix's feeding turn).
// kind: honour habits pay XP and stats only; approved habits also pay koins once a parent approves.

export const HABITS = [
  { id: 'teethAm', name: 'Brush teeth, morning', when: 'today', freq: { type: 'daily' }, kind: 'honour', stat: 'health', xp: 5, coins: 0, events: 'teeth' },
  { id: 'piano', name: 'Piano, 10 min', when: 'today', freq: { type: 'weekly', target: 5 }, kind: 'approved', stat: 'brains', xp: 15, coins: 10, events: 'piano', minutes: 10 },
  { id: 'homework', name: 'Homework, 10 to 15 min', short: 'Homework', when: 'today', freq: { type: 'weekly', target: 3 }, kind: 'approved', stat: 'brains', xp: 15, coins: 15, events: 'homework', minutes: 12 },
  { id: 'reading', name: 'Reading, 10 min', when: 'today', freq: { type: 'weekly', target: 5 }, kind: 'honour', stat: 'brains', xp: 10, coins: 0, events: 'reading', minutes: 10 },
  { id: 'tennis', name: 'Tennis', when: 'today', freq: { type: 'days', days: [1, 3] }, kind: 'approved', stat: 'health', xp: 15, coins: 15, events: 'tennis' },
  { id: 'martial', name: 'Martial arts', when: 'today', freq: { type: 'weekly', target: 2, days: [2, 4, 6] }, kind: 'approved', stat: 'health', xp: 15, coins: 15, events: 'martial', locked: 'martial' },
  { id: 'bike', name: 'Bike riding practice', short: 'Bike riding', when: 'today', freq: { type: 'weekly', target: 1 }, kind: 'approved', stat: 'health', xp: 15, coins: 15, events: 'bike' },
  { id: 'brushBix', name: 'Brush Bix, 5 min', short: 'Brush Bix', when: 'today', freq: { type: 'weekly', target: 1 }, kind: 'approved', stat: 'heart', xp: 10, coins: 15, events: 'brushBix' },
  { id: 'teethPm', name: 'Brush teeth, night', when: 'lastNight', freq: { type: 'daily' }, kind: 'honour', stat: 'health', xp: 5, coins: 0, events: 'teeth' },
  { id: 'devices', name: 'Devices off', sub: '60 min before bed', when: 'lastNight', freq: { type: 'daily' }, kind: 'approved', stat: 'health', xp: 10, coins: 5, events: 'devices' },
  { id: 'table', name: 'Help set the table', short: 'Set the table', when: 'lastNight', freq: { type: 'daily' }, kind: 'approved', stat: 'heart', xp: 5, coins: 5, events: 'table' },
  { id: 'plates', name: 'Clear the plates', when: 'lastNight', freq: { type: 'daily' }, kind: 'approved', stat: 'heart', xp: 5, coins: 5, events: 'plates' },
  { id: 'feedBix', name: 'Feed Bix', sub: 'your turn', when: 'lastNight', freq: { type: 'roster' }, kind: 'approved', stat: 'heart', xp: 10, coins: 10, events: 'feedBix' }
];

export const HABIT_BY_ID = Object.fromEntries(HABITS.map((h) => [h.id, h]));

// Parents' own characters run on their own habits. Their koins are cosmetic only.
export const PARENT_HABITS = [
  { id: 'exercise', name: 'Exercise, 30 min', when: 'today', freq: { type: 'daily' }, kind: 'honour', stat: 'health', xp: 15, coins: 10 },
  { id: 'pReading', name: 'Read, 10 min', when: 'today', freq: { type: 'daily' }, kind: 'honour', stat: 'brains', xp: 10, coins: 5 },
  { id: 'phones', name: 'Phones away at dinner', when: 'lastNight', freq: { type: 'daily' }, kind: 'honour', stat: 'heart', xp: 10, coins: 5 }
];
export const PARENT_HABIT_BY_ID = Object.fromEntries(PARENT_HABITS.map((h) => [h.id, h]));

export const STATS = ['health', 'brains', 'money', 'heart'];
export const STAT_NAMES = { health: 'Health', brains: 'Brains', money: 'Money', heart: 'Heart' };

export const FOOD_ADVENTURE = { xp: 50, coins: 50, healthyMultiplier: 2 };

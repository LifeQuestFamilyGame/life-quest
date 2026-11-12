// Life Quest game rules. Pure functions: they take plain state objects, change copies of
// them, and return what happened so the screens can show it. The data layer saves the results.
import { HABITS, PARENT_HABITS, STATS, STAT_NAMES, FOOD_ADVENTURE } from '../content/habits.js';
import { HABIT_EVENTS, HABIT_ROLL_EFFECTS, BAD_LUCK_LINES, BAD_LUCK_NOTE, CHECKUP, CHECKUP_EFFECTS } from '../content/events.js';
import { BIX_ROSTER, ECONOMY } from '../content/family.js';
import { GAME_ITEM_BY_ID } from '../content/shop.js';
import CARDS from '../content/cards-ch1.json';
import * as D from './dates.js';
import * as R from './rules.js';

export { CARDS };
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const DOJO_CARD = '1.09';
const clone = (o) => JSON.parse(JSON.stringify(o));
const statsObj = (v) => Object.fromEntries(STATS.map((s) => [s, v]));

// ---------------------------------------------------------------------------
// New players
export function newWeek(start) {
  return {
    start, paid: false, earned: 0, overCap: 0, banked: 0, pendingSunday: 0,
    right: { count: 0, coins: 0, xp: 0 }, tempt: { count: 0, coins: 0, cost: 0 }, middle: { count: 0, coins: 0 },
    items: []
  };
}

export function newPlayer(def, startDate) {
  return {
    ...clone(def),
    startDate,
    xp: 0,
    stats: statsObj(ECONOMY.startStat),
    risk: statsObj(0),
    goodCount: statsObj(0),
    lastGood: statsObj(startDate),
    lastFade: statsObj(startDate),
    wallet: 0,
    bank: 0,
    week: newWeek(D.weekStart(startDate)),
    lastWeek: null,
    streak: { count: 0, last: null, shields: 0, best: 0, paused: false },
    badges: [],
    inventory: [],
    style: 'cartoon',
    deck: { seen: [], queue: [] },
    seeds: [],
    unlocked: {},
    martialCount: 0,
    comeback: {},
    food: { week: null, passport: [] },
    totals: { habitsDone: {}, minutes: 0, right: 0, tempting: 0, middle: 0, coinsEarned: 0, sessions: 0 },
    messages: [],
    notes: []
  };
}

// ---------------------------------------------------------------------------
// Small helpers that change a player in place (always called on a copy).
function pushMsg(p, text, date) { p.messages = [{ text, date }, ...(p.messages || [])].slice(0, 10); }
function pushNote(p, text, date) { p.notes = [{ text, date }, ...(p.notes || [])].slice(0, 20); }

export function addXp(p, base, { boost = true } = {}) {
  if (base <= 0) return 0;
  const gained = Math.round(base * (boost && p.role === 'kid' ? R.xpMultiplier(p.streak.count) : 1));
  p.xp += gained;
  return gained;
}
// Levels never go down, so losses stop at the start of the current level.
export function loseXp(p, amount) {
  const info = R.levelInfo(p.xp);
  const floor = p.xp - info.into;
  const before = p.xp;
  p.xp = Math.max(floor, p.xp - amount);
  return before - p.xp;
}

// Koins earned count toward the weekly cap (except bank interest).
export function earn(p, amount, kind, label, date) {
  if (!amount || amount <= 0) return 0;
  let paid = amount;
  if (kind !== 'interest') {
    const cap = R.levelInfo(p.xp).weeklyCap;
    paid = Math.max(0, Math.min(amount, cap - p.week.earned));
    p.week.earned += paid;
    p.week.overCap += amount - paid;
  }
  if (paid > 0) {
    if (kind === 'interest') p.bank += paid; else p.wallet += paid;
    p.totals.coinsEarned += paid;
    p.week.items.push({ kind, label, amount: paid, date });
  }
  return paid;
}
// Bills come out of the wallet first, then the bank. Anything left over is owed (wallet below zero).
export function charge(p, amount, kind, label, date) {
  if (!amount || amount <= 0) return 0;
  const fromWallet = Math.max(0, Math.min(p.wallet, amount));
  const fromBank = Math.min(p.bank, amount - fromWallet);
  p.wallet -= amount - fromBank;
  p.bank -= fromBank;
  p.week.items.push({ kind, label, amount: -amount, date, fromBank });
  return amount;
}

export function changeStat(p, stat, delta, date) {
  const before = p.stats[stat];
  p.stats[stat] = R.clampStat(before + delta);
  if (delta > 0 && date) p.lastGood[stat] = date;
  return p.stats[stat] - before;
}

export function addRisk(p, stat) { p.risk[stat] = Math.min((p.risk[stat] || 0) + 1, 6); }

// Every good choice in an area, and every check-in with that area's habits all done, heals one crack
// (changed from one crack per three good choices on 12 Nov 2026).
export function goodChoice(p, stat, date) {
  p.goodCount[stat] = (p.goodCount[stat] || 0) + 1;
  p.lastGood[stat] = date;
  if (p.risk[stat] > 0) { p.risk[stat] -= 1; return true; }
  return false;
}

// One-off corrections to saved players. Each runs once per player and is recorded in player.fixes.
// rescore-2026-11-12: the boys' first fortnight replayed with the same dice under the fairer crack rules.
export const FIXES = [
  {
    id: 'rescore-2026-11-12',
    startDate: '2026-11-01', // only the real family game, not practice players
    players: {
      kaelen: { stats: { health: 5, brains: 20, heart: 23 }, risk: { health: -4, heart: -2, brains: -2 }, xp: 10, coins: 50,
        message: 'We made the game fairer! Your first two weeks were re-scored with the same dice rolls: Brains +20, Heart +23, Health +5, and the 50-koin library fine is refunded.' },
      xavier: { stats: { heart: 11 }, risk: { brains: -1, heart: -1 }, xp: 10, coins: 0,
        message: 'We made the game fairer! Your first two weeks were re-scored with the same dice rolls: Heart +11.' }
    }
  }
];

export function applyFixes(player, date) {
  const p = clone(player);
  const applied = [];
  for (const fix of FIXES) {
    const f = fix.players[p.id];
    if (!f || (p.fixes || []).includes(fix.id)) continue;
    if (fix.startDate && p.startDate !== fix.startDate) continue;
    for (const [s, v] of Object.entries(f.stats || {})) p.stats[s] = R.clampStat((p.stats[s] ?? 40) + v);
    for (const [s, v] of Object.entries(f.risk || {})) p.risk[s] = Math.max(0, Math.min(6, (p.risk[s] || 0) + v));
    if (f.xp) p.xp += f.xp;
    if (f.coins) { p.wallet += f.coins; p.week.items.push({ kind: 'fix', label: 'Re-score refund', amount: f.coins, date }); }
    if (f.message) pushMsg(p, f.message, date);
    p.fixes = [...(p.fixes || []), fix.id];
    applied.push(fix.id);
  }
  return { player: p, applied };
}

// Stats fade by 1 point every 3 days with no good choice in that area.
export function applyFade(p, date) {
  const faded = [];
  for (const s of STATS) {
    const since = p.lastGood[s] > p.lastFade[s] ? p.lastGood[s] : p.lastFade[s];
    const n = Math.floor(D.daysBetween(since, date) / 3);
    if (n > 0 && D.daysBetween(p.lastGood[s], date) >= 3) {
      p.stats[s] = R.clampStat(p.stats[s] - n);
      p.lastFade[s] = D.addDays(since, n * 3);
      faded.push({ stat: s, by: n });
    }
  }
  return faded;
}

// Start a new week once the old one has been paid.
export function ensureWeek(p, date) {
  const ws = D.weekStart(date);
  if (p.week.start < ws && p.week.paid) p.week = newWeek(ws);
  return p.week.start < ws && !p.week.paid; // true = payday overdue
}

// ---------------------------------------------------------------------------
// Habits due at check-in
export function habitList(p) {
  if (p.role === 'parent') return PARENT_HABITS;
  return HABITS.filter((h) => !h.locked || (p.unlocked && p.unlocked[h.locked]));
}

export function bixTurn(date, roster = BIX_ROSTER) {
  const kids = ['kaelen', 'xavier'];
  const n = D.daysBetween(roster.startDate, date);
  const first = kids.indexOf(roster.first);
  return kids[(first + ((n % 2) + 2) % 2) % 2];
}

function eligibleDaysLeft(h, date) {
  let n = 0;
  for (let d = date; d <= D.weekEnd(date); d = D.addDays(d, 1)) {
    if (!h.freq.days || h.freq.days.includes(D.weekday(d))) n++;
  }
  return n;
}

// weekDays: { 'YYYY-MM-DD': dayDoc } for the week containing `date`.
export function weeklyProgress(h, weekDays, date) {
  let doneBefore = 0, excused = 0, doneToday = false;
  for (const [d, doc] of Object.entries(weekDays || {})) {
    if (d < D.weekStart(date) || d > D.weekEnd(date)) continue;
    const st = doc?.habits?.[h.id]?.status;
    if (st === 'excused') excused++;
    if (st === 'done') { if (d === date) doneToday = true; else doneBefore++; }
  }
  const target = Math.max(0, h.freq.target - excused);
  const needed = Math.max(0, target - doneBefore);
  const daysLeft = eligibleDaysLeft(h, date);
  return { target, doneBefore, done: doneBefore + (doneToday ? 1 : 0), needed, daysLeft, mustToday: needed > 0 && needed >= daysLeft };
}

export function dueToday(p, date, weekDays) {
  const doc = weekDays?.[date];
  const out = [];
  for (const h of habitList(p)) {
    if (h.when !== 'today') continue;
    const status = doc?.habits?.[h.id]?.status;
    const entry = doc?.habits?.[h.id] || null;
    const f = h.freq;
    if (f.type === 'daily') out.push({ h, status, entry });
    else if (f.type === 'days') { if (f.days.includes(D.weekday(date))) out.push({ h, status, entry }); }
    else if (f.type === 'weekly') {
      if (f.days && !f.days.includes(D.weekday(date))) continue;
      const prog = weeklyProgress(h, weekDays, date);
      if (status || prog.needed > 0) out.push({ h, status, entry, prog });
    }
  }
  return out;
}

export function dueLastNight(p, date, prevDoc) {
  const evening = D.addDays(date, -1);
  if (evening < p.startDate) return [];
  const out = [];
  for (const h of habitList(p)) {
    if (h.when !== 'lastNight') continue;
    if (h.freq.type === 'roster' && bixTurn(evening) !== p.id) continue;
    const entry = prevDoc?.habits?.[h.id] || null;
    out.push({ h, status: entry?.status, entry, evening });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Check-in. answers: { habitId: 'done' | 'missed' | 'skip' }.
// Returns the changed player, the changed day docs, claims for parents, and a report.
export function applyCheckin({ player, date, todayDoc, prevDoc, weekDays, answers }) {
  const p = clone(player);
  const today = clone(todayDoc || { playerId: p.id, date, habits: {} });
  const prev = clone(prevDoc || { playerId: p.id, date: D.addDays(date, -1), habits: {} });
  today.habits = today.habits || {}; prev.habits = prev.habits || {};
  const report = { date, done: [], missed: [], skipped: [], xp: 0, statGains: {}, claims: [], riskAdded: [], riskRemoved: [], coins: 0 };
  const items = [
    ...dueToday(p, date, weekDays).map((x) => ({ ...x, doc: today })),
    ...dueLastNight(p, date, prevDoc).map((x) => ({ ...x, doc: prev }))
  ];
  const statSeen = {};
  const statAllDone = {};
  const riskThisCheckin = {};
  for (const it of items) {
    const { h } = it;
    const existing = it.doc.habits[h.id];
    let ans = existing?.status || answers[h.id];
    if (!ans) continue;
    if (ans === 'skip' && it.prog?.mustToday) ans = 'missed';
    statSeen[h.stat] = true;
    if (existing?.status) {
      // Logged by a parent or excused earlier: already counted.
      if (existing.status === 'done') { report.done.push(h); statAllDone[h.stat] = statAllDone[h.stat] !== false; }
      else if (existing.status !== 'excused') statAllDone[h.stat] = false;
      continue;
    }
    if (ans === 'done') {
      it.doc.habits[h.id] = { status: 'done', at: date };
      report.xp += addXp(p, h.xp);
      report.statGains[h.stat] = 1;
      report.done.push(h);
      p.totals.habitsDone[h.id] = (p.totals.habitsDone[h.id] || 0) + 1;
      p.totals.minutes += h.minutes || 0;
      if (h.id === 'martial') p.martialCount = (p.martialCount || 0) + 1;
      if (h.kind === 'approved' && p.role === 'kid') {
        report.claims.push({ playerId: p.id, date: it.doc.date, habitId: h.id, label: h.name, coins: h.coins, kind: 'habit', status: 'pending', createdOn: date });
        it.doc.habits[h.id].pending = true;
      } else if (h.coins && p.role === 'parent') {
        report.coins += earn(p, h.coins, 'habit', h.name, date);
      }
      if (statAllDone[h.stat] === undefined) statAllDone[h.stat] = true;
    } else if (ans === 'missed') {
      it.doc.habits[h.id] = { status: 'missed', at: date };
      report.xp += addXp(p, 5, { boost: false });
      report.statGains.heart = Math.max(report.statGains.heart || 0, 1);
      report.missed.push(h);
      statAllDone[h.stat] = false;
      if (!riskThisCheckin[h.stat]) { addRisk(p, h.stat); riskThisCheckin[h.stat] = true; report.riskAdded.push(h.stat); }
    } else if (ans === 'skip') {
      it.doc.habits[h.id] = { status: 'skip', at: date };
      report.skipped.push(h);
    }
  }
  for (const [s, g] of Object.entries(report.statGains)) changeStat(p, s, g, date);
  for (const s of Object.keys(statSeen)) {
    if (statAllDone[s]) { if (goodChoice(p, s, date)) report.riskRemoved.push(s); }
  }
  // Martial arts seed: blooms after the first four classes.
  report.seeds = bloomMartialSeed(p, date);
  today.checkedIn = true;
  return { player: p, todayDoc: today, prevDoc: prev, report, items };
}

// ---------------------------------------------------------------------------
// The Habit Roll: one roll covers the whole day.
export function habitRoll(player, report, rng = Math.random, forced) {
  const p = clone(player);
  const withEvents = (list) => list.filter((h) => HABIT_EVENTS[h.events]);
  const missed = withEvents(report.missed);
  const done = withEvents(report.done);
  if (!missed.length && !done.length) return { player: p, result: null };
  const allDone = missed.length === 0;
  const subject = allDone ? R.pick(done, rng) : R.pick(missed, rng);
  const stat = subject.stat;
  const mods = [];
  if (allDone) mods.push({ label: 'Everything done', value: 1 });
  mods.push({ label: `${STAT_NAMES[stat]} ${p.stats[stat]}`, value: R.statMod(p.stats[stat]), show: true });
  if (!allDone) mods.push({ label: p.risk[stat] ? `${STAT_NAMES[stat]} shield cracks` : 'No cracks', value: R.riskMod(p.risk[stat]), show: true });
  const r = R.roll(mods, rng, forced);
  let b = r.band;
  if (allDone) b = R.atLeast(b, 'setback');
  const out = { ...r, band: b, stat, habit: subject.id, habitName: subject.short || subject.name, xp: 0, coins: 0, statDelta: 0, bill: 0, safetyNet: allDone };
  const date = report.date;
  if (b === 'lucky' || b === 'good') {
    const src = allDone ? subject : (done.length ? R.pick(done, rng) : null);
    if (src) {
      out.text = HABIT_EVENTS[src.events][b];
      out.habitName = src.short || src.name;
      out.xp = addXp(p, HABIT_ROLL_EFFECTS[b].xp);
      out.coins = earn(p, HABIT_ROLL_EFFECTS[b].coins, 'roll', 'Habit Roll', date);
    } else {
      out.text = 'You got away with it… this time.';
    }
  } else if (b === 'normal') {
    out.text = allDone ? 'An ordinary day. Nothing extra.' : 'Nothing happened… this time.';
  } else if (allDone) {
    out.text = R.pick(BAD_LUCK_LINES, rng);
    out.note = BAD_LUCK_NOTE;
  } else {
    const ev = HABIT_EVENTS[subject.events];
    out.text = ev[b];
    out.statDelta = changeStat(p, stat, HABIT_ROLL_EFFECTS[b].stat);
    if (b === 'disaster' && ev.bill) out.bill = charge(p, ev.bill, 'bill', ev.disaster, date);
  }
  return { player: p, result: out };
}

// ---------------------------------------------------------------------------
// Story choices
export function doorOpen(p, card) {
  return card.kind !== 'door' || !card.needs || p.stats[card.needs.stat] >= card.needs.value;
}

// Door cards are only dealt once the player's stat is high enough. A door that has just
// opened comes first. Saying "not this time" to an open door brings it back a week later.
export function drawCard(p, date, rng = Math.random) {
  const queued = (p.deck.queue || []).find((q) => q.due <= date);
  if (queued) return { cardId: queued.cardId, bonusXp: queued.bonusXp || 0, queued: true };
  const done = p.deck.doorsDone || [];
  const retry = p.deck.doorRetry || {};
  const door = CARDS.find((c) => c.kind === 'door' && !done.includes(c.id) && (!retry[c.id] || retry[c.id] <= date) && doorOpen(p, c));
  if (door) return { cardId: door.id, bonusXp: 0, queued: false, door: true };
  const regular = CARDS.filter((c) => c.kind !== 'real' && c.kind !== 'door');
  let pool = regular.filter((c) => !p.deck.seen.includes(c.id));
  if (!pool.length) pool = regular;
  return { cardId: R.pick(pool, rng).id, bonusXp: 0, queued: false };
}

export function optionLocked(p, card, opt) {
  return card.kind === 'door' && opt.tone === 'right' && card.needs && p.stats[card.needs.stat] < card.needs.value;
}

function plantSeed(p, card, text, date) {
  let seed;
  const coins = text.match(/\+(\d+) coins/);
  if (card.id === DOJO_CARD) seed = { type: 'martial', xp: 150, need: 4, startCount: p.martialCount || 0, text: 'First four martial arts classes' };
  else if (coins) seed = { type: 'coins', coins: Number(coins[1]), text };
  else seed = { type: 'xp', xp: 30, text, due: D.addDays(date, 3) };
  p.seeds = [...(p.seeds || []), { ...seed, cardId: card.id, plantedOn: date }];
  return seed;
}

function bloomMartialSeed(p, date) {
  const out = [];
  p.seeds = (p.seeds || []).filter((s) => {
    if (s.type === 'martial' && (p.martialCount || 0) - s.startCount >= s.need) {
      out.push({ text: s.text, xp: addXp(p, s.xp) }); return false;
    }
    return true;
  });
  return out;
}

export function bloomSeeds(player, date) {
  const p = clone(player);
  const out = [];
  p.seeds = (p.seeds || []).filter((s) => {
    if (s.type === 'xp' && s.due <= date) { out.push({ text: s.text, xp: addXp(p, s.xp) }); return false; }
    return true;
  });
  return { player: p, bloomed: out };
}

export function makeChoice({ player, date, cardId, key, bonusXp = 0, rng = Math.random, forced }) {
  const p = clone(player);
  const card = CARD_BY_ID[cardId];
  const opt = card.options.find((o) => o.key === key);
  if (!opt) throw new Error('Unknown option');
  if (optionLocked(p, card, opt)) throw new Error('That option is locked');
  const area = card.area;
  const res = { cardId, key, tone: opt.tone, area, xp: 0, coinsNow: 0, coinsSunday: 0, stats: {}, seed: null, badge: null, cost: 0, statLoss: 0, events: [] };

  // What the option pays before the roll
  if (opt.tone === 'tempting') {
    p.week.tempt.count++; p.totals.tempting++;
    if (opt.now?.coins) { res.coinsNow = earn(p, opt.now.coins, 'choice', `${card.title} (now)`, date); p.week.tempt.coins += res.coinsNow; }
    const isFreePass = card.kind === 'door' || card.kind === 'real';
    if (!isFreePass) { addRisk(p, area); res.riskAdded = true; }
  } else {
    const later = opt.later || {};
    if (opt.tone === 'right') { p.week.right.count++; p.totals.right++; } else { p.week.middle.count++; p.totals.middle++; }
    if (later.coins) {
      p.week.pendingSunday += later.coins; res.coinsSunday = later.coins;
      if (opt.tone === 'right') p.week.right.coins += later.coins; else p.week.middle.coins += later.coins;
    }
    const xpBase = (later.xp || 0) + (opt.now?.xp || 0) + (opt.tone === 'right' ? bonusXp : 0);
    res.xp += addXp(p, xpBase);
    if (opt.tone === 'right') p.week.right.xp += res.xp;
    for (const [s, v] of Object.entries(later.stats || {})) res.stats[s] = changeStat(p, s, v, date);
    if (opt.tone === 'right') {
      if (goodChoice(p, area, date)) res.riskRemoved = true;
      if (later.seed) res.seed = plantSeed(p, card, later.seed, date);
      if (p.comeback?.[area]) {
        p.comeback[area] -= 1;
        if (p.comeback[area] === 0) {
          delete p.comeback[area];
          res.events.push({ type: 'comeback', xp: addXp(p, 50) });
          if (!p.badges.includes('Comeback Kid')) p.badges.push('Comeback Kid');
        }
      }
    }
  }
  if (card.id === DOJO_CARD) {
    if (opt.tone === 'right') {
      p.unlocked = { ...(p.unlocked || {}), martial: true };
      if (!p.badges.includes('White Belt')) p.badges.push('White Belt');
      res.badge = 'White Belt';
      res.events.push({ type: 'unlock', text: 'The Martial arts habit is now on your check-in.' });
      pushNote(p, `${p.name} signed up for martial arts!`, date);
    } else {
      p.deck.queue = [...(p.deck.queue || []).filter((q) => q.cardId !== card.id), { cardId: card.id, due: D.addDays(date, 7), bonusXp: 30 }];
      pushNote(p, `${p.name} said "not now" to martial arts. The card comes back next ${D.dayName(date)} with a 30 XP bonus. Worth a chat.`, date);
    }
  }
  // A card that was waiting in the queue has now been played (a re-queued dojo card is due next week).
  p.deck.queue = (p.deck.queue || []).filter((q) => !(q.cardId === card.id && q.due <= date));
  if (!p.deck.seen.includes(card.id)) p.deck.seen.push(card.id);
  if (card.kind === 'door') {
    if (opt.tone === 'right') p.deck.doorsDone = [...new Set([...(p.deck.doorsDone || []), card.id])];
    else p.deck.doorRetry = { ...(p.deck.doorRetry || {}), [card.id]: D.addDays(date, 7) };
  }

  // The Life Roll
  const mods = [];
  if (opt.tone === 'right') mods.push({ label: 'Good choice', value: 1 });
  mods.push({ label: `${STAT_NAMES[area]} ${player.stats[area]}`, value: R.statMod(player.stats[area]), show: true });
  mods.push({ label: player.risk[area] ? `${STAT_NAMES[area]} shield cracks` : 'No cracks', value: R.riskMod(player.risk[area]), show: true });
  const r = R.roll(mods, rng, forced);
  let b = r.band;
  if (opt.tone === 'right') b = R.atLeast(b, card.kind === 'door' ? 'normal' : 'setback');
  if (opt.tone === 'middle') b = R.atLeast(b, 'setback');
  res.roll = { ...r, band: b };
  const o = card.outcomes;

  if (card.kind === 'real' && opt.tone !== 'right') {
    res.text = 'Maybe next time. This card will come back next week.';
  } else if (card.kind === 'door' && opt.tone !== 'right') {
    res.text = 'You skipped it this time. Doors like this open again when you are ready.';
  } else if (opt.tone === 'tempting') {
    if (b === 'setback' || b === 'disaster') {
      res.text = o[b];
      const statHit = b === 'disaster' ? (area === 'heart' && card.kind === 'temptation' ? -20 : -15) : -5;
      res.statLoss = changeStat(p, area, statHit);
      const coins = R.coinsInText(o[b]);
      if (coins) { res.cost = charge(p, coins, 'bill', card.title, date); p.week.tempt.cost += coins; }
      if (b === 'disaster') { p.comeback = { ...(p.comeback || {}), [area]: 5 }; res.events.push({ type: 'comebackStart', area }); }
    } else {
      res.text = b === 'normal' ? 'Nothing happened… this time.' : 'You got away with it… this time.';
      res.gotAway = true;
    }
  } else {
    // Right or middle option
    if (b === 'lucky' || b === 'good') {
      res.text = o[b];
      res.xp += addXp(p, b === 'lucky' ? 20 : 10);
      if (card.kind === 'door') {
        const badge = card.title;
        if (!p.badges.includes(badge)) { p.badges.push(badge); res.badge = res.badge || badge; }
      }
    } else if (b === 'normal') {
      res.text = o.normal || 'A steady day. Your choice still counts.';
    } else if (opt.tone === 'middle') {
      res.text = o.setback || R.pick(BAD_LUCK_LINES, rng);
      res.statLoss = changeStat(p, area, -3);
    } else {
      res.text = R.pick(BAD_LUCK_LINES, rng);
      res.note = BAD_LUCK_NOTE;
    }
  }
  res.why = o.why;
  return { player: p, result: res };
}

// ---------------------------------------------------------------------------
// Streaks: count days the session was finished. Honest misses never break them.
export const STREAK_MILESTONES = [7, 30, 100, 200, 365];
export function completeSession(player, date) {
  const p = clone(player);
  const s = p.streak;
  const ev = { shieldsUsed: 0, reset: false, shieldEarned: false, weekBonus: 0, milestone: null };
  if (s.last === date) return { player: p, events: ev };
  if (!s.last) s.count = 1;
  else {
    const gap = D.daysBetween(s.last, date) - 1;
    if (gap <= 0 || s.paused) s.count += 1;
    else if (gap <= s.shields) { s.shields -= gap; ev.shieldsUsed = gap; s.count += 1; }
    else { s.count = 1; ev.reset = true; }
  }
  s.last = date;
  s.best = Math.max(s.best || 0, s.count);
  p.totals.sessions = (p.totals.sessions || 0) + 1;
  if (s.count % 7 === 0) {
    if (s.shields < 2) { s.shields += 1; ev.shieldEarned = true; }
    ev.weekBonus = earn(p, ECONOMY.streakWeekBonus, 'streak', 'Full streak week', date);
  }
  if (STREAK_MILESTONES.includes(s.count)) {
    ev.milestone = s.count;
    const badge = `${s.count}-day streak`;
    if (!p.badges.includes(badge)) p.badges.push(badge);
  }
  return { player: p, events: ev };
}

// ---------------------------------------------------------------------------
// Sunday: payday, then one check-up roll per stat.
export function weekHabitStats(p, weekDays, ws, upTo) {
  const out = statsObj(null);
  const counts = Object.fromEntries(STATS.map((s) => [s, { due: 0, done: 0 }]));
  const end = upTo < D.addDays(ws, 6) ? upTo : D.addDays(ws, 6);
  for (const h of habitList(p)) {
    const f = h.freq;
    if (f.type === 'weekly') {
      let excused = 0, done = 0;
      for (const [d, doc] of Object.entries(weekDays || {})) {
        if (d < ws || d > end) continue;
        const st = doc?.habits?.[h.id]?.status;
        if (st === 'excused') excused++;
        if (st === 'done') done++;
      }
      const due = Math.max(0, f.target - excused);
      counts[h.stat].due += due; counts[h.stat].done += Math.min(done, due);
      continue;
    }
    for (let d = ws; d <= end; d = D.addDays(d, 1)) {
      if (d < p.startDate) continue;
      if (h.when === 'lastNight' && d >= end) continue; // tonight isn't over yet
      if (f.type === 'days' && !f.days.includes(D.weekday(d))) continue;
      if (f.type === 'roster' && bixTurn(d) !== p.id) continue;
      const st = weekDays?.[d]?.habits?.[h.id]?.status;
      if (st === 'excused') continue;
      counts[h.stat].due++;
      if (st === 'done') counts[h.stat].done++;
    }
  }
  for (const s of STATS) out[s] = counts[s].due ? counts[s].done / counts[s].due : null;
  return { pct: out, counts };
}

export function payday({ player, date }) {
  const p = clone(player);
  const w = p.week;
  const res = { weekStart: w.start, right: clone(w.right), tempt: clone(w.tempt), middle: clone(w.middle), sunday: 0, seeds: [] };
  res.sunday = earn(p, w.pendingSunday, 'sunday', 'Right choices', date);
  w.pendingSunday = 0;
  p.seeds = (p.seeds || []).filter((s) => {
    if (s.type === 'coins') { res.seeds.push({ text: s.text, coins: earn(p, s.coins, 'seed', 'Seed', date) }); return false; }
    return true;
  });
  w.paydayDone = true;
  return { player: p, result: res };
}

export function checkup({ player, date, weekDays, rng = Math.random, forcedRolls }) {
  const p = clone(player);
  const w = p.week;
  const { pct, counts } = weekHabitStats(p, weekDays, w.start, date);
  const rolls = [];
  // A brand-new player gets a few days before the first check-up counts.
  const firstWeek = D.daysBetween(p.startDate, date) < 3;
  if (!firstWeek) STATS.forEach((stat, i) => {
    const mods = [];
    let safety = false;
    if (stat === 'money') {
      if (w.earned > 0 && w.banked >= w.earned * 0.25) mods.push({ label: 'Banked a quarter', value: 1 });
      else if (w.earned > 0 && !w.banked) mods.push({ label: 'Banked nothing', value: -1 });
    } else if (pct[stat] !== null) {
      if (pct[stat] >= 0.8) { mods.push({ label: 'Did 80% of habits', value: 1 }); safety = true; }
      else if (pct[stat] < 0.5) mods.push({ label: 'Did under half', value: -1 });
    }
    if (p.risk[stat]) mods.push({ label: `${STAT_NAMES[stat]} shield cracks`, value: R.riskMod(p.risk[stat]) });
    const r = R.roll(mods, rng, forcedRolls?.[i]);
    let b = r.band;
    if (safety) b = R.atLeast(b, 'setback');
    const lines = CHECKUP[stat][b];
    const vi = Math.floor(rng() * lines.length);
    const text = lines[vi];
    const eff = CHECKUP_EFFECTS[b];
    const out = { stat, ...r, band: b, text, xp: 0, coins: 0, statDelta: 0, bill: 0, pct: pct[stat] };
    if (eff.xp) out.xp = addXp(p, eff.xp);
    if (eff.coins) out.coins = earn(p, eff.coins, 'checkup', `${STAT_NAMES[stat]} check-up`, date);
    if (eff.stat) out.statDelta = changeStat(p, stat, eff.stat);
    if (stat === 'money' && eff.moneyCoins) out.bill = charge(p, -eff.moneyCoins, 'bill', text, date);
    if (stat === 'health' && b === 'disaster' && CHECKUP.health.disasterBills[vi]) out.bill = charge(p, CHECKUP.health.disasterBills[vi], 'bill', text, date);
    rolls.push(out);
  });
  // Bank interest: 2% a week on up to 5,000 koins.
  const interest = Math.min(100, Math.round(Math.min(p.bank, ECONOMY.interestCeiling) * ECONOMY.interestRate));
  const paidInterest = earn(p, interest, 'interest', 'Bank interest', date);
  const summary = {
    firstWeek, weekStart: w.start, earned: w.earned, overCap: w.overCap, banked: w.banked, cap: R.levelInfo(p.xp).weeklyCap,
    right: w.right, tempt: w.tempt, middle: w.middle, interest: paidInterest, rolls, counts,
    items: w.items
  };
  p.lastWeek = summary;
  w.paid = true;
  // Next week starts on Monday.
  p.week = { ...newWeek(D.addDays(w.start, 7)) };
  return { player: p, result: { rolls, interest: paidInterest, summary, firstWeek } };
}

// ---------------------------------------------------------------------------
// Money: bank, shop and real rewards
export function deposit(player, amount, date) {
  const p = clone(player);
  const a = Math.min(Math.floor(amount), Math.max(0, p.wallet));
  if (a <= 0) return { player: p, amount: 0 };
  p.wallet -= a; p.bank += a; p.week.banked += a;
  p.week.items.push({ kind: 'bank', label: 'Moved to bank', amount: -a, date });
  return { player: p, amount: a };
}
export function withdraw(player, amount, date) {
  const p = clone(player);
  const a = Math.min(Math.floor(amount), p.bank);
  if (a <= 0) return { player: p, amount: 0 };
  p.bank -= a; p.wallet += a; p.week.banked = Math.max(0, p.week.banked - a);
  p.week.items.push({ kind: 'bank', label: 'Taken from bank', amount: a, date });
  return { player: p, amount: a };
}

export function buyItem(player, itemId, date) {
  const p = clone(player);
  const item = GAME_ITEM_BY_ID[itemId];
  if (!item) throw new Error('No such item');
  if (p.inventory.includes(itemId)) throw new Error('You already have it');
  if (p.wallet < item.price) throw new Error('Not enough koins yet');
  p.wallet -= item.price;
  p.inventory.push(itemId);
  p.week.items.push({ kind: 'spend', label: item.name, amount: -item.price, date });
  if (item.extra) p.hero = { ...p.hero, extra: item.extra };
  if (itemId === 'pixel') p.style = 'pixel';
  return { player: p, item };
}
export function equip(player, { extra, style }) {
  const p = clone(player);
  if (extra !== undefined) p.hero = { ...p.hero, extra };
  if (style) p.style = style;
  return p;
}

export function requestReward(player, reward, date) {
  const p = clone(player);
  if (p.wallet < reward.price) throw new Error('Not enough koins yet');
  p.wallet -= reward.price;
  p.week.items.push({ kind: 'reward', label: reward.name, amount: -reward.price, date });
  return { player: p, request: { playerId: p.id, rewardId: reward.id, name: reward.name, price: reward.price, status: 'requested', requestedOn: date } };
}

// ---------------------------------------------------------------------------
// Game Master actions
export function approveClaim(player, claim, { healthy = false, by, date } = {}) {
  const p = clone(player);
  let coins = 0, xp = 0;
  if (claim.kind === 'food') {
    const mult = healthy ? FOOD_ADVENTURE.healthyMultiplier : 1;
    xp = addXp(p, FOOD_ADVENTURE.xp * mult);
    coins = earn(p, FOOD_ADVENTURE.coins * mult, 'food', `Food Adventure: ${claim.food}`, date);
    changeStat(p, 'health', 1, date);
    p.food.passport = [...(p.food.passport || []), { food: claim.food, rating: claim.rating, healthy, date: claim.date }];
    const n = p.food.passport.length;
    for (const m of [10, 25, 52]) if (n === m) p.badges.push(`Food Passport ${m}`);
  } else {
    coins = earn(p, claim.coins, 'habit', claim.label, date);
  }
  return { player: p, claim: { ...claim, status: 'approved', decidedBy: by, decidedOn: date, paid: coins, healthy }, coins, xp };
}
export function rejectClaim(player, claim, { note, by, date } = {}) {
  const p = clone(player);
  pushMsg(p, note ? `${by}: ${note}` : `${by} didn't approve ${claim.label}.`, date);
  return { player: p, claim: { ...claim, status: 'rejected', note: note || '', decidedBy: by, decidedOn: date } };
}

export function logEvening(player, doc, habitIds, { by, date }) {
  const p = clone(player);
  const d = clone(doc || { playerId: p.id, date, habits: {} });
  d.habits = d.habits || {};
  let coins = 0, xp = 0;
  const stats = {};
  for (const id of habitIds) {
    const h = habitList(p).find((x) => x.id === id);
    if (!h || d.habits[id]?.status) continue;
    d.habits[id] = { status: 'done', approved: true, loggedBy: by, at: date };
    xp += addXp(p, h.xp);
    stats[h.stat] = 1;
    if (h.coins) coins += earn(p, h.coins, 'habit', h.name, date);
    p.totals.habitsDone[id] = (p.totals.habitsDone[id] || 0) + 1;
  }
  for (const s of Object.keys(stats)) changeStat(p, s, 1, date);
  return { player: p, doc: d, coins, xp };
}

export function excuse(doc, habitId, { by, date, playerId }) {
  const d = clone(doc || { playerId, date, habits: {} });
  d.habits = d.habits || {};
  d.habits[habitId] = { status: 'excused', by, at: date };
  return d;
}

export function spotCheck(player, doc, habitId, { by, date }) {
  const p = clone(player);
  const d = clone(doc);
  const h = habitList(p).find((x) => x.id === habitId);
  if (!h || d.habits?.[habitId]?.status !== 'done') throw new Error('Only a ticked habit can be spot-checked');
  d.habits[habitId] = { ...d.habits[habitId], status: 'caught', by };
  const lost = loseXp(p, h.xp * 2);
  changeStat(p, 'heart', -5);
  addRisk(p, 'heart');
  pushMsg(p, `${by} says ${h.name.toLowerCase()} wasn't really done. Fibbing always costs more than the miss: -${lost} XP and -5 Heart.`, date);
  return { player: p, doc: d };
}

export function giveBonus(player, { xp = 0, coins = 0, stat = null, statBy = 2, badge = '', note, by, date }) {
  const p = clone(player);
  const gx = addXp(p, xp, { boost: false });
  const gc = earn(p, coins, 'bonus', note || 'Bonus', date);
  const gs = stat ? changeStat(p, stat, statBy, date) : 0;
  const b = (badge || '').trim();
  const newBadge = b && !p.badges.includes(b);
  if (newBadge) p.badges.push(b);
  const bits = [gx ? `+${gx} XP` : '', gc ? `+${gc} koins` : '', gs ? `+${gs} ${STAT_NAMES[stat]}` : '', newBadge ? `and the ${b} badge` : ''].filter(Boolean);
  pushMsg(p, `${by}: ${note || 'Bonus!'} ${bits.join(', ')}`.trim(), date);
  return { player: p, xp: gx, coins: gc, stat: gs, badge: newBadge ? b : null };
}

export function queueCard(player, cardId, date) {
  const p = clone(player);
  p.deck.queue = [...(p.deck.queue || []).filter((q) => q.cardId !== cardId), { cardId, due: date, bonusXp: 0 }];
  return p;
}

export function setPause(player, paused, date) {
  const p = clone(player);
  p.streak.paused = paused;
  if (!paused && p.streak.last && p.streak.last < D.addDays(date, -1)) p.streak.last = D.addDays(date, -1);
  return p;
}

export function foodClaim(player, { food, rating, date }) {
  const ws = D.weekStart(date);
  if (player.food?.week === ws) throw new Error('One Food Adventure a week');
  const p = clone(player);
  p.food = { ...(p.food || {}), week: ws };
  return { player: p, claim: { playerId: p.id, kind: 'food', label: `Food Adventure: ${food}`, food, rating, date, coins: FOOD_ADVENTURE.coins, status: 'pending', createdOn: date } };
}

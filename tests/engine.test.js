import { describe, it, expect } from 'vitest';
import * as E from '../src/engine/engine.js';
import * as R from '../src/engine/rules.js';
import * as D from '../src/engine/dates.js';
import { FAMILY_PLAYERS } from '../src/content/family.js';

const KAELEN = FAMILY_PLAYERS[0];
const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };

function weekDocs(days) { return Object.fromEntries(Object.entries(days)); }

describe('levels', () => {
  it('maps XP to levels and chapters', () => {
    expect(R.levelInfo(0)).toMatchObject({ level: 1, chapter: 1, weeklyCap: 600 });
    expect(R.levelInfo(350)).toMatchObject({ level: 2 });
    expect(R.levelInfo(3499)).toMatchObject({ level: 10, chapter: 1 });
    expect(R.levelInfo(3500)).toMatchObject({ level: 11, chapter: 2, weeklyCap: 700 });
  });
  it('classifies rolls', () => {
    expect(R.band(2)).toBe('disaster');
    expect(R.band(5)).toBe('setback');
    expect(R.band(8)).toBe('normal');
    expect(R.band(11)).toBe('good');
    expect(R.band(12)).toBe('lucky');
  });
});

describe('dates', () => {
  it('finds Monday and Sunday', () => {
    expect(D.weekStart('2026-11-04')).toBe('2026-11-02');
    expect(D.weekStart('2026-11-08')).toBe('2026-11-02');
    expect(D.weekEnd('2026-11-02')).toBe('2026-11-08');
    expect(D.weekday('2026-11-08')).toBe(0);
  });
});

describe('check-in', () => {
  it('pays XP now and sends approved habits to parents', () => {
    const p = E.newPlayer(KAELEN, '2026-11-02');
    const date = '2026-11-02'; // Monday: tennis day
    const due = E.dueToday(p, date, {});
    expect(due.map((x) => x.h.id)).toEqual(['teethAm', 'piano', 'homework', 'reading', 'tennis', 'bike', 'brushBix']);
    const answers = Object.fromEntries(due.map((x) => [x.h.id, 'done']));
    const { player, report } = E.applyCheckin({ player: p, date, todayDoc: null, prevDoc: null, weekDays: {}, answers });
    expect(report.claims.map((c) => c.habitId)).toEqual(['piano', 'homework', 'tennis', 'bike', 'brushBix']);
    expect(report.xp).toBe(5 + 15 + 15 + 10 + 15 + 15 + 10);
    expect(player.wallet).toBe(0);
    expect(player.stats.health).toBe(41);
  });

  it('turns a "not today" into a miss when the weekly target can no longer be reached', () => {
    const p = E.newPlayer(KAELEN, '2026-11-02');
    const date = '2026-11-07'; // Saturday, piano 0 of 5 done
    const due = E.dueToday(p, date, {});
    const piano = due.find((x) => x.h.id === 'piano');
    expect(piano.prog.mustToday).toBe(true);
    const { report } = E.applyCheckin({ player: p, date, todayDoc: null, prevDoc: null, weekDays: {}, answers: { piano: 'skip' } });
    expect(report.missed.map((h) => h.id)).toContain('piano');
  });

  it('shows feeding Bix only on his turn', () => {
    const k = E.newPlayer(KAELEN, '2026-11-01');
    const x = E.newPlayer(FAMILY_PLAYERS[1], '2026-11-01');
    const kHas = E.dueLastNight(k, '2026-11-02', null).some((i) => i.h.id === 'feedBix');
    const xHas = E.dueLastNight(x, '2026-11-02', null).some((i) => i.h.id === 'feedBix');
    expect(kHas).not.toBe(xHas);
  });
});

describe('rolls', () => {
  it('Habit Roll: everything done gets +1 and the safety net', () => {
    const p = E.newPlayer(KAELEN, '2026-11-02');
    const report = { date: '2026-11-02', done: [{ id: 'teethAm', stat: 'health', events: 'teeth', name: 'Brush teeth' }], missed: [] };
    const { result } = E.habitRoll(p, report, seq([0]), [1, 1]);
    expect(result.total).toBe(3);
    expect(result.band).toBe('setback');
    expect(result.note).toBeTruthy();
    expect(result.statDelta).toBe(0);
  });

  it('Story roll: right choice on the spelling test', () => {
    const p = E.newPlayer(KAELEN, '2026-11-02');
    const { player, result } = E.makeChoice({ player: p, date: '2026-11-02', cardId: '1.10', key: 'B', forced: [4, 4] });
    expect(result.roll.total).toBe(9);
    expect(result.roll.band).toBe('good');
    expect(result.text).toBe('18 out of 20 and a stamp in your book.');
    expect(player.week.pendingSunday).toBe(15);
    expect(result.xp).toBe(35);
    expect(player.stats.brains).toBe(42);
    expect(player.seeds.length).toBe(1);
  });

  it('Story roll: tempting choice can go badly and adds a risk token', () => {
    const p = E.newPlayer(KAELEN, '2026-11-02');
    const { player, result } = E.makeChoice({ player: p, date: '2026-11-02', cardId: '1.27', key: 'A', forced: [1, 1] });
    expect(result.coinsNow).toBe(10);
    expect(result.roll.band).toBe('disaster');
    expect(result.cost).toBe(200);
    expect(player.risk.money).toBe(1);
    expect(player.wallet).toBe(10 - 200);
  });

  it('Door cards stay locked until the stat is high enough', () => {
    const p = E.newPlayer(KAELEN, '2026-11-02');
    const card = E.CARD_BY_ID['1.08'];
    expect(E.optionLocked(p, card, card.options.find((o) => o.key === 'B'))).toBe(true);
  });

  it('Door cards are only dealt once the stat is high enough', () => {
    const p = E.newPlayer(KAELEN, '2026-11-02');
    for (let i = 0; i < 200; i++) expect(E.CARD_BY_ID[E.drawCard(p, '2026-11-02').cardId].kind).not.toBe('door');
    p.stats.health = 60;
    expect(E.drawCard(p, '2026-11-02').cardId).toBe('1.08');
    const skip = E.makeChoice({ player: p, date: '2026-11-02', cardId: '1.08', key: 'A', forced: [3, 4] }).player;
    expect(E.CARD_BY_ID[E.drawCard(skip, '2026-11-03').cardId].kind).not.toBe('door');
    expect(E.drawCard(skip, '2026-11-09').cardId).toBe('1.08');
    const go = E.makeChoice({ player: p, date: '2026-11-02', cardId: '1.08', key: 'B', forced: [3, 4] }).player;
    expect(E.CARD_BY_ID[E.drawCard(go, '2026-11-20').cardId].id).not.toBe('1.08');
  });

  it('The dojo card unlocks martial arts, or comes back next week', () => {
    const p = E.newPlayer(KAELEN, '2026-11-02');
    const yes = E.makeChoice({ player: p, date: '2026-11-02', cardId: '1.09', key: 'B', forced: [3, 4] });
    expect(yes.player.unlocked.martial).toBe(true);
    expect(yes.player.badges).toContain('White Belt');
    expect(yes.result.xp).toBeGreaterThanOrEqual(50);
    const no = E.makeChoice({ player: E.queueCard(p, '1.09', '2026-11-02'), date: '2026-11-02', cardId: '1.09', key: 'A', forced: [3, 4] });
    expect(no.player.deck.queue).toEqual([{ cardId: '1.09', due: '2026-11-09', bonusXp: 30 }]);
    expect(no.player.risk.health).toBe(0);
  });
});

describe('fairer cracks (12 Nov 2026)', () => {
  it('caps cracks at -2 on a roll and heals one per good choice', () => {
    expect(R.riskMod(5)).toBe(-2);
    const p = E.newPlayer(KAELEN, '2026-11-02');
    p.risk.heart = 3;
    expect(E.goodChoice(p, 'heart', '2026-11-02')).toBe(true);
    expect(p.risk.heart).toBe(2);
  });
  it('applies the re-score once, as changes on top of whatever the player has now', () => {
    const p = E.newPlayer(KAELEN, '2026-11-01');
    Object.assign(p.stats, { health: 30, brains: 19, heart: 25 });
    Object.assign(p.risk, { health: 6, heart: 5, brains: 2 });
    p.wallet = 157;
    const once = E.applyFixes(p, '2026-11-13');
    expect(once.applied).toEqual(['rescore-2026-11-12']);
    expect(once.player.stats).toMatchObject({ health: 35, brains: 39, heart: 48, money: 40 });
    expect(once.player.risk).toMatchObject({ health: 2, heart: 3, brains: 0 });
    expect(once.player.wallet).toBe(207);
    expect(once.player.messages[0].text).toMatch(/fairer/);
    const twice = E.applyFixes(once.player, '2026-11-13');
    expect(twice.applied).toEqual([]);
    expect(twice.player.stats).toEqual(once.player.stats);
    expect(E.applyFixes(E.newPlayer(KAELEN, '2026-11-20'), '2026-11-20').applied).toEqual([]);
  });
});

describe('a perfect week', () => {
  it('earns roughly the designed koins and hits the cap', () => {
    let p = E.newPlayer(KAELEN, '2026-11-02');
    const days = {};
    const rng = seq([0.5, 0.2, 0.7, 0.9, 0.1, 0.4]);
    let xpByDay = [];
    for (let i = 0; i < 7; i++) {
      const date = D.addDays('2026-11-02', i);
      const before = p.xp;
      const due = [...E.dueToday(p, date, days), ...E.dueLastNight(p, date, days[D.addDays(date, -1)])];
      const answers = Object.fromEntries(due.map((x) => [x.h.id, 'done']));
      const ci = E.applyCheckin({ player: p, date, todayDoc: days[date], prevDoc: days[D.addDays(date, -1)], weekDays: days, answers });
      p = ci.player; days[date] = ci.todayDoc; days[D.addDays(date, -1)] = ci.prevDoc;
      for (const c of ci.report.claims) p = E.approveClaim(p, c, { by: 'Dad', date }).player;
      p = E.habitRoll(p, ci.report, rng, [3, 4]).player;
      if (D.isSunday(date)) {
        p = E.payday({ player: p, date }).player;
        p = E.deposit(p, Math.ceil(p.week.earned * 0.25), date).player;
        const cu = E.checkup({ player: p, date, weekDays: days, rng, forcedRolls: [[3, 4], [3, 4], [3, 4], [3, 4]] });
        console.log('week summary', cu.result.summary.earned, 'over cap', cu.result.summary.overCap, cu.result.rolls.map((r) => r.band));
        expect(cu.result.summary.earned).toBeLessThanOrEqual(600);
        p = cu.player;
      } else {
        const card = E.drawCard(p, date, rng);
        const c = E.CARD_BY_ID[card.cardId];
        const key = E.optionLocked(p, c, c.options.find((o) => o.key === 'B')) ? 'A' : 'B';
        p = E.makeChoice({ player: p, date, cardId: card.cardId, key, forced: [3, 4] }).player;
      }
      p = E.completeSession(p, date).player;
      xpByDay.push(p.xp - before);
    }
    const avg = xpByDay.reduce((a, b) => a + b, 0) / 7;
    expect(avg).toBeGreaterThan(80);
    expect(avg).toBeLessThan(140);
    expect(p.streak.count).toBe(7);
    expect(p.streak.shields).toBe(1);
    expect(p.week.start).toBe('2026-11-09');
  });
});

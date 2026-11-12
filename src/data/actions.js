// Game actions: read what's needed, run the rules, save the results in one transaction.
import * as E from '../engine/engine.js';
import * as D from '../engine/dates.js';
import { FAMILY_PLAYERS } from '../content/family.js';
import { REWARD_BY_ID } from '../content/shop.js';

export const playerPath = (id) => `players/${id}`;
export const dayPath = (id, date) => `days/${id}_${date}`;

async function readWeek(tx, pid, date) {
  const ws = D.weekStart(date);
  const dates = [D.addDays(ws, -1)];
  for (let i = 0; i < 7; i++) dates.push(D.addDays(ws, i));
  const docs = await Promise.all(dates.map((d) => tx.get(dayPath(pid, d))));
  const out = {};
  dates.forEach((d, i) => { if (docs[i]) out[d] = docs[i]; });
  return out;
}

export function makeActions(store) {
  const T = (fn) => store.transact(fn);

  return {
    // Create any missing player documents (parents create all; a boy creates only his own).
    async ensurePlayers(ids) {
      return T(async (tx) => {
        const date = D.today();
        const existing = await Promise.all(ids.map((id) => tx.get(playerPath(id))));
        ids.forEach((id, i) => {
          if (!existing[i]) {
            const def = FAMILY_PLAYERS.find((p) => p.id === id);
            if (def) tx.set(playerPath(id), E.newPlayer(def, date));
          }
        });
      });
    },

    // One-off corrections (see FIXES in the engine). Safe to call often: each fix runs once per player.
    async applyFixes(pid) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        if (!p0) return [];
        const { player, applied } = E.applyFixes(p0, D.today());
        if (applied.length) tx.set(playerPath(pid), player);
        return applied;
      });
    },

    // Once a day: stats fade, seeds bloom.
    async startDay(pid) {
      return T(async (tx) => {
        const date = D.today();
        let p = await tx.get(playerPath(pid));
        if (!p || p.dayStarted === date) return null;
        const faded = E.applyFade(p, date);
        const b = E.bloomSeeds(p, date);
        p = b.player;
        p.dayStarted = date;
        if (b.bloomed.length) p.messages = [...b.bloomed.map((s) => ({ text: `Your seed grew: ${s.text}. +${s.xp} XP`, date })), ...(p.messages || [])].slice(0, 10);
        tx.set(playerPath(pid), p);
        return { faded, bloomed: b.bloomed };
      });
    },

    async submitCheckin(pid, answers) {
      return T(async (tx) => {
        const date = D.today();
        const p0 = await tx.get(playerPath(pid));
        const week = await readWeek(tx, pid, date);
        const prevDate = D.addDays(date, -1);
        const ci = E.applyCheckin({ player: p0, date, todayDoc: week[date], prevDoc: week[prevDate], weekDays: week, answers });
        let p = ci.player;
        let roll = null;
        if (p.role === 'kid') {
          const hr = E.habitRoll(p, ci.report);
          p = hr.player; roll = hr.result;
        }
        const today = { ...ci.todayDoc, checkedIn: true, habitRoll: roll, xpFromHabits: ci.report.xp };
        tx.set(playerPath(pid), p);
        tx.set(dayPath(pid, date), today);
        if (D.daysBetween(p.startDate, prevDate) >= 0) tx.set(dayPath(pid, prevDate), ci.prevDoc);
        for (const c of ci.report.claims) tx.create('claims', c);
        return { report: ci.report, roll };
      });
    },

    async drawCard(pid) {
      return T(async (tx) => {
        const date = D.today();
        const p = await tx.get(playerPath(pid));
        const doc = (await tx.get(dayPath(pid, date))) || { playerId: pid, date, habits: {} };
        if (doc.card) return doc.card;
        const card = E.drawCard(p, date);
        tx.set(dayPath(pid, date), { ...doc, card });
        return card;
      });
    },

    async choose(pid, key) {
      return T(async (tx) => {
        const date = D.today();
        const p0 = await tx.get(playerPath(pid));
        const doc = await tx.get(dayPath(pid, date));
        if (!doc?.card) throw new Error('No card drawn yet');
        if (doc.choice) return doc.choice;
        const { player, result } = E.makeChoice({ player: p0, date, cardId: doc.card.cardId, key, bonusXp: doc.card.bonusXp || 0 });
        tx.set(playerPath(pid), player);
        tx.set(dayPath(pid, date), { ...doc, choice: result });
        return result;
      });
    },

    async payday(pid) {
      return T(async (tx) => {
        const date = D.today();
        const p0 = await tx.get(playerPath(pid));
        const doc = (await tx.get(dayPath(pid, date))) || { playerId: pid, date, habits: {} };
        const key = p0.week.start < D.weekStart(date) ? 'latePayday' : 'payday';
        if (p0.week.paydayDone || p0.week.start > D.weekStart(date)) return doc[key] || null;
        if (key === 'payday' && !D.isSunday(date)) throw new Error('Payday is on Sunday');
        const { player, result } = E.payday({ player: p0, date });
        tx.set(playerPath(pid), player);
        tx.set(dayPath(pid, date), { ...doc, [key]: result });
        return result;
      });
    },

    async checkup(pid) {
      return T(async (tx) => {
        const date = D.today();
        const p0 = await tx.get(playerPath(pid));
        const doc = (await tx.get(dayPath(pid, date))) || { playerId: pid, date, habits: {} };
        const key = p0.week.start < D.weekStart(date) ? 'lateCheckup' : 'checkup';
        if (doc[key]) return doc[key];
        if (p0.week.start > D.weekStart(date)) return null; // this week is already paid
        if (!D.isSunday(date) && key === 'checkup') throw new Error('The check-up is on Sunday');
        const weekDate = p0.week.start;
        const week = await readWeek(tx, pid, weekDate);
        const upTo = date < D.weekEnd(weekDate) ? date : D.weekEnd(weekDate);
        const { player, result } = E.checkup({ player: p0, date: upTo, weekDays: week });
        tx.set(playerPath(pid), player);
        tx.set(dayPath(pid, date), { ...doc, [key]: result });
        return result;
      });
    },

    async complete(pid) {
      return T(async (tx) => {
        const date = D.today();
        const p0 = await tx.get(playerPath(pid));
        const doc = (await tx.get(dayPath(pid, date))) || { playerId: pid, date, habits: {} };
        if (doc.complete) return doc.streakEvents || null;
        const { player, events } = E.completeSession(p0, date);
        tx.set(playerPath(pid), player);
        tx.set(dayPath(pid, date), { ...doc, complete: true, streakEvents: events });
        return events;
      });
    },

    async completeParentDay(pid) {
      return T(async (tx) => {
        const date = D.today();
        const p0 = await tx.get(playerPath(pid));
        const doc = (await tx.get(dayPath(pid, date))) || { playerId: pid, date, habits: {} };
        const { player, events } = E.completeSession(p0, date);
        tx.set(playerPath(pid), player);
        tx.set(dayPath(pid, date), { ...doc, complete: true, streakEvents: events });
        return events;
      });
    },

    async bank(pid, amount, direction) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        const r = direction === 'in' ? E.deposit(p0, amount, D.today()) : E.withdraw(p0, amount, D.today());
        tx.set(playerPath(pid), r.player);
        return r.amount;
      });
    },

    async buy(pid, itemId) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        const r = E.buyItem(p0, itemId, D.today());
        tx.set(playerPath(pid), r.player);
        return r.item;
      });
    },

    async equip(pid, change) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        tx.set(playerPath(pid), E.equip(p0, change));
      });
    },

    async requestReward(pid, rewardId) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        const r = E.requestReward(p0, REWARD_BY_ID[rewardId], D.today());
        tx.set(playerPath(pid), r.player);
        tx.create('requests', r.request);
        return r.request;
      });
    },

    async foodAdventure(pid, food, rating) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        const r = E.foodClaim(p0, { food, rating, date: D.today() });
        tx.set(playerPath(pid), r.player);
        tx.create('claims', r.claim);
        return r.claim;
      });
    },

    async dismissMessages(pid) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        tx.set(playerPath(pid), { ...p0, messages: [] });
      });
    },

    // ---- Game Master ------------------------------------------------------
    async approveClaim(claimId, { healthy = false, by }) {
      return T(async (tx) => {
        const claim = await tx.get(`claims/${claimId}`);
        if (!claim || claim.status !== 'pending') return null;
        const p0 = await tx.get(playerPath(claim.playerId));
        const dayP = claim.kind === 'habit' ? dayPath(claim.playerId, claim.date) : null;
        const day = dayP ? await tx.get(dayP) : null;
        const r = E.approveClaim(p0, claim, { healthy, by, date: D.today() });
        tx.set(playerPath(claim.playerId), r.player);
        tx.set(`claims/${claimId}`, r.claim);
        if (day?.habits?.[claim.habitId]) {
          tx.set(dayP, { ...day, habits: { ...day.habits, [claim.habitId]: { ...day.habits[claim.habitId], pending: false, approved: true, by } } });
        }
        return r;
      });
    },

    async rejectClaim(claimId, { note, by }) {
      return T(async (tx) => {
        const claim = await tx.get(`claims/${claimId}`);
        if (!claim || claim.status !== 'pending') return null;
        const p0 = await tx.get(playerPath(claim.playerId));
        const dayP = claim.kind === 'habit' ? dayPath(claim.playerId, claim.date) : null;
        const day = dayP ? await tx.get(dayP) : null;
        const r = E.rejectClaim(p0, claim, { note, by, date: D.today() });
        let p = r.player;
        if (claim.kind === 'food') p = { ...p, food: { ...p.food, week: null } };
        tx.set(playerPath(claim.playerId), p);
        tx.set(`claims/${claimId}`, r.claim);
        if (day?.habits?.[claim.habitId]) {
          tx.set(dayP, { ...day, habits: { ...day.habits, [claim.habitId]: { ...day.habits[claim.habitId], pending: false, rejected: true, by } } });
        }
        return r;
      });
    },

    async decideRequest(reqId, approve, by) {
      return T(async (tx) => {
        const req = await tx.get(`requests/${reqId}`);
        if (!req || req.status !== 'requested') return null;
        const date = D.today();
        if (approve) {
          tx.set(`requests/${reqId}`, { ...req, status: 'approved', decidedBy: by, decidedOn: date });
        } else {
          const p0 = await tx.get(playerPath(req.playerId));
          const p = { ...p0, wallet: p0.wallet + req.price, messages: [{ text: `${by} said not yet to "${req.name}". Your ${req.price} koins are back.`, date }, ...(p0.messages || [])].slice(0, 10) };
          tx.set(playerPath(req.playerId), p);
          tx.set(`requests/${reqId}`, { ...req, status: 'declined', decidedBy: by, decidedOn: date });
        }
      });
    },

    async markDelivered(reqId, by) {
      return T(async (tx) => {
        const req = await tx.get(`requests/${reqId}`);
        if (!req) return;
        tx.set(`requests/${reqId}`, { ...req, status: 'delivered', deliveredBy: by, deliveredOn: D.today() });
      });
    },

    async logEvening(pid, habitIds, by) {
      return T(async (tx) => {
        const date = D.today();
        const p0 = await tx.get(playerPath(pid));
        const doc = await tx.get(dayPath(pid, date));
        const r = E.logEvening(p0, doc, habitIds, { by, date });
        tx.set(playerPath(pid), r.player);
        tx.set(dayPath(pid, date), r.doc);
        return r;
      });
    },

    async excuse(pid, date, habitId, by) {
      return T(async (tx) => {
        const doc = await tx.get(dayPath(pid, date));
        tx.set(dayPath(pid, date), E.excuse(doc, habitId, { by, date, playerId: pid }));
      });
    },

    async spotCheck(pid, date, habitId, by) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        const doc = await tx.get(dayPath(pid, date));
        const r = E.spotCheck(p0, doc, habitId, { by, date: D.today() });
        tx.set(playerPath(pid), r.player);
        tx.set(dayPath(pid, date), r.doc);
      });
    },

    async bonus(pid, { xp, coins, note, by }) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        const r = E.giveBonus(p0, { xp, coins, note, by, date: D.today() });
        tx.set(playerPath(pid), r.player);
        return r;
      });
    },

    async sendCard(pid, cardId) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        tx.set(playerPath(pid), E.queueCard(p0, cardId, D.today()));
      });
    },

    async setPause(pid, paused) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        tx.set(playerPath(pid), E.setPause(p0, paused, D.today()));
      });
    },

    async clearNotes(pid) {
      return T(async (tx) => {
        const p0 = await tx.get(playerPath(pid));
        tx.set(playerPath(pid), { ...p0, notes: [] });
      });
    }
  };
}

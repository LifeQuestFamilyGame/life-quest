import { useEffect, useState } from 'preact/hooks';
import * as D from '../../engine/dates.js';
import { levelInfo } from '../../engine/rules.js';
import { playerPath, dayPath } from '../../data/actions.js';
import { Hud, Hero, Pet, Koin, Flame, Shield, StatsPanel, useDoc, useQuery, useToast, Loading, fmt } from '../../ui/components.jsx';
import { CheckIn } from './CheckIn.jsx';
import { HabitRollResult, LifeRollResult } from './Rolls.jsx';
import { Choice } from './Choice.jsx';
import { Payday, Checkup } from './Sunday.jsx';
import { Shop, Bank, Room, FoodAdventure } from './Shop.jsx';

export function useWeekDocs(store, pid, date) {
  const [docs, setDocs] = useState({});
  useEffect(() => {
    const ws = D.weekStart(date);
    const dates = [D.addDays(ws, -1), ...Array.from({ length: 7 }, (_, i) => D.addDays(ws, i))];
    const unsubs = dates.map((d) => store.watchDoc(dayPath(pid, d), (doc) => setDocs((prev) => {
      const next = { ...prev };
      if (doc) next[d] = doc; else delete next[d];
      return next;
    })));
    return () => unsubs.forEach((u) => u && u());
  }, [store, pid, date]);
  return docs;
}

function computeStage({ player, doc, date, habitRoll, paydayAck, lateAck }) {
  const week = player.week;
  const overdue = week.start < D.weekStart(date);
  const sunday = D.isSunday(date);
  if (overdue) return paydayAck ? { stage: 'checkup', late: true } : { stage: 'payday', late: true };
  if (doc.lateCheckup && !doc.checkedIn && !lateAck) return { stage: 'checkupView', late: true };
  if (!doc.checkedIn) return { stage: 'checkin' };
  if (habitRoll) return { stage: 'habitRoll' };
  if (sunday) {
    if (!doc.checkup) return paydayAck ? { stage: 'checkup' } : { stage: 'payday' };
    if (!doc.complete) return { stage: 'checkupView' };
    return { stage: 'done' };
  }
  if (!doc.choice) return { stage: 'choice' };
  if (!doc.complete) return { stage: 'result' };
  return { stage: 'done' };
}

export function KidApp({ store, actions, pid, header }) {
  const date = D.today();
  const player = useDoc(store, playerPath(pid));
  const todayDoc = useDoc(store, dayPath(pid, date));
  const weekDocs = useWeekDocs(store, pid, date);
  const requests = useQuery(store, 'requests', [['playerId', '==', pid]]);
  const claims = useQuery(store, 'claims', [['playerId', '==', pid], ['status', '==', 'pending']]);
  const [busy, setBusy] = useState(false);
  const [habitRoll, setHabitRoll] = useState(null);
  const [paydayAck, setPaydayAck] = useState(false);
  const [lateAck, setLateAck] = useState(false);
  const [view, setView] = useState('play');
  const [toast, say] = useToast();

  useEffect(() => { actions.ensurePlayers([pid]).then(() => actions.startDay(pid)).catch((e) => console.error(e)); }, [pid, date]);

  const ready = player && todayDoc !== undefined;
  const doc = todayDoc || {};
  const { stage, late } = ready ? computeStage({ player, doc, date, habitRoll, paydayAck, lateAck }) : { stage: 'loading' };

  // Draw today's card as soon as the choice step is reached; land payday koins when payday opens.
  useEffect(() => { if (stage === 'choice' && !doc.card) actions.drawCard(pid).catch(console.error); }, [stage, doc.card, pid]);
  useEffect(() => { if (stage === 'payday' && player && !player.week.paydayDone) actions.payday(pid).catch(console.error); }, [stage, player?.week?.paydayDone, pid]);

  if (player === undefined || todayDoc === undefined) return <Loading />;
  if (!player) return <Loading text="Setting up your hero…" />;

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { const r = await fn(); if (okMsg) say(okMsg); return r; }
    catch (e) { console.error(e); say(e.message || 'Something went wrong. Try again.'); return null; }
    finally { setBusy(false); }
  };
  const sunday = D.isSunday(date);

  let body;
  if (view === 'shop') body = <Shop player={player} requests={requests} busy={busy} onBack={() => setView('play')}
    onRequest={(id) => run(() => actions.requestReward(pid, id), 'Sent to Mum and Dad!')} onBuy={(id) => run(() => actions.buy(pid, id), "It's yours!")} />;
  else if (view === 'bank') body = <Bank player={player} busy={busy} onBack={() => setView('play')} onMove={(n, dir) => run(() => actions.bank(pid, n, dir), dir === 'in' ? 'Banked!' : 'Moved to your wallet')} />;
  else if (view === 'room') body = <Room player={player} busy={busy} onBack={() => setView('play')} onEquip={(c) => run(() => actions.equip(pid, c))} />;
  else if (view === 'food') body = <FoodAdventure player={player} busy={busy} used={player.food?.week === D.weekStart(date)} onBack={() => setView('play')}
    onSubmit={async (f, r) => { const ok = await run(() => actions.foodAdventure(pid, f, r), 'Sent! Mum or Dad will approve it.'); if (ok) setView('play'); }} />;
  else if (stage === 'payday') body = player.week.paydayDone
    ? <Payday player={player} payday={late ? doc.latePayday : doc.payday} late={late} busy={busy} onBank={(n) => run(() => actions.bank(pid, n, 'in'))} onNext={() => setPaydayAck(true)} />
    : <Loading text="Counting your koins…" />;
  else if (stage === 'checkup') body = <Checkup player={player} checkup={null} busy={busy} finishLabel="" onRoll={() => run(() => actions.checkup(pid))} onFinish={() => {}} />;
  else if (stage === 'checkupView') body = <Checkup player={player} checkup={late ? doc.lateCheckup : doc.checkup} busy={busy}
    finishLabel={late ? 'On to today' : 'Finish today'} onFinish={() => { if (late) { setLateAck(true); setPaydayAck(false); } else run(() => actions.complete(pid)); }} />;
  else if (stage === 'checkin') body = <CheckIn player={player} date={date} weekDocs={weekDocs} prevDoc={weekDocs[D.addDays(date, -1)]} busy={busy}
    onSubmit={async (answers) => { const r = await run(() => actions.submitCheckin(pid, answers)); if (r) setHabitRoll(r.roll || { none: true }); }} />;
  else if (stage === 'habitRoll') body = <HabitRollResult player={player} roll={habitRoll.none ? null : habitRoll} nextLabel={sunday ? 'Next: Sunday payday' : "Next: today's choice"} onNext={() => setHabitRoll(null)} />;
  else if (stage === 'choice') body = doc.card ? <Choice player={player} cardRef={doc.card} date={date} busy={busy} onChoose={(k) => run(() => actions.choose(pid, k))} /> : <Loading text="Shuffling the cards…" />;
  else if (stage === 'result') body = <LifeRollResult player={player} result={doc.choice} busy={busy} onCollect={() => run(() => actions.complete(pid))} />;
  else body = <Done player={player} doc={doc} date={date} claims={claims} onGo={setView} onDismiss={() => run(() => actions.dismissMessages(pid))} />;

  return (
    <div className="screen">
      {header}
      <Hud player={player} />
      {stage !== 'done' && view === 'play' && player.messages?.length > 0 && <Messages player={player} onDismiss={() => run(() => actions.dismissMessages(pid))} />}
      {body}
      {toast}
    </div>
  );
}

function Messages({ player, onDismiss }) {
  return (
    <div className="panel stack" style={{ background: 'var(--sun-soft)', gap: 6 }}>
      {player.messages.slice(0, 3).map((m, i) => <p key={i}>{m.text}</p>)}
      <button type="button" className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={onDismiss}>Got it</button>
    </div>
  );
}

function Done({ player, doc, date, claims, onGo, onDismiss }) {
  const ev = doc.streakEvents || {};
  const L = levelInfo(player.xp);
  const pending = (claims || []).filter((c) => c.kind !== 'food');
  const foodUsed = player.food?.week === D.weekStart(date);
  return (
    <div className="split side-left">
      <section className="card stack" style={{ alignItems: 'center', background: player.tint }}>
        <p className="display center" style={{ background: '#fff', border: '3px solid var(--ink)', borderRadius: 18, padding: '12px 16px', fontSize: 24 }}>Done for today! See you tomorrow at 5pm.</p>
        <div className="row" style={{ alignItems: 'flex-end', gap: 0 }}><Hero player={player} size={190} />{player.pet && <Pet type={player.pet.type} size={86} />}</div>
      </section>
      <section className="card stack">
        <div className="row wrap" style={{ gap: 10 }}>
          <span className="chip" style={{ background: '#FFF1E6', fontSize: 18 }}><Flame size={28} />{player.streak.count}-day streak</span>
          {ev.shieldEarned && <span className="chip" style={{ background: '#E6F1FF' }}><Shield />New streak shield!</span>}
          {ev.weekBonus > 0 && <span className="chip"><Koin size={22} />+{ev.weekBonus} full streak week</span>}
          {ev.shieldsUsed > 0 && <span className="chip">A shield saved your streak</span>}
          {ev.milestone && <span className="chip" style={{ background: 'var(--sun-pale)' }}>Badge: {ev.milestone}-day streak</span>}
        </div>
        {player.messages?.length > 0 && (
          <div className="panel stack" style={{ background: 'var(--sun-soft)', gap: 6 }}>
            {player.messages.slice(0, 4).map((m, i) => <p key={i}>{m.text}</p>)}
            <button type="button" className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={onDismiss}>Got it</button>
          </div>
        )}
        {pending.length > 0 && <p className="panel" style={{ background: 'var(--sun-pale)' }}>{pending.length} {pending.length === 1 ? 'habit is' : 'habits are'} waiting for Mum or Dad. {fmt(pending.reduce((s, c) => s + c.coins, 0))} koins will land when they approve.</p>}
        <div className="tiles">
          <button type="button" className="btn primary" onClick={() => onGo('shop')}>Shop</button>
          <button type="button" className="btn" onClick={() => onGo('bank')}>Bank: {fmt(player.bank)}</button>
          <button type="button" className="btn" onClick={() => onGo('room')}>My room</button>
          <button type="button" className="btn" onClick={() => onGo('food')} disabled={foodUsed}>{foodUsed ? 'Food Adventure done' : 'Food Adventure'}</button>
        </div>
        <StatsPanel player={player} />
        <div className="panel stack" style={{ gap: 6 }}>
          <p className="kicker">Level {L.level} · {L.chapterName}</p>
          <p>{fmt(L.toNext)} XP to level {L.level + 1}. Earning cap this week: {fmt(L.weeklyCap)} koins ({fmt(player.week.earned)} so far).</p>
          {player.seeds?.length > 0 && <p>Seeds growing: {player.seeds.map((s) => s.text).join(', ')}.</p>}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'preact/hooks';
import * as D from '../../engine/dates.js';
import * as E from '../../engine/engine.js';
import { levelInfo } from '../../engine/rules.js';
import { STATS, STAT_NAMES, HABIT_BY_ID } from '../../content/habits.js';
import { REAL_REWARDS } from '../../content/shop.js';
import { KIDS } from '../../content/family.js';
import { playerPath, dayPath } from '../../data/actions.js';
import { HeroHead, Hero, Koin, Flame, Shield, StatIcon, Tick, Cross, useDoc, useQuery, useToast, Loading, fmt } from '../../ui/components.jsx';
import { KidApp, useWeekDocs } from '../kid/KidApp.jsx';
import { CheckIn } from '../kid/CheckIn.jsx';
import { Shop, Room } from '../kid/Shop.jsx';

const KID_NAMES = { kaelen: 'Kaelen', xavier: 'Xavier' };

function usePlayers(store) {
  const all = useQuery(store, 'players', []);
  const map = Object.fromEntries((all || []).map((p) => [p.id, p]));
  return all === undefined ? undefined : map;
}

export function ParentApp({ store, actions, me, header }) {
  const [tab, setTab] = useState('approvals');
  const [playAs, setPlayAs] = useState(null);
  const players = usePlayers(store);
  const claims = useQuery(store, 'claims', [['status', '==', 'pending']]);
  const requests = useQuery(store, 'requests', []);
  const [toast, say] = useToast();
  const [busy, setBusy] = useState(false);
  const by = me.id === 'debora' ? 'Mum' : 'Dad';

  useEffect(() => { actions.ensurePlayers(['jonathan', 'debora', 'kaelen', 'xavier']).catch(console.error); }, []);

  if (players === undefined || claims === undefined) return <Loading />;
  const run = async (fn, msg) => {
    setBusy(true);
    try { const r = await fn(); if (msg) say(msg); return r; }
    catch (e) { console.error(e); say(e.message || 'Something went wrong'); return null; }
    finally { setBusy(false); }
  };

  if (playAs) {
    return <KidApp store={store} actions={actions} pid={playAs} header={<>{header}<div className="row" style={{ justifyContent: 'space-between' }}><p className="kicker">Playing as {KID_NAMES[playAs]} on {by}'s login</p><button type="button" className="btn small" onClick={() => setPlayAs(null)}>Back to Game Master</button></div></>} />;
  }

  const openReqs = (requests || []).filter((r) => r.status === 'requested');
  const count = claims.length + openReqs.length;
  const me2 = players[me.id];
  return (
    <div className="gm">
      {header}
      <main>
        <header className="row">
          {me2 ? <HeroHead player={me2} /> : null}
          <div className="grow"><h1 className="display" style={{ fontSize: 26, lineHeight: 1 }}>Game Master</h1><p className="muted" style={{ fontSize: 14 }}>{me2?.heroName || me.name} · {D.prettyDate(D.today())}</p></div>
        </header>
        {tab === 'approvals' && <Approvals {...{ players, claims, requests, actions, run, busy, by }} />}
        {tab === 'boys' && <Boys {...{ store, players, actions, run, busy, by, setPlayAs }} />}
        {tab === 'rewards' && <Rewards {...{ requests, players, actions, run, busy, by }} />}
        {tab === 'me' && me2 && <MyHero {...{ store, actions, player: me2, run, busy }} />}
      </main>
      <nav aria-label="Game Master">
        {[['approvals', 'Approvals'], ['boys', 'The boys'], ['rewards', 'Rewards'], ['me', 'My hero']].map(([k, label]) => (
          <button key={k} type="button" aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
            {k === 'approvals' && count > 0 && <span className="count">{count}</span>}
            <NavIcon k={k} />{label}
          </button>
        ))}
      </nav>
      {toast}
    </div>
  );
}

function NavIcon({ k }) {
  if (k === 'approvals') return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#157A4E" stroke="#1D2A4D" stroke-width="2" /><path d="M7.5 12.5l3 3 6-6" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>;
  if (k === 'boys') return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="9" r="3.5" fill="#FFF1C9" stroke="#1D2A4D" stroke-width="2" /><circle cx="16" cy="9" r="3.5" fill="#DDF6EA" stroke="#1D2A4D" stroke-width="2" /><path d="M3 20c0-3.5 2.5-5.5 5.5-5.5S14 16.5 14 20M10.5 20c0-3.5 2.5-5.5 5.5-5.5s5.5 2 5.5 5.5" stroke="#1D2A4D" stroke-width="2" fill="none" stroke-linecap="round" /></svg>;
  if (k === 'rewards') return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2" fill="#FFC93C" stroke="#1D2A4D" stroke-width="2" /><path d="M3 13h18M12 9v12M12 9c-2-4-7-4-6-1s6 1 6 1c2-4 7-4 6-1s-6 1-6 1" stroke="#1D2A4D" stroke-width="2" fill="none" stroke-linejoin="round" /></svg>;
  return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="#E8E3FF" stroke="#1D2A4D" stroke-width="2" /><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" fill="#E8E3FF" stroke="#1D2A4D" stroke-width="2" /></svg>;
}

// ---------------------------------------------------------------------------
function Approvals({ players, claims, requests, actions, run, busy, by }) {
  const [healthy, setHealthy] = useState({});
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');
  const openReqs = (requests || []).filter((r) => r.status === 'requested');
  const notes = KIDS.flatMap((id) => (players[id]?.notes || []).map((n) => ({ ...n, pid: id })));
  const sorted = [...claims].sort((a, b) => (a.playerId + a.date).localeCompare(b.playerId + b.date));
  return (
    <>
      {notes.length > 0 && (
        <div className="panel stack" style={{ background: 'var(--sun-soft)', gap: 6 }}>
          {notes.map((n, i) => <p key={i}>{n.text}</p>)}
          <button type="button" className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => run(async () => { for (const id of KIDS) if (players[id]?.notes?.length) await actions.clearNotes(id); })}>Clear notes</button>
        </div>
      )}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 className="kicker">Waiting for you</h2>
        <div className="row" style={{ gap: 4 }}>
          {KIDS.filter((id) => claims.some((c) => c.playerId === id && c.kind === 'habit')).map((id) => (
            <button key={id} type="button" className="linkbtn" disabled={busy} onClick={() => run(async () => { for (const c of claims.filter((c) => c.playerId === id && c.kind === 'habit')) await actions.approveClaim(c.id, { by }); }, `Approved all of ${KID_NAMES[id]}'s`)}>Approve all {KID_NAMES[id]}'s</button>
          ))}
        </div>
      </div>
      {!sorted.length && <p className="panel muted">Nothing waiting. Nice.</p>}
      {sorted.map((c) => {
        const p = players[c.playerId];
        if (!p) return null;
        const food = c.kind === 'food';
        return (
          <div key={c.id} className="panel stack" style={{ gap: 8 }}>
            <div className="row">
              <HeroHead player={p} small />
              <div className="grow">
                <p style={{ fontWeight: 700 }}>{c.label}</p>
                <p className="muted" style={{ fontSize: 13 }}>{p.name} · {c.date === D.today() ? 'today' : c.date === D.addDays(D.today(), -1) ? 'yesterday' : D.dayName(c.date)} · {food ? `${healthy[c.id] ? 100 : 50} XP and koins · rated ${c.rating}` : `+${c.coins} koins`}</p>
              </div>
              <button type="button" className="iconbtn" aria-label={`Don't approve ${c.label} for ${p.name}`} disabled={busy} onClick={() => { setRejecting(c); setNote(''); }}><Cross /></button>
              <button type="button" className="iconbtn good" aria-label={`Approve ${c.label} for ${p.name}`} disabled={busy} onClick={() => run(() => actions.approveClaim(c.id, { healthy: !!healthy[c.id], by }), 'Approved')}><Tick /></button>
            </div>
            {food && <label className="row" style={{ background: 'var(--leaf-soft)', borderRadius: 10, padding: '6px 10px', fontWeight: 700, fontSize: 14, minHeight: 44 }}><input type="checkbox" checked={!!healthy[c.id]} onChange={(e) => setHealthy((h) => ({ ...h, [c.id]: e.currentTarget.checked }))} style={{ width: 22, height: 22, accentColor: 'var(--leaf-dark)' }} />Healthy (veg, fruit, fish or wholegrain) doubles it</label>}
          </div>
        );
      })}

      <h2 className="kicker" style={{ marginTop: 6 }}>Reward requests</h2>
      {!openReqs.length && <p className="panel muted">No reward requests.</p>}
      {openReqs.map((r) => {
        const p = players[r.playerId];
        return (
          <div key={r.id} className="panel stack" style={{ background: 'var(--sun-soft)', gap: 10 }}>
            <div className="row">{p && <HeroHead player={p} small />}<p className="grow"><strong>{p?.name}</strong> wants: {r.name}</p><span className="display" style={{ fontSize: 19 }}>{fmt(r.price)}</span></div>
            <div className="cols2">
              <button type="button" className="btn small" disabled={busy} onClick={() => run(() => actions.decideRequest(r.id, false, by), 'Koins returned')}>Not yet</button>
              <button type="button" className="btn good small" disabled={busy} onClick={() => run(() => actions.decideRequest(r.id, true, by), 'Approved. Mark it delivered under Rewards.')}>Approve</button>
            </div>
          </div>
        );
      })}

      {rejecting && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Don't approve">
          <div className="card stack">
            <h2 className="display" style={{ fontSize: 26 }}>Not approving: {rejecting.label}</h2>
            <p className="muted">{players[rejecting.playerId]?.name} won't get the koins. Add a short note he'll see.</p>
            <label className="field">Note<input type="text" maxLength={120} value={note} onInput={(e) => setNote(e.currentTarget.value)} placeholder="Like: piano was only 3 minutes" /></label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn small" onClick={() => setRejecting(null)}>Cancel</button>
              <button type="button" className="btn primary small" disabled={busy} onClick={async () => { const c = rejecting; setRejecting(null); await run(() => actions.rejectClaim(c.id, { note, by }), 'Sent'); }}>Don't approve</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
function Boys({ store, players, actions, run, busy, by, setPlayAs }) {
  const [sheet, setSheet] = useState(null);
  return (
    <>
      {KIDS.map((id) => {
        const p = players[id];
        if (!p) return <p key={id} className="panel muted">{KID_NAMES[id]} hasn't started yet.</p>;
        const L = levelInfo(p.xp);
        return (
          <section key={id} className="card tight stack">
            <div className="row">
              <HeroHead player={p} />
              <div className="grow"><p className="display" style={{ fontSize: 22, lineHeight: 1.05, overflowWrap: 'anywhere' }}>{p.heroName}</p><p className="muted" style={{ fontSize: 14 }}>{p.name} · Level {L.level}</p></div>
            </div>
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="chip"><Flame />{p.streak.count} days{p.streak.paused ? ' (paused)' : ''}</span>
              <span className="chip"><Shield />{p.streak.shields}</span>
              <span className="chip"><Koin size={22} />{fmt(p.wallet)}</span>
              <span className="chip">Bank {fmt(p.bank)}</span>
              <span className="chip">Week {fmt(p.week.earned)}/{fmt(L.weeklyCap)}</span>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              {STATS.map((s) => (
                <div key={s} className="row" style={{ gap: 8 }}>
                  <StatIcon stat={s} size={22} />
                  <span style={{ width: 62, fontSize: 14, fontWeight: 700 }}>{STAT_NAMES[s]}</span>
                  <div className="bar grow" style={{ height: 12 }}><div style={{ width: `${p.stats[s]}%`, background: s === 'health' ? '#22A06B' : s === 'brains' ? '#9B7BFF' : s === 'money' ? '#E9A800' : '#F06AA7' }} /></div>
                  <span style={{ width: 28, textAlign: 'right', fontSize: 14 }}>{p.stats[s]}</span>
                  <span title="Risk tokens" aria-label={`${p.risk[s]} risk tokens`}><Shield size={18} cracks={p.risk[s]} fill={p.risk[s] ? '#C9B8FF' : '#E6ECF8'} /></span>
                </div>
              ))}
            </div>
            <div className="row wrap" style={{ gap: 8 }}>
              <button type="button" className="btn small" onClick={() => setSheet({ type: 'log', id })}>Log tonight's jobs</button>
              <button type="button" className="btn small" onClick={() => setSheet({ type: 'excuse', id })}>Excuse a session</button>
              <button type="button" className="btn small" onClick={() => setSheet({ type: 'spot', id })}>Spot check</button>
              <button type="button" className="btn small" onClick={() => setSheet({ type: 'bonus', id })}>Give a bonus</button>
              {!p.unlocked?.martial && !(p.deck.queue || []).some((q) => q.cardId === E.DOJO_CARD) && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => actions.sendCard(id, E.DOJO_CARD), `The martial arts card is in ${p.name}'s next choice`)}>Send martial arts card</button>}
              <button type="button" className="btn small" disabled={busy} onClick={() => run(() => actions.setPause(id, !p.streak.paused), p.streak.paused ? 'Streak running again' : 'Streak paused')}>{p.streak.paused ? 'Resume streak' : 'Pause streak'}</button>
              <button type="button" className="btn small" onClick={() => setPlayAs(id)}>Open his game</button>
            </div>
          </section>
        );
      })}
      {sheet && <BoySheet {...{ store, sheet, player: players[sheet.id], actions, run, busy, by, close: () => setSheet(null) }} />}
    </>
  );
}

function BoySheet({ store, sheet, player, actions, run, busy, by, close }) {
  const date = D.today();
  const week = useWeekDocs(store, player.id, date);
  const [picked, setPicked] = useState([]);
  const [bonus, setBonus] = useState({ xp: 20, coins: 0, note: '' });
  const toggle = (id) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  let title, body, action;
  if (sheet.type === 'log') {
    const items = E.habitList(player).filter((h) => h.when === 'lastNight' && (h.freq.type !== 'roster' || E.bixTurn(date) === player.id));
    const doneAlready = week[date]?.habits || {};
    title = `Tonight's jobs for ${player.name}`;
    body = <><p className="muted">Ticked jobs count straight away, already approved. He won't need to tick them tomorrow.</p>
      {items.map((h) => <label key={h.id} className="row panel" style={{ minHeight: 52 }}><input type="checkbox" disabled={!!doneAlready[h.id]} checked={!!doneAlready[h.id] || picked.includes(h.id)} onChange={() => toggle(h.id)} style={{ width: 24, height: 24 }} /><span className="grow">{h.name}{h.sub && h.id !== 'feedBix' ? ` (${h.sub})` : ''}</span><span className="muted" style={{ fontSize: 14 }}>{doneAlready[h.id] ? 'Logged' : h.coins ? `+${h.coins} koins` : `+${h.xp} XP`}</span></label>)}</>;
    action = () => run(() => actions.logEvening(player.id, picked, by), 'Logged');
  } else if (sheet.type === 'excuse') {
    const due = E.dueToday(player, date, week).filter((it) => !it.status);
    title = `Excuse a session for ${player.name}`;
    body = <><p className="muted">When something clashes, an excused session drops out of this week's target instead of counting as a miss.</p>
      {due.length ? due.map((it) => <label key={it.h.id} className="row panel" style={{ minHeight: 52 }}><input type="checkbox" checked={picked.includes(it.h.id)} onChange={() => toggle(it.h.id)} style={{ width: 24, height: 24 }} /><span className="grow">{it.h.name}</span>{it.prog && <span className="muted" style={{ fontSize: 14 }}>{it.prog.done} of {it.prog.target}</span>}</label>) : <p className="panel muted">Nothing left to excuse today.</p>}</>;
    action = () => run(async () => { for (const id of picked) await actions.excuse(player.id, date, id, by); }, 'Excused');
  } else if (sheet.type === 'spot') {
    const dates = [date, D.addDays(date, -1)];
    const rows = dates.flatMap((d) => Object.entries(week[d]?.habits || {}).filter(([id, v]) => v.status === 'done' && !v.loggedBy && E.habitList(player).find((h) => h.id === id && h.kind === 'honour')).map(([id]) => ({ d, id })));
    title = `Spot check ${player.name}`;
    body = <><p className="muted">Only for habits you know weren't done. He loses double the XP and 5 Heart, and his Heart shield cracks. Fibbing always costs more than the miss.</p>
      {rows.length ? rows.map((r) => <label key={r.d + r.id} className="row panel" style={{ minHeight: 52 }}><input type="radio" name="spot" checked={picked[0] === `${r.d}|${r.id}`} onChange={() => setPicked([`${r.d}|${r.id}`])} style={{ width: 24, height: 24 }} /><span className="grow">{HABIT_BY_ID[r.id]?.name}</span><span className="muted" style={{ fontSize: 14 }}>{r.d === date ? 'today' : 'yesterday'}</span></label>) : <p className="panel muted">No honour habits ticked today or yesterday.</p>}</>;
    action = () => run(() => { const [d, id] = picked[0].split('|'); return actions.spotCheck(player.id, d, id, by); }, 'Done. He will see a note.');
  } else {
    title = `Give ${player.name} a bonus`;
    body = <>
      <p className="muted">For something real, like helping his brother without being asked. Bonus koins count toward the weekly cap.</p>
      <label className="field">What for?<input type="text" maxLength={100} value={bonus.note} onInput={(e) => setBonus({ ...bonus, note: e.currentTarget.value })} placeholder="Helped his brother without being asked" /></label>
      <div className="cols2">
        <label className="field">XP<input type="number" min="0" max="500" value={bonus.xp} onInput={(e) => setBonus({ ...bonus, xp: Number(e.currentTarget.value) || 0 })} /></label>
        <label className="field">Koins<input type="number" min="0" max="500" value={bonus.coins} onInput={(e) => setBonus({ ...bonus, coins: Number(e.currentTarget.value) || 0 })} /></label>
      </div></>;
    action = () => run(() => actions.bonus(player.id, { ...bonus, by }), 'Bonus sent');
  }
  const canGo = sheet.type === 'bonus' ? (bonus.xp > 0 || bonus.coins > 0) && bonus.note.trim() : picked.length > 0;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="card stack">
        <h2 className="display" style={{ fontSize: 26 }}>{title}</h2>
        {body}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn small" onClick={close}>Cancel</button>
          <button type="button" className="btn primary small" disabled={busy || !canGo} onClick={async () => { await action(); close(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Rewards({ requests, players, actions, run, busy, by }) {
  const approved = (requests || []).filter((r) => r.status === 'approved');
  const delivered = (requests || []).filter((r) => r.status === 'delivered').sort((a, b) => (b.deliveredOn || '').localeCompare(a.deliveredOn || '')).slice(0, 10);
  return (
    <>
      <h2 className="kicker">To deliver</h2>
      {!approved.length && <p className="panel muted">Nothing to deliver.</p>}
      {approved.map((r) => (
        <div key={r.id} className="row panel">
          {players[r.playerId] && <HeroHead player={players[r.playerId]} small />}
          <p className="grow"><strong>{players[r.playerId]?.name}</strong>: {r.name}</p>
          <button type="button" className="btn good small" disabled={busy} onClick={() => run(() => actions.markDelivered(r.id, by), 'Delivered')}>Delivered</button>
        </div>
      ))}
      <h2 className="kicker">Reward menu</h2>
      <div className="panel stack" style={{ gap: 6 }}>
        {REAL_REWARDS.map((r) => <div key={r.id} className="row" style={{ justifyContent: 'space-between' }}><span>{r.name}</span><strong>{fmt(r.price)}</strong></div>)}
        <p className="muted" style={{ fontSize: 14 }}>100 koins = $1. Tell Claude if you want to change items or prices.</p>
      </div>
      {delivered.length > 0 && <>
        <h2 className="kicker">Recently delivered</h2>
        {delivered.map((r) => <p key={r.id} className="panel muted">{players[r.playerId]?.name}: {r.name} ({r.deliveredOn})</p>)}
      </>}
    </>
  );
}

// ---------------------------------------------------------------------------
function MyHero({ store, actions, player, run, busy }) {
  const date = D.today();
  const todayDoc = useDoc(store, dayPath(player.id, date));
  const week = useWeekDocs(store, player.id, date);
  const [view, setView] = useState('home');
  if (todayDoc === undefined) return <Loading />;
  const L = levelInfo(player.xp);
  if (view === 'shop') return <Shop player={player} parentMode busy={busy} onBack={() => setView('home')} onBuy={(id) => run(() => actions.buy(player.id, id), "It's yours!")} />;
  if (view === 'room') return <Room player={player} busy={busy} onBack={() => setView('home')} onEquip={(c) => run(() => actions.equip(player.id, c))} />;
  return (
    <>
      <section className="card tight row" style={{ background: player.tint }}>
        <Hero player={player} size={110} />
        <div className="grow stack" style={{ gap: 6 }}>
          <p className="display" style={{ fontSize: 24, lineHeight: 1 }}>{player.heroName}</p>
          <p className="muted">Level {L.level} · {fmt(L.into)} / {fmt(L.size)} XP</p>
          <div className="row wrap" style={{ gap: 6 }}><span className="chip"><Flame />{player.streak.count}</span><span className="chip"><Koin size={22} />{fmt(player.wallet)}</span></div>
        </div>
      </section>
      {!todayDoc?.complete ? (
        <CheckIn compact player={player} date={date} weekDocs={week} prevDoc={week[D.addDays(date, -1)]} busy={busy}
          onSubmit={(answers) => run(async () => { await actions.submitCheckin(player.id, answers); await actions.completeParentDay(player.id); }, 'Saved. Nice work.')} />
      ) : <p className="panel" style={{ background: 'var(--leaf-soft)' }}>Your own habits are done for today.</p>}
      <div className="cols2">
        <button type="button" className="btn" onClick={() => setView('shop')}>Outfits and home</button>
        <button type="button" className="btn" onClick={() => setView('room')}>My room</button>
      </div>
    </>
  );
}

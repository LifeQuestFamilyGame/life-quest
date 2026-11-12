import { useState } from 'preact/hooks';
import { Hero, Koin, StatIcon, Die, fmt } from '../../ui/components.jsx';
import { useDiceReveal } from './Rolls.jsx';
import { levelInfo, BAND_NAMES } from '../../engine/rules.js';
import { STAT_NAMES, STATS } from '../../content/habits.js';
import { CHECKUP } from '../../content/events.js';

const KIND_LABELS = {
  habit: 'Habits Mum and Dad approved', sunday: 'Right choices, paid today', choice: 'Tempting choices (paid at the time)',
  roll: 'Habit Roll luck', checkup: 'Check-up rolls', streak: 'Full streak week', food: 'Food Adventure', bonus: 'Bonuses', seed: 'Seeds', fix: 'Re-score refund'
};

function breakdown(items) {
  const by = {};
  let costs = 0;
  for (const it of items || []) {
    if (it.kind === 'bank' || it.kind === 'spend' || it.kind === 'reward' || it.kind === 'interest') continue;
    if (it.amount < 0) { costs += -it.amount; continue; }
    by[it.kind] = (by[it.kind] || 0) + it.amount;
  }
  return { rows: Object.entries(by).map(([k, v]) => ({ label: KIND_LABELS[k] || k, amount: v })), costs };
}

export function Payday({ player, payday, onBank, onNext, busy, late }) {
  const w = player.week;
  const cap = levelInfo(player.xp).weeklyCap;
  const { rows, costs } = breakdown(w.items);
  const quarter = Math.max(1, Math.ceil(w.earned * 0.25));
  const [banked, setBanked] = useState(0);
  const tempt = payday?.tempt || w.tempt;
  const right = payday?.right || w.right;
  return (
    <div className="split side-wide">
      <section className="card stack" style={{ background: 'var(--sun-soft)' }}>
        <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div className="stack" style={{ gap: 4 }}>
            <p className="kicker">{late ? 'You missed Sunday, so payday is today' : 'Sunday'}</p>
            <h1 className="display" style={{ fontSize: 52, lineHeight: 0.95 }}>Payday!</h1>
          </div>
          <Hero player={player} size={104} />
        </div>
        <div className="row panel" style={{ border: '3px solid var(--ink)', borderRadius: 18 }}>
          <Koin size={46} />
          <div><p className="display" style={{ fontSize: 36, lineHeight: 1 }}>+{fmt(w.earned)}</p><p className="muted">Smiley Koins this week</p></div>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          {rows.map((r) => <div key={r.label} className="row" style={{ justifyContent: 'space-between', borderBottom: '2px dashed #E3C98A', paddingBottom: 6 }}><span>{r.label}</span><strong>+{fmt(r.amount)}</strong></div>)}
          {costs > 0 && <div className="row" style={{ justifyContent: 'space-between' }}><span>Bills and bad luck</span><strong>−{fmt(costs)}</strong></div>}
          {!rows.length && !costs && <p className="muted">No koins yet this week.</p>}
        </div>
        <div className="stack" style={{ gap: 5 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}><span>{fmt(w.earned)} of {fmt(cap)} weekly cap</span>{w.overCap > 0 && <span className="muted">{fmt(w.overCap)} over the cap</span>}</div>
          <div className="bar gold"><div style={{ width: `${Math.min(100, (w.earned / cap) * 100)}%` }} /></div>
        </div>
        {banked > 0 ? <p className="panel" style={{ background: 'var(--leaf-soft)' }}>Banked {fmt(banked)} koins. Next week's Money roll gets +1.</p> : (
          <>
            <div className="cols2">
              <button type="button" className="btn primary small" disabled={busy || player.wallet < quarter} onClick={async () => { const a = await onBank(quarter); setBanked(a || 0); }}>Bank a quarter ({fmt(quarter)})</button>
              <button type="button" className="btn small" disabled={busy} onClick={onNext}>Keep in my wallet</button>
            </div>
            <p className="muted" style={{ fontSize: 14 }}>Banking a quarter or more gives your Money check-up roll +1. Banking nothing gives −1.</p>
          </>
        )}
        {banked > 0 && <button type="button" className="btn primary" onClick={onNext}>Roll your check-up</button>}
      </section>
      <div className="stack" style={{ gap: 20 }}>
        <section className="card stack">
          <h2 className="display" style={{ fontSize: 26 }}>This week's scoreboard</h2>
          <div className="cols2">
            <div className="row" style={{ background: 'var(--blue-soft)', border: '3px solid var(--ink)', borderRadius: 18, padding: '12px 16px' }}>
              <span className="badge-letter" style={{ background: 'var(--blue)', color: '#fff', width: 46, height: 46, fontSize: 24 }}>B</span>
              <div><p style={{ fontWeight: 700 }}>Right choices: {right.count} {right.count === 1 ? 'day' : 'days'}</p><p className="display" style={{ fontSize: 34, lineHeight: 1 }}>+{fmt(right.coins)}</p><p style={{ fontSize: 14, color: 'var(--muted-2)' }}>plus {fmt(right.xp || 0)} XP and Seeds growing</p></div>
            </div>
            <div className="row" style={{ background: 'var(--coral-soft)', border: '3px solid var(--ink)', borderRadius: 18, padding: '12px 16px' }}>
              <span className="badge-letter" style={{ background: 'var(--coral)', width: 46, height: 46, fontSize: 24 }}>A</span>
              <div><p style={{ fontWeight: 700 }}>Tempting choices: {tempt.count} {tempt.count === 1 ? 'day' : 'days'}</p><p className="display" style={{ fontSize: 34, lineHeight: 1 }}>{tempt.coins - tempt.cost >= 0 ? '+' : '−'}{fmt(Math.abs(tempt.coins - tempt.cost))}</p><p style={{ fontSize: 14, color: 'var(--muted-2)' }}>earned {fmt(tempt.coins)}, then cost {fmt(tempt.cost)}</p></div>
            </div>
          </div>
          {payday?.seeds?.length > 0 && payday.seeds.map((s, i) => <p key={i} className="panel">Seed paid out: {s.text} (+{s.coins})</p>)}
        </section>
        <section className="card stack">
          <h2 className="display" style={{ fontSize: 26 }}>Next: the weekly check-up</h2>
          <p className="muted">One roll for each of Health, Brains, Money and Heart. Doing 80% of a stat's habits adds +1 and means the worst you can get is a Setback.</p>
          <div className="row wrap">{STATS.map((s) => <span key={s} className="chip"><StatIcon stat={s} size={22} />{STAT_NAMES[s]}: {CHECKUP[s].about}</span>)}</div>
        </section>
      </div>
    </div>
  );
}

function CheckupRow({ r, rolling }) {
  return (
    <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 170px) 110px minmax(0, 1fr) auto', alignItems: 'center', gap: 14, background: rolling ? 'var(--paper)' : r.band === 'lucky' ? 'var(--sun-soft)' : 'var(--paper)' }}>
      <div className="row" style={{ gap: 10 }}><StatIcon stat={r.stat} /><div><p style={{ fontWeight: 700 }}>{STAT_NAMES[r.stat]}</p><p className="muted" style={{ fontSize: 13 }}>{r.pct != null ? `${Math.round(r.pct * 100)}% of habits` : CHECKUP[r.stat].about}</p></div></div>
      <span style={{ fontWeight: 700 }}>{rolling ? '…' : `${r.d1} + ${r.d2}${r.mods.map((m) => ` ${m.value > 0 ? '+' : ''}${m.value}`).join('')} = ${r.total}`}</span>
      <div style={{ minWidth: 0 }}>
        {!rolling && <span className={`pill b-${r.band}`}>{BAND_NAMES[r.band]}</span>}
        <p style={{ fontSize: 15 }}>{rolling ? 'Rolling…' : r.text}</p>
      </div>
      <span style={{ fontWeight: 700, fontSize: 15, textAlign: 'right' }}>
        {!rolling && (r.coins || r.xp ? `+${r.coins} koins, +${r.xp} XP` : r.statDelta ? `${r.statDelta} ${STAT_NAMES[r.stat]}${r.bill ? `, −${r.bill} koins` : ''}` : 'Nothing extra')}
      </span>
    </div>
  );
}

export function Checkup({ player, checkup, onRoll, onFinish, busy, finishLabel }) {
  const { rolling, faces } = useDiceReveal(checkup ? 'have' : 'none', 1600);
  if (!checkup) {
    return (
      <div className="card stack center" style={{ maxWidth: 720, margin: '0 auto', alignItems: 'center' }}>
        <p className="kicker">Weekly check-up</p>
        <h1 className="display" style={{ fontSize: 40 }}>Four rolls judge your whole week</h1>
        <div className="dice"><Die n={6} /><Die n={6} /></div>
        <button type="button" className="btn primary" disabled={busy} onClick={onRoll}>Roll my check-up</button>
      </div>
    );
  }
  return (
    <div className="card stack">
      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <div><p className="kicker">Weekly check-up</p><h1 className="display" style={{ fontSize: 36 }}>How your week went</h1></div>
        {checkup.rolls.length > 0 && <div className="dice" style={{ gap: 12 }}><Die size={64} n={rolling ? faces[0] : checkup.rolls[0].d1} rolling={rolling} /><Die size={64} n={rolling ? faces[1] : checkup.rolls[0].d2} rolling={rolling} /></div>}
      </div>
      {checkup.firstWeek && <p className="panel" style={{ background: 'var(--sun-soft)' }}>This was your first week, so there are no check-up rolls yet. Your first real check-up is next Sunday.</p>}
      {checkup.rolls.map((r) => <CheckupRow key={r.stat} r={r} rolling={rolling} />)}
      {!rolling && (
        <>
          <div className="row wrap" style={{ gap: 10 }}>
            <span className="chip"><Koin size={22} />Bank interest: +{fmt(checkup.interest)}</span>
            <span className="chip">This week: {fmt(checkup.summary.earned)} of {fmt(checkup.summary.cap)} koins</span>
          </div>
          <button type="button" className="btn primary" style={{ alignSelf: 'flex-end' }} disabled={busy} onClick={onFinish}>{finishLabel}</button>
        </>
      )}
    </div>
  );
}

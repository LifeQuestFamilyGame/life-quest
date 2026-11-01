import { useState } from 'preact/hooks';
import * as E from '../../engine/engine.js';
import * as D from '../../engine/dates.js';
import { Hero, Pet, StatIcon, Tick, Svg } from '../../ui/components.jsx';
import { petSvg } from '../../ui/art.js';

function metaFor(it, p) {
  const h = it.h;
  const bits = [];
  if (h.sub && h.id !== 'feedBix') bits.push(h.sub);
  if (it.prog) bits.push(`${it.prog.done} of ${it.prog.target} this week`);
  if (h.freq.type === 'days') bits.push(D.dayName(D.today()));
  bits.push(`+${h.xp} XP`);
  if (h.kind === 'approved' && h.coins && p.role === 'kid') bits.push(`+${h.coins} koins`);
  if (h.coins && p.role === 'parent') bits.push(`+${h.coins} koins`);
  return bits.join(' · ');
}

function HabitRow({ it, answer, onAnswer, player }) {
  const { h, entry } = it;
  const fixed = entry?.status;
  const weekly = !!it.prog;
  const missLabel = weekly && !it.prog.mustToday ? 'Not today' : 'Missed';
  const missValue = weekly && !it.prog.mustToday ? 'skip' : 'missed';
  const name = h.id === 'feedBix' ? 'Feed Bix (your turn)' : h.name;
  return (
    <div className={`habit${answer || fixed ? ' answered' : ''}`}>
      <StatIcon stat={h.stat} />
      <div className="grow">
        <p className="title">{name}</p>
        <p className="meta">{metaFor(it, player)}</p>
        {weekly && it.prog.mustToday && !fixed && <p className="pill tag-no" style={{ marginTop: 4 }}>Last chance this week</p>}
      </div>
      {fixed ? (
        <span className="row" style={{ gap: 6, fontWeight: 700, fontSize: 14, color: fixed === 'done' ? 'var(--leaf-dark)' : 'var(--muted)', flex: 'none' }}>
          {fixed === 'done' ? <><span className="iconbtn good" style={{ width: 26, height: 26, borderRadius: 999 }}><Tick size={16} /></span>{entry.loggedBy ? `Logged by ${entry.loggedBy}` : 'Done'}</> : fixed === 'excused' ? 'Excused' : fixed}
        </span>
      ) : (
        <div className="seg" role="group" aria-label={name}>
          <button type="button" className="done" aria-pressed={answer === 'done'} onClick={() => onAnswer(h.id, 'done')}>Done</button>
          <button type="button" className={missValue === 'skip' ? 'skip' : 'miss'} aria-pressed={answer === missValue} onClick={() => onAnswer(h.id, missValue)}>{missLabel}</button>
        </div>
      )}
    </div>
  );
}

export function CheckIn({ player, date, weekDocs, prevDoc, onSubmit, busy, compact }) {
  const [answers, setAnswers] = useState({});
  const todayItems = E.dueToday(player, date, weekDocs);
  const nightItems = E.dueLastNight(player, date, prevDoc);
  const all = [...todayItems, ...nightItems];
  const open = all.filter((it) => !it.entry?.status);
  const unanswered = open.filter((it) => !answers[it.h.id]);
  const set = (id, v) => setAnswers((a) => ({ ...a, [id]: v }));
  const missedNames = open.filter((it) => answers[it.h.id] === 'missed' || (answers[it.h.id] === 'skip' && it.prog?.mustToday)).map((it) => it.h.short || it.h.name);
  const kid = player.role === 'kid';
  const turn = E.bixTurn(date);

  return (
    <div className={compact ? 'stack' : 'split side-left'}>
      {!compact && <aside className="card tight stack" style={{ alignSelf: 'start' }}>
        <div className="stack" style={{ background: player.tint, borderRadius: 18, padding: '16px 12px 8px', alignItems: 'center' }}>
          <p className="display" style={{ background: '#fff', border: '3px solid var(--ink)', borderRadius: 18, padding: '12px 16px', fontSize: 22, lineHeight: 1.15, textAlign: 'center' }}>
            {kid ? "It's check-in time! What did you get done?" : 'Your own habits today'}
          </p>
          <div style={{ position: 'relative' }}>
            <Hero player={player} size={190} />
            {player.pet && <span style={{ position: 'absolute', right: -40, bottom: 0 }}><Pet type={player.pet.type} size={86} /></span>}
          </div>
        </div>
        {kid && (
          <div className="row panel" style={{ background: '#FFF3D6' }}>
            <Svg html={petSvg('puppy')} style={{ width: '54px', height: '43px' }} />
            <div><p style={{ fontWeight: 700 }}>Bix roster</p><p className="muted" style={{ fontSize: 15 }}>Tonight it's {turn === player.id ? 'your' : `${turn === 'kaelen' ? 'Kaelen' : 'Xavier'}'s`} turn</p></div>
          </div>
        )}
      </aside>}

      <section className="card stack">
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="display" style={{ fontSize: 36, lineHeight: 1 }}>{D.dayName(date)} check-in</h1>
          <p className="muted">{kid ? 'Tick what you really did. An honest miss still earns 5 XP and never breaks your streak.' : 'Tick what you did today. Your koins are for fun: outfits and home upgrades.'}</p>
        </div>
        <div className="cols2">
          <div className="stack" style={{ gap: 8 }}>
            <h2 className="kicker">Today</h2>
            {todayItems.length ? todayItems.map((it) => <HabitRow key={it.h.id} it={it} answer={answers[it.h.id]} onAnswer={set} player={player} />) : <p className="muted">Nothing due today.</p>}
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <h2 className="kicker">Last night</h2>
            {nightItems.length ? nightItems.map((it) => <HabitRow key={it.h.id} it={it} answer={answers[it.h.id]} onAnswer={set} player={player} />) : <p className="muted">Nothing to tick from last night.</p>}
          </div>
        </div>
        <div className="row wrap" style={{ justifyContent: 'space-between', borderTop: '2px dashed var(--line)', paddingTop: 16 }}>
          <p className="muted" style={{ maxWidth: 480 }}>
            {unanswered.length ? `${unanswered.length} still to answer.` : kid ? (missedNames.length ? `${missedNames[0]} was missed, so today's Habit Roll comes from that area.` : 'Everything done: +1 on today\'s Habit Roll.') : 'All set.'}
            {kid && <><br />Koins for jobs land when Mum or Dad approves.</>}
          </p>
          <button type="button" className="btn primary" disabled={unanswered.length > 0 || busy} onClick={() => onSubmit(answers)}>
            {kid ? (all.length ? 'Roll for today' : 'Continue') : 'Save my day'}
          </button>
        </div>
      </section>
    </div>
  );
}

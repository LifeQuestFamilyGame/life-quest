import { useState } from 'preact/hooks';
import { CARD_BY_ID, optionLocked } from '../../engine/engine.js';
import { Hero, Pet, Koin, StatIcon, Sprout, Shield } from '../../ui/components.jsx';
import { STAT_NAMES } from '../../content/habits.js';
import * as D from '../../engine/dates.js';

function OptionChips({ opt, card }) {
  const chips = [];
  if (opt.tone === 'tempting') {
    if (opt.now?.coins) chips.push(<span className="chip"><Koin size={22} />Now: +{opt.now.coins} koins</span>);
    if (opt.now?.text) chips.push(<span className="chip">Now: {opt.now.text}</span>);
    if (card.kind !== 'door' && card.kind !== 'real') chips.push(<span className="chip"><Shield cracks={1} fill="#C9B8FF" />Cracks your {STAT_NAMES[card.area]} shield</span>);
  } else {
    const l = opt.later || {};
    if (opt.now?.xp) chips.push(<span className="chip">Now: +{opt.now.xp} XP</span>);
    if (opt.now?.text) chips.push(<span className="chip">Now: {opt.now.text}</span>);
    if (l.coins) chips.push(<span className="chip"><Koin size={22} />Sunday: +{l.coins} koins</span>);
    if (l.xp) chips.push(<span className="chip">+{l.xp} XP</span>);
    for (const [s, v] of Object.entries(l.stats || {})) chips.push(<span className="chip"><StatIcon stat={s} size={22} />+{v} {STAT_NAMES[s]}</span>);
    if (l.seed) chips.push(<span className="chip"><Sprout />Seed: {l.seed}</span>);
    if (l.text) chips.push(<span className="chip">{l.text}</span>);
  }
  return <span className="row wrap" style={{ gap: 8 }}>{chips.map((c, i) => <span key={i}>{c}</span>)}</span>;
}

export function Choice({ player, cardRef, onChoose, busy, date }) {
  const [picked, setPicked] = useState(null);
  const card = CARD_BY_ID[cardRef.cardId];
  const kindLabel = card.kind === 'temptation' ? 'Temptation' : card.kind === 'door' ? `A door: needs ${STAT_NAMES[card.needs.stat]} ${card.needs.value}` : card.kind === 'real' ? 'Real Choice from Mum and Dad' : `${STAT_NAMES[card.area]} choice`;
  return (
    <div className="split side-wide">
      <aside className="card stack" style={{ background: player.tint, alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="display center" style={{ background: '#fff', border: '3px solid var(--ink)', borderRadius: 22, padding: '14px 18px', fontSize: 24, lineHeight: 1.2 }}>Hmm… what should I do?</p>
        <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 0 }}>
          <Hero player={player} size={200} />
          {player.pet && <Pet type={player.pet.type} size={90} />}
        </div>
        <span className="chip" style={{ fontSize: 16 }}><StatIcon stat={card.area} size={24} />{kindLabel}</span>
      </aside>
      <section className="card stack">
        <div className="stack" style={{ gap: 8 }}>
          <p className="kicker">{D.dayName(date)}'s choice · Chapter 1: Primary school</p>
          <h1 className="display" style={{ fontSize: 44, lineHeight: 1 }}>{card.title}</h1>
          <p style={{ fontSize: 21 }}>{card.scene}</p>
          {cardRef.bonusXp > 0 && <p className="pill tag-wait" style={{ alignSelf: 'flex-start', fontSize: 15 }}>This card came back: +{cardRef.bonusXp} XP bonus if you say yes</p>}
        </div>
        {card.options.map((opt) => {
          const locked = optionLocked(player, card, opt);
          return (
            <button key={opt.key} type="button" className={`option ${opt.key}`} disabled={locked || busy}
              aria-pressed={picked === opt.key} onClick={() => setPicked(opt.key)}
              style={picked === opt.key ? { outline: '5px solid var(--focus)', outlineOffset: 3 } : undefined}>
              <span className="badge-letter">{opt.key === 'M' ? '½' : opt.key}</span>
              <span className="stack" style={{ gap: 10 }}>
                <span className="text">{opt.text}</span>
                {locked ? <span className="chip">Needs {STAT_NAMES[card.needs.stat]} {card.needs.value} · you have {player.stats[card.needs.stat]}</span> : <OptionChips opt={opt} card={card} />}
              </span>
            </button>
          );
        })}
        <div className="row wrap" style={{ justifyContent: 'space-between', marginTop: 'auto' }}>
          <p className="muted">Next you roll two dice to see how it turns out. A good choice adds +1.</p>
          <button type="button" className="btn primary" disabled={!picked || busy} onClick={() => onChoose(picked)}>{picked ? 'Lock it in and roll' : 'Pick one'}</button>
        </div>
      </section>
    </div>
  );
}

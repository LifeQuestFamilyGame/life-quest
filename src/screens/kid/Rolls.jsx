import { useEffect, useState } from 'preact/hooks';
import { Die, Koin, StatIcon, Sprout, Hero, Shield, fmt } from '../../ui/components.jsx';
import { BAND_NAMES, BAND_ORDER } from '../../engine/rules.js';
import { STAT_NAMES } from '../../content/habits.js';
import { CARD_BY_ID } from '../../engine/engine.js';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Shows two tumbling dice, then the real result.
export function useDiceReveal(key, ms = 1300) {
  const [rolling, setRolling] = useState(true);
  const [faces, setFaces] = useState([1, 1]);
  useEffect(() => {
    setRolling(true);
    if (reduced()) { setRolling(false); return; }
    const spin = setInterval(() => setFaces([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]), 90);
    const stop = setTimeout(() => { clearInterval(spin); setRolling(false); }, ms);
    return () => { clearInterval(spin); clearTimeout(stop); };
  }, [key]);
  return { rolling, faces };
}

export function RollMath({ roll }) {
  return (
    <div className="row wrap" style={{ justifyContent: 'center', gap: 10 }}>
      <span className="display" style={{ fontSize: 30 }}>{roll.d1} + {roll.d2}</span>
      {roll.mods.map((m, i) => (
        <span key={i} className="chip" style={{ background: m.value > 0 ? 'var(--good-soft)' : m.value < 0 ? 'var(--red-soft)' : 'var(--grey-soft)' }}>
          {m.value > 0 ? `+${m.value} ` : m.value < 0 ? `${m.value} ` : ''}{m.label}{m.value === 0 ? ': no change' : ''}
        </span>
      ))}
      <span className="display" style={{ fontSize: 30 }}>=</span>
      <span className="display" style={{ width: 58, height: 58, borderRadius: 999, background: 'var(--sun)', border: '3px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{roll.total}</span>
    </div>
  );
}

export function Scale({ roll, floor }) {
  const ranges = { disaster: '2 or less', setback: '3 to 5', normal: '6 to 8', good: '9 to 11', lucky: '12 or more' };
  const floorIdx = floor ? BAND_ORDER.indexOf(floor) : 0;
  return (
    <div className="scale" aria-label={`Result: ${BAND_NAMES[roll.band]}`}>
      {BAND_ORDER.map((b, i) => (
        <div key={b} className={`b-${b}${roll.band === b ? ' hit' : ''}${i < floorIdx ? ' off' : ''}`}>
          {roll.band === b && <span className="marker">{roll.total}</span>}
          <p style={{ fontWeight: 700, fontSize: 15 }}>{BAND_NAMES[b]}</p>
          <p style={{ fontSize: 13 }}>{ranges[b]}</p>
        </div>
      ))}
    </div>
  );
}

const bandColour = { lucky: '#FFF1C2', good: 'var(--leaf-soft)', normal: 'var(--paper)', setback: '#FFE8D1', disaster: 'var(--red-soft)' };

export function HabitRollResult({ player, roll, onNext, nextLabel }) {
  const { rolling, faces } = useDiceReveal(roll ? `${roll.d1}${roll.d2}${roll.total}` : 'none');
  if (!roll) {
    return (
      <div className="card stack center" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 className="display" style={{ fontSize: 36 }}>Check-in saved</h1>
        <button type="button" className="btn primary" onClick={onNext}>{nextLabel}</button>
      </div>
    );
  }
  return (
    <div className="split halves">
      <section className="card stack">
        <div><p className="kicker">One roll covers today</p><h1 className="display" style={{ fontSize: 40 }}>Habit Roll</h1></div>
        <div className="dice">
          <Die n={rolling ? faces[0] : roll.d1} rolling={rolling} />
          <Die n={rolling ? faces[1] : roll.d2} rolling={rolling} />
        </div>
        {!rolling && <RollMath roll={roll} />}
        {!rolling && <Scale roll={roll} floor={roll.safetyNet ? 'setback' : null} />}
        {!rolling && roll.safetyNet && <p className="row muted" style={{ fontSize: 15, gap: 8 }}><Shield size={20} />You did everything, so the worst you can get is plain bad luck that costs nothing.</p>}
      </section>
      <section className="card stack" style={{ background: rolling ? 'var(--paper)' : bandColour[roll.band] }}>
        {rolling ? <p className="display" style={{ fontSize: 30 }}>Rolling…</p> : (
          <>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div className="grow stack" style={{ gap: 10 }}>
                <span className="pill" style={{ alignSelf: 'flex-start', background: 'var(--ink)', color: '#fff', fontSize: 15, padding: '4px 14px' }}>{roll.note ? 'Bad luck' : `${BAND_NAMES[roll.band]} · ${roll.habitName}`}</span>
                <h2 className="display" style={{ fontSize: 32, lineHeight: 1.1 }}>{roll.text}</h2>
                {roll.note && <p className="muted">{roll.note}</p>}
              </div>
              <Hero player={player} size={120} />
            </div>
            <div className="row wrap" style={{ gap: 10 }}>
              {roll.xp > 0 && <span className="chip">+{roll.xp} XP</span>}
              {roll.coins > 0 && <span className="chip"><Koin size={22} />+{roll.coins} koins</span>}
              {roll.statDelta < 0 && <span className="chip" style={{ background: 'var(--red-soft)' }}><StatIcon stat={roll.stat} size={22} />{roll.statDelta} {STAT_NAMES[roll.stat]}</span>}
              {roll.bill > 0 && <span className="chip" style={{ background: 'var(--red-soft)' }}><Koin size={22} />−{roll.bill} koins</span>}
            </div>
            <button type="button" className="btn primary" style={{ marginTop: 'auto' }} onClick={onNext}>{nextLabel}</button>
          </>
        )}
      </section>
    </div>
  );
}

export function LifeRollResult({ player, result, onCollect, busy }) {
  const roll = result.roll;
  const { rolling, faces } = useDiceReveal(`${roll.d1}${roll.d2}${roll.total}${result.cardId}`);
  const card = CARD_BY_ID[result.cardId];
  const opt = card.options.find((o) => o.key === result.key);
  const floor = result.tone === 'right' ? (card.kind === 'door' ? 'normal' : 'setback') : result.tone === 'middle' ? 'setback' : null;
  const tone = result.tone === 'tempting' ? (result.cost || result.statLoss ? 'disaster' : 'normal') : roll.band;
  return (
    <div className="split halves">
      <section className="card stack">
        <div>
          <p className="kicker">You chose {result.key === 'M' ? 'the middle' : result.key}: {opt.text}</p>
          <h1 className="display" style={{ fontSize: 40 }}>Life Roll</h1>
        </div>
        <div className="dice">
          <Die n={rolling ? faces[0] : roll.d1} rolling={rolling} />
          <Die n={rolling ? faces[1] : roll.d2} rolling={rolling} />
        </div>
        {!rolling && <RollMath roll={roll} />}
        {!rolling && <Scale roll={roll} floor={floor} />}
        {!rolling && floor === 'setback' && result.tone === 'right' && <p className="row muted" style={{ fontSize: 15, gap: 8 }}><Shield size={20} />Safety net: after a good choice, the worst you can get is a Setback.</p>}
      </section>
      <section className="card stack" style={{ background: rolling ? 'var(--paper)' : bandColour[tone] }}>
        {rolling ? <p className="display" style={{ fontSize: 30 }}>Rolling…</p> : (
          <>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div className="grow stack" style={{ gap: 10 }}>
                <span className="pill" style={{ alignSelf: 'flex-start', background: 'var(--ink)', color: '#fff', fontSize: 15, padding: '4px 14px' }}>{result.gotAway ? 'Got away with it' : BAND_NAMES[roll.band]}</span>
                <h2 className="display" style={{ fontSize: 32, lineHeight: 1.1 }}>{result.text}</h2>
                {result.note && <p className="muted">{result.note}</p>}
              </div>
              <Hero player={player} size={120} />
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <h3 className="kicker">{result.tone === 'tempting' ? 'What happened' : 'You earned'}</h3>
              <div className="row wrap" style={{ gap: 10 }}>
                {result.coinsNow > 0 && <span className="chip"><Koin size={22} />+{result.coinsNow} koins now</span>}
                {result.coinsSunday > 0 && <span className="chip"><Koin size={22} />+{result.coinsSunday} koins on Sunday</span>}
                {result.xp > 0 && <span className="chip">+{fmt(result.xp)} XP</span>}
                {Object.entries(result.stats || {}).filter(([, v]) => v > 0).map(([s, v]) => <span key={s} className="chip"><StatIcon stat={s} size={22} />+{v} {STAT_NAMES[s]}</span>)}
                {result.seed && <span className="chip"><Sprout />Seed: {result.seed.text}</span>}
                {result.badge && <span className="chip" style={{ background: 'var(--sun-pale)' }}>Badge: {result.badge}</span>}
                {result.riskAdded && <span className="chip" style={{ background: 'var(--red-soft)' }}><Shield cracks={1} fill="#C9B8FF" />Your {STAT_NAMES[result.area]} shield cracked</span>}
                {result.statLoss < 0 && <span className="chip" style={{ background: 'var(--red-soft)' }}><StatIcon stat={result.area} size={22} />{result.statLoss} {STAT_NAMES[result.area]}</span>}
                {result.cost > 0 && <span className="chip" style={{ background: 'var(--red-soft)' }}><Koin size={22} />−{result.cost} koins</span>}
                {result.tone === 'tempting' && result.coinsNow === 0 && !result.cost && !result.riskAdded && <span className="chip">Nothing gained, nothing lost</span>}
              </div>
              {(result.events || []).map((e, i) => <p key={i} className="panel" style={{ background: 'var(--sun-soft)' }}>{e.type === 'comeback' ? `Comeback complete! +${e.xp} XP and the Comeback Kid badge.` : e.type === 'comebackStart' ? `Comeback Quest: make 5 good ${STAT_NAMES[e.area]} choices to bounce back.` : e.text}</p>)}
            </div>
            {result.why && (
              <div className="panel" style={{ borderStyle: 'dashed' }}>
                <p className="kicker">Why it matters</p>
                <p style={{ fontSize: 18 }}>{result.why}</p>
              </div>
            )}
            <button type="button" className="btn primary" style={{ marginTop: 'auto' }} disabled={busy} onClick={onCollect}>Collect and finish today</button>
          </>
        )}
      </section>
    </div>
  );
}

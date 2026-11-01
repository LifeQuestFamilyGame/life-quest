import { useState } from 'preact/hooks';
import { REAL_REWARDS, GAME_ITEMS, GAME_ITEM_BY_ID } from '../../content/shop.js';
import { Koin, RoomItem, Hero, Svg, Pet, fmt } from '../../ui/components.jsx';
import { pixelHeroSvg } from '../../ui/art.js';

const REWARD_ICONS = {
  tv: <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="10" width="36" height="24" rx="4" fill="#7FB8FF" stroke="#1D2A4D" stroke-width="3" /><path d="M18 41h12M24 34v7" stroke="#1D2A4D" stroke-width="3" stroke-linecap="round" /><path d="M19 3l5 7 5-7" stroke="#1D2A4D" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>,
  moon: <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d="M30 6a17 17 0 1 0 12 28A14 14 0 0 1 30 6z" fill="#FFE38A" stroke="#1D2A4D" stroke-width="3" stroke-linejoin="round" /><circle cx="39" cy="12" r="2.2" fill="#1D2A4D" /></svg>,
  popcorn: <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 18h24l-3 25H15z" fill="#FF6B6B" stroke="#1D2A4D" stroke-width="3" stroke-linejoin="round" /><path d="M20.5 19l1 23M27.5 19l-1 23" stroke="#fff" stroke-width="3" /><circle cx="16" cy="15" r="5" fill="#FFF7E0" stroke="#1D2A4D" stroke-width="2.5" /><circle cx="24" cy="12" r="6" fill="#FFF7E0" stroke="#1D2A4D" stroke-width="2.5" /><circle cx="32" cy="15" r="5" fill="#FFF7E0" stroke="#1D2A4D" stroke-width="2.5" /></svg>,
  cash: <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="13" width="40" height="22" rx="4" fill="#9BE3B5" stroke="#1D2A4D" stroke-width="3" /><circle cx="24" cy="24" r="7" fill="#fff" stroke="#1D2A4D" stroke-width="2.5" /><text x="24" y="28.5" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="13" fill="#1D2A4D">5</text></svg>,
  brick: <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="18" width="36" height="20" rx="3" fill="#E5484D" stroke="#1D2A4D" stroke-width="3" /><rect x="11" y="11" width="9" height="8" rx="2" fill="#E5484D" stroke="#1D2A4D" stroke-width="3" /><rect x="28" y="11" width="9" height="8" rx="2" fill="#E5484D" stroke="#1D2A4D" stroke-width="3" /></svg>,
  ticket: <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d="M6 14h36v7a4 4 0 0 0 0 8v7H6v-7a4 4 0 0 0 0-8z" fill="#FFC93C" stroke="#1D2A4D" stroke-width="3" stroke-linejoin="round" /><path d="M30 16v18" stroke="#1D2A4D" stroke-width="2.5" stroke-dasharray="3 3" /></svg>,
  controller: <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d="M10 16h28a7 7 0 0 1 6.6 9.3l-2.7 8A5 5 0 0 1 33 34l-4-4H19l-4 4a5 5 0 0 1-8.9-0.7l-2.7-8A7 7 0 0 1 10 16z" fill="#9B7BFF" stroke="#1D2A4D" stroke-width="3" stroke-linejoin="round" /><path d="M14 21v8M10 25h8" stroke="#1D2A4D" stroke-width="3" stroke-linecap="round" /><circle cx="32" cy="23" r="2.3" fill="#1D2A4D" /><circle cx="36" cy="27" r="2.3" fill="#1D2A4D" /></svg>
};

function ItemArt({ item, player }) {
  if (item.type === 'room') return <RoomItem id={item.id} size={80} />;
  if (item.id === 'pixel') return <Svg html={pixelHeroSvg(player.hero, 'Pixel Quest outfit')} style={{ width: '80px', height: '64px', background: '#6EA8FF', borderRadius: '14px' }} />;
  return <span style={{ width: 80, height: 64, borderRadius: 14, background: player.tint, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}><Hero player={{ ...player, style: 'cartoon', hero: { ...player.hero, extra: item.extra } }} size={70} label={item.name} /></span>;
}

export function Shop({ player, requests, onRequest, onBuy, onBack, busy, parentMode }) {
  const [confirm, setConfirm] = useState(null);
  const myReqs = (requests || []).filter((r) => r.playerId === player.id && r.status !== 'delivered' && r.status !== 'declined');
  const goal = REAL_REWARDS.filter((r) => r.price > player.wallet).sort((a, b) => a.price - b.price)[0];
  const debt = player.wallet < 0;
  return (
    <div className={parentMode ? 'stack' : 'split side-right'}>
      {!parentMode && (
        <section className="card stack">
          <div className="row wrap" style={{ justifyContent: 'space-between' }}>
            <div><h1 className="display" style={{ fontSize: 40 }}>Real rewards</h1><p className="muted">Set by Mum and Dad. 100 Smiley Koins = $1.</p></div>
            <button type="button" className="btn small" onClick={onBack}>Back</button>
          </div>
          {debt && <p className="panel" style={{ background: 'var(--red-soft)' }}>You owe {fmt(-player.wallet)} koins. The shop opens again once it's paid back.</p>}
          {goal && !debt && (
            <div className="row panel" style={{ background: 'var(--blue-soft)' }}>
              {REWARD_ICONS[goal.icon]}
              <div className="grow stack" style={{ gap: 6 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}><span><strong>Next goal:</strong> {goal.name}</span><strong>{fmt(player.wallet)} / {fmt(goal.price)}</strong></div>
                <div className="bar blue"><div style={{ width: `${Math.max(0, Math.min(100, (player.wallet / goal.price) * 100))}%` }} /></div>
                <span style={{ fontSize: 14, color: 'var(--muted-2)' }}>{fmt(goal.price - player.wallet)} to go.</span>
              </div>
            </div>
          )}
          {myReqs.length > 0 && myReqs.map((r) => <p key={r.id} className="panel" style={{ background: 'var(--sun-soft)' }}>{r.status === 'requested' ? `Waiting for Mum or Dad: ${r.name}` : `Approved! ${r.name} is on its way.`}</p>)}
          <div className="tiles">
            {REAL_REWARDS.map((r) => {
              const can = player.wallet >= r.price && !debt;
              return (
                <button key={r.id} type="button" className="panel stack" disabled={!can || busy} onClick={() => setConfirm({ type: 'reward', item: r })}
                  style={{ textAlign: 'left', gap: 6, border: '3px solid var(--ink)', borderRadius: 18, background: can ? '#fff' : '#F4F6FA', boxShadow: can ? '4px 4px 0 var(--ink)' : 'none', minHeight: 170, color: 'var(--ink)' }}>
                  {REWARD_ICONS[r.icon]}
                  <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.25 }}>{r.name}</span>
                  <span className="display" style={{ fontSize: 21 }}>{fmt(r.price)}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: can ? 'var(--leaf-dark)' : 'var(--muted)' }}>{can ? 'Ask Mum or Dad' : debt ? 'Shop closed' : `${fmt(r.price - player.wallet)} more to go`}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      <aside className="card stack">
        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
          <div><h2 className="display" style={{ fontSize: 30 }}>For my room and hero</h2><p className="muted">Game items are yours straight away.</p></div>
          {parentMode && <button type="button" className="btn small" onClick={onBack}>Back</button>}
        </div>
        {GAME_ITEMS.map((it) => {
          const owned = player.inventory.includes(it.id);
          const wish = (player.wishlist || []).includes(it.id);
          return (
            <div key={it.id} className="row panel">
              <ItemArt item={it} player={player} />
              <div className="grow">
                <p style={{ fontWeight: 700 }}>{it.name}{wish && !owned ? ' ★' : ''}</p>
                {it.desc && <p className="muted" style={{ fontSize: 14 }}>{it.desc}</p>}
                <p className="display" style={{ fontSize: 19 }}>{owned ? 'Yours' : fmt(it.price)}</p>
              </div>
              {!owned && <button type="button" className="btn primary small" disabled={busy || debt || player.wallet < it.price} onClick={() => setConfirm({ type: 'item', item: it })}>Buy</button>}
            </div>
          );
        })}
        <p className="muted" style={{ borderTop: '2px dashed var(--line)', paddingTop: 12 }}>Every koin can only be spent once. Something now, or something bigger later?</p>
      </aside>
      {confirm && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Confirm">
          <div className="card stack">
            <h2 className="display" style={{ fontSize: 28 }}>{confirm.type === 'reward' ? `Ask for: ${confirm.item.name}?` : `Buy ${confirm.item.name}?`}</h2>
            <p>It costs <strong>{fmt(confirm.item.price)}</strong> koins. You'd have <strong>{fmt(player.wallet - confirm.item.price)}</strong> left.</p>
            {confirm.type === 'reward' && <p className="muted">Mum or Dad will approve it. If they say not yet, you get your koins back.</p>}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn small" onClick={() => setConfirm(null)}>Not now</button>
              <button type="button" className="btn primary small" disabled={busy} onClick={async () => { const c = confirm; setConfirm(null); if (c.type === 'reward') await onRequest(c.item.id); else await onBuy(c.item.id); }}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Bank({ player, onMove, onBack, busy }) {
  const [amount, setAmount] = useState('');
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  const year = Math.round(Math.min(player.bank, 5000) * (Math.pow(1.02, 52) - 1) + player.bank);
  return (
    <div className="card stack" style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <h1 className="display" style={{ fontSize: 40 }}>My bank</h1>
        <button type="button" className="btn small" onClick={onBack}>Back</button>
      </div>
      <div className="cols2">
        <div className="panel stack" style={{ background: 'var(--sun-soft)', gap: 4 }}><p className="kicker">Wallet</p><p className="display row" style={{ fontSize: 34 }}><Koin size={34} />{fmt(player.wallet)}</p></div>
        <div className="panel stack" style={{ background: 'var(--leaf-soft)', gap: 4 }}><p className="kicker">Bank</p><p className="display row" style={{ fontSize: 34 }}><Koin size={34} />{fmt(player.bank)}</p><p className="muted" style={{ fontSize: 14 }}>Grows 2% every Sunday</p></div>
      </div>
      <p className="panel">Leave {fmt(player.bank)} in the bank for a year and it grows to about <strong>{fmt(year)}</strong> koins, without you doing anything.</p>
      <label className="field">How many koins?<input type="number" inputMode="numeric" min="0" value={amount} onInput={(e) => setAmount(e.currentTarget.value)} /></label>
      <div className="cols2">
        <button type="button" className="btn primary" disabled={busy || !n || n > player.wallet} onClick={async () => { await onMove(n, 'in'); setAmount(''); }}>Put in the bank</button>
        <button type="button" className="btn" disabled={busy || !n || n > player.bank} onClick={async () => { await onMove(n, 'out'); setAmount(''); }}>Take out</button>
      </div>
      <p className="muted" style={{ fontSize: 14 }}>Banking a quarter of the week's new koins gives your Sunday Money roll +1.</p>
    </div>
  );
}

export function Room({ player, onEquip, onBack, busy }) {
  const roomItems = player.inventory.filter((id) => GAME_ITEM_BY_ID[id]?.type === 'room');
  const extras = player.inventory.filter((id) => GAME_ITEM_BY_ID[id]?.extra);
  return (
    <div className="split side-left">
      <section className="card stack" style={{ alignItems: 'center', background: player.tint }}>
        <Hero player={player} size={220} />
        {player.pet && <div className="row"><Pet type={player.pet.type} size={90} /><p className="display" style={{ fontSize: 24 }}>{player.pet.name}</p></div>}
      </section>
      <section className="card stack">
        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
          <h1 className="display" style={{ fontSize: 40 }}>My room</h1>
          <button type="button" className="btn small" onClick={onBack}>Back</button>
        </div>
        {roomItems.length ? <div className="row wrap" style={{ gap: 14 }}>{roomItems.map((id) => <div key={id} className="stack center" style={{ gap: 4 }}><RoomItem id={id} size={130} /><span style={{ fontWeight: 700 }}>{GAME_ITEM_BY_ID[id].name}</span></div>)}</div>
          : <p className="muted">Your room is empty for now. Save up koins in the shop to fill it.</p>}
        <h2 className="kicker">My hero's look</h2>
        <div className="row wrap">
          <button type="button" className="btn small" aria-pressed={player.style !== 'pixel'} disabled={busy} onClick={() => onEquip({ style: 'cartoon' })}>Cartoon</button>
          {player.inventory.includes('pixel') && <button type="button" className="btn small" aria-pressed={player.style === 'pixel'} disabled={busy} onClick={() => onEquip({ style: 'pixel' })}>Pixel Quest</button>}
          <button type="button" className="btn small" disabled={busy} onClick={() => onEquip({ extra: 'none' })}>No extra</button>
          {[...new Set([...(player.hero.extra && player.hero.extra !== 'none' ? [player.hero.extra] : []), ...extras.map((id) => GAME_ITEM_BY_ID[id].extra)])].map((x) => (
            <button key={x} type="button" className="btn small" aria-pressed={player.hero.extra === x} disabled={busy} onClick={() => onEquip({ extra: x })}>{x[0].toUpperCase() + x.slice(1)}</button>
          ))}
        </div>
        <h2 className="kicker">Badges</h2>
        {player.badges.length ? <div className="row wrap">{player.badges.map((b) => <span key={b} className="chip" style={{ background: 'var(--sun-pale)' }}>{b}</span>)}</div> : <p className="muted">No badges yet. Streaks, belts and doors earn them.</p>}
        <h2 className="kicker">Food Passport</h2>
        {player.food?.passport?.length ? <div className="row wrap">{player.food.passport.map((f, i) => <span key={i} className="chip">{f.food}: {f.rating}{f.healthy ? ' · healthy' : ''}</span>)}</div> : <p className="muted">Try a new food to get your first sticker.</p>}
      </section>
    </div>
  );
}

export function FoodAdventure({ player, onSubmit, onBack, busy, used }) {
  const [food, setFood] = useState('');
  const [rating, setRating] = useState('');
  return (
    <div className="card stack" style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <div><p className="kicker">Weekly bonus</p><h1 className="display" style={{ fontSize: 40 }}>Food Adventure</h1></div>
        <button type="button" className="btn small" onClick={onBack}>Back</button>
      </div>
      {used ? <p className="panel" style={{ background: 'var(--leaf-soft)' }}>You've done this week's Food Adventure. A new one opens on Monday.</p> : (
        <>
          <p>Try one new food this week, even a single bite. It's worth <strong>50 XP and 50 koins</strong>, or <strong>double</strong> if it's healthy. Skipping it costs nothing.</p>
          <label className="field">What did you try?<input type="text" maxLength={40} value={food} onInput={(e) => setFood(e.currentTarget.value)} placeholder="Like salmon, or a kiwi fruit" /></label>
          <div className="stack" style={{ gap: 8 }}>
            <p style={{ fontWeight: 700 }}>What did you think?</p>
            <div className="row wrap">{['Yuck', 'Okay', 'Yum'].map((r) => <button key={r} type="button" className="btn small" aria-pressed={rating === r} style={rating === r ? { background: 'var(--sun)' } : undefined} onClick={() => setRating(r)}>{r}</button>)}</div>
          </div>
          <button type="button" className="btn primary" disabled={busy || !food.trim() || !rating} onClick={() => onSubmit(food.trim(), rating)}>Send to Mum or Dad</button>
        </>
      )}
    </div>
  );
}

import { useEffect, useState, useMemo } from 'preact/hooks';
import { heroSvg, petSvg, roomSvg, dieSvg } from './art.js';
import { levelInfo } from '../engine/rules.js';
import { STAT_NAMES } from '../content/habits.js';

// Our own SVG strings (built from fixed colour tables, never from typed text).
export function Svg({ html, className, style, label }) {
  return <span className={className} style={{ display: 'inline-block', lineHeight: 0, ...style }} aria-label={label} role={label ? 'img' : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Hero({ player, size = 200, label }) {
  const html = useMemo(() => heroSvg(player.hero, { style: player.style, label: label || `${player.heroName}` }), [player.hero, player.style, player.heroName, label]);
  return <Svg html={html} style={{ width: `${size}px`, height: `${Math.round(size * 1.25)}px` }} />;
}

export function HeroHead({ player, small }) {
  const s = small ? 40 : 60;
  return (
    <div className={`head${small ? ' sm' : ''}`} style={{ background: player.tint }} aria-hidden="true">
      <Hero player={player} size={Math.round(s * 1.28)} label="" />
    </div>
  );
}

export const Pet = ({ type, size = 96 }) => <Svg html={petSvg(type)} style={{ width: `${size}px`, height: `${Math.round(size * 0.8)}px` }} />;
export const RoomItem = ({ id, size = 96 }) => <Svg html={roomSvg(id)} style={{ width: `${size}px`, height: `${Math.round(size * 0.8)}px` }} />;
export const Die = ({ n, rolling, size }) => <Svg className={`die${rolling ? ' rolling' : ''}`} html={dieSvg(n)} style={size ? { width: `${size}px`, height: `${size}px` } : undefined} />;

export function Koin({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="20" cy="21.5" r="17" fill="#E9A800" />
      <circle cx="20" cy="19.5" r="17" fill="#FFC93C" stroke="#1D2A4D" stroke-width="2.5" />
      <ellipse cx="15" cy="16" rx="2" ry="3" fill="#1D2A4D" />
      <ellipse cx="25" cy="16" rx="2" ry="3" fill="#1D2A4D" />
      <path d="M13 22 L13 25.5 L27 25.5 L27 22" fill="none" stroke="#1D2A4D" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
  );
}

export function StatIcon({ stat, size = 28 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', role: 'img', 'aria-label': STAT_NAMES[stat], style: { flex: 'none' } };
  if (stat === 'health') return <svg {...common}><circle cx="12" cy="12" r="10" fill="#22A06B" /><path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="3" stroke-linecap="round" /></svg>;
  if (stat === 'brains') return <svg {...common}><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" fill="#9B7BFF" stroke="#1D2A4D" stroke-width="2" stroke-linejoin="round" /><path d="M9.5 19h5M10.5 21.5h3" stroke="#1D2A4D" stroke-width="2" stroke-linecap="round" /></svg>;
  if (stat === 'money') return <svg {...common}><circle cx="12" cy="12" r="9.5" fill="#FFC93C" stroke="#1D2A4D" stroke-width="2" /><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.2 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.4-2.6-1.3M12 6.5v11" stroke="#1D2A4D" stroke-width="1.8" fill="none" stroke-linecap="round" /></svg>;
  return <svg {...common}><path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#F06AA7" stroke="#1D2A4D" stroke-width="2" stroke-linejoin="round" /></svg>;
}

export const Flame = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
    <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="#FF7A2F" stroke="#1D2A4D" stroke-width="2" stroke-linejoin="round" />
    <path d="M12 13c1.5 1.5 3 2.5 3 4.5a3 3 0 0 1-6 0c0-1.5 1-2.5 3-4.5z" fill="#FFC93C" />
  </svg>
);

export const Shield = ({ size = 22, cracks = 0, fill = '#7FB8FF' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
    <path d="M12 2 L20 5 V11 C20 16 16.5 19.5 12 22 C7.5 19.5 4 16 4 11 V5 Z" fill={fill} stroke="#1D2A4D" stroke-width="2" stroke-linejoin="round" />
    {cracks > 0 && <path d="M12.5 5 L10 10.5 L13.5 12.5 L11 18" stroke="#1D2A4D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />}
    {cracks > 1 && <path d="M16.5 7 L14.5 10 L17 12" stroke="#1D2A4D" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />}
    {cracks > 2 && <path d="M7 8 L9 11 L6.5 14" stroke="#1D2A4D" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />}
  </svg>
);

export const Sprout = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
    <path d="M12 21 V11" stroke="#157A4E" stroke-width="2.5" stroke-linecap="round" />
    <path d="M12 12 C12 7 8 5 4 5 C4 9 7 12 12 12 Z" fill="#5DBB55" stroke="#1D2A4D" stroke-width="1.8" stroke-linejoin="round" />
    <path d="M12 10 C12 6 15 3.5 20 3.5 C20 8 16.5 10 12 10 Z" fill="#7FD06E" stroke="#1D2A4D" stroke-width="1.8" stroke-linejoin="round" />
  </svg>
);

export const Tick = ({ size = 20, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
);
export const Cross = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#1D2A4D" stroke-width="3" stroke-linecap="round" /></svg>
);

export const fmt = (n) => Number(n || 0).toLocaleString('en-AU');

export function Hud({ player, extraChip }) {
  const L = levelInfo(player.xp);
  const pct = Math.min(100, Math.round((L.into / L.size) * 100));
  const shields = player.streak?.shields || 0;
  return (
    <header className="hud">
      <div className="who">
        <HeroHead player={player} />
        <div style={{ minWidth: 0 }}>
          <p className="name">{player.heroName}</p>
          <p className="muted" style={{ fontSize: 15 }}>Level {L.level} · {L.chapterName}</p>
        </div>
      </div>
      <div className="xp">
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
          <span>{fmt(L.into)} / {fmt(L.size)} XP</span><span className="muted">Level {L.level + 1} next</span>
        </div>
        <div className="bar" role="progressbar" aria-valuemin="0" aria-valuemax={L.size} aria-valuenow={L.into} aria-label="XP to next level"><div style={{ width: `${pct}%` }} /></div>
        {L.nextChapterLevel && <p className="muted" style={{ fontSize: 13 }}>Reach level {L.nextChapterLevel} to earn up to {fmt(L.nextChapterCap)} koins a week</p>}
      </div>
      <div className="chips">
        {extraChip}
        <span className="chip" style={{ background: '#FFF1E6' }}><Flame />{player.streak?.count || 0}-day streak</span>
        <span className="chip" style={{ background: '#E6F1FF' }} aria-label={`${shields} streak shields`}>
          {shields === 0 ? <Shield fill="#E6ECF8" /> : Array.from({ length: shields }, (_, i) => <Shield key={i} />)}
          {shields} {shields === 1 ? 'shield' : 'shields'}
        </span>
        <span className="chip" style={{ background: player.wallet < 0 ? 'var(--red-soft)' : 'var(--sun-soft)' }} aria-label={`${player.wallet} Smiley Koins`}><Koin />{fmt(player.wallet)}</span>
      </div>
    </header>
  );
}

export function useDoc(store, path) {
  const [data, setData] = useState(undefined);
  useEffect(() => (path ? store.watchDoc(path, setData) : undefined), [store, path]);
  return data;
}
export function useQuery(store, coll, where) {
  const key = JSON.stringify(where);
  const [data, setData] = useState(undefined);
  useEffect(() => store.watchQuery(coll, where, setData), [store, coll, key]);
  return data;
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3200); return () => clearTimeout(t); }, [msg]);
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [node, setMsg];
}

export function Loading({ text = 'Loading…' }) {
  return <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}><p className="display" style={{ fontSize: 28 }}>{text}</p></div>;
}

export function StatsPanel({ player, title = 'Who you are becoming' }) {
  const colours = { health: '#22A06B', brains: '#9B7BFF', money: '#E9A800', heart: '#F06AA7' };
  return (
    <div className="panel stack" style={{ gap: 8 }}>
      <p className="kicker">{title}</p>
      {['health', 'brains', 'money', 'heart'].map((s) => (
        <div key={s} className="stat-row">
          <StatIcon stat={s} size={24} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{STAT_NAMES[s]}</span>
          <div className="bar" style={{ height: 14 }} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={player.stats[s]} aria-label={STAT_NAMES[s]}><div style={{ width: `${player.stats[s]}%`, background: colours[s] }} /></div>
          <span style={{ textAlign: 'right', fontWeight: 700 }}>{player.stats[s]}</span>
          <span aria-label={player.risk[s] ? `${STAT_NAMES[s]} shield has ${player.risk[s]} cracks` : `${STAT_NAMES[s]} shield is whole`}><Shield size={22} cracks={player.risk[s]} fill={player.risk[s] ? '#C9B8FF' : '#BFE3FF'} /></span>
        </div>
      ))}
      <p className="muted" style={{ fontSize: 14 }}>Cracked shields come from tempting choices and missed habits. Three good choices in an area fix one crack.</p>
    </div>
  );
}

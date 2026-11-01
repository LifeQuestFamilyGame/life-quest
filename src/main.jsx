import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import './styles.css';
import { PracticeStore, createFirebaseStore } from './data/store.js';
import { makeActions } from './data/actions.js';
import { FIREBASE_CONFIG, playerForEmail } from './data/config.js';
import { FAMILY_PLAYERS } from './content/family.js';
import * as D from './engine/dates.js';
import { KidApp } from './screens/kid/KidApp.jsx';
import { ParentApp } from './screens/parent/ParentApp.jsx';
import { Hero, Koin, Loading } from './ui/components.jsx';

const params = new URLSearchParams(location.search);
const wantPractice = import.meta.env.VITE_PRACTICE === '1' || params.has('practice') || !FIREBASE_CONFIG;
const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignore */ } };

if (wantPractice) D.setDayOffset(Number(safeGet('lq-offset') || 0));

function SignIn({ store }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <form className="card stack" style={{ maxWidth: 460, width: '100%' }} onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr('');
        try { await store.signIn(email, pw); } catch (ex) { setErr(ex.code === 'auth/invalid-credential' || ex.code === 'auth/wrong-password' ? 'That email or password is not right.' : ex.code === 'auth/network-request-failed' ? 'No internet connection.' : 'Could not sign in. Try again.'); }
        finally { setBusy(false); }
      }}>
        <div className="row"><Koin size={48} /><h1 className="display" style={{ fontSize: 40 }}>Life Quest</h1></div>
        <p className="muted">Mum or Dad signs in once on each device. It stays signed in after that.</p>
        <label className="field">Email<input type="email" autoComplete="username" value={email} onInput={(e) => setEmail(e.currentTarget.value)} required /></label>
        <label className="field">Password<input type="password" autoComplete="current-password" value={pw} onInput={(e) => setPw(e.currentTarget.value)} required /></label>
        {err && <p className="panel" style={{ background: 'var(--red-soft)' }} role="alert">{err}</p>}
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

function PracticeBar({ store, who, onSwitch, onDay }) {
  const [sure, setSure] = useState(false);
  useEffect(() => { if (!sure) return; const t = setTimeout(() => setSure(false), 3000); return () => clearTimeout(t); }, [sure]);
  return (
    <div className="practice-bar" role="region" aria-label="Practice mode">
      <strong>Practice mode</strong>
      <span>{D.prettyDate(D.today())}</span>
      <button type="button" onClick={() => onDay(1)}>Next day</button>
      {who && <button type="button" onClick={onSwitch}>Switch player</button>}
      <button type="button" onClick={() => { if (!sure) { setSure(true); return; } setSure(false); store.reset(); onDay(-D.getDayOffset()); }}>{sure ? 'Tap again to wipe' : 'Reset'}</button>
    </div>
  );
}

function WhoIsPlaying({ onPick }) {
  return (
    <div className="screen">
      <div className="card stack">
        <h1 className="display" style={{ fontSize: 40 }}>Who's playing?</h1>
        <p className="muted">Practice mode keeps everything on this device, so you can try the game before it's connected.</p>
        <div className="tiles">
          {FAMILY_PLAYERS.map((p) => (
            <button key={p.id} type="button" className="panel stack" style={{ alignItems: 'center', border: '3px solid var(--ink)', borderRadius: 20, background: p.tint, boxShadow: '4px 4px 0 var(--ink)', color: 'var(--ink)' }} onClick={() => onPick(p.id)}>
              <Hero player={{ ...p, style: 'cartoon' }} size={110} />
              <span className="display" style={{ fontSize: 20, overflowWrap: 'anywhere' }}>{p.name}</span>
              <span className="muted" style={{ fontSize: 14 }}>{p.role === 'kid' ? 'Player' : 'Game Master'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [store, setStore] = useState(null);
  const [user, setUser] = useState(undefined);
  const [who, setWho] = useState(() => (wantPractice ? safeGet('lq-who') : null));
  const [tick, setTick] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (wantPractice) { setStore(new PracticeStore()); setUser(null); return; }
    createFirebaseStore(FIREBASE_CONFIG).then((s) => { setStore(s); s.onAuth(setUser); }).catch((e) => { console.error(e); setFailed(true); });
  }, []);
  // Roll over to the new day while the app stays open.
  useEffect(() => { let d = D.today(); const t = setInterval(() => { if (D.today() !== d) { d = D.today(); setTick((x) => x + 1); } }, 60000); return () => clearInterval(t); }, []);

  if (failed) return <Loading text="Can't reach Life Quest. Check the internet and reopen the app." />;
  if (!store || user === undefined) return <Loading />;
  const actions = makeActions(store);

  if (store.mode === 'practice') {
    const changeDay = (n) => { const o = D.getDayOffset() + n; D.setDayOffset(o); safeSet('lq-offset', String(o)); setTick((x) => x + 1); };
    const bar = <PracticeBar store={store} who={who} onDay={changeDay} onSwitch={() => { setWho(null); safeSet('lq-who', null); }} />;
    if (!who) return <>{bar}<WhoIsPlaying onPick={(id) => { setWho(id); safeSet('lq-who', id); }} /></>;
    const def = FAMILY_PLAYERS.find((p) => p.id === who);
    return def.role === 'kid'
      ? <KidApp key={`${who}-${tick}`} store={store} actions={actions} pid={who} header={bar} />
      : <ParentApp key={`${who}-${tick}`} store={store} actions={actions} me={def} header={bar} />;
  }

  if (!user) return <SignIn store={store} />;
  return <SignedIn store={store} actions={actions} user={user} tick={tick} />;
}

function SignedIn({ store, actions, user, tick }) {
  const [def, setDef] = useState(undefined);
  useEffect(() => { let live = true; playerForEmail(user.email).then((d) => live && setDef(d)); return () => { live = false; }; }, [user.email]);
  if (def === undefined) return <Loading />;
  if (!def) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="card stack" style={{ maxWidth: 480 }}>
          <h1 className="display" style={{ fontSize: 30 }}>This login isn't in the family game</h1>
          <p>{user.email}</p>
          <button type="button" className="btn" onClick={() => store.signOut()}>Sign out</button>
        </div>
      </div>
    );
  }
  const signOut = <SignOutLink store={store} kid={def.role === 'kid'} />;
  return def.role === 'kid'
    ? <><KidApp key={`${def.id}-${tick}`} store={store} actions={actions} pid={def.id} />{signOut}</>
    : <><ParentApp key={`${def.id}-${tick}`} store={store} actions={actions} me={def} />{signOut}</>;
}

function SignOutLink({ store, kid }) {
  const [ask, setAsk] = useState(false);
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
      <button type="button" className="linkbtn" style={{ color: 'var(--muted)', fontSize: 14 }} onClick={() => setAsk(true)}>Sign out</button>
      {ask && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Sign out">
          <div className="card stack">
            <h2 className="display" style={{ fontSize: 26 }}>Sign out?</h2>
            {kid && <p>Ask Mum or Dad first. They'll need the password to sign back in.</p>}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn small" onClick={() => setAsk(false)}>Stay</button>
              <button type="button" className="btn primary small" onClick={() => store.signOut()}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

render(<App />, document.getElementById('app'));

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

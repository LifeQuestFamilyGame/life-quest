// Two interchangeable data stores with the same small interface:
//   PracticeStore: everything saved in this browser (for trying the game, and for tests)
//   FirebaseStore: the family's shared data in Firebase (Firestore + email/password logins)
//
// store.watchDoc(path, cb)            -> unsubscribe
// store.watchQuery(coll, where, cb)   -> unsubscribe   (where: [[field, '==', value], ...])
// store.getDoc(path)                  -> data | null
// store.transact(async (tx) => ...)   tx.get(path), tx.set(path, data), tx.update(path, patch), tx.create(coll, data), tx.delete(path)
// store.onAuth(cb), store.signIn(email, password), store.signOut()

const clean = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

// ---------------------------------------------------------------------------
export class PracticeStore {
  constructor(key = 'lq-practice') {
    this.mode = 'practice';
    this.key = key;
    this.listeners = new Set();
    this.data = this.load();
    try {
      this.channel = new BroadcastChannel(key);
      this.channel.onmessage = () => { this.data = this.load(); this.emit(); };
    } catch { this.channel = null; }
  }
  load() { try { return JSON.parse(localStorage.getItem(this.key) || '{}'); } catch { return {}; } }
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch { /* storage full or blocked */ }
    try { this.channel?.postMessage('changed'); } catch { /* ignore */ }
  }
  emit() { for (const l of this.listeners) l(); }
  reset() { this.data = {}; this.save(); this.emit(); }

  watchDoc(path, cb) {
    const fn = () => cb(clean(this.data[path] ?? null));
    this.listeners.add(fn); fn();
    return () => this.listeners.delete(fn);
  }
  queryNow(coll, where = []) {
    const out = [];
    for (const [path, doc] of Object.entries(this.data)) {
      const [c, id, ...rest] = path.split('/');
      if (c !== coll || rest.length) continue;
      if (where.every(([f, op, v]) => (op === '==' ? doc[f] === v : op === 'in' ? v.includes(doc[f]) : true))) out.push({ id, ...clean(doc) });
    }
    return out;
  }
  watchQuery(coll, where, cb) {
    const fn = () => cb(this.queryNow(coll, where));
    this.listeners.add(fn); fn();
    return () => this.listeners.delete(fn);
  }
  async getDoc(path) { return clean(this.data[path] ?? null); }
  async transact(fn) {
    const writes = [];
    const tx = {
      get: async (path) => clean(this.data[path] ?? null),
      set: (path, data) => writes.push(['set', path, clean(data)]),
      update: (path, patch) => writes.push(['update', path, clean(patch)]),
      delete: (path) => writes.push(['delete', path]),
      create: (coll, data) => { const id = Math.random().toString(36).slice(2, 12); writes.push(['set', `${coll}/${id}`, clean(data)]); return id; }
    };
    const result = await fn(tx);
    for (const [op, path, data] of writes) {
      if (op === 'set') this.data[path] = data;
      else if (op === 'update') this.data[path] = { ...(this.data[path] || {}), ...data };
      else delete this.data[path];
    }
    this.save(); this.emit();
    return result;
  }
  onAuth(cb) { cb(null); return () => {}; }
  async signIn() { throw new Error('Practice mode has no logins'); }
  async signOut() {}
}

// ---------------------------------------------------------------------------
export async function createFirebaseStore(config) {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/firestore')
  ]);
  const app = initializeApp(config);
  const a = auth.getAuth(app);
  await auth.setPersistence(a, auth.browserLocalPersistence);
  let db;
  try {
    db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  } catch {
    db = fs.getFirestore(app);
  }
  const ref = (path) => fs.doc(db, ...path.split('/'));
  const toWhere = (w) => w.map(([f, op, v]) => fs.where(f, op, v));

  return {
    mode: 'firebase',
    watchDoc(path, cb) {
      return fs.onSnapshot(ref(path), (s) => cb(s.exists() ? s.data() : null), (e) => { console.error(e); cb(null); });
    },
    watchQuery(coll, where, cb) {
      const q = fs.query(fs.collection(db, coll), ...toWhere(where || []));
      return fs.onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => { console.error(e); cb([]); });
    },
    async getDoc(path) { const s = await fs.getDoc(ref(path)); return s.exists() ? s.data() : null; },
    async transact(fn) {
      return fs.runTransaction(db, async (t) => {
        const tx = {
          get: async (path) => { const s = await t.get(ref(path)); return s.exists() ? s.data() : null; },
          set: (path, data) => { t.set(ref(path), clean(data)); },
          update: (path, patch) => { t.set(ref(path), clean(patch), { merge: true }); },
          delete: (path) => { t.delete(ref(path)); },
          create: (coll, data) => { const r = fs.doc(fs.collection(db, coll)); t.set(r, clean(data)); return r.id; }
        };
        return fn(tx);
      });
    },
    onAuth(cb) { return auth.onAuthStateChanged(a, (u) => cb(u ? { email: (u.email || '').toLowerCase(), uid: u.uid } : null)); },
    signIn(email, password) { return auth.signInWithEmailAndPassword(a, email.trim(), password); },
    signOut() { return auth.signOut(a); }
  };
}

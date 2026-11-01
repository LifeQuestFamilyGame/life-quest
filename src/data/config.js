import { FAMILY_PLAYERS } from '../content/family.js';

// Paste the Firebase web app settings here (Project settings > Your apps > Web app).
// These settings are not secret: the security rules decide who can read and write.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC32_xKH8loQ1mWJkt_zhuRjwjmy4u93hY',
  authDomain: 'life-quest-c17ba.firebaseapp.com',
  projectId: 'life-quest-c17ba',
  storageBucket: 'life-quest-c17ba.firebasestorage.app',
  messagingSenderId: '747658387855',
  appId: '1:747658387855:web:4bdf6f7fe566be478fabfa'
};

export async function playerForEmail(email) {
  const e = (email || '').trim().toLowerCase();
  if (!e || !crypto?.subtle) return null;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(e));
  const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  return FAMILY_PLAYERS.find((p) => p.loginHash === hex) || null;
}

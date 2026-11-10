'use strict';
const VER = '1.0.0';
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = n => Math.round(n).toLocaleString('en-US');

/* ---------- per-browser storage (never load-bearing) ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('hd.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('hd.' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('hd.' + k); } catch (e) {} }
};

/* ---------- tuneables: every "proposed" value in the spec lives here ---------- */
const CFG = {
  RUN: 45, FIRE: 0.22, INV: 1.0, RESPAWN_INV: 1.2, PENALTY: 500,
  BOOST_T: 1.4, BOOST_WORLD: 1.9, FX_T: 8, ROUTE_T: 8,
  PORTAL_T: 22, BOSS_IN: 34.2, BOSS_T: 35,
  PTS: { cry: 100, kill: 150, near: 200, multi: 500, boss: 1500 },
  MULT_STEP: 5, MULT_CAP: 5,
  CHARGE: { cry: 0.085, kill: 0.07, near: 0.14, bosshit: 0.012 },
  SHIP_R: 0.075, NEAR: 0.17, BOSS_Z: 0.42, BOSS_POD: 6, BOSS_CORE: 14,
  PHASES: [7, 17, 27, 35, 45]
};
const LANES = [-0.8, -0.4, 0, 0.4, 0.8];
const R_OF = { cry: 0.07, mine: 0.1, drone: 0.1, weav: 0.1, brute: 0.15, pu: 0.1, bshot: 0.09, gate: 0.4 };
const HP_OF = { drone: 1, weav: 2, brute: 3 };
const HAZ = { mine: 1, drone: 1, weav: 1, brute: 1, bshot: 1 };
const FOE = { drone: 1, weav: 1, brute: 1 };

/* ---------- time: weekly boundary is Monday 00:00 Asia/Kolkata ---------- */
const IST = 19800000;
function weekInfo(now) {
  const d = new Date((now == null ? Date.now() : now) + IST);
  const dow = (d.getUTCDay() + 6) % 7;
  const mon = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow);
  const th = new Date(mon + 3 * 864e5);
  const wn = 1 + Math.floor((th - Date.UTC(th.getUTCFullYear(), 0, 1)) / 6048e5);
  const key = new Date(mon).toISOString().slice(0, 10);
  let h = 2166136261;
  for (const c of key + VER.split('.')[0]) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return { key, wn, end: mon + 7 * 864e5 - IST, seed: h >>> 0, label: 'Course W' + (wn < 10 ? '0' : '') + wn };
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- names ---------- */
const BLOCK = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'rape', 'asshole', 'dick', 'pussy', 'whore', 'slut'];
function cleanName(raw) {
  let s = String(raw == null ? '' : raw).normalize('NFKC').replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁯﻿]/g, '').replace(/\s+/g, ' ').trim();
  const len = Array.from(s).length;
  if (len < 2) return { err: 'Use at least 2 characters.' };
  if (len > 24) return { err: 'Keep it to 24 characters or fewer.' };
  if (/[<>]/.test(s)) return { err: 'Names cannot include < or >.' };
  const flat = s.toLowerCase().replace(/[^a-z]/g, '');
  if (BLOCK.some(w => flat.includes(w))) return { err: 'That name is on our blocked-word list. Try another.' };
  return { name: s };
}

/* ---------- the course: a seeded, versioned 45-second schedule ----------
   Every hazard row keeps one lane open, and that open lane moves at most one
   lane between rows, so no pattern is ever unavoidable. */
function travelAt(t) { return t < 34 ? 2.5 - 0.8 * (t / 34) : 1.5; }
function buildCourse(seed) {
  const R = mulberry(seed), ev = [];
  const ri = n => Math.floor(R() * n);
  let safe = 2;
  const walk = () => (safe = clamp(safe + ri(3) - 1, 0, 4));
  const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const others = () => shuf([0, 1, 2, 3, 4].filter(l => l !== safe));
  const far = () => shuf([0, 1, 2, 3, 4].filter(l => Math.abs(l - safe) >= 2));
  const add = (t, k, lane, o) => ev.push(Object.assign({ t, k, lane, x: LANES[lane] }, o));

  // 00-07 confidence: crystal ribbon, three lone mines well away from it
  for (let t = 1.3; t < 6.9; t += 0.4) { walk(); add(t, 'cry', safe); if (t > 4 && R() < 0.38) add(t + 0.1, 'mine', far()[0]); }
  // 07-17 drones, first power-up, first boost
  for (let t = 7.5; t < 16.9; t += 0.92) {
    walk(); const o = others(); const n = 1 + (R() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) add(t, 'drone', o[i]);
    if (R() < 0.75) add(t + 0.3, 'cry', safe);
    if (R() < 0.45) add(t + 0.46, 'cry', o[3]);
    if (R() < 0.25) add(t + 0.2, 'mine', o[2]);
  }
  add(9.3, 'pu', safe, { pu: 'triple' }); add(14.2, 'pu', safe, { pu: 'magnet' });
  // 17-22 run-in to the portal
  for (let t = 17.5; t < 19.4; t += 0.78) { walk(); const o = others(); add(t, 'drone', o[0]); add(t, 'drone', o[1]); const f = far(); if (f.length) add(t + 0.3, 'weav', f[0]); add(t + 0.3, 'cry', safe); }
  for (let t = 19.9; t < 21.5; t += 0.36) add(t, 'cry', 2);
  const cyanLeft = R() < 0.5;
  add(CFG.PORTAL_T, 'gate', 2, { x: 0 });
  // 22-27 the two routes share safe lanes but not contents
  safe = 2;
  for (let t = 23.3; t < 27; t += 0.66) {
    walk(); const o = others();
    add(t, 'cry', safe, { route: 'c' }); add(t + 0.3, 'cry', o[0], { route: 'c' }); if (R() < 0.5) add(t, 'drone', o[1], { route: 'c' });
    add(t, R() < 0.5 ? 'drone' : 'brute', o[0], { route: 'a' }); add(t, 'drone', o[1], { route: 'a' });
    const f = far(); if (f.length && R() < 0.6) add(t + 0.25, 'weav', f[0], { route: 'a' });
    if (R() < 0.5) add(t + 0.1, 'mine', o[2], { route: 'a' }); if (R() < 0.55) add(t + 0.33, 'cry', safe, { route: 'a' });
  }
  // 27-33.4 peak chaos
  for (let t = 27.5; t < 33.4; t += 0.62) {
    walk(); const o = others(), p = R();
    if (p < 0.34) { for (let i = 0; i < 3; i++) add(t, 'mine', o[i]); }
    else if (p < 0.7) { add(t, 'drone', o[0]); add(t, 'drone', o[1]); const f = far(); if (f.length) add(t + 0.2, 'weav', f[0]); }
    else { add(t, 'brute', o[0]); add(t + 0.1, 'drone', o[1]); }
    if (R() < 0.7) add(t + 0.31, 'cry', safe);
  }
  add(30.4, 'pu', safe, { pu: 'shield' });
  // 35-45 boss attack script
  safe = 2; let n = 0;
  for (let t = 36.3; t < 44.3; t += 1.75, n++) {
    walk(); const adj = clamp(safe + (R() < 0.5 ? 1 : -1), 0, 4);
    const lanes = [0, 1, 2, 3, 4].filter(l => l !== safe && (n % 2 ? true : l !== adj));
    ev.push({ t, k: n % 2 ? 'fan' : 'beam', lanes: n % 2 ? shuf(lanes).slice(0, 3) : lanes, safe });
  }
  add(39.4, 'pu', 2, { pu: 'triple' });
  ev.forEach((e, i) => { e.id = i; e.sp = e.k === 'beam' || e.k === 'fan' ? e.t : e.t - travelAt(e.t); });
  ev.sort((a, b) => a.sp - b.sp);
  return { ev, cyanLeft, seed };
}

// RockED Hyperdrive API: one Netlify Function serving the four contracts in the handoff spec.
// The Supabase service key lives only here (Netlify env vars). The browser never talks to Supabase.
import { createHash, createHmac, timingSafeEqual, randomUUID } from 'node:crypto';

export const config = { path: '/api/*' };

const VER = '1.0.0';
const RUN_S = 45, GRACE_S = 15;
const PAUSE_BUDGET_S = Number(process.env.PAUSE_BUDGET_S || 120); // the game can be paused; spec's 45s+15s assumes no pause
const HARD_CAP = Number(process.env.SCORE_HARD_CAP || 90000);     // recalibrate whenever the wave schedule changes
const CEIL = { cry: 95, kill: 70, near: 90, multi: 8, boss: 1 };   // per-run event ceilings from the seeded schedule
const PTS = { cry: 100, kill: 150, near: 200, multi: 500, boss: 1500 };
const IST = 19800000;

const env = k => { const v = process.env[k]; if (!v) throw new Error('missing env ' + k); return v; };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const fail = (status, error) => json(status, { error });
const sha = s => createHash('sha256').update(s).digest('hex');
const sign = s => createHmac('sha256', env('RUN_TOKEN_SECRET')).update(s).digest('hex');
const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const isUuid = s => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s);

function week(now = Date.now()) {
  const d = new Date(now + IST), dow = (d.getUTCDay() + 6) % 7;
  const mon = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow);
  const key = new Date(mon).toISOString().slice(0, 10);
  let h = 2166136261; for (const c of key + VER.split('.')[0]) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return { key, seed: h >>> 0, end: new Date(mon + 7 * 864e5 - IST).toISOString() };
}

const BLOCK = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'rape', 'asshole', 'dick', 'pussy', 'whore', 'slut'];
function cleanName(raw) {
  const s = String(raw ?? '').normalize('NFKC').replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁯﻿]/g, '').replace(/\s+/g, ' ').trim();
  const len = Array.from(s).length;
  if (len < 2 || len > 24 || /[<>]/.test(s)) return null;
  if (BLOCK.some(w => s.toLowerCase().replace(/[^a-z]/g, '').includes(w))) return null;
  return s;
}

// PostgREST with the service role. Errors are logged as counters only: no names, no payloads.
async function sb(path, init = {}) {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const r = await fetch(env('SUPABASE_URL') + '/rest/v1/' + path, { ...init, headers: { apikey: key, authorization: 'Bearer ' + key, 'content-type': 'application/json', prefer: 'return=representation', ...(init.headers || {}) } });
  const body = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error('db'); e.pg = body?.message || ''; throw e; }
  return body;
}
const rpc = (fn, args) => sb('rpc/' + fn, { method: 'POST', body: JSON.stringify(args) });

async function player(id, credential) {
  if (!isUuid(id) || typeof credential !== 'string' || credential.length < 32 || credential.length > 128) return null;
  const rows = await sb('players?id=eq.' + id + '&select=id,display_name,credential_hash');
  return rows[0] && same(rows[0].credential_hash, sha(credential)) ? rows[0] : null;
}

// Best-effort burst limiter per warm instance. It keys on a hash that is never stored or logged.
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < windowMs);
  a.push(now); hits.set(key, a); if (hits.size > 5000) hits.clear(); return a.length > max;
}

async function pilots(b, ctx) {
  const name = cleanName(b.display_name);
  if (!name) return fail(400, 'Pick a name with 2 to 24 characters.');
  if (typeof b.credential !== 'string' || b.credential.length < 32 || b.credential.length > 128) return fail(400, 'Invalid request.');
  if (limited('p:' + sha(ctx.ip || ''), 8, 60000)) return fail(429, 'Too many requests. Try again in a minute.');
  if (b.player_id) {                                   // rename: needs possession of the browser credential
    const p = await player(b.player_id, b.credential); if (!p) return fail(401, 'Unknown pilot.');
    await sb('players?id=eq.' + p.id, { method: 'PATCH', body: JSON.stringify({ display_name: name }) });
    return json(200, { player_id: p.id, display_name: name });
  }
  const hash = sha(b.credential);                      // idempotent create: same credential returns the same pilot
  const found = await sb('players?credential_hash=eq.' + hash + '&select=id,display_name');
  if (found[0]) return json(200, { player_id: found[0].id, display_name: found[0].display_name });
  const made = await sb('players', { method: 'POST', body: JSON.stringify({ display_name: name, credential_hash: hash }) });
  return json(201, { player_id: made[0].id, display_name: name });
}

async function runStart(b) {
  const p = await player(b.player_id, b.credential); if (!p) return fail(401, 'Unknown pilot.');
  const since = new Date(Date.now() - 60000).toISOString();
  const recent = await sb('run_sessions?player_id=eq.' + p.id + '&issued_at=gte.' + since + '&select=id');
  if (recent.length >= 6) return fail(429, 'Slow down. Try again in a minute.');
  const w = week(), id = randomUUID(), issued = new Date();
  const expires = new Date(issued.getTime() + (RUN_S + GRACE_S + PAUSE_BUDGET_S) * 1000);
  await sb('run_sessions', { method: 'POST', body: JSON.stringify({ id, player_id: p.id, seed: w.seed, issued_at: issued.toISOString(), expires_at: expires.toISOString() }) });
  return json(200, { run_id: id, token: sign(id + '.' + p.id + '.' + issued.getTime()), seed: w.seed, issued_at: issued.toISOString() });
}

async function runFinish(b) {
  if (!isUuid(b.run_id) || typeof b.token !== 'string') return fail(400, 'Score invalid.');
  const rows = await sb('run_sessions?id=eq.' + b.run_id + '&select=id,player_id,seed,issued_at,expires_at,used_at');
  const s = rows[0]; if (!s) return fail(410, 'Run expired. Play again');
  if (!same(b.token, sign(s.id + '.' + s.player_id + '.' + new Date(s.issued_at).getTime()))) return fail(400, 'Score invalid.');
  const score = b.score, q = b.summary || {};
  if (!Number.isInteger(score) || score < 0 || score > HARD_CAP) return fail(400, 'Score invalid.');
  let bound = 0;
  for (const k of Object.keys(CEIL)) { const n = q[k] ?? 0; if (!Number.isInteger(n) || n < 0 || n > CEIL[k]) return fail(400, 'Score invalid.'); bound += n * PTS[k] * 5; }
  if (score > bound) return fail(400, 'Score invalid.');
  const now = Date.now(), elapsed = (now - new Date(s.issued_at).getTime()) / 1000;
  if (!s.used_at) {
    if (elapsed < RUN_S - 1) return fail(400, 'Score invalid.');
    if (now > new Date(s.expires_at).getTime()) return fail(410, 'Run expired. Play again');
  }
  let out;
  try { out = await rpc('hd_finish_run', { p_run: s.id, p_player: s.player_id, p_score: score, p_version: VER, p_seed: s.seed, p_week: week(new Date(s.issued_at).getTime()).key }); }
  catch (e) { if (/used_or_missing/.test(e.pg)) return fail(409, 'This run was already submitted.'); throw e; }
  const r = Array.isArray(out) ? out[0] : out;         // an identical repeat returns the stored result, never a second row
  const w = week(), season = VER.split('.')[0];
  const [wk, all] = await Promise.all([rpc('hd_leaderboard', { p_week: w.key, p_season: season, p_viewer: s.player_id }), rpc('hd_leaderboard', { p_week: null, p_season: season, p_viewer: s.player_id })]);
  return json(200, { accepted_score: r.score, duplicate: r.duplicate, personal_best: all.you?.score ?? r.score, weekly_rank: wk.you?.rank ?? null, all_time_rank: all.you?.rank ?? null });
}

async function leaderboard(req) {
  const period = new URL(req.url).searchParams.get('period');
  if (period !== 'weekly' && period !== 'all-time') return fail(400, 'Invalid period.');
  const [pid, cred] = (req.headers.get('x-pilot') || '').split(':');
  const viewer = pid && cred ? await player(pid, cred) : null;   // "your row" needs the credential, never a name match
  const w = week();
  const data = await rpc('hd_leaderboard', { p_week: period === 'weekly' ? w.key : null, p_season: VER.split('.')[0], p_viewer: viewer ? viewer.id : null });
  return json(200, { period, period_end: period === 'weekly' ? w.end : null, rows: data.rows, you: data.you, total: data.total });
}

export default async (req, ctx) => {
  const path = new URL(req.url).pathname.replace(/^\/api/, '').replace(/\/$/, '');
  try {
    if (req.method === 'GET' && path === '/leaderboard') return await leaderboard(req);
    if (req.method !== 'POST') return fail(404, 'Not found.');
    const raw = await req.text(); if (raw.length > 2000) return fail(400, 'Invalid request.');
    let b; try { b = JSON.parse(raw); } catch { return fail(400, 'Invalid request.'); }
    if (path === '/pilots') return await pilots(b, ctx);
    if (path === '/runs/start') return await runStart(b);
    if (path === '/runs/finish') return await runFinish(b);
    return fail(404, 'Not found.');
  } catch (e) {
    console.error('hyperdrive_api_error', path, e.message === 'db' ? 'db' : 'internal');   // counter only
    return fail(e.message === 'db' ? 503 : 500, 'Something went wrong. Try again.');
  }
};

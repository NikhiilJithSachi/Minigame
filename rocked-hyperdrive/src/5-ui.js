/* ---------- screens, HUD and input ---------- */
const SCREENS = ['load', 'home', 'hud', 'tut', 'name', 'results', 'board', 'pause', 'settings'];
function show() { const on = new Set(arguments); SCREENS.forEach(s => { $(s).hidden = !on.has(s); }); }
let toastT = 0;
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
const GRADES = [[0, 'Green Pea'], [8000, 'Lot Runner'], [16000, 'Closer'], [26000, 'Desk Manager'], [36000, 'General Manager'], [48000, 'Dealer Principal']];
const gradeOf = s => { let g = GRADES[0][1]; for (const [m, n] of GRADES) if (s >= m) g = n; return g; };

let pendingStart = false, boardFrom = 'home', lbTab = 'weekly', lbTick = 0, last = null;

function goHome() {
  G.state = 'home'; AU.music && AU.ctx && AU.music(-1); show('home'); refreshHome();
}
function refreshHome() {
  const wk = weekInfo(), pb = store.get('pb', 0);
  $('homePb').textContent = pb ? fmt(pb) : 'No flights yet';
  const chip = $('courseChip'); chip.classList.toggle('off', BE.mode !== 'claude' && BE.mode !== 'api');
  $('courseTxt').textContent = wk.label + (BE.mode === 'pending' ? ' · connecting' : BE.mode === 'local' ? ' · practice mode' : ' · same route for everyone');
  const b = BE.mode === 'pending' ? null : BE.board('weekly'), pod = $('podium'); pod.textContent = '';
  if (b && b.rows.length && BE.mode !== 'local') {
    b.rows.slice(0, 3).forEach(r => { const ln = document.createElement('div'); ln.className = 'ln';[r.rank, r.name, fmt(r.score)].forEach((v, i) => { const s = document.createElement('span'); s.textContent = v; if (i === 2) s.className = 'num'; ln.appendChild(s); }); pod.appendChild(ln); });
    pod.hidden = false;
  } else pod.hidden = true;
}
function play() {
  AU.init();
  if (!store.get('name')) { pendingStart = true; openName(); return; }
  if (!store.get('tut')) { G.state = 'tut'; show('home', 'tut'); return; }
  start();
}
function start() {
  store.set('tut', 1); AU.init(); newRun(); BE.startRun(); G.pace = (p => p && p.key === G.wk.key ? p : null)(store.get('pace'));
  $('timer').classList.remove('hot'); $('bossbar').hidden = true; $('portalcue').hidden = true; $('callout').classList.remove('on');
  for (const k in HC) HC[k] = null;
  show('hud'); G.state = 'run'; big('GO', '#fff'); if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume();
}
function openName() {
  $('nameIn').value = store.get('name', ''); $('nameErr').textContent = '';
  $('nameTitle').textContent = store.get('name') ? 'Change your pilot name' : 'What should we call you?';
  $('nameGo').textContent = pendingStart ? 'START FLIGHT' : 'SAVE NAME';
  show(G.state === 'home' || G.state === 'tut' ? 'home' : 'results', 'name'); setTimeout(() => { try { $('nameIn').focus(); } catch (e) {} }, 60);
}
$('nameForm').addEventListener('submit', e => {
  e.preventDefault(); const r = cleanName($('nameIn').value);
  if (r.err) { $('nameErr').textContent = r.err; return; }
  $('nameIn').blur(); BE.setName(r.name).catch(() => toast('Name saved on this device. It will sync with your next score.'));
  if (pendingStart) { pendingStart = false; play(); } else { show('home'); refreshHome(); toast('Name updated'); }
});
$('nameCancel').onclick = () => { pendingStart = false; show('home'); };

function pause() { if (G.state !== 'run') return; G.state = 'paused'; show('hud', 'pause'); if (AU.ctx) AU.ctx.suspend(); }
function resume() { if (G.state !== 'paused') return; show('hud'); G.state = 'run'; if (AU.ctx) AU.ctx.resume(); big('GO', '#fff'); }

/* ---------- results + submission ---------- */
function results() {
  const wk = G.wk, s = Math.round(G.score), st = G.stats, pb = store.get('pb', 0), isPb = s > pb;
  last = { score: s, stats: st, wk: wk.key, at: Date.now(), name: store.get('name'), run: BE.run, label: wk.label };
  if (isPb) store.set('pb', s);
  const wb = store.get('wkpb'); if (!wb || wb.key !== wk.key || s > wb.score) store.set('wkpb', { key: wk.key, score: s });
  const pc = store.get('pace'); if (!pc || pc.key !== wk.key || s > pc.score) store.set('pace', { key: wk.key, score: s, t: G.trace.map(Math.round) });
  G.state = 'results'; show('results');
  $('rtitle').textContent = st.boss ? 'Run complete · objection handled' : 'Run complete';
  $('rgrade').textContent = gradeOf(s).toUpperCase(); $('rnew').textContent = isPb && pb ? 'NEW PERSONAL BEST  +' + fmt(s - pb) : isPb ? 'FIRST FLIGHT LOGGED' : 'Best ' + fmt(pb);
  const cells = [['Crystals', st.cry], ['Takedowns', st.kill], ['Near misses', st.near], ['Top combo', 'x' + st.maxMult], ['Hits taken', st.hits], ['Boss', st.boss ? st.bossAt + 's' : 'Escaped']];
  const g = $('rstats'); g.textContent = ''; cells.forEach(([l, v]) => { const d = document.createElement('div'); d.className = 'stat'; const b = document.createElement('b'); b.className = 'num'; b.textContent = v; const sp = document.createElement('span'); sp.textContent = l; d.append(b, sp); g.appendChild(d); });
  const t0 = performance.now(), el = $('rscore'); (function tick() { const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = fmt(s * (1 - Math.pow(1 - k, 3))); if (k < 1 && G.state === 'results') requestAnimationFrame(tick); else el.textContent = fmt(s); })();
  store.set('pending', last); submit();
}
function syncUI(cls, t, sub, retry) { $('rsync').className = cls; $('rsyncT').textContent = t; $('rsyncS').textContent = sub || ''; $('rretry').hidden = !retry; }
let submitting = false;
async function submit() {
  const res = store.get('pending') || last; if (!res || submitting) return; submitting = true;
  syncUI('wait', 'Saving score', 'Checking in with the leaderboard');
  try {
    const r = await Promise.race([BE.submit(res), new Promise((_, rej) => setTimeout(() => rej(new Error('Score not saved. Retry submission')), 12000))]);
    store.del('pending');
    if (r.local) syncUI('wait', 'Practice run', 'No leaderboard connection, so this score stays on this device');
    else { syncUI('ok', 'Saved to the leaderboard', ''); setTimeout(rankLine, 400); }
  } catch (e) {
    const msg = (e && e.message) || 'Score not saved. Retry submission', dead = /expired|view-only/.test(msg);
    if (dead) store.del('pending');
    syncUI('bad', dead ? msg : 'Score not saved', dead ? '' : 'Your score is safe on this device. Retry when you are back online.', !dead);
  }
  submitting = false;
}
function rankLine() {
  if (G.state !== 'results' || $('rsync').className !== 'ok') return; const b = BE.board('weekly'); if (!b || !b.you) return;
  $('rsyncT').textContent = 'Ranked #' + b.you.rank + ' this week';
  $('rsyncS').textContent = b.you.rank === 1 ? 'Top of the board' : fmt(b.you.gap + 1) + ' more to pass ' + b.you.ahead;
}
window.addEventListener('online', () => { if (store.get('pending') && G.state === 'results') submit(); });
$('rretry').onclick = submit;
$('copyBtn').onclick = () => {
  if (!last) return; const st = last.stats;
  const txt = 'RockED Hyperdrive · ' + last.label + '\n' + fmt(last.score) + ' pts · ' + gradeOf(last.score) + ' · top combo x' + st.maxMult + (st.boss ? ' · Objection handled in ' + st.bossAt + 's' : '') + '\nSame route for everyone this week. Beat it.';
  const ok = () => toast('Result copied'), no = () => toast(txt);
  try { navigator.clipboard.writeText(txt).then(ok, no); } catch (e) { no(); }
};

/* ---------- leaderboard ---------- */
function openBoard(from) { boardFrom = from; show(from === 'results' ? 'results' : 'home', 'board'); if (BE.mode === 'api') BE.refresh(lbTab); drawBoard(); clearInterval(lbTick); lbTick = setInterval(drawReset, 1000); }
function closeBoard() { clearInterval(lbTick); show(boardFrom === 'results' ? 'results' : 'home'); }
function drawReset() {
  const ms = weekInfo().end - Date.now(), d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1000) % 60;
  $('lbreset').textContent = lbTab === 'weekly' ? 'Resets in ' + (d ? d + 'd ' : '') + h + 'h ' + m + 'm' + (d ? '' : ' ' + s + 's') : 'Best score ever flown';
}
function drawBoard() {
  if ($('board').hidden) return;
  $('tabW').setAttribute('aria-selected', lbTab === 'weekly'); $('tabA').setAttribute('aria-selected', lbTab !== 'weekly');
  $('lbcourse').textContent = lbTab === 'weekly' ? weekInfo().label + ' · Mon to Sun, IST' : 'Season ' + VER.split('.')[0]; drawReset();
  const ol = $('lblist'), b = BE.mode === 'pending' ? null : BE.board(lbTab); ol.textContent = '';
  const empty = (h, p) => { const d = document.createElement('li'); d.className = 'empty'; const bb = document.createElement('b'); bb.textContent = h; d.append(bb, p); ol.appendChild(d); };
  $('lbnote').textContent = BE.mode === 'local' ? 'Practice mode: no leaderboard connection, so only your own scores show here.' : BE.readOnly ? 'You have view-only access. You can watch the board but scores will not save.' : BE.stale ? 'Showing the last ranks we could load. They may be out of date.' : '';
  if (!b || (!BE.loaded && BE.mode !== 'local')) { empty(BE.stale ? 'Leaderboard unreachable' : 'Loading ranks', BE.stale ? 'Check your connection. You can still fly.' : 'One moment.'); $('lbyou').textContent = ''; return; }
  if (!b.rows.length) empty(lbTab === 'weekly' ? 'No flights logged this week' : 'No flights logged yet', 'Fly a run and take the top spot.');
  const row = (r, sep) => { const li = document.createElement('li'); li.className = 'lb' + (r.you ? ' you' : '') + (sep ? ' sep' : ''); const a = document.createElement('span'); a.className = 'rk num'; a.textContent = r.rank; const n = document.createElement('span'); n.className = 'nm'; n.textContent = r.name; const s = document.createElement('span'); s.className = 'sc num'; s.textContent = fmt(r.score); li.append(a, n, s); ol.appendChild(li); };
  b.rows.filter(r => r.rank <= 10).forEach(r => row(r)); if (b.you && b.you.rank > 10) row(b.you, true);
  $('lbyou').textContent = !b.you ? 'You are unranked ' + (lbTab === 'weekly' ? 'this week' : 'so far') + '. Fly a run to get on the board.' : b.you.rank === 1 ? 'You hold the top spot.' : 'You are #' + b.you.rank + ' of ' + b.total + ' · ' + fmt(b.you.gap + 1) + ' more to pass ' + b.you.ahead;
}
let carried = false;
BE.subs.push(() => {
  if (G.state === 'home') refreshHome(); drawBoard(); rankLine();
  const p = store.get('pending');
  if (p && !carried && BE.mode !== 'pending' && G.state !== 'results') { carried = true; if (BE.mode === 'claude') BE.submit(p).then(() => { store.del('pending'); toast('Your last score is now on the leaderboard'); }, () => {}); else store.del('pending'); }
});
$('tabW').onclick = () => { lbTab = 'weekly'; if (BE.mode === 'api') BE.refresh(lbTab); drawBoard(); };
$('tabA').onclick = () => { lbTab = 'all-time'; if (BE.mode === 'api') BE.refresh(lbTab); drawBoard(); };
$('lbClose').onclick = closeBoard; $('homeLbBtn').onclick = () => openBoard('home'); $('resLbBtn').onclick = () => openBoard('results');

/* ---------- buttons ---------- */
$('playBtn').onclick = play; $('againBtn').onclick = start; $('resHomeBtn').onclick = goHome;
$('tutGo').onclick = start; $('tutSkip').onclick = start;
$('pauseBtn').onclick = pause; $('resumeBtn').onclick = resume; $('restartBtn').onclick = () => { if (AU.ctx) AU.ctx.resume(); start(); }; $('quitBtn').onclick = () => { if (AU.ctx) AU.ctx.resume(); goHome(); };
function syncToggles() {
  const m = $('muteBtn'); m.setAttribute('aria-pressed', AU.on); m.setAttribute('aria-label', AU.on ? 'Sound on' : 'Sound off'); $('muteWave').style.display = AU.on ? '' : 'none'; m.style.opacity = AU.on ? 1 : 0.55;
  $('tSound').setAttribute('aria-pressed', AU.on); $('tHaptic').setAttribute('aria-pressed', AU.haptic); $('tLow').setAttribute('aria-pressed', LOW); $('setName').textContent = store.get('name', 'Not set yet');
}
const togSound = () => { AU.init(); AU.setOn(!AU.on); syncToggles(); };
$('muteBtn').onclick = togSound; $('tSound').onclick = togSound;
$('tHaptic').onclick = () => { AU.haptic = !AU.haptic; store.set('haptic', AU.haptic); syncToggles(); AU.buzz(30); };
$('tLow').onclick = () => { LOW = !LOW; store.set('low', LOW); syncToggles(); };
$('setBtn').onclick = () => { syncToggles(); show('home', 'settings'); }; $('setClose').onclick = () => show('home');
$('renameBtn').onclick = () => { pendingStart = false; openName(); };
$('tutAgain').onclick = () => { store.del('tut'); show('home'); toast('Flight school will run before your next flight'); };

/* ---------- input ---------- */
const steer = e => { const r = cv.getBoundingClientRect(); ship.tx = clamp((e.clientX - r.left - W / 2) / RW, -0.95, 0.95); };
let dragId = null;
cv.addEventListener('pointerdown', e => { if (G.state !== 'run') return; dragId = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (x) {} steer(e); e.preventDefault(); });
cv.addEventListener('pointermove', e => { if (G.state !== 'run') return; if (e.pointerId === dragId || e.pointerType === 'mouse') steer(e); });
['pointerup', 'pointercancel'].forEach(n => cv.addEventListener(n, e => { if (e.pointerId === dragId) dragId = null; }));
$('boost').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); boost(); });
$('boost').addEventListener('click', e => { if (e.detail === 0) boost(); });
document.addEventListener('touchmove', e => { if (G.state === 'run') e.preventDefault(); }, { passive: false });
window.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keys.l = 1; else if (k === 'arrowright' || k === 'd') keys.r = 1;
  else if (k === ' ' && (G.state === 'run')) { e.preventDefault(); boost(); }
  else if (k === 'escape' || k === 'p') { if (G.state === 'run') pause(); else if (G.state === 'paused') resume(); else if (!$('board').hidden) closeBoard(); }
});
window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') keys.l = 0; else if (k === 'arrowright' || k === 'd') keys.r = 0; });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', pause);
function fit() { resize(); const land = window.innerWidth > window.innerHeight && window.innerHeight < 430; $('rotate').hidden = !land; if (land) pause(); }
window.addEventListener('resize', fit); window.addEventListener('orientationchange', fit);

/* ---------- HUD (only touches the DOM when a value changes) ---------- */
const HC = {};
const set = (k, v, f) => { if (HC[k] !== v) { HC[k] = v; f(v); } };
const FXN = { triple: ['TRIPLE', COL.amber], magnet: ['MAGNET', COL.lilac], bubble: ['BUBBLE', COL.cyan] };
function hudFrame() {
  if (G.state !== 'run' && G.state !== 'outro') return;
  set('s', Math.round(G.shown), v => { $('score').textContent = fmt(v); });
  set('t', Math.ceil(CFG.RUN - G.clock), v => { $('timer').textContent = '0:' + (v < 10 ? '0' : '') + v; if (v <= 5 && v > 0) AU.sfx('tick'); });
  const m = Math.min(CFG.MULT_CAP, G.mult * (G.routeT > 0 ? 2 : 1));
  set('m', m + (G.routeT > 0 ? 'r' : ''), () => { const e = $('mult'); e.textContent = 'x' + m; e.classList.toggle('route', G.routeT > 0); });
  set('k', G.mult >= CFG.MULT_CAP ? 5 : G.streak % CFG.MULT_STEP, v => { const c = $('streak').children; for (let i = 0; i < 5; i++) c[i].className = i < v ? 'on' : ''; });
  set('p', G.shields, v => { const c = $('pips').children; for (let i = 1; i < 4; i++) c[i].className = i <= v ? 'on' : ''; $('pips').setAttribute('aria-label', 'Shields ' + v + ' of 3'); });
  const bst = G.boostT > 0, bv = bst ? G.boostT / CFG.BOOST_T : G.charge;
  set('c', Math.round(bv * 50), v => { $('boost').style.setProperty('--c', v / 50); });
  set('b', bst ? 2 : G.charge >= 1 ? 1 : 0, v => { const b = $('boost'); b.classList.toggle('full', v === 1); b.classList.toggle('live', v === 2); b.setAttribute('aria-label', v === 1 ? 'Boost ready' : 'Boost charging'); });
  const act = Object.keys(G.fx).filter(k => G.fx[k] > 0);
  set('f', act.join(), () => { const box = $('fx'); box.textContent = ''; act.forEach(k => { const d = document.createElement('div'); d.className = 'fxchip'; d.style.color = FXN[k][1]; d.textContent = FXN[k][0]; d.appendChild(document.createElement('i')); d.dataset.k = k; box.appendChild(d); }); });
  for (const d of $('fx').children) d.lastChild.style.transform = 'scaleX(' + clamp(G.fx[d.dataset.k] / CFG.FX_T, 0, 1) + ')';
  let a = 0; const seg = $('prog').children; for (let i = 0; i < 5; i++) { const b = CFG.PHASES[i]; seg[i].firstChild.style.transform = 'scaleX(' + clamp((G.clock - a) / (b - a), 0, 1) + ')'; a = b; }
  if (G.boss && !G.boss.dead) set('h', Math.max(0, G.boss.pods[0]) + Math.max(0, G.boss.pods[1]) + G.boss.core, v => { $('bosshp').style.transform = 'scaleX(' + v / (CFG.BOSS_POD * 2 + CFG.BOSS_CORE) + ')'; });
  if (G.pace) {
    const i = Math.min(G.pace.t.length - 2, Math.floor(G.clock)), ref = lerp(G.pace.t[i] || 0, G.pace.t[i + 1] || 0, G.clock - i), d = Math.round((G.score - ref) / 50) * 50;
    set('d', d, v => { const e = $('pace'); e.textContent = (v >= 0 ? '+' : '-') + fmt(Math.abs(v)) + ' vs your best'; e.className = 'num ' + (v >= 0 ? 'up' : 'dn'); });
  } else set('d', 'x', () => { $('pace').textContent = ''; });
}

/* ---------- main loop ---------- */
let lastTs = 0, acc = 0, slow = 0, fast = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (ts - lastTs) / 1000 || 0); lastTs = ts; G.now += dt;
  if (G.state === 'run') {
    acc += dt * G.speed; let n = 0; while (acc >= STEP && n < 600 && G.state === 'run') { sim(STEP); acc -= STEP; n++; } if (n >= 600) acc = 0;
    if (dt > 0.024) { if (++slow > 45 && Q > 0) { Q--; slow = 0; resize(); } } else if (slow > 0) slow--;
  } else if (G.state === 'outro') { G.outro += dt / 1.15; if (G.outro >= 1) results(); }
  render(dt); hudFrame();
}
function boot() {
  fit(); syncToggles(); BE.init();
  const ready = () => { if (G.state === 'load') goHome(); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(ready); setTimeout(ready, 1400);
  requestAnimationFrame(frame);
}
window.__hd = { G, ship, BE, CFG, AU, start, play, weekInfo, buildCourse, cleanName, results };
boot();

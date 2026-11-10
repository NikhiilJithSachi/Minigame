/* ---------- leaderboard backends ----------
   'claude' : this page's shared store (live, used when the game runs as a Claude artifact)
   'api'    : the Netlify Functions + Supabase contract from the handoff spec
   'local'  : practice mode, nothing leaves the browser */
const BE = {
  mode: 'pending', uid: null, db: null, rows: [], loaded: false, stale: false, readOnly: false, run: null, subs: [], cache: {},
  emit() { this.subs.forEach(f => { try { f(); } catch (e) {} }); },
  cred() { let c = store.get('cred'); if (!c) { const a = new Uint8Array(24); crypto.getRandomValues(a); c = Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); store.set('cred', c); } return c; },
  async init() {
    try {
      const c = window.claude;
      if (c && c.use) {
        const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
        const id = db && user ? await user.id() : null;
        if (id) {
          this.mode = 'claude'; this.db = db; this.uid = id;
          const slow = setTimeout(() => { if (!this.loaded) { this.stale = true; this.emit(); } }, 10000);
          db.collection('pilots').onSnapshot(s => {
            this.rows = s.docs.map(d => Object.assign({ id: d.id }, d.data())); this.loaded = true; this.stale = !!s.metadata.fromCache;
            if (!this.stale) clearTimeout(slow); this.emit();
          }, () => { clearTimeout(slow); this.stale = true; this.emit(); });
          return this.emit();
        }
      } else if (/^https?:/.test(location.protocol)) {
        const r = await fetch('/api/leaderboard?period=weekly', { headers: { 'x-pilot': store.get('pid', '') + ':' + this.cred() } });
        if (r.ok && (r.headers.get('content-type') || '').includes('json')) { this.cache.weekly = await r.json(); this.mode = 'api'; this.loaded = true; return this.emit(); }
      }
    } catch (e) {}
    this.mode = 'local'; this.emit();
  },
  async api(path, body) {
    const r = await fetch('/api' + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : { headers: { 'x-pilot': store.get('pid', '') + ':' + this.cred() } });
    const j = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error(j.error || 'failed'); e.status = r.status; throw e; } return j;
  },
  async setName(name) {
    store.set('name', name);
    if (this.mode === 'api') { const j = await this.api('/pilots', { display_name: name, credential: this.cred(), player_id: store.get('pid') || undefined }); store.set('pid', j.player_id); }
    else if (this.mode === 'claude') { const ref = this.db.doc('pilots/' + this.uid), s = await ref.get(); if (s.exists) await ref.set(Object.assign({}, s.data(), { name })); }
  },
  startRun() {
    this.run = null; if (this.mode !== 'api') return;
    const go = async () => { if (!store.get('pid')) await this.setName(store.get('name')); this.run = await this.api('/runs/start', { player_id: store.get('pid'), credential: this.cred() }); };
    go().catch(() => {});
  },
  /* resolves {saved:true} | {saved:false, local:true}; rejects with a short reason */
  async submit(res) {
    if (this.mode === 'pending') await new Promise(r => { const f = () => { if (this.mode !== 'pending') r(); }; this.subs.push(f); setTimeout(r, 11000); });
    if (this.mode === 'api') {
      if (!res.run) throw new Error('Run expired. Play again');
      const j = await this.api('/runs/finish', { run_id: res.run.run_id, token: res.run.token, score: res.score, summary: res.stats });
      delete this.cache.weekly; delete this.cache['all-time']; return { saved: true, rank: j.weekly_rank };
    }
    if (this.mode === 'claude') {
      const ref = this.db.doc('pilots/' + this.uid), s = await ref.get();
      const d = s.exists ? Object.assign({}, s.data()) : { best: 0, runs: 0 };
      d.name = res.name; d.runs = (d.runs || 0) + 1; d.v = VER;
      if (res.score > (d.best || 0)) { d.best = res.score; d.bestAt = res.at; }
      if (d.wk !== res.wk) { d.wk = res.wk; d.wkBest = 0; d.wkAt = res.at; }
      if (res.score > (d.wkBest || 0)) { d.wkBest = res.score; d.wkAt = res.at; }
      try { await ref.set(d); } catch (e) { if (e && e.code === 'invalid_argument') { this.readOnly = true; throw new Error('You have view-only access, so scores cannot be saved'); } throw new Error('Score not saved. Retry submission'); }
      return { saved: true };
    }
    return { saved: false, local: true };
  },
  /* normalised board: {rows:[{name,score,you}], you:{rank,score,gap,ahead}|null, total} */
  board(period) {
    const wk = weekInfo().key; let list;
    if (this.mode === 'claude') {
      list = this.rows.map(r => period === 'weekly' ? (r.wk === wk ? { id: r.id, name: r.name, score: r.wkBest | 0, at: r.wkAt || 0 } : null) : { id: r.id, name: r.name, score: r.best | 0, at: r.bestAt || 0 })
        .filter(r => r && r.score > 0 && typeof r.name === 'string').sort((a, b) => b.score - a.score || a.at - b.at || (a.id < b.id ? -1 : 1));
      list.forEach((r, i) => { r.rank = i + 1; r.you = r.id === this.uid; });
    } else if (this.mode === 'api') {
      const c = this.cache[period]; if (!c) return null; list = c.rows.map(r => ({ name: r.display_name, score: r.score, rank: r.rank, you: !!r.you }));
      if (c.you && !list.some(r => r.you)) list.push({ name: store.get('name', 'You'), score: c.you.score, rank: c.you.rank, you: true });
    } else {
      const pb = store.get('pb'), wb = store.get('wkpb'); const s = period === 'weekly' ? (wb && wb.key === wk ? wb.score : 0) : (pb || 0);
      list = s > 0 ? [{ name: store.get('name', 'You'), score: s, rank: 1, you: true }] : [];
    }
    const me = list.find(r => r.you) || null, ahead = me && me.rank > 1 ? list.find(r => r.rank === me.rank - 1) : null;
    return { rows: list, you: me && Object.assign({ gap: ahead ? ahead.score - me.score : 0, ahead: ahead ? ahead.name : '' }, me), total: list.length };
  },
  async refresh(period) { if (this.mode !== 'api') return; try { this.cache[period] = await this.api('/leaderboard?period=' + period); this.stale = false; store.set('lb.' + period, this.cache[period]); } catch (e) { this.cache[period] = this.cache[period] || store.get('lb.' + period); this.stale = true; } this.emit(); }
};

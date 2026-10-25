// Scripted human saboteur in seat 0 (port of sim/playtest/play.js) for the current engine; handles six-spare hands.
const STRATS = {
  exploit: { self: true, lie: true, aim: 'min' },
  subtle: { self: false, lie: false, aim: 'small' },
};
const SUBSETS = [[], [0], [1], [2], [0, 1], [0, 2], [1, 2]];

// every legal (swaps, picks) for seat 0's spares
function options(s) {
  const D = s.work[0].D, out = [];
  const bySuit = [0, 1, 2].map(su => D.map((c, k) => (c.s === su ? k : -1)).filter(k => k >= 0));
  for (const sw of SUBSETS) {
    const go = (i, picks) => {
      if (i === sw.length) return out.push({ swaps: sw, picks: picks.slice() });
      for (const k of bySuit[sw[i]]) { picks[sw[i]] = k; go(i + 1, picks); }
    };
    go(0, D.length > 3 ? [0, 1, 2].map(su => bySuit[su][0]) : [0, 1, 2]);
  }
  return out;
}
function work(OP, s, st) {
  const { evs, ev, workResult, workCost } = OP;
  let best = null;
  for (const o of options(s)) {
    const w = { swaps: o.swaps, picks: o.picks, reveals: [], redeal: false };
    if (workCost(w) > 3) continue;
    const prop = workResult(s, 0, w).prop, v = evs(prop), left = 3 - workCost(w);
    const rev = [0, 1, 2].filter(su => ev(prop[su]) > 0).sort((a, b) => ev(prop[b]) - ev(prop[a])).slice(0, left);
    const shown = rev.reduce((a, su) => a + ev(prop[su]), 0);
    const key = st.aim === 'min' ? [-v, shown] : [v <= -1 && v >= -2 ? 2 : v === 0 ? 1 : 0, shown - v];
    if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && key[1] > best.key[1])) best = { key, o, rev };
  }
  const a = { type: 'submitWork', swaps: best.o.swaps, picks: best.o.picks, reveals: best.rev, stamp: s.ceo === 0 && st.self ? 'Risky' : 'Rec' };
  const inh = s.P[0].inh;
  if (inh.kind === 'rejected' && inh.author != null && inh.author !== 0) {
    const tv = evs(inh.cards);
    if (st.lie) a.claim = { kind: 'report', stamp: 'Rec', val: -4 };
    else if (inh.stamp === 'Rec' && tv <= -1) a.claim = { kind: 'report', stamp: inh.stamp, val: tv };
  }
  return a;
}
function pick(OP, s, st) {
  const { evs, estimate } = OP;
  const own = s.envs.find(e => e.author === 0 && !e.autopilot);
  if (st.self && own) return own.id;
  const val = e => (e.author === 0 || e.autopilot ? evs(e.cards) : estimate(e, 'smart', true));
  const top = Math.max(...s.envs.map(val));
  const pool = st.aim === 'min' ? s.envs : s.envs.filter(e => val(e) >= top - 2);
  return pool.reduce((b, e) => (val(e) < val(b) ? e : b)).id;
}
function warn(s) {
  const mine = s.memos.find(m => m.by === 0 && m.kind === 'report');
  if (mine && !s.P[mine.target].leave) return String(mine.target);
  const c = Object.keys(s.accused).map(Number).filter(t => t !== 0 && !s.P[t].leave && !s.P[t].sab);
  return c.length ? String(c[0]) : 'none';
}
function play(OP, n, seed, strat) {
  const st = STRATS[strat];
  let s = OP.newGame({ players: n, seed });
  if (!s.P[0].sab) { const o = s.P.find(p => p.sab); if (o) o.sab = false; else s.nSab = 1; s.P[0].sab = true; }
  const go = a => { const r = OP.apply(s, 0, a); if (r.error) throw new Error(s.phase + ' ' + r.error); s = r.state; };
  go({ type: 'begin' });
  for (let k = 0; s.phase !== 'end'; k++) {
    if (k > 400) throw new Error('loop');
    if (s.phase === 'work') go(work(OP, s, st));
    else if (s.phase === 'decide') go(s.ceo === 0 ? { type: 'approve', id: pick(OP, s, st) } : { type: 'advance' });
    else if (s.phase === 'board') go({ type: 'boardVote', vote: 'ratify' });
    else if (s.phase === 'reveal') go({ type: 'warnVote', target: warn(s) });
    else if (s.phase === 'review') go({ type: 'advance' });
    else if (s.phase === 'whistle') go({ type: 'whistleVote', target: String(s.P.filter(p => p.id !== 0 && !p.sab).sort((a, b) => b.accusations - a.accusations)[0].id) });
  }
  return s;
}
module.exports = { play, options, STRATS };

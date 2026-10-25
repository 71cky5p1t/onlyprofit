const OP = require('./engine-x.js');
const { evs, ev, workResult, workCost, estimate } = OP;
const SUBSETS = [[], [0], [1], [2], [0, 1], [0, 2], [1, 2]];
// Seat 0 strategies for a human saboteur.
const STRATS = {
  // Codex's line: worst envelope, show the good card, Risky when CEO (self-approve), lie about every handover, warn your mark.
  exploit: { self: true, lie: true, aim: 'min' },
  // Same but never self-approves; as CEO picks the worst plausible envelope.
  noself: { self: false, lie: true, aim: 'min' },
  // Subtle: small losses that look fine, Recommended, truthful memos, CEO denies the best within slack.
  subtle: { self: false, lie: false, aim: 'small' },
  // Blatant and honest: worst envelope, Recommended, no memos.
  blatant: { self: true, lie: false, aim: 'min', nomemo: true },
};
function humanWork(s, st) {
  const me = s.P[0], ceo = s.ceo === 0;
  let best = null;
  for (const sw of SUBSETS) {
    const w = { swaps: sw, reveals: [], redeal: false };
    if (workCost(w) > 3) continue;
    const { prop } = workResult(s, 0, w); const v = evs(prop);
    const left = 3 - workCost(w);
    const rev = [0, 1, 2].filter(su => ev(prop[su]) > 0).sort((a, b) => ev(prop[b]) - ev(prop[a])).slice(0, left);
    const shown = rev.reduce((a, su) => a + ev(prop[su]), 0);
    let key;
    if (st.aim === 'min') key = [-v, shown];
    else key = [v <= -1 && v >= -2 ? 2 : v === 0 ? 1 : 0, shown - v]; // small loss that looks good
    if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && key[1] > best.key[1])) best = { key, sw, rev, v };
  }
  const a = { type: 'submitWork', swaps: best.sw, reveals: best.rev, stamp: ceo && st.self ? 'Risky' : 'Rec' };
  const inh = me.inh;
  if (!st.nomemo && inh.kind === 'rejected' && inh.author != null && inh.author !== 0) {
    const tv = evs(inh.cards);
    if (st.lie) a.claim = { kind: 'report', stamp: 'Rec', val: -4 };
    else if (inh.stamp === 'Rec' && tv <= -1) a.claim = { kind: 'report', stamp: inh.stamp, val: tv };
  }
  return a;
}
function humanPick(s, st) {
  const own = s.envs.find(e => e.author === 0 && !e.autopilot);
  if (st.self && own && !(s.x.noSelf)) return own.id;
  const others = s.envs.filter(e => e.author !== 0 || e.autopilot);
  const val = e => (e.audited || e.autopilot ? evs(e.cards) : estimate(e, 'smart', true));
  const top = Math.max(...s.envs.map(val));
  const pool = (st.aim === 'min' ? s.envs : s.envs.filter(e => val(e) >= top - 2));
  const pool2 = s.x.noSelf ? pool.filter(e => e.author !== 0) : pool; const pick = (pool2.length ? pool2 : others).reduce((b, e) => ((e.author === 0 ? evs(e.cards) : val(e)) < (b.author === 0 ? evs(b.cards) : val(b)) ? e : b));
  return (pick || others[0]).id;
}
function humanWarn(s, st) {
  const mine = s.memos.find(m => m.by === 0 && m.kind === 'report');
  if (mine && !s.P[mine.target].leave) return String(mine.target);
  const c = Object.keys(s.accused).map(Number).filter(t => t !== 0 && !s.P[t].leave && !s.P[t].sab);
  return c.length ? String(c[0]) : 'none';
}
function play(n, seed, x, strat) {
  let s = OP.newGame({ players: n, seed, spectate: !strat, x, sabTier: x.sabTier });
  if (strat) {
    if (!s.P[0].sab) { const o = s.P.find(p => p.sab); if (o) o.sab = false; else s.nSab = 1; s.P[0].sab = true; }
  }
  const st = STRATS[strat];
  const go = (seat, a) => { const r = OP.apply(s, seat, a); if (r.error) throw new Error(s.phase + ' ' + JSON.stringify(a) + ' ' + r.error); s = r.state; };
  const after = []; let k = 0;
  if (strat) go(0, { type: 'begin' });
  while (s.phase !== 'end') {
    if (++k > 400) throw new Error('loop');
    if (!strat) { go(-1, { type: 'advance' }); }
    else if (s.phase === 'work') go(0, humanWork(s, st));
    else if (s.phase === 'pitch') go(0, { type: 'auditVote', target: 'none' });
    else if (s.phase === 'decide') { if (s.ceo === 0) go(0, { type: 'approve', id: humanPick(s, st) }); else go(0, { type: 'advance' }); }
    else if (s.phase === 'reveal') go(0, { type: 'warnVote', target: humanWarn(s, st) });
    else if (s.phase === 'review') go(0, { type: 'advance' });
    else if (s.phase === 'whistle') { const c = s.P.filter(p => p.id !== 0 && !p.sab).sort((a, b) => b.accusations - a.accusations)[0]; go(0, { type: 'whistleVote', target: String(c.id) }); }
    if (s.ledger.length > after.length) after.push(s.profit);
  }
  return { s, after };
}
module.exports = { play, STRATS };
if (require.main === module) {
  const [, , strat = '', nArg = '4', G = '1000', xs = '{}'] = process.argv;
  const x = JSON.parse(xs);
  const ns = nArg.split(',').map(Number);
  for (const n of ns) {
    let win = 0, games = 0, sabG = 0, sabWin = 0, pivotal = 0, dead = 0, lv = 0, wrongLv = 0, live4 = 0, marg = 0, humanLv = 0, humanCaught = 0;
    for (let i = 1; i <= +G; i++) {
      const { s, after } = play(n, i * 7919 + n, x, strat || null);
      games++; win += s.win;
      if (s.nSab) { sabG++; sabWin += !s.win; }
      const sw = (s.whistle && s.whistle.named != null) ? s.whistle.swing ?? (s.whistle.correct ? 3 : -3) : 0;
      const pre = s.profit - sw;
      if ((pre >= s.target) !== s.win) pivotal++;
      // "decided" before Q5: needs more than +6 or already over with a cushion of 6
      const q4 = after[3]; if (Math.abs(s.target - q4 - 3) <= 4) live4++;
      lv += s.P.filter(p => p.leave).length; wrongLv += s.P.filter(p => p.leave && !p.sab).length;
      marg += Math.abs(s.profit - s.target);
      if (strat) { humanLv += s.P[0].leave; humanCaught += s.whistle.named === 0; }
    }
    const f = v => (v * 100).toFixed(0) + '%';
    console.log(`${strat || 'bots'} ${n}p x=${xs}: company ${f(win / games)} | sab wins ${f(sabWin / Math.max(1, sabG))} | whistle pivotal ${f(pivotal / games)} | close going into Q5 ${f(live4 / games)} | stood down/g ${(lv / games).toFixed(2)} (loyal ${(wrongLv / games).toFixed(2)}) | |margin| ${(marg / games).toFixed(1)}` + (strat ? ` | you stood down ${f(humanLv / games)} named ${f(humanCaught / games)}` : ''));
  }
}

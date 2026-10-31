// Petty Cash: bot games finish cleanly, and a scripted human can reach every choice.
const assert = require('assert');
const PC = require('../src/petty/engine/core.js');

const sane = s => {
  for (const p of s.P) assert(Number.isFinite(p.bank), 'bank is a number');
  assert(Number.isFinite(s.tin), 'tin is a number');
};

// spectated bot games
let games = 0;
for (const co of Object.keys(PC.CO)) for (const n of [4, 5, 6]) for (let seed = 1; seed <= 40; seed++) {
  let s = PC.newGame({ players: n, co, seed, spectate: true }), steps = 0;
  while (s.phase !== 'end') {
    const r = PC.apply(s, 0, { type: 'advance' });
    assert(!r.error, `${co} ${n}p seed ${seed}: ${r.error} in ${s.phase}`);
    s = r.state; sane(s);
    assert(++steps < 5000, 'game ends');
  }
  assert(s.end && s.end.ranked.length === n);
  for (const c of s.claims) assert(c.outcome, 'every claim settles');
  games++;
}

// a human who tries everything
const seen = new Set();
for (let seed = 1; seed <= 150; seed++) {
  const co = Object.keys(PC.CO)[seed % 3];
  let s = PC.newGame({ players: 4 + seed % 3, co, seed });
  const go = a => { const r = PC.apply(s, 0, a); if (!r.error) { s = r.state; seen.add(a.type + (a.call || '') + (a.use != null ? a.use : '') + (a.free != null ? a.free : '')); } return r; };
  assert(!go({ type: 'shop', answers: [{ q: 0, text: 'a jar of teeth' }, { q: 4, text: 'my nan' }] }).error);
  assert(s.pile.concat(...s.P.map(p => p.hand)).some(c => c.by === 0 && c.name === 'A jar of teeth'), 'write-ins join the pile, tidied');
  let steps = 0;
  while (s.phase !== 'end') {
    assert(++steps < 5000, 'human game ends');
    if (!PC.needsHuman(s)) { const r = go({ type: 'advance' }); assert(!r.error, r.error); continue; }
    const me = s.P[0], has = k => me.hand.find(c => c.k === 'act' && c.v === k);
    if (s.phase === 'roll') go({ type: 'roll' });
    else if (s.phase === 'pick') {
      for (const k of ['creative', 'key', 'freeze']) if (has(k) && s.phase === 'pick') go({ type: 'play', card: has(k).id });
      if (has('letter') && s.phase === 'pick') go({ type: 'play', card: has('letter').id, target: 1 });
      if (s.phase !== 'pick') continue;
      const what = me.hand.find(c => c.k === 'what'), who = me.hand.find(c => c.k === 'who');
      assert(!go(what ? { type: 'pick', what: what.id, who: who ? who.id : null } : { type: 'pick', skip: true }).error);
    } else if (s.phase === 'claim') {
      const c = s.cur;
      assert(c.real === Math.max(0, Math.round(c.guide * c.m / 5) * 5), 'real = guide × surcharge');
      assert(!go({ type: 'claim', amount: steps % 2 ? c.real : c.real * 2, nephew: steps % 3 === 0 && !!has('nephew') }).error);
    } else if (s.phase === 'audit') {
      if (has('peek') && !s.cur.peeks.includes(0)) go({ type: 'play', card: has('peek').id });
      assert(!go({ type: 'audit', call: steps % 2 ? 'audit' : 'sign' }).error);
    } else if (s.phase === 'shred') assert(!go({ type: 'shred', use: steps % 2 === 0 }).error);
    else if (s.phase === 'rent') assert(!go({ type: 'rent', free: steps % 2 === 0 }).error);
    else assert.fail('stuck in ' + s.phase);
    sane(s);
  }
  for (const c of s.claims) assert(c.outcome, 'every claim settles, including ones you audited');
}
for (const k of ['shop', 'roll', 'play', 'pick', 'claim', 'auditaudit', 'auditsign', 'shredtrue', 'shredfalse', 'renttrue', 'rentfalse']) assert(seen.has(k), 'reached ' + k);
// out-of-turn moves are refused
const s0 = PC.newGame({ players: 5, co: 'party', seed: 9 });
assert(PC.apply(s0, 0, { type: 'roll' }).error, 'no rolling during the quick-fire');
console.log(`petty: ${games} bot games and 150 human games OK`);

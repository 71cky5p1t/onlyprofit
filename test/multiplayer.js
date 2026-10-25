const assert = require('node:assert/strict');
const OP = require('../src/engine/core');
const { viewFor } = require('../src/engine/views');
const roster = n => Array.from({ length: n }, (_, i) => ({ name: 'Employee ' + i, human: true }));
for (const n of [4, 8]) for (let seed = 1; seed <= 12; seed++) {
  let s = OP.newGame({ roster: roster(n), seed });
  const go = (seat, a) => { const before = JSON.stringify(s), result = OP.apply(s, seat, a); assert.equal(result.error, undefined); assert.equal(JSON.stringify(s), before); s = result.state; };
  go(-1, { type: 'begin' });
  for (let turn = 0; s.phase !== 'end' && turn < 100; turn++) {
    if (s.phase === 'work') {
      const seats = Object.keys(s.work).map(Number);
      assert.equal(seats.length, n);
      for (const [k, seat] of seats.entries()) {
        go(seat, { type: 'submitWork', picks: [3, 4, 5], swaps: [0, 1], reveals: [], stamp: 'Risky' });
        if (k < n - 1) assert.equal(s.phase, 'work');
      }
    } else if (s.phase === 'decide') {
      const tv = viewFor(s, 'tv');
      assert.equal(tv.self, null);
      assert(tv.envelopes.every(e => e.author === null && e.cards.every(c => c === null)));
      for (let seat = 0; seat < n; seat++) {
        const v = viewFor(s, seat), other = s.envs.find(e => e.author !== seat);
        assert.equal(v.self.sab, s.P[seat].sab);
        assert.equal(v.players[seat].sab, undefined);
        assert(!('rs' in v) && !('deck' in v) && !('history' in v));
        assert(v.envelopes.find(e => e.id === other.id).cards.every(c => c === null));
        assert.equal(v.envelopes.find(e => e.id === other.id).author, s.P[seat].spec === 'Auditor' ? other.author : null);
      }
      go(s.ceo, { type: 'approve', id: s.envs[0].id });
    } else if (s.phase === 'board') {
      const seats = s.P.filter(p => p.id !== s.ceo).map(p => p.id);
      for (const [k, seat] of seats.entries()) { go(seat, { type: 'boardVote', vote: 'ratify' }); if (k < seats.length - 1) assert.equal(s.phase, 'board'); }
    } else if (s.phase === 'reveal') {
      for (let seat = 0; seat < n; seat++) { go(seat, { type: 'warnVote', target: 'none' }); if (seat < n - 1) assert.equal(s.phase, 'reveal'); }
    } else if (s.phase === 'review') go(-1, { type: 'advance' });
    else if (s.phase === 'whistle') for (let seat = 0; seat < n; seat++) { go(seat, { type: 'whistleVote', target: 'none' }); if (seat < n - 1) assert.equal(s.phase, 'whistle'); }
  }
  assert.equal(s.phase, 'end'); assert.equal(s.ledger.length, 5);
}
let s = OP.newGame({ roster: roster(8), seed: 20 });
s = OP.apply(s, -1, { type: 'begin' }).state;
for (let i = 0; i < 8; i++) s = OP.apply(s, i, { type: 'submitWork', stamp: 'Rec', reveals: [0] }).state;
const e = s.envs.find(e => e.author !== s.ceo); e.openTo = [s.ceo];
assert(viewFor(s, s.ceo).envelopes.find(x => x.id === e.id).cards.every(Boolean));
assert.equal(viewFor(s, 'tv').envelopes.find(x => x.id === e.id).cards.filter(Boolean).length, 1);
s.invq = { r: 1, t: e.author, guilty: true };
assert.equal(viewFor(s, 'tv').self, null);
assert.equal(viewFor(s, s.ceo).self.investigation.guilty, true);
assert.equal(viewFor(s, e.author).self.investigation, null);
console.log('Multi-human rounds, vote barriers, immutable actions and private projections passed.');

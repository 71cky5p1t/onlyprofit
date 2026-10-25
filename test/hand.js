const assert = require('node:assert/strict');
const OP = require('../src/engine/core.js');
function liveCards(s) {
  const cards = s.deck.piles.flat().concat(s.deck.disc.flat());
  if (s.phase === 'brief' || s.phase === 'whistle' || s.phase === 'end') return cards.concat(s.hands.flatMap(h => h.cards));
  cards.push(...s.envs.flatMap(e => e.cards), ...Object.values(s.left).flat());
  for (const [seat, w] of Object.entries(s.work)) cards.push(...s.P[seat].inh.cards, ...w.D, ...w.R);
  return cards;
}
for (const players of [4, 5, 6, 7, 8]) for (let seed = 1; seed <= 24; seed++) {
  let s = OP.newGame({ players, seed });
  const go = action => {
    const before = JSON.stringify(s), r = OP.apply(s, 0, action);
    assert.equal(JSON.stringify(s), before, 'apply mutated its input');
    assert.ok(!r.error, r.error); s = r.state;
    const cards = liveCards(s);
    assert.equal(cards.length, 144, 'lost or duplicated physical cards');
    assert.ok(cards.every(c => c && Number.isInteger(c.s)));
    assert.equal(new Set(cards.map(c => c.id)).size, 144, 'duplicate live card ID');
  };
  go({ type: 'begin' });
  let steps = 0;
  while (s.phase !== 'end') {
    assert.ok(++steps < 70);
    if (s.phase === 'work') {
      const D = s.work[0].D;
      assert.equal(D.length, 6);
      for (const su of [0, 1, 2]) assert.equal(D.filter(c => c.s === su).length, 2);
      const redeal = seed % 2 === 0, swaps = redeal ? [2] : [0, 1], picks = [3, 4, 5];
      const action = { type: 'submitWork', stamp: 'Risky', swaps, picks, redeal, reveals: [] };
      const before = JSON.stringify(s);
      for (const bad of [[4, 3, 5], [3, 4, 99], [3.5, 4, 5], [3, 4], 'bad']) {
        assert.ok(OP.apply(s, 0, { ...action, picks: bad }).error);
      }
      assert.ok(OP.apply(s, 0, { ...action, swaps: [0, 1, 2] }).error);
      assert.equal(JSON.stringify(s), before);
      const expected = swaps.map(su => D[picks[su]].id);
      go(action);
      const own = s.envs.find(e => e.author === 0);
      assert.deepEqual(swaps.map(su => own.cards[su].id), expected);
    } else if (s.phase === 'decide') go(s.ceo === 0 ? { type: 'approve', id: s.envs[0].id } : { type: 'advance' });
    else if (s.phase === 'board') go({ type: 'boardVote', vote: 'open' });
    else if (s.phase === 'reveal') go({ type: 'warnVote', target: 'none' });
    else if (s.phase === 'review') go({ type: 'advance' });
    else if (s.phase === 'whistle') go({ type: 'whistleVote', target: 'none' });
  }
  assert.ok(s.hands.every(h => h.cards.length === 3 && h.cards.every((c, su) => c.s === su)));
}
console.log('Six-card hand: choices, invalid actions, immutability, conservation and five-quarter handovers passed (120 games).');

// Current Petty Cash, measured through the real engine.
const PC = require('../../src/petty/engine/core.js');
function game(n, seed) {
  let s = PC.newGame({ players: n, co: ['party', 'funeral', 'mining'][seed % 3], seed, spectate: true });
  const laps = [s.P.map(p => p.bank)]; let lap = s.lap, decisions = 0, close = 0, interact = 0, moments = 0, flows = 0, moved = 0;
  while (s.phase !== 'end') {
    const r = PC.apply(s, -1, { type: 'advance' }); s = r.state;
    for (const e of r.events) {
      if (e.kind === 'claim') decisions += 1 + (n - 1); // a claim plus everyone's sign/audit call
      // padding is a real dilemma only when rent is biting
      if (e.kind === 'roll') for (const p of s.P) if (p.bank < PC.rentFor(s, p.id)) close++;
      if (e.kind === 'caught' || e.kind === 'halo') { moments++; interact++; }
    }
    if (s.lap !== lap || s.phase === 'end') { laps.push(s.P.map(p => p.bank)); lap = s.lap; }
  }
  return { laps, decisions, close, interact: interact / Math.max(1, s.claims.length), moments };
}
module.exports = { game, name: 'Petty Cash today' };

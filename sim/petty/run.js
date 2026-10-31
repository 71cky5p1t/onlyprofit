// Petty Cash bot games: how much padding rent forces, how often the tin goes under, who wins.
const PC = require('../../src/petty/engine/core.js');
function play(n, seed, co) {
  let s = PC.newGame({ players: n, seed, co, spectate: true }), k = 0;
  while (s.phase !== 'end') { const r = PC.apply(s, -1, { type: 'advance' }); if (r.error) throw new Error(r.error + ' ' + s.phase); s = r.state; if (++k > 2000) throw new Error('loop'); }
  return s;
}
function measure(n, co, G) {
  const m = { bust: 0, claims: 0, pads: 0, forced: 0, audits: 0, caught: 0, halo: 0, shred: 0, nephew: 0, debtors: 0, winPad: 0, winClaims: 0, laps: 0 };
  for (let g = 1; g <= G; g++) {
    const s = play(n, g * 7919 + n, co);
    m.bust += s.end.bust; m.laps += Math.min(s.lap, PC.T.laps);
    for (const c of s.claims) { m.claims++; if (c.claim > c.real) m.pads++; if (c.auditor != null && !c.nephew) m.audits++; if (c.outcome === 'caught') m.caught++; if (c.outcome === 'halo') m.halo++; if (c.outcome === 'shredded') m.shred++; if (c.nephew) m.nephew++; }
    m.debtors += s.P.filter(p => p.bank < 0).length;
    const w = s.P[s.end.winner]; m.winPad += w.pads; m.winClaims += w.claims;
  }
  const pc = (a, b) => (100 * a / Math.max(1, b)).toFixed(0) + '%';
  return { co, n, commission: pc(m.bust, G), lapsPlayed: (m.laps / G).toFixed(1), padded: pc(m.pads, m.claims), winnerPadded: pc(m.winPad, m.winClaims), auditsPerGame: (m.audits / G).toFixed(1), caught: pc(m.caught, m.audits), halos: pc(m.halo, m.audits), shredPerGame: (m.shred / G).toFixed(2), inDebtAtEnd: (m.debtors / G).toFixed(1) };
}
if (require.main === module) {
  Object.assign(PC.T, JSON.parse(process.argv[2] || '{}'));
  const G = +(process.argv[3] || 800), rows = [];
  for (const co of ['party', 'funeral', 'mining']) for (const n of [4, 5, 6]) rows.push(measure(n, co, G));
  console.log(JSON.stringify(PC.T)); console.table(rows);
}
module.exports = { play, measure };

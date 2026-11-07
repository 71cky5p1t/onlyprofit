// The Mix beats in bot games: overtime busts and earnings, envelopes, the buck.
const PC = require('../../src/petty/engine/core.js');
function measure(n, co, G) {
  const m = { ot: 0, otBust: 0, otPaid: 0, cards: 0, audits: 0, offers: 0, bribed: 0, bucks: 0, blew: 0, dealt: 0, passes: 0, blewLeader: 0, lastTop2: 0, rentPaid: 0 };
  for (let g = 1; g <= G; g++) {
    let s = PC.newGame({ players: n, seed: g * 7919 + n, co, spectate: true }), lap4 = null;
    while (s.phase !== 'end') {
      const was = s.phase, r = PC.apply(s, -1, { type: 'advance' }); if (r.error) throw new Error(r.error);
      const t = r.state;
      if (was === 'overtime' && t.phase === 'lodge') { m.ot++; m.otBust += !!s.ot.bust; m.cards += s.ot.row.length; m.otPaid += s.ot.out.reduce((a, x) => a + (x || 0), 0) / n; }
      if (was === 'buck' && t.phase === 'rent') {
        const b = s.buck; m.bucks++; m.passes += b.passes;
        if (b.blew != null) { m.blew++; if (s.P.every(o => o.bank <= s.P[b.blew].bank + b.hit)) m.blewLeader++; } else m.dealt++;
      }
      if (t.lap === 4 && !lap4) lap4 = t.P.map(p => p.bank);
      s = t;
    }
    m.rentPaid += s.rent0;
    for (const c of s.claims) { if (c.auditor != null && !c.nephew) { m.audits++; if (c.offer > 0) m.offers++; if (c.outcome === 'bribed') m.bribed++; } }
    if (lap4) { const last = lap4.indexOf(Math.min(...lap4)); const top2 = s.end.ranked.slice(0, 2); if (top2.includes(last)) m.lastTop2++; }
  }
  const pc = (a, b) => (100 * a / Math.max(1, b)).toFixed(0) + '%';
  return { co, n, otBust: pc(m.otBust, m.ot), otCards: (m.cards / m.ot).toFixed(1), otPerHead: '×' + (m.otPaid / m.ot / (m.rentPaid / G)).toFixed(2) + ' rent', envelopes: pc(m.offers, m.audits), taken: pc(m.bribed, m.offers), buckPasses: (m.passes / m.bucks).toFixed(1), blew: pc(m.blew, m.bucks), onLeader: pc(m.blewLeader, m.blew), lastAtLap4Top2: pc(m.lastTop2, G) };
}
if (require.main === module) {
  Object.assign(PC.T, JSON.parse(process.argv[2] || '{}'));
  const G = +(process.argv[3] || 400), rows = [];
  for (const co of ['party', 'funeral', 'mining']) for (const n of [4, 5, 6]) rows.push(measure(n, co, G));
  console.table(rows);
}

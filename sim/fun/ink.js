// Redaction modes side by side: bots, scripted Moles, and the target that would make bots 50/50.
// usage: node ink.js [games] [mode ...]
const OP = require('../../src/engine/core.js'), fun = require('./fun.js'), human = require('./human.js');
const winBy = (P, T) => P.filter(p => p >= T).length / P.length;
const fair = P => { let b = 10; for (let T = 10; T <= 40; T++) if (Math.abs(winBy(P, T) - 0.5) < Math.abs(winBy(P, b) - 0.5)) b = T; return b; };
const [G = 800, ...want] = process.argv.slice(2), modes = want.length ? want : OP.INK, SIZES = [4, 5, 6, 7, 8];
const pc = x => Math.round(100 * x) + '%';
for (const ink of modes) {
  const rows = {};
  for (const n of SIZES) {
    const m = fun.measure(n, +G, { ink }), r = fun.row(n, m), T = OP.newGame({ players: n, seed: 1, ink }).target;
    const hum = Object.keys(human.STRATS).map(st => {
      let w = 0; for (let g = 1; g <= +G; g++) w += human.play(OP, n, g * 7919 + n, st, { ink }).win; return pc(w / G);
    });
    let red = 0, pages = 0, molePaid = 0, molePages = 0;
    for (let g = 1; g <= 60; g++) for (const x of fun.play(n, g * 31 + n, { ink }).R) for (const e of x.envs) if (!e.autopilot) {
      pages++; red += e.redacted.length; if (e.mode !== 'loyal' && e.mode !== 'human') { molePages++; molePaid += e.redacted.some(su => OP.ev(e.cards[su]) < 0); }
    }
    rows[n + 'p'] = { target: T, bots: r.win, 'fair target': fair(m.profit), 'exploit/subtle Mole': hum.join(' / '), 'Mole named right': r.correct, 'loyal warned': r.wrongWarn,
      'loss approved': r.recLoss, 'blackouts/page': (red / pages).toFixed(2), 'Mole hid a loser': molePages ? pc(molePaid / molePages) : '-' };
  }
  console.log('\n== ' + ink); console.table(rows);
}

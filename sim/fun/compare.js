// Compare engines on the same seeds: bot fun table, scripted human saboteurs, win rate by target.
// usage: node compare.js <games> label=path/to/core.js ... [> out.json]
const path = require('path');
const fun = require('./fun.js'), human = require('./human.js');
const [G = 1500, ...specs] = process.argv.slice(2);
const SIZES = [4, 5, 6, 7, 8];

const winBy = (P, T) => P.filter(p => p >= T).length / P.length;
const fair = P => { let b = null; for (let T = 10; T <= 40; T++) if (!b || Math.abs(winBy(P, T) - 0.5) < Math.abs(winBy(P, b) - 0.5)) b = T; return b; };

const out = {};
for (const spec of specs) {
  const [label, file] = spec.split('=');
  delete require.cache[path.resolve(file)];
  const OP = require(path.resolve(file));
  fun.useEngine(OP);
  out[label] = {};
  for (const n of SIZES) {
    const m = fun.measure(n, +G, {}), row = fun.row(n, m), T0 = OP.newGame({ players: n, seed: 1 }).target;
    const sab = {};
    for (const st of Object.keys(human.STRATS)) {
      const P = [], rec = [], named = [];
      for (let g = 1; g <= +G; g++) { const s = human.play(OP, n, g * 7919 + n, st); P.push(s.profit); rec.push(s.scores[0]); named.push(s.whistle.named === 0); }
      sab[st] = { profit: P, record: rec.reduce((a, v) => a + v, 0) / G, named: named.filter(Boolean).length / G };
    }
    out[label][n] = { target: T0, profit: m.profit, q4: m.q4, row, sab, fair: fair(m.profit) };
    console.error(label, n + 'p', 'target', T0, 'company', row.win, 'fair', out[label][n].fair);
  }
}
console.log(JSON.stringify(out));
module.exports = { winBy, fair };

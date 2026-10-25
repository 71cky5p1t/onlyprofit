// Win rate by target, to retune TARGETS after a bot or rule change.
const { play, useEngine } = require('./fun.js');
const G = +(process.argv[2] || 1000);
if (process.argv[3]) useEngine(require('./variant.js').load(process.argv[3].split('+')));
for (const n of [4, 5, 6, 7, 8]) {
  const P = []; let T0;
  for (let g = 1; g <= G; g++) { const { s } = play(n, g * 104729 + n); P.push(s.profit); T0 = s.target; }
  console.log(n + 'p', [-1, 0, 1, 2, 3].map(d => `+${T0 + d}: ${(100 * P.filter(p => p >= T0 + d).length / G).toFixed(0)}%`).join('  '));
}

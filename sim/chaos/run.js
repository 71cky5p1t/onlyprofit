const { score } = require('./metrics.js');
const models = process.argv.slice(2).length ? process.argv.slice(2) : ['baseline', 'overtime', 'pool', 'buck', 'bribe', 'forecast', 'mix'];
const rows = [];
for (const name of models) {
  const M = require('./' + name + '.js');
  for (const n of [5]) { const gs = []; for (let g = 1; g <= 1500; g++) gs.push(M.game(n, g * 101 + n)); rows.push(Object.assign({ model: M.name, n }, score(gs), M.extra ? M.extra(gs) : {})); }
}
console.table(rows);
require('fs').writeFileSync(__dirname + '/results.json', JSON.stringify(rows, null, 1));

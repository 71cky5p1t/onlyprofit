const fs = require('node:fs');
const path = require('node:path');
const caps = { 'src/engine/core.js': 30000, 'src/engine/bots.js': 16000, 'src/ui/05-art.js': 15000 };
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const rows = [...walk('src'), ...walk('server')].map(file => ({ file, bytes: fs.statSync(file).size })).sort((a, b) => b.bytes - a.bytes);
let failed = false;
for (const { file, bytes } of rows) {
  const cap = caps[file] || 12000;
  if (bytes > cap) { console.error(`${file}: ${bytes} bytes exceeds ${cap}; split by concern.`); failed = true; }
}
console.table(rows.slice(0, 12));
if (failed) process.exitCode = 1;
else console.log('Source size budgets passed. dist/ and assets/ are generated or opaque; do not load them for source edits.');

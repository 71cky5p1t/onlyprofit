// Loads the engine with rule experiments patched in; nothing here changes the game.
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '../../src/engine'), OUT = path.join(__dirname, '.build');
const V = {
  // eight effect Modifiers instead of four
  fx8: [['core.js', 'const FX_SLOTS = VALUES.reduce((a, v, k) => (v === 0 ? a.concat(k) : a), []);', 'const FX_SLOTS = VALUES.reduce((a, v, k) => (v === 0 || v === -1 ? a.concat(k) : a), []);'], ['content.js', "  const NAMES =", "  FX.push(...FX.map(f => f.slice()));\n  const NAMES ="]],
  // at most one card shown per envelope
  reveal1: [['core.js', '.slice(0, Math.max(0, tokens));', '.slice(0, Math.min(1, Math.max(0, tokens)));']],
  // the Modifier (fine print) can never be shown
  fineprint: [['core.js', 'const order = [0, 1, 2]', 'const order = [0, 1]'], ['core.js', 'reveals: [...new Set(a.reveals || [])].filter(x => x >= 0 && x < 3)', 'reveals: [...new Set(a.reveals || [])].filter(x => x >= 0 && x < 2)']],
};
function load(names) {
  const dir = path.join(OUT, names.join('+') || 'base'); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(SRC)) {
    let t = fs.readFileSync(path.join(SRC, f), 'utf8');
    for (const n of names) for (const [file, a, b] of V[n]) if (file === f) { if (!t.includes(a)) throw new Error(n + ': no match in ' + f); t = t.split(a).join(b); }
    fs.writeFileSync(path.join(dir, f), t);
  }
  return require(path.join(dir, 'core.js'));
}
module.exports = { load, V };

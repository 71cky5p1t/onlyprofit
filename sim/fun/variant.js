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
  // no end-game Whistleblower
  nowhistle: [['core.js', "named: winner === 'none' ? null : +winner };", "named: null };"]],
  // no Written Warning votes; only the CEO acts
  nowarn: [['core.js', 'passed = mx > s.n / 2;', 'passed = false;']],
  // targets without the whistle
  lowtgt: [['core.js', 'const TARGETS = { 4: 19, 5: 21, 6: 22, 7: 23, 8: 23 };', 'const TARGETS = { 4: 17, 5: 19, 6: 20, 7: 21, 8: 21 };']],
  // only the final CEO names a saboteur at the end
  ceowhistle: [['core.js', "const { winner, count } = tally(s, s.wb, { noneWinsTies: true });", "const { winner, count } = tally(s, { [s.ceo]: s.wb[s.ceo] ?? 'none' }, { noneWinsTies: true });"]],
  ceotgt: [['core.js', 'const TARGETS = { 4: 19, 5: 21, 6: 22, 7: 23, 8: 23 };', 'const TARGETS = { 4: 19, 5: 21, 6: 21, 7: 22, 8: 23 };']],
  // saboteurs also win if their approved losses reach DMG_X (env)
  damage: [['core.js', 's.win = s.profit >= s.target;', 's.dmg = s.ledger.filter(l => !l.autopilot && s.P[l.author].sab && l.actual < 0).reduce((a, l) => a - l.actual, 0); s.win = s.profit >= s.target && !(s.dmg >= (+process.env.DMG_X || 99));']],
  // wider card values: one +3 and one −3 per suit, same average
  wide: [['content.js', "const VALUES = [2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -2, -2, -2, -2, 'V', 'V'];", "const VALUES = [3, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -2, -2, -2, -3, 'V', 'V'];"]],
  // four wildcards per suit instead of two (two 0s become wildcards)
  wild4: [['content.js', "const VALUES = [2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -2, -2, -2, -2, 'V', 'V'];", "const VALUES = [2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -2, -2, -2, -2, 'V', 'V', 'V', 'V'];"]],
  // both: wider values and four wildcards
  chaos: [['content.js', "const VALUES = [2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -2, -2, -2, -2, 'V', 'V'];", "const VALUES = [3, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -2, -2, -2, -3, 'V', 'V', 'V', 'V'];"]],
  // wildcards swing ±3
  wild3: [['core.js', '(rand(s) < 0.5 ? 2 : -2)', '(rand(s) < 0.5 ? 3 : -3)']],
  // CEO also approves a second proposal (own pick, no Board vote)
  two: [['core.js', 's.pick = null; s.warn', 's.pick = null; s.pick2 = null; s.warn'],
    ['core.js', "    s.phase = 'reveal'; s.wvotes = {};", "    if (s.pick2 === null) { const all = s.envs; s.envs = all.filter(x => !x.approved); s.pick2 = s.envs.length ? botPick(s) : -1; s.envs = all; const e2 = all.find(x => x.id === s.pick2); if (e2) { e2.approved = true; e2.resolved = e2.cards.map(c => (c.v === 'V' ? (rand(s) < 0.5 ? 2 : -2) : c.v)); const a2 = total(e2.resolved, e2.cards); s.profit += a2; if (!e2.autopilot) s.P[e2.author].approved.push({ r: s.r, stamp: e2.stamp, actual: a2 }); s.ledger.push({ r: s.r, id: e2.id, subject: e2.subject, author: e2.author, ceo: s.ceo, actual: a2, stamp: e2.stamp, autopilot: !!e2.autopilot }); } }\n    s.phase = 'reveal'; s.wvotes = {};"],
    ['core.js', 'if (e.id === s.pick) {', 'if (e.id === s.pick || e.id === s.pick2) {']],
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

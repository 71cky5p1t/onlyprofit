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
  // Joel's idea: warning -> Under Investigation (open next quarter) -> verdict -> Performance Improvement Plan (open to the CEO only)
  pip: [
    ['core.js', 'warnings: 0, leave: false,', 'warnings: 0, leave: false, inv: 0, pip: false,'],
    ['core.js', "      if (t.warnings >= 2 && !t.leave) {", "      if (t.pip && !t.leave) {"],
    ['core.js', "      else log(s, E, 'event', `${who(s, target, 1)} received a Written Warning.`);", "      else if (!t.inv && !t.pip) { t.inv = s.r + 1; log(s, E, 'event', `${who(s, target, 1)} ${isAre(s, target)} under investigation.`); }"],
    ['core.js', "    log(s, E, 'system', `Q${s.r} begins.", "    pipStep(s, E);\n    log(s, E, 'system', `Q${s.r} begins."],
    ['core.js', "  function workCost(w) {", `  const PIP_T = +(process.env.PIP_T || 0);
  function pipStep(s, E) {
    s.pipLog = s.pipLog || [];
    for (const p of s.P) {
      if (p.inv && p.inv === s.r - 1) {
        // verdict: did they ever stamp Recommended on a proposal that would have lost money
        const mine = s.history.flatMap(h => h.envs).filter(e => e.author === p.id && !e.autopilot && e.stamp === 'Rec');
        const bad = mine.some(e => (e.resolved ? total(e.resolved, e.cards) : total(e.cards.map(c => (c.v === 'V' ? (rand(s) < 0.5 ? 2 : -2) : c.v)), e.cards)) < PIP_T);
        s.pipLog.push({ r: s.r, id: p.id, sab: p.sab, bad });
        p.inv = 0;
        if (bad) { p.pip = true; (s.accused[p.id] = s.accused[p.id] || []).push('table'); p.accusations++; log(s, E, 'event', \`\${who(s, p.id, 1)} \${p.human ? 'have' : 'has'} been placed on a Performance Improvement Plan.\`); }
        else log(s, E, 'event', \`\${who(s, p.id, 1)} \${p.human ? 'have' : 'has'} been cleared.\`);
      }
    }
  }
  function pipMark(s) { for (const e of s.envs) { const a = s.P[e.author]; if (e.autopilot) continue; if (a.inv === s.r) e.audited = true; else if (a.pip) e.openTo = [s.ceo]; } }
  function workCost(w) {`],
    ['core.js', "    botDesign(s);\n    s.envs = shuffle", "    botDesign(s); pipMark(s);\n    s.envs = shuffle"],
    ['bots.js', "      if (e.author === i || e.audited || e.autopilot) return viewValue(s, i, e);", "      if (e.author === i || e.audited || e.autopilot || (e.openTo && e.openTo.includes(i))) return e.openTo && e.openTo.includes(i) ? evs(e.cards) : viewValue(s, i, e);"],
    ['bots.js', "e.author === ceo || e.audited || e.autopilot ? evs(e.cards)", "e.author === ceo || e.audited || e.autopilot || e.openTo ? evs(e.cards)"],
    ['bots.js', "      if (S === 'smart' && r < 5 && (p.warnings", "      if (p.inv === r || (p.pip && s.ceo !== undefined && !s.P[s.ceo].sab)) return 'good';\n      if (S === 'smart' && r < 5 && (p.warnings"],
  ],
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

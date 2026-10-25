// Loads the engine with rule experiments patched in; nothing here changes the game.
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '../../src/engine'), OUT = path.join(__dirname, '.build');
const TAMPER = `
    for (const p of s.P) if (p.sab && !p.leave && !p.tampered && !isHuman(s, p.id) && s.r >= 2) {
      const c = s.envs.filter(e => !e.audited && !e.autopilot && e.author !== p.id && e.revealed.length < 3), aside = s.left[p.dept];
      if (!c.length || !aside) continue;
      const t = argmax(c, e => [pubEst(s, e)]), hid = [0, 1, 2].filter(su => !t.revealed.includes(su));
      const su = argmax(hid, su => [ev(t.cards[su]) - ev(aside[su])]);
      if (ev(t.cards[su]) - ev(aside[su]) < 2) continue;
      [t.cards[su], aside[su]] = [aside[su], t.cards[su]]; t.tampered = p.id; p.tampered = true;
    }
    s.phase = 'decide';`;
const V = {
  // no separate audit: the Board can open the nominee, and overrules only if it disappoints
  openNom: [['core.js', 'const e = s.envs.find(x => x.id === winner);\n    if (e)', 'const e = null;\n    if (e)'],
    ['core.js', 'const best = argmax(s.envs, x => [pubEst(s, x)]);\n    const overruled = no > voters / 2 && best.id !== nom.id;', 'if (no > voters / 2) nom.audited = true;\n    const best = argmax(s.envs, x => [pubEst(s, x)]);\n    const overruled = !!nom.audited && best.id !== nom.id && pubEst(s, nom) < pubEst(s, best) - 1;'],
    ['bots.js', "return f.get(nom.id) <= best - (tell ? 1 : 2) ? 'overrule' : 'ratify';", "return nom.revealed.length < 3 && (tell || f.get(nom.id) <= best - 1 || (nom.stamp === 'Rec' && nom.revealed.length < 2 && pers(p)[4] < 1.2)) ? 'overrule' : 'ratify';"]],
  // eight effect Modifiers instead of four
  fx8: [['core.js', 'const FX_SLOTS = VALUES.reduce((a, v, k) => (v === 0 ? a.concat(k) : a), []);', 'const FX_SLOTS = VALUES.reduce((a, v, k) => (v === 0 || v === -1 ? a.concat(k) : a), []);'], ['content.js', "  const NAMES =", "  FX.push(...FX.map(f => f.slice()));\n  const NAMES ="]],
  // once a game, a saboteur may swap one hidden card in someone else's sealed envelope after the audit
  tamper: [['core.js', "log(s, E, 'event', 'The table declined to audit anything.');\n    s.phase = 'decide';", "log(s, E, 'event', 'The table declined to audit anything.');" + TAMPER]],
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

// Fun metrics over bot-only games: tension, swings, table moments, whether lies pay.
let OP = require('../../src/engine/core.js');
const useEngine = e => { OP = e; };

function play(n, seed, o = {}) {
  let s = OP.newGame(Object.assign({ players: n, seed, spectate: true }, o)), k = 0;
  const R = [];
  while (s.phase !== 'end') {
    const r = OP.apply(s, -1, { type: 'advance' }); if (r.error) throw new Error(r.error + ' ' + s.phase); s = r.state;
    if (s.phase === 'review') R.push({ r: s.r, profit: s.profit, board: s.board, audit: s.audit, result: s.result, warn: s.warn, memos: s.memos, envs: s.envs, ceo: s.ceo });
    if (++k > 200) throw new Error('loop');
  }
  return { s, R };
}

function measure(n, G, o) {
  const m = { games: G, win: 0, close5: 0, closeW: 0, whistleFlip: 0, comeback: 0, collapse: 0, cross: 0, blowout: 0,
    overrule: 0, ownOverrule: 0, auditHit: 0, recLoss: 0, warns: 0, wrongWarns: 0, standDown: 0, wrongStand: 0,
    audits: 0, bust: 0, claw: 0, named: 0, correct: 0, cleanNamed: 0, clean: 0, choice: 0, rounds: 0, lies: 0, lieWarn: 0,
    sabGames: 0, sabWinLied: 0, sabLied: 0, sabWinHonest: 0, sabHonest: 0, liarNamed: 0, margin: [] };
  for (let g = 1; g <= G; g++) {
    const { s, R } = play(n, g * 7919 + n, o), T = s.target;
    const before = s.profit - (s.whistle.swing || 0), sabs = s.P.filter(p => p.sab).map(p => p.id);
    m.win += s.win; m.margin.push(s.profit - T);
    const p4 = R[3].profit; if (T - p4 >= -1 && T - p4 <= 5) m.close5++;
    if (Math.abs(before - T) <= 3) m.closeW++;
    if ((before >= T) !== s.win) m.whistleFlip++;
    const pace = r => T * r / 5;
    if (R[2].profit <= pace(3) - 3 && s.win) m.comeback++;
    if (R[2].profit >= pace(3) + 3 && !s.win) m.collapse++;
    let side = null; for (const x of R) { const b = x.profit >= pace(x.r); if (side !== null && b !== side) m.cross++; side = b; }
    if (Math.abs(s.profit - T) >= 8) m.blowout++;
    let liedIds = new Set();
    for (const x of R) {
      m.rounds++;
      if (x.result && x.result.actual < 0) m.bust++;
      if (x.board && x.board.overruled) { m.overrule++; if (x.board.own) m.ownOverrule++; }
      const au = x.envs.find(e => e.audited); if (au) m.audits++; if (au && OP.evs(au.cards) < 0) m.auditHit++;
      if (x.result && x.result.actual <= -1 && x.envs.find(e => e.id === x.result.id).stamp === 'Rec') m.recLoss++;
      if (x.warn && x.warn.passed) { m.warns++; if (!s.P[x.warn.target].sab) m.wrongWarns++; }
      const ests = x.envs.map(e => OP.estimate(e, 'smart', true)).sort((a, b) => b - a);
      if (ests.length > 1 && ests[0] - ests[1] <= 1) m.choice++;
      for (const mm of x.memos) if (mm.kind === 'report' && !mm.truthful) {
        m.lies++; liedIds.add(mm.by);
        if (x.warn && x.warn.passed && x.warn.target === mm.target && !s.P[mm.target].sab) m.lieWarn++;
      }
    }
    m.standDown += s.P.filter(p => p.leave).length; m.wrongStand += s.P.filter(p => p.leave && !p.sab).length;
    if (!sabs.length) { m.clean++; if (s.whistle.named != null) m.cleanNamed++; }
    else {
      m.sabGames++;
      const lied = sabs.some(i => liedIds.has(i));
      if (lied) { m.sabLied++; m.sabWinLied += !s.win; } else { m.sabHonest++; m.sabWinHonest += !s.win; }
      if (s.whistle.named != null && liedIds.has(s.whistle.named) && sabs.includes(s.whistle.named)) m.liarNamed++;
    }
    if (s.whistle.named != null) { m.named++; m.correct += !!s.whistle.correct; if (s.whistle.correct && s.whistle.clawed.length) m.claw++; }
  }
  return m;
}

function row(n, m) {
  const G = m.games, pc = x => (100 * x / G).toFixed(0) + '%', rd = x => (100 * x / m.rounds).toFixed(0) + '%';
  const sd = Math.sqrt(m.margin.reduce((a, v) => a + v * v, 0) / G - (m.margin.reduce((a, v) => a + v, 0) / G) ** 2);
  return { n, win: pc(m.win), liveQ5: pc(m.close5), liveWhistle: pc(m.closeW), whistleFlips: pc(m.whistleFlip), comeback: pc(m.comeback), collapse: pc(m.collapse),
    paceCross: (m.cross / G).toFixed(1), blowout: pc(m.blowout), marginSD: sd.toFixed(1),
    realChoice: rd(m.choice), bust: rd(m.bust), overrule: rd(m.overrule), audits: rd(m.audits), auditHit: rd(m.auditHit), recLoss: rd(m.recLoss),
    warnsPerG: (m.warns / G).toFixed(2), wrongWarn: (m.wrongWarns / Math.max(1, m.warns) * 100).toFixed(0) + '%',
    wrongStand: (m.wrongStand / Math.max(1, m.standDown) * 100).toFixed(0) + '%',
    named: pc(m.named), correct: (m.correct / Math.max(1, m.named) * 100).toFixed(0) + '%', cleanParanoia: (m.cleanNamed / Math.max(1, m.clean) * 100).toFixed(0) + '%',
    liesPerG: (m.lies / G).toFixed(2), lieWarnLoyal: (m.lieWarn / Math.max(1, m.lies) * 100).toFixed(0) + '%',
    sabWinIfLied: (m.sabWinLied / Math.max(1, m.sabLied) * 100).toFixed(0) + '%', sabWinIfHonest: (m.sabWinHonest / Math.max(1, m.sabHonest) * 100).toFixed(0) + '%',
    liarCaught: (m.liarNamed / Math.max(1, m.sabLied) * 100).toFixed(0) + '%' };
}

if (require.main === module) {
  const G = +(process.argv[2] || 600), o = JSON.parse(process.argv[3] || '{}');
  if (process.argv[5]) useEngine(require('./variant.js').load(process.argv[5].split('+')));
  const rows = [4, 5, 6, 7, 8].map(n => row(n, measure(n, G, o)));
  if (process.argv[4] === 'json') console.log(JSON.stringify(rows));
  else console.table(rows.reduce((t, r) => { for (const k in r) if (k !== 'n') (t[k] = t[k] || {})[r.n + 'p'] = r[k]; return t; }, {}));
}
module.exports = { play, measure, row, useEngine };

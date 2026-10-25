// Builds engine-x.js: PR #2 engine plus option flags in s.x for bot and rule experiments.
const fs = require('fs');
let src = fs.readFileSync(__dirname + '/engine-pr2.js', 'utf8');
const R = (a, b) => { if (!src.includes(a)) throw new Error('miss: ' + a.slice(0, 60)); src = src.replace(a, b); };
// options
R("feed: [], ledger: [],", "x: opts.x || {}, feed: [], ledger: [],");
// personalities: assigned per seat
R("    if (n >= 6) { const [a, b]", "    if (s.x.pers) { const T = shuffle(s, ['trusting', 'sceptic', 'gossip', 'beancounter', 'yesman', 'sceptic', 'trusting', 'gossip']); s.P.forEach((p, k) => { p.pers = T[k]; }); }\n    if (n >= 6) { const [a, b]");
// exports for harness
R("return { apply, newGame,", "return { botWarnVote: (s, i) => botWarnVote(s, i), apply, newGame,");
// rule: CEO can't approve own envelope
R("    if (s.P[ceo].sab) {\n      const top", "    if (s.x.noSelf) { const o = envs.filter(e => e.author !== ceo || e.autopilot); if (o.length) return botPickFrom(s, o); }\n    return botPickFrom(s, envs);\n  }\n  function botPickFrom(s, envs) {\n    const ceo = s.ceo, L = s.loyalTier;\n    const est = e => estimate(e, L, true);\n    if (s.P[ceo].sab) {\n      const top");
R("    const e = s.envs.find(x => x.id === id); if (!e) return 'No such envelope.';", "    const e = s.envs.find(x => x.id === id); if (!e) return 'No such envelope.';\n    if (s.x.noSelf && e.author === s.ceo && !e.autopilot && s.envs.some(x => x.author !== s.ceo || x.autopilot)) return 'Conflict of interest.';");
// rule: year-end Q5 counts double
R("    const actual = total(e.resolved, e.cards);", "    const actual = total(e.resolved, e.cards) * (s.x.q5x2 && s.r === ROUNDS ? 2 : 1);");
// bots v2: table notices humans too, and self-approved losses
R("      if (estimate(e, s.loyalTier, false) <= pubBest - 3 && !s.P[s.ceo].human) {", "      if (s.x.bots2 && e.author === s.ceo && !e.autopilot && actual <= -1 && !(e.stamp === 'Rec')) { (s.accused[s.ceo] = s.accused[s.ceo] || []).push('table'); s.P[s.ceo].accusations++; log(s, E, 'event', `The CEO approved their own losing envelope.`, { target: s.ceo }); }\n      if (estimate(e, s.loyalTier, false) <= pubBest - 3 && (s.x.bots2 || !s.P[s.ceo].human)) {");
// bots v2 warn vote: weigh evidence; reports from tarnished staff count less; needs a threshold
R("  function botWarnVote(s, i) {\n", "  function botWarnVote(s, i) {\n    if (s.x.bots2) return botWarnVote2(s, i);\n");
R("  const suspicion = (s, q)", `  function botWarnVote2(s, i) {
    const me = s.P[i], pers = (s.x.pers && me.pers) || 'normal';
    const c = Object.keys(s.accused).map(Number).filter(t => t !== i && !s.P[t].leave);
    const cred = a => a === 'table' ? 2 : a === i ? 0 : Math.max(0.25, 1 - 0.5 * s.P[a].warnings - (s.accused[a] ? 0.5 : 0) - (s.P[a].claims > 2 ? 0.5 : 0));
    const W = { trusting: [1, 1.5], sceptic: [0.5, 2], gossip: [1, 1], beancounter: [0.75, 2], yesman: [1, 1], normal: [1, 1.5] }[pers];
    const score = t => s.accused[t].reduce((a, by) => a + (by === 'table' ? 2 : W[0] * cred(by)), 0) + 0.25 * s.P[t].warnings;
    if (pers === 'yesman' && s.ceo !== i && !s.P[s.ceo].human && s.P[s.ceo].pers !== 'yesman') { const v = botWarnVote2(s, s.ceo); if (v !== 'none' && v !== i) return v; }
    if (!c.length) return 'none';
    const t = argmax(c, t => [score(t), s.P[t].accusations]);
    return score(t) >= W[1] ? t : 'none';
  }
  const suspicion = (s, q)`);
// bots v2 work memo: gossips report shakier evidence, sceptics stay quiet on Risky
R("      if ((inh.stamp === 'Rec' && v <= -1) || (inh.stamp === 'Risky' && v <= -2)) accuse(s, i, a, inh.stamp, v, true);", "      const pz = s.x.pers && p.pers;\n      if ((inh.stamp === 'Rec' && v <= -1) || (inh.stamp === 'Risky' && v <= (pz === 'sceptic' ? -3 : -2)) || (pz === 'gossip' && v <= -1)) accuse(s, i, a, inh.stamp, v, true);");
// rule: clawback whistleblower — catching a saboteur restores the losses on envelopes they wrote
R("      s.whistle.correct = q.sab; s.profit += q.sab ? 3 : -3;", "      s.whistle.correct = q.sab;\n      const claw = s.x.claw && q.sab ? -s.ledger.filter(l => l.author === q.id && !l.autopilot && l.actual < 0).reduce((a, l) => a + l.actual, 0) : 0;\n      s.whistle.swing = q.sab ? (s.x.claw === 2 ? Math.max(3, 2 * claw) : Math.max(s.x.claw ? 2 : 3, claw + (s.x.claw ? 1 : 0))) : -3; s.profit += s.whistle.swing;");
// rule: Board ratifies the CEO's pick; loyal bots reject a pick that looks 2+ worse than the best visible option
R("    e.approved = true;\n", `    if (s.x.board && !s._ratified) {
      const pub = x => estimate(x, s.loyalTier, !!s.x.pubRev);
      const best = argmax(s.envs, x => [pub(x)]);
      let no = 0;
      for (const p of s.P) { if (p.id === s.ceo) continue; if (isHuman(s, p.id) ? s._humanBoard === 'reject' : (!p.sab && pub(e) <= pub(best) - 2)) no++; }
      s.board = { pick: id, no, passed: no <= (s.n - 1) / 2 };
      if (!s.board.passed && best.id !== id) {
        log(s, E, 'event', 'The Board overruled the CEO.');
        if (s.x.selfPen && e.author === s.ceo && !e.autopilot) { s.P[s.ceo].skipCEO = true; (s.accused[s.ceo] = s.accused[s.ceo] || []).push('table'); s.P[s.ceo].accusations++; }
        (s.accused[s.ceo] = s.accused[s.ceo] || []).push('table'); s.P[s.ceo].accusations++;
        s._ratified = true; const r = approve(s, best.id, E); s._ratified = false; return r;
      }
    }
    e.approved = true;
`);
// stronger saboteur bots: as CEO, build the worst envelope and approve it (what humans did)
R("    const mode = p.sab ? sabMode(s) : 'loyal';", "    const mode = p.sab ? (s.x.ruthless && s.ceo === i ? 'bad' : sabMode(s)) : 'loyal';");
R("    if (s.P[ceo].sab) {\n      const top", "    if (s.P[ceo].sab && s.x.ruthless) { const own = envs.find(e => e.author === ceo && !e.autopilot); if (own) return own.id; }\n    if (s.P[ceo].sab) {\n      const top");
R("    if (n === 4 && s.r === 5) {", "    if (n === 4 && s.r === 5 && !s.x.rot4) {");
R("if (t.warnings >= 2 && !t.leave) {", "if (t.warnings >= 2 && !t.leave && !s.x.noLeave) {");
R("(s.x.bots2 || !s.P[s.ceo].human)", "(s.x.bots2 || s.x.fair || !s.P[s.ceo].human)");
R("      if (s.x.bots2 && e.author === s.ceo", "      if ((s.x.bots2 || s.x.fair) && e.author === s.ceo");
R("      if (p.leave) { const [e, h]", "      if (p.leave && !s.x.leaveOpen) { const [e, h]");
R("      botInheritMemo(s, i, inh);\n      const [e, h] = botWork(s, i, inh.cards, D); e.dept = d;", "      botInheritMemo(s, i, inh);\n      const [e, h] = botWork(s, i, inh.cards, D); e.dept = d; if (p.leave) e.audited = true;");
R("    s.envs.push(e); s.left[p.dept] = aside;", "    if (p.leave) e.audited = true;\n    s.envs.push(e); s.left[p.dept] = aside;");
R("for (let k = 0; k < n; k++) { const c = s.ceoOrder[(base + k) % n]; if (!s.P[c].leave) return c; }", "for (let k = 0; k < n; k++) { const c = s.ceoOrder[(base + k) % n]; if (!s.P[c].leave && !s.P[c].skipCEO) return c; if (s.P[c].skipCEO) s.P[c].skipCEO = false; }");
fs.writeFileSync(__dirname + '/engine-x.js', src);
console.log('ok');

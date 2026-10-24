// Only Profit — game engine (no DOM, no Math.random, no clock).
// apply(state, seat, action) -> { state, events } | { error }
// Bot logic is ported from sim2.py (FINAL config: smart vs smart, Garden Leave at 2 warnings, Whistleblower ±3).
const OP = (() => {
  const SUITS = ['Action', 'Target', 'Modifier'];
  const WORDS = [
    ['Restructure', 'Outsource', 'Rightsize', 'Monetise', 'Gamify', 'Sunset', 'Offshore', 'Rebrand', 'Automate', 'Consolidate', 'Incentivise', 'Liquidate'],
    ['the Pension Fund', 'Employee Wellness', 'the Break Room', 'Customer Trust', 'Middle Management', 'the Interns', 'Legacy Systems', 'Quality Assurance', 'the Regional Office', 'Union Relations', 'Environmental Compliance', 'the Mascot'],
    ['Immediately', 'Without Consultation', 'Retroactively', 'At Scale', 'Going Forward', 'Off the Books', 'Pending Review', 'Indefinitely', 'With Thoughts and Prayers', "Per Legal's Advice", 'Ahead of Q4', 'In Perpetuity'],
  ];
  const VALUES = [2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -2, -2, -2, -2, 'V', 'V'];
  const MU = VALUES.reduce((a, v) => a + (v === 'V' ? 0 : v), 0) / VALUES.length;
  const TARGETS = { 4: 17, 5: 19, 6: 19, 7: 20, 8: 21 };
  const MEMO = { 4: [[0, .2], [1, .8]], 5: [[0, .2], [1, .8]], 6: [[0, .2], [1, .4], [2, .4]], 7: [[0, .2], [1, .4], [2, .4]], 8: [[0, .2], [1, .4], [2, .4]] };
  const STAMP_W = { naive: 1.5, basic: 1.5, smart: 0.5 };
  const STAMP_ADJ = { Rec: 1, Risky: 0, Not: -1.5 };
  const STAMP_CLAIM = { Rec: 2.5, Risky: 0.5, Not: -1 };
  const STAMP_LABEL = { Rec: 'Recommended', Risky: 'Risky', Not: 'Not Recommended' };
  const SWAP_COST = [0, 1, 3, 6];
  const TOKENS = 3, ROUNDS = 5, SLACK = 2;
  const NAMES = ['Gary', 'Denise', 'Trevor', 'Moira', 'Clive', 'Pam', 'Keith', 'Linda'];
  const DEPTS = ['Finance', 'Marketing', 'Human Resources', 'Legal', 'Operations', 'Compliance', 'R&D', 'Facilities'];
  const COLORS = ['manila', 'salmon', 'carbon', 'mint', 'gold'];
  const TRIMS = ['plain', 'airmail', 'confidential'];
  const SUBJ = [
    ['Re:', 'Fwd:', 'Action Required:', 'Quick Win:', 'Exciting News:', 'Per My Last Memo:', 'Circling Back:', 'Low-Hanging Fruit:', 'Confidential:', 'FYI:', 'Synergy Alert:', 'Town Hall Follow-Up:'],
    ['Wellness Optimisation', 'Pension Agility', 'Break Room Monetisation', 'Synergy Roadmap', 'Headcount Harmony', 'Customer Delight', 'Mandatory Fun Week', 'Coffee Rationalisation', 'The Paperless Paper Drive', 'Cultural Realignment', 'Stakeholder Journey', 'Vision 2000', 'Right-Sizing Our Family', 'Morale Recovery', 'Lean Lunch Hours'],
    ['(Urgent)', '— Phase II', '— Revised', 'Going Forward', 'for Q3', '(Do Not Forward)', 'v2 FINAL', '— A Win-Win', 'Effective Immediately', '(Pilot)', '— Thoughts?', '(Mandatory)'],
  ];

  // ---------- rng (state lives in s.rs) ----------
  function rand(s) {
    let t = (s.rs = (s.rs + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const ri = (s, n) => Math.floor(rand(s) * n);
  const pickOne = (s, a) => a[ri(s, a.length)];
  function shuffle(s, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(s, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const range = n => [...Array(n).keys()];

  const ev = c => (c.v === 'V' ? 0 : c.v);
  const evs = cs => cs.reduce((a, c) => a + ev(c), 0);
  function cmp(a, b) { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] - b[i]; } return 0; }
  function argmax(xs, key) { let best = null, bk = null; for (const x of xs) { const k = key(x); if (best === null || cmp(k, bk) > 0) { best = x; bk = k; } } return best; }

  // ---------- deck ----------
  function newDeck(s) {
    const piles = SUITS.map((_, su) => {
      const words = shuffle(s, WORDS[su].concat(WORDS[su]));
      return shuffle(s, VALUES.map((v, k) => ({ id: `${su}.${k}`, s: su, v, w: words[k] })));
    });
    return { piles, disc: [[], [], []] };
  }
  function draw(s, su) {
    const d = s.deck;
    if (!d.piles[su].length) { d.piles[su] = shuffle(s, d.disc[su]); d.disc[su] = []; }
    return d.piles[su].pop();
  }
  const draw3 = s => [0, 1, 2].map(su => draw(s, su));
  const discard = (s, cards) => cards.forEach(c => s.deck.disc[c.s].push(c));

  function plans(I, D, max = 3) {
    const out = [[0, I.slice(), D.slice()]];
    for (let su = 0; su < 3; su++) { const p = I.slice(), h = D.slice(); p[su] = D[su]; h[su] = I[su]; out.push([1, p, h]); }
    if (max >= 3) for (const pair of [[0, 1], [0, 2], [1, 2]]) {
      const p = I.slice(), h = D.slice(); for (const su of pair) { p[su] = D[su]; h[su] = I[su]; } out.push([3, p, h]);
    }
    return out;
  }
  // What a player believes an envelope is worth. seeRev: the CEO sees cards revealed to them.
  function estimate(e, tier, seeRev) {
    if (e.audited || e.autopilot) return evs(e.cards);
    const rv = seeRev ? e.revealed : [];
    const known = rv.reduce((a, su) => a + ev(e.cards[su]), 0);
    const mu = MU - (tier === 'smart' ? 0.4 : 0);
    return known + (3 - rv.length) * mu + STAMP_W[tier] * STAMP_ADJ[e.stamp];
  }
  function revealPositive(prop, tokens, all) {
    const order = [0, 1, 2].sort((a, b) => ev(prop[b]) - ev(prop[a]));
    return (all ? order : order.filter(su => ev(prop[su]) > 0)).slice(0, Math.max(0, tokens));
  }
  const randomSubject = s => SUBJ.map(l => pickOne(s, l)).join(' ');
  const randomStyle = s => ({ color: pickOne(s, COLORS), trim: pickOne(s, TRIMS) });

  // ---------- setup ----------
  function newGame(opts) {
    const n = Math.max(4, Math.min(8, opts.players || 4));
    const s = {
      v: 1, rs: (opts.seed >>> 0) || 1, seed: opts.seed >>> 0, n, spectate: !!opts.spectate,
      loyalTier: opts.loyalTier || 'smart', sabTier: opts.sabTier || 'smart', easy: !!opts.easy,
      target: TARGETS[n] - (opts.easy ? 3 : 0), profit: 0, r: 0, phase: 'brief',
      feed: [], ledger: [], history: [], memos: [], accused: {}, envs: [], left: {}, work: {},
    };
    s.deck = newDeck(s);
    // Headcount Memo
    let x = rand(s), nSab = 0;
    for (const [k, p] of MEMO[n]) { if (x < p) { nSab = k; break; } x -= p; }
    s.nSab = nSab;
    const sabs = shuffle(s, range(n)).slice(0, nSab);
    const names = shuffle(s, NAMES);
    s.P = range(n).map(i => ({
      id: i, name: i === 0 && !s.spectate ? 'You' : names[i], human: i === 0 && !s.spectate,
      sab: sabs.includes(i), spec: null, fav: randomStyle(s),
      warnings: 0, leave: false, accusations: 0, claims: 0, approved: [], ceoTurns: 0,
    }));
    if (n >= 6) { const [a, b] = shuffle(s, range(n)); s.P[a].spec = 'Auditor'; s.P[b].spec = 'Designer'; }
    s.ceoOrder = shuffle(s, range(n));
    s.hands = range(n).map(() => ({ cards: draw3(s), author: null, kind: 'legacy' }));
    s.reqStyle = null; s.nextStyle = null;
    if (s.spectate) startRound(s, []);
    return s;
  }
  const isHuman = (s, i) => !s.spectate && i === 0;
  const humanSeat = s => (s.spectate ? -1 : 0);
  const who = (s, i, cap) => (s.P[i].human ? (cap ? 'You' : 'you') : s.P[i].name);
  const whose = (s, i) => (s.P[i].human ? 'your' : s.P[i].name + "'s");
  const isAre = (s, i) => (s.P[i].human ? 'are' : 'is');
  function log(s, ev_, kind, text, extra) { const e = Object.assign({ r: s.r, kind, text }, extra || {}); s.feed.push(e); ev_.push(e); }

  function chooseCEO(s) {
    const n = s.n;
    if (n === 4 && s.r === 5) {
      const act = s.P.filter(p => !p.leave); const mx = Math.max(...act.map(p => p.approved.length));
      return pickOne(s, act.filter(p => p.approved.length === mx)).id;
    }
    const base = (s.r - 1) % n;
    for (let k = 0; k < n; k++) { const c = s.ceoOrder[(base + k) % n]; if (!s.P[c].leave) return c; }
    return s.ceoOrder[base];
  }
  function ceoSchedule(s) {
    return range(ROUNDS).map(k => {
      const r = k + 1;
      if (s.history[k]) return { r, who: s.history[k].ceo };
      if (r === s.r) return { r, who: s.ceo };
      if (s.n === 4 && r === 5) return { r, who: null, note: 'Most approvals' };
      return { r, who: s.ceoOrder[k % s.n] };
    });
  }

  // ---------- bots ----------
  function sabMode(s) {
    const S = s.sabTier, r = s.r;
    if (S === 'naive' || S === 'blatant') return 'bad';
    if (S === 'patient') return r >= 3 ? 'bad' : 'good';
    const pace = r > 1 ? s.profit / (r - 1) * 5 : 99;
    return (r >= 3 || pace >= s.target) ? 'disguised' : 'good';
  }
  function botWork(s, i, I, D) {
    const p = s.P[i], L = s.loyalTier, tok = TOKENS;
    const mode = p.sab ? sabMode(s) : 'loyal';
    const tier = p.sab ? (s.sabTier === 'smart' ? 'smart' : 'basic') : L;
    let cost, prop, hand, redeal = false;
    if (mode === 'loyal' || mode === 'good') {
      [cost, prop, hand] = argmax(plans(I, D), x => [evs(x[1]), -x[0]]);
      if (evs(prop) <= -1) {
        const R = draw3(s); discard(s, I); redeal = true;
        [cost, prop, hand] = argmax(plans(R, D, 1), x => [evs(x[1]), -x[0]]); cost += 2;
      }
    } else if (mode === 'bad') {
      [cost, prop, hand] = argmax(plans(I, D), x => [-evs(x[1]), -x[0]]);
    } else {
      [cost, prop, hand] = argmax(plans(I, D), ([c, pr]) => {
        const env = { cards: pr, revealed: revealPositive(pr, tok - c), stamp: 'Risky' };
        return [evs(pr) <= -1 ? 1 : 0, estimate(env, L, true) - evs(pr)];
      });
    }
    const left = tok - cost, v = evs(prop);
    let stamp, rev;
    if (mode === 'loyal' || mode === 'good') {
      stamp = v >= 2 ? 'Rec' : v >= 0 ? 'Risky' : 'Not';
      rev = tier === 'naive' ? [] : v >= 1 ? revealPositive(prop, left, tier === 'smart') : [];
    } else if (mode === 'bad') {
      stamp = 'Rec'; rev = s.sabTier === 'naive' ? [] : revealPositive(prop, left);
    } else { stamp = 'Risky'; rev = revealPositive(prop, left); }
    const style = s.reqStyle || (rand(s) < 0.75 ? p.fav : randomStyle(s));
    return [{ author: i, cards: prop, stamp, revealed: rev, subject: randomSubject(s), style: Object.assign({}, style), mode, cost: cost + rev.length, redeal }, hand];
  }
  function autopilot(s, i, I, D) {
    const cards = draw3(s); discard(s, I);
    return [{ author: i, cards, stamp: 'Risky', revealed: [], autopilot: true, subject: 'Interim Management Update', style: { color: 'manila', trim: 'plain' }, mode: 'autopilot', cost: 0 }, D];
  }
  function accuse(s, by, target, stamp, val, truthful) {
    s.memos.push({ by, target, kind: 'report', stamp, val, truthful });
    (s.accused[target] = s.accused[target] || []).push(by);
    s.P[target].accusations++;
  }
  function botInheritMemo(s, i, inh) {
    const p = s.P[i];
    if (p.leave || inh.kind !== 'rejected' || inh.author == null || inh.author === i) return;
    const v = evs(inh.cards), a = inh.author;
    if (!p.sab && s.loyalTier === 'smart') {
      if ((inh.stamp === 'Rec' && v <= -1) || (inh.stamp === 'Risky' && v <= -2)) accuse(s, i, a, inh.stamp, v, true);
      else if (v >= 2 && rand(s) < 0.5) s.memos.push({ by: i, target: a, kind: 'vouch', truthful: true });
    } else if (p.sab && s.sabTier === 'smart' && !s.P[a].leave) {
      const lie = !(inh.stamp === 'Rec' && v <= -1);
      accuse(s, i, a, 'Rec', lie ? pickOne(s, [-2, -3, -3, -4]) : v, !lie);
    }
  }
  const tierOf = (s, i) => (s.P[i].sab ? (s.sabTier === 'smart' ? 'smart' : 'basic') : s.loyalTier);
  function viewValue(s, i, e) { return e.author === i ? evs(e.cards) : estimate(e, s.loyalTier, i === s.ceo); }
  function botAuditVote(s, i) {
    const c = s.envs.filter(e => !e.autopilot);
    if (!c.length) return 'none';
    const p = s.P[i];
    if (p.sab) {
      if (s.sabTier === 'naive' || s.sabTier === 'blatant') return 'none';
      const sorted = c.slice().sort((a, b) => viewValue(s, i, b) - viewValue(s, i, a));
      const top = sorted[0];
      if (top.author === i && evs(top.cards) <= 0) return sorted[1] ? sorted[1].id : 'none';
      return top.id;
    }
    if (s.loyalTier === 'naive') return pickOne(s, c).id;
    return argmax(c, e => [viewValue(s, i, e)]).id;
  }
  function botPick(s) {
    const ceo = s.ceo, L = s.loyalTier, envs = s.envs;
    const est = e => estimate(e, L, true);
    if (s.P[ceo].sab) {
      const top = Math.max(...envs.map(est));
      const deny = envs.filter(e => est(e) >= top - SLACK);
      return argmax(deny, e => [-(e.author === ceo || e.audited || e.autopilot ? evs(e.cards) : est(e))]).id;
    }
    if (L === 'naive') {
      const rank = { Rec: 2, Risky: 1, Not: 0 }; const top = Math.max(...envs.map(e => rank[e.stamp]));
      return pickOne(s, envs.filter(e => rank[e.stamp] === top)).id;
    }
    return argmax(envs, e => [e.author === ceo ? evs(e.cards) : est(e)]).id;
  }
  function botWarnVote(s, i) {
    const c = Object.keys(s.accused).map(Number).filter(t => t !== i && !s.P[t].leave);
    if (!c.length) return 'none';
    return argmax(c, t => [s.accused[t].length, s.P[t].accusations, s.P[t].warnings]);
  }
  const suspicion = (s, q) => q.claims + 4 * Math.min(q.accusations, 2);
  function botWhistle(s, i) {
    const others = s.P.filter(q => q.id !== i);
    if (!s.P[i].sab && s.loyalTier === 'naive') return pickOne(s, others).id;
    const best = argmax(others, q => [suspicion(s, q), q.warnings, -q.id]);
    return suspicion(s, best) < 3 ? 'none' : best.id;
  }
  function botDesign(s) {
    const d = s.P.find(p => p.spec === 'Designer');
    if (!d || isHuman(s, d.id) || d.leave) return;
    if (d.sab && rand(s) < 0.6) { const loyal = pickOne(s, s.P.filter(p => p.id !== d.id)); s.nextStyle = Object.assign({}, loyal.fav); }
    else s.nextStyle = rand(s) < 0.5 ? randomStyle(s) : null;
  }

  // ---------- round flow ----------
  function startRound(s, E) {
    s.r++; s.memos = []; s.accused = {}; s.audit = null; s.pick = null; s.warn = null; s.result = null;
    s.reqStyle = s.nextStyle; s.nextStyle = null;
    s.assign = shuffle(s, range(s.n));
    s.ceo = chooseCEO(s); s.P[s.ceo].ceoTurns++;
    s.envs = []; s.left = {}; s.work = {};
    for (let i = 0; i < s.n; i++) {
      const d = s.assign[i], inh = s.hands[d], p = s.P[i];
      p.dept = d; p.inh = inh;
      const D = draw3(s);
      if (p.leave) { const [e, h] = autopilot(s, i, inh.cards, D); e.dept = d; s.envs.push(e); s.left[d] = h; continue; }
      if (isHuman(s, i)) { s.work[i] = { D, R: draw3(s) }; continue; }
      botInheritMemo(s, i, inh);
      const [e, h] = botWork(s, i, inh.cards, D); e.dept = d; s.envs.push(e); s.left[d] = h;
    }
    log(s, E, 'system', `Q${s.r} begins. ${who(s, s.ceo, 1)} ${isAre(s, s.ceo)} CEO this quarter.`);
    if (s.reqStyle) log(s, E, 'system', `The Designer has mandated ${s.reqStyle.color} envelopes with ${s.reqStyle.trim} trim this quarter.`);
    s.phase = 'work';
    if (!Object.keys(s.work).length) toPitch(s, E);
  }
  function workCost(w) { return (w.redeal ? 2 : 0) + SWAP_COST[w.swaps.length] + w.reveals.length; }
  function workResult(s, i, w) {
    const inh = s.P[i].inh, wk = s.work[i];
    const base = w.redeal ? wk.R : inh.cards;
    const prop = base.map((c, su) => (w.swaps.includes(su) ? wk.D[su] : c));
    const aside = wk.D.map((c, su) => (w.swaps.includes(su) ? base[su] : c));
    return { prop, aside };
  }
  function submitWork(s, i, a, E) {
    const w = { redeal: !!a.redeal, swaps: [...new Set(a.swaps || [])].filter(x => x >= 0 && x < 3), reveals: [...new Set(a.reveals || [])].filter(x => x >= 0 && x < 3) };
    if (workCost(w) > TOKENS) return 'Not enough work tokens.';
    if (!STAMP_LABEL[a.stamp]) return 'Stamp the envelope first.';
    const p = s.P[i], wk = s.work[i], { prop, aside } = workResult(s, i, w);
    discard(s, w.redeal ? p.inh.cards : wk.R);
    const subject = String(a.subject || '').trim().slice(0, 80) || randomSubject(s);
    const style = s.reqStyle ? Object.assign({}, s.reqStyle) : { color: COLORS.includes(a.style && a.style.color) ? a.style.color : 'manila', trim: TRIMS.includes(a.style && a.style.trim) ? a.style.trim : 'plain' };
    const e = { author: i, cards: prop, stamp: a.stamp, revealed: w.reveals, subject, style, mode: p.sab ? 'human-sab' : 'human', cost: workCost(w), redeal: w.redeal, dept: p.dept };
    s.envs.push(e); s.left[p.dept] = aside;
    const inh = p.inh;
    if (a.claim && inh.kind === 'rejected' && inh.author != null && inh.author !== i) {
      if (a.claim.kind === 'report') {
        const val = Math.max(-6, Math.min(6, Math.round(+a.claim.val || 0)));
        const st = STAMP_LABEL[a.claim.stamp] ? a.claim.stamp : inh.stamp;
        accuse(s, i, inh.author, st, val, val === evs(inh.cards) && st === inh.stamp);
      } else if (a.claim.kind === 'vouch') s.memos.push({ by: i, target: inh.author, kind: 'vouch', truthful: evs(inh.cards) >= 0 });
    }
    if (p.spec === 'Designer' && a.nextStyle && COLORS.includes(a.nextStyle.color)) s.nextStyle = { color: a.nextStyle.color, trim: TRIMS.includes(a.nextStyle.trim) ? a.nextStyle.trim : 'plain' };
    delete s.work[i];
    if (!Object.keys(s.work).length) toPitch(s, E);
    return null;
  }
  function toPitch(s, E) {
    botDesign(s);
    s.envs = shuffle(s, s.envs);
    const ids = shuffle(s, range(26).map(k => String.fromCharCode(65 + k))).slice(0, s.envs.length).sort();
    s.envs.forEach((e, k) => { e.id = ids[k]; });
    for (const m of shuffle(s, s.memos)) {
      const t = who(s, m.target);
      if (m.kind === 'report') log(s, E, 'memo', `Inherited a ${STAMP_LABEL[m.stamp]} envelope from ${t}. It was worth ${fmt(m.val)}.`, { by: m.by, target: m.target, truthful: m.truthful });
      else log(s, E, 'memo', `${s.P[m.target].human ? 'Your' : s.P[m.target].name + "'s"} handover checked out. No complaints.`, { by: m.by, target: m.target, truthful: m.truthful, vouch: true });
    }
    s.phase = 'pitch'; s.votes = {};
    for (const p of s.P) if (!isHuman(s, p.id)) s.votes[p.id] = botAuditVote(s, p.id);
    if (s.spectate) resolveAudit(s, E);
  }
  function tally(s, votes, opts) {
    const count = {};
    for (const v of Object.values(votes)) count[v] = (count[v] || 0) + 1;
    const keys = Object.keys(count); if (!keys.length) return { winner: 'none', count };
    const mx = Math.max(...keys.map(k => count[k]));
    const tied = keys.filter(k => count[k] === mx);
    if (opts && opts.noneWinsTies && tied.includes('none')) return { winner: 'none', count, top: mx };
    return { winner: pickOne(s, tied.sort()), count, top: mx };
  }
  function resolveAudit(s, E) {
    const { winner, count } = tally(s, s.votes);
    s.audit = { votes: s.votes, count, winner };
    const e = s.envs.find(x => x.id === winner);
    if (e) { e.audited = true; log(s, E, 'event', `Audit opened envelope ${e.id}: worth ${fmt(evs(e.cards))}${e.cards.some(c => c.v === 'V') ? ' plus volatility' : ''}.`); }
    else log(s, E, 'event', 'The table declined to audit anything.');
    s.phase = 'decide';
  }
  function approve(s, id, E) {
    const e = s.envs.find(x => x.id === id); if (!e) return 'No such envelope.';
    e.approved = true;
    e.resolved = e.cards.map(c => (c.v === 'V' ? (rand(s) < 0.5 ? 2 : -2) : c.v));
    const actual = e.resolved.reduce((a, b) => a + b, 0);
    const pubBest = Math.max(...s.envs.map(x => estimate(x, s.loyalTier, false)));
    s.profit += actual;
    const author = s.P[e.author];
    if (!e.autopilot) { author.approved.push({ r: s.r, stamp: e.stamp, actual }); author.claims += STAMP_CLAIM[e.stamp] - actual; }
    s.pick = id; s.result = { id, actual, author: e.author, ceo: s.ceo, own: e.author === s.ceo };
    s.ledger.push({ r: s.r, id, subject: e.subject, author: e.author, ceo: s.ceo, actual, stamp: e.stamp, autopilot: !!e.autopilot });
    log(s, E, 'event', `${who(s, s.ceo, 1)} approved envelope ${id}. Profit ${actual >= 0 ? 'up' : 'down'} ${Math.abs(actual)}. Author: ${e.autopilot ? 'interim management (' + whose(s, e.author) + ' department)' : who(s, e.author, 1)}.`);
    if (e.author === s.ceo && !e.autopilot) log(s, E, 'event', 'The CEO approved their own envelope. This has been noted.');
    if (s.loyalTier === 'smart') {
      if (!e.autopilot && e.stamp === 'Rec' && actual <= -1) { (s.accused[e.author] = s.accused[e.author] || []).push('table'); author.accusations++; log(s, E, 'event', `A Recommended envelope lost money. Questions are being asked of ${who(s, e.author)}.`, { target: e.author }); }
      if (estimate(e, s.loyalTier, false) <= pubBest - 3 && !s.P[s.ceo].human) { (s.accused[s.ceo] = s.accused[s.ceo] || []).push('table'); s.P[s.ceo].accusations++; log(s, E, 'event', `${who(s, s.ceo, 1)} passed over a far better-looking envelope.`, { target: s.ceo }); }
    }
    s.phase = 'reveal'; s.wvotes = {};
    for (const p of s.P) if (!isHuman(s, p.id)) s.wvotes[p.id] = botWarnVote(s, p.id);
    if (s.spectate) resolveWarn(s, E);
    return null;
  }
  function resolveWarn(s, E) {
    const votes = s.wvotes, count = {};
    for (const v of Object.values(votes)) if (v !== 'none') count[v] = (count[v] || 0) + 1;
    let target = null, passed = false;
    const ks = Object.keys(count);
    if (ks.length) {
      const mx = Math.max(...ks.map(k => count[k]));
      target = +pickOne(s, ks.filter(k => count[k] === mx).sort());
      passed = mx > s.n / 2;
    }
    s.warn = { votes, count, target, passed };
    if (target != null && passed) {
      const t = s.P[target]; t.warnings++;
      if (t.warnings >= 2 && !t.leave) { t.leave = true; log(s, E, 'event', `${who(s, target, 1)} received a second Written Warning and ${t.human ? 'are' : 'has been'} placed on garden leave. ${t.human ? 'Your' : 'Their'} department is now on autopilot.`); }
      else log(s, E, 'event', `${who(s, target, 1)} received a Written Warning.`);
    } else if (target != null) log(s, E, 'event', `A motion to warn ${who(s, target)} did not reach a majority.`);
    s.phase = 'review';
  }
  function handovers(s) {
    const nh = range(s.n).map(() => null);
    for (const e of s.envs) {
      const d = e.dept;
      if (e.id === s.pick) { discard(s, e.cards); nh[d] = { cards: s.left[d], author: e.autopilot ? null : e.author, kind: 'cleanup' }; }
      else {
        discard(s, s.left[d]);
        nh[d] = e.autopilot ? { cards: e.cards, author: null, kind: 'autopilot' } : { cards: e.cards, author: e.author, kind: 'rejected', stamp: e.stamp, subject: e.subject, style: e.style, id: e.id };
      }
    }
    s.history.push({ r: s.r, ceo: s.ceo, envs: JSON.parse(JSON.stringify(s.envs)), pick: s.pick, audit: s.audit ? s.audit.winner : 'none', memos: s.memos.slice(), warn: s.warn });
    s.hands = nh;
  }
  function next(s, E) {
    handovers(s);
    if (s.r < ROUNDS) startRound(s, E);
    else {
      s.phase = 'whistle'; s.envs = []; s.wb = {};
      for (const p of s.P) if (!isHuman(s, p.id)) s.wb[p.id] = botWhistle(s, p.id);
      if (s.spectate) resolveWhistle(s, E);
    }
  }
  function resolveWhistle(s, E) {
    const { winner, count } = tally(s, s.wb, { noneWinsTies: true });
    s.whistle = { votes: s.wb, count, named: winner === 'none' ? null : +winner };
    if (s.whistle.named != null) {
      const q = s.P[s.whistle.named];
      s.whistle.correct = q.sab; s.profit += q.sab ? 3 : -3;
      log(s, E, 'event', q.sab ? `The table named ${who(s, q.id)}. Correctly. Whistleblower settlement received: +3.` : `The table named ${who(s, q.id)}, who ${q.human ? 'were' : 'was'} loyal. Wrongful dismissal claim settled out of court: −3.`);
    } else log(s, E, 'event', 'The table declined to name anyone.');
    s.win = s.profit >= s.target; s.phase = 'end';
    log(s, E, 'system', s.win ? `Final profit ${fmt(s.profit)} against a target of +${s.target}. Target met.` : `Final profit ${fmt(s.profit)} against a target of +${s.target}. Target missed.`);
  }
  function fmt(v) { if (v === 'V') return '±2'; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); }

  // ---------- the one entry point ----------
  function apply(state, seat, a) {
    const s = JSON.parse(JSON.stringify(state)); const E = [];
    const humanTurn = seat === humanSeat(s);
    let err = null;
    switch (a.type) {
      case 'begin': if (s.phase !== 'brief') err = 'Already started.'; else startRound(s, E); break;
      case 'submitWork': if (s.phase !== 'work' || !s.work[seat]) err = 'Not your turn to work.'; else err = submitWork(s, seat, a, E); break;
      case 'auditVote':
        if (s.phase !== 'pitch' || !humanTurn) { err = 'No audit vote open.'; break; }
        if (a.target !== 'none' && !s.envs.some(e => e.id === a.target && !e.autopilot)) { err = 'Pick an envelope or none.'; break; }
        s.votes[seat] = a.target; resolveAudit(s, E); break;
      case 'approve': if (s.phase !== 'decide' || seat !== s.ceo || !humanTurn) err = 'Only the CEO can approve.'; else err = approve(s, a.id, E); break;
      case 'warnVote':
        if (s.phase !== 'reveal' || !humanTurn) { err = 'No warning vote open.'; break; }
        s.wvotes[seat] = a.target === 'none' ? 'none' : +a.target; resolveWarn(s, E); break;
      case 'whistleVote':
        if (s.phase !== 'whistle' || !humanTurn) { err = 'No vote open.'; break; }
        s.wb[seat] = a.target === 'none' ? 'none' : +a.target; resolveWhistle(s, E); break;
      case 'advance':
        if (s.phase === 'decide' && (s.spectate || s.ceo !== seat)) approve(s, botPick(s), E);
        else if (s.phase === 'review') next(s, E);
        else if (s.phase === 'brief') startRound(s, E);
        else err = 'Nothing to advance.';
        break;
      default: err = 'Unknown action.';
    }
    return err ? { error: err } : { state: s, events: E };
  }

  return { apply, newGame, workResult, workCost, estimate, evs, ev, fmt, ceoSchedule, suspicion, randomSubject: s => randomSubject(s), rand,
    SUITS, SUBJ, COLORS, TRIMS, DEPTS, STAMP_LABEL, SWAP_COST, TOKENS, ROUNDS, TARGETS, MU };
})();
if (typeof module !== 'undefined') module.exports = OP;

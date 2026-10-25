// Game rules and state. Pure: no DOM, no Math.random, no clock.
// apply(state, seat, action) -> { state, events } | { error }
const OP = (() => {
  const C = typeof OP_CONTENT !== 'undefined' ? OP_CONTENT : require('./content.js');
  const B = typeof OP_BOTS !== 'undefined' ? OP_BOTS : require('./bots.js');
  const { DISPUTE, SUITS, WORDS, VALUES, FX, NAMES, DEPTS, TEMPLATES, FONTS, SUBJ, LEX } = C, { PERS, PERS_SAY } = B;
  const MU = VALUES.reduce((a, v) => a + (v === 'V' ? 0 : v), 0) / VALUES.length;
  const TARGETS = { 4: 19, 5: 21, 6: 22, 7: 23, 8: 23 };
  const MEMO = { 4: [[0, .2], [1, .8]], 5: [[0, .2], [1, .8]], 6: [[0, .2], [1, .4], [2, .4]], 7: [[0, .2], [1, .4], [2, .4]], 8: [[0, .2], [1, .4], [2, .4]] };
  const STAMP_W = { naive: 1.5, basic: 1.5, smart: 0.5 };
  const STAMP_ADJ = { Rec: 1, Risky: 0, Not: -1.5 };
  const STAMP_CLAIM = { Rec: 2.5, Risky: 0.5, Not: -1 };
  const STAMP_LABEL = { Rec: 'Recommended', Risky: 'Risky', Not: 'Not Recommended' };
  const SWAP_COST = [0, 1, 3, 6];
  const FX_SLOTS = VALUES.reduce((a, v, k) => (v === 0 ? a.concat(k) : a), []);
  const TOKENS = 3, ROUNDS = 5, SLACK = 2;

  const lexOf = s => LEX[s.brand] || LEX.op;

  // ---------- rng (s.rs) ----------
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
  // effect Modifiers rewrite Action + Target
  function total(vals, cards) {
    const fx = cards[2] && cards[2].fx, a = vals[0], b = vals[1], own = vals[2];
    if (fx === 'null') return own;
    if (fx === 'x2') return own + 2 * (a + b);
    if (fx === 'shield') return own + Math.max(0, a) + Math.max(0, b);
    if (fx === 'flip') return own - (a + b);
    return a + b + own;
  }
  const evs = cs => total(cs.map(ev), cs);
  function cmp(a, b) { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] - b[i]; } return 0; }
  function argmax(xs, key) { let best = null, bk = null; for (const x of xs) { const k = key(x); if (best === null || cmp(k, bk) > 0) { best = x; bk = k; } } return best; }

  // ---------- deck ----------
  function newDeck(s) {
    const piles = SUITS.map((_, su) => {
      const L = lexOf(s);
      if (su !== 2) {
        const own = su === 1 ? L.t : [], words = shuffle(s, shuffle(s, WORDS[su].concat(WORDS[su])).slice(own.length).concat(own));
        return shuffle(s, VALUES.map((v, k) => ({ id: `${su}.${k}`, s: su, v, w: words[k] })));
      }
      const plain = WORDS[2].filter(w => !FX.some(f => f[0] === w)), words = shuffle(s, shuffle(s, plain.concat(plain, plain)).slice(L.m.length).concat(L.m));
      let n = 0;
      return shuffle(s, VALUES.map((v, k) => {
        const f = FX[FX_SLOTS.indexOf(k)];
        return f ? { id: `2.${k}`, s: 2, v: f[2], w: f[0], fx: f[1] } : { id: `2.${k}`, s: 2, v, w: words[n++] };
      }));
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
  // believed worth; seeRev = CEO view
  function estimate(e, tier, seeRev) {
    if (e.audited || e.autopilot) return evs(e.cards);
    const rv = e.revealed;
    const known = rv.reduce((a, su) => a + ev(e.cards[su]), 0);
    const mu = MU - (tier === 'smart' ? 0.4 : 0);
    return known + (3 - rv.length) * mu + STAMP_W[tier] * STAMP_ADJ[e.stamp];
  }
  function revealPositive(prop, tokens, all) {
    const order = [0, 1, 2].sort((a, b) => ev(prop[b]) - ev(prop[a]));
    return (all ? order : order.filter(su => ev(prop[su]) > 0)).slice(0, Math.max(0, tokens));
  }
  const subjLists = s => SUBJ.map((l, i) => (i === 1 ? l.concat(lexOf(s).subj, lexOf(s).subj) : l));
  const randomSubject = s => subjLists(s).map(l => pickOne(s, l)).join(' ');
  const randomStyle = s => ({ tpl: pickOne(s, TEMPLATES), font: pickOne(s, FONTS) });

  // ---------- setup ----------
  function newGame(opts) {
    const n = Math.max(4, Math.min(8, opts.players || 4));
    const s = {
      v: 1, rs: (opts.seed >>> 0) || 1, seed: opts.seed >>> 0, n, spectate: !!opts.spectate,
      brand: LEX[opts.brand] ? opts.brand : 'op',
      loyalTier: opts.loyalTier || 'smart', sabTier: opts.sabTier || 'smart', easy: !!opts.easy,
      target: TARGETS[n] - (opts.easy ? 3 : 0), profit: 0, r: 0, phase: 'brief',
      feed: [], ledger: [], history: [], memos: [], accused: {}, envs: [], left: {}, work: {},
    };
    s.subj = subjLists(s);
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
      warnings: 0, leave: false, accusations: 0, claims: 0, approved: [], ceoTurns: 0, skipCEO: false,
    }));
    const pers = shuffle(s, Object.keys(PERS).concat(Object.keys(PERS)));
    s.P.forEach((p, k) => { p.pers = pers[k]; p.ruthless = p.sab && s.sabTier === 'smart' && rand(s) < 0.5; });
    initMind(s);
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
      const act0 = s.P.filter(p => !p.leave && !p.skipCEO), act = act0.length ? act0 : s.P.filter(p => !p.leave); const mx = Math.max(...act.map(p => p.approved.length));
      return pickOne(s, act.filter(p => p.approved.length === mx)).id;
    }
    const base = (s.r - 1) % n;
    for (let k = 0; k < n; k++) {
      const c = s.ceoOrder[(base + k) % n];
      if (s.P[c].skipCEO) { s.P[c].skipCEO = false; continue; }
      if (!s.P[c].leave) return c;
    }
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

  function accuse(s, by, target, stamp, val, truthful) {
    s.memos.push({ by, target, kind: 'report', stamp, val, truthful });
    (s.accused[target] = s.accused[target] || []).push(by);
    s.P[target].accusations++;
  }

  const pubEst = (s, e) => estimate(e, s.loyalTier, false);
  const { initMind, observe, botDisputes, botWork, autopilot, botInheritMemo, botPick, botWarnVote, botWhistle, botDesign, botBoardVote, suspicion } = B.make({ rand, pickOne, argmax, ev, STAMP_ADJ, evs, estimate, plans, draw3, discard, revealPositive, randomSubject, randomStyle, isHuman, accuse, pubEst, TOKENS, SLACK });

  // ---------- round flow ----------
  function startRound(s, E) {
    s.r++; s.memos = []; s.accused = {}; s.audit = null; s.pick = null; s.warn = null; s.result = null; s.nominee = null; s.bvotes = {}; s.board = null;
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
    if (s.reqStyle) log(s, E, 'system', `The Designer has mandated ${s.reqStyle.tpl} cover pages in ${s.reqStyle.font} this quarter.`);
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
    if (!STAMP_LABEL[a.stamp]) return 'Stamp the cover page first.';
    const p = s.P[i], wk = s.work[i], { prop, aside } = workResult(s, i, w);
    discard(s, w.redeal ? p.inh.cards : wk.R);
    const subject = String(a.subject || '').trim().slice(0, 80) || randomSubject(s);
    const st = a.style || {}, style = s.reqStyle ? Object.assign({}, s.reqStyle) : { tpl: TEMPLATES.includes(st.tpl) ? st.tpl : 'memo', font: FONTS.includes(st.font) ? st.font : 'grotesk' };
    // alignment and clip-art are cosmetic
    if (['left', 'center', 'right'].includes(st.align)) style.align = st.align;
    if (typeof st.art === 'string') style.art = st.art.slice(0, 24);
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
    if (p.spec === 'Designer' && a.nextStyle && TEMPLATES.includes(a.nextStyle.tpl)) s.nextStyle = { tpl: a.nextStyle.tpl, font: FONTS.includes(a.nextStyle.font) ? a.nextStyle.font : 'grotesk' };
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
      if (m.kind === 'report') log(s, E, 'memo', `Inherited a ${STAMP_LABEL[m.stamp]} proposal from ${t}. It was worth ${fmt(m.val)}.`, { by: m.by, target: m.target, truthful: m.truthful });
      else log(s, E, 'memo', `${s.P[m.target].human ? 'Your' : s.P[m.target].name + "'s"} handover checked out. No complaints.`, { by: m.by, target: m.target, truthful: m.truthful, vouch: true });
    }
    for (const d of botDisputes(s)) log(s, E, 'memo', pickOne(s, DISPUTE).replace('{n}', who(s, d.target)), { by: d.by, target: d.target, truthful: d.truthful, dispute: true });
    s.phase = 'decide';
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
  // CEO nominates; the Board ratifies or opens it, and overrules if it disappoints.
  function nominate(s, id, E) {
    const e = s.envs.find(x => x.id === id); if (!e) return 'No such proposal.';
    s.nominee = id; s.bvotes = {};
    log(s, E, 'event', `${who(s, s.ceo, 1)} nominated proposal ${id}. The Board is voting.`);
    for (const p of s.P) if (p.id !== s.ceo && !isHuman(s, p.id)) s.bvotes[p.id] = botBoardVote(s, p.id);
    s.phase = 'board';
    if (s.spectate || s.ceo === humanSeat(s)) resolveBoard(s, E);
    return null;
  }
  function resolveBoard(s, E) {
    const voters = s.n - 1, no = Object.values(s.bvotes).filter(v => v === 'open').length;
    const nom = s.envs.find(x => x.id === s.nominee), opened = no > voters / 2;
    if (opened) { nom.audited = true; s.audit = { winner: nom.id }; log(s, E, 'event', `The Board opened proposal ${nom.id}: worth ${fmt(evs(nom.cards))}${nom.cards.some(c => c.v === 'V') ? ' plus volatility' : ''}.`); }
    const best = argmax(s.envs, x => [pubEst(s, x)]);
    const overruled = opened && best.id !== nom.id && pubEst(s, nom) < pubEst(s, best) - 1;
    s.board = { nominee: nom.id, votes: s.bvotes, no, opened, overruled };
    if (!overruled) { log(s, E, 'event', opened ? `It stands. Proposal ${nom.id} goes through.` : `The Board ratified proposal ${nom.id} (${voters - no}–${no}).`); return approve(s, nom.id, E); }
    const own = nom.author === s.ceo && !nom.autopilot;
    nom.unmasked = true; s.board.own = own; s.board.author = nom.autopilot ? null : nom.author;
    log(s, E, 'event', `The Board overruled ${who(s, s.ceo)}. Proposal ${nom.id} was written by ${nom.autopilot ? 'interim management' : own ? 'the CEO' : who(s, nom.author)}. Proposal ${best.id} goes through instead.`, { target: s.ceo });
    (s.accused[s.ceo] = s.accused[s.ceo] || []).push('table'); s.P[s.ceo].accusations++;
    if (own) { s.P[s.ceo].skipCEO = true; log(s, E, 'event', `${who(s, s.ceo, 1)} tried to push ${s.P[s.ceo].human ? 'your' : 'their'} own proposal and will sit out ${s.P[s.ceo].human ? 'your' : 'their'} next turn as CEO.`, { target: s.ceo }); }
    return approve(s, best.id, E);
  }
  function approve(s, id, E) {
    const e = s.envs.find(x => x.id === id); if (!e) return 'No such proposal.';
    e.approved = true;
    e.resolved = e.cards.map(c => (c.v === 'V' ? (rand(s) < 0.5 ? 2 : -2) : c.v));
    const actual = total(e.resolved, e.cards);
    const pubBest = Math.max(...s.envs.map(x => estimate(x, s.loyalTier, false)));
    s.profit += actual;
    const author = s.P[e.author];
    if (!e.autopilot) { author.approved.push({ r: s.r, stamp: e.stamp, actual }); author.claims += STAMP_CLAIM[e.stamp] - actual; }
    s.pick = id; s.result = { id, actual, author: e.author, ceo: s.ceo, own: e.author === s.ceo };
    s.ledger.push({ r: s.r, id, subject: e.subject, author: e.author, ceo: s.ceo, actual, stamp: e.stamp, autopilot: !!e.autopilot });
    log(s, E, 'event', `${who(s, s.ceo, 1)} approved proposal ${id}. Profit ${actual >= 0 ? 'up' : 'down'} ${Math.abs(actual)}. Author: ${e.autopilot ? 'interim management (' + whose(s, e.author) + ' department)' : who(s, e.author, 1)}.`);
    if (e.author === s.ceo && !e.autopilot) log(s, E, 'event', 'The CEO approved their own proposal. This has been noted.');
    if (s.loyalTier === 'smart') {
      if (!e.autopilot && e.stamp === 'Rec' && actual <= -1) { (s.accused[e.author] = s.accused[e.author] || []).push('table'); author.accusations++; log(s, E, 'event', `A Recommended proposal lost money. Questions are being asked of ${who(s, e.author)}.`, { target: e.author }); }
      if (e.author === s.ceo && !e.autopilot && actual <= -1 && e.stamp !== 'Rec') { (s.accused[s.ceo] = s.accused[s.ceo] || []).push('table'); s.P[s.ceo].accusations++; log(s, E, 'event', `${who(s, s.ceo, 1)} approved ${s.P[s.ceo].human ? 'your' : 'their'} own proposal and it lost money.`, { target: s.ceo }); }
      if (estimate(e, s.loyalTier, false) <= pubBest - 3 && !(s.board && s.board.overruled)) { (s.accused[s.ceo] = s.accused[s.ceo] || []).push('table'); s.P[s.ceo].accusations++; log(s, E, 'event', `${who(s, s.ceo, 1)} passed over a far better-looking proposal.`, { target: s.ceo }); }
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
      if (t.warnings >= 2 && !t.leave) { t.leave = true; log(s, E, 'event', `${who(s, target, 1)} received a second Written Warning and ${t.human ? 'have been' : 'has been'} stood down. ${t.human ? 'Your' : 'Their'} department is now on autopilot.`); }
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
    observe(s);
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
      // Clawback: reverse a caught saboteur's losses (min +3)
      const lost = s.ledger.filter(l => l.author === q.id && !l.autopilot && l.actual < 0);
      const back = lost.reduce((a, l) => a - 2 * l.actual, 0);
      const swing = q.sab ? Math.max(3, back) : -3;
      s.whistle.correct = q.sab; s.whistle.swing = swing; s.whistle.clawed = q.sab ? lost.map(l => ({ r: l.r, id: l.id, actual: l.actual })) : [];
      s.profit += swing;
      log(s, E, 'event', q.sab ? (lost.length ? `The table named ${who(s, q.id)}. Correctly. Clawback: ${lost.length === 1 ? 'their losing policy is' : `all ${lost.length} of their losing policies are`} reversed, ${fmt(swing)}.` : `The table named ${who(s, q.id)}. Correctly. Whistleblower settlement received: +3.`) : `The table named ${who(s, q.id)}, who ${q.human ? 'were' : 'was'} loyal. Wrongful dismissal claim settled out of court: −3.`);
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
      case 'approve': if (s.phase !== 'decide' || seat !== s.ceo || !humanTurn) err = 'Only the CEO can nominate.'; else err = nominate(s, a.id, E); break;
      case 'boardVote':
        if (s.phase !== 'board' || !humanTurn || seat === s.ceo) { err = 'No Board vote open.'; break; }
        // 'overrule' is the old UI's word for 'open'
        s.bvotes[seat] = a.vote === 'open' || a.vote === 'overrule' ? 'open' : 'ratify'; resolveBoard(s, E); break;
      case 'warnVote':
        if (s.phase !== 'reveal' || !humanTurn) { err = 'No warning vote open.'; break; }
        s.wvotes[seat] = a.target === 'none' ? 'none' : +a.target; resolveWarn(s, E); break;
      case 'whistleVote':
        if (s.phase !== 'whistle' || !humanTurn) { err = 'No vote open.'; break; }
        s.wb[seat] = a.target === 'none' ? 'none' : +a.target; resolveWhistle(s, E); break;
      case 'advance':
        if (s.phase === 'decide' && (s.spectate || s.ceo !== seat)) nominate(s, botPick(s), E);
        else if (s.phase === 'board') { if (humanSeat(s) >= 0 && !(humanSeat(s) in s.bvotes)) s.bvotes[humanSeat(s)] = 'ratify'; resolveBoard(s, E); }
        else if (s.phase === 'review') next(s, E);
        else if (s.phase === 'brief') startRound(s, E);
        else err = 'Nothing to advance.';
        break;
      default: err = 'Unknown action.';
    }
    return err ? { error: err } : { state: s, events: E };
  }

  return { PERS_SAY, apply, newGame, workResult, workCost, estimate, evs, ev, total, fmt, FX, ceoSchedule, suspicion, randomSubject: s => randomSubject(s), rand,
    SUITS, SUBJ, LEX, TEMPLATES, FONTS, DEPTS, STAMP_LABEL, SWAP_COST, TOKENS, ROUNDS, TARGETS, MU };
})();
if (typeof module !== 'undefined') module.exports = OP;

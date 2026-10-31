// Petty Cash rules and state. Pure: no DOM, no Math.random, no clock.
// apply(state, seat, action) -> { state, events } | { error }
const PC = (() => {
  const C = typeof PC_CARDS !== 'undefined' ? PC_CARDS : require('./cards.js');
  const B = typeof PC_BOTS !== 'undefined' ? PC_BOTS : require('./bots.js');
  const { CO, SUR, ACTIONS, DIE, NAMES, PROMPTS, ANSWERS } = C;
  // tuning, set by sim/petty/run.js
  const T = { laps: 6, rent: 0.7, rise: 0.1, tin: 1.12, cash: 0.7, act: 2, weasel: 0.25, hand: 10, tinN: { 3: 1.2, 4: 1.15, 5: 1.06, 6: 1, 7: 0.96, 8: 0.92 }, tinCo: { party: 0.9, funeral: 1, mining: 0.97 } };
  const SMAX = Math.max(...SUR.map(x => x[1]));

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
  const round5 = x => Math.max(0, Math.round(x / 5) * 5);

  // ---------- money ----------
  const avgGuide = co => {
    const w = co.who.reduce((a, x) => a + x[1], 0) / co.who.length, b = co.what.reduce((a, x) => a + x[1], 0) / co.what.length;
    return w * b;
  };
  const guideOf = (who, what) => round5((who ? who.v : 1) * what.v);
  const itemOf = (who, what) => (who ? who.name + ' ' : '') + what.name;
  // share of honest receipts for this guide price that would cost less than the claim
  const honestQ = (guide, c) => SUR.filter(x => guide * x[1] < c).length / SUR.length;
  const rentFor = (s, i) => {
    const lap = s.freeze === s.lap ? s.lap - 1 : s.lap;
    return round5(s.rent0 * (1 + T.rise * (lap - 1)) * (s.P[i].letter ? 2 : 1));
  };

  // ---------- setup ----------
  function newGame(opts) {
    const n = Math.max(3, Math.min(8, opts.players || 5));
    const co = CO[opts.co] ? opts.co : 'party';
    const s = {
      v: 1, rs: (opts.seed >>> 0) || 1, seed: opts.seed >>> 0, n, co, spectate: !!opts.spectate,
      lap: 1, phase: 'shop', turn: 0, start: 0, freeze: 0, cur: null, feed: [], claims: [], answers: [], pile: [], disc: [], end: null,
    };
    const A = avgGuide(CO[co]);
    s.rent0 = round5(A * T.rent);
    s.tin0 = s.tin = Math.round(T.tin * T.tinN[n] * T.tinCo[co] * n * T.laps * A / 100) * 100;
    const names = shuffle(s, NAMES);
    s.P = range(n).map(i => ({ id: i, name: i === 0 && !s.spectate ? 'You' : names[i], human: i === 0 && !s.spectate, bank: 0, hand: [], halo: 0, caught: 0, weasels: 0, key: false, letter: false, claims: 0, pads: 0, greed: 0.2 + 0.6 * rand(s) }));
    // bots answer the quick-fire
    for (const p of s.P) if (!p.human) for (let k = 0; k < 2 + ri(s, 2); k++) s.answers.push({ by: p.id, q: ri(s, PROMPTS.length), text: pickOne(s, ANSWERS) });
    s.start = s.turn = ri(s, n);
    if (s.spectate) deal(s, []);
    return s;
  }
  const card = (s, k, name, v, extra) => Object.assign({ id: 'c' + (s.nid = (s.nid || 0) + 1), k, name, v }, extra || {});
  function deal(s, E) {
    const co = CO[s.co], A = avgGuide(co), pile = [];
    for (const [w, m] of co.who) for (let k = 0; k < 2; k++) pile.push(card(s, 'who', w, m));
    for (const [w, b] of co.what) pile.push(card(s, 'what', w, b));
    for (const a of s.answers) { const t = PROMPTS[a.q][1]; pile.push(card(s, 'what', tidy(a.text), co.tiers[t], { by: a.by, tier: t })); }
    const cashN = Math.round(T.cash * s.n * 2);
    for (let k = 0; k < cashN; k++) pile.push(card(s, 'cash', 'Wages', round5(A * [0.25, 0.5, 0.5, 0.75, 1][k % 5])));
    for (const key of Object.keys(ACTIONS)) for (let k = 0; k < T.act; k++) pile.push(card(s, 'act', ACTIONS[key][0], key));
    s.pile = shuffle(s, pile);
    // everyone starts with two of each receipt half
    for (const p of s.P) for (const k of ['who', 'who', 'what', 'what']) {
      const at = s.pile.findIndex(c => c.k === k); p.hand.push(s.pile.splice(at, 1)[0]);
    }
    s.phase = 'roll';
    log(s, E, 'lap', `Lap 1. Rent is $${rentFor(s, 0)}.`);
  }
  const tidy = t => { t = String(t || '').trim().replace(/\s+/g, ' ').slice(0, 40); return t ? t[0].toUpperCase() + t.slice(1) : 'Something'; };
  function draw(s) {
    if (!s.pile.length) { s.pile = shuffle(s, s.disc); s.disc = []; }
    return s.pile.pop();
  }
  const who = (s, i) => s.P[i].name;
  // 'You' reads right in the feed
  const poss = (s, i) => s.P[i].human ? 'Your' : s.P[i].name + "'s";
  const vb = (s, i, he, you) => s.P[i].human ? you : he;
  function log(s, E, kind, text, extra) { const e = Object.assign({ lap: s.lap, kind, text }, extra || {}); s.feed.push(e); E.push(e); }
  const take = (p, id) => { const at = p.hand.findIndex(c => c.id === id); return at < 0 ? null : p.hand.splice(at, 1)[0]; };
  const has = (p, key) => p.hand.find(c => c.k === 'act' && c.v === key);

  // ---------- turn ----------
  function roll(s, E) {
    const p = s.P[s.turn], k = pickOne(s, DIE), got = [];
    for (let j = 0; j < k; j++) {
      const c = draw(s); if (!c) break;
      if (c.k === 'cash') { p.bank += c.v; s.disc.push(c); } else p.hand.push(c);
      got.push(c);
    }
    s.lastRoll = { seat: s.turn, k, got: got.map(c => c.id) };
    log(s, E, 'roll', `${who(s, s.turn)} rolled ${k}.`, { seat: s.turn, k, cash: got.filter(c => c.k === 'cash').reduce((a, c) => a + c.v, 0) });
    s.phase = 'pick';
  }
  function play(s, i, a, E) {
    const p = s.P[i], c = p.hand.find(x => x.id === a.card);
    if (!c || c.k !== 'act') return 'Not an action card.';
    const key = c.v;
    if (key === 'freeze') { s.freeze = s.lap; log(s, E, 'action', `${who(s, i)} froze the rent this lap.`, { seat: i, key }); }
    else if (key === 'letter') {
      const t = +a.target; if (!(t >= 0 && t < s.n) || t === i) return 'Pick someone else.';
      s.P[t].letter = true; log(s, E, 'action', `${who(s, i)} sent ${who(s, t)} a Landlord's Letter. Double rent.`, { seat: i, key, target: t });
    } else if (key === 'creative') {
      const amt = round5(s.rent0 * 0.5); s.tin -= amt; p.bank += amt;
      log(s, E, 'action', `${who(s, i)} did some Creative Accounting. $${amt} left the tin.`, { seat: i, key });
    } else if (key === 'key') { p.key = true; log(s, E, 'action', `${who(s, i)} pocketed the Petty Cash Key.`, { seat: i, key }); }
    else if (key === 'peek') {
      if (s.phase !== 'audit' || !s.cur || s.cur.seat === i) return 'Use it while a claim is open.';
      s.cur.peeks.push(i); log(s, E, 'peek', 'Payroll Peek.', { seat: i, key, to: i });
    } else return 'That card plays itself at the right time.';
    take(p, c.id); s.disc.push(c);
    if (s.tin < 0) return finish(s, E, true);
    return null;
  }
  function pick(s, a, E) {
    const p = s.P[s.turn];
    if (a.skip) { log(s, E, 'skip', `${who(s, s.turn)} had nothing to claim.`, { seat: s.turn }); return toRent(s, E); }
    const what = p.hand.find(c => c.id === a.what && c.k === 'what');
    const whoC = a.who ? p.hand.find(c => c.id === a.who && c.k === 'who') : null;
    if (!what) return 'Pick a what card.';
    if (a.who && !whoC) return 'Pick a who/how card.';
    take(p, what.id); if (whoC) take(p, whoC.id);
    const sur = pickOne(s, SUR), guide = guideOf(whoC, what);
    s.cur = { seat: s.turn, who: whoC, what, item: itemOf(whoC, what), guide, sur: sur[0], m: sur[1], real: round5(guide * sur[1]), claim: null, calls: {}, peeks: [], nephew: false, outcome: null };
    s.phase = 'claim';
    return null;
  }
  function claim(s, a, E) {
    const c = s.cur, p = s.P[c.seat];
    const amt = round5(+a.amount);
    if (!(amt >= 0) || amt > c.guide * SMAX * 3) return 'Pick an amount.';
    c.claim = amt; p.claims++; if (amt > c.real) p.pads++;
    if (a.nephew) { const n = has(p, 'nephew'); if (!n) return 'No Nephew card.'; take(p, n.id); s.disc.push(n); c.nephew = true; }
    s.claims.push(c);
    log(s, E, 'claim', `${who(s, c.seat)} claimed $${amt} for ${c.item}.`, { seat: c.seat, item: c.item, amount: amt, guide: c.guide, nephew: c.nephew });
    if (c.nephew) return settle(s, E);
    s.phase = 'audit';
    for (const q of s.P) if (q.id !== c.seat && !q.human) {
      let call = B.auditCall(s, q.id, rand(s));
      // a bot peeks, then calls it straight
      if (call === 'peek') { const k = has(q, 'peek'); take(q, k.id); s.disc.push(k); c.peeks.push(q.id); call = c.claim > c.real ? 'audit' : 'sign'; }
      c.calls[q.id] = call;
    }
    if (!needsHuman(s)) return settle(s, E);
    return null;
  }
  function settle(s, E) {
    const c = s.cur, p = s.P[c.seat];
    const willing = Object.keys(c.calls).filter(k => c.calls[k] === 'audit').map(Number);
    const padded = c.claim > c.real;
    if (!willing.length || c.nephew) { pay(s, c.seat, c.claim); c.outcome = 'paid'; }
    else {
      if (c.auditor == null) c.auditor = pickOne(s, willing.sort((x, y) => x - y));
      const sh = has(p, 'shred');
      if (sh && !p.human && padded) return shred(s, true, E);
      if (sh && p.human && !c.noShred) { s.phase = 'shred'; return null; }
      const aud = s.P[c.auditor];
      if (padded) {
        s.tin -= c.real; p.bank += c.real - (c.claim - c.real); aud.bank += c.claim - c.real; p.caught++; c.outcome = 'caught';
        log(s, E, 'caught', `CAUGHT PADDING. ${poss(s, c.seat)} ${c.item} really cost $${c.real}.`, { seat: c.seat, real: c.real, amount: c.claim, sur: c.sur });
        log(s, E, 'bounty', `Your audit paid off: $${c.claim - c.real} bounty.`, { to: c.auditor });
      } else {
        let fine = Math.round(c.claim * T.weasel / 5) * 5;
        if (aud.key) { aud.key = false; fine = 0; }
        s.tin -= c.claim; p.bank += c.claim + fine; aud.bank -= fine; p.halo++; aud.weasels++; c.outcome = 'halo';
        log(s, E, 'halo', `${who(s, c.seat)} ${vb(s, c.seat, 'was', 'were')} investigated and cleared. The ${c.item} really did cost $${c.real}.`, { seat: c.seat, real: c.real, sur: c.sur });
        log(s, E, 'weasel', fine ? `You bad little weasel. $${fine} fine.` : 'You bad little weasel. The Petty Cash Key covered the fine.', { to: c.auditor, fine });
      }
    }
    if (s.tin < 0) return finish(s, E, true);
    return toRent(s, E);
  }
  function pay(s, i, amt) { s.tin -= amt; s.P[i].bank += amt; }
  function shred(s, use, E) {
    const c = s.cur, p = s.P[c.seat];
    if (!use) { c.noShred = true; return settle(s, E); }
    const sh = has(p, 'shred'); take(p, sh.id); s.disc.push(sh);
    pay(s, c.seat, c.guide); c.outcome = 'shredded';
    log(s, E, 'shred', `${who(s, c.seat)} shredded the records. Paid the guide price, $${c.guide}. Nobody will ever know.`, { seat: c.seat });
    if (s.tin < 0) return finish(s, E, true);
    return toRent(s, E);
  }
  function toRent(s, E) {
    s.phase = 'rent';
    const p = s.P[s.turn];
    if (!(p.human && has(p, 'free'))) return payRent(s, p.human ? false : B.useFree(s, s.turn, rentFor(s, s.turn)), E);
    return null;
  }
  function payRent(s, free, E) {
    const i = s.turn, p = s.P[i], due = rentFor(s, i);
    if (free) { const f = has(p, 'free'); if (f) { take(p, f.id); s.disc.push(f); log(s, E, 'rent', `${who(s, i)} played Free Rent.`, { seat: i, free: true }); } else free = false; }
    if (!free) {
      p.bank -= due;
      log(s, E, p.bank < 0 ? 'debt' : 'rent', p.bank < 0 ? `${who(s, i)} couldn't make rent. $${-p.bank} on the tab.` : `${who(s, i)} paid $${due} rent.`, { seat: i, due });
    }
    p.letter = false;
    // hand limit
    while (p.hand.length > T.hand) s.disc.push(p.hand.splice(0, 1)[0]);
    return nextTurn(s, E);
  }
  function nextTurn(s, E) {
    s.cur = null;
    s.turn = (s.turn + 1) % s.n;
    if (s.turn === s.start) {
      s.lap++;
      if (s.lap > T.laps) return finish(s, E, false);
      log(s, E, 'lap', `Lap ${s.lap}. Rent is $${rentFor(s, s.turn)}${s.lap === T.laps ? '. Last lap' : ''}.`);
    }
    s.phase = 'roll';
    return null;
  }
  function finish(s, E, bust) {
    const ranked = s.P.slice().sort((a, b) => b.bank - a.bank || a.id - b.id).map(p => p.id);
    s.end = { bust, ranked, winner: bust ? ranked[1] : ranked[0], jailed: bust ? ranked[0] : null };
    s.phase = 'end'; s.cur = null;
    if (bust) log(s, E, 'bust', `The tin is empty. Royal Commission. ${who(s, ranked[0])} ${vb(s, ranked[0], 'takes', 'take')} the fall. ${who(s, ranked[1])} ${vb(s, ranked[1], 'walks', 'walk')} away clean.`);
    else log(s, E, 'win', `The company survived the year. ${who(s, ranked[0])} ${vb(s, ranked[0], 'is', 'are')} Employee of the Year.`);
    return null;
  }

  // whose input the game is waiting for; -1 means a bot or the game itself
  function needsHuman(s) {
    if (s.spectate || s.phase === 'end') return false;
    if (s.phase === 'shop') return true;
    if (s.phase === 'audit') return s.cur.seat !== 0 && !(0 in s.cur.calls);
    if (['roll', 'pick', 'claim', 'shred', 'rent'].includes(s.phase)) return s.turn === 0;
    return false;
  }

  // ---------- the one entry point ----------
  function apply(state, seat, a) {
    const s = JSON.parse(JSON.stringify(state)), E = [];
    // the open claim and its ledger line are one object
    if (s.cur && s.cur.claim != null) s.claims[s.claims.length - 1] = s.cur;
    let err = null;
    const mine = !s.spectate && seat === 0;
    const myTurn = mine && s.turn === 0;
    switch (a.type) {
      case 'shop':
        if (s.phase !== 'shop' || !mine) { err = 'Not now.'; break; }
        for (const x of (a.answers || []).slice(0, 16)) if (x && PROMPTS[x.q] && String(x.text || '').trim()) s.answers.push({ by: 0, q: x.q, text: String(x.text) });
        deal(s, E); break;
      case 'roll': if (s.phase !== 'roll' || !myTurn) err = 'Not your roll.'; else roll(s, E); break;
      case 'play':
        if (!mine || !((s.phase === 'pick' && myTurn) || s.phase === 'audit')) { err = 'Not now.'; break; }
        err = play(s, 0, a, E); break;
      case 'pick': if (s.phase !== 'pick' || !myTurn) err = 'Not your turn.'; else err = pick(s, a, E); break;
      case 'claim': if (s.phase !== 'claim' || !myTurn) err = 'Not your claim.'; else err = claim(s, a, E); break;
      case 'audit':
        if (s.phase !== 'audit' || !mine || s.cur.seat === 0) { err = 'Nothing to audit.'; break; }
        s.cur.calls[0] = a.call === 'audit' ? 'audit' : 'sign'; err = settle(s, E); break;
      case 'shred': if (s.phase !== 'shred' || !myTurn) err = 'Not now.'; else err = shred(s, !!a.use, E); break;
      case 'rent': if (s.phase !== 'rent' || !myTurn) err = 'Not now.'; else err = payRent(s, !!a.free, E); break;
      case 'advance': err = advance(s, E); break;
      default: err = 'Unknown action.';
    }
    return err ? { error: err } : { state: s, events: E };
  }
  // one bot step for whoever the game is waiting on
  function advance(s, E) {
    if (needsHuman(s)) return 'Waiting for you.';
    const i = s.turn, p = s.P[i];
    switch (s.phase) {
      case 'roll': roll(s, E); return null;
      case 'pick': {
        for (const a of B.plays(s, i)) { const e = play(s, i, a, E); if (s.phase === 'end') return null; if (e) break; }
        return pick(s, B.pick(s, i), E);
      }
      case 'claim': return claim(s, B.claim(s, i, rand(s), rentFor(s, i)), E);
      case 'audit': return settle(s, E);
      case 'shred': return shred(s, true, E);
      case 'rent': return payRent(s, B.useFree(s, i, rentFor(s, i)), E);
      default: return 'Nothing to do.';
    }
  }

  return { T, apply, newGame, needsHuman, rentFor, honestQ, guideOf, itemOf, avgGuide, rand, CO, SUR, ACTIONS, PROMPTS, SMAX };
})();
if (typeof module !== 'undefined') module.exports = PC;

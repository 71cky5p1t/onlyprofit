// Petty Cash rules and state. Pure: no DOM, no Math.random, no clock.
// apply(state, seat, action) -> { state, events } | { error }
const PC = (() => {
  const C = typeof PC_CARDS !== 'undefined' ? PC_CARDS : require('./cards.js');
  const B = typeof PC_BOTS !== 'undefined' ? PC_BOTS : require('./bots.js');
  const BEATS = typeof PC_BEATS !== 'undefined' ? PC_BEATS : require('./beats.js');
  const { CO, SUR, ACTIONS, DIE, NAMES, PROMPTS, ANSWERS } = C;
  // tuning, set by sim/petty/run.js
  const T = { laps: 6, rent: 0.7, rise: 0.1, tin: 1.03, act: 2, weasel: 0.25, hand: 10, ot: 0.1, fee: 0.2, feeUp: 0.1, blast: 0.7, buckCut: 0.3, tinN: { 3: 1.2, 4: 1.15, 5: 1.06, 6: 1, 7: 0.96, 8: 0.92 }, tinCo: { party: 0.9, funeral: 1, mining: 0.97 } };
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
      lap: 1, phase: 'shop', freeze: 0, cur: null, lodged: [], rolls: [], order: [], fi: -1, pend: null, rentAsk: false, feed: [], claims: [], answers: [], pile: [], disc: [], end: null,
    };
    const A = avgGuide(CO[co]);
    s.rent0 = round5(A * T.rent);
    s.tin0 = s.tin = Math.round(T.tin * T.tinN[n] * T.tinCo[co] * n * T.laps * A / 100) * 100;
    const names = shuffle(s, NAMES);
    s.P = range(n).map(i => ({ id: i, name: i === 0 && !s.spectate ? 'You' : names[i], human: i === 0 && !s.spectate, bank: 0, hand: [], halo: 0, caught: 0, weasels: 0, key: false, letter: false, claims: 0, pads: 0, greed: 0.2 + 0.6 * rand(s), nerve: 0.35 + 0.5 * rand(s) }));
    // bots answer the quick-fire
    for (const p of s.P) if (!p.human) for (let k = 0; k < 2 + ri(s, 2); k++) s.answers.push({ by: p.id, q: ri(s, PROMPTS.length), text: pickOne(s, ANSWERS) });
    if (s.spectate) deal(s, []);
    return s;
  }
  const card = (s, k, name, v, extra) => Object.assign({ id: 'c' + (s.nid = (s.nid || 0) + 1), k, name, v }, extra || {});
  function deal(s, E) {
    const co = CO[s.co], pile = [];
    for (const [w, m] of co.who) for (let k = 0; k < 2; k++) pile.push(card(s, 'who', w, m));
    for (const [w, b] of co.what) pile.push(card(s, 'what', w, b));
    for (const a of s.answers) { const t = PROMPTS[a.q][1]; pile.push(card(s, 'what', tidy(a.text), co.tiers[t], { by: a.by, tier: t })); }
    for (const key of Object.keys(ACTIONS)) for (let k = 0; k < T.act; k++) pile.push(card(s, 'act', ACTIONS[key][0], key));
    s.pile = shuffle(s, pile);
    // everyone starts with two of each receipt half
    for (const p of s.P) for (const k of ['who', 'who', 'what', 'what']) {
      const at = s.pile.findIndex(c => c.k === k); p.hand.push(s.pile.splice(at, 1)[0]);
    }
    log(s, E, 'lap', `Lap 1. Rent is $${rentFor(s, 0)}.`);
    startLap(s, E);
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

  // ---------- a lap: roll for cards, overtime, everyone lodges, receipts flip one by one, the buck, rent ----------
  function startLap(s, E) {
    s.rolls = []; s.lodged = s.P.map(() => null); s.pend = null; s.order = []; s.fi = -1; s.cur = null; s.ot = null; s.buck = null;
    for (const p of s.P) {
      const k = pickOne(s, DIE), got = [];
      for (let j = 0; j < k; j++) { const c = draw(s); if (!c) break; p.hand.push(c); got.push(c.id); }
      s.rolls[p.id] = { k, got };
    }
    log(s, E, 'roll', 'Everyone rolled: ' + s.P.map(p => `${p.name} ${s.rolls[p.id].k}`).join(', ') + '.', { rolls: s.rolls.map(r => r.k) });
    X.startOvertime(s, E);
  }
  function startLodge(s, E) {
    s.ot = null; s.phase = 'lodge';
    // bots play their cards and lodge straight away
    for (const p of s.P) if (!p.human) {
      for (const a of B.plays(s, p.id)) { play(s, p.id, a, E); if (s.phase === 'end') return; }
      lodgeBot(s, p.id);
    }
  }
  // draw the secret surcharge for a receipt
  function makeClaim(s, i, whoC, what) {
    const p = s.P[i]; take(p, what.id); if (whoC) take(p, whoC.id);
    const sur = pickOne(s, SUR), guide = guideOf(whoC, what);
    return { seat: i, who: whoC, what, item: itemOf(whoC, what), guide, sur: sur[0], m: sur[1], real: round5(guide * sur[1]), claim: null, calls: {}, peeks: [], nephew: false, outcome: null };
  }
  function lodgeBot(s, i) {
    const p = s.P[i], a = B.pick(s, i);
    if (a.skip) { s.lodged[i] = { skip: true }; return; }
    const c = makeClaim(s, i, a.who ? p.hand.find(x => x.id === a.who) : null, p.hand.find(x => x.id === a.what));
    const was = s.cur; s.cur = c;
    const d = B.claim(s, i, rand(s), rentFor(s, i));
    s.cur = was;
    fill(s, c, d.amount, d.nephew);
    s.lodged[i] = c;
  }
  function fill(s, c, amt, nephew) {
    const p = s.P[c.seat];
    c.claim = amt; p.claims++; if (amt > c.real) p.pads++;
    if (nephew) { const n = has(p, 'nephew'); if (n) { take(p, n.id); s.disc.push(n); c.nephew = true; } }
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
      if (s.phase !== 'flip' || !s.cur || s.cur.outcome || s.cur.seat === i) return 'Use it while a claim is open.';
      s.cur.peeks.push(i); log(s, E, 'peek', 'Payroll Peek.', { seat: i, key, to: i });
    } else return 'That card plays itself at the right time.';
    take(p, c.id); s.disc.push(c);
    if (s.tin < 0) return finish(s, E, true);
    return null;
  }
  // everyone's in: shuffle the pile of receipts and start flipping
  function startFlip(s, E) {
    s.order = shuffle(s, range(s.n).filter(i => s.lodged[i] && !s.lodged[i].skip));
    for (const i of range(s.n)) if (s.lodged[i] && s.lodged[i].skip) log(s, E, 'skip', `${who(s, i)} had nothing to claim.`, { seat: i });
    s.phase = 'flip'; s.fi = -1;
    return nextFlip(s, E);
  }
  function nextFlip(s, E) {
    s.fi++;
    if (s.fi >= s.order.length) { s.cur = null; return X.startBuck(s, E); }
    const c = s.cur = s.lodged[s.order[s.fi]];
    s.claims.push(c);
    log(s, E, 'claim', `${who(s, c.seat)} claimed $${c.claim} for ${c.item}.`, { seat: c.seat, item: c.item, amount: c.claim, guide: c.guide, nephew: c.nephew });
    if (c.nephew) return null;
    for (const q of s.P) if (q.id !== c.seat && !q.human) {
      let call = B.auditCall(s, q.id, rand(s));
      if (call === 'peek') { const k = has(q, 'peek'); take(q, k.id); s.disc.push(k); c.peeks.push(q.id); call = c.claim > c.real ? 'audit' : 'sign'; }
      c.calls[q.id] = call;
    }
    return null;
  }
  function settle(s, E) {
    const c = s.cur, p = s.P[c.seat];
    const willing = Object.keys(c.calls).filter(k => c.calls[k] === 'audit').map(Number);
    const padded = c.claim > c.real;
    if (!willing.length || c.nephew) { pay(s, c.seat, c.claim); c.outcome = 'paid'; }
    else {
      if (c.auditor == null) c.auditor = pickOne(s, willing.sort((x, y) => x - y));
      const aud = s.P[c.auditor];
      // first, the envelope: the claimant can try to buy the auditor off
      if (c.offer == null) {
        if (p.human) { s.phase = 'bribe'; return null; }
        c.offer = Math.min(c.claim, round5(B.bribeOffer(s, c.seat, rand(s))));
      }
      if (c.offer > 0 && c.took == null) {
        if (aud.human) { s.phase = 'take'; return null; }
        c.took = B.bribeTake(s, c.auditor, rand(s));
      }
      if (c.took) {
        s.tin -= c.claim; p.bank += c.claim - c.offer; aud.bank += c.offer; c.outcome = 'bribed';
        log(s, E, 'bribed', `An envelope changed hands. ${poss(s, c.seat)} ${c.item} is signed.`, { seat: c.seat });
        log(s, E, 'envelope', `You took a $${c.offer} envelope.`, { to: c.auditor, amount: c.offer });
        if (s.tin < 0) return finish(s, E, true);
        return null;
      }
      if (c.offer > 0 && !c.refused) { c.refused = true; log(s, E, 'refused', `${poss(s, c.seat)} envelope came back unopened.`, { seat: c.seat }); }
      const sh = has(p, 'shred');
      if (sh && !p.human && padded) return shred(s, true, E);
      if (sh && p.human && !c.noShred) { s.phase = 'shred'; return null; }
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
    return null;
  }
  function pay(s, i, amt) { s.tin -= amt; s.P[i].bank += amt; }
  function shred(s, use, E) {
    const c = s.cur, p = s.P[c.seat];
    s.phase = 'flip';
    if (!use) { c.noShred = true; return settle(s, E); }
    const sh = has(p, 'shred'); take(p, sh.id); s.disc.push(sh);
    pay(s, c.seat, c.guide); c.outcome = 'shredded';
    log(s, E, 'shred', `${who(s, c.seat)} shredded the records. Paid the guide price, $${c.guide}. Nobody will ever know.`, { seat: c.seat });
    if (s.tin < 0) return finish(s, E, true);
    return null;
  }
  // rent: bots pay at once; you get asked only if you hold Free Rent
  function toRent(s, E) {
    s.cur = null; s.phase = 'rent'; s.rentAsk = false;
    for (const p of s.P) {
      if (p.human && has(p, 'free')) { s.rentAsk = true; continue; }
      payRent(s, p.id, p.human ? false : B.useFree(s, p.id, rentFor(s, p.id)), E);
    }
    return null;
  }
  function payRent(s, i, free, E) {
    const p = s.P[i], due = rentFor(s, i);
    if (free) { const f = has(p, 'free'); if (f) { take(p, f.id); s.disc.push(f); log(s, E, 'rent', `${who(s, i)} played Free Rent.`, { seat: i, free: true }); } else free = false; }
    if (!free) {
      p.bank -= due;
      if (p.bank < 0) log(s, E, 'debt', `${who(s, i)} couldn't make rent. $${-p.bank} on the tab.`, { seat: i, due });
    }
    p.letter = false;
    while (p.hand.length > T.hand) s.disc.push(p.hand.splice(0, 1)[0]);
  }
  function endLap(s, E) {
    log(s, E, 'rent', `Rent day. Everyone paid up${s.P.some(p => p.bank < 0) ? ', or tried to' : ''}.`);
    s.lap++;
    if (s.lap > T.laps) return finish(s, E, false);
    log(s, E, 'lap', `Lap ${s.lap}. Rent is $${rentFor(s, 0)}${s.lap === T.laps ? '. Last lap' : ''}.`);
    startLap(s, E);
    return null;
  }
  function finish(s, E, bust) {
    const ranked = s.P.slice().sort((a, b) => b.bank - a.bank || a.id - b.id).map(p => p.id);
    s.end = { bust, ranked, winner: bust ? ranked[1] : ranked[0], jailed: bust ? ranked[0] : null };
    s.phase = 'end';
    if (bust) log(s, E, 'bust', `The tin is empty. Royal Commission. ${who(s, ranked[0])} ${vb(s, ranked[0], 'takes', 'take')} the fall. ${who(s, ranked[1])} ${vb(s, ranked[1], 'walks', 'walk')} away clean.`);
    else log(s, E, 'win', `The company survived the year. ${who(s, ranked[0])} ${vb(s, ranked[0], 'is', 'are')} Employee of the Year.`);
    return null;
  }

  // is the game waiting on you?
  function needsHuman(s) {
    if (s.spectate || s.phase === 'end') return false;
    if (s.phase === 'shop' || s.phase === 'shred' || s.phase === 'bribe' || s.phase === 'take') return true;
    if (s.phase === 'overtime') return !s.ot.done && s.ot.inn.includes(0) && !(0 in s.ot.dec);
    if (s.phase === 'buck') return !s.buck.done && s.buck.holder === 0;
    if (s.phase === 'lodge') return s.lodged[0] == null;
    if (s.phase === 'flip') return !!s.cur && !s.cur.outcome && !s.cur.nephew && s.cur.seat !== 0 && !(0 in s.cur.calls);
    if (s.phase === 'rent') return s.rentAsk;
    return false;
  }

  // ---------- the one entry point ----------
  function apply(state, seat, a) {
    const s = JSON.parse(JSON.stringify(state)), E = [];
    // the open claim and its lodged slot are one object
    if (s.cur) { s.lodged[s.cur.seat] = s.cur; if (s.claims.length && s.claims[s.claims.length - 1].seat === s.cur.seat) s.claims[s.claims.length - 1] = s.cur; }
    let err = null;
    const mine = !s.spectate && seat === 0, p = s.P[0];
    switch (a.type) {
      case 'shop':
        if (s.phase !== 'shop' || !mine) { err = 'Not now.'; break; }
        for (const x of (a.answers || []).slice(0, 16)) if (x && PROMPTS[x.q] && String(x.text || '').trim()) s.answers.push({ by: 0, q: x.q, text: String(x.text) });
        deal(s, E); break;
      case 'play':
        if (!mine || !((s.phase === 'lodge' && s.lodged[0] == null) || s.phase === 'flip')) { err = 'Not now.'; break; }
        err = play(s, 0, a, E); break;
      case 'pick': {
        if (!mine || s.phase !== 'lodge' || s.lodged[0] != null || s.pend) { err = 'Not now.'; break; }
        if (a.skip) { s.lodged[0] = { skip: true }; break; }
        const what = p.hand.find(c => c.id === a.what && c.k === 'what'), whoC = a.who ? p.hand.find(c => c.id === a.who && c.k === 'who') : null;
        if (!what) { err = 'Pick a what card.'; break; }
        if (a.who && !whoC) { err = 'Pick a who/how card.'; break; }
        s.pend = makeClaim(s, 0, whoC, what); break;
      }
      case 'claim': {
        if (!mine || s.phase !== 'lodge' || !s.pend) { err = 'Pick a receipt first.'; break; }
        const amt = round5(+a.amount);
        if (!(amt >= 0) || amt > s.pend.guide * SMAX * 3) { err = 'Pick an amount.'; break; }
        if (a.nephew && !has(p, 'nephew')) { err = 'No Nephew card.'; break; }
        fill(s, s.pend, amt, !!a.nephew); s.lodged[0] = s.pend; s.pend = null; break;
      }
      case 'audit':
        if (!mine || !needsHuman(s) || s.phase !== 'flip') { err = 'Nothing to audit.'; break; }
        s.cur.calls[0] = a.call === 'audit' ? 'audit' : 'sign'; break;
      case 'overtime':
        if (!mine || s.phase !== 'overtime' || !needsHuman(s)) { err = 'Not now.'; break; }
        s.ot.dec[0] = !!a.stay; break;
      case 'bribe': {
        if (!mine || s.phase !== 'bribe') { err = 'Not now.'; break; }
        const amt = round5(+a.amount || 0);
        if (amt > s.cur.claim) { err = "You can't offer more than you claimed."; break; }
        s.cur.offer = amt; s.phase = 'flip'; err = settle(s, E); break;
      }
      case 'take':
        if (!mine || s.phase !== 'take') { err = 'Not now.'; break; }
        s.cur.took = !!a.accept; s.phase = 'flip'; err = settle(s, E); break;
      case 'buck':
        if (!mine || s.phase !== 'buck' || !needsHuman(s)) { err = 'Not now.'; break; }
        err = X.buckMove(s, 0, a, E); break;
      case 'shred': if (!mine || s.phase !== 'shred') err = 'Not now.'; else err = shred(s, !!a.use, E); break;
      case 'rent':
        if (!mine || s.phase !== 'rent' || !s.rentAsk) { err = 'Not now.'; break; }
        payRent(s, 0, !!a.free, E); s.rentAsk = false; break;
      case 'advance': err = advance(s, E); break;
      default: err = 'Unknown action.';
    }
    return err ? { error: err } : { state: s, events: E };
  }
  // the game moves one beat
  function advance(s, E) {
    if (needsHuman(s)) return 'Waiting for you.';
    switch (s.phase) {
      case 'overtime': return s.ot.done ? startLodge(s, E) : X.otStep(s, E);
      case 'lodge': return startFlip(s, E);
      case 'buck': return s.buck.done ? toRent(s, E) : X.buckStep(s, E);
      case 'flip': return s.cur.outcome ? nextFlip(s, E) : settle(s, E);
      case 'rent': return endLap(s, E);
      default: return 'Nothing to do.';
    }
  }

  const X = BEATS({ T, C, B, rand, ri, shuffle, range, round5, log, who, vb, avgGuide });
  return { T, apply, newGame, needsHuman, rentFor, honestQ, guideOf, itemOf, avgGuide, rand, CO, SUR, ACTIONS, PROMPTS, SMAX, EXCUSES: C.EXCUSES, buckFee: X.buckFee, buckBlast: X.buckBlast };
})();
if (typeof module !== 'undefined') module.exports = PC;

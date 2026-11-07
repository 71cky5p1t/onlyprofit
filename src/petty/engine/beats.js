// Petty Cash: the two beats either side of the receipts. Pure; core.js hands in its helpers.
// Overtime: cards flip, everyone still at work splits each one; a second hazard of a kind sends them home with nothing.
// The buck: one problem a lap. Pass it with an excuse, or pay to deal with it. Every pass might be the one where it goes off.
const PC_BEATS = K => {
  const { T, C, B, rand, ri, shuffle, range, round5, log, who, vb, avgGuide } = K;
  const SHARE = [0.5, 0.75, 1, 1, 1, 1.25, 1.25, 1.5, 0.75, 1];

  // ---------- overtime ----------
  function startOvertime(s, E) {
    const co = C.CO[s.co], A = avgGuide(co);
    const deck = co.hours.map((name, k) => ({ name, v: round5(s.n * A * T.ot * SHARE[k % SHARE.length]) }));
    for (const h of shuffle(s, C.HAZARDS).slice(0, 3)) deck.push({ name: h, hz: true }, { name: h, hz: true });
    s.ot = { deck: shuffle(s, deck), row: [], inn: range(s.n), haul: s.P.map(() => 0), out: s.P.map(() => null), dec: {}, seen: {}, done: false, bust: null };
    s.phase = 'overtime';
    flip(s, E);
  }
  function flip(s, E) {
    const o = s.ot, c = o.deck.pop();
    if (!c) return close(s, E);
    o.row.push(c);
    if (c.hz) {
      if (!o.seen[c.name]) { o.seen[c.name] = 1; return; }
      c.bust = true; o.bust = c.name;
      const lost = o.inn.filter(i => o.haul[i] > 0);
      log(s, E, 'otbust', `Second ${c.name}. ${o.inn.map(i => who(s, i)).join(', ')} ${o.inn.length === 1 ? vb(s, o.inn[0], 'goes', 'go') : 'go'} home with nothing.`, { lost });
      for (const i of o.inn) { o.out[i] = 0; o.haul[i] = 0; }
      o.inn = []; o.done = true;
      return;
    }
    c.each = Math.floor(c.v / o.inn.length / 5) * 5;
    for (const i of o.inn) o.haul[i] += c.each;
  }
  function clockOff(s, i, E) {
    const o = s.ot, got = o.haul[i];
    s.P[i].bank += got; o.out[i] = got;
    log(s, E, 'otout', `${who(s, i)} clocked off with $${got}.`, { seat: i, got });
  }
  function close(s, E) {
    for (const i of s.ot.inn) clockOff(s, i, E);
    s.ot.inn = []; s.ot.done = true;
  }
  // everyone still here has said stay or go: the leavers bank it, then the next card flips
  function otStep(s, E) {
    const o = s.ot;
    for (const i of o.inn) if (!(i in o.dec)) o.dec[i] = B.otStay(s, i, rand(s));
    for (const i of o.inn) if (!o.dec[i]) clockOff(s, i, E);
    o.inn = o.inn.filter(i => o.dec[i]); o.dec = {};
    if (!o.inn.length) { o.done = true; return null; }
    flip(s, E);
    return null;
  }

  // ---------- the buck ----------
  const buckFee = s => round5(avgGuide(C.CO[s.co]) * (T.fee + T.feeUp * s.buck.passes));
  const buckBlast = (s, i) => round5(s.buck.base + T.buckCut * Math.max(0, s.P[i].bank));
  function startBuck(s, E) {
    const A = avgGuide(C.CO[s.co]), holder = ri(s, s.n);
    const name = C.BUCKS[(s.seed + s.lap * 3) % C.BUCKS.length];
    s.buck = { name, base: round5(A * (T.blast + 0.1 * s.lap)), fuse: 2 + ri(s, 5), passes: 0, holder, trail: [], done: false, blew: null, dealt: null, hit: 0 };
    s.phase = 'buck';
    log(s, E, 'buck', `The ${name} landed on ${s.P[holder].human ? 'your' : who(s, holder) + "'s"} desk.`, { seat: holder });
  }
  // mv: { pass: seat, excuse: index } or { deal: true }
  function buckMove(s, i, mv, E) {
    const b = s.buck, p = s.P[i];
    if (mv.deal) {
      const fee = buckFee(s);
      p.bank -= fee; s.tin += fee; b.dealt = i; b.hit = fee; b.done = true;
      log(s, E, 'dealt', `${who(s, i)} dealt with the ${b.name}. $${fee}, paid into the tin.`, { seat: i, fee });
      return null;
    }
    const t = +mv.pass;
    if (!(t >= 0 && t < s.n) || t === i) return 'Pass it to someone else.';
    const excuse = C.EXCUSES[(+mv.excuse || 0) % C.EXCUSES.length];
    b.passes++;
    if (b.passes >= b.fuse) {
      const dmg = buckBlast(s, i);
      p.bank -= dmg; s.tin += dmg; b.blew = i; b.hit = dmg; b.done = true;
      log(s, E, 'blow', `The ${b.name} went off in ${s.P[i].human ? 'your' : who(s, i) + "'s"} hands. $${dmg} in damages.`, { seat: i, dmg });
      return null;
    }
    b.trail.push({ from: i, to: t, excuse });
    b.holder = t;
    log(s, E, 'pass', `${who(s, i)} to ${s.P[t].human ? 'you' : who(s, t)}: "${excuse}"`, { seat: i, target: t });
    return null;
  }
  function buckStep(s, E) {
    const i = s.buck.holder;
    return buckMove(s, i, B.buckMove(s, i, rand(s), buckFee(s), buckBlast(s, i)), E);
  }

  return { startOvertime, otStep, startBuck, buckMove, buckStep, buckFee, buckBlast };
};
if (typeof module !== 'undefined') module.exports = PC_BEATS;

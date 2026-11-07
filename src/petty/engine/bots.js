// Petty Cash bots: pad to make rent, audit claims that look steep, lie low when the tin is nearly empty.
const PC_BOTS = (() => {
  const C = typeof PC_CARDS !== 'undefined' ? PC_CARDS : require('./cards.js');
  const { SUR } = C;
  const SMAX = Math.max(...SUR.map(x => x[1]));
  const q = (guide, c) => SUR.filter(x => guide * x[1] < c).length / SUR.length;
  const has = (p, key) => p.hand.find(c => c.k === 'act' && c.v === key);
  const leader = (s, i) => s.P.every(o => o.id === i || o.bank <= s.P[i].bank);
  const r5 = x => Math.max(0, Math.round(x / 5) * 5);

  function auditCall(s, i, r) {
    const c = s.cur, p = s.P[i], o = s.P[c.seat];
    const form = o.caught * 0.15 - o.halo * 0.1;
    let pa = Math.max(0, (q(c.guide, c.claim) - 0.55) / 0.45) * 0.7 + form;
    // a big claim from the leader is worth checking when the tin is low
    if (s.tin < s.tin0 * 0.3 && leader(s, c.seat)) pa += 0.15;
    if (p.key) pa *= 1.4;
    pa = Math.max(0, Math.min(0.9, pa));
    if (pa > 0.15 && has(p, 'peek')) return 'peek';
    return r < pa ? 'audit' : 'sign';
  }
  function plays(s, i) {
    const p = s.P[i], out = [];
    const cr = has(p, 'creative'); if (cr) out.push({ type: 'play', card: cr.id });
    const k = has(p, 'key'); if (k && !p.key) out.push({ type: 'play', card: k.id });
    const lt = has(p, 'letter');
    if (lt) { const rich = s.P.filter(o => o.id !== i).sort((a, b) => b.bank - a.bank)[0]; out.push({ type: 'play', card: lt.id, target: rich.id }); }
    const fz = has(p, 'freeze'); if (fz && s.freeze !== s.lap && p.bank < s.rent0) out.push({ type: 'play', card: fz.id });
    return out;
  }
  function pick(s, i) {
    const p = s.P[i], whats = p.hand.filter(c => c.k === 'what'), whos = [null].concat(p.hand.filter(c => c.k === 'who'));
    if (!whats.length) return { skip: true };
    let best = null;
    for (const w of whats) for (const h of whos) { const g = (h ? h.v : 1) * w.v; if (!best || g > best.g) best = { g, what: w.id, who: h ? h.id : null }; }
    return best;
  }
  function claim(s, i, r, rent) {
    const c = s.cur, p = s.P[i], cap = c.guide * SMAX;
    const need = Math.max(0, rent - Math.max(0, p.bank) - c.real);
    let amt = c.real;
    if (need > 0) amt = Math.min(cap, c.real + need * 1.2);
    // greed, unless the tin's nearly gone and you're out in front
    const scared = s.tin < s.tin0 * 0.3 && leader(s, i);
    if (!scared && r < p.greed * 0.5) amt = Math.max(amt, c.real + (cap - c.real) * (0.1 + 0.3 * r));
    if (scared) amt = Math.min(amt, Math.max(c.real, c.guide));
    amt = Math.max(c.real, r5(amt));
    const big = amt - c.real > c.guide * 0.4;
    return { type: 'claim', amount: amt, nephew: big && !!has(p, 'nephew') };
  }
  const useFree = (s, i, rent) => !!has(s.P[i], 'free') && (s.P[i].bank < rent || s.lap >= 6);

  // overtime: stay while the next card is worth more than the risk to what you've got
  function otStay(s, i, r) {
    const o = s.ot, d = o.deck, p = s.P[i];
    if (!d.length) return false;
    const rep = d.filter(c => c.hz && o.seen[c.name]).length / d.length;
    const hours = d.filter(c => !c.hz), gain = hours.reduce((a, c) => a + c.v, 0) / d.length / o.inn.length;
    const ev = gain - rep * (o.haul[i] + gain);
    const nerve = p.nerve + (p.bank < s.rent0 ? 0.15 : 0);
    const leave = ev < 0 ? 0.9 - nerve * 0.5 : rep * 2 * (1 - nerve);
    return r >= leave;
  }
  // the envelope: padders pay some of the padding to make it go away; honest ones sometimes bluff a small one
  function bribeOffer(s, i, r) {
    const c = s.cur, pad = c.claim - c.real;
    if (pad > 0) return r5(pad * (0.2 + 0.4 * r));
    return r < 0.25 ? r5(c.claim * 0.08) : 0;
  }
  function bribeTake(s, i, r) {
    const c = s.cur, p = s.P[i];
    const pp = Math.min(0.95, q(c.guide, c.claim) * 0.8 + 0.15);
    const fine = p.key ? 0 : c.claim * 0.25;
    const ev = pp * Math.max(0, c.claim - c.guide) - (1 - pp) * fine;
    return c.offer >= ev * (0.7 + 0.6 * r);
  }
  // the buck: pass while it's cheaper than dealing with it; aim it at whoever's in front
  function buckMove(s, i, r, fee, blast) {
    const b = s.buck, left = 7 - (b.passes + 1);
    const pGo = b.passes + 1 < 2 ? 0 : 1 / Math.max(1, left);
    if (pGo * blast * (0.5 + 0.5 * r) * (1.3 - s.P[i].nerve) > fee) return { deal: true };
    const others = s.P.filter(o => o.id !== i), rich = others.slice().sort((a, b2) => b2.bank - a.bank)[0];
    const t = r < 0.6 ? rich : others[Math.floor(r * 997) % others.length];
    return { pass: t.id, excuse: Math.floor(r * 1e4) };
  }
  return { auditCall, plays, pick, claim, useFree, otStay, bribeOffer, bribeTake, buckMove };
})();
if (typeof module !== 'undefined') module.exports = PC_BOTS;

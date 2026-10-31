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
  return { auditCall, plays, pick, claim, useFree };
})();
if (typeof module !== 'undefined') module.exports = PC_BOTS;

// THE MIX: Petty Cash with three borrowed engines bolted on.
// 1. Overtime earns your wages and receipts (push your luck instead of a dice roll).
// 2. Claims are lodged as now, but an audit can be bribed off (Sheriff).
// 3. A Liability does the rounds each lap and must be passed with an excuse (hot potato).
const { rng } = require('./metrics.js');
function game(n, seed) {
  const r = rng(seed), bank = Array(n).fill(0), laps = [bank.slice()];
  const nerve = [...Array(n)].map(() => 0.35 + r() * 0.5), greed = [...Array(n)].map(() => 0.2 + r() * 0.7);
  let decisions = 0, close = 0, moments = 0, interact = 0, inter = 0, tin = 1100 * n;
  for (let lap = 0; lap < 6; lap++) {
    const rent = 220 + lap * 25;
    // 1. overtime: a short spree, 3 hazard kinds × 2
    let d = []; for (let v = 1; v <= 10; v++) d.push({ v: v * 20 }); for (let h = 0; h < 3; h++) d.push({ h }, { h });
    d.sort(() => r() - 0.5);
    let haul = Array(n).fill(0), inn = [...Array(n).keys()], seen = {};
    while (inn.length && d.length) {
      const rep = d.filter(c => c.h != null && seen[c.h]).length / d.length, out = [];
      for (const i of inn) { decisions++; const gain = 110 / inn.length, ev = (1 - rep) * gain - rep * haul[i]; if (Math.abs(ev) < 0.25 * gain + 1) close++; if (r() < (ev < 0 ? 0.9 - nerve[i] * 0.5 : rep * 1.4 * (1 - nerve[i]))) out.push(i); }
      for (const i of out) bank[i] += haul[i];
      inn = inn.filter(i => !out.includes(i)); if (!inn.length) break;
      const c = d.pop();
      if (c.h != null) { if (seen[c.h]) { moments++; inn = []; break; } seen[c.h] = 1; }
      else { const each = Math.floor(c.v / inn.length); for (const i of inn) haul[i] += each; }
    }
    for (const i of inn) bank[i] += haul[i];
    // 2. claims with bribes
    for (let i = 0; i < n; i++) {
      const real = 80 + Math.floor(r() * 10) * 35, guide = real * (0.6 + r() * 0.8);
      const need = Math.max(0, rent - bank[i]);
      const pad = (r() < greed[i] || need > 0) ? Math.round(Math.max(need * 1.1, real * (0.2 + r() * 0.6))) : 0, claim = real + pad;
      decisions++; if (need > 0) close++;
      const susp = Math.max(0, (claim - guide) / guide);
      const aud = [...Array(n).keys()].filter(j => j !== i).find(() => r() < 0.1 + susp * 0.35);
      inter++;
      if (aud == null) { bank[i] += claim; tin -= claim; continue; }
      interact++; decisions += 2;
      const offer = pad ? Math.round(pad * (0.2 + r() * 0.4)) : (r() < 0.3 ? Math.round(claim * 0.08) : 0);
      const evAudit = 0.5 * susp * guide - 0.5 * claim * 0.25;
      if (offer && Math.abs(offer - evAudit) < Math.max(20, offer * 0.3)) close++;
      if (offer && offer >= evAudit) { bank[aud] += offer; bank[i] += claim - offer; tin -= claim; continue; }
      moments++;
      if (pad) { bank[i] += real - pad; bank[aud] += pad; tin -= real; } else { const fine = Math.round(claim * 0.25); bank[i] += claim + fine; bank[aud] -= fine; tin -= claim; }
    }
    // 3. the buck
    let holder = Math.floor(r() * n), passes = 0; const fuse = 2 + Math.floor(r() * 5), dmg = 180 + lap * 30;
    while (true) {
      inter++;
      if (passes >= fuse) { bank[holder] -= dmg; moments++; interact++; break; }
      decisions++;
      const fee = 30 + passes * 25, evPass = -Math.min(1, 1 / Math.max(1, 6 - passes)) * dmg * 0.5;
      if (Math.abs(-fee - evPass) < 30) close++;
      if (-fee > evPass) { bank[holder] -= fee; break; }
      const others = [...Array(n).keys()].filter(j => j !== holder), lead = others.sort((a, b) => bank[b] - bank[a])[0];
      holder = r() < 0.6 ? lead : others[Math.floor(r() * others.length)]; passes++; interact++;
    }
    for (let i = 0; i < n; i++) bank[i] -= rent;
    laps.push(bank.slice());
  }
  return { laps, decisions, close, interact: Math.min(1, interact / Math.max(1, inter)), moments };
}
module.exports = { game, name: 'The Mix (Overtime + bribes + buck)' };

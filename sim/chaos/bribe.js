// BRIBES on the audit (the Sheriff of Nottingham family), layered on Petty Cash claims.
// When someone calls an audit you may slide them a bribe across the table. They take it (and sign) or refuse and open the receipt.
const { rng } = require('./metrics.js');
function game(n, seed) {
  const r = rng(seed), bank = Array(n).fill(0), laps = [bank.slice()], greed = [...Array(n)].map(() => 0.2 + r() * 0.7);
  let decisions = 0, close = 0, moments = 0, interact = 0, audits = 0;
  for (let lap = 0; lap < 6; lap++) {
    for (let i = 0; i < n; i++) {
      bank[i] -= 150; // rent
      const real = 100 + Math.floor(r() * 10) * 40, guide = real * (0.6 + r() * 0.8);
      const pad = r() < greed[i] ? Math.round(real * (0.3 + r() * 0.9)) : 0, claim = real + pad;
      decisions++;
      // the table sees claim vs guide; one auditor at most
      const susp = Math.max(0, (claim - guide) / guide);
      const aud = [...Array(n).keys()].filter(j => j !== i).find(() => r() < 0.12 + susp * 0.4);
      if (aud == null) { bank[i] += claim; continue; }
      audits++; interact++; decisions += 2;
      // bribe: padded claimants offer up to half the pad; honest ones sometimes bluff a small bribe too
      const offer = pad ? Math.round(pad * (0.2 + r() * 0.4)) : (r() < 0.3 ? Math.round(claim * 0.08) : 0);
      // auditor: take the bribe if it beats what they guess an audit is worth
      const guessPad = susp * guide, evAudit = 0.5 * guessPad - 0.5 * claim * 0.25;
      if (offer && Math.abs(offer - evAudit) < Math.max(20, offer * 0.3)) close++;
      if (offer && offer >= evAudit) { bank[aud] += offer; bank[i] += claim - offer; moments += pad ? 0 : 1; continue; }
      moments++;
      if (pad) { bank[i] += real - pad; bank[aud] += pad; } else { const fine = Math.round(claim * 0.25); bank[i] += claim + fine; bank[aud] -= fine; }
    }
    laps.push(bank.slice());
  }
  return { laps, decisions, close, interact: interact / (6 * n), moments };
}
module.exports = { game, name: 'Bribes on audit (Sheriff)' };

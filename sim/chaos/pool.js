// BONUS POOL (the greed / split-or-steal family).
// Each lap there's a bonus pool. Everyone secretly writes how much they're taking. Flip together.
// If the total fits, everyone gets what they wrote. If it doesn't, the pool is frozen and the greediest person is named and fined.
const { rng } = require('./metrics.js');
function game(n, seed) {
  const r = rng(seed), bank = Array(n).fill(0), laps = [bank.slice()], greed = [...Array(n)].map(() => r());
  let decisions = 0, close = 0, moments = 0, interact = 0, hist = [];
  for (let lap = 0; lap < 6; lap++) {
    const pool = 10 * n, fair = pool / n, took = [];
    for (let i = 0; i < n; i++) {
      decisions++;
      // read the room: last lap's total
      const last = hist.length ? hist[hist.length - 1] : pool * 0.9;
      let t = fair * (0.5 + greed[i] * 0.9) * (last > pool ? 0.85 : 1.08) + (r() - 0.5) * 5;
      // trailing players take risks
      if (bank[i] < Math.max(...bank) - 25) t += 6;
      t = Math.max(0, Math.round(t)); took.push(t);
      if (Math.abs(t - fair) < fair * 0.5) close++;
    }
    const tot = took.reduce((a, b) => a + b, 0); hist.push(tot);
    if (tot <= pool) took.forEach((t, i) => bank[i] += t);
    else { moments++; interact++; const g = took.indexOf(Math.max(...took)); bank[g] -= Math.round(fair); }
    laps.push(bank.slice());
  }
  return { laps, decisions, close, interact: interact / 6, moments };
}
module.exports = { game, name: 'Bonus Pool (greed)' };

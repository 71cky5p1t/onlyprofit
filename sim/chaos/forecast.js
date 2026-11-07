// THE FORECAST (bluff bidding, the Liar's Dice / Perudo family).
// Everyone privately rolls their department's sales (dice under a cup). Going round the table you raise the company forecast:
// "Between us we'll hit at least five 4s." The next person raises or shouts RESTATE. Wrong side of the call pays.
const { rng } = require('./metrics.js');
function game(n, seed) {
  const r = rng(seed), bank = Array(n).fill(500), laps = [bank.slice()], dice = Array(n).fill(4);
  let decisions = 0, close = 0, moments = 0, interact = 0, rounds = 0;
  for (let lap = 0; lap < 6; lap++) {
    for (let sub = 0; sub < 2; sub++) {
      rounds++;
      const cups = dice.map(k => [...Array(k)].map(() => 1 + Math.floor(r() * 6)));
      const total = dice.reduce((a, b) => a + b, 0);
      let who = Math.floor(r() * n), bid = { q: 1, f: 1 + Math.floor(r() * 6) }, bidder = who;
      while (true) {
        who = (who + 1) % n; decisions++;
        const mine = cups[who].filter(x => x === bid.f).length, unseen = total - dice[who];
        const expect = mine + unseen / 6, pTrue = 1 - Math.max(0, Math.min(1, (bid.q - expect + 1) / (unseen / 3 + 1)));
        if (Math.abs(pTrue - 0.5) < 0.15) close++;
        if (pTrue < 0.45 + (r() - 0.5) * 0.2) {
          const count = cups.flat().filter(x => x === bid.f).length, loser = count >= bid.q ? who : bidder;
          const stake = 60 + lap * 20; bank[loser] -= stake; bank[loser === who ? bidder : who] += stake; dice[loser] = Math.max(1, dice[loser] - 1);
          moments++; interact++; break;
        }
        // raise: bump the count on my best face
        const best = [1, 2, 3, 4, 5, 6].sort((a, b) => cups[who].filter(x => x === b).length - cups[who].filter(x => x === a).length)[0];
        bid = best > bid.f ? { q: bid.q, f: best } : { q: bid.q + 1, f: best }; bidder = who;
      }
    }
    laps.push(bank.slice());
  }
  return { laps, decisions, close, interact: interact / rounds, moments };
}
module.exports = { game, name: 'The Forecast (bluff bidding)' };

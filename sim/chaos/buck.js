// PASS THE BUCK (hot potato with a hidden fuse, the Hot Potato / Time Bomb family) on top of plain wages.
// A Liability lands on someone each lap. On your go you either pass it on (to anyone, with a straight face) or deal with it (pay a fee that rises each pass).
// It has a hidden fuse; whoever is holding it when the Board finds out pays the full damage.
const { rng } = require('./metrics.js');
function game(n, seed) {
  const r = rng(seed), bank = Array(n).fill(0), laps = [bank.slice()];
  let decisions = 0, close = 0, moments = 0, interact = 0;
  for (let lap = 0; lap < 6; lap++) {
    for (let i = 0; i < n; i++) bank[i] += 60 + Math.floor(r() * 4) * 20; // wages
    let holder = Math.floor(r() * n), passes = 0; const fuse = 2 + Math.floor(r() * 6), dmg = 200 + lap * 30;
    while (true) {
      if (passes >= fuse) { bank[holder] -= dmg; moments++; break; }
      decisions++;
      const fee = 30 + passes * 25, risk = Math.min(1, 1 / Math.max(1, 7 - passes)); // what you'd guess
      const evPass = -risk * dmg * 0.5; // you might get it back
      if (Math.abs(-fee - evPass) < 30) close++;
      if (-fee > evPass) { bank[holder] -= fee; break; }
      // pass to the leader, mostly
      const others = [...Array(n).keys()].filter(j => j !== holder);
      const lead = others.sort((a, b) => bank[b] - bank[a])[0];
      holder = r() < 0.6 ? lead : others[Math.floor(r() * others.length)]; passes++; interact++;
    }
    laps.push(bank.slice());
  }
  return { laps, decisions, close, interact: Math.min(1, interact / (6 * 4)), moments };
}
module.exports = { game, name: 'Pass the Buck (hot potato)' };

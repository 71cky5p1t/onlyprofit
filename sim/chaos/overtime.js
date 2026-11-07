// OVERTIME (push-your-luck, the Incan Gold / Diamant family).
// Each lap the whole office stays back. Billable-hour cards flip one at a time and split between everyone still at their desk.
// Hazards: Fire Drill, HR Complaint, Server Down, Wrong Reply-All, The CEO Walks Past. Second of a kind = everyone still in loses tonight's haul.
// Before each flip you secretly clock off or stay. Clocking off banks your haul plus a share of the crumbs left on the table.
const { rng } = require('./metrics.js');
function game(n, seed) {
  const r = rng(seed), H = 5;
  let deck = []; for (let v = 1; v <= 15; v++) deck.push({ v: v * 20 }, { v: v * 20 }); for (let h = 0; h < H; h++) for (let k = 0; k < 3; k++) deck.push({ h });
  const bank = Array(n).fill(0), laps = [bank.slice()], nerve = [...Array(n)].map(() => 0.35 + r() * 0.5);
  let decisions = 0, close = 0, moments = 0, interact = 0;
  for (let lap = 0; lap < 5; lap++) {
    const d = deck.slice().sort(() => r() - 0.5); let haul = Array(n).fill(0), inn = [...Array(n).keys()], crumbs = 0, seen = {};
    while (inn.length && d.length) {
      // decide: risk = chance next card is a repeat hazard
      const rep = d.filter(c => c.h != null && seen[c.h]).length / d.length;
      const leaving = [];
      for (const i of inn) {
        decisions++;
        const stakes = haul[i], gain = 120 / inn.length;
        const ev = (1 - rep) * gain - rep * stakes;
        if (Math.abs(ev) < 0.25 * gain + 1) close++;
        if (r() < (ev < 0 ? 0.9 - nerve[i] * 0.5 : rep * 1.5 * (1 - nerve[i]) + (stakes > 300 ? 0.15 : 0))) leaving.push(i);
      }
      if (leaving.length) { const share = Math.floor(crumbs / leaving.length); if (share) interact++; for (const i of leaving) { bank[i] += haul[i] + share; } crumbs -= share * leaving.length; inn = inn.filter(i => !leaving.includes(i)); if (!inn.length) break; }
      const c = d.pop();
      if (c.h != null) {
        if (seen[c.h]) { moments++; inn = []; const at = deck.findIndex(x => x.h === c.h); deck.splice(at, 1); break; }
        seen[c.h] = 1;
      } else { const each = Math.floor(c.v / inn.length); for (const i of inn) haul[i] += each; crumbs += c.v - each * inn.length; }
    }
    for (const i of inn) bank[i] += haul[i];
    laps.push(bank.slice());
  }
  return { laps, decisions, close, interact: interact / 5, moments };
}
module.exports = { game, name: 'Overtime (push your luck)' };

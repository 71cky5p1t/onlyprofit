// "Is it a game?" numbers from per-lap standings.
// laps: array of bank arrays after each lap; meta: { decisions, close, interact, moments }
const rng = seed => () => { let t = (seed = (seed + 0x6D2B79F5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const leader = a => a.indexOf(Math.max(...a));
function score(games) {
  const m = { lead: 0, comeback: 0, margin: 0, swing: 0, close: 0, decisions: 0, interact: 0, moments: 0, lastPlace: 0 };
  for (const g of games) {
    const L = g.laps, n = L[0].length, fin = L[L.length - 1], w = leader(fin);
    for (let k = 1; k < L.length; k++) if (leader(L[k]) !== leader(L[k - 1])) m.lead++;
    const mid = L[Math.floor(L.length * 2 / 3) - 1];
    if (leader(mid) !== w) m.comeback++;
    const sorted = fin.slice().sort((a, b) => b - a), spread = Math.max(1, sorted[0] - sorted[n - 1]);
    m.margin += (sorted[0] - sorted[1]) / spread;
    // biggest single-lap jump vs typical jump
    const d = []; for (let k = 1; k < L.length; k++) for (let i = 0; i < n; i++) d.push(Math.abs(L[k][i] - L[k - 1][i]));
    // biggest single-lap jump as a share of the final spread between first and last
    m.swing += Math.min(2, Math.max(...d) / spread);
    // who was last at the 2/3 mark finishing top two
    const lastMid = mid.indexOf(Math.min(...mid)); if (fin.slice().sort((a, b) => b - a).slice(0, 2).includes(fin[lastMid])) m.lastPlace++;
    m.close += g.close / Math.max(1, g.decisions); m.decisions += g.decisions / n;
    m.interact += g.interact; m.moments += g.moments;
  }
  const G = games.length, pc = x => Math.round(100 * x / G) + '%', f = x => (x / G).toFixed(1);
  return { leadChanges: f(m.lead), comeback: pc(m.comeback), lastToTop2: pc(m.lastPlace), winMargin: pc(m.margin), bigSwing: pc(m.swing), closeCalls: pc(m.close), decisionsEach: f(m.decisions), interaction: pc(m.interact), moments: f(m.moments) };
}
module.exports = { rng, score, leader };

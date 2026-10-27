// How words get blacked out on a cover page.
// choose: the author picks and pays 1 input a word. Every other mode: luck picks.
const OP_INK = (() => {
  const MODES = ['choose', 'paid', 'one', 'odds', 'slot'];
  const mode = s => (MODES.includes(s.ink) ? s.ink : 'choose');
  // the author decided something, so a blackout is a tell
  const chosen = s => ['choose', 'paid'].includes(mode(s));
  // slot mode: one word per desk is inked before the work starts
  function deal(s, rand, i) { if (mode(s) === 'slot') (s.slots = s.slots || {})[i] = Math.floor(rand(s) * 3); }
  // the blackouts a page leaves with; want = slots the author asked for (choose) or how many (paid)
  function apply(s, rand, i, want) {
    const m = mode(s), all = [0, 1, 2];
    if (m === 'choose') return want.slice().sort();
    if (m === 'slot') return [s.slots[i]];
    if (m === 'odds') return all.filter(() => rand(s) < 1 / 3);
    const n = m === 'one' ? 1 : Math.min(3, want.length), pool = all.slice(), out = [];
    while (out.length < n) out.push(pool.splice(Math.floor(rand(s) * pool.length), 1)[0]);
    return out.sort();
  }
  // a blind word on every page makes the CEO's pick worse; targets give a little back
  const SHIFT = { one: { 4: -1, 7: -1, 8: -1 }, odds: { 4: -1, 6: -1, 7: -1, 8: -1 } };
  const shift = (s, n) => (SHIFT[mode(s)] || {})[n] || 0;
  // what an author can count on staying hidden when planning a page
  function planned(s, i, pick) {
    const m = mode(s);
    if (m === 'choose') return pick;
    if (m === 'slot') return [s.slots[i]];
    return [];
  }
  return { MODES, mode, chosen, shift, deal, apply, planned };
})();
if (typeof module !== 'undefined') module.exports = OP_INK;

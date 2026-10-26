// Every Action × Target × Modifier sentence per company, with its value, for auditing the deck.
// usage: node tools/sentences.js [brand|all] [top=20] [deal=SEED] [engine=path/to/core.js] [csv] [json]
//   default lists every sentence the word pools can make; deal=SEED lists one real dealt deck instead.
const path = require('path');
const arg = Object.fromEntries(process.argv.slice(2).map(a => (a.includes('=') ? a.split('=') : [a, true])));
const brandArg = process.argv.slice(2).find(a => !a.includes('=') && !['csv', 'json'].includes(a)) || 'all';
const OP = require(path.resolve(arg.engine || path.join(__dirname, '../src/engine/core.js')));
const C = require(path.join(path.dirname(path.resolve(arg.engine || path.join(__dirname, '../src/engine/core.js'))), 'content.js'));
const TOP = +(arg.top || 20);

// rough sense checks: verbs that need a living target, targets that are not alive
const LIVING = new Set(['Swaddle', 'Wean', 'Foster', 'Pay', 'Visit', 'Validate', 'Forgive', 'Save', 'Sit With', 'Walk', 'Feed', 'Give a Carrot to', 'Rescue', 'Muzzle', 'Disinherit', 'Ghost', 'Exorcise', 'Euthanise', 'Sedate', 'Back-Pay', 'Unionise', 'Pay Super to', 'Seek Consent from', 'Self-Report to', 'Mentor', 'Upskill', 'Listen to', 'Check On', 'Console', 'Remarry', 'Adopt', 'Refrigerate', 'Ground', 'Speed-Date', 'Re-home', 'Honk at', 'Pay Dividends to']);
const ABSTRACT = /Wellness|Sick Leave|Customer Trust|Long Service|Casual Friday|Legacy Systems|Nap Time|Bingo Night|Speed Dating|Custody|Grief|Child Support|Share Price|Profit Target|Bonus Pool|Pension Fund|Dad Jokes/;

// the cards each suit can hold: the word pools plus the company's words, or one dealt deck
function cardsFor(brand) {
  if (arg.deal) {
    const s = OP.newGame({ players: 5, seed: +arg.deal, brand }), seen = new Map();
    for (const c of [...s.deck.piles.flat(), ...s.hands.flatMap(h => h.cards)]) seen.set(c.s + c.w + c.v, c);
    return [0, 1, 2].map(su => [...seen.values()].filter(c => c.s === su));
  }
  const L = C.LEX[brand] || {};
  return [0, 1, 2].map(su => {
    const pool = Object.entries(C.WORDS[su]).flatMap(([v, ws]) => ws.map(w => ({ s: su, w, v: v === 'V' ? 'V' : +v })));
    const own = (L['atm'[su]] || []).map(([w, v]) => ({ s: su, w, v, own: true }));
    const fx = su === 2 ? C.FX.map(([w, fx, v]) => ({ s: su, w, v, fx })) : [];
    return pool.concat(own, fx);
  });
}
function sentences(brand) {
  const [A, T, M] = cardsFor(brand), out = [];
  for (const a of A) for (const t of T) for (const m of M) {
    const cs = [a, t, m], gamble = cs.some(c => c.v === 'V');
    const plain = cs.reduce((n, c) => n + (c.fx || c.v === 'V' ? 0 : c.v), 0);
    out.push({ text: `${a.w} ${t.w} ${m.w}`, words: [a.w, t.w, m.w], value: OP.evs(cs), plain, gamble, fx: m.fx || null, own: cs.filter(c => c.own).length,
      nonsense: LIVING.has(a.w) && ABSTRACT.test(t.w) });
  }
  return out.sort((x, y) => y.value - x.value || y.plain - x.plain);
}
// highest first, then the most company words; each word once
function varied(list, n) {
  const used = new Set(), out = [];
  for (const x of list.slice().sort((p, q) => q.value - p.value || q.own - p.own)) {
    if (x.words.some(w => used.has(w))) continue;
    out.push(x); x.words.forEach(w => used.add(w));
    if (out.length >= n) break;
  }
  return out;
}
const flipList = l => l.map(x => ({ ...x, value: -x.value }));
const lowest = (l, n) => varied(flipList(l), n).map(x => ({ ...x, value: -x.value }));
function audit(brand, list) {
  const n = list.length, mean = list.reduce((a, x) => a + x.value, 0) / n;
  const flips = list.filter(x => Math.sign(x.plain) !== Math.sign(x.value) && Math.abs(x.plain - x.value) >= 4);
  const hist = {}; list.forEach(x => (hist[x.value] = (hist[x.value] || 0) + 1));
  return { brand, n, mean: +mean.toFixed(2), gamble: list.filter(x => x.gamble).length, nonsense: list.filter(x => x.nonsense).length,
    flips: flips.length, flipsBy: flips.reduce((a, x) => ((a[x.fx] = (a[x.fx] || 0) + 1), a), {}), hist };
}

const brands = brandArg === 'all' ? Object.keys(C.LEX) : [brandArg];
const all = brands.map(b => ({ brand: b, list: sentences(b) }));
if (arg.json) { console.log(JSON.stringify(all.map(({ brand, list }) => ({ ...audit(brand, list), top: varied(list, TOP), bottom: lowest(list, TOP), topOwn: varied(list.filter(x => x.own), TOP), bottomOwn: lowest(list.filter(x => x.own), TOP) })))); }
else if (arg.csv) { console.log('brand,value,plain,gamble,fx,sentence'); for (const { brand, list } of all) for (const x of list) console.log([brand, x.value, x.plain, x.gamble, x.fx || '', `"${x.text}"`].join(',')); }
else for (const { brand, list } of all) {
  const a = audit(brand, list), fmt = x => `${(x.value > 0 ? '+' : '') + x.value}${x.gamble ? '±' : ''}`.padStart(4) + '  ' + x.text;
  console.log(`\n== ${brand}: ${a.n} sentences, mean ${a.mean}, ${a.gamble} gambles, ${a.flips} inverted by effect Modifiers ${JSON.stringify(a.flipsBy)}, ${a.nonsense} flagged nonsense`);
  console.log('-- most profitable'); varied(list, TOP).forEach(x => console.log(fmt(x)));
  console.log('-- least profitable'); lowest(list, TOP).forEach(x => console.log(fmt(x)));
}
module.exports = { sentences, audit, varied, lowest };

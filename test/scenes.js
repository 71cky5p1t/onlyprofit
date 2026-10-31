// Scene engine checks: every location renders at every hour, every prop variant draws, layouts hold all day.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '../src/scenes');
const ctx = {}; vm.createContext(ctx);
fs.readdirSync(dir).filter(f => /^\d.*\.js$/.test(f)).sort().forEach(f => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }));
const OPS = vm.runInContext('OPS', ctx);
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const bad = s => /NaN|undefined|Infinity|\[object/.test(s);

const props = Object.keys(OPS.props);
let variants = 0;
props.forEach(p => OPS.props[p].variants.forEach(v => { variants++;
  OPS.times.forEach(t => { const s = OPS.renderProp(p, v, { time: t.id }); ok(s.length > 20 && !bad(s), `${p}/${v}@${t.id}`); });
}));

const locs = Object.keys(OPS.locs);
locs.forEach(id => {
  const L = OPS.locs[id];
  L.props.forEach(([p, v]) => { ok(OPS.props[p], `${id}: unknown prop ${p}`); ok(OPS.props[p] && OPS.props[p].variants.includes(v), `${id}: ${p} has no variant ${v}`); });
  ok(OPS.backs[L.back], `${id}: unknown backdrop ${L.back}`);
  const shapes = [];
  OPS.times.forEach(t => {
    const s = OPS.render(id, { time: t.id, uid: 'x' });
    ok(!bad(s), `${id}@${t.id} has bad numbers`);
    ok((s.match(/<g[ >]/g) || []).length === (s.match(/<\/g>/g) || []).length, `${id}@${t.id} unbalanced groups`);
  });
  // a prop's shape must not change with the hour, only its colours and lights
  L.props.forEach(([p, v, , , o], i) => {
    const K = OPS.kit, seen = new Set();
    OPS.times.forEach(t => { let r = OPS.props[p].draw(v, Object.assign({ name: L.name, short: L.short }, L.palette), K.rng(i + 1), t, o || {}); r = typeof r === 'string' ? r : r.body;
      seen.add(r.replace(/(fill|stroke|opacity|style)="[^"]*"/g, '')); });
    ok(seen.size === 1, `${id}: ${p}/${v} changes shape between hours`);
  });
  ok(OPS.render(id, { seed: 3, uid: 'a' }) !== OPS.render(id, { seed: 4, uid: 'a' }), `${id}: seed changes nothing`);
  ok(OPS.render(id, { seed: 3, uid: 'a' }) === OPS.render(id, { seed: 3, uid: 'a' }), `${id}: not deterministic`);
});
console.log(`${locs.length} locations, ${props.length} props, ${variants} variants, ${OPS.times.length} hours`);
if (fails) { console.log(fails + ' failures'); process.exit(1); }
console.log('scenes ok');

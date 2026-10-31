// Scene kit: namespace, seeded rng, colour maths, SVG helpers. Pure, no DOM.
var OPS = { props: {}, backs: {}, locs: {}, times: [], kit: {} };
(() => {
  const K = OPS.kit;
  K.rng = seed => {
    let a = (seed >>> 0) || 1;
    const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    r.pick = arr => arr[Math.floor(r() * arr.length)];
    r.range = (lo, hi) => lo + r() * (hi - lo);
    return r;
  };
  K.hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

  // colour
  const rgb = h => { h = h.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  K.rgb = rgb; K.hex = hex;
  K.mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * k)); };
  // shadows lean violet, highlights lean warm
  K.dk = (c, k = .2) => K.mix(c, '#241c48', k);
  K.lt = (c, k = .2) => K.mix(c, '#fff8ea', k);
  K.mul = (c, t, a) => { const A = rgb(c), T = rgb(t); return hex(A.map((v, i) => v * (1 - a + a * T[i] / 255))); };

  // svg
  const num = v => typeof v === 'number' ? +v.toFixed(1) : v;
  const at = o => Object.keys(o).filter(k => o[k] != null && o[k] !== false).map(k => ` ${k}="${num(o[k])}"`).join('');
  K.el = (tag, o, inner) => inner == null ? `<${tag}${at(o)}/>` : `<${tag}${at(o)}>${inner}</${tag}>`;
  K.R = (x, y, w, h, f, r, o) => typeof r === 'object' ? K.R(x, y, w, h, f, 0, r) : K.el('rect', Object.assign({ x, y, width: w, height: h, rx: r || null, fill: f }, o));
  K.C = (cx, cy, r, f, o) => K.el('circle', Object.assign({ cx, cy, r, fill: f }, o));
  K.E = (cx, cy, rx, ry, f, o) => K.el('ellipse', Object.assign({ cx, cy, rx, ry, fill: f }, o));
  K.P = (d, f, o) => K.el('path', Object.assign({ d, fill: f }, o));
  K.L = (d, s, w, o) => K.el('path', Object.assign({ d, fill: 'none', stroke: s, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, o));
  K.G = (inner, o) => K.el('g', o || {}, inner);
  K.T = (x, y, s, size, f, o) => K.el('text', Object.assign({ x, y, 'font-size': size, fill: f, 'text-anchor': 'middle', 'font-family': 'Nunito, Schibsted Grotesk, sans-serif', 'font-weight': 900 }, o), String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'));
  // font size that keeps a label inside maxW (Nunito 900 caps run ~0.68em)
  K.fit = (s, maxW, size) => Math.min(size, maxW / (String(s).length * .68));
  // animated group; t = period (s), d = phase offset (s)
  K.A = (name, inner, t, d, o) => K.el('g', Object.assign({ class: 'a-' + name, style: `--t:${num(t)}s;--d:${num(-(d || 0))}s` }, o), inner);
  K.eye = (x, y, r, d) => K.el('ellipse', { class: 'eye', cx: x, cy: y, rx: r || 2.6, ry: (r || 2.6) * 1.15, fill: '#1c1a2c', style: `--d:${num(-(d || 0))}s` });
  // rounded-top shape (domes, tombstones, heads of things)
  K.arch = (x, y, w, h, f, o) => K.P(`M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}Z`, f, o);
  // vertical wood/metal ribs
  K.ribs = (x, y, w, h, n, f, sw) => { let s = ''; for (let i = 1; i < n; i++) s += K.L(`M${x + w * i / n} ${y}v${h}`, f, sw || 2); return s; };
  // 0..1 lit fraction helper for window grids
  K.lit = (r, t, p) => { const x = r(); return t.emit > 0 && x < (t.late ? p * .22 : p); };
  // rng draws never depend on time of day, so a scene keeps its layout all day
})();

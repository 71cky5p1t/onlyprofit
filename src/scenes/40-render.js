// Renderer: (location, time, seed) -> one SVG string. Pure and deterministic; the same seed keeps the layout all day.
(() => {
  const K = OPS.kit, { R, C, E, P, L, G, A } = K;
  const W = 1600, H = 900;
  let uidN = 0;

  const placed = (loc, i) => { const [prop, v, x, y, o] = loc.props[i]; return { prop, v, x, y, o: o || {}, i }; };

  OPS.render = (id, opts = {}) => {
    const loc = OPS.locs[id];
    if (!loc) throw new Error('unknown location ' + id);
    const t = OPS.time(opts.time), seed = opts.seed != null ? opts.seed : K.hash(id), uid = 'ops' + (opts.uid || ++uidN);
    const c = Object.assign({ name: loc.name, short: loc.short, slogan: loc.slogan }, loc.palette);
    // authored on a 620 horizon; drawn 70 higher so the ground carries the frame
    const DY = -70, gy = (loc.groundY || 620) + DY;
    const tint = (h, k) => K.mul(k ? K.mix(h, t.haze[0], t.haze[1] * k) : h, t.tint, t.ta);
    const paint = (s, k) => s.replace(/(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g, (m, a, h) => `${a}="${tint(h, k)}"`);
    const glows = [];
    const glowCols = new Map();
    const glowId = col => { if (!glowCols.has(col)) glowCols.set(col, `${uid}g${glowCols.size}`); return glowCols.get(col); };
    let out = '';

    // sky
    out += R(0, 0, W, H, `url(#${uid}sky)`);
    if (t.stars && !(loc.sky || {}).rain) {
      const r = K.rng(seed ^ 0x51a7);
      let s = '';
      for (let i = 0; i < 70; i++) s += A('twinkle', C(r.range(0, W), r.range(0, gy - 120), r.range(.8, 2.2), '#ffffff'), r.range(2, 5), r() * 5);
      out += G(s, { opacity: t.stars });
    }
    if (t.sun) out += C(t.sun[0], t.sun[1], t.sun[3] * 3.2, `url(#${uid}halo)`) + C(t.sun[0], t.sun[1], t.sun[3], t.sun[2]);
    if (t.moon) { const [mx, my, mc, mr] = t.moon; out += C(mx, my, mr * 3, `url(#${uid}halo)`) + C(mx, my, mr, mc) + C(mx - mr * .3, my - mr * .2, mr * .22, K.dk(mc, .12)) + C(mx + mr * .35, my + mr * .3, mr * .15, K.dk(mc, .12)); }

    // far layers
    const bk = OPS.backs[loc.back] ? OPS.backs[loc.back](c, K.rng(seed ^ 0xbac), t) : [];
    bk.forEach(l => { out += G(paint(l.svg, l.depth) + (l.emit ? G(l.emit, { opacity: t.emit }) : ''), { transform: `translate(0 ${DY})` }); });

    // sky traffic
    const sr = K.rng(seed ^ 0xc10d), sky = loc.sky || {};
    for (let i = 0; i < (sky.clouds || 0); i++) {
      const x = sr.range(0, W), y = sr.range(80, gy - 260), dur = sr.range(120, 200), s = sr.range(.6, 1.1);
      const v = sky.kind && sr() < .7 ? sky.kind : sr.pick(['puff', 'long']);
      const body = OPS.props.cloud.draw(v, c, K.rng(seed + i * 31), t);
      out += G(K.el('g', { class: 'drift', style: `--from:${(-x - 320) | 0}px;--to:${(W + 320 - x) | 0}px;--t:${dur | 0}s;--d:${(-dur * (x + 320) / (W + 640)).toFixed(1)}s` }, paint(body, .5)), { transform: `translate(${x | 0} ${y | 0}) scale(${s.toFixed(2)})` });
    }
    for (let i = 0; i < (sky.birds || 0); i++) {
      const x = sr.range(200, W - 200), y = sr.range(120, 300);
      out += G(paint(OPS.props.bird.draw('flying', c, K.rng(seed + i * 77), t), .3), { transform: `translate(${x | 0} ${y | 0}) scale(.8)` });
    }

    // ground
    const [gk, gc] = loc.ground || ['grass', '#7cbc5c'];
    out += paint(OPS.grounds[gk](gy, gc, K.rng(seed ^ 0x9d)), 0);

    // props, back to front
    const items = loc.props.map((_, i) => placed(loc, i)).sort((a, b) => a.y - b.y || a.i - b.i);
    items.forEach(p => {
      const def = OPS.props[p.prop];
      if (!def) throw new Error(`unknown prop ${p.prop} in ${id}`);
      const v = def.variants.includes(p.v) ? p.v : def.variants[0];
      const r = K.rng((seed + p.i * 7919) >>> 0);
      let res = def.draw(v, c, r, t, p.o);
      if (typeof res === 'string') res = { body: res };
      const depth = Math.max(0, Math.min(1, (780 - p.y) / 200)) * .35, py = p.y + DY;
      const s = (p.o.s || 1) * Math.max(.6, Math.min(1.45, .95 + (p.y - 620) / 260 * .45));
      let inner = '';
      if (def.ground && t.shadow) {
        const sh = t.shadow, w = def.w;
        inner += E(sh.dx * w * .22 * sh.len, 0, w * .5 * (.7 + .3 * sh.len), 8, '#1c1838', { opacity: sh.a });
      }
      inner += paint(res.body, depth) + (res.emit && t.emit ? G(res.emit, { opacity: t.emit }) : '');
      const flip = p.o.flip ? -1 : 1;
      let g = G(inner, { transform: `scale(${flip} 1)` });
      if (p.o.a === 'drive') {
        const dur = p.o.t || 30, dir = flip, from = dir > 0 ? -p.x - 400 : W - p.x + 400, to = dir > 0 ? W - p.x + 400 : -p.x - 400;
        g = K.el('g', { class: 'drive', style: `--from:${from | 0}px;--to:${to | 0}px;--t:${dur}s;--d:${(-dur * (p.x + 400) / (W + 800)).toFixed(1)}s` }, g);
      } else if (p.o.a === 'wander') g = A('wander', g, 9, r() * 9);
      out += G(g, { transform: `translate(${p.x} ${py}) scale(${s.toFixed(3)})`, 'data-prop': p.prop });
      (res.glows || []).forEach(([x, y, rr, col]) => glows.push([p.x + flip * x * s, py + y * s, rr * s, col]));
    });

    // weather
    if (sky.rain) {
      const rr = K.rng(seed ^ 0x7a1);
      let s = '';
      for (let i = 0; i < 60; i++) s += A('rainfall', L(`M${rr.range(0, W + 200) | 0} ${rr.range(-60, H) | 0}l-10 26`, '#cfe0ff', 2, { opacity: .5 }), rr.range(.7, 1.1), rr() * 1);
      out += G(s);
    }

    // light: glows screen-blend over everything
    if (t.glow) out += G(glows.map(([x, y, rr, col]) => C(x | 0, y | 0, rr | 0, `url(#${glowId(col)})`)).join(''), { style: 'mix-blend-mode:screen', opacity: t.glow });
    out += R(0, 0, W, H, `url(#${uid}vig)`) + R(0, 0, W, H, '#000', 0, { filter: `url(#${uid}grain)`, opacity: .06 });

    const defs = K.el('linearGradient', { id: uid + 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, K.el('stop', { offset: 0, 'stop-color': t.sky[0] }) + K.el('stop', { offset: .9, 'stop-color': t.sky[1] })) +
      K.el('radialGradient', { id: uid + 'halo' }, K.el('stop', { offset: 0, 'stop-color': (t.sun || t.moon)[2], 'stop-opacity': .55 }) + K.el('stop', { offset: 1, 'stop-color': (t.sun || t.moon)[2], 'stop-opacity': 0 })) +
      K.el('radialGradient', { id: uid + 'vig', r: .75 }, K.el('stop', { offset: .6, 'stop-color': '#120e24', 'stop-opacity': 0 }) + K.el('stop', { offset: 1, 'stop-color': '#120e24', 'stop-opacity': .22 + t.ta * .4 })) +
      [...glowCols].map(([col, gid]) => K.el('radialGradient', { id: gid }, K.el('stop', { offset: 0, 'stop-color': col, 'stop-opacity': .55 }) + K.el('stop', { offset: 1, 'stop-color': col, 'stop-opacity': 0 }))).join('') +
      K.el('filter', { id: uid + 'grain', x: 0, y: 0, width: 1, height: 1 }, K.el('feTurbulence', { type: 'fractalNoise', baseFrequency: .9, numOctaves: 2, stitchTiles: 'stitch' }) + K.el('feColorMatrix', { values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.4 0' }));

    return `<svg class="ops-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" data-loc="${id}" data-time="${t.id}" style="--clock:${(opts.clock || 0).toFixed(2)}s" role="img" aria-label="${loc.name}, ${t.clock}"><defs>${defs}</defs>${out}</svg>`;
  };

  OPS.list = () => Object.keys(OPS.locs).map(id => ({ id, name: OPS.locs[id].name, short: OPS.locs[id].short, slogan: OPS.locs[id].slogan, accent: OPS.locs[id].palette.accent }));

  // one prop on a plain card, for the prop sheet and tests
  OPS.renderProp = (name, v, opts = {}) => {
    const def = OPS.props[name], t = OPS.time(opts.time || 'midday'), c = Object.assign({ name: 'Only Profit', short: 'OP', slogan: 'Your input matters*', accent: '#d9261c', accent2: '#3f7fd0' }, opts.palette);
    let res = def.draw(v, c, K.rng(opts.seed || 7), t, opts.o || {});
    if (typeof res === 'string') res = { body: res };
    return res.body + (res.emit && t.emit ? res.emit : '');
  };
})();

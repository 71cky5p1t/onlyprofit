// Nature props. Origin is bottom-centre; draw(v, c, r, t) returns SVG or { body, emit, glows }.
(() => {
  const { R, C, E, P, L, G, A, eye, dk, lt } = OPS.kit, P_ = OPS.props;

  P_.cloud = { w: 200, sky: true, variants: ['puff', 'long', 'rain', 'storm'],
    draw(v, c, r) {
      const col = v === 'storm' ? '#a4abc0' : v === 'rain' ? '#e3e7f2' : '#ffffff', w = v === 'long' ? 280 : 180;
      const blob = (f, dy) => R(-w / 2, -36 + dy, w, 36, f, 18) + C(-w * .2, -38 + dy, 34, f) + C(w * .08, -52 + dy, 46, f) + C(w * .3, -34 + dy, 28, f) + (v === 'long' ? C(-w * .38, -30 + dy, 22, f) : '');
      let s = blob(dk(col, .14), 6) + blob(col, 0) + C(w * .02, -70, 14, lt(col, .6), { opacity: .6 });
      if (v === 'rain' || v === 'storm') {
        let d = '';
        for (let i = 0; i < 9; i++) d += A('rain', L(`M${-w / 2 + 18 + i * (w - 36) / 8} 8l-5 16`, '#7d9cd6', 3), .9, r() * .9);
        s = G(d) + s;
      }
      return s;
    } };

  P_.tree = { w: 90, ground: true, variants: ['gum', 'round', 'palm', 'dead'],
    draw(v, c, r) {
      if (v === 'palm') {
        const tr = '#b98a5e';
        let s = P('M-8 0C-6-60 2-130 18-190L28-188C14-128 8-60 8 0Z', tr) + L('M-6-40h14M-4-80h14M0-120h14M6-160h14', dk(tr, .25), 2.5);
        let fr = '';
        [[-70, 30], [-20, 50], [40, 34], [80, 10], [-90, -10]].forEach(([x, y], i) => {
          fr += P(`M23-190Q${23 + x / 2}-${232 + y / 2} ${23 + x}-${190 - y / 3}Q${23 + x / 2}-${205 + y / 3} 23-190Z`, i % 2 ? '#4f9a5c' : '#3c8150');
        });
        return s + A('sway', fr + C(23, -188, 8, '#7a5236'), 5.2, r() * 5);
      }
      if (v === 'dead') {
        const tr = '#8c7a6e';
        return P('M-9 0C-8-50-6-90-4-120L4-120C6-90 8-50 9 0Z', tr) +
          L('M-2-90Q-30-110-40-140M-1-70Q20-90 38-96M2-110Q14-130 10-150M-30-120q-12-4-16-14M30-92q8-12 6-22', tr, 6) +
          L('M-2-90Q-30-110-40-140', dk(tr, .2), 2.5);
      }
      if (v === 'round') {
        const g = '#5da55a';
        return R(-7, -70, 14, 70, '#8a5d3b', 4) + A('sway', C(0, -110, 58, dk(g, .22)) + C(-10, -118, 52, g) + C(-26, -134, 16, lt(g, .25)), 6, r() * 6);
      }
      // gum: pale bark, clumpy olive canopy
      const tr = '#e8ddcf', g = '#7f9b5c';
      const can = [[-40, -150, 40], [10, -176, 46], [44, -140, 34], [-10, -128, 36]].map(([x, y, s]) => E(x, y + 8, s, s * .62, dk(g, .25))).join('') +
        [[-40, -150, 40], [10, -176, 46], [44, -140, 34], [-10, -128, 36]].map(([x, y, s]) => E(x, y, s, s * .58, g)).join('') + E(4, -188, 18, 9, lt(g, .3));
      return P('M-12 0C-10-40-8-80-24-130L-12-132C0-100 2-120 20-150L30-142C10-110 10-60 12 0Z', tr) +
        P('M2 0C2-40 0-70 4-96L10-90C8-60 10-30 12 0Z', dk(tr, .12)) + A('sway', can, 6.5, r() * 6);
    } };

  P_.bush = { w: 90, ground: true, variants: ['round', 'flower', 'dry'],
    draw(v, c, r) {
      const g = v === 'dry' ? '#b4a46a' : '#5f9e55';
      let s = E(0, -26, 48, 28, dk(g, .2)) + E(-14, -32, 32, 24, g) + E(18, -30, 28, 22, g) + E(-6, -46, 18, 9, lt(g, .25));
      if (v === 'flower') for (let i = 0; i < 7; i++) s += C(r.range(-36, 36), r.range(-48, -14), 4.5, r.pick(['#ff7aa2', '#ffd45a', '#ffffff']));
      return s;
    } };

  P_.rock = { w: 70, ground: true, variants: ['small', 'boulder'],
    draw(v) {
      const k = v === 'boulder' ? 1.8 : 1, g = '#9a8f88';
      return G(P('M-36 0C-40-20-24-40 0-42C24-44 40-24 36 0Z', g) + P('M8-42C28-40 40-24 36 0H10C20-14 18-30 8-42Z', dk(g, .2)) + P('M-20-30q10-8 20-6', 'none', { stroke: lt(g, .3), 'stroke-width': 3, 'stroke-linecap': 'round' }), { transform: `scale(${k})` });
    } };

  // birds: the ibis is the bin chicken
  P_.bird = { w: 40, ground: true, variants: ['ibis', 'gull', 'crow', 'flying'],
    draw(v, c, r) {
      if (v === 'flying') {
        const w = A('flap', L('M-22-4Q-11-14 0 0Q11-14 22-4', '#2a2740', 4), .7, r() * .7);
        return A('glide', w, 7, r() * 7);
      }
      if (v === 'ibis') {
        const body = E(0, -38, 22, 15, '#f3f0ea') + P('M-20-40q-14 6-18 18l10-4z', '#2a2833') + E(4, -32, 16, 8, '#dad5cc');
        const head = L('M14-46q8-12 10-24', '#2a2833', 6) + C(24, -72, 7, '#2a2833') + L('M29-72q16 6 22 28', '#2a2833', 3.5) + eye(25, -74, 1.8, r() * 4);
        return L('M-4-24v24M6-24v24', '#2a2833', 3) + A('peck', body + head, 3.4, r() * 3);
      }
      if (v === 'gull') {
        return L('M-4-16v16M4-16v16', '#f0a35a', 3) + A('peck', E(0, -28, 18, 13, '#ffffff') + P('M-16-30q10 8 26 0q-8 14-26 4z', '#a9b3c6') +
          C(14, -42, 10, '#ffffff') + P('M22-43l12 3-12 3z', '#f5b13d') + eye(17, -44, 1.8, r() * 4), 4.2, r() * 4);
      }
      return L('M-3-16v16M5-16v16', '#2a2740', 3) + A('peck', E(0, -28, 18, 13, '#2c2a40') + C(14, -42, 10, '#2c2a40') + P('M22-44l12 4-12 2z', '#45405e') +
        P('M-6-34q10-4 16 2', 'none', { stroke: '#5b5785', 'stroke-width': 2.5 }) + C(17, -44, 2.4, '#e9e4ff'), 3.8, r() * 4);
    } };

  P_.chicken = { w: 40, ground: true, variants: ['white', 'brown'],
    draw(v, c, r) {
      const f = v === 'brown' ? '#c7814a' : '#fbf7ef';
      return L('M-4-14v14M6-14v14', '#f0a35a', 3) + A('peck', E(0, -28, 20, 16, f) + P('M-18-34q-12-10-10 4z', dk(f, .15)) + C(14, -44, 10, f) +
        P('M10-54q2-8 6-2q2-6 6 1q-4 3-12 1z', '#e2463c') + P('M23-45l8 3-8 3z', '#f5b13d') + E(20, -36, 3, 5, '#e2463c') + eye(17, -46, 1.8, r() * 4) +
        E(-2, -26, 10, 6, dk(f, .1)), 2.6, r() * 3);
    } };

  P_.smoke = { w: 40, variants: ['grey', 'white', 'black'],
    draw(v, c, r) {
      const f = { grey: '#b8b6c4', white: '#f4f2f6', black: '#4b4858' }[v];
      let s = '';
      for (let i = 0; i < 5; i++) s += A('puff', C(0, 0, 18 + i * 2, f), 5, i, { opacity: .9 });
      return s;
    } };

  P_.dust = { w: 60, variants: ['brown', 'red'],
    draw(v, c, r) {
      const f = v === 'red' ? '#d08a5c' : '#c9ac86';
      let s = '';
      for (let i = 0; i < 4; i++) s += A('dust', E(0, -14, 30, 18, f), 3.2, i * .8);
      return s;
    } };
})();

// Trade props: the stock each company actually sells (or quietly disposes of).
(() => {
  const { R, C, E, P, L, G, A, T, eye, dk, lt } = OPS.kit, P_ = OPS.props;
  const BAL = ['#ff5d8f', '#ffd45a', '#5fc3f0', '#7ac36a', '#c06ad6', '#ff8a3a'];

  P_.bouncycastle = { w: 300, ground: true, variants: ['castle', 'deflating'],
    draw(v, c, r) {
      const a = c.accent, b = '#ffd45a', d = '#5fc3f0';
      const turret = (x, f) => R(x - 24, -230, 48, 150, f, 20) + C(x, -238, 26, f) + C(x, -238, 10, lt(f, .35)) + L(`M${x} -260v-34`, '#7d8496', 3) + A('flagwave', P(`M${x} -294l26 6-26 8z`, b), 1.4, r());
      const s = R(-150, -60, 300, 60, dk(d, .1), 24) + R(-130, -180, 260, 130, a, 26) + P('M-80-50v-70a80 60 0 0 1 160 0v70z', dk(a, .35)) +
        P('M-60-50v-56a60 44 0 0 1 120 0v56z', '#2b2240', { opacity: .8 }) + turret(-140, b) + turret(140, d) + R(-130, -200, 260, 30, lt(a, .2), 15) +
        [-90, -45, 0, 45, 90].map(x => C(x, -204, 18, lt(a, .2))).join('') + R(-150, -24, 300, 24, d, 12);
      return A(v === 'deflating' ? 'deflate' : 'wobble', s, v === 'deflating' ? 9 : 1.6, r() * 2);
    } };

  P_.balloon = { w: 30, variants: ['single', 'bunch', 'escaped', 'sad'],
    draw(v, c, r) {
      const one = (x, y, f) => L(`M${x} ${y + 30}q-6 20 ${-x * .8} ${-y - 30}`, '#e8e4dc', 1.5) + E(x, y, 22, 27, f) + E(x - 7, y - 9, 6, 9, lt(f, .5), { opacity: .7 }) + P(`M${x - 4} ${y + 27}h8l-4 6z`, dk(f, .1));
      if (v === 'bunch') return A('bob', one(-22, -150, r.pick(BAL)) + one(20, -160, r.pick(BAL)) + one(0, -190, r.pick(BAL)), 3.2, r() * 3);
      if (v === 'sad') return L('M0 0q10-6 18-14', '#e8e4dc', 1.5) + A('bob', E(28, -16, 16, 11, r.pick(BAL), { transform: 'rotate(30 28 -16)' }) + E(22, -20, 4, 3, '#ffffff', { opacity: .5 }), 7, r() * 3);
      if (v === 'escaped') return A('rise', one(0, -160, r.pick(BAL)), 14, r() * 14);
      return A('bob', one(0, -150, r.pick(BAL)), 2.8, r() * 3);
    } };

  P_.esky = { w: 60, ground: true, variants: ['blue', 'red', 'open'],
    draw(v, c, r) {
      const lid = v === 'red' ? '#e2463c' : '#3f7fd0';
      let s = R(-34, -44, 68, 44, '#f4f2ee', 6) + R(-34, -10, 68, 10, dk('#f4f2ee', .12), 4) + L('M-20-44v-10h40v10', '#9aa1ae', 3);
      if (v === 'open') s += [-18, -4, 10].map(x => R(x, -60, 10, 18, '#c8cfd8', 2) + R(x, -56, 10, 5, '#2e7a3c')).join('') + R(-40, -96, 10, 52, lid, 4);
      else s += R(-36, -52, 72, 12, lid, 5);
      return s;
    } };

  P_.coffin = { w: 140, ground: true, variants: ['closed', 'open', 'display', 'budget'],
    draw(v, c, r, t, o) {
      const k = v === 'budget' ? '#c9a27a' : v === 'display' ? '#7a3a2a' : '#8a5236';
      const shape = 'M-70-36l20-20h100l20 20-20 20h-100z';
      let s = P('M-70-36l20-20h100l20 20v20l-20 16h-100l-20-16z', dk(k, .25)) + P(shape, k);
      if (v === 'budget') s += T(0, -32, 'THIS WAY UP ↑', 10, '#6d4a2a') + L('M-40-46h30M10-46h30', '#a37f5a', 2);
      else s += L('M-50-36h100', lt(k, .15), 2) + C(-60, -36, 3, '#c9a24a') + C(60, -36, 3, '#c9a24a');
      if (v === 'open') s = P('M-70-36l20-20h100l20 20v20l-20 16h-100l-20-16z', dk(k, .25)) + P(shape, '#f1e6f3') + E(-40, -38, 16, 10, '#ffffff') +
        G(P('M0-56h50l20 20-20-6h-50z', k), { transform: 'rotate(-28 50 -56)' });
      if (v === 'display') s += G(R(20, -84, 50, 30, '#fff8ea', 2) + T(45, -71, 'DISPLAY', 8, '#2a2836') + T(45, -60, o.price || '$4,999', 9, '#d9261c') + L('M30-54l-6 14', '#e8e4dc', 1.2), { transform: 'rotate(8 45 -70)' });
      return s;
    } };

  P_.wreath = { w: 60, ground: true, variants: ['sorry', 'condolences'],
    draw(v, c, r, t, o) {
      let ring = '';
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ring += C(Math.cos(a) * 30, -110 + Math.sin(a) * 30, 12, i % 3 ? '#4f8a52' : '#3c7044'); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .3; ring += C(Math.cos(a) * 30, -110 + Math.sin(a) * 30, 6, r.pick(['#ffffff', '#f2c6d6', '#ffd45a'])); }
      return L('M-24 0l20-80M24 0l-20-80M0 0v-70', '#8a6a52', 4) + ring + P('M-16-82l16 40 16-40z', c.accent2 || '#5a4860') +
        R(-28, -120, 56, 18, '#fff8ea', 2) + T(0, -107, o.txt || (v === 'sorry' ? 'SORRY' : 'WITH SYMPATHY'), v === 'sorry' ? 10 : 6, '#2a2836');
    } };

  P_.candle = { w: 20, ground: true, variants: ['tall', 'short'],
    draw(v, c, r, t) {
      const h = v === 'tall' ? 90 : 46, ph = r() * 2;
      const body = R(-14, -8, 28, 8, '#c9a24a', 2) + R(-8, -8 - h, 16, h, '#f6efe0', 3) + R(2, -8 - h, 6, h, '#e6dcc6', 2) + L(`M0 ${-8 - h}v-6`, '#2a2836', 1.5);
      const flame = A('flame', P(`M0 ${-14 - h}c-6-6-6-14 0-22c6 8 6 16 0 22z`, '#ffb43a') + P(`M0 ${-16 - h}c-3-3-3-8 0-12c3 4 3 9 0 12z`, '#fff1b0'), .9, ph);
      return { body, emit: flame, glows: [[0, -26 - h, t.emit ? 60 : 24, '#ffb46a']] };
    } };

  P_.headstone = { w: 60, ground: true, variants: ['round', 'cross', 'pet', 'cheap'],
    draw(v, c, r, t, o) {
      const g = '#a7a3b4';
      if (v === 'cross') return R(-7, -110, 14, 110, g, 2) + R(-30, -84, 60, 14, g, 2) + R(1, -110, 6, 110, dk(g, .15)) + E(0, 0, 30, 6, '#5f8a4e');
      if (v === 'pet') return OPS.kit.arch(-20, -40, 40, 40, g) + T(0, -14, o.txt || 'REX', 9, '#5a5670') + P('M-10-28h20M-10-28m-3 0a3 3 0 1 1 3-3M10-28m3 0a3 3 0 1 0-3-3', 'none', { stroke: '#5a5670', 'stroke-width': 2 }) + C(18, -4, 6, '#d9e04a');
      if (v === 'cheap') return L('M0 0v-80M-22-58h44', '#a37f5a', 7) + R(-24, -72, 48, 18, '#fff8ea', 2) + T(0, -59, o.txt || 'TBC', 9, '#2a2836');
      return OPS.kit.arch(-34, -96, 68, 96, g) + P('M8-96a34 34 0 0 1 26 34V0H14z', dk(g, .15)) + T(0, -50, o.txt || 'RIP', 15, '#5a5670') + E(0, 0, 40, 6, '#5f8a4e') +
        C(-14, -6, 5, '#ff7aa2') + C(-6, -4, 5, '#ffd45a');
    } };

  P_.crate = { w: 80, ground: true, variants: ['fish', 'pallet', 'chooks'],
    draw(v, c, r) {
      if (v === 'pallet') return R(-50, -12, 100, 12, '#b98a5e', 2) + R(-46, -72, 44, 60, '#d9b98a', 2) + R(2, -72, 44, 60, '#cda878', 2) + R(-26, -120, 50, 48, '#d9b98a', 2) +
        L('M-24-42h0M-24-100h0', '#000', 0) + R(-46, -50, 92, 6, c.accent, 0, { opacity: .8 }) + T(-24, -90, 'FRAGILE', 7, '#a33a2a');
      if (v === 'chooks') {
        let s = R(-50, -60, 100, 60, '#c79a5e', 4);
        for (let i = 0; i < 3; i++) s += A('peck', C(-30 + i * 30, -66, 11, '#fbf7ef') + P(`M${-34 + i * 30} -76q2-6 6-2q2-5 6 1z`, '#e2463c') + eye(-27 + i * 30, -68, 1.6, i), 2.4, i * .7);
        for (let x = -40; x <= 40; x += 16) s += R(x, -60, 6, 60, dk('#c79a5e', .25));
        return s;
      }
      let s = R(-44, -46, 88, 46, '#3f7fd0', 4) + R(-44, -46, 88, 8, dk('#3f7fd0', .2), 4);
      for (let i = 0; i < 4; i++) s += P(`M${-34 + i * 20} -46l-6-14 12 4z`, '#a8b8c8') + E(-28 + i * 20, -48, 8, 4, '#b8c8d6');
      return s + R(-30, -30, 60, 10, dk('#3f7fd0', .15), 3);
    } };

  P_.pool = { w: 360, variants: ['clean', 'green'],
    draw(v, c, r) {
      const w = v === 'green' ? '#7fae5a' : '#5ec6e6';
      let s = R(-180, -70, 360, 74, '#e9e3d6', 14) + R(-166, -62, 332, 58, w, 10) + R(-166, -62, 332, 10, dk(w, .2), 6);
      for (let i = 0; i < 6; i++) s += A('shimmer', L(`M${-140 + i * 50} -32q10-6 20 0`, lt(w, .5), 3), 2.4, i * .4);
      s += A('bob', G(E(50, -36, 12, 5, '#ff5d8f') + E(60, -36, 6, 3, '#f4f2ee'), { transform: 'rotate(-12 50 -36)' }), 4.4, 1);
      if (v === 'green') s += A('bob', P('M-80-40q20-20 40-10q10-24 20-6l-10 16h-50z', '#ff8ab5', { opacity: .85 }), 6, 2);
      return s + L('M150-70v-50h16M150-104h16M150-88h16', '#c3c8d4', 3);
    } };

  P_.bbq = { w: 80, ground: true, variants: ['snags', 'cold'],
    draw(v, c, r) {
      let s = L('M-30 0l6-50M30 0l-6-50', '#3d3b4c', 4) + R(-44, -66, 88, 18, '#3d3b4c', 4) + R(-44, -70, 88, 6, '#5d5b70', 2);
      if (v === 'snags') {
        for (let i = 0; i < 5; i++) s += R(-36 + i * 15, -78, 12, 6, '#a8583a', 3);
        s += G(P_.smoke.draw('grey', c, r), { transform: 'translate(0 -90) scale(.6)' });
      } else s += R(-40, -80, 80, 10, '#9aa1ae', 3);
      return s;
    } };
})();

(() => {
  const { R, C, E, P, L, G, A, eye, dk } = OPS.kit;
  // the dog waits outside. It always waits outside.
  OPS.props.dog = { w: 60, ground: true, variants: ['kelpie', 'sausage'],
    draw(v, c, r) {
      const f = v === 'sausage' ? '#9a5a32' : '#b8743e', d = r() * 4;
      const tail = A('wag', L(v === 'sausage' ? 'M-34-20q-14-6-16-16' : 'M-20-16q-18-4-20-22', f, 5), .5, d);
      if (v === 'sausage') return tail + R(-36, -34, 66, 22, f, 11) + L('M-26-14v14M-10-14v14M8-14v14M22-14v14', dk(f, .2), 5) +
        A('nod', C(34, -38, 13, f) + E(44, -34, 8, 6, dk(f, .15)) + E(28, -44, 6, 11, dk(f, .3), { transform: 'rotate(20 28 -44)' }) + eye(36, -42, 2.2, d) + C(51, -36, 2.6, '#1c1a2c'), 6, d);
      return tail + P('M-20-6q-4-34 20-40q18 0 18 30v16z', f) + E(0, -6, 22, 8, dk(f, .15)) + E(6, -30, 8, 12, '#f2e2c8') +
        A('nod', C(10, -54, 15, f) + P('M0-64l-4-16 12 8zM16-66l8-14 2 16z', dk(f, .3)) + E(22, -50, 9, 6, '#f2e2c8') + C(30, -51, 2.6, '#1c1a2c') + eye(8, -58, 2.2, d) + eye(17, -58, 2.2, d), 6, d);
    } };
})();

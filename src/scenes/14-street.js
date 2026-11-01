// Street furniture and signage. Brand colour (c.accent) only goes on the company's own things.
(() => {
  const { R, C, E, P, L, G, A, T, dk, lt } = OPS.kit, P_ = OPS.props;

  P_.lamp = { w: 30, ground: true, variants: ['street', 'flicker'],
    draw(v, c, r, t) {
      const ph = r() * 3, pole = '#5d6274', light = v === 'flicker' ? '#e6fbff' : '#ffd77a';
      const body = R(-4, -220, 8, 220, pole, 3) + L('M0-214q0-16 30-16', pole, 7) + P('M18-236h34l-6 12h-22z', '#3d4152') + R(24, -226, 22, 5, '#d8dce6', 2);
      if (!t.emit) return body;
      const lamp = R(24, -226, 22, 5, light, 2) + P('M24-221h22l40 221h-102z', light, { opacity: .06 });
      return { body, emit: v === 'flicker' ? A('flicker', lamp, 3.7, ph) : lamp, glows: [[35, -222, 70, light]] };
    } };

  P_.pole = { w: 30, ground: true, variants: ['power', 'stobie'],
    draw(v, c, r, t, o) {
      const sp = o.span || 160, w = v === 'stobie' ? '#9aa1ae' : '#8a6a52';
      return R(-6, -300, 12, 300, w, 3) + R(-46, -280, 92, 8, dk(w, .2), 2) + C(-38, -286, 5, '#d8e4f0') + C(0, -286, 5, '#d8e4f0') + C(38, -286, 5, '#d8e4f0') +
        L(`M-38-286q-${sp / 2} ${sp * .04} -${sp} 12M38-286q${sp / 2} ${sp * .04} ${sp} 12`, '#3d3b4c', 1.5) + R(-14, -200, 28, 20, '#a8aebb', 3);
    } };

  P_.sign = { w: 90, ground: true, variants: ['pylon', 'billboard', 'neon', 'aframe', 'tooth', 'bingo'],
    draw(v, c, r, t, o) {
      const txt = (o.txt || c.name).toUpperCase();
      if (v === 'pylon') {
        const name = c.short || txt, words = T(0, -240, name, OPS.kit.fit(name, 144, 28), '#fff8ea') + T(0, -197, (o.sub || c.slogan || '').toUpperCase(), OPS.kit.fit(o.sub || c.slogan || '', 170, 9), '#fff8ea', { 'letter-spacing': 1.5 });
        const body = R(-6, -200, 12, 200, '#7d8496') + R(-80, -280, 160, 90, c.accent, 10) + R(-80, -214, 160, 24, dk(c.accent, .2), 0) + words;
        return t.emit ? { body, emit: words, glows: [[0, -240, 130, c.accent]] } : body;
      }
      if (v === 'billboard') {
        const body = R(-90, -160, 8, 160, '#7d8496') + R(82, -160, 8, 160, '#7d8496') + R(-160, -300, 320, 150, '#f4f0e6', 4) + R(-160, -300, 120, 150, c.accent, 4) +
          T(-100, -210, c.short || 'CO', OPS.kit.fit(c.short || 'CO', 104, 30), '#fff8ea') + T(60, -240, o.txt || c.slogan || '', OPS.kit.fit(o.txt || c.slogan || '', 180, 18), '#2a2836') + (o.sub ? T(60, -214, o.sub.toUpperCase(), OPS.kit.fit(o.sub, 200, 11), dk(c.accent, .1), { 'letter-spacing': 1 }) : '') +
          L('M-150-160h300', '#5d6274', 4);
        return t.emit ? { body, emit: '', glows: [[-60, -300, 80, '#ffe3a0'], [60, -300, 80, '#ffe3a0']] } : body;
      }
      if (v === 'neon') {
        const n = '#ff4f8b', b = '#47e0ff', ph = r() * 4;
        const body = R(-6, -150, 12, 150, '#7d8496') + R(-90, -300, 180, 150, '#2d2b3e', 10) + T(0, -250, txt, 26, dk(n, .45)) + T(-56, -180, 'NO', 22, dk(b, .5)) + T(22, -180, 'VACANCY', 18, dk(b, .5));
        if (!t.emit) return body;
        return { body, emit: T(0, -250, txt, 26, n) + A('neonno', T(-56, -180, 'NO', 22, b), 4.4, ph) + T(22, -180, 'VACANCY', 18, b), glows: [[0, -258, 120, n], [0, -186, 90, b]] };
      }
      if (v === 'aframe') return P('M-34 0l14-90h40L34 0h-8l-12-80h-28L-26 0z', '#8a6a52') + R(-22, -84, 44, 60, '#2d3a32', 2) +
        T(0, -66, o.txt || 'SPECIALS', OPS.kit.fit(o.txt || 'SPECIALS', 38, 8), '#f4f0e6') + T(0, -50, o.sub || 'TODAY', OPS.kit.fit(o.sub || 'TODAY', 38, 7), '#ffd45a') + L('M-14-40h28', '#f4f0e6', 1.2);
      if (v === 'tooth') return R(-6, -170, 12, 170, '#7d8496') + A('spin3', G(P('M-46-290c-20 0-26 30-20 60 6 30 10 60 22 60s10-30 14-30 4 30 14 30 18-30 22-60 0-60-20-60c-12 0-14 8-16 8s-4-8-16-8z', '#ffffff') +
        P('M-14-290C2-290 10-262 6-230C2-200-6-170-16-170C-10-200-8-260-14-290Z', '#dfe5ee') + OPS.kit.eye(-38, -252, 3, 0) + OPS.kit.eye(-22, -252, 3, 0) + L('M-37-236q7 7 14 0', '#1c1a2c', 2.5), { transform: 'translate(30 0)' }), 7, 0);
      return R(-66, -170, 8, 170, '#7d8496') + R(58, -170, 8, 170, '#7d8496') + R(-90, -250, 180, 90, '#fff8ea', 6) + R(-90, -250, 180, 30, c.accent, 6) +
        T(0, -229, 'BINGO', 20, '#fff8ea', { 'letter-spacing': 3 }) + T(0, -192, o.txt || 'TONIGHT 7PM', 15, '#2a2836') + T(0, -172, o.sub || 'BYO OXYGEN', 10, dk(c.accent, .2), { 'letter-spacing': 1 });
    } };

  P_.bin = { w: 44, ground: true, variants: ['wheelie', 'overflow', 'skip'],
    draw(v, c, r) {
      if (v === 'skip') return P('M-90-70h180l-20 70h-140z', '#f2b631') + R(-90, -74, 180, 8, dk('#f2b631', .2)) + P('M-70-74q10-30 40-20q20-26 40-6q24-10 30 26z', '#8a8070') +
        R(-30, -100, 26, 30, '#c9a27a', 2, { transform: 'rotate(-14)' }) + T(0, -30, 'SKIP', 16, dk('#f2b631', .4));
      const g = '#3e8a54', lid = v === 'overflow' ? '#e2463c' : '#f2c531';
      let s = P('M-22-80h44l-4 72h-36z', g) + P('M8-80h14l-4 72h-10z', dk(g, .2)) + C(-14, -6, 7, '#26243a') + C(14, -6, 7, '#26243a');
      if (v === 'overflow') {
        s = P('M14-80l22-40 7 4-20 38z', lid) + s + C(-8, -84, 15, '#2a2836') + C(10, -88, 12, '#3d3b4c') + E(-2, -98, 9, 7, '#2a2836');
        for (let i = 0; i < 3; i++) s += A('fly', C(0, -110, 2.2, '#1c1a2c'), 1.6 + i * .4, i * .5);
      } else s += R(-25, -86, 50, 8, lid, 3);
      return s;
    } };

  P_.cone = { w: 30, ground: true, variants: ['up', 'down'],
    draw(v) {
      if (v === 'down') return P('M-40-10L4-18V2z', '#ff7a2a') + P('M-22-13l10-2v14l-10-2z', '#f4f0e6') + R(4, -22, 7, 26, '#e05f1a', 2);
      return P('M-6-48h12l10 44h-32z', '#ff7a2a') + R(-10, -34, 20, 6, '#f4f0e6') + R(-20, -6, 40, 6, '#e05f1a', 2);
    } };

  P_.fence = { w: 300, ground: true, variants: ['picket', 'chain', 'site'],
    draw(v, c, r, t, o) {
      const w = o.len || 300;
      let s = '';
      if (v === 'picket') { for (let x = -w / 2; x < w / 2; x += 18) s += P(`M${x} 0v-60l6-8 6 8v60z`, '#f4f0e6'); s += R(-w / 2, -48, w, 6, dk('#f4f0e6', .12)) + R(-w / 2, -20, w, 6, dk('#f4f0e6', .12)); }
      if (v === 'chain') { s += R(-w / 2, -90, w, 90, '#9aa1ae', 0, { opacity: .35 }); for (let x = -w / 2; x <= w / 2; x += 60) s += R(x - 3, -96, 6, 96, '#7d8496', 2); s += L(`M${-w / 2} -90h${w}`, '#7d8496', 3); }
      if (v === 'site') { for (let x = -w / 2; x < w / 2; x += 100) s += R(x, -80, 98, 80, c.accent, 0, { opacity: .85 }) + R(x, -80, 98, 4, '#9aa1ae') + R(x - 2, -84, 4, 84, '#7d8496') + R(x - 10, -6, 24, 6, '#d6913a', 2); }
      return s;
    } };

  P_.vending = { w: 60, ground: true, variants: ['snacks', 'ice'],
    draw(v, c, r, t) {
      const k = v === 'ice' ? '#e9eef4' : '#d9261c';
      let body = R(-30, -140, 60, 140, k, 6) + R(-22, -128, 30, 96, '#2a2836', 3) + R(14, -120, 10, 40, '#3d3b4c', 2) + R(-22, -26, 44, 14, '#26243a', 2);
      if (v === 'ice') body = R(-30, -140, 60, 140, k, 6) + T(0, -110, 'ICE', 18, '#3f8f8a') + R(-22, -90, 44, 50, '#cfe1ee', 4) + R(-22, -26, 44, 14, '#26243a', 2);
      else for (let i = 0; i < 4; i++) body += R(-18, -122 + i * 22, 22, 6, r.pick(['#ffd45a', '#5fc3f0', '#7ac36a', '#ff7aa2']), 1);
      if (!t.emit) return body;
      return { body, emit: v === 'ice' ? R(-22, -90, 44, 50, '#e6fbff', 4) : R(-22, -128, 30, 96, '#d9f3ff', 3, { opacity: .55 }), glows: [[0, -80, 90, v === 'ice' ? '#bff0ff' : '#ffd0c4']] };
    } };

  P_.flag = { w: 30, ground: true, variants: ['brand', 'halfmast'],
    draw(v, c, r) {
      const y = v === 'halfmast' ? -150 : -230;
      return R(-3, -240, 6, 240, '#c3c8d4', 2) + C(0, -242, 5, '#c9a24a') + A('flagwave', P(`M3 ${y}q30-8 60 0t60 0v46q-30-8-60 0t-60 0z`, c.accent) + T(56, y + 28, c.short || '', OPS.kit.fit(c.short || '', 100, 12), '#fff8ea'), 2.2, r() * 2);
    } };
})();

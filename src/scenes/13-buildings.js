// Buildings. Windows return a day face in body and a lit face in emit, so night lighting is free.
(() => {
  const { R, C, E, P, L, G, A, T, eye, dk, lt, lit, ribs } = OPS.kit, P_ = OPS.props;
  const WARM = '#ffe29a', FLUORO = '#e6fbff', TV = '#9fd8ff';
  // a window: glass by day, light by night
  const win = (x, y, w, h, r, t, p, o = {}) => {
    const on = lit(r, t, p), ph = r() * 2, glass = o.glass || '#9cc8e6';
    const body = R(x, y, w, h, glass, o.rx || 2) + P(`M${x + w * .2} ${y + h}l${w * .5} -${h}h${w * .18}l-${w * .5} ${h}z`, lt(glass, .35), { opacity: .7 });
    if (!on) return { body, emit: '', glow: null };
    const col = o.col || WARM;
    const e = o.tv ? A('tv', R(x, y, w, h, col, o.rx || 2), 1.3, ph) : R(x, y, w, h, col, o.rx || 2);
    return { body, emit: e + (o.curtain ? R(x, y, w * .22, h, dk(col, .25)) + R(x + w * .78, y, w * .22, h, dk(col, .25)) : ''), glow: [x + w / 2, y + h / 2, Math.max(w, h) * 1.4, col] };
  };
  // brand lettering: printed by day, lit by night
  const sign = (txt, t, glow) => ({ body: txt, emit: t.emit ? txt : '', glow: t.emit ? glow : null });
  OPS.kit.sign = sign;
  const pack = parts => { const o = { body: '', emit: '', glows: [] }; parts.forEach(p => { if (typeof p === 'string') o.body += p; else { o.body += p.body; o.emit += p.emit || ''; if (p.glow) o.glows.push(p.glow); if (p.glows) o.glows.push(...p.glows); } }); return o; };

  P_.chapel = { w: 380, ground: true, variants: ['chapel'],
    draw(v, c, r, t, o) {
      const wall = '#e2d6c8', roof = '#5a4860';
      const rose = (() => {
        const on = t.emit > 0, cols = ['#e2463c', '#ffd45a', '#5fc3f0', '#7ac36a', '#c06ad6', '#ff9a4a'];
        let b = C(0, -230, 30, '#6d6582'), e = '';
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, a2 = a + Math.PI / 3; const d = `M0 -230L${30 * Math.cos(a)} ${-230 + 30 * Math.sin(a)}A30 30 0 0 1 ${30 * Math.cos(a2)} ${-230 + 30 * Math.sin(a2)}Z`; b += P(d, dk(cols[i], .35)); e += P(d, cols[i]); }
        b += C(0, -230, 7, '#e2d6c8'); e += C(0, -230, 7, '#fff3c4');
        return { body: b, emit: on ? e : '', glow: on ? [0, -230, 90, '#ffb36a'] : null };
      })();
      return pack([
        R(-190, -170, 380, 170, wall), R(40, -170, 150, 170, dk(wall, .08)), P('M-210-166L0-290 210-166z', roof), P('M0-290L210-166h-30L0-270z', dk(roof, .2)),
        R(-26, -370, 52, 90, wall), P('M-34-370L0-410 34-370z', roof), L('M0-410v-28M-10-428h20', '#c9a24a', 5), R(-12, -350, 24, 34, '#3d3650', 12),
        rose, P('M-34 0v-70a34 34 0 0 1 68 0V0z', '#5a3e34'), L('M0-104V0', dk('#5a3e34', .3), 2), C(-8, -40, 3, '#c9a24a'), C(8, -40, 3, '#c9a24a'),
        win(-160, -130, 40, 70, r, t, .9, { rx: 20, curtain: true }), win(-100, -130, 40, 70, r, t, .7, { rx: 20, curtain: true }),
        win(70, -130, 40, 70, r, t, .6, { rx: 20, curtain: true }), win(130, -130, 40, 70, r, t, .9, { rx: 20, curtain: true }),
        R(-190, -12, 380, 12, dk(wall, .18)), R(-120, -168, 240, 26, c.accent, 4), sign(T(0, -149, (o.txt || c.name).toUpperCase(), 13, '#fff8ea', { 'letter-spacing': 3 }), t, [0, -155, 140, c.accent])
      ]);
    } };

  P_.tower = { w: 270, ground: true, variants: ['tall', 'wide'],
    draw(v, c, r, t, o) {
      const W = v === 'wide' ? 340 : 240, H = v === 'wide' ? 380 : 520, glass = '#6f9fc6', cols = v === 'wide' ? 8 : 6, rows = Math.floor((H - 80) / 34);
      const parts = [R(-W / 2, -H, W, H, glass), R(W * .1, -H, W * .4, H, dk(glass, .14)), R(-W / 2 - 8, -H - 10, W + 16, 14, '#3d4a66')];
      const cw = (W - 30) / cols;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
        parts.push(win(-W / 2 + 15 + x * cw + 3, -H + 30 + y * 34, cw - 6, 22, r, t, .45, { glass: x / cols > .58 ? '#7aa8cc' : '#a6cbe6', col: r() < .3 ? FLUORO : WARM }));
      parts.push(R(-W / 2, -60, W, 60, '#3d4a66'), R(-30, -54, 60, 54, '#9cc8e6'), L('M0-54V0', '#3d4a66', 3), R(-W / 2 + 20, -H + 6, W - 40, 0, 'none'));
      parts.push(R(-60, -H - 60, 120, 44, c.accent, 6), sign(T(0, -H - 30, c.short || 'CO', 24, '#fff8ea', { 'letter-spacing': 2 }), t, [0, -H - 38, 120, c.accent]));
      if (t.emit) parts.push({ body: '', emit: A('blink', C(W / 2 - 14, -H - 24, 5, '#ff4a3a'), 1.6, 0), glow: [W / 2 - 14, -H - 24, 26, '#ff4a3a'] });
      parts.push(L(`M${W / 2 - 14} -${H + 10}v-12`, '#3d4a66', 3));
      return pack(parts);
    } };

  P_.motel = { w: 480, ground: true, variants: ['motel'],
    draw(v, c, r, t) {
      const wall = '#f1dcb4', door = '#3f8f8a';
      const parts = [R(-240, -180, 480, 180, wall), R(-240, -180, 480, 14, '#c9714a'), R(-240, -98, 480, 12, dk(wall, .2)), L('M-240-110h480', '#8a6a5a', 3), ribs(-240, -110, 480, 14, 24, '#8a6a5a', 2)];
      for (let i = 0; i < 6; i++) {
        const x = -220 + i * 76;
        parts.push(R(x, -158, 24, 46, door, 2), C(x + 19, -134, 2, '#ffd45a'), T(x + 12, -162, String(i + 1), 9, '#8a6a5a'));
        parts.push(win(x + 32, -152, 34, 28, r, t, .55, { curtain: true, tv: r() < .4, col: r() < .4 ? TV : WARM }));
        parts.push(R(x, -72, 24, 72, door, 2), C(x + 19, -36, 2, '#ffd45a'), T(x + 12, -76, String(i + 11), 9, '#8a6a5a'));
        parts.push(win(x + 32, -64, 34, 28, r, t, .5, { curtain: true, tv: r() < .4, col: r() < .4 ? TV : WARM }));
      }
      parts.push(R(-240, -6, 480, 6, dk(wall, .25)));
      return pack(parts);
    } };

  P_.shed = { w: 360, ground: true, variants: ['factory', 'warehouse', 'crematorium'],
    draw(v, c, r, t, o) {
      const brick = v === 'crematorium', wall = brick ? '#c48a72' : '#cfd3da', roof = brick ? '#5a4860' : '#8f97a6';
      const parts = [R(-180, -170, 360, 170, wall), P('M-190-166l190-40 190 40z', roof), R(-180, -170, 360, 10, dk(wall, .15))];
      if (!brick) parts.push(ribs(-180, -160, 360, 160, 30, dk(wall, .1), 2));
      else for (let y = -150; y < 0; y += 16) parts.push(L(`M-180 ${y}h360`, dk(wall, .1), 1.5));
      if (v !== 'crematorium') {
        parts.push(R(-140, -110, 110, 110, '#9aa1ae', 3), ribs(-140, -110, 110, 110, 1, '#9aa1ae'));
        for (let y = -100; y < 0; y += 10) parts.push(L(`M-140 ${y}h110`, dk('#9aa1ae', .15), 2));
        parts.push(R(20, -110, 110, 110, '#9aa1ae', 3));
        for (let y = -100; y < -30; y += 10) parts.push(L(`M20 ${y}h110`, dk('#9aa1ae', .15), 2));
        parts.push(R(20, -30, 110, 30, '#2a2836'));
        parts.push(R(-170, -150, 140, 28, c.accent, 4), sign(T(-100, -130, (o.txt || c.short || 'CO').toUpperCase(), 15, '#fff8ea', { 'letter-spacing': 2 }), t, [-100, -136, 110, c.accent]));
        parts.push(win(50, -150, 60, 24, r, t, .7, { col: FLUORO }));
      } else {
        parts.push(R(-40, -84, 80, 84, '#5a3e34', 4), R(-170, -140, 120, 40, '#e8ddcf', 3), T(-110, -115, o.txt || 'FAREWELL', 12, '#5a4860', { 'letter-spacing': 2 }));
        parts.push(win(70, -120, 80, 40, r, t, .5, { curtain: true }));
      }
      if (v === 'factory' || brick) {
        const cx = brick ? 120 : 130;
        parts.push(R(cx - 18, -300, 36, 140, brick ? dk(wall, .12) : '#b6bcc8'), R(cx - 22, -306, 44, 12, dk(roof, .1), 3));
        if (!brick) parts.push(R(cx - 18, -270, 36, 10, '#e2463c'), R(cx - 18, -240, 36, 10, '#e2463c'));
        parts.push(G(P_.smoke.draw(brick ? 'grey' : 'white', c, r), { transform: `translate(${cx} -310)` }));
        if (brick) parts.push(A('shimmer', E(cx, -320, 14, 8, '#ffbf8a', { opacity: .35 }), 1.2, 0));
      }
      return pack(parts);
    } };

  P_.shopfront = { w: 280, ground: true, variants: ['plain', 'dental', 'pawn'],
    draw(v, c, r, t, o) {
      const wall = v === 'pawn' ? '#e8d9b0' : '#efe7da', aw = c.accent;
      let scal = '';
      for (let i = 0; i < 10; i++) scal += C(-140 + 14 + i * 28, -136, 14, i % 2 ? '#fff8ea' : aw);
      let stripes = '';
      for (let i = 0; i < 10; i++) stripes += R(-140 + i * 28, -170, 28, 34, i % 2 ? '#fff8ea' : aw);
      const label = (o.txt || (v === 'dental' ? 'SMILE DIRECT' : v === 'pawn' ? 'CASH 4 ANYTHING' : c.name)).toUpperCase();
      return pack([
        R(-140, -250, 280, 250, wall), R(40, -250, 100, 250, dk(wall, .07)), R(-140, -250, 280, 60, '#3d3a52'), sign(T(0, -212, label, label.length > 14 ? 17 : 22, '#fff8ea', { 'letter-spacing': 2 }), t, [0, -220, 150, c.accent]),
        G(stripes + scal), win(-120, -110, 150, 90, r, t, .9, { col: v === 'dental' ? FLUORO : WARM, glass: '#a8cfe8' }),
        R(50, -110, 60, 110, '#4d6a8a', 3), R(58, -100, 44, 60, '#a8cfe8', 2), C(98, -54, 3, '#ffd45a'), R(-140, -14, 280, 14, dk(wall, .2)),
        v === 'pawn' ? T(-45, -50, 'WE BUY GOLD', 12, '#d9261c', { 'letter-spacing': 1 }) + T(-45, -34, '& TEETH', 10, '#d9261c') : '',
        v === 'dental' ? T(-45, -36, 'NO GAP*', 14, '#2c6a8a') : ''
      ]);
    } };

  P_.donga = { w: 220, ground: true, variants: ['office', 'crib'],
    draw(v, c, r, t) {
      const wall = '#ebe7dc';
      return pack([
        R(-110, -130, 220, 106, wall, 4), R(-110, -60, 220, 8, c.accent), R(-104, -24, 20, 24, '#7d8496'), R(84, -24, 20, 24, '#7d8496'),
        R(-80, -110, 60, 40, '#5b5f6e', 3), win(-76, -106, 52, 32, r, t, .95, { col: FLUORO }), R(10, -116, 34, 92, '#7d8496', 3),
        P('M10-24h-30l-6 24h36z', '#9aa1ae'), L('M-20-24v-14h30', '#9aa1ae', 3), R(60, -118, 40, 30, '#c8ccd6', 3),
        A('rotor', C(80, -103, 11, '#7d8496'), .4, 0), C(80, -103, 3, '#3d3b4c'),
        OPS.kit.T(-50, -36, v === 'crib' ? 'CRIB ROOM' : 'SITE OFFICE', 10, dk(c.accent, .3), { 'letter-spacing': 2 })
      ]);
    } };

  P_.units = { w: 420, ground: true, variants: ['units', 'house'],
    draw(v, c, r, t) {
      const brick = '#c98e6c', roof = '#b5583c', n = v === 'house' ? 1 : 3, W = 140;
      const parts = [];
      for (let i = 0; i < n; i++) {
        const x = -n * W / 2 + i * W;
        parts.push(R(x + 4, -110, W - 8, 110, i % 2 ? dk(brick, .05) : brick), P(`M${x - 6} -106L${x + W / 2} -168 ${x + W + 6} -106z`, roof), P(`M${x + W / 2} -168L${x + W + 6} -106h-20L${x + W / 2} -152z`, dk(roof, .2)));
        parts.push(R(x + 18, -70, 28, 70, '#e8ddcf', 2), win(x + 64, -84, 52, 38, r, t, .6, { curtain: true, col: r() < .35 ? TV : WARM, tv: r() < .4 }));
        parts.push(R(x + 60, -44, 60, 6, '#e8ddcf'), T(x + 32, -78, `${i + 1}`, 10, '#6d4a3a'));
        for (let k = 0; k < 4; k++) parts.push(C(x + 70 + k * 12, -36, 4, r.pick(['#ff7aa2', '#ffd45a', '#c06ad6'])));
      }
      return pack(parts);
    } };
})();

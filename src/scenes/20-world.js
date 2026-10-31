// Backdrops (far layers) and grounds. Each backdrop returns [{ svg, depth, emit? }]; depth 1 = most haze.
(() => {
  const { R, C, E, P, L, G, A, dk, lt, lit } = OPS.kit, B = OPS.backs;
  const W = 1600;
  const ridge = (y, amp, n, r, f) => {
    let d = `M0 900V${y}`;
    const step = W / n;
    for (let i = 0; i <= n; i++) d += `Q${i * step - step / 2} ${y - r.range(amp * .4, amp)} ${i * step} ${y - r.range(0, amp * .3)}`;
    return P(d + 'V900Z', f);
  };

  B.hills = (c, r) => [
    { depth: 1, svg: ridge(560, 90, 4, r, '#8bb0a0') },
    { depth: .6, svg: ridge(600, 60, 6, r, '#76a46a') + [...Array(9)].map(() => { const x = r.range(0, W), y = r.range(560, 590); return E(x, y, 22, 14, '#5d8f58') + R(x - 2, y, 4, 14, '#7a6a5a'); }).join('') }
  ];

  B.range = (c, r) => [
    { depth: 1, svg: P('M0 900V520L180 470 300 500 520 420 700 480 900 440 1100 500 1320 430 1600 500V900Z', '#c98a72') + P('M520 420L600 470 700 480 560 446Z', dk('#c98a72', .15)) },
    { depth: .6, svg: ridge(600, 40, 5, r, '#c77a52') }
  ];

  B.city = (c, r, t) => {
    let far = '', mid = '', emit = '';
    for (let x = -20; x < W; x += r.range(60, 120)) { const h = r.range(120, 300), w = r.range(50, 100); far += R(x, 620 - h, w, h, '#90a6c8'); }
    for (let x = -40; x < W; x += r.range(90, 160)) {
      const h = r.range(80, 220), w = r.range(70, 130);
      mid += R(x, 620 - h, w, h, '#7891b8') + R(x + w * .6, 620 - h, w * .4, h, dk('#7891b8', .1));
      for (let yy = 620 - h + 14; yy < 600; yy += 20) for (let xx = x + 8; xx < x + w - 10; xx += 16) { const col = r() < .3 ? '#e6fbff' : '#ffe29a'; if (lit(r, t, .35)) emit += R(xx, yy, 8, 10, col); }
    }
    return [{ depth: 1, svg: far }, { depth: .65, svg: mid, emit }];
  };

  B.suburb = (c, r, t) => {
    let s = '', emit = '';
    for (let x = -30; x < W; x += r.range(110, 170)) {
      const w = r.range(80, 120), y = 610, roof = r.pick(['#b5583c', '#8a6a8a', '#7a8aa0', '#a8583c']);
      s += R(x, y - 50, w, 50, r.pick(['#e8d8c0', '#d8c4a8', '#c9b49a'])) + P(`M${x - 8} ${y - 46}L${x + w / 2} ${y - 86}L${x + w + 8} ${y - 46}Z`, roof);
      if (lit(r, t, .5)) emit += R(x + w * .55, y - 36, 18, 14, '#ffe29a');
      if (r() < .4) s += E(x + w + 10, y - 30, 26, 30, '#6d9a5a');
    }
    return [{ depth: 1, svg: ridge(560, 50, 3, r, '#a8c0b8') }, { depth: .55, svg: s, emit }];
  };

  B.sea = (c, r) => {
    let s = R(0, 560, W, 220, '#3f8fc0') + R(0, 560, W, 14, lt('#3f8fc0', .25));
    let waves = '';
    for (let i = 0; i < 18; i++) waves += A('shimmer', L(`M${r.range(0, W)} ${r.range(590, 740)}q14-8 28 0`, lt('#3f8fc0', .35), 3), 3, r() * 3);
    return [
      { depth: 1, svg: P('M1100 562Q1250 480 1420 520T1600 540V562Z', '#7a9a80') },
      { depth: .4, svg: s + waves }
    ];
  };

  B.pit = (c, r) => {
    const tiers = ['#d08a5c', '#c27a4e', '#b06a42', '#9a5a38'];
    let s = '';
    tiers.forEach((f, i) => { const y = 600 + i * 22, inset = 140 + i * 90; s += P(`M${inset} ${y}H${W - inset - 200}l-30 22H${inset + 30}Z`, f) + R(inset + 30, y + 20, W - 2 * inset - 260, 3, lt(f, .2)); });
    return [{ depth: 1, svg: P('M0 900V530L260 490 460 520 760 470 1040 510 1300 460 1600 520V900Z', '#c98a72') }, { depth: .3, svg: R(0, 590, W, 310, '#c9845a') + s }];
  };

  OPS.grounds = {
    grass: (y, f, r) => { let s = R(0, y, W, 900 - y, f) + R(0, y, W, 6, lt(f, .12)); for (let i = 0; i < 40; i++) { const x = r.range(0, W), yy = r.range(y + 20, 890); s += P(`M${x} ${yy}l4-12 3 12 4-9 2 9z`, dk(f, .14)); } return s; },
    dirt: (y, f, r) => { let s = R(0, y, W, 900 - y, f); s += L(`M-40 ${y + 140}Q600 ${y + 90} 1640 ${y + 180}`, dk(f, .1), 26) + L(`M-40 ${y + 180}Q600 ${y + 130} 1640 ${y + 220}`, dk(f, .1), 26); for (let i = 0; i < 30; i++) s += E(r.range(0, W), r.range(y + 10, 890), r.range(3, 8), 3, dk(f, .18)); return s; },
    carpark: (y, f, r) => { let s = R(0, y, W, 900 - y, f) + R(0, y, W, 16, '#b7bcc6'); for (let x = 60; x < W; x += 150) s += P(`M${x} ${y + 120}l-30 160h8l30-160z`, '#f4f0e6', { opacity: .75 }); s += R(0, y + 100, W, 6, '#f2c531', { opacity: .8 }); return s; },
    wharf: (y, f) => { let s = R(0, y, W, 900 - y, f); for (let yy = y + 18; yy < 900; yy += 22) s += L(`M0 ${yy}H${W}`, dk(f, .14), 2); for (let x = 40; x < W; x += 180) s += R(x, y - 14, 18, 20, dk(f, .25), 4); return s; }
  };
})();

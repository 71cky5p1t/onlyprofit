// Vehicles face right. Wheels spin only under a 'drive' placement (CSS handles that).
(() => {
  const { R, C, E, P, L, G, A, T, eye, dk, lt } = OPS.kit, P_ = OPS.props;
  const wheel = (x, y, rr) => A('wheel', C(x, y, rr, '#26243a') + C(x, y, rr * .5, '#b8bfcc') + R(x - 1.5, y - rr * .45, 3, rr * .9, '#7d8496'), 1, 0);
  const lamp = (x, y, t, col = '#fff2b0') => ({ emit: E(x, y, 5, 4, col), glow: [x + 20, y, 40, col] });

  P_.van = { w: 200, ground: true, variants: ['party', 'hearse', 'ute', 'ambulance', 'reefer'],
    draw(v, c, r, t) {
      const glows = [];
      let body = '', emit = '';
      if (v === 'hearse') {
        const k = '#23222e';
        body = P('M-110-22v-34q0-10 10-12l118-4q22 0 40 22l34 6q20 4 20 22z', k) + P('M-102-56l112-4q16 0 30 16h-142z', '#4a4860') +
          R(-96, -56, 40, 12, '#e8dfe9', 2) + R(-48, -56, 40, 12, '#e8dfe9', 2) + P('M-96-50q20 6 40 0M-48-50q20 6 40 0', '#c9b9cc') +
          R(-110, -26, 222, 4, '#c3c8d4') + T(-20, -28, 'ETERNAL', 8, '#c3c8d4', { 'letter-spacing': 3 }) + wheel(-72, -16, 16) + wheel(72, -16, 16);
      } else if (v === 'ute') {
        const k = '#f2f2ee';
        body = P('M-96-20v-30h80v-26q0-6 8-6h34q12 0 20 14l12 14 34 4q8 2 8 12v18z', k) + P('M-10-78h28q8 0 14 12l6 12h-48z', '#7fb7e0') +
          R(-96, -50, 80, 6, dk(k, .12)) + R(-90, -64, 20, 14, '#a07850', 2) + R(-66, -60, 26, 10, '#5b8fc0', 2) + wheel(-62, -14, 15) + wheel(62, -14, 15);
      } else if (v === 'reefer') {
        const k = c.accent;
        body = R(-120, -112, 160, 92, '#f4f2ee', 6) + R(-120, -112, 160, 16, dk('#f4f2ee', .1), 6) + P('M44-20v-62q0-8 8-8h34q14 0 22 16l14 22q4 8 4 18v14z', k) +
          P('M56-82h24q10 0 16 12l8 14h-48z', '#8cc6ec') + T(-40, -60, c.short || 'CO.', OPS.kit.fit(c.short || 'CO.', 140, 22), k) + T(-40, -40, 'FRESH DAILY*', 11, dk(k, .2), { 'letter-spacing': 2 }) +
          R(-106, -128, 30, 16, '#c8ccd6', 3) + wheel(-90, -16, 16) + wheel(-50, -16, 16) + wheel(90, -16, 16);
      } else {
        const k = v === 'ambulance' ? '#f6f4ef' : c.accent;
        body = P('M-100-20v-74q0-12 12-12h120q16 0 26 14l26 34 22 6q8 2 8 14v18z', k) + P('M42-98q10 0 18 12l18 24h-36z', '#8cc6ec') +
          R(-88, -84, 50, 30, '#8cc6ec', 6) + R(-100, -32, 214, 6, dk(k, .15));
        if (v === 'party') body += C(-6, -74, 12, '#ffd84d') + C(14, -80, 10, '#5fc3f0') + L('M-6-62q2 6 4 12M14-70q-2 8 0 14', '#ffffff', 1.5) +
          T(-30, -40, c.short || 'PARTY', OPS.kit.fit(c.short || 'PARTY', 110, 13), '#ffffff');
        else body += R(-20, -78, 10, 30, '#e2463c') + R(-30, -68, 30, 10, '#e2463c') + R(-100, -48, 214, 8, '#e2463c') + R(16, -112, 20, 8, '#e2463c', 3);
        body += wheel(-60, -16, 16) + wheel(66, -16, 16);
        if (v === 'ambulance') {
          emit += A('flash', R(16, -112, 20, 8, '#ff5a4a', 3), .8, 0);
          glows.push([26, -116, 70, '#ff4a3a']);
        }
      }
      const hx = v === 'hearse' ? 148 : v === 'ute' ? 100 : 124, hy = v === 'reefer' ? -40 : -40;
      body += E(hx - 4, hy, 5, 4, '#fff9e0');
      const L1 = lamp(hx - 4, hy, t);
      emit += L1.emit; glows.push(L1.glow);
      return { body, emit, glows };
    } };

  P_.dumptruck = { w: 320, ground: true, variants: ['loaded', 'empty'],
    draw(v, c, r) {
      const y = '#f2b631';
      let s = '';
      if (v === 'loaded') s += P('M-150-150q30-50 80-40q30-30 70-4q40-10 60 44z', '#b56b48') + C(-60, -170, 14, '#c47c58') + C(10, -184, 10, '#9c5a3c');
      s += P('M-170-150h220l-16 70h-200z', y) + P('M-170-150h220v14h-220z', dk(y, .12)) + K_ribs(-150, -136, 180, 56, 6) +
        R(46, -168, 96, 88, '#f6c94a', 8) + R(66, -158, 46, 34, '#8cc6ec', 4) + R(46, -96, 110, 16, dk(y, .25), 4) + R(-140, -80, 290, 22, '#3d3b4c', 6) +
        L('M136-150h20v-30', '#3d3b4c', 4) + C(156, -186, 6, '#ff9d3a');
      [-110, -40, 100].forEach(x => { s += A('wheel', C(x, -44, 44, '#26243a') + C(x, -44, 22, '#9aa1ae') + R(x - 3, -64, 6, 40, '#6d7385'), 1.8, 0); });
      return { body: s, emit: C(156, -186, 6, '#ffb24a'), glows: [[156, -186, 46, '#ff9d3a']] };
    } };
  const K_ribs = (x, y, w, h, n) => OPS.kit.ribs(x, y, w, h, n, '#d99a1c', 4);

  P_.excavator = { w: 240, ground: true, variants: ['dig', 'idle'],
    draw(v, c, r) {
      const y = '#f2b631';
      const tracks = R(-110, -40, 200, 40, '#3d3b4c', 20) + [-86, -50, -14, 22, 58].map(x => C(x, -20, 12, '#5d5b70')).join('');
      const arm = P('M60-110l90-70 14 14-84 72z', dk(y, .05)) + P('M150-180l40 90-16 6-38-86z', y) + P('M168-96q28 0 30 26l-34 6z', '#5d5b70') + C(150, -176, 7, '#3d3b4c');
      const cab = R(-90, -110, 160, 66, y, 10) + R(-90, -64, 160, 18, dk(y, .18)) + R(10, -150, 60, 48, y, 8) + R(20, -142, 40, 30, '#8cc6ec', 4) + R(-90, -120, 40, 16, '#3d3b4c', 4) + T(-30, -76, c.short || 'DIG', OPS.kit.fit(c.short || 'DIG', 110, 16), '#3d3b4c');
      return tracks + cab + (v === 'dig' ? A('dig', arm, 5, r() * 5) : arm);
    } };

  P_.scooter = { w: 90, ground: true, variants: ['red', 'blue'],
    draw(v, c, r) {
      const f = v === 'blue' ? '#4f86d6' : '#e2463c';
      const b = OPS.kit.bean('retiree', c, r, { seated: true });
      return G(b.s, { transform: 'translate(-10 -26)' }) + P('M-40-14q0-26 26-26h40l16-40h6l-10 50q20 0 22 16z', f) + L('M44-80l6-60', '#9aa4b0', 2) +
        A('wave', P('M50-140l26 8-26 8z', '#ff8a3a'), 1.6, 0) + R(-46, -34, 22, 16, '#7d8496', 3) + wheel(-26, -10, 10) + wheel(44, -10, 10);
    } };

  P_.boat = { w: 280, variants: ['trawler', 'tinnie'],
    draw(v, c, r) {
      if (v === 'tinnie') return A('bob', P('M-60-30h120l-14 30h-92z', '#b9c2cc') + R(-60, -34, 120, 6, '#8e98a6') + R(40, -50, 14, 20, '#3d3b4c', 3) +
        G(OPS.kit.bean('dad', c, r, { seated: true }).s, { transform: 'translate(-10 -12) scale(.8)' }), 4, r() * 4);
      const k = '#e9e4da';
      return A('bob', P('M-140-60h290l-30 60h-230z', '#2f4f7a') + R(-140, -66, 290, 8, '#e2463c') + R(-40, -130, 100, 64, k, 6) + R(-28, -118, 30, 22, '#8cc6ec', 3) +
        R(12, -118, 30, 22, '#8cc6ec', 3) + L('M-100-66v-110M-100-170l120 40', '#7d8496', 4) + P('M-100-176l-30 110h20z', '#8b9a7a', { opacity: .7 }) +
        T(30, -24, c.short || 'CO.', OPS.kit.fit(c.short || 'CO.', 160, 16), '#f4f2ee'), 5, r() * 5);
    } };

  P_.helicopter = { w: 200, ground: true, variants: ['parked', 'hover'],
    draw(v, c, r) {
      const k = c.accent;
      const body = P('M-60-30q-10-50 50-56h40q40 4 50 40l-10 16z', k) + P('M-50-50q0-26 30-28h20v28z', '#8cc6ec') + P('M80-50h90l6-12h-96z', dk(k, .2)) +
        A('rotor', R(158, -78, 8, 36, '#3d3b4c', 3), .25, 0) + L('M-40-10h100M-30-10v-20M40-10v-20', '#5d5b70', 4) + R(10, -96, 8, 12, '#3d3b4c');
      const rotor = A('rotor', R(-110, -100, 240, 6, '#3d3b4c', 3), v === 'hover' ? .2 : 2.4, 0);
      return v === 'hover' ? A('bob', body + rotor, 3, 0) : body + rotor;
    } };
})();

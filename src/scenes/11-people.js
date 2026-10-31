// People: little bean staff. Gags land on adults; no kids drawn anywhere.
(() => {
  const { R, C, E, P, L, G, A, T, eye, dk, lt } = OPS.kit, P_ = OPS.props;
  const SKIN = ['#f3c9a4', '#e0a77e', '#b97a52', '#84553a', '#f6d8bf'];
  const HAIR = ['#2b2230', '#5a3a2a', '#b9874c', '#d8d2c8', '#7a2f22'];
  const OUTFIT = {
    suit: { top: '#36405e', leg: '#2b3350' },
    hivis: { top: '#ffb21c', leg: '#3c4b6a' },
    mourner: { top: '#2a2836', leg: '#22212c' },
    dad: { top: '#eef0f2', leg: '#2f5f8c' },
    nurse: { top: '#58b4a8', leg: '#58b4a8' },
    chef: { top: '#f4f2ee', leg: '#3a3a44' },
    dentist: { top: '#a8d4ee', leg: '#a8d4ee' },
    retiree: { top: '#c98a8a', leg: '#8a8070' }
  };

  // body() is shared with the camp chair and scooter
  const body = (v, c, r, o = {}) => {
    const k = OUTFIT[v], skin = r.pick(SKIN), hair = v === 'retiree' ? r.pick(['#e9e6e0', '#cfcac2']) : r.pick(HAIR), d = r() * 5;
    let s = '';
    if (!o.seated) s += R(-11, -30, 9, 30, k.leg, 4) + R(2, -30, 9, 30, k.leg, 4) + E(-7, -1, 8, 3.5, '#2a2836') + E(7, -1, 8, 3.5, '#2a2836');
    const torso = P('M-17-28C-18-52-14-66 0-66C14-66 18-52 17-28Z', k.top) + P('M6-66C14-64 18-52 17-28H8C10-44 10-58 6-66Z', dk(k.top, .14));
    let extra = '';
    if (v === 'suit') extra = P('M-2-64l2 22 2-22z', o.accent || '#d9261c') + P('M-6-66l6 8 6-8z', '#f4f2ee');
    if (v === 'hivis') extra = R(-17, -46, 34, 4, '#e8eef2') + R(-17, -38, 34, 4, '#e8eef2');
    if (v === 'mourner') extra = P('M-2-64l2 8 2-8z', '#f4f2ee');
    if (v === 'dad') extra = P('M-9-66q9 10 18 0', 'none', { stroke: k.top, 'stroke-width': 0 }) + E(0, -36, 13, 9, '#f6d8bf', { opacity: .5 });
    if (v === 'chef') extra = R(-15, -54, 30, 26, '#ffffff', 6);
    if (v === 'nurse') extra = R(4, -56, 6, 8, '#ffffff', 2) + R(6, -54, 2, 4, '#e2463c');
    if (v === 'retiree') extra = L('M-12-64v34M12-64v34', dk(k.top, .2), 2);
    const arms = L('M-15-58q-8 12-6 24', k.top, 8) + C(-21, -33, 5, skin) + L('M15-58q8 12 6 24', dk(k.top, .1), 8) + C(21, -33, 5, skin);
    let hold = '';
    if (v === 'dad') hold = R(17, -46, 9, 14, '#c8cfd8', 2) + R(17, -42, 9, 5, '#2e7a3c');
    if (v === 'suit' && r() < .5) hold = R(16, -40, 12, 18, '#2a2836', 2) + R(18, -38, 8, 12, '#7fc6ff', 1);
    if (v === 'hivis') hold = R(16, -46, 14, 18, '#c49a62', 2) + R(18, -42, 10, 2, '#fff') + R(18, -38, 10, 2, '#fff');
    if (v === 'dentist') hold = L('M22-36l6-14', '#b7c2cc', 2.5) + C(28, -52, 3, '#dfe8ef');
    // head
    let head = C(0, -80, 14, skin) + E(5, -76, 7, 9, dk(skin, .08), { opacity: .5 });
    if (v === 'chef') head += R(-13, -100, 26, 12, '#ffffff', 6) + E(0, -98, 15, 6, '#ffffff');
    else if (v === 'hivis') head += P('M-15-84a15 15 0 0 1 30 0z', '#fff3e0') + R(-17, -86, 34, 4, '#fff3e0', 2);
    else if (v === 'retiree') head += C(-10, -90, 6, hair) + C(0, -94, 7, hair) + C(10, -90, 6, hair);
    else if (v === 'dad') head += P('M-14-84a14 12 0 0 1 28 0q-6-6-14-6t-14 6z', hair) + R(-12, -82, 24, 4, '#2b2230', 2);
    else head += P('M-14-82a14 14 0 0 1 28 0q-8-5-16-2t-12 2z', hair);
    if (v === 'dentist') head += R(-10, -78, 20, 10, '#cfe8f6', 3);
    head += eye(-5, -80, 2.2, d) + eye(5, -80, 2.2, d);
    if (v === 'dad' && o.asleep) head = C(0, -80, 14, skin) + P('M-14-84a14 12 0 0 1 28 0q-6-6-14-6t-14 6z', hair) + L('M-8-80h5M3-80h5', '#1c1a2c', 2);
    if (v === 'mourner') head += L('M-3-72q3 2 6 0', '#1c1a2c', 1.5);
    return { s: s + A('breathe', torso + extra + arms + hold, 3.6, d) + A('nod', head, 6, d), skin, k };
  };
  OPS.kit.bean = body;

  P_.person = { w: 40, ground: true, variants: Object.keys(OUTFIT),
    draw(v, c, r) { return body(v, c, r, { accent: c.accent }).s; } };

  P_.campchair = { w: 70, ground: true, variants: ['dad', 'empty'],
    draw(v, c, r) {
      const f = c.accent2 || '#3a7bd5';
      let s = L('M-26 0l40-44M26 0l-40-44', '#9aa4b0', 3.5) + P('M-28-44h48l6-34h-48z', dk(f, .15)) + P('M-26-44h50v-10h-50z', f);
      if (v === 'dad') {
        const b = body('dad', c, r, { asleep: true, seated: true });
        s += G(b.s, { transform: 'translate(0 -18) rotate(-12)' }) + L('M-8-44q14-4 30 6', '#2f5f8c', 9) + E(26, -34, 5, 3, '#2a2836') +
          R(30, -16, 9, 14, '#c8cfd8', 2) + A('zzz', OPS.kit.T(10, -120, 'z', 18, '#ffffff', { opacity: .9 }), 3, 0) + A('zzz', OPS.kit.T(22, -134, 'z', 13, '#ffffff'), 3, 1.4);
      }
      return s;
    } };
})();

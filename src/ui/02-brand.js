  // logo marks, one per opener noun (48×48; .s = stroke)
  const MARKS = {
    op: '<path class="s" d="M5 39 17 26l8 8L39 16" style="stroke-width:5"/><path d="M30 11h14v14z"/>',
    baby: '<circle class="s" cx="24" cy="10" r="6"/><rect x="7" y="18" width="34" height="9" rx="4.5"/><circle cx="24" cy="35" r="9"/>',
    granny: '<circle class="s" cx="13" cy="27" r="8"/><circle class="s" cx="35" cy="27" r="8"/><path class="s" d="M21 26c2-3 4-3 6 0M5 25 2 18M43 25l3-7"/>',
    orphan: '<circle cx="18" cy="14" r="5.5"/><path d="M9 44V32a9 9 0 0 1 18 0v12z"/><path class="s" d="M26 30 41 11" style="stroke-width:3"/><circle cx="40" cy="9" r="5.5"/>',
    widow: '<path fill-rule="evenodd" d="M24 3c7 0 10 6 10 12v14H14V15c0-6 3-12 10-12zM20 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0z"/><path d="M8 45v-9a10 10 0 0 1 10-10h12a10 10 0 0 1 10 10v9z"/>',
    intern: '<circle cx="24" cy="10" r="6"/><path fill-rule="evenodd" d="M10 45V30a10 10 0 0 1 10-10h8a10 10 0 0 1 10 10v15zM20 30h8v8h-8z"/>',
    clown: '<circle cx="9" cy="22" r="6"/><circle cx="39" cy="22" r="6"/><path fill-rule="evenodd" d="M11 25a13 13 0 1 0 26 0a13 13 0 1 0-26 0zM21 26a3 3 0 1 0 6 0a3 3 0 1 0-6 0z"/><path d="M18 13 24 1l6 12z"/>',
    stepdad: '<circle cx="15" cy="10" r="5.5"/><path d="M6 38V26a9 9 0 0 1 18 0v12z"/><path d="M26 45v-8h7v-8h7v-8h6v24z"/>',
    uncle: '<path fill-rule="evenodd" d="M10 19a14 14 0 1 0 28 0a14 14 0 1 0-28 0zM15 24c3-3 6-3 9 0 3-3 6-3 9 0-3 3-6 2-9 0-3 2-6 3-9 0z"/><path d="M8 46c0-7 6-11 16-11s16 4 16 11z"/>',
    ghost: '<path fill-rule="evenodd" d="M8 22a16 16 0 0 1 32 0v22l-5-4-5 4-6-4-6 4-5-4-5 4zM16 20a2.5 3.5 0 1 0 5 0a2.5 3.5 0 1 0-5 0zM27 20a2.5 3.5 0 1 0 5 0a2.5 3.5 0 1 0-5 0z"/>',
    semen: '<ellipse cx="12" cy="13" rx="8" ry="6" transform="rotate(35 12 13)"/><path class="s" d="M17 18c7 6 1 12 9 15s6 9 15 10" style="stroke-width:3.5"/>',
    foreskin: '<circle class="s" cx="12" cy="37" r="6" style="stroke-width:3.5"/><circle class="s" cx="36" cy="37" r="6" style="stroke-width:3.5"/><path d="M15 32 33 3l3 2-18 29zM33 32 15 3l-3 2 18 29z"/>',
    placenta: '<path d="M7 21C7 11 15 5 24 5s17 6 17 16-8 14-17 14S7 31 7 21z"/><path class="s" d="M24 34c0 6-9 3-9 9s9 2 9 4" style="stroke-width:3"/>',
    nipple: '<path fill-rule="evenodd" d="M4 24a20 20 0 1 0 40 0a20 20 0 1 0-40 0zM13 24a11 11 0 1 0 22 0a11 11 0 1 0-22 0z"/><circle cx="24" cy="24" r="5.5"/>',
    pubes: '<path class="s" d="M10 42c-6-6 6-10 0-17s6-10 0-17M24 44c-6-6 6-10 0-17s6-10 0-17M38 42c-6-6 6-10 0-17s6-10 0-17" style="stroke-width:3.5"/>',
    earwax: '<rect x="8" y="22" width="32" height="4" rx="2" transform="rotate(-35 24 24)"/><ellipse cx="9" cy="35" rx="7" ry="4.5" transform="rotate(-35 9 35)"/><ellipse cx="39" cy="13" rx="7" ry="4.5" transform="rotate(-35 39 13)"/>',
    toenail: '<path fill-rule="evenodd" d="M14 45V18a10 10 0 0 1 20 0v27zM18 16a6 6 0 0 1 12 0v5H18z"/>',
    kidney: '<path d="M27 5c9 0 15 8 15 19s-6 19-15 19c-8 0-11-4-11-8 0-5 5-6 5-11s-5-6-5-11c0-4 3-8 11-8z"/><path d="M14 20c-4 1-8 4-8 9" class="s" style="stroke-width:3"/>',
    tooth: '<path d="M9 13c0-6 7-8 15-4 8-4 15-2 15 4 0 9-3 12-4 20-1 7-2 11-5 11s-3-10-6-10-3 10-6 10-4-4-5-11C12 25 9 22 9 13z"/>',
    blood: '<path fill-rule="evenodd" d="M12 9a5 5 0 0 1 5-5h14a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5zM22 11h4v6h6v4h-6v6h-4v-6h-6v-4h6z"/><path class="s" d="M24 34v11"/>',
    eyeball: '<path fill-rule="evenodd" d="M3 20a17 17 0 1 0 34 0a17 17 0 1 0-34 0zM14 17a7 7 0 1 0 14 0a7 7 0 1 0-14 0z"/><circle cx="21" cy="17" r="3"/><path class="s" d="M32 33c4 4 2 8 7 9s4 4 6 4" style="stroke-width:3.5"/>',
    nudes: '<path fill-rule="evenodd" d="M14 3h20a3 3 0 0 1 3 3v36a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM15 8v30h18V8z"/><rect x="15" y="19" width="18" height="7"/>',
    dildo: '<path d="M17 40V14a7 7 0 0 1 14 0v26z"/><rect x="11" y="39" width="26" height="6" rx="3"/>',
    hamster: '<circle cx="13" cy="15" r="5.5"/><circle cx="35" cy="15" r="5.5"/><circle cx="24" cy="29" r="15"/>',
    pony: '<path d="M13 45V30c0-8 2-14 6-19l2-8 4 6c6 1 12 5 16 12l-3 5-8-3-3 4v18z"/>',
    goldfish: '<ellipse cx="20" cy="24" rx="15" ry="10"/><path d="M31 24 45 13v22z"/>',
    pigeon: '<circle cx="14" cy="14" r="7"/><path d="M7 12 1 16l6 1z"/><path d="M10 20c4 10 14 16 30 14l6-4-10-2c-6-6-14-10-26-8z"/><path class="s" d="M22 36v8M28 36v8" style="stroke-width:2.5"/>',
    rat: '<path d="M4 33c0-9 9-15 20-15s15 6 17 15z"/><circle cx="13" cy="19" r="4.5"/><path class="s" d="M40 32c6 0 8 4 4 8s-9 3-11 6" style="stroke-width:2.5"/>',
    dog: '<rect x="12" y="20" width="24" height="8"/><circle cx="11" cy="18" r="6"/><circle cx="11" cy="30" r="6"/><circle cx="37" cy="18" r="6"/><circle cx="37" cy="30" r="6"/>',
    feelings: '<path d="M24 43 7 26a10 10 0 0 1 17-14 10 10 0 0 1 17 14z"/>',
    regret: '<path class="s" d="M12 14a16 16 0 1 1-4 14"/><path d="M4 5v15h15z"/>',
    grief: '<path d="M5 23h38v20H5z"/><path d="M18 23c0-8 4-14 8-17 2 4 4 9 4 17z"/>',
    soul: '<ellipse class="s" cx="24" cy="7" rx="11" ry="3.5" style="stroke-width:3"/><path d="M24 15c9 0 13 7 13 14 0 8-6 12-11 14 2-4 1-7-2-8-6 2-12-2-12-8 0-7 4-12 12-12z"/>',
    secret: '<path fill-rule="evenodd" d="M4 24a20 20 0 1 0 40 0a20 20 0 1 0-40 0zM24 13a5 5 0 0 0-3 9l-2 12h10l-2-12a5 5 0 0 0-3-9z"/>',
    ashes: '<path d="M4 43c4-10 10-16 20-16s16 6 20 16z"/><circle cx="17" cy="17" r="2.2"/><circle cx="27" cy="10" r="2.2"/><circle cx="33" cy="19" r="1.8"/>',
    toilet: '<rect x="8" y="5" width="12" height="20" rx="2"/><path d="M8 25h34c0 8-5 12-11 13l2 7H17l1-7C12 37 8 32 8 25z"/>',
    mattress: '<path fill-rule="evenodd" d="M6 15h36a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V19a4 4 0 0 1 4-4zM8 23v2.5h32V23z"/><rect x="5" y="33" width="4" height="7"/><rect x="39" y="33" width="4" height="7"/>',
    coffin: '<path d="M17 3h14l7 12-5 30H15L10 15z"/>',
    urn: '<path d="M16 4h16v4h-3c0 4 9 8 9 18 0 10-6 15-14 15S10 36 10 26c0-10 9-14 9-18h-3z"/><rect x="14" y="41" width="20" height="4" rx="1"/>',
    wig: '<path fill-rule="evenodd" d="M24 4c11 0 18 8 18 20 0 8-2 16-6 20H12C8 40 6 32 6 24 6 12 13 4 24 4zM16 22c0-4 4-6 8-6s8 2 8 6v14H16z"/>',
    nappy: '<path d="M4 10h40c0 18-8 30-20 30S4 28 4 10z"/><circle class="s" cx="9" cy="15" r="2" style="stroke-width:2"/><circle class="s" cx="39" cy="15" r="2" style="stroke-width:2"/>'
  };
  const BRANDS = [
    { id: 'op', mark: 'op', name: 'Only Profit', suffix: 'Inc.', mono: 'OP', color: '#D9261C', hi: '#EF4A37', lo: '#8E160F', ink: '#fff', font: 'house' },
    { id: 'granny', mark: 'granny', name: 'Family Granny Dating', suffix: 'Pty Ltd', mono: 'FG', color: '#9B7BB8', hi: '#BBA0D4', lo: '#5E4478', ink: '#fff', font: 'round' },
    { id: 'clown', mark: 'clown', name: 'Ultra Clown Childcare', suffix: '& Co.', mono: 'UC', color: '#E8B81E', hi: '#F7D560', lo: '#9A7406', ink: '#1a1a1a', font: 'heavy' },
    { id: 'widow', mark: 'widow', name: 'Eternal Widow', suffix: 'Holdings', mono: 'EW', color: '#4A3E60', hi: '#6E5F8A', lo: '#211A2D', ink: '#fff', font: 'serif' },
    { id: 'kidney', mark: 'kidney', name: 'Executive Kidney Destruction', suffix: 'Group', mono: 'EK', color: '#2F5D8A', hi: '#4F7FB0', lo: '#18344F', ink: '#fff', font: 'wide' },
    { id: 'stepdad', mark: 'stepdad', name: 'Compassionate Stepdad Childcare', suffix: 'Ltd', mono: 'CS', color: '#C2793A', hi: '#DC9C63', lo: '#7A4519', ink: '#fff', font: 'script' }];
  const brand = () => BRANDS.find(b => b.id === setup.brand) || BRANDS[0];
  const markSVG = id => `<svg class="mk" viewBox="0 0 48 48" aria-hidden="true">${MARKS[id] || MARKS.op}</svg>`;
  const brandMark = () => markSVG(brand().mark);
  // mark as a CSS image
  const markURL = (id, c = '#000') => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='${c}'><style>.s{fill:none;stroke:${c};stroke-width:4;stroke-linecap:round;stroke-linejoin:round}</style>${(MARKS[id] || MARKS.op).replace(/"/g, "'")}</svg>`)}")`;
  function applyBrand() {
    const b = brand(), r = document.documentElement;
    r.style.setProperty('--brand', b.color); r.style.setProperty('--brand-hi', b.hi); r.style.setProperty('--brand-lo', b.lo); r.style.setProperty('--brand-ink', b.ink);
    r.style.setProperty('--mono', `"${b.mono}"`); r.style.setProperty('--mark', markURL(b.mark, b.ink)); r.dataset.brandFont = b.font; r.dataset.cards = setup.cards;
  }

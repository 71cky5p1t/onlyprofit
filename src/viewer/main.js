const PROTO = JSON.parse(document.getElementById('proto').textContent);
  const SEED = 5, PLAYERS = 6;
  // The TV shows the shared board; the phone shows only your own desk.
  const TV_CSS = '.desk{display:none!important}.layout{grid-template-columns:minmax(0,1fr)!important}';
  const PHONE_CSS = '.board,.mast{display:none!important}.layout{padding-block:10px 30px!important}.wrap{padding-inline:8px!important}.desk{position:static!important;max-height:none!important;max-width:none!important}';
  const SPREADS = [
    { id: 'lobby', q: 'Q0', name: 'Lobby', go: { ph: 'setup' }, only: 'tv' },
    { id: 'clockin', q: 'Q0', name: 'Clocking in', go: { ph: 'naming' }, only: 'phone' },
    { id: 'induction', q: 'Q0', name: 'Induction', go: { ph: 'induction' }, only: 'tv' },
    { id: 'onboarding', q: 'Q0', name: 'Role memo', go: { ph: 'brief' } },
    { id: 'work', q: 'Q1', name: 'Work', go: { ph: 'work', r: 1 } },
    { id: 'templates', q: 'Q1', name: 'Cover page', go: { ph: 'work', r: 1, page: 2 }, only: 'phone' },
    { id: 'tweak', q: 'Q1', name: 'Dress it up', go: { ph: 'work', r: 1, page: 3 }, only: 'phone' },
    { id: 'decide', q: 'Q1', name: 'Decide', go: { ph: 'decide', r: 1 } },
    { id: 'board', q: 'Q2', name: 'Board vote', go: { ph: 'board' } },
    { id: 'reveal', q: 'Q1', name: 'Reveal', go: { ph: 'reveal', r: 1 } },
    { id: 'closed', q: 'Q1', name: 'Quarter closed', go: { ph: 'review', r: 1 } },
    { id: 'deal', q: 'Q2', name: 'Next quarter', go: { ph: 'work', r: 2 }, only: 'phone' },
    { id: 'whistle', q: 'Q5', name: 'Whistleblower', go: { ph: 'whistle' } },
    { id: 'exit', q: 'End', name: 'Annual report', go: { ph: 'end' }, only: 'tv' },
  ];
  const BRANDS = [
    { id: 'op', name: 'Only Profit', mono: 'OP', color: '#D9261C', hi: '#EF4A37', lo: '#8E160F', ink: '#fff', mark: '<path class="s" d="M5 39 17 26l8 8L39 16" style="stroke-width:5"/><path d="M30 11h14v14z"/>' },
    { id: 'granny', name: 'Family Granny Dating', mono: 'FG', color: '#C9577A', hi: '#E07D9C', lo: '#82304B', ink: '#fff', mark: '<circle class="s" cx="13" cy="27" r="8"/><circle class="s" cx="35" cy="27" r="8"/><path class="s" d="M21 26c2-3 4-3 6 0M5 25 2 18M43 25l3-7"/>' },
    { id: 'clown', name: 'Ultra Clown Childcare', mono: 'UC', color: '#E8641E', hi: '#F68A4C', lo: '#9A3C0B', ink: '#fff', mark: '<circle cx="9" cy="22" r="6"/><circle cx="39" cy="22" r="6"/><path fill-rule="evenodd" d="M11 25a13 13 0 1 0 26 0a13 13 0 1 0-26 0zM21 26a3 3 0 1 0 6 0a3 3 0 1 0-6 0z"/><path d="M18 13 24 1l6 12z"/>' },
    { id: 'widow', name: 'Eternal Widow', mono: 'EW', color: '#5E1A2B', hi: '#84324A', lo: '#330B16', ink: '#fff', mark: '<path fill-rule="evenodd" d="M24 3c7 0 10 6 10 12v14H14V15c0-6 3-12 10-12zM20 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0z"/><path d="M8 45v-9a10 10 0 0 1 10-10h12a10 10 0 0 1 10 10v9z"/>' },
    { id: 'kidney', name: 'Executive Kidney Destruction', mono: 'EK', color: '#13807A', hi: '#3AA39C', lo: '#08504C', ink: '#fff', mark: '<path d="M27 5c9 0 15 8 15 19s-6 19-15 19c-8 0-11-4-11-8 0-5 5-6 5-11s-5-6-5-11c0-4 3-8 11-8z"/><path d="M14 20c-4 1-8 4-8 9" class="s" style="stroke-width:3"/>' },
    { id: 'stepdad', name: 'Compassionate Stepdad Childcare', mono: 'CS', color: '#7A5232', hi: '#9C7252', lo: '#4A2F19', ink: '#fff', mark: '<circle cx="15" cy="10" r="5.5"/><path d="M6 38V26a9 9 0 0 1 18 0v12z"/><path d="M26 45v-8h7v-8h7v-8h6v24z"/>' }];
  let brandId = 'granny', cardSet = 'colour';
  try { cardSet = localStorage.getItem('op-viewer-cards') || cardSet; } catch (e) {}
  const $cards = document.getElementById('cardsets');
  const drawCards = () => { $cards.innerHTML = [['paper', 'Paper cards'], ['colour', 'Colour cards']].map(([v, l]) => `<button data-cards="${v}" aria-pressed="${v === cardSet}"><i class="${v}"></i>${l}</button>`).join(''); };
  drawCards();
  $cards.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-cards]'); if (!btn) return;
    cardSet = btn.dataset.cards; drawCards();
    try { localStorage.setItem('op-viewer-cards', cardSet); } catch (e) {}
    document.querySelectorAll('.vp iframe').forEach(f => { try { f.contentWindow.__op.cards(cardSet); } catch (e) {} });
    kitBrand();
  });
  try { brandId = localStorage.getItem('op-viewer-brand') || brandId; } catch (e) {}
  const $brands = document.getElementById('brands');
  const drawBrands = () => { $brands.innerHTML = BRANDS.map(b => `<button data-brand="${b.id}" aria-pressed="${b.id === brandId}" style="--c:${b.color}"><i></i>${b.name}</button>`).join(''); };
  drawBrands();
  // the parts sheet is the game itself, printing its own pieces
  function kitBrand() {
    const f = document.getElementById('kit'), w = f.contentWindow;
    if (!w || !w.__op || !w.__op.look) return;
    w.__op.look(brandId, cardSet); f.contentDocument.getElementById('app').innerHTML = kitHTML(w.__op);
  }
  $brands.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-brand]'); if (!btn) return;
    brandId = btn.dataset.brand; drawBrands();
    try { localStorage.setItem('op-viewer-brand', brandId); } catch (e) {}
    // the deal itself uses the company's words, so frames already printed are dealt again
    document.querySelectorAll('.vp').forEach(vp => { if (vp.querySelector('iframe')) mount(vp); });
    kitBrand();
  });
  const $main = document.getElementById('main'), $jump = document.getElementById('jump');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const device = (kind, s) => kind === 'tv'
    ? `<div class="tv"><div class="screen"><div class="vp" data-kind="tv" data-id="${s.id}"><div class="wait">PRINTING…</div></div></div><div class="stand"></div></div>`
    : `<div class="phone"><div class="screen"><div class="vp" data-kind="phone" data-id="${s.id}"><div class="wait">PRINTING…</div></div></div></div>`;
  $main.innerHTML = SPREADS.map(s => `<section class="spread ${s.only ? 'only-' + s.only : ''}" id="${s.id}">
      <div class="side"><span class="tab"><b>${s.q}</b><span>${s.name}</span></span><button class="replay" data-replay="${s.id}" aria-label="Replay ${s.name}">↻</button></div>
      <div class="stage">${s.only !== 'phone' ? device('tv', s) : ''}${s.only !== 'tv' ? device('phone', s) : ''}</div></section>`).join('')
    + `<section class="spread kit" id="parts"><div class="side"><span class="tab"><b>Kit</b><span>Parts</span></span></div><div><iframe id="kit" title="Parts sheet"></iframe></div></section>`;
  $jump.innerHTML = SPREADS.concat({ id: 'parts', name: 'Parts' }).map(s => `<a href="#${s.id}">${s.name}</a>`).join('');

  // Plays a seeded game inside the frame until it reaches the moment this spread shows.
  async function drive(f, go) {
    const w = f.contentWindow, d = f.contentDocument;
    const click = sel => { const e = d.querySelector(sel); if (e && !e.disabled) { e.click(); return true; } return false; };
    if (go.ph === 'setup') return;
    if (go.ph === 'induction') { w.__op.induction(); return; }
    click(`[data-a=set][data-k=players][data-v="${PLAYERS}"]`);
    w.__opSkipName = go.ph !== 'naming';
    if (go.ph === 'naming') {
      click('[data-a=start]'); await sleep(50);
      const inp = d.getElementById('name-in'); inp.value = 'Joel'; inp.dispatchEvent(new Event('input', { bubbles: true }));
      click('[data-a="name-go"]'); await sleep(400); return;
    }
    const seed = d.getElementById('seed'); seed.value = SEED; seed.dispatchEvent(new Event('input', { bubbles: true }));
    click('[data-a=start]');
    for (let i = 0; i < 500; i++) {
      const S = w.__op && w.__op.S; if (!S) return;
      if (S.phase === go.ph && (go.r == null || S.r === go.r) && !go.page) return;
      if (S.phase === 'brief') click('[data-a=begin]');
      else if (S.phase === 'work') {
        if (click('[data-a=seal]')) { await sleep(20); continue; }
        if (go.page && S.r === go.r) { click('[data-a=finalise]'); await sleep(1500); if (go.page === 3) { click('[data-a=tpl][data-v=wordart]'); await sleep(700); } return; }
        if (click('[data-a=tpl]')) { await sleep(20); continue; }
        click('[data-a=stamp][data-v=Rec]'); click('[data-a=finalise]'); await sleep(1300); }
      else if (!click('.desk [data-a=advance]')) { click('.desk [data-a=sel]'); if (!click('.desk .btn.primary')) w.__op.sign(); }
      await sleep(12);
    }
  }
  function mount(vp) {
    const s = SPREADS.find(x => x.id === vp.dataset.id), tv = vp.dataset.kind === 'tv';
    const old = vp.querySelector('iframe'); if (old) old.remove();
    vp.classList.remove('live');
    const f = document.createElement('iframe');
    f.title = `${s.name}, ${tv ? 'TV' : 'phone'}`;
    const W = tv ? 1360 : 390;
    const fit = () => { const k = vp.clientWidth / W; f.style.width = W + 'px'; f.style.height = (vp.clientHeight / k) + 'px'; f.style.transform = `scale(${k})`; };
    fit(); new ResizeObserver(fit).observe(vp);
    f.addEventListener('load', async () => {
      try { await drive(f, s.go); } catch (e) { console.log('drive', e); }
      vp.classList.add('live');
    }, { once: true });
    f.srcdoc = `<script>window.__opFreeze = true; window.__opBrand = ${JSON.stringify(brandId)}; window.__opCards = ${JSON.stringify(cardSet)}<\/script>` + PROTO + `<style>${tv ? TV_CSS : PHONE_CSS}</style>`;
    vp.appendChild(f);
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } }), { rootMargin: '400px 0px' });
  document.querySelectorAll('.vp').forEach(vp => io.observe(vp));
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-replay]'); if (!b) return;
    document.querySelectorAll(`.vp[data-id="${b.dataset.replay}"]`).forEach(mount);
  });

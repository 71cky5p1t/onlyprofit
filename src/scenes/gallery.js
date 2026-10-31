// Gallery: pick a company, scrub the hour, replay the reveal, browse every prop.
(() => {
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), tv = $('#tv');
  const state = { id: 'funeral', time: 'morning', seed: undefined, cycle: null };
  const ICON = {
    morning: '<circle cx="12" cy="15" r="5" fill="#ffb84a"/><path d="M3 17h18" stroke="#7a6a4a" stroke-width="2" stroke-linecap="round"/>',
    midday: '<circle cx="12" cy="12" r="6" fill="#ffd23a"/>',
    arvo: '<circle cx="12" cy="13" r="6" fill="#ff9d3a"/>',
    dusk: '<circle cx="12" cy="16" r="6" fill="#ff6a4a"/><path d="M3 17h18" stroke="#5a3a6a" stroke-width="2" stroke-linecap="round"/>',
    night: '<path d="M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z" fill="#f4f0d8"/>',
    small: '<path d="M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z" fill="#8a8aa8"/><circle cx="6" cy="6" r="1.4" fill="#8a8aa8"/>'
  };

  const label = () => {
    const L = OPS.locs[state.id], t = OPS.time(state.time);
    $('#tag b').textContent = L.name; $('#tag i').textContent = L.slogan;
    tv.style.setProperty('--brand', L.palette.accent);
    $('#clock').textContent = `LAP ${t.lap} · ${t.clock.toUpperCase()}`;
  };
  const draw = cut => { OPS.mount(stage, state.id, { time: state.time, seed: state.seed, cut }); label(); sync(); };
  const sync = () => {
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === state.id));
    document.querySelectorAll('#dial button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === state.time));
  };
  const reveal = () => {
    tv.classList.remove('open'); tv.classList.add('sealed');
    $('.file .q span').textContent = OPS.locs[state.id].short;
    setTimeout(() => { tv.classList.remove('sealed'); tv.classList.add('open'); }, 900);
  };

  OPS.list().forEach(l => {
    const b = document.createElement('button');
    b.dataset.id = l.id; b.textContent = l.short; b.style.setProperty('--sw', l.accent);
    b.onclick = () => { state.id = l.id; state.seed = undefined; draw(true); reveal(); };
    $('#tabs').appendChild(b);
  });
  OPS.times.forEach(t => {
    const b = document.createElement('button');
    b.dataset.id = t.id; b.title = `Lap ${t.lap}, ${t.clock}`; b.innerHTML = `<svg viewBox="0 0 24 24">${ICON[t.id]}</svg>`;
    b.onclick = () => { state.time = t.id; draw(); };
    $('#dial').appendChild(b);
  });
  $('#reveal').onclick = reveal;
  $('#shuffle').onclick = () => { state.seed = (Math.random() * 1e9) | 0; draw(); };
  $('#cycle').onclick = e => {
    if (state.cycle) { clearInterval(state.cycle); state.cycle = null; e.target.setAttribute('aria-pressed', false); return; }
    e.target.setAttribute('aria-pressed', true);
    state.cycle = setInterval(() => { const i = OPS.times.findIndex(t => t.id === state.time); state.time = OPS.times[(i + 1) % OPS.times.length].id; draw(); }, 3200);
  };

  // prop sheet
  const sheet = $('#sheet');
  Object.keys(OPS.props).forEach(name => {
    const def = OPS.props[name];
    def.variants.forEach(v => {
      const f = document.createElement('figure'); f.className = 'card';
      f.innerHTML = `<svg class="ops-scene" style="--clock:0s"><g>${OPS.renderProp(name, v, { seed: 11 })}</g></svg><figcaption>${name}<span>${v}</span></figcaption>`;
      sheet.appendChild(f);
      // fit the viewBox to the drawing, ground line at 82%
      const svg = f.querySelector('svg'), bb = svg.firstChild.getBBox(), side = Math.max(bb.width, bb.height / .82, 120) * 1.12;
      svg.setAttribute('viewBox', `${bb.x + bb.width / 2 - side / 2} ${-side * .82} ${side} ${side}`);
    });
  });

  draw(true);
  setTimeout(reveal, 400);
})();

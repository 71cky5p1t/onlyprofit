// Title, the quick-fire round, and the company reveal.
const QUICK_SECS = +new URLSearchParams(location.search).get('quick') || 45;

function renderTitle() {
  const o = ui.opts;
  const seg = (key, vals) => vals.map(([v, l]) => `<button class="${o[key] === v ? 'on' : ''}" data-${key}="${v}">${l}</button>`).join('');
  app.innerHTML = `<main class="title">
    <div class="tinhero" aria-hidden="true"><i></i><span>PETTY CASH</span></div>
    <h1>Petty Cash</h1>
    <p class="sub">Claim it. Pad it. Make rent.</p>
    <div class="opts">
      <div class="opt"><span class="label">Staff</span><div class="seg">${seg('players', [[4, '4'], [5, '5'], [6, '6']])}</div></div>
      <div class="opt"><span class="label">Employer</span><div class="seg">${seg('co', [['mystery', 'Mystery'], ['party', 'Party hire'], ['funeral', 'Funeral'], ['mining', 'Mine']])}</div></div>
    </div>
    <button class="go" id="go">Clock on</button>
    <details class="how"><summary>How it works</summary><ol>
      <li>Answer quick-fire questions. Don't think too hard.</li>
      <li>Each turn, roll and draw that many cards. Wages go straight in your bank.</li>
      <li>Lodge a receipt from your hand. A secret surcharge sets what it really cost. Claim whatever you like.</li>
      <li>Anyone can audit. Padded: you're caught and the auditor pockets the difference. Honest: you get a halo and they pay a fine.</li>
      <li>Rent goes up every lap. Six laps. If the tin survives, the richest wins. If it runs dry, the richest takes the fall and second place wins.</li>
    </ol></details>
  </main>`;
  app.querySelectorAll('[data-players]').forEach(b => b.onclick = () => { o.players = +b.dataset.players; renderTitle(); });
  app.querySelectorAll('[data-co]').forEach(b => b.onclick = () => { o.co = b.dataset.co; renderTitle(); });
  app.querySelector('#go').onclick = startGame;
}

function startGame() {
  const keys = Object.keys(PC.CO);
  const pick = ui.opts.co === 'mystery' ? keys[Math.floor(Math.random() * keys.length)] : ui.opts.co;
  ui.s = PC.newGame({ players: ui.opts.players, co: pick, seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0 });
  ui.seen = new Set(); ui.sel = {}; ui.hold = 0;
  ui.q = { order: shuffled(PC.PROMPTS.map((_, i) => i)), at: 0, answers: [], left: QUICK_SECS, started: false };
  ui.screen = 'quick';
  setScene();
  render();
}

// ---------- quick-fire: answer until the clock runs out ----------
function renderQuick() {
  const q = ui.q;
  if (!q.started) {
    app.innerHTML = `<main class="quick"><div class="qcard intro">
      <span class="label">Before you start</span>
      <h2>Quick-fire round.</h2>
      <p>${QUICK_SECS} seconds. Answer everything. First thing that comes to mind.</p>
      <button class="go" id="qs">Go</button></div></main>`;
    app.querySelector('#qs').onclick = () => { q.started = true; q.t0 = Date.now(); renderQuick(); tick(); };
    return;
  }
  const qi = q.order[q.at % q.order.length];
  app.innerHTML = `<main class="quick">
    <div class="qtop"><span class="label">Quick-fire</span><div class="fuse"><i id="fuse"></i></div><b class="num" id="qclock"></b></div>
    <div class="qcard" id="qcard">
      <span class="label">Question ${q.at + 1}</span>
      <h2>${esc(PC.PROMPTS[qi][0])}</h2>
      <form id="qf"><input id="qin" autocomplete="off" autocapitalize="sentences" maxlength="40" placeholder="Type anything" enterkeyhint="next"><button class="enter" aria-label="Answer">↵</button></form>
      <button class="pass" id="qp">Next question</button>
    </div>
    <div class="spike"><span class="label">${q.answers.length} answer${q.answers.length === 1 ? '' : 's'}</span>
      <div class="slips">${q.answers.slice(-6).map((a, k, arr) => `<span class="slip ${k === arr.length - 1 && q.fresh ? 'new' : ''}" style="--r:${(a.text.length * 7) % 9 - 4}deg">${esc(a.text)}</span>`).join('')}</div>
    </div>
  </main>`;
  q.fresh = false;
  const inp = app.querySelector('#qin');
  inp.focus();
  app.querySelector('#qf').onsubmit = ev => {
    ev.preventDefault();
    const t = inp.value.trim();
    if (!t) return;
    q.answers.push({ q: qi, text: t }); q.at++; q.fresh = true;
    renderQuick();
  };
  app.querySelector('#qp').onclick = () => { q.at++; renderQuick(); };
  paintClock();
}
function paintClock() {
  const q = ui.q, left = Math.max(0, QUICK_SECS - (Date.now() - q.t0) / 1000);
  const c = app.querySelector('#qclock'), f = app.querySelector('#fuse');
  if (c) c.textContent = '0:' + String(Math.ceil(left)).padStart(2, '0');
  if (f) { f.style.width = (left / QUICK_SECS * 100) + '%'; f.parentNode.classList.toggle('low', left < 10); }
  return left;
}
function tick() {
  if (ui.screen !== 'quick') return;
  if (paintClock() > 0) return void setTimeout(tick, 200);
  // keep a half-typed answer
  const inp = app.querySelector('#qin');
  if (inp && inp.value.trim()) ui.q.answers.push({ q: ui.q.order[ui.q.at % ui.q.order.length], text: inp.value.trim() });
  app.innerHTML = `<main class="quick"><div class="qcard intro timeup"><span class="label">Pens down</span><h2>Time's up.</h2></div></main>`;
  setTimeout(() => {
    const r = PC.apply(ui.s, 0, { type: 'shop', answers: ui.q.answers });
    ui.s = r.state;
    ui.screen = 'reveal';
    setScene();
    render();
  }, 1300);
}

// ---------- the mystery employer ----------
function renderReveal() {
  const c = co(), mine = ui.q.answers.slice(0, 16);
  const shown = shuffled(mine).slice(0, 3);
  app.innerHTML = `<main class="reveal">
    <span class="label">Your new employer</span>
    <div class="cosign"><h1>${esc(c.name)}</h1><p>${esc(c.tag)}</p></div>
    <p class="brief">${esc(c.prompt)}</p>
    ${shown.length ? `<p class="gotcha">Everything you just said is now a line item.</p>
    <div class="items">${shown.map((a, k) => `<div class="mini" style="--d:${0.9 + k * 0.35}s"><span class="wi">${esc(a.text)}</span><b class="num">${money(c.tiers[PC.PROMPTS[a.q][1]])}</b></div>`).join('')}</div>` : `<p class="gotcha">You said nothing. Very professional.</p>`}
    <button class="go" id="go">Start the year</button>
  </main>`;
  app.querySelector('#go').onclick = () => { ui.screen = 'game'; render(); pump(); };
}

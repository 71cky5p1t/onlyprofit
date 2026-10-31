// Petty Cash UI: state, the bot driver, toasts. Screens live in the files after this one.
const app = document.getElementById('app');
const ov = document.getElementById('ov');
const ui = { screen: 'title', s: null, opts: { players: 5, co: 'mystery' }, sel: {}, amt: 0, seen: new Set(), hold: 0, rolling: false, busy: false };
const TOD = ['morning', 'smoko', 'lunch', 'arvo', 'knockoff', 'late'];
const TOD_NAME = { morning: 'Morning', smoko: 'Smoko', lunch: 'Lunch', arvo: 'Arvo', knockoff: 'Knock-off', late: 'After hours' };
const SPEED = /fast/.test(location.search) ? 0.25 : 1;
const FACES = ['', '⚀', '⚁', '⚂'];
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-AU');
const co = () => PC.CO[ui.s.co];
const me = () => ui.s.P[0];
const has = (p, key) => p.hand.find(c => c.k === 'act' && c.v === key);
const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- engine plumbing ----------
function act(a) {
  const r = PC.apply(ui.s, 0, a);
  if (r.error) { toast(r.error); return false; }
  commit(r);
  return true;
}
function commit(r) {
  ui.s = r.state;
  onEvents(r.events);
  setScene();
  if (ui.s.phase === 'end') ui.screen = 'end';
  render();
  pump();
}
// bots move on a timer; outcomes hold the table a beat longer
let pumpT = null;
function pump() {
  clearTimeout(pumpT);
  const s = ui.s;
  if (!s || s.phase === 'end' || s.phase === 'shop' || PC.needsHuman(s)) return;
  const base = { roll: 650, pick: 1000, claim: 1200, audit: 900, shred: 900, rent: 600 }[s.phase] || 800;
  const d = Math.max(base, ui.hold - Date.now()) * SPEED;
  pumpT = setTimeout(() => {
    const r = PC.apply(ui.s, 0, { type: 'advance' });
    if (!r.error) commit(r);
  }, d);
}
function onEvents(E) {
  for (const e of E) {
    if (e.kind === 'caught' || e.kind === 'halo' || e.kind === 'shred') ui.hold = Date.now() + 2600;
    if (e.kind === 'lap') ui.hold = Math.max(ui.hold, Date.now() + 1200);
    if (e.to !== 0) {
      if (e.kind === 'roll' && e.seat === 0 && e.cash) toast(`Wages: +${money(e.cash)}`, 'cash');
      if (e.kind === 'action' && e.target === 0) toast("Landlord's Letter. Your rent is doubled this lap.", 'bad');
      continue;
    }
    if (e.kind === 'weasel') weasel(e);
    else if (e.kind === 'bounty') toast(e.text, 'cash');
    else if (e.kind === 'peek') toast('Payroll Peek: the real cost is on the receipt.');
  }
}
// the company and the time of day light the room
function setScene() {
  const s = ui.s;
  document.body.dataset.co = s && s.phase !== 'shop' ? s.co : '';
  document.body.dataset.tod = s && s.phase !== 'shop' ? TOD[Math.min(TOD.length, s.lap) - 1] : '';
}

// ---------- overlays ----------
function toast(text, tone) {
  const t = document.createElement('div');
  t.className = 'toast ' + (tone || '');
  t.textContent = text;
  ov.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}
function weasel(e) {
  ui.hold = Date.now() + 3200;
  const d = document.createElement('div');
  d.className = 'weasel';
  d.innerHTML = `<div class="slip"><span class="label">Private and confidential</span><h2>You bad little weasel.</h2><p>They were honest. ${e.fine ? `That cost you ${money(e.fine)}.` : 'The Petty Cash Key covered the fine.'}</p></div>`;
  d.onclick = () => d.remove();
  ov.appendChild(d);
  setTimeout(() => d.remove(), 3400);
}

function render() {
  if (ui.screen === 'title') renderTitle();
  else if (ui.screen === 'quick') renderQuick();
  else if (ui.screen === 'reveal') renderReveal();
  else if (ui.screen === 'game') renderGame();
  else if (ui.screen === 'end') renderEnd();
}

// Your desk: bank, the die, your hand, and whatever the moment asks of you.
const PLAYABLE = { freeze: 1, letter: 1, creative: 1, key: 1 };

function desk(s) {
  const p = me(), myTurn = s.turn === 0;
  const rent = PC.rentFor(s, 0);
  const busy = (s.phase === 'claim' && myTurn) || (s.phase === 'audit' && s.cur.seat !== 0 && !(0 in s.cur.calls));
  return `<section class="desk ${busy ? 'busy' : ''}">
    <div class="dhead">
      <div class="mybank ${p.bank < 0 ? 'debt' : ''}"><span class="label">${p.bank < 0 ? 'On the tab' : 'Your bank'}</span><b class="num">${money(p.bank)}</b></div>
      <div class="mydue"><span class="label">Rent this lap</span><b class="num">${money(rent)}</b></div>
      ${dieBtn(s, myTurn)}
    </div>
    <div class="hand">${handCards(s)}</div>
    <div class="ctl">${control(s)}</div>
  </section>`;
}

function dieBtn(s, myTurn) {
  const k = s.lastRoll && s.lastRoll.seat === 0 ? s.lastRoll.k : 0;
  const can = myTurn && s.phase === 'roll';
  return `<button class="die ${can ? 'ready' : ''} ${ui.rolling ? 'rolling' : ''}" id="die" ${can ? '' : 'disabled'} aria-label="Roll">
    <span class="face">${FACES[k] || '⚄'}</span><span class="label">${can ? 'Roll' : k ? `Drew ${k}` : 'Die'}</span></button>`;
}

function cardHtml(c) {
  const sel = ui.sel.who === c.id || ui.sel.what === c.id || ui.sel.act === c.id;
  const fresh = !ui.seen.has(c.id);
  const k = { who: 'Who / how', what: 'What', act: 'Action' }[c.k];
  let v = '', nm = esc(c.name), sub = '';
  if (c.k === 'who') v = '×' + c.v;
  if (c.k === 'what') { v = money(c.v); if (c.by != null) nm = `<span class="wi">${nm}</span>`; }
  if (c.k === 'act') sub = `<span class="desc">${esc(PC.ACTIONS[c.v][1])}</span>`;
  const len = Math.max(...String(c.name).split(/\s+/).map(w => w.length));
  return `<button class="card k-${c.k} ${len > 9 ? 'long' : ''} ${sel ? 'sel' : ''} ${fresh ? 'new' : ''}" data-card="${c.id}" style="--len:${len}">
    <span class="label">${k}</span><span class="nm">${nm}</span>${sub}${v ? `<span class="v num">${v}</span>` : ''}</button>`;
}

function handCards(s) {
  const order = { who: 0, what: 1, act: 2 };
  const h = me().hand.slice().sort((a, b) => order[a.k] - order[b.k] || (a.k === 'act' ? 0 : b.v - a.v));
  return h.length ? h.map(cardHtml).join('') : '<p class="emptyhand">Nothing in your hand.</p>';
}

// one control at a time, depending on the phase
function control(s) {
  const p = me(), myTurn = s.turn === 0;
  if (ui.target) return `<p class="ask">Pick who gets the Landlord's Letter.</p><button class="ghost" id="cancel">Never mind</button>`;
  const a = ui.sel.act && p.hand.find(c => c.id === ui.sel.act);
  if (a) {
    const can = PLAYABLE[a.v] && myTurn && s.phase === 'pick';
    const when = { shred: 'It plays when you get audited.', nephew: 'It plays when you lodge a claim.', peek: 'It plays while someone else has a claim open.', free: 'It plays on rent day.' }[a.v];
    return `<p class="ask"><b>${esc(PC.ACTIONS[a.v][0])}.</b> ${esc(PC.ACTIONS[a.v][1])}</p>
      ${can ? `<button class="go" id="playact">Play it</button>` : `<p class="note">${when || 'Play it on your turn, after you roll.'}</p>`}
      <button class="ghost" id="cancel">Put it back</button>`;
  }
  if (s.phase === 'audit' && s.cur.seat !== 0 && !(0 in s.cur.calls)) return auditBar(s);
  if (!myTurn) return '';
  if (s.phase === 'pick') {
    const who = p.hand.find(c => c.id === ui.sel.who), what = p.hand.find(c => c.id === ui.sel.what);
    const g = what ? PC.guideOf(who, what) : 0;
    return `<p class="ask">${what ? `<b>${esc(PC.itemOf(who, what))}</b> · guide <span class="num">${money(g)}</span>` : 'Pick a what, and a who/how if you like.'}</p>
      <button class="go" id="lodge" ${what ? '' : 'disabled'}>Lodge receipt</button>
      <button class="ghost" id="skip">Nothing to claim</button>`;
  }
  if (s.phase === 'claim') return claimCtl(s);
  if (s.phase === 'shred') return `<p class="ask">Someone's auditing your claim.</p>
    <button class="go" id="shredy">Shred the records</button><button class="ghost" id="shredn">Let them look</button>`;
  if (s.phase === 'rent') return `<p class="ask">Rent's due: <span class="num">${money(PC.rentFor(s, 0))}</span>.</p>
    <button class="go" id="freey">Play Free Rent</button><button class="ghost" id="freen">Pay it</button>`;
  return '';
}

function claimCtl(s) {
  const c = s.cur, p = me();
  if (ui.amt == null || ui.amtFor !== c.item + c.guide) { ui.amt = c.real; ui.amtFor = c.item + c.guide; ui.nephew = false; }
  const chips = [['Honest', c.real], ['Guide', c.guide], ['+50%', c.real * 1.5], ['Double', c.real * 2]]
    .map(([l, v]) => `<button class="chip" data-amt="${Math.round(v / 5) * 5}">${l}<span class="num">${money(Math.round(v / 5) * 5)}</span></button>`).join('');
  return `<div class="amount">
      <button class="step" data-step="-1" aria-label="Less">−</button>
      <label><span class="label">Claim</span><input id="amt" class="num" inputmode="numeric" value="${ui.amt}"></label>
      <button class="step" data-step="1" aria-label="More">+</button>
    </div>
    <div class="chips">${chips}</div>
    <p class="after" id="after">${afterLine(s)}</p>
    ${has(p, 'nephew') ? `<label class="nephew"><input type="checkbox" id="neph" ${ui.nephew ? 'checked' : ''}> Lodge with Nephew of the CEO (no audits)</label>` : ''}
    <button class="go" id="claim">Lodge claim</button>`;
}
function afterLine(s) {
  const c = s.cur, pad = ui.amt - c.real, left = me().bank + ui.amt - PC.rentFor(s, 0);
  return `${pad > 0 ? `Padding <b class="num">${money(pad)}</b>.` : pad < 0 ? `Under by <b class="num">${money(-pad)}</b>.` : 'Honest.'} After rent you'd have <b class="num ${left < 0 ? 'neg' : ''}">${money(left)}</b>.`;
}

function wireDesk(s) {
  const q = id => app.querySelector(id), on = (id, f) => { const b = q(id); if (b) b.onclick = f; };
  const p = me();
  app.querySelectorAll('.hand .card').forEach(b => b.onclick = () => {
    const c = p.hand.find(x => x.id === b.dataset.card);
    if (c.k === 'act') ui.sel = { act: ui.sel.act === c.id ? null : c.id };
    else {
      if (ui.sel.act) ui.sel = {};
      if (!(s.turn === 0 && s.phase === 'pick')) { toast(s.turn !== 0 ? 'Wait for your turn.' : s.phase === 'roll' ? 'Roll first.' : 'Not now.'); return; }
      ui.sel[c.k] = ui.sel[c.k] === c.id ? null : c.id;
    }
    render();
  });
  on('#die', () => {
    ui.rolling = true; render();
    setTimeout(() => { ui.rolling = false; act({ type: 'roll' }); }, 650);
  });
  on('#cancel', () => { ui.sel = {}; ui.target = null; render(); });
  on('#playact', () => {
    const c = p.hand.find(x => x.id === ui.sel.act);
    if (c.v === 'letter') { ui.target = c.id; ui.sel = { act: c.id }; render(); return; }
    ui.sel = {}; act({ type: 'play', card: c.id });
  });
  on('#lodge', () => { const a = { type: 'pick', what: ui.sel.what, who: ui.sel.who || null }; ui.sel = {}; ui.amt = null; act(a); });
  on('#skip', () => { ui.sel = {}; act({ type: 'pick', skip: true }); });
  on('#shredy', () => act({ type: 'shred', use: true }));
  on('#shredn', () => act({ type: 'shred', use: false }));
  on('#freey', () => act({ type: 'rent', free: true }));
  on('#freen', () => act({ type: 'rent', free: false }));
  // the claim
  const amt = q('#amt');
  if (!amt) return;
  const set = v => { ui.amt = Math.max(0, Math.round(v / 5) * 5); amt.value = ui.amt; q('#after').innerHTML = afterLine(s); };
  amt.oninput = () => { const v = parseInt(amt.value.replace(/\D/g, ''), 10) || 0; ui.amt = v; q('#after').innerHTML = afterLine(s); };
  amt.onblur = () => set(ui.amt);
  const step = Math.max(5, Math.round(s.cur.guide * 0.1 / 5) * 5);
  app.querySelectorAll('.step').forEach(b => b.onclick = () => set(ui.amt + step * +b.dataset.step));
  app.querySelectorAll('.chip').forEach(b => b.onclick = () => set(+b.dataset.amt));
  on('#neph', () => { ui.nephew = q('#neph').checked; });
  on('#claim', () => {
    if (ui.busy) return;
    set(ui.amt);
    ui.busy = true;
    q('.tray .rcpt').classList.add('lodging');
    q('#claim').disabled = true;
    setTimeout(() => { ui.busy = false; act({ type: 'claim', amount: ui.amt, nephew: ui.nephew }); }, 700);
  });
}

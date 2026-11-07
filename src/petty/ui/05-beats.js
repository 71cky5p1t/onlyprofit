// The beats around the receipts: overtime, the envelope, and the buck.

// ---------- overtime: a timesheet that fills up card by card ----------
function otStatus(s) {
  const o = s.ot, mine = o.inn.includes(0);
  if (o.done) return o.bust ? `Second ${esc(o.bust)}. Everyone still here goes home with nothing.` : 'Everyone has clocked off.';
  const warn = Object.keys(o.seen);
  if (mine) return warn.length ? `One more ${esc(warn[warn.length - 1])} and everyone still here loses the lot.` : 'Overtime. Stay back or clock off?';
  return o.out[0] === 0 ? 'Sent home with nothing.' : `You clocked off with ${money(o.out[0])}. The rest are still here.`;
}
function otTray(s) {
  const o = s.ot, last = o.row.length - 1;
  const key = s.lap + ':' + o.row.length, fresh = ui.otKey !== key; ui.otKey = key;
  const cards = o.row.map((c, k) => `<div class="tc ${c.hz ? 'hz' : ''} ${c.bust ? 'bust' : ''} ${k === last && fresh ? 'new' : ''}">
    <span class="label">${c.hz ? (c.bust ? 'Again' : 'Hazard') : 'Overtime'}</span><b>${esc(c.name)}</b>${c.hz ? '' : `<span class="num">+${money(c.each)}</span>`}</div>`).join('');
  return `<p class="status">${otStatus(s)}</p>${ui.fresh ? dice(s) : ''}
    <div class="shift ${o.bust ? 'busted' : ''}"><header><span class="label">Timesheet · after hours</span><span class="num">${o.deck.length} left</span></header><div class="row">${cards}</div></div>`;
}
function otMark(s, p) {
  const o = s.ot;
  if (!o) return '';
  if (o.inn.includes(p.id)) return `<i class="ot here">Here ${money(o.haul[p.id])}</i>`;
  if (o.out[p.id] === 0) return '<i class="ot sent">Sent home</i>';
  return o.out[p.id] != null ? `<i class="ot off">+${money(o.out[p.id])}</i>` : '';
}
function otCtl(s) {
  const h = s.ot.haul[0];
  return `<div class="choice"><button class="stampbtn stay" id="stay">Stay back</button><button class="stampbtn off" id="off">Clock off <span class="num">+${money(h)}</span></button></div>`;
}

// ---------- the envelope ----------
// animate each envelope state once, not on every redraw
function envelope(c, state, key) {
  const k = key + ':' + state, still = ui.envKey === k; ui.envKey = k;
  return `<div class="env ${state} ${still ? 'still' : ''}"><i class="flap"></i><span class="label">${state === 'back' ? 'Returned' : 'Private'}</span><b class="num">${money(c.offer)}</b></div>`;
}
function bribeCtl(s) {
  const c = s.cur;
  const opts = [['Nothing', 0], ['A little', c.claim * 0.1], ['Generous', c.claim * 0.25], ['Very', c.claim * 0.4]];
  return `<p class="ask">Slip them an envelope?</p>
    <div class="chips">${opts.map(([l, v]) => `<button class="chip" data-offer="${Math.round(v / 5) * 5}">${l}<span class="num">${money(Math.round(v / 5) * 5)}</span></button>`).join('')}</div>`;
}
function takeCtl(s) {
  const c = s.cur, fine = me().key ? 0 : Math.round(c.claim * PC.T.weasel / 5) * 5;
  return `<div class="choice"><button class="stampbtn sign" id="take">Take it</button><button class="stampbtn audit" id="open">Open it</button>
    <p class="risk">${fine ? `If it's honest, opening it costs you ${money(fine)}.` : 'Opening it is free: you hold the Key.'}</p></div>`;
}

// ---------- the buck: a folder nobody wants ----------
function buckStatus(s) {
  const b = s.buck, h = esc(s.P[b.holder].name);
  if (b.blew != null) return `It went off in ${b.blew === 0 ? 'your' : esc(s.P[b.blew].name) + "'s"} hands.`;
  if (b.dealt != null) return `${b.dealt === 0 ? 'You' : esc(s.P[b.dealt].name)} dealt with it.`;
  return b.holder === 0 ? "Make it someone else's problem." : `${h} is looking for someone to blame.`;
}
function buckTray(s) {
  const b = s.buck, last = b.trail[b.trail.length - 1];
  const key = s.lap + ':' + b.passes + ':' + b.done, fresh = ui.buckKey !== key; ui.buckKey = key;
  const end = b.blew != null ? 'blew' : b.dealt != null ? 'dealt' : '';
  const stamp = end === 'blew' ? `Went off · ${money(b.hit)}` : end === 'dealt' ? `Dealt with · ${money(b.hit)}` : '';
  return `<p class="status">${s.phase === 'rent' ? 'Rent day.' : buckStatus(s)}</p>
    <article class="folder ${end} ${fresh ? (end ? 'land' : 'slide') : ''}">
      <span class="tab label">Urgent</span>
      <span class="label">Not my problem</span>
      <h3>${esc(b.name)}</h3>
      <p class="on">On ${b.holder === 0 && !end ? 'your' : esc(s.P[end ? (b.blew != null ? b.blew : b.dealt) : b.holder].name) + "'s"} desk</p>
      <div class="tally"><span class="label">Passed</span>${'<i></i>'.repeat(b.passes)}${b.passes ? '' : '<em>not yet</em>'}</div>
      ${last ? `<blockquote>“${esc(last.excuse)}”<cite>${esc(s.P[last.from].name)}</cite></blockquote>` : ''}
      ${stamp ? `<div class="stamp s-${end}">${stamp}</div>` : ''}
    </article>`;
}
// three excuses on offer, stable for this pass
const excuses = s => [0, 1, 2].map(k => (s.lap * 7 + s.buck.passes * 3 + k) % PC.EXCUSES.length);
function buckCtl(s) {
  if (ui.exc == null || !excuses(s).includes(ui.exc)) ui.exc = excuses(s)[0];
  const fee = PC.buckFee(s), blast = PC.buckBlast(s, 0);
  return `<p class="ask">Pick an excuse, then tap who gets it.</p>
    <div class="chips excuses">${excuses(s).map(k => `<button class="chip exc ${ui.exc === k ? 'on' : ''}" data-exc="${k}">${esc(PC.EXCUSES[k])}</button>`).join('')}</div>
    <button class="go" id="deal">Deal with it · <span class="num">${money(fee)}</span></button>
    <p class="note">${s.buck.passes ? `Any pass could be the one where it goes off: ${money(blast)}.` : 'The first pass is always safe.'}</p>`;
}
const buckMine = s => s.phase === 'buck' && PC.needsHuman(s);

function wireBeats(s) {
  const on = (id, f) => { const b = app.querySelector(id); if (b) b.onclick = f; };
  on('#stay', () => act({ type: 'overtime', stay: true }));
  on('#off', () => act({ type: 'overtime', stay: false }));
  on('#take', () => act({ type: 'take', accept: true }));
  on('#open', () => act({ type: 'take', accept: false }));
  on('#deal', () => act({ type: 'buck', deal: true }));
  app.querySelectorAll('[data-offer]').forEach(b => b.onclick = () => act({ type: 'bribe', amount: +b.dataset.offer }));
  app.querySelectorAll('[data-exc]').forEach(b => b.onclick = () => { ui.exc = +b.dataset.exc; render(); });
  if (buckMine(s)) app.querySelectorAll('.tag.pickable').forEach(b => b.onclick = () => act({ type: 'buck', pass: +b.dataset.seat, excuse: ui.exc }));
}

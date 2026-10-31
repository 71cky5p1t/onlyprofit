// The table: TV strip, name tags, the in-tray receipt, the till roll.
function renderGame() {
  const s = ui.s;
  app.innerHTML = `<main class="game">${strip(s)}${tags(s)}<section class="tray">${tray(s)}</section>${till(s)}${desk(s)}</main>`;
  wireTable(s);
  wireDesk(s);
  for (const c of me().hand) ui.seen.add(c.id);
}

function strip(s) {
  const tod = TOD[Math.min(TOD.length, s.lap) - 1];
  const f = Math.max(0, s.tin / s.tin0);
  return `<header class="tv">
    <div class="co"><b>${esc(co().name)}</b><span>Lap ${Math.min(s.lap, PC.T.laps)} of ${PC.T.laps} · ${TOD_NAME[tod]}</span></div>
    <div class="tin ${f < 0.25 ? 'low' : ''}"><span class="label">Petty cash tin</span><b class="num lcd">${money(s.tin)}</b><i class="gauge"><i style="width:${f * 100}%"></i></i></div>
  </header>`;
}

function tags(s) {
  return `<section class="tags">${s.P.map(p => {
    const cls = ['tag', p.human ? 'me' : '', s.turn === p.id && s.phase !== 'end' ? 'turn' : '', p.bank < 0 ? 'debt' : '', ui.target && !p.human ? 'pickable' : ''].join(' ');
    return `<button class="${cls}" data-seat="${p.id}" ${ui.target && !p.human ? '' : 'tabindex="-1"'}>
      <span class="nm">${esc(p.name)}</span>
      <b class="num">${money(p.bank)}</b>
      <span class="marks">${'<i class="halo" title="Cleared"></i>'.repeat(Math.min(p.halo, 4))}${p.caught ? `<i class="caught">Padded${p.caught > 1 ? ' ×' + p.caught : ''}</i>` : ''}${p.letter ? '<i class="letter">2× rent</i>' : ''}</span>
      <span class="cards">${p.hand.length} cards</span>
    </button>`;
  }).join('')}</section>`;
}

// what's happening, in one line
function status(s) {
  const p = s.P[s.turn], you = p.human, n = esc(p.name);
  const r = s.lastRoll && s.lastRoll.seat === s.turn ? s.lastRoll.k : 0;
  switch (s.phase) {
    case 'roll': return you ? 'Your turn. Roll for cards.' : `${n} is rolling.`;
    case 'pick': return you ? `You rolled ${r}. Pick a receipt to lodge.` : `${n} rolled ${r} and is going through receipts.`;
    case 'claim': return you ? 'How much are you claiming?' : `${n} is filling in a claim.`;
    case 'audit': return s.cur.seat !== 0 && !(0 in s.cur.calls) ? `${n} wants ${money(s.cur.claim)}. Sign it or audit?` : 'With Accounts.';
    case 'shred': return you ? "You're being audited." : `${n} is being audited.`;
    case 'rent': return you ? 'Rent day.' : `${n} is paying rent.`;
    default: return '';
  }
}

function tray(s) {
  const c = s.cur && (s.cur.claim != null || s.cur.seat === 0) ? s.cur : s.claims[s.claims.length - 1];
  return `<p class="status">${status(s)}</p>
    ${c ? receipt(s, c, c !== s.cur) : `<div class="rcpt empty"><span class="label">In tray</span><p>No claims yet.</p></div>`}`;
}

// a thermal receipt; the real cost stays blacked out until someone finds out
function receipt(s, c, old) {
  const mine = c.seat === 0, no = s.claims.indexOf(c) + 1 || s.claims.length + 1;
  const peeked = c.peeks && c.peeks.includes(0);
  const known = mine || peeked || c.outcome === 'caught' || c.outcome === 'halo';
  const bar = '<span class="redact">██████</span>';
  const stamp = { caught: 'Caught padding', halo: 'Cleared', shredded: 'Shredded', paid: c.nephew ? 'Nephew of the CEO' : 'Signed' }[c.outcome] || '';
  const write = c.what.by != null ? 'wi' : '';
  return `<article class="rcpt ${old ? 'old' : ''} ${c.outcome || ''}">
    <header><span class="label">Expense claim</span><span class="num">No. ${String(no).padStart(4, '0')}</span></header>
    <p class="by">${esc(s.P[c.seat].name)}</p>
    <p class="item">${c.who ? `<span class="w">${esc(c.who.name)}</span> ` : ''}<span class="${write}">${esc(c.what.name)}</span></p>
    <dl>
      <dt>Guide price</dt><dd class="num">${money(c.guide)}</dd>
      <dt>Surcharge</dt><dd>${known ? `${esc(c.sur)} <span class="num">×${c.m}</span>` : bar}</dd>
      <dt>Real cost</dt><dd class="num">${known ? money(c.real) : bar}</dd>
    </dl>
    <div class="total"><span class="label">Claimed</span><b class="num">${c.claim != null ? money(c.claim) : '—'}</b></div>
    ${stamp ? `<div class="stamp s-${c.outcome}">${stamp}</div>` : ''}
  </article>`;
}

function auditBar(s) {
  const c = s.cur, fine = Math.round(c.claim * PC.T.weasel / 5) * 5, pk = has(me(), 'peek');
  return `<div class="auditbar">
    <button class="stampbtn sign" id="sign">Sign it</button>
    <button class="stampbtn audit" id="audit">Audit</button>
    <p class="risk">${me().key ? 'Wrong call is free: you hold the Key.' : `Wrong call costs you ${money(fine)}.`}${pk && !c.peeks.includes(0) ? ' <button class="peek" id="peek">Use Payroll Peek</button>' : ''}</p>
  </div>`;
}

function till(s) {
  const lines = s.feed.filter(e => e.to == null || e.to === 0).slice(-5).reverse();
  return `<section class="till" aria-live="polite">${lines.map((e, k) => `<p class="k-${e.kind} ${k ? '' : 'top'}">${esc(e.text)}</p>`).join('')}</section>`;
}

function wireTable(s) {
  const q = id => app.querySelector(id);
  if (q('#sign')) q('#sign').onclick = () => act({ type: 'audit', call: 'sign' });
  if (q('#audit')) q('#audit').onclick = () => act({ type: 'audit', call: 'audit' });
  if (q('#peek')) q('#peek').onclick = () => act({ type: 'play', card: has(me(), 'peek').id });
  if (ui.target) app.querySelectorAll('.tag.pickable').forEach(b => b.onclick = () => {
    const card = ui.target; ui.target = null; ui.sel = {};
    act({ type: 'play', card, target: +b.dataset.seat });
  });
}

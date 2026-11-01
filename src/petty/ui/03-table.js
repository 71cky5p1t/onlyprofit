// The table: TV strip, name tags, the tray (dice, then the flipping pile), the till roll.
function renderGame() {
  const s = ui.s;
  const el = Date.now() - (ui.rollAt || 0);
  ui.fresh = el < 4000;
  app.innerHTML = `<main class="game" style="--el:${ui.fresh ? -el : -9999}ms">${strip(s)}${tags(s)}<section class="tray">${tray(s)}</section>${till(s)}${desk(s)}</main>`;
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
  const up = s.phase === 'flip' || s.phase === 'shred' ? s.cur && s.cur.seat : -1;
  return `<section class="tags">${s.P.map(p => {
    const l = s.lodged[p.id];
    const cls = ['tag', p.human ? 'me' : '', up === p.id ? 'turn' : '', p.bank < 0 ? 'debt' : '', ui.target && !p.human ? 'pickable' : ''].join(' ');
    // bots "finish" lodging one after another once the dice land
    const lodged = s.phase === 'lodge' && l ? `<i class="in ${ui.fresh && !p.human ? 'late' : ''}" style="--d:${1.8 + p.id * 0.7}s">${l.skip ? 'Nothing' : 'Lodged'}</i>` : '';
    return `<button class="${cls}" data-seat="${p.id}" ${ui.target && !p.human ? '' : 'tabindex="-1"'}>
      <span class="nm">${esc(p.name)}</span>
      <b class="num">${money(p.bank)}</b>
      <span class="marks">${lodged}${'<i class="halo" title="Cleared"></i>'.repeat(Math.min(p.halo, 4))}${p.caught ? `<i class="caught">Padded${p.caught > 1 ? ' ×' + p.caught : ''}</i>` : ''}${p.letter ? '<i class="letter">2× rent</i>' : ''}</span>
      <span class="cards">${p.hand.length} cards</span>
    </button>`;
  }).join('')}</section>`;
}

// what's happening, in one line
function status(s) {
  const c = s.cur, n = c ? esc(s.P[c.seat].name) : '';
  switch (s.phase) {
    case 'lodge':
      if (s.lodged[0]) return 'Lodged. Shuffling the pile.';
      return s.pend ? 'How much are you claiming?' : `Lap ${s.lap}. Everyone rolled. Pick a receipt to lodge.`;
    case 'flip':
      if (c.outcome) return { caught: `${n} padded it.`, halo: `${n} was honest.`, shredded: 'Into the shredder.', paid: c.nephew ? 'Nephew of the CEO. No questions.' : 'Signed off.' }[c.outcome];
      if (c.seat === 0) return c.nephew ? 'Your claim. Nobody can touch it.' : 'Your claim. The table is deciding.';
      return c.nephew ? `${n} wants ${money(c.claim)}, with the Nephew card.` : `${n} wants ${money(c.claim)}. Sign it or audit?`;
    case 'shred': return "You're being audited.";
    case 'rent': return 'Rent day.';
    default: return '';
  }
}

function tray(s) {
  if (s.phase === 'lodge') return `<p class="status">${status(s)}</p>${dice(s)}${s.pend ? receipt(s, s.pend, false) : s.lodged[0] && !s.lodged[0].skip ? receipt(s, s.lodged[0], false, 'sealed') : ''}`;
  const c = s.cur || s.claims[s.claims.length - 1];
  const left = s.phase === 'flip' || s.phase === 'shred' ? s.order.length - s.fi - 1 : 0;
  const key = s.lap + ':' + s.fi;
  const flipin = s.cur && ui.flipKey !== key; ui.flipKey = key;
  return `<p class="status">${status(s)}</p>
    <div class="pile">${'<i></i>'.repeat(Math.min(left, 6))}${left ? `<span class="label">${left} to go</span>` : ''}</div>
    ${c ? receipt(s, c, c !== s.cur, flipin ? 'flipin' : '') : ''}`;
}

// a die with faces 1,1,2,2,3,3: front/back 1, right/left 2, top/bottom 3
const LAND = { 1: 'rotateX(0deg) rotateY(0deg)', 2: 'rotateX(0deg) rotateY(-90deg)', 3: 'rotateX(-90deg) rotateY(0deg)' };
function cube(k, cls, d) {
  const f = (n, side) => `<i class="f f${n} ${side}"></i>`;
  return `<span class="die3 ${cls}" style="--end:${LAND[k] || LAND[1]};--d:${d}s"><span class="cube">${f(1, 'fr')}${f(1, 'bk')}${f(2, 'rt')}${f(2, 'lf')}${f(3, 'tp')}${f(3, 'bt')}</span></span>`;
}
function dice(s) {
  return `<div class="dice">${s.P.map(p => {
    const r = s.rolls[p.id] || { k: 1 };
    return `<div class="dslot ${p.human ? 'me' : ''}">${cube(r.k, ui.fresh ? 'tumble' : '', p.human ? 0 : 0.15 + p.id * 0.08)}<span class="nm">${esc(p.name)}</span><b class="num">+${r.k}</b></div>`;
  }).join('')}</div>`;
}

// a thermal receipt; the real cost stays blacked out until someone finds out
function receipt(s, c, old, extra) {
  const mine = c.seat === 0, no = s.claims.indexOf(c) + 1 || s.claims.length + 1;
  const peeked = c.peeks && c.peeks.includes(0);
  const known = mine || peeked || c.outcome === 'caught' || c.outcome === 'halo';
  const bar = '<span class="redact">██████</span>';
  const stamp = extra === 'sealed' ? 'Lodged' : { caught: 'Caught padding', halo: 'Cleared', shredded: 'Shredded', paid: c.nephew ? 'Nephew of the CEO' : 'Signed' }[c.outcome] || '';
  const write = c.what.by != null ? 'wi' : '';
  return `<article class="rcpt ${old ? 'old' : ''} ${c.outcome || ''} ${extra || ''}">
    <header><span class="label">Expense claim</span><span class="num">No. ${String(no).padStart(4, '0')}</span></header>
    <p class="by">${esc(s.P[c.seat].name)}</p>
    <p class="item">${c.who ? `<span class="w">${esc(c.who.name)}</span> ` : ''}<span class="${write}">${esc(c.what.name)}</span></p>
    <dl>
      <dt>Guide price</dt><dd class="num">${money(c.guide)}</dd>
      <dt>Surcharge</dt><dd>${known ? `${esc(c.sur)} <span class="num">×${c.m}</span>` : bar}</dd>
      <dt>Real cost</dt><dd class="num">${known ? money(c.real) : bar}</dd>
    </dl>
    <div class="total"><span class="label">Claimed</span><b class="num">${c.claim != null ? money(c.claim) : '—'}</b></div>
    ${stamp ? `<div class="stamp s-${extra === 'sealed' ? 'sealed' : c.outcome}">${stamp}</div>` : ''}
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
  const lines = s.feed.filter(e => (e.to == null || e.to === 0) && e.kind !== 'claim').slice(-5).reverse();
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

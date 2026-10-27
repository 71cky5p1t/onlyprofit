  // ---------- desk: your phone. Objects on the felt, same as the TV; almost no prose ----------
  // a real desk: nameplate, input card, ashtray timer and profit ticket on the wood; work happens on the blotter
  const ticket = () => S && S.r ? `<span class="ticket" role="img" aria-label="Company profit ${fmt(S.profit)} of ${S.target}"><small>Profit</small><b class="${tone(S.profit)}">${fmt(S.profit)}</b><small>of ${S.target}</small></span>` : '';
  function deskWrap(title, body, o) {
    o = o || {};
    const tk = ticket();
    return `<aside class="desk" aria-label="Your desk"><div class="desk-head"><div class="bar-row"><h3 class="plate">${title}</h3>${o.right || tk}</div>${o.fuse || (o.right && tk) ? `<div class="bar-row two">${o.fuse || '<span></span>'}${o.right ? tk : ''}</div>` : ''}</div>
      <div class="desk-body">${body}${err ? `<div class="err" role="alert">${esc(err)}</div>` : ''}</div>${o.foot ? `<div class="desk-foot">${o.foot}</div>` : ''}</aside>`;
  }
  const slip = html => `<span class="slip">${html}</span>`;
  const stampMark = k => `<span class="env-stamp ${k}">${STAMP[k]}</span>`;
  const key = (a, label, on) => `<button class="btn primary wide" data-a="${a}" ${on === false ? 'disabled' : ''}>${label}</button>`;
  // a price is empty punch holes; paid ones are punched through
  const hrs = (n, paid) => `<i class="hrs${paid ? ' paid-h' : ''}" aria-hidden="true">${'<b></b>'.repeat(n)}</i>`;
  function inhSource(inh) {
    if (inh.kind === 'legacy') return '';
    if (inh.kind === 'cleanup') return `Leftovers <b>${inh.author === ME ? 'yours' : esc(nm(inh.author))}</b>`;
    if (inh.kind === 'autopilot') return 'Autopilot';
    return `From <b>${inh.author === ME ? 'yourself' : esc(nm(inh.author))}</b>${stampMark(inh.stamp)}`;
  }
  // work has two timed pages: the cards (strategy), then the cover page (the fun bit)
  const TIME = { cards: 45, dress: 35 };
  let timer = null;
  function stopTimer() { if (timer) clearInterval(timer.iv); timer = null; }
  function fuse(key, secs, onEnd) {
    if (!timer || timer.key !== key) {
      stopTimer();
      timer = { key, total: secs * 1000, end: Date.now() + secs * 1000, iv: null };
      if (!window.__opFreeze) timer.iv = setInterval(() => {
        const left = timer.end - Date.now(), el = document.querySelector('.fuse i');
        if (el) el.style.width = Math.max(0, left / timer.total * 100) + '%';
        if (left <= 0) { stopTimer(); onEnd(); }
      }, 200);
    }
    const pct = window.__opFreeze ? 64 : Math.max(0, (timer.end - Date.now()) / timer.total * 100);
    // a cigarette burning down in an ashtray; the unburnt paper is the time left
    return `<div class="fuse" role="timer" aria-label="Time left"><span class="ashtray"></span><span class="cig"><span class="filter"></span><span class="paper"><i style="width:${pct}%"></i></span></span></div>`;
  }
  // the marker lives on the desk; capped until you've blacked something out
  const marker = open => `<span class="marker${open ? ' open' : ''}" aria-hidden="true"><svg viewBox="0 0 120 26"><g class="pen"><path d="M6 13 L14 9.5 V16.5 Z" fill="#0B0B0D"/><rect x="14" y="8" width="10" height="10" rx="1.5" fill="#8E9197"/><rect x="24" y="6" width="84" height="14" rx="3" fill="#1B1C21"/><rect x="24" y="6" width="84" height="4" rx="2" fill="#fff" opacity=".12"/><rect x="50" y="7" width="34" height="12" fill="#ECE8DD"/><text x="67" y="15.6" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-weight="900" font-size="5.6" letter-spacing=".6" fill="#1B1C21">PERMANENT</text><rect x="106" y="7.5" width="6" height="11" rx="2" fill="#2A2B31"/></g><g class="cap"><rect x="2" y="5" width="36" height="16" rx="4" fill="#15161A"/><rect x="2" y="5" width="36" height="4.5" rx="2.5" fill="#fff" opacity=".14"/><rect x="30" y="2.5" width="5" height="21" rx="1.5" fill="#22232A"/></g></svg></span>`;
  // Finalise: the hand drops away, the policy squares up into a pile and a blank cover page lands on it
  // the tray won't take an unstamped page; if the clock runs out first, it's filed honestly
  function finalise(auto) {
    if (!draft || draft.page > 1 || ui.stuffing) return;
    if (!draft.stamp && auto !== true) {
      const st = document.querySelector('.rstamps');
      if (st) { st.classList.remove('want'); void st.offsetWidth; st.classList.add('want'); }
      return;
    }
    if (!draft.stamp) draft.stamp = OP.rightStamp(OP.workResult(S, ME, draft).prop);
    stopTimer();
    const next = S.reqStyle ? 3 : 2, play = document.querySelector('.play');
    if (!play || still()) { draft.page = next; render(); return; }
    ui.stuffing = true;
    const pol = play.querySelector('.policy');
    play.insertAdjacentHTML('beforeend', `<i class="stuff" aria-hidden="true" style="top:${pol ? pol.offsetTop + 2 : 2}px"></i>`);
    play.classList.add('stuff');
    setTimeout(() => { ui.stuffing = false; if (draft && S.phase === 'work') { draft.page = next; ui.arrive = true; render(); } }, 1250);
  }
  function seal() {
    const sel = window.getSelection && window.getSelection(); if (sel) sel.removeAllRanges();
    stopTimer();
    dispatch({ type: 'submitWork', discards: draft.discards, swaps: draft.swaps, redacts: draft.redacts, stamp: draft.stamp || 'Rec', style: draft.style,
      claim: null, nextStyle: draft.nextStyle });
    toast('Sealed.');
  }
  // the card that just came out of the shredder deals in
  const fresh = (zone, su) => ui.fresh && ui.fresh.zone === zone && ui.fresh.su === su;
  function deskWork() {
    const p = me(), inh = p.inh, wr = OP.workResult(S, ME, draft), cost = OP.workCost(draft);
    if (draft.page === 2) return deskTemplates(p);
    if (draft.page === 3) return deskTweak(p);
    const slot = (zone, su, card) => `<div class="slot" data-drop="${zone}" data-su="${su}">${card}</div>`;
    // tokens are inputs: hole chits on the hand, punched chits pinned to the policy cards they bought
    const paid = su => (draft.swaps.indexOf(su) + 1) + (draft.redacts.includes(su) ? 1 : 0);
    // an effect Modifier rewrites the other two right here, before you commit
    const fx = wr.prop[2].fx, blink = fx && ui.fxw !== wr.prop[2].w;
    ui.fxw = fx ? wr.prop[2].w : null;
    const env = [0, 1, 2].map(su => {
      const c0 = wr.prop[su], rv = draft.redacts.includes(su), n = paid(su);
      const hit = su < 2 && fx && c0.v !== 'V' && after(fx, c0.v) !== c0.v, c = hit ? Object.assign({}, c0, { v: after(fx, c0.v) }) : c0;
      const ok = rv || !OP.inkChosen(S) || costWith({ redacts: draft.redacts.concat(su) }) <= 3;
      return slot('env', su, cardHTML(c, `drag${rv ? ' redacted' : ''}${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}${fresh('env', su) ? ' fresh' : ''}${hit ? ` fxd fx-${fx}${blink ? ' blink' : ''}` : ''}`, `${n ? `<span class="paid">${hrs(n, true)}</span>` : ''}${hit ? `<s class="was ${tone(c0.v)}" aria-hidden="true">${fmt(c0.v)}</s>` : ''}`,
        `data-drag="env" data-su="${su}" role="button" tabindex="0" aria-pressed="${rv}" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${rv ? 'Blacked out' : OP.inkChosen(S) ? 'Black out for 1 input' : 'In the policy'}"`));
    }).join('');
    const hand = [0, 1, 2].map(su => {
      const c = wr.aside[su], on = draft.swaps.includes(su);
      const next = on ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su);
      const price = on ? 0 : OP.SWAP_COST[next.length] - OP.SWAP_COST[draft.swaps.length];
      const ok = costWith({ swaps: next }) <= 3;
      return slot('hand', su, cardHTML(c, `drag${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}${fresh('hand', su) ? ' fresh' : ''}`, on ? '<span class="tag back">↺</span>' : `<span class="tag">${hrs(price)}</span>`,
        `data-drag="hand" data-su="${su}" role="button" tabindex="0" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${on ? 'Swap back for free' : `Swap in for ${price} input${price === 1 ? '' : 's'}`}"`));
    }).join('');
    ui.land = null; const shredding = !!ui.fresh; ui.fresh = null;
    const v = evs(wr.prop), vol = wr.prop.some(c => c.v === 'V');
    const left = Math.max(0, 3 - cost), dealCls = ui.deal ? ' deal' : '';
    // a fresh quarter waits for the stripe wipe to clear before dealing
    const wait = ui.deal === true && ui.lastKey !== `${S.r}|${PHASE[S.phase]}` ? .85 : 0;
    ui.deal = false;
    const purse = `<span class="purse" role="img" aria-label="${left} of 3 inputs left"><span class="pc-band"><i class="pc-mk"></i><b>Your Input<br>Matters*</b></span><span class="pc-holes">${[0, 1, 2].map(k => `<i class="slotbox${k < 3 - left ? ' punched' : ''}"></i>`).join('')}</span><small>*3 per quarter</small></span>`;
    // the sentence on top: what the three cards say, coloured by suit, with the effect applied
    const said = { cards: wr.prop.map((c0, su) => su < 2 && fx && c0.v !== 'V' ? Object.assign({}, c0, { v: after(fx, c0.v) }) : c0), revealed: [0, 1, 2] };
    const src = inhSource(inh);
    const head = `<div class="said">${src ? `<span class="said-src">${src}</span>` : ''}<div class="said-row">${lineHTML(said, { all: true }).replace(/<\/p>$/, `<b class="sum ${tone(v)}" aria-label="Policy worth ${fmt(v)}${vol ? ', volatile' : ''}">${fmt(v)}${vol ? '<sup>?</sup>' : ''}</b></p>`)}${draft.stamp ? `<span class="said-stamp env-stamp ${draft.stamp}" aria-hidden="true">${STAMP[draft.stamp]}</span>` : ''}</div></div>`;
    // the shredder: drop any card in, pay 1 input, a fresh one of that suit takes its place
    const shreds = wr.shred.map((c, k) => `<i class="s-${c.s}" style="--k:${k}"></i>`).join('');
    const bin = `<div class="shredder${shredding ? ' chew' : ''}${costWith({ discards: draft.discards.concat({ pile: 'inh', su: 0 }) }) > 3 ? ' broke' : ''}" data-drop="bin" role="img" aria-label="Shredder: drop a card in to replace it for 1 input"><span class="sh-top"><i class="sh-mouth"></i></span><span class="sh-body"><b>Shred</b><span class="t-cost">${hrs(1)}</span></span><span class="sh-out">${shreds}</span></div>`;
    const honest = OP.rightStamp(wr.prop);
    // three rubber stamps standing on the blotter; the one you use leaves its mark on the sentence
    const stamps = `<div class="stampstrip rstamps" role="radiogroup" aria-label="Stamp">${Object.keys(STAMP).map(k => `<button class="rstamp s-${k}${k === honest ? ' right' : ''}" role="radio" data-a="stamp" data-v="${k}" aria-checked="${draft.stamp === k}" aria-pressed="${draft.stamp === k}"><i class="knob"></i><i class="neck"></i><span class="block"><span>${STAMP[k]}</span></span><i class="pad"></i></button>`).join('')}</div>`;
    const body = `<div class="play${dealCls}${S.r === 1 && !draft.swaps.length && !draft.discards.length ? ' nudge' : ''}" style="--wait:${wait}s">${head}<div class="policy">${env}</div><div class="hand-row"><div class="fan">${hand}</div></div>${bin}</div>${stamps}`;
    return deskWrap(OP.DEPTS[p.dept], body, { right: purse, fuse: fuse(`${S.r}-cards`, TIME.cards, () => finalise(true)) + (OP.inkChosen(S) ? marker(draft.redacts.length > 0) : ''), foot: '<button class="coverstack" data-a="finalise" aria-label="Cover it: put a cover page on the policy"><i class="cs-sheet"></i><i class="cs-sheet"></i><span class="cs-top"><i class="cs-band"></i><i class="cs-rule"></i><i class="cs-rule"></i></span><b class="cs-note">Cover it</b></button>' });
  }
  // the cover page: pick a template, then dress it. One timer across both
  const mockPage = p => ({ id: '·', style: draft.style, cards: OP.workResult(S, ME, draft).prop, stamp: draft.stamp || 'Rec', redacted: draft.redacts, author: ME, dept: p.dept });
  function deskTemplates(p) {
    const arrive = ui.arrive ? ' arrive' : ''; ui.arrive = false;
    const tiles = OP.TEMPLATES.map(t => `<button class="tpl" data-a="tpl" data-v="${t}" aria-pressed="${draft.style.tpl === t}" aria-label="${TPL[t].name}">${coverHTML(Object.assign(mockPage(p), { style: { tpl: t, art: draft.artSet ? draft.style.art : TPL[t].art } }), { k: .35, note: false })}</button>`).join('');
    return deskWrap(OP.DEPTS[p.dept], `<div class="tpls${arrive}">${tiles}</div>`, { fuse: fuse(`${S.r}-dress`, TIME.dress, seal), foot: '<button class="btn back wide" data-a="back">‹ Cards</button>' });
  }
  const ALIGN = { left: 'M3 5h14M3 10h9M3 15h12', center: 'M3 5h14M6 10h8M4 15h12', right: 'M3 5h14M8 10h9M5 15h12' };
  function deskTweak(p) {
    const locked = !!S.reqStyle, L = lookOf(mockPage(p));
    const arrive = ui.arrive ? ' arrive' : ''; ui.arrive = false;
    const designer = p.spec === 'Designer' ? `<label class="drop"><select id="next-style" data-in="nextStyle" aria-label="Next quarter's cover page"><option value="">Next quarter: any cover page</option>${OP.TEMPLATES.flatMap(t => OP.FONTS.map(f => `<option value="${t}/${f}" ${draft.nextStyle && draft.nextStyle.tpl === t && draft.nextStyle.font === f ? 'selected' : ''}>Next quarter: ${TPL[t].name} · ${FONTS[f]}</option>`)).join('')}</select></label>` : '';
    const fonts = OP.FONTS.map(f => `<button class="chip f-${f}" data-a="font" data-v="${f}" aria-pressed="${L.font === f}" aria-label="${FONTS[f]}" ${locked ? 'disabled' : ''}><span>Aa</span></button>`).join('');
    const aligns = Object.keys(ALIGN).map(a => `<button class="chip" data-a="align" data-v="${a}" aria-pressed="${L.align === a}" aria-label="Align ${a}"><span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="${ALIGN[a]}"/></svg></span></button>`).join('');
    const wheel = `<div class="wheel"><div class="wheel-in" role="listbox" aria-label="Clip-art" data-wheel>${ART.map(id => `<button class="px-opt" role="option" data-a="art" data-v="${id}" aria-selected="${L.art === id}" aria-label="${id.replace(/-/g, ' ')}">${artSVG(id)}</button>`).join('')}</div></div>`;
    const body = `<div class="preview${arrive}">${coverHTML(mockPage(p), { k: .6, tilt: -1.2 })}</div>
      <div class="dress-row"><div class="chips fonts">${fonts}</div><div class="chips aligns">${aligns}</div></div>${wheel}${designer}`;
    return deskWrap(OP.DEPTS[p.dept], body, { fuse: fuse(`${S.r}-dress`, TIME.dress, seal), foot: `<div class="two-keys"><button class="btn back" data-a="back">‹ ${locked ? 'Cards' : 'Templates'}</button><button class="outtray" data-a="seal" aria-label="Hand it in"><span class="ot-in"></span><span class="ot-front"><b>Out</b></span></button></div>` });
  }
  // the preview and the wheel change in place, so typing and swiping aren't interrupted
  function refreshPreview() {
    const pv = document.querySelector('.desk .preview'); if (pv && draft) pv.innerHTML = coverHTML(mockPage(me()), { k: .6, tilt: -1.2 });
  }
  const WHEEL = 60;
  function syncWheel() {
    const w = document.querySelector('[data-wheel]'); if (!w || !draft) return;
    w.scrollLeft = Math.max(0, ART.indexOf(lookOf(mockPage(me())).art)) * WHEEL;
  }
  function onWheel(w) {
    const id = ART[Math.max(0, Math.min(ART.length - 1, Math.round(w.scrollLeft / WHEEL)))];
    if (!draft || draft.style.art === id) return;
    draft.style.art = id; draft.artSet = true;
    w.querySelectorAll('[aria-selected="true"]').forEach(b => b.setAttribute('aria-selected', 'false'));
    const b = w.querySelector(`[data-v="${id}"]`); if (b) b.setAttribute('aria-selected', 'true');
    refreshPreview();
  }
  // pick-one grids: proposals as small cover pages, people as name tags
  // your own page, and every author for the Auditor; phone only
  const auditor = () => mine() && me().spec === 'Auditor' && !me().leave;
  const tagFor = e => !mine() || e.autopilot ? '' : e.author === ME ? '<i class="yours">You</i>' : auditor() ? `<i class="yours">${esc(nm(e.author))}</i>` : '';
  // the CEO reads the cover pages: big enough that the sentence on each is the thing being picked
  function rows(list, current) {
    return `<div class="prows">${list.map(e => `<button class="prow" data-a="sel" data-id="${e.id}" aria-pressed="${current === e.id}" aria-label="${ICON_NAMES[iconIdx(e.id)]}: ${esc(sayOf(e))}">
      ${coverHTML(e, { k: .54 })}${lineHTML(e, { all: e.openTo && mine() && e.openTo.includes(ME) })}${tagFor(e)}</button>`).join('')}</div>`;
  }
  function minis(list, current, none) {
    return `<div class="minis">${list.map(e => {
      const open = e.openTo && mine() && e.openTo.includes(ME);
      const peek = open || e.audited ? `<span class="peek">${e.cards.map((c, su) => open || e.audited ? `<b class="s-${su} ${tone(c.v)}">${GLYPH[c.v]}</b>` : `<i class="s-${su}">${brandMark()}</i>`).join('')}</span>` : '';
      return `<button class="mini" data-a="sel" data-id="${e.id}" aria-pressed="${current === e.id}" aria-label="${ICON_NAMES[iconIdx(e.id)]}: ${esc(sayOf(e))}">
        ${coverHTML(e, { k: .35 })}${peek}${tagFor(e)}</button>`;
    }).join('')}${none ? `<button class="mini none" data-a="sel" data-id="none" aria-pressed="${current === 'none'}">${none}</button>` : ''}</div>`;
  }
  function nameTags(list, current, none) {
    return `<div class="tags">${list.map(q => `<button class="nametag" data-a="sel" data-id="${q.id}" aria-pressed="${String(current) === String(q.id)}"><span class="hello">Hello<small>my name is</small></span><b>${esc(q.name)}</b>${stickers(q)}</button>`).join('')}
      ${none ? `<button class="nametag none" data-a="sel" data-id="none" aria-pressed="${String(current) === 'none'}"><span class="hello">Hello<small>my name is</small></span><b>${none}</b></button>` : ''}</div>`;
  }
  // whoever's tag is picked, written onto the form
  const picked = () => ui.sel == null ? '' : ui.sel === 'none' ? 'Nobody' : esc(nm(ui.sel));
  const boardSlip = () => S.board ? slip(S.board.overruled ? `Board overruled ${icon(S.board.nominee)} · ${S.board.own ? 'the CEO’s own' : S.board.author == null ? 'autopilot' : esc(nm(S.board.author))}` : S.board.opened ? `Opened ${icon(S.board.nominee)} · it stands` : `Board rubber-stamped ${icon(S.board.nominee)}`) : '';
  function resultSlip() {
    if (!S.result) return '';
    const e = S.envs.find(x => x.id === S.result.id); if (!e) return '';
    return slip(`${icon(S.result.id)} ${e.autopilot ? 'Autopilot' : esc(nm(S.result.author))} <b class="${tone(S.result.actual)}">${fmt(S.result.actual)}</b>`);
  }
  // the CEO may pull one file a quarter; what's in it stays between them and HR
  function filesHTML() {
    if (S.invq && S.invq.r === S.r) return `<div class="files"><div class="file pulled"><span class="file-tab">${esc(nm(S.invq.t))}</span><i class="file-stamp">Pulled</i></div></div>`;
    const list = S.P.filter(q => q.id !== ME && !q.pip && S.envs.some(e => e.author === q.id && !e.autopilot));
    if (!list.length) return '';
    return `<div class="slips">${slip('Pull a file')}</div><div class="files">${list.map(q => `<button class="file" data-a="sel" data-id="${q.id}" aria-pressed="${String(ui.sel) === String(q.id)}"><span class="file-tab">${esc(q.name)}</span></button>`).join('')}</div>
      ${signHTML('investigate', ui.sel != null && list.some(q => String(q.id) === String(ui.sel)), fField('Employee', list.some(q => String(q.id) === String(ui.sel)) ? picked() : ''))}`;
  }
  function deskSpectate() {
    const ph = S.phase;
    if (ph === 'end') return deskEnd();
    const label = { decide: 'See the decision', review: S.r < 5 ? `Start Q${S.r + 1}` : 'Whistleblower' }[ph];
    const bits = [];
    if (ph === 'review') bits.push(boardSlip(), resultSlip());
    if (S.warn && ph === 'review') bits.push(slip(S.warn.target == null ? 'No warning' : `Warning · <b>${esc(nm(S.warn.target))}</b> ${S.warn.passed ? 'passed' : 'failed'}`));
    return deskWrap('Observing', `<div class="slips">${bits.join('')}</div>`, { foot: label ? key('advance', label) : '' });
  }
  function deskEnd() {
    const sabs = S.P.filter(p => p.sab);
    const youWon = mine() ? (me().sab ? !S.win : S.win) : null;
    const line = S.win ? 'Shareholders are mildly pleased. Bonuses have been deferred.' : sabs.length ? 'The company sank, with help.' : 'The company failed entirely on its own merits.';
    const body = `<div class="sheet letter"><div class="role ${S.win ? 'loyal' : 'sab'}">${youWon == null ? (S.win ? 'Target met' : 'Target missed') : youWon ? 'You win' : 'You lose'}</div>
      <div class="num big">${fmt(S.profit)} <small>/ +${S.target}</small></div><div>${line}</div>
      <div class="hint">${sabs.length ? `Saboteur${sabs.length > 1 ? 's' : ''}: <b>${sabs.map(p => esc(p.name)).join(', ')}</b>` : 'No saboteur'}</div></div>`;
    return deskWrap('Final figures', body, { foot: `<div class="two-keys"><button class="btn back" data-a="quit">Settings</button>${key('again', 'Again')}</div>` });
  }
  function desk() {
    if (S.spectate) return deskSpectate();
    const p = me(), ph = S.phase;
    if (ph === 'brief') {
      // a typed memo on letterhead; the only thing that matters is the rubber stamp
      const fine = p.sab ? 'Make sure it misses. Quietly.' : S.n >= 6 ? 'Up to two saboteurs. Possibly none.' : 'Possibly a saboteur. Possibly not.';
      const body = `<div class="memo-sheet">
        <div class="lh"><span class="logo-mark" aria-hidden="true">${brandMark()}</span><span class="lh-name"><span class="brand-name">${esc(brand().name)}</span> ${esc(brand().suffix)}<small>People &amp; Culture</small></span><span class="lh-ref">Q0 / HR / ${String(S.seed % 1000).padStart(3, '0')}</span></div>
        <div class="memo-row"><span>To</span>${ui.badge ? `<img class="ink-name" src="${ui.badge}" alt="You">` : '<b>You</b>'}</div>
        <div class="memo-row"><span>Re</span><b>Your allegiance</b></div>
        <div class="memo-row"><span>Target</span><b>+${S.target}</b> by Q5</div>
        <div class="memo-stamp ${p.sab ? 'sab' : 'loyal'}">${p.sab ? 'Saboteur' : 'Loyal'}</div>
        ${p.spec ? `<div class="memo-spec">${p.spec}</div>` : ''}
        <div class="memo-fine">${fine}</div>
        <svg class="memo-sig" viewBox="0 0 160 40" aria-hidden="true"><path d="M4 30c10-18 18-24 22-16s-8 18 2 12 14-22 20-16-6 20 4 14 10-14 16-10 2 12 10 8 12-10 20-8 6 8 14 4 14-6 20-4"/></svg>
      </div>`;
      return deskWrap('Strictly confidential', body, { foot: key('begin', 'Start Q1') });
    }
    if (ph === 'work' && draft) return deskWork();
    const leave = p.leave ? slip('Stood down') : '';
    if (ph === 'decide') {
      if (isCEO()) return deskWrap('You are CEO', `${rows(S.envs.slice().sort((a, b) => a.id.localeCompare(b.id)), ui.sel)}`, { foot: key('approve', ui.sel ? `Nominate ${icon(ui.sel)}` : 'Nominate', !!ui.sel) });
      const own = S.envs.find(e => !e.autopilot && e.author === ME);
      return deskWrap(`${esc(nm(S.ceo))} is CEO`, `${leave}${auditor() ? rows(S.envs.slice().sort((a, b) => a.id.localeCompare(b.id)), null) : own ? `<div class="board-nom own">${coverHTML(own, { k: .6 })}${lineHTML(own)}</div>` : ''}`, { foot: key('advance', 'See the decision') });
    }
    if (ph === 'board') {
      const nom = S.envs.find(e => e.id === S.nominee);
      const body = `<div class="slips">${slip(`${esc(nm(S.ceo))} nominated ${icon(S.nominee)}${auditor() && !nom.autopilot ? ` · by <b>${nom.author === ME ? 'you' : esc(nm(nom.author))}</b>` : ''}`)}</div><div class="board-nom">${coverHTML(nom, { k: .6 })}${lineHTML(nom, { all: nom.openTo && nom.openTo.includes(ME) })}</div>`;
      const opts = `<div class="f-opts" role="radiogroup" aria-label="Board vote">${fBox('ratify', 'Rubber-stamp it')}${fBox('open', 'Open it up')}</div>`;
      return deskWrap('Board vote', `${leave}${body}${signHTML('board', ui.sel === 'ratify' || ui.sel === 'open', opts)}`);
    }
    if (ph === 'reveal') {
      const list = S.P.filter(q => q.id !== ME && !q.leave);
      const won = S.envs.find(e => e.approved), go = won && ui.lineAnim !== S.r && !still();
      if (go) ui.lineAnim = S.r;
      return deskWrap('Written Warning', `<div class="slips">${boardSlip()}${resultSlip()}</div>${won ? lineHTML(won, { anim: go }) : ''}${nameTags(list, ui.sel, 'Nobody')}${signHTML('warn', ui.sel != null, fField('Issued to', picked()))}`);
    }
    if (ph === 'review') {
      const w = S.warn;
      const won = S.envs.find(e => e.approved), got = stickers(p, S.r);
      return deskWrap('Quarter closed', `<div class="slips">${resultSlip()}${slip(w.target == null ? 'No warning' : `Warning · <b>${esc(nm(w.target))}</b> ${w.passed ? 'passed' : 'failed'}`)}</div>${won ? lineHTML(won, { all: true }) : ''}
        ${isCEO() ? filesHTML() : ''}<div class="tags one"><div class="nametag mine"><span class="hello">Hello<small>my name is</small></span><b>${esc(p.name)}</b>${got || '<span class="stickers"><i class="stk grey">Present</i></span>'}</div></div>`, { foot: key('advance', S.r < 5 ? `Start Q${S.r + 1}` : 'Whistleblower') });
    }
    if (ph === 'whistle') {
      return deskWrap('Whistleblower', `<div class="slips">${slip(`<b class="pos">+</b> · <b class="neg">−3</b>`)}</div>${nameTags(S.P.filter(q => q.id !== ME), ui.sel, 'Nobody')}${signHTML('whistle', ui.sel != null, fField('The Mole is', picked()))}`);
    }
    if (ph === 'end') return deskEnd();
    return deskWrap(PHASE[ph], '');
  }

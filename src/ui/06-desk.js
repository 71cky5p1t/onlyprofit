  // ---------- desk: your phone. Objects on the felt, same as the TV; almost no prose ----------
  // a bakelite header bar (nameplate, time card, timer tape) and a footer bar that holds the one key that matters
  function deskWrap(title, body, o) {
    o = o || {};
    return `<aside class="desk" aria-label="Your desk"><div class="desk-head"><div class="bar-row"><h3 class="plate">${title}</h3>${o.right || ''}</div>${o.fuse || ''}</div>
      <div class="desk-body">${body}${err ? `<div class="err" role="alert">${esc(err)}</div>` : ''}</div>${o.foot ? `<div class="desk-foot">${o.foot}</div>` : ''}</aside>`;
  }
  const slip = html => `<span class="slip">${html}</span>`;
  const stampMark = k => `<span class="env-stamp ${k}">${STAMP[k]}</span>`;
  const key = (a, label, on) => `<button class="btn primary wide" data-a="${a}" ${on === false ? 'disabled' : ''}>${label}</button>`;
  const hrs = n => `<i class="hrs">${n}h</i>`;
  function inhSource(inh) {
    if (inh.kind === 'legacy') return 'Legacy';
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
    return `<div class="fuse" role="timer" aria-label="Time left"><i style="width:${pct}%"></i></div>`;
  }
  // Finalise: the hand drops away, the policy squares up into a pile and a blank cover page lands on it
  function finalise() {
    if (!draft || draft.page > 1 || ui.stuffing) return;
    if (!draft.stamp) draft.stamp = 'Rec';
    stopTimer();
    const next = S.reqStyle ? 3 : 2, play = document.querySelector('.play');
    if (!play || still()) { draft.page = next; render(); return; }
    ui.stuffing = true;
    play.insertAdjacentHTML('beforeend', '<i class="stuff" aria-hidden="true"></i>');
    play.classList.add('stuff');
    setTimeout(() => { ui.stuffing = false; if (draft && S.phase === 'work') { draft.page = next; ui.arrive = true; render(); } }, 1250);
  }
  function seal() {
    const sel = window.getSelection && window.getSelection(); if (sel) sel.removeAllRanges();
    stopTimer();
    dispatch({ type: 'submitWork', redeal: draft.redeal, swaps: draft.swaps, reveals: draft.reveals, stamp: draft.stamp || 'Rec', subject: subjectOf(draft), style: draft.style,
      claim: null, nextStyle: draft.nextStyle });
    toast('Sealed.');
  }
  function deskWork() {
    const p = me(), inh = p.inh, wr = OP.workResult(S, ME, draft), cost = OP.workCost(draft);
    if (draft.page === 2) return deskTemplates(p);
    if (draft.page === 3) return deskTweak(p);
    const slot = (zone, su, card) => `<div class="slot" data-drop="${zone}" data-su="${su}">${card}</div>`;
    // tokens are overtime hours: chits on the hand, punched chits pinned to the policy cards they bought
    const paid = su => (draft.swaps.indexOf(su) + 1) + (draft.reveals.includes(su) ? 1 : 0);
    const env = [0, 1, 2].map(su => {
      const c = wr.prop[su], rv = draft.reveals.includes(su), n = paid(su);
      const ok = rv || costWith({ reveals: draft.reveals.concat(su) }) <= 3;
      return slot('env', su, cardHTML(c, `drag${rv ? ' shown' : ''}${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}`, n ? `<span class="paid">${hrs(n)}</span>` : '',
        `data-drag="env" data-su="${su}" role="button" tabindex="0" aria-pressed="${rv}" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${rv ? 'Shown to the table' : 'Show to the table for 1 hour of overtime'}"`));
    }).join('');
    const hand = [0, 1, 2].map(su => {
      const c = wr.aside[su], on = draft.swaps.includes(su);
      const next = on ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su);
      const price = on ? 0 : OP.SWAP_COST[next.length] - OP.SWAP_COST[draft.swaps.length];
      const ok = costWith({ swaps: next }) <= 3;
      return slot('hand', su, cardHTML(c, `drag${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}`, on ? '<span class="tag back">↺</span>' : `<span class="tag">${hrs(price)}</span>`,
        `data-drag="hand" data-su="${su}" role="button" tabindex="0" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${on ? 'Swap back for free' : `Swap in for ${price} hour${price === 1 ? '' : 's'} of overtime`}"`));
    }).join('');
    ui.land = null;
    const v = evs(wr.prop), vol = wr.prop.some(c => c.v === 'V');
    const canRedeal = !draft.redeal && costWith({ redeal: true }) <= 3;
    const left = Math.max(0, 3 - cost), dealCls = ui.deal ? (ui.deal === 'redeal' ? ' deal redeal' : ' deal') : '';
    // a fresh quarter waits for the stripe wipe to clear before dealing
    const wait = ui.deal === true && ui.lastKey !== `${S.r}|${PHASE[S.phase]}` ? .85 : 0;
    ui.deal = false;
    const purse = `<span class="purse" role="img" aria-label="${left} of 3 overtime hours left">${[0, 1, 2].map(k => `<i class="slotbox${k >= left ? ' punched' : ''}">${k + 1}</i>`).join('')}</span>`;
    // one strip of adding-machine tape between the policy and the hand: where it came from, what it's worth, re-deal
    const tray = `<div class="tape"><span class="t-src">${inhSource(inh)}</span>
        <span class="t-worth ${tone(v)}" aria-label="Policy worth ${fmt(v)}${vol ? ', volatile' : ''}">${fmt(v)}${vol ? '<small>±2</small>' : ''}</span>
        <button class="t-redeal" data-a="redeal" ${canRedeal ? '' : 'disabled'} aria-label="Re-deal the inherited three for 2 hours of overtime">${draft.redeal ? 'Re-dealt' : '↻ Re-deal'}<span class="t-cost">${hrs(2)}</span></button></div>`;
    const stamps = `<div class="bar3 stampstrip" role="radiogroup" aria-label="Stamp">${Object.keys(STAMP).map(k => `<button class="s-${k}" role="radio" data-a="stamp" data-v="${k}" aria-checked="${draft.stamp === k}" aria-pressed="${draft.stamp === k}"><span>${STAMP[k]}</span></button>`).join('')}</div>`;
    const body = `<div class="play${dealCls}" style="--wait:${wait}s"><div class="policy">${env}</div>${tray}<div class="fan">${hand}</div></div>${stamps}`;
    return deskWrap(OP.DEPTS[p.dept], body, { right: purse, fuse: fuse(`${S.r}-cards`, TIME.cards, finalise), foot: key('finalise', 'Finalise') });
  }
  // the cover page: pick a template, then dress it. One timer across both
  const mockPage = p => ({ id: '·', style: draft.style, subject: subjectOf(draft), stamp: draft.stamp || 'Rec', revealed: [], author: ME, dept: p.dept });
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
    const fonts = OP.FONTS.map(f => `<button class="chip f-${f}" data-a="font" data-v="${f}" aria-pressed="${L.font === f}" aria-label="${FONTS[f]}" ${locked ? 'disabled' : ''}>Aa</button>`).join('');
    const aligns = Object.keys(ALIGN).map(a => `<button class="chip" data-a="align" data-v="${a}" aria-pressed="${L.align === a}" aria-label="Align ${a}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="${ALIGN[a]}"/></svg></button>`).join('');
    const wheel = `<div class="wheel"><div class="wheel-in" role="listbox" aria-label="Clip-art" data-wheel>${ART.map(id => `<button class="px-opt" role="option" data-a="art" data-v="${id}" aria-selected="${L.art === id}" aria-label="${id.replace(/-/g, ' ')}">${artSVG(id)}</button>`).join('')}</div><i class="wheel-frame" aria-hidden="true"></i></div>`;
    const body = `<div class="preview${arrive}">${coverHTML(mockPage(p), { k: .6, tilt: -1.2 })}</div>
      <div class="subj">${draft.words.map((k, i) => `<button class="subj-word" data-a="reroll" data-i="${i}" ${draft.useCustom ? 'disabled' : ''}>${esc((S.subj || OP.SUBJ)[i][k])}</button>`).join('')}</div>
      <input class="input" id="custom-subject" data-in="custom" maxlength="80" placeholder="Or write your own…" value="${esc(draft.custom)}">
      <div class="dress-row"><div class="chips fonts">${fonts}</div><div class="chips aligns">${aligns}</div></div>${wheel}${designer}`;
    return deskWrap(OP.DEPTS[p.dept], body, { fuse: fuse(`${S.r}-dress`, TIME.dress, seal), foot: `<div class="two-keys"><button class="btn back" data-a="back">‹ ${locked ? 'Cards' : 'Templates'}</button>${key('seal', 'Hand it in')}</div>` });
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
  function minis(list, current, none) {
    return `<div class="minis">${list.map(e => {
      const peek = e.audited || e.revealed.length ? `<span class="peek">${e.cards.map((c, su) => e.audited || e.revealed.includes(su) ? `<b class="s-${su} ${tone(c.v)}">${GLYPH[c.v]}</b>` : `<i class="s-${su}">${brandMark()}</i>`).join('')}</span>` : '';
      return `<button class="mini" data-a="sel" data-id="${e.id}" aria-pressed="${current === e.id}" aria-label="${ICON_NAMES[iconIdx(e.id)]}: ${esc(e.subject)}">
        ${coverHTML(e, { k: .35 })}${peek}${mine() && e.author === ME ? '<i class="yours">You</i>' : ''}</button>`;
    }).join('')}${none ? `<button class="mini none" data-a="sel" data-id="none" aria-pressed="${current === 'none'}">${none}</button>` : ''}</div>`;
  }
  function nameTags(list, current, none) {
    return `<div class="tags">${list.map(q => `<button class="nametag" data-a="sel" data-id="${q.id}" aria-pressed="${String(current) === String(q.id)}"><span class="hello">Hello<small>my name is</small></span><b>${esc(q.name)}</b>${stickers(q)}</button>`).join('')}
      ${none ? `<button class="nametag none" data-a="sel" data-id="none" aria-pressed="${String(current) === 'none'}"><b>${none}</b></button>` : ''}</div>`;
  }
  const boardSlip = () => S.board ? slip(S.board.overruled ? `Board overruled ${icon(S.board.nominee)} · ${S.board.own ? 'the CEO’s own' : S.board.author == null ? 'autopilot' : esc(nm(S.board.author))}` : S.board.opened ? `Opened ${icon(S.board.nominee)} · it stands` : `Board ratified ${icon(S.board.nominee)}`) : '';
  function resultSlip() {
    if (!S.result) return '';
    const e = S.envs.find(x => x.id === S.result.id); if (!e) return '';
    return slip(`${icon(S.result.id)} ${e.autopilot ? 'Autopilot' : esc(nm(S.result.author))} <b class="${tone(S.result.actual)}">${fmt(S.result.actual)}</b>`);
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
        ${p.spec ? `<div class="memo-spec">${p.spec}<small>${p.spec === 'Auditor' ? 'you see who wrote every proposal' : 'you choose next quarter’s cover page'}</small></div>` : ''}
        <div class="memo-fine">${fine}</div>
        <svg class="memo-sig" viewBox="0 0 160 40" aria-hidden="true"><path d="M4 30c10-18 18-24 22-16s-8 18 2 12 14-22 20-16-6 20 4 14 10-14 16-10 2 12 10 8 12-10 20-8 6 8 14 4 14-6 20-4"/></svg>
      </div>`;
      return deskWrap('Strictly confidential', body, { foot: key('begin', 'Start Q1') });
    }
    if (ph === 'work' && draft) return deskWork();
    const leave = p.leave ? slip('Stood down') : '';
    if (ph === 'decide') {
      if (isCEO()) return deskWrap('You are CEO', `${minis(S.envs.slice().sort((a, b) => a.id.localeCompare(b.id)), ui.sel)}`, { foot: key('approve', ui.sel ? `Nominate ${icon(ui.sel)}` : 'Nominate', !!ui.sel) });
      return deskWrap(`${esc(nm(S.ceo))} is CEO`, `${leave}`, { foot: key('advance', 'See the decision') });
    }
    if (ph === 'board') {
      const nom = S.envs.find(e => e.id === S.nominee);
      const body = `<div class="slips">${slip(`${esc(nm(S.ceo))} nominated ${icon(S.nominee)}`)}</div><div class="board-nom">${coverHTML(nom, { k: .6 })}${lineHTML(nom)}</div>
        <div class="bar3 two" role="radiogroup" aria-label="Board vote">${['ratify', 'open'].map(v => `<button class="b-${v}" role="radio" data-a="sel" data-id="${v}" aria-checked="${ui.sel === v}" aria-pressed="${ui.sel === v}"><span>${v === 'ratify' ? 'Ratify' : 'Open it'}</span></button>`).join('')}</div>`;
      return deskWrap('Board vote', `${leave}${body}`, { foot: key('board', 'Sign', ui.sel === 'ratify' || ui.sel === 'open') });
    }
    if (ph === 'reveal') {
      const list = S.P.filter(q => q.id !== ME && !q.leave);
      const won = S.envs.find(e => e.approved), go = won && ui.lineAnim !== S.r && !still();
      if (go) ui.lineAnim = S.r;
      return deskWrap('Written Warning', `<div class="slips">${boardSlip()}${resultSlip()}</div>${won ? lineHTML(won, { anim: go }) : ''}${nameTags(list, ui.sel, 'Nobody')}`, { foot: key('warn', 'Vote', ui.sel != null) });
    }
    if (ph === 'review') {
      const w = S.warn;
      return deskWrap('Quarter closed', `<div class="slips">${resultSlip()}${slip(w.target == null ? 'No warning' : `Warning · <b>${esc(nm(w.target))}</b> ${w.passed ? 'passed' : 'failed'}`)}</div>`, { foot: key('advance', S.r < 5 ? `Start Q${S.r + 1}` : 'Whistleblower') });
    }
    if (ph === 'whistle') {
      return deskWrap('Name a saboteur', `<div class="slips">${slip(`Right: <b class="pos">Clawback</b> · wrong <b class="neg">−3</b>`)}</div>${nameTags(S.P.filter(q => q.id !== ME), ui.sel, 'Nobody')}`, { foot: key('whistle', 'Vote', ui.sel != null) });
    }
    if (ph === 'end') return deskEnd();
    return deskWrap(PHASE[ph], '');
  }

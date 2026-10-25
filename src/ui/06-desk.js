  // ---------- desk: your phone. Objects on the felt, same as the TV; almost no prose ----------
  // a bakelite header bar (nameplate, coins, timer tape) and a footer bar that holds the one key that matters
  function deskWrap(title, body, o) {
    o = o || {};
    return `<aside class="desk" aria-label="Your desk"><div class="desk-head"><div class="bar-row"><h3 class="plate">${title}</h3>${o.right || ''}</div>${o.fuse || ''}</div>
      <div class="desk-body">${body}${err ? `<div class="err" role="alert">${esc(err)}</div>` : ''}</div>${o.foot ? `<div class="desk-foot">${o.foot}</div>` : ''}</aside>`;
  }
  const slip = html => `<span class="slip">${html}</span>`;
  const stampMark = k => `<span class="env-stamp ${k}">${STAMP[k]}</span>`;
  const key = (a, label, on) => `<button class="btn primary wide" data-a="${a}" ${on === false ? 'disabled' : ''}>${label}</button>`;
  const coins = n => '<i class="coin"></i>'.repeat(n);
  function inhSource(inh) {
    if (inh.kind === 'legacy') return 'Legacy';
    if (inh.kind === 'cleanup') return `Leftovers <b>${inh.author === ME ? 'yours' : esc(nm(inh.author))}</b>`;
    if (inh.kind === 'autopilot') return 'Autopilot';
    return `From <b>${inh.author === ME ? 'yourself' : esc(nm(inh.author))}</b>${stampMark(inh.stamp)}`;
  }
  // work has two timed pages: the cards (strategy), then dressing the envelope (the fun bit)
  const TIME = { cards: 45, dress: 20 };
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
  // Finalise: the hand drops away, the policy slides together and is stuffed into an envelope, then styling opens
  function finalise() {
    if (!draft || draft.page === 2 || ui.stuffing) return;
    if (!draft.stamp) draft.stamp = 'Rec';
    stopTimer();
    const play = document.querySelector('.play');
    if (!play || still()) { draft.page = 2; render(); return; }
    ui.stuffing = true;
    play.style.setProperty('--env', `var(--env-${draft.style.color})`);
    play.insertAdjacentHTML('beforeend', '<i class="stuff back" aria-hidden="true"></i><i class="stuff front" aria-hidden="true"></i><i class="stuff flap" aria-hidden="true"></i>');
    play.classList.add('stuff');
    setTimeout(() => { ui.stuffing = false; if (draft && S.phase === 'work') { draft.page = 2; ui.arrive = true; render(); } }, 1450);
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
    if (draft.page === 2) return deskDress(p, wr);
    const slot = (zone, su, card) => `<div class="slot" data-drop="${zone}" data-su="${su}">${card}</div>`;
    // tokens are coins: price tags on the hand, paid coins sit on the policy card they bought
    const paid = su => (draft.swaps.indexOf(su) + 1) + (draft.reveals.includes(su) ? 1 : 0);
    const env = [0, 1, 2].map(su => {
      const c = wr.prop[su], rv = draft.reveals.includes(su), n = paid(su);
      const ok = rv || costWith({ reveals: draft.reveals.concat(su) }) <= 3;
      return slot('env', su, cardHTML(c, `drag${rv ? ' shown' : ''}${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}`, `<i class="eye" aria-hidden="true"></i>${n ? `<span class="coins paid">${coins(n)}</span>` : ''}`,
        `data-drag="env" data-su="${su}" role="button" tabindex="0" aria-pressed="${rv}" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${rv ? 'Shown to the table' : 'Show to the table for 1 token'}"`));
    }).join('');
    const hand = [0, 1, 2].map(su => {
      const c = wr.aside[su], on = draft.swaps.includes(su);
      const next = on ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su);
      const price = on ? 0 : OP.SWAP_COST[next.length] - OP.SWAP_COST[draft.swaps.length];
      const ok = costWith({ swaps: next }) <= 3;
      return slot('hand', su, cardHTML(c, `drag${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}`, on ? '<span class="tag back">↺</span>' : `<span class="tag">${coins(price)}</span>`,
        `data-drag="hand" data-su="${su}" role="button" tabindex="0" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${on ? 'Swap back for free' : `Swap into the envelope for ${price} token${price === 1 ? '' : 's'}`}"`));
    }).join('');
    ui.land = null;
    const v = evs(wr.prop), vol = wr.prop.some(c => c.v === 'V');
    const canRedeal = !draft.redeal && costWith({ redeal: true }) <= 3;
    const left = Math.max(0, 3 - cost), dealCls = ui.deal ? (ui.deal === 'redeal' ? ' deal redeal' : ' deal') : '';
    // a fresh quarter waits for the stripe wipe to clear before dealing
    const wait = ui.deal === true && ui.lastKey !== `${S.r}|${PHASE[S.phase]}` ? .85 : 0;
    ui.deal = false;
    const purse = `<span class="purse" role="img" aria-label="${left} of 3 tokens left">${coins(left)}${'<i class="coin spent"></i>'.repeat(3 - left)}</span>`;
    // one strip of adding-machine tape between the policy and the hand: where it came from, what it's worth, re-deal
    const tray = `<div class="tape"><span class="t-src">${inhSource(inh)}</span>
        <span class="t-worth ${tone(v)}" aria-label="Policy worth ${fmt(v)}${vol ? ', volatile' : ''}">${fmt(v)}${vol ? '<small>±2</small>' : ''}</span>
        <button class="t-redeal" data-a="redeal" ${canRedeal ? '' : 'disabled'} aria-label="Re-deal the inherited three for 2 tokens">${draft.redeal ? 'Re-dealt' : '↻ Re-deal'}<span class="t-cost">${coins(2)}</span></button></div>`;
    const stamps = `<div class="bar3 stampstrip" role="radiogroup" aria-label="Stamp">${Object.keys(STAMP).map(k => `<button class="s-${k}" role="radio" data-a="stamp" data-v="${k}" aria-checked="${draft.stamp === k}" aria-pressed="${draft.stamp === k}"><span>${STAMP[k]}</span></button>`).join('')}</div>`;
    const body = `<div class="play${dealCls}" style="--wait:${wait}s"><div class="policy">${env}</div>${tray}<div class="fan">${hand}</div></div>${stamps}`;
    return deskWrap(OP.DEPTS[p.dept], body, { right: purse, fuse: fuse(`${S.r}-cards`, TIME.cards, finalise), foot: key('finalise', 'Finalise') });
  }
  function deskDress(p, wr) {
    const locked = !!S.reqStyle;
    const mock = { id: '·', style: draft.style, subject: subjectOf(draft), stamp: draft.stamp || 'Rec', cards: wr.prop, revealed: [], author: ME, dept: p.dept };
    const arrive = ui.arrive ? ' arrive' : ''; ui.arrive = false;
    const designer = p.spec === 'Designer' ? `<div class="row-l"><span class="label">Next quarter</span><label class="drop"><select id="next-style" data-in="nextStyle"><option value="">Any envelope</option>${OP.COLORS.flatMap(c => OP.TRIMS.map(t => `<option value="${c}/${t}" ${draft.nextStyle && draft.nextStyle.color === c && draft.nextStyle.trim === t ? 'selected' : ''}>${c} · ${t}</option>`)).join('')}</select></label></div>` : '';
    const body = `<div class="preview${arrive}">${envHTML(mock, { preview: true })}</div>
      <div class="subj">${draft.words.map((k, i) => `<button class="subj-word" data-a="reroll" data-i="${i}" ${draft.useCustom ? 'disabled' : ''}>${esc((S.subj || OP.SUBJ)[i][k])}</button>`).join('')}</div>
      <input class="input" id="custom-subject" data-in="custom" maxlength="80" placeholder="Or write your own…" value="${esc(draft.custom)}">
      <div class="styles">${OP.COLORS.map(c => `<button class="swatch" style="background:var(--env-${c})" data-a="color" data-v="${c}" aria-pressed="${draft.style.color === c}" aria-label="${c}" ${locked ? 'disabled' : ''}></button>`).join('')}
        <span class="sep"></span>${OP.TRIMS.map(t => `<button class="trim-btn" data-a="trim" data-v="${t}" aria-pressed="${draft.style.trim === t}" ${locked ? 'disabled' : ''}>${t}</button>`).join('')}</div>
      ${designer}`;
    return deskWrap(OP.DEPTS[p.dept], body, { fuse: fuse(`${S.r}-dress`, TIME.dress, seal), foot: `<div class="two-keys"><button class="btn back" data-a="back">‹ Cards</button>${key('seal', 'Seal')}</div>` });
  }
  // pick-one grids: envelopes as small envelopes, people as name tags
  function minis(list, current, none) {
    return `<div class="minis">${list.map(e => {
      const peek = e.audited || e.revealed.length ? `<span class="peek">${e.cards.map((c, su) => e.audited || e.revealed.includes(su) ? `<b class="s-${su} ${tone(c.v)}">${GLYPH[c.v]}</b>` : `<i class="s-${su}">${brandMark()}</i>`).join('')}</span>` : '';
      return `<button class="mini c-${e.style.color} t-${e.style.trim}" data-a="sel" data-id="${e.id}" aria-pressed="${current === e.id}" aria-label="Envelope ${ICON_NAMES[iconIdx(e.id)]}: ${esc(e.subject)}">
        ${peek}<span class="mid">${icon(e.id)}</span>${stampMark(e.stamp)}<span class="ms">${esc(e.subject)}</span>${mine() && e.author === ME ? '<i class="yours">You</i>' : ''}</button>`;
    }).join('')}${none ? `<button class="mini none" data-a="sel" data-id="none" aria-pressed="${current === 'none'}">${none}</button>` : ''}</div>`;
  }
  function nameTags(list, current, none) {
    return `<div class="tags">${list.map(q => `<button class="nametag" data-a="sel" data-id="${q.id}" aria-pressed="${String(current) === String(q.id)}"><span class="hello">Hello<small>my name is</small></span><b>${esc(q.name)}</b>${stickers(q)}</button>`).join('')}
      ${none ? `<button class="nametag none" data-a="sel" data-id="none" aria-pressed="${String(current) === 'none'}"><b>${none}</b></button>` : ''}</div>`;
  }
  const boardSlip = () => S.board ? slip(S.board.overruled ? `Board overruled ${icon(S.board.nominee)} · ${S.board.own ? 'the CEO’s own' : S.board.author == null ? 'autopilot' : esc(nm(S.board.author))}` : `Board ratified ${icon(S.board.nominee)}`) : '';
  const auditSlip = () => S.audit ? slip(S.audit.winner === 'none' ? 'Nothing audited' : `Audited ${icon(S.audit.winner)}`) : '';
  function resultSlip() {
    if (!S.result) return '';
    const e = S.envs.find(x => x.id === S.result.id); if (!e) return '';
    return slip(`${icon(S.result.id)} ${e.autopilot ? 'Autopilot' : esc(nm(S.result.author))} <b class="${tone(S.result.actual)}">${fmt(S.result.actual)}</b>`);
  }
  function deskSpectate() {
    const ph = S.phase;
    if (ph === 'end') return deskEnd();
    const label = { decide: 'See the decision', review: S.r < 5 ? `Start Q${S.r + 1}` : 'Whistleblower' }[ph];
    const bits = [auditSlip()];
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
        ${p.spec ? `<div class="memo-spec">${p.spec}<small>${p.spec === 'Auditor' ? 'you see who wrote every envelope' : 'you choose next quarter’s envelope'}</small></div>` : ''}
        <div class="memo-fine">${fine}</div>
        <svg class="memo-sig" viewBox="0 0 160 40" aria-hidden="true"><path d="M4 30c10-18 18-24 22-16s-8 18 2 12 14-22 20-16-6 20 4 14 10-14 16-10 2 12 10 8 12-10 20-8 6 8 14 4 14-6 20-4"/></svg>
      </div>`;
      return deskWrap('Strictly confidential', body, { foot: key('begin', 'Start Q1') });
    }
    if (ph === 'work' && draft) return deskWork();
    const leave = p.leave ? slip('Stood down') : '';
    if (ph === 'pitch') {
      const list = S.envs.filter(e => !e.autopilot).sort((a, b) => a.id.localeCompare(b.id));
      return deskWrap('Audit vote', `${leave}${minis(list, ui.sel, 'Open nothing')}`, { foot: key('audit', ui.sel && ui.sel !== 'none' ? `Open ${icon(ui.sel)}` : 'Vote', !!ui.sel) });
    }
    if (ph === 'decide') {
      if (isCEO()) return deskWrap('You are CEO', `<div class="slips">${auditSlip()}</div>${minis(S.envs.slice().sort((a, b) => a.id.localeCompare(b.id)), ui.sel)}`, { foot: key('approve', ui.sel ? `Nominate ${icon(ui.sel)}` : 'Nominate', !!ui.sel) });
      return deskWrap(`${esc(nm(S.ceo))} is CEO`, `${leave}<div class="slips">${auditSlip()}</div>`, { foot: key('advance', 'See the decision') });
    }
    if (ph === 'board') {
      const nom = S.envs.find(e => e.id === S.nominee);
      const body = `<div class="slips">${auditSlip()}${slip(`${esc(nm(S.ceo))} nominated ${icon(S.nominee)}`)}</div><div class="board-nom">${envHTML(nom, {})}</div>
        <div class="bar3 two" role="radiogroup" aria-label="Board vote">${['ratify', 'overrule'].map(v => `<button class="b-${v}" role="radio" data-a="sel" data-id="${v}" aria-checked="${ui.sel === v}" aria-pressed="${ui.sel === v}"><span>${v === 'ratify' ? 'Ratify' : 'Overrule'}</span></button>`).join('')}</div>`;
      return deskWrap('Board vote', `${leave}${body}`, { foot: key('board', 'Sign', ui.sel === 'ratify' || ui.sel === 'overrule') });
    }
    if (ph === 'reveal') {
      const list = S.P.filter(q => q.id !== ME && !q.leave);
      return deskWrap('Written Warning', `<div class="slips">${boardSlip()}${resultSlip()}</div>${nameTags(list, ui.sel, 'Nobody')}`, { foot: key('warn', 'Vote', ui.sel != null) });
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

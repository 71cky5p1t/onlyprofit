  // work has two timed pages: the cards (strategy), then the cover page (the fun bit)
  const TIME = { cards: 60, dress: 35 };
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
    dispatch({ type: 'submitWork', redeal: draft.redeal, swaps: draft.swaps, picks: draft.picks, reveals: draft.reveals, stamp: draft.stamp || 'Rec', subject: subjectOf(draft), style: draft.style,
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
    const hand = wr.aside.map((c, idx) => {
      const su = c.s, swapped = draft.swaps.includes(su), on = swapped && (draft.picks || [0, 1, 2])[su] === idx;
      const next = on ? draft.swaps.filter(x => x !== su) : swapped ? draft.swaps : draft.swaps.concat(su);
      const price = swapped ? 0 : OP.SWAP_COST[next.length] - OP.SWAP_COST[draft.swaps.length];
      const ok = costWith({ swaps: next }) <= 3;
      return slot('hand', su, cardHTML(c, `drag${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}`, on ? '<span class="tag back">↺</span>' : `<span class="tag">${hrs(price)}</span>`,
        `data-drag="hand" data-idx="${idx}" data-su="${su}" role="button" tabindex="0" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${on ? 'Swap back for free' : `Swap in for ${price} hour${price === 1 ? '' : 's'} of overtime`}"`));
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
    const honest = OP.rightStamp(wr.prop);
    const stamps = `<div class="bar3 stampstrip" role="radiogroup" aria-label="Stamp">${Object.keys(STAMP).map(k => `<button class="s-${k}${k === honest ? ' right' : ''}" role="radio" data-a="stamp" data-v="${k}" aria-label="${STAMP[k]}${k === honest ? ' — honest answer' : ''}" aria-checked="${draft.stamp === k}" aria-pressed="${draft.stamp === k}"><span>${STAMP[k]}</span></button>`).join('')}</div>`;
    const body = `<div class="play${dealCls}" style="--wait:${wait}s"><div class="hand-caption">Your policy · tap a card to show it</div><div class="policy">${env}</div>${tray}<div class="hand-labels"><span>Action</span><span>Target</span><span>Modifier</span></div><div class="fan expanded">${hand}</div></div>${stamps}`;
    return deskWrap(OP.DEPTS[p.dept], body, { right: purse, fuse: fuse(`${S.r}-cards`, TIME.cards, finalise), foot: key('finalise', 'Finalise') });
  }

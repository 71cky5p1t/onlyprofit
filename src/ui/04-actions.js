  // ---------- actions ----------
  function dispatch(a) {
    const r = OP.apply(S, S.spectate ? -1 : ME, a);
    if (r.error) { err = r.error; render(); return; }
    err = ''; S = r.state; ui.sel = null;
    draft = S.phase === 'work' && S.work[ME] ? newDraft() : null;
    if (draft) ui.deal = true;
    render();
  }
  function newDraft() {
    const p = me(), inh = p.inh;
    return { discards: [], swaps: [], redacts: [], stamp: null, 
      style: Object.assign({ tpl: 'memo', font: 'grotesk' }, p.fav, S.reqStyle), artSet: false, claim: { kind: 'none', val: evs(inh.cards), stamp: inh.stamp || 'Rec' }, nextStyle: null };
  }
  function costWith(ch) { return OP.workCost(Object.assign({}, draft, ch)); }
  function toast(t) { let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200); }

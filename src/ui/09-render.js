  // ---------- render ----------
  function render() {
    cueSync();
    applyBrand();
    document.documentElement.dataset.phase = S ? S.phase : 'setup';
    if (!S && naming) { $app.innerHTML = `${mast()}<div class="wrap"><div class="layout"><main class="board">${namingBoard()}</main>${deskNaming()}</div></div>`; if (naming.phase === 'trace') mountTrace(); return; }
    if (!S) { $app.innerHTML = mast() + setupHTML(); return; }
    const board = S.phase === 'end' || S.phase === 'whistle'
      ? S.phase === 'end' ? `${observerHTML()}${reportHTML()}${ui.debug ? exitHTML() : ''}` : `${observerHTML()}<div class="objs">${ledgerHTML()}${staffHTML()}</div>${feedHTML()}`
      : `${observerHTML()}${pilesHTML()}${feedHTML()}<div class="objs">${ledgerHTML()}${staffHTML()}</div>`;
    if (!(S.phase === 'work' && draft)) stopTimer();
    $app.innerHTML = `${mast()}<div class="wrap"><div class="layout"><main class="board">${board}</main>${desk()}</div></div>`;
    syncWheel();
    mountSign();
    transition();
  }
  // stripe wipe when the phase label changes; the profit calculator counts up to the new total
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function transition() {
    const key = `${S.r}|${PHASE[S.phase]}`;
    if (ui.lastKey && ui.lastKey !== key && !still()) {
      const w = document.createElement('div'); w.className = 'wipe'; w.setAttribute('aria-hidden', 'true');
      w.innerHTML = `<span><b>Q${Math.max(1, S.r)}</b><i>${PHASE[S.phase]}</i></span>`;
      document.body.appendChild(w); setTimeout(() => w.remove(), 1400);
    }
    ui.lastKey = key;
    if (ui.shown == null || still()) { ui.shown = S.profit; return; }
    if (ui.shown === S.profit || ui.tick) return;
    const step = () => {
      ui.shown += Math.sign(S.profit - ui.shown);
      const el = document.getElementById('lcd-profit'); if (el) el.innerHTML = lcd(ui.shown);
      ui.tick = ui.shown === S.profit ? null : setTimeout(step, 160);
    };
    ui.tick = setTimeout(step, 700);
  }

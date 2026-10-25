  // ---------- cards: drag between the policy and the hand, or tap ----------
  function swapSuit(su) {
    const next = draft.swaps.includes(su) ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su);
    if (costWith({ swaps: next }) > 3) return refuse(su);
    draft.swaps = next; ui.land = su; render();
  }
  function revealSuit(su) {
    const next = draft.reveals.includes(su) ? draft.reveals.filter(x => x !== su) : draft.reveals.concat(su);
    if (costWith({ reveals: next }) > 3) return refuse(su);
    draft.reveals = next; render();
  }
  function refuse(su) {
    toast('Not enough overtime.');
    document.querySelectorAll(`.card[data-su="${su}"]`).forEach(el => { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); });
  }
  const tapCard = (zone, su) => (zone === 'hand' ? swapSuit(su) : revealSuit(su));
  let drag = null;
  function endDrag() {
    if (!drag) return;
    if (drag.clone) drag.clone.remove();
    drag.el.classList.remove('lifted');
    document.querySelectorAll('.slot.ok, .slot.hot').forEach(x => x.classList.remove('ok', 'hot'));
    drag = null;
  }
  const slotAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest('.slot'); };
  $app.addEventListener('pointerdown', ev => {
    const el = ev.target.closest('.card[data-drag]'); if (!el || !draft || ev.button > 0) return;
    const r = el.getBoundingClientRect();
    drag = { el, zone: el.dataset.drag, su: +el.dataset.su, x: ev.clientX, y: ev.clientY, ox: ev.clientX - r.left, oy: ev.clientY - r.top, w: r.width, h: r.height, clone: null };
  });
  window.addEventListener('pointermove', ev => {
    if (!drag) return;
    if (!drag.clone) {
      if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 6) return;
      const c = drag.el.cloneNode(true); c.classList.add('dragging'); c.removeAttribute('data-drag');
      c.style.width = drag.w + 'px'; c.style.height = drag.h + 'px';
      document.body.appendChild(c); drag.clone = c; drag.el.classList.add('lifted');
      const other = drag.zone === 'hand' ? 'env' : 'hand';
      document.querySelectorAll(`.slot[data-drop="${other}"][data-su="${drag.su}"]`).forEach(x => x.classList.add('ok'));
    }
    ev.preventDefault();
    drag.clone.style.transform = `translate(${ev.clientX - drag.ox}px, ${ev.clientY - drag.oy}px) rotate(${Math.max(-8, Math.min(8, (ev.clientX - drag.x) / 18))}deg) scale(1.06)`;
    const t = slotAt(ev.clientX, ev.clientY);
    document.querySelectorAll('.slot.hot').forEach(x => x !== t && x.classList.remove('hot'));
    if (t && t.classList.contains('ok')) t.classList.add('hot');
  }, { passive: false });
  window.addEventListener('pointerup', ev => {
    if (!drag) return;
    const { zone, su, clone } = drag;
    const t = clone && slotAt(ev.clientX, ev.clientY);
    const hit = t && t.classList.contains('ok');
    endDrag();
    if (!clone) tapCard(zone, su); else if (hit) swapSuit(su);
  });
  window.addEventListener('pointercancel', endDrag);
  $app.addEventListener('keydown', ev => {
    const el = ev.target.closest && ev.target.closest('.card[data-drag]');
    if (el && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); tapCard(el.dataset.drag, +el.dataset.su); }
    if (ev.target.id === 'name-in' && ev.key === 'Enter') { ev.preventDefault(); const b = document.querySelector('[data-a="name-go"]'); if (b && !b.disabled) b.click(); }
  });
  $app.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset && el.dataset.in; if (!k) return;
    if (k === 'seed') setup.seed = el.value;
    if (k === 'name') { naming.name = el.value; const go = document.querySelector('[data-a="name-go"]'); if (go) go.disabled = !nameLetters(el.value); }
    if (k === 'custom') {
      draft.custom = el.value; const was = draft.useCustom; draft.useCustom = !!el.value.trim();
      if (was !== draft.useCustom) document.querySelectorAll('.subj-word').forEach(b => { b.disabled = draft.useCustom; });
      refreshPreview();
    }
    if (k === 'claimStamp') draft.claim.stamp = el.value;
    if (k === 'claimVal') draft.claim.val = +el.value;
    if (k === 'nextStyle') { const [t, f] = el.value.split('/'); draft.nextStyle = el.value ? { tpl: t, font: f } : null; }
  });

  // keep a game in progress across page updates
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ S, draft, setup, debug: ui.debug }));
  $app.addEventListener('scroll', ev => { if (ev.target.dataset && 'wheel' in ev.target.dataset) onWheel(ev.target); }, true);

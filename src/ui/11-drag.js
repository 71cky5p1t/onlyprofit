  // ---------- cards: drag between the policy and the hand, or tap ----------
  function swapSuit(su) {
    const next = draft.swaps.includes(su) ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su);
    if (costWith({ swaps: next }) > 3) return refuse(su);
    draft.swaps = next; ui.land = su; render();
  }
  // tap a policy card to black it out with the marker
  function redactSuit(su) {
    const next = draft.redacts.includes(su) ? draft.redacts.filter(x => x !== su) : draft.redacts.concat(su);
    if (costWith({ redacts: next }) > 3) return refuse(su);
    draft.redacts = next; render();
    if (next.includes(su)) inkSweep(su);
  }
  // the marker comes off the desk, uncapped, and runs along each line of the word
  function inkSweep(su) {
    const w = document.querySelector(`.policy .slot[data-su="${su}"] .card.redacted .word > span`), m = document.querySelector('.desk .marker svg');
    if (!w || !m || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rs = [...w.getClientRects()]; if (!rs.length) return;
    const pen = document.createElement('div'); pen.className = 'marker-fly'; pen.innerHTML = m.outerHTML; document.body.appendChild(pen);
    const at = (x, r, a) => `translate(${x}px, ${r.top + r.height / 2 - 13}px) rotate(${a}deg)`;
    const f = rs.flatMap((r, i) => [{ transform: at(r.left - 2, r, -30), offset: i / rs.length }, { transform: at(r.right + 2, r, -24), offset: (i + .85) / rs.length }]);
    f.push({ transform: at(rs[rs.length - 1].right + 30, rs[rs.length - 1], -40), opacity: 0, offset: 1 });
    pen.animate(f, { duration: 260 + 200 * rs.length, easing: 'linear' }).onfinish = () => pen.remove();
  }
  // a shredded card is replaced in place; which pile it came from depends on whether its suit is swapped
  function shredCard(zone, su) {
    const pile = (zone === 'env') !== draft.swaps.includes(su) ? 'inh' : 'spare', next = draft.discards.concat({ pile, su });
    const redacts = zone === 'env' ? draft.redacts.filter(x => x !== su) : draft.redacts;
    if (costWith({ discards: next, redacts }) > 3) return refuse(su);
    draft.discards = next; draft.redacts = redacts; ui.fresh = { zone, su }; render();
  }
  function refuse(su) {
    toast('Your input has been noted.');
    document.querySelectorAll(`.card[data-su="${su}"]`).forEach(el => { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); });
  }
  const tapCard = (zone, su) => (zone === 'hand' ? swapSuit(su) : OP.inkChosen(S) && redactSuit(su));
  let drag = null;
  function endDrag() {
    if (!drag) return;
    if (drag.clone) drag.clone.remove();
    drag.el.classList.remove('lifted');
    document.querySelectorAll('.play.holding').forEach(x => x.classList.remove('holding'));
    document.querySelectorAll('.slot.ok, .slot.hot, .shredder.ok, .shredder.hot').forEach(x => x.classList.remove('ok', 'hot'));
    drag = null;
  }
  const slotAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest('.slot, .shredder'); };
  $app.addEventListener('pointerdown', ev => {
    const el = ev.target.closest('.card[data-drag]'); if (!el || !draft || ev.button > 0) return;
    const r = el.getBoundingClientRect();
    drag = { el, zone: el.dataset.drag, su: +el.dataset.su, x: ev.clientX, y: ev.clientY, ox: ev.clientX - r.left, oy: ev.clientY - r.top, w: r.width, h: r.height, clone: null };
    // pressing a spare opens its slot in the policy
    if (drag.zone === 'hand') document.querySelectorAll(`.slot[data-drop="env"][data-su="${drag.su}"]`).forEach(x => x.classList.add('ok'));
  });
  window.addEventListener('pointermove', ev => {
    if (!drag) return;
    if (!drag.clone) {
      if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 6) return;
      const c = drag.el.cloneNode(true); c.classList.add('dragging'); c.removeAttribute('data-drag');
      c.style.width = drag.w + 'px'; c.style.height = drag.h + 'px';
      document.body.appendChild(c); drag.clone = c; drag.el.classList.add('lifted');
      const play = drag.el.closest('.play'); if (play) play.classList.add('holding');
      const other = drag.zone === 'hand' ? 'env' : 'hand';
      document.querySelectorAll(`.slot[data-drop="${other}"][data-su="${drag.su}"], .shredder:not(.broke)`).forEach(x => x.classList.add('ok'));
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
    if (!clone) tapCard(zone, su); else if (hit && t.classList.contains('shredder')) shredCard(zone, su); else if (hit) swapSuit(su);
  });
  window.addEventListener('pointercancel', endDrag);
  $app.addEventListener('keydown', ev => {
    const el = ev.target.closest && ev.target.closest('.card[data-drag]');
    if (el && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); tapCard(el.dataset.drag, +el.dataset.su); }
    if (el && (ev.key === 'Delete' || ev.key === 'Backspace')) { ev.preventDefault(); shredCard(el.dataset.drag, +el.dataset.su); }
    if (ev.target.id === 'name-in' && ev.key === 'Enter') { ev.preventDefault(); const b = document.querySelector('[data-a="name-go"]'); if (b && !b.disabled) b.click(); }
  });
  $app.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset && el.dataset.in; if (!k) return;
    if (k === 'seed') setup.seed = el.value;
    if (k === 'name') { naming.name = el.value; const go = document.querySelector('[data-a="name-go"]'); if (go) go.disabled = !nameLetters(el.value); }
    if (k === 'claimStamp') draft.claim.stamp = el.value;
    if (k === 'claimVal') draft.claim.val = +el.value;
    if (k === 'nextStyle') { const [t, f] = el.value.split('/'); draft.nextStyle = el.value ? { tpl: t, font: f } : null; }
  });

  // keep a game in progress across page updates
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ S, draft, setup, debug: ui.debug }));
  $app.addEventListener('scroll', ev => { if (ev.target.dataset && 'wheel' in ev.target.dataset) onWheel(ev.target); }, true);

  // Teach uncommon rules once, when the player's own screen makes them relevant.
  const TEACH = { seen: new Set(), key: '', line: '' };
  function teachingSync() {
    if (!S || S.spectate || window.__opFreeze) return;
    const key = `${S.r}:${S.phase}:${draft ? (draft.page || 1) : 0}`;
    if (TEACH.key === key) return;
    TEACH.key = key; TEACH.line = '';
    const offer = (id, line) => { if (TEACH.seen.has(id) || TEACH.line) return; TEACH.seen.add(id); TEACH.line = line; };
    if (S.phase === 'work' && draft && !draft.page) {
      const inh = me().inh, cards = inh.cards.concat(S.work[ME].D);
      if (S.r === 1) offer('hand', 'Three cards make your policy. Choose from six spares below. Tap a spare to swap; tap a policy card to show it to the table.');
      if (inh.kind === 'rejected') offer('rejected', 'Rejected, with compliments. The handover names its previous author. Only you can see what they left behind.');
      if (inh.kind === 'cleanup') offer('cleanup', 'The previous policy was approved. You inherit three of its leftover cards, one of each suit.');
      const fx = cards.find(c => c.fx && !TEACH.seen.has(c.fx));
      if (fx) offer(fx.fx, `${fx.w}: ${FXSAY[fx.fx].toLowerCase()}. Its own value still counts.`);
    }
    if (S.phase === 'board') offer('board', 'Rubber-stamping keeps the policy sealed. A majority voting Open reveals it and may overturn the CEO’s choice.');
    if (S.phase === 'reveal') offer('warning', 'Pick someone for a Written Warning, or Nobody, then sign. A second warning stands them down.');
    if (S.phase === 'review' && isCEO()) offer('investigate', 'As CEO, you may pull one file and sign to investigate its stamp. A dishonest stamp can mean a PIP next quarter.');
    if (S.P.some(p => p.pip)) offer('pip', 'A Performance Improvement Plan makes that person’s future proposals visible to the CEO. Everyone else still sees a sealed page.');
  }
  const teachingHTML = () => TEACH.line ? `<div class="training-tip" role="status"><p>${esc(TEACH.line)}</p><button data-a="dismiss-tip" aria-label="Dismiss tip">×</button></div>` : '';
  $app.addEventListener('click', e => { if (e.target.closest('[data-a="dismiss-tip"]')) { TEACH.line = ''; const tip = document.querySelector('.training-tip'); if (tip) tip.remove(); } });

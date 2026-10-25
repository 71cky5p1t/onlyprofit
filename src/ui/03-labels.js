  // proposals are told apart by an office object, not a letter; same icon on the TV and the phone
  const ICONS = [
    '<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2M8.5 3.5v2M12 3.5v2"/>',
    '<path d="M16 7v9a4 4 0 0 1-8 0V6a2.5 2.5 0 0 1 5 0v9a1 1 0 0 1-2 0V8"/>',
    '<path d="M9 3h6l-1 6 3 3H7l3-3z"/><path d="M12 12v9"/>',
    '<path d="M10 3h4l-1 3 2 10-3 5-3-5 2-10z"/>',
    '<circle cx="8" cy="8" r="4"/><path d="M11 11l9 9M17 17l2-2M14.5 14.5l2-2"/>',
    '<path d="M12 21V6a2 2 0 0 1 4 0v7a2 2 0 0 1-2 2h-2M12 12H10a2 2 0 0 1-2-2V8M7 21h10"/>',
    '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 15.6L18 3M16 15.6L6 3"/>',
    '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/>',
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'];
  const ICON_NAMES = ['mug', 'paperclip', 'pushpin', 'tie', 'key', 'cactus', 'light bulb', 'scissors', 'umbrella', 'phone'];
  const iconIdx = (id, list) => Math.max(0, (list || S.envs).map(e => e.id).sort().indexOf(id)) % ICONS.length;
  const icon = (id, list) => `<svg class="ico" viewBox="0 0 24 24" role="img" aria-label="${ICON_NAMES[iconIdx(id, list)]}"><title>${ICON_NAMES[iconIdx(id, list)]}</title>${ICONS[iconIdx(id, list)]}</svg>`;
  // a person's record as cheap, dog-eared praise stickers
  // r: only what was earned this quarter
  function stickers(q, r) {
    const memos = r ? S.memos : S.history.flatMap(h => h.memos).concat(S.memos);
    const filed = memos.filter(m => m.kind === 'report' && m.by === q.id).length;
    const out = q.pip ? [['pip', 'PIP']] : [];
    q.approved.filter(a => !r || a.r === r).forEach(a => out.push(a.actual > 0 ? ['gold', 'Great work!'] : ['beige', 'Acceptable!']));
    if (filed) out.push(['blue', 'Team player']);
    const warns = r ? (S.warn && S.warn.passed && S.warn.target === q.id ? 1 : 0) : q.warnings;
    for (let k = 0; k < warns; k++) out.push(['red', 'See me']);
    if (q.accusations && !r) out.push(['grey', `Noted ×${q.accusations}`]);
    if (!out.length) return '';
    return `<span class="stickers">${out.map(([c, t], k) => `<i class="stk ${c}" style="--r:${((q.id * 7 + k * 13) % 11) - 5}deg">${t}</i>`).join('')}</span>`;
  }
  const isCEO = () => mine() && S.ceo === ME;
  const STAMP = OP.STAMP_LABEL;
  const TIER = { smart: 'Smart', basic: 'Basic', naive: 'Gullible', patient: 'Patient', blatant: 'Blatant' };
  const PHASE = { brief: 'Induction', work: 'Work', decide: 'Decide', board: 'Board vote', reveal: 'Reveal', review: 'Quarter closed', whistle: 'Whistleblower', end: 'Annual report' };

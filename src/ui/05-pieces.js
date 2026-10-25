  // ---------- pieces ----------
  function meter() {
    const lo = Math.min(-6, S.profit), hi = Math.max(S.target + 4, S.profit + 1), pct = v => ((v - lo) / (hi - lo)) * 100;
    const z = pct(0), p = pct(S.profit), left = Math.min(z, p), w = Math.abs(p - z);
    return `<div class="meter" aria-label="Profit ${fmt(S.profit)} of target ${S.target}">
      <div class="meter-lcd"><span class="ann"><span>PROFIT</span><span>TARGET +${S.target}</span></span><span class="v" id="lcd-profit">${lcd(ui.shown == null ? S.profit : ui.shown)}</span></div>
      <div class="meter-track"><div class="bar"><div class="meter-zero" style="left:${z}%"></div><div class="meter-fill ${S.profit < 0 ? 'neg' : ''}" style="left:${left}%;width:${w}%"></div><div class="meter-tick" style="left:calc(${pct(S.target)}% - 1px)"></div></div><div class="lbl"><span>Q${Math.max(1, S.r)}/5</span><span>Target</span></div></div></div>`;
  }
  function mast() {
    const stats = S ? `<span class="tab"><b>Q${Math.max(1, S.r)}</b><span>${PHASE[S.phase]}</span></span>
      <div class="stat"><span class="label">CEO</span><b>${S.r ? esc(nm(S.ceo)) : '—'}</b></div>${meter()}` : '';
    return `<header class="mast"><div class="wrap">
      <div class="logo"><span class="logo-mark" aria-hidden="true">${brandMark()}</span><span class="logo-type"><span class="brand-name">${esc(brand().name)}</span><small>${esc(brand().suffix)}</small></span></div>
      <div class="mast-stats">${stats}<div class="tools">
        <button class="chip-btn" data-a="debug" aria-pressed="${ui.debug}" title="Show hidden roles, proposal contents and bot reasoning">Observer</button>
        ${S ? '<button class="chip-btn" data-a="quit">New game</button>' : ''}</div></div></div></header>`;
  }
  // longest word sets the type size so no word is ever broken
  const fit = w => { const L = Math.max(...w.split(/\s+/).map(x => x.length)); return Math.min(1, 10.5 / L, Math.sqrt(30 / Math.max(30, w.length))).toFixed(2); };
  function cardHTML(c, cls, extra, attrs) {
    const face = c.fx ? `${glyph(c.v)}<span class="dymo" title="${FXSAY[c.fx]}"><i class="m0"></i><i class="m1"></i><b>${FXSYM[c.fx]}</b></span>` : glyph(c.v);
    return `<div class="card s-${c.s} ${c.fx ? 'has-fx' : ''} ${cls || ''}" ${attrs || ''}><div class="cf" style="--fit:${fit(c.w)}"><span class="word">${esc(c.w)}</span><div class="fx">${face}</div></div>${extra || ''}</div>`;
  }
  // the table is a shared screen: authors appear only once approved
  const authorVisible = e => e.approved || ui.debug;
  // one proposal on the TV: the cover page, its sentence once anything is shown, then the paperwork
  function pageHTML(e, opt) {
    opt = opt || {};
    const who = authorVisible(e) ? (e.autopilot ? 'Autopilot' : (mine() && e.author === ME ? 'You' : nm(e.author))) : null;
    const dept = authorVisible(e) ? OP.DEPTS[e.dept] : null;
    const tags = [];
    if (e.audited) tags.push('<span class="pill blue">Audited</span>');
    if (e.autopilot) tags.push('<span class="pill grey">Autopilot</span>');
    if (e.unmasked && !e.approved) tags.push(`<span class="pill red">Overruled · ${e.author === S.ceo ? 'the CEO’s own' : esc(nm(e.author))}</span>`);
    const dbg = ui.debug ? `<div class="env-dbg">${S.P[e.author].sab ? 'SAB' : 'LOYAL'} · ${esc(e.mode)} · true ${fmt(evs(e.cards))} · table est ${OP.estimate(e, S.loyalTier, false).toFixed(1)} · spent ${e.cost}${e.redeal ? ' · re-dealt' : ''}</div>` : '';
    const tag = opt.click ? 'button' : 'div';
    const fresh = e.approved && ui.stamped !== `${S.r}${e.id}`;
    if (fresh) ui.stamped = `${S.r}${e.id}`;
    return `<${tag} class="pg ${ui.sel === e.id ? 'sel' : ''} ${opt.faded ? 'faded' : ''} ${opt.motion || ''}" ${opt.click ? `data-a="${opt.click}" data-id="${e.id}" aria-pressed="${ui.sel === e.id}" aria-label="${ICON_NAMES[iconIdx(e.id)]}: ${esc(e.subject)}"` : ''}>
      ${coverHTML(e, { fresh })}<div class="pg-under">${lineHTML(e, { anim: opt.motion === 'pull' })}
      ${who ? `<div class="pg-from">From <b>${esc(who)}</b>${dept ? ` · ${esc(dept)}` : ''}</div>` : ''}${tags.length ? `<div class="pg-tags">${tags.join('')}</div>` : ''}${dbg}</div></${tag}>`;
  }

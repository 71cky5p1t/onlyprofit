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

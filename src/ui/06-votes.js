  // pick-one grids: proposals as small cover pages, people as name tags
  // your own page, and every author for the Auditor; phone only
  const auditor = () => mine() && me().spec === 'Auditor' && !me().leave;
  const tagFor = e => !mine() || e.autopilot ? '' : e.author === ME ? '<i class="yours">You</i>' : auditor() ? `<i class="yours">${esc(nm(e.author))}</i>` : '';
  function minis(list, current, none) {
    return `<div class="minis">${list.map(e => {
      const open = e.openTo && mine() && e.openTo.includes(ME);
      const peek = open || e.audited || e.revealed.length ? `<span class="peek">${e.cards.map((c, su) => open || e.audited || e.revealed.includes(su) ? `<b class="s-${su} ${tone(c.v)}">${GLYPH[c.v]}</b>` : `<i class="s-${su}">${brandMark()}</i>`).join('')}</span>` : '';
      return `<button class="mini" data-a="sel" data-id="${e.id}" aria-pressed="${current === e.id}" aria-label="${ICON_NAMES[iconIdx(e.id)]}: ${esc(e.subject)}">
        ${coverHTML(e, { k: .35 })}${peek}${tagFor(e)}</button>`;
    }).join('')}${none ? `<button class="mini none" data-a="sel" data-id="none" aria-pressed="${current === 'none'}">${none}</button>` : ''}</div>`;
  }
  function nameTags(list, current, none) {
    return `<div class="tags">${list.map(q => `<button class="nametag" data-a="sel" data-id="${q.id}" aria-pressed="${String(current) === String(q.id)}"><span class="hello">Hello<small>my name is</small></span><b>${esc(q.name)}</b>${stickers(q)}</button>`).join('')}
      ${none ? `<button class="nametag none" data-a="sel" data-id="none" aria-pressed="${String(current) === 'none'}"><b>${none}</b></button>` : ''}</div>`;
  }
  const boardSlip = () => S.board ? slip(S.board.overruled ? `Board overruled ${icon(S.board.nominee)} · ${S.board.own ? 'the CEO’s own' : S.board.author == null ? 'autopilot' : esc(nm(S.board.author))}` : S.board.opened ? `Opened ${icon(S.board.nominee)} · it stands` : `Board rubber-stamped ${icon(S.board.nominee)}`) : '';
  function resultSlip() {
    if (!S.result) return '';
    const e = S.envs.find(x => x.id === S.result.id); if (!e) return '';
    return slip(`${icon(S.result.id)} ${e.autopilot ? 'Autopilot' : esc(nm(S.result.author))} <b class="${tone(S.result.actual)}">${fmt(S.result.actual)}</b>`);
  }
  // the CEO may pull one file a quarter; what's in it stays between them and HR
  function filesHTML() {
    if (S.invq && S.invq.r === S.r) return `<div class="files"><div class="file pulled"><span class="file-tab">${esc(nm(S.invq.t))}</span><i class="file-stamp">Pulled</i></div></div>`;
    const list = S.P.filter(q => q.id !== ME && !q.pip && S.envs.some(e => e.author === q.id && !e.autopilot));
    if (!list.length) return '';
    return `<div class="slips">${slip('Pull a file')}</div><div class="files">${list.map(q => `<button class="file" data-a="sel" data-id="${q.id}" aria-pressed="${String(ui.sel) === String(q.id)}"><span class="file-tab">${esc(q.name)}</span></button>`).join('')}</div>
      ${signHTML('investigate', ui.sel != null && list.some(q => String(q.id) === String(ui.sel)))}`;
  }

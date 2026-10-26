  function feedHTML() {
    const item = f => {
      const q = `<span class="q">Q${f.r}</span>`;
      if (f.kind === 'memo') {
        const flag = ui.debug ? (f.truthful ? '<span class="true">TRUE</span>' : '<span class="lie">LIE</span>') : '';
        return `<div class="feed-item memo">${q}<div><span class="who">${esc(nm(f.by))}:</span> <span class="txt">${esc(f.text)}</span>${flag}</div></div>`;
      }
      return `<div class="feed-item ${f.kind}">${q}<div>${esc(f.text)}</div></div>`;
    };
    const cur = S.feed.filter(f => f.r === S.r), old = S.feed.filter(f => f.r !== S.r && f.r > 0);
    return `<section><div class="section-head"><h2>Bulletin board</h2></div>
      <div class="feed">${cur.length ? cur.map(item).join('') : '<div class="feed-empty">Nothing posted this quarter yet.</div>'}</div>
      ${old.length ? `<details class="rules" style="margin-top:10px"><summary>Earlier quarters (${old.length})</summary><div class="feed" style="margin-top:8px">${old.map(item).join('')}</div></details>` : ''}</section>`;
  }
  // the ledger is a till roll: one line printed per quarter, torn off at the total
  function ledgerHTML() {
    const rows = [1, 2, 3, 4, 5].map(r => {
      const l = S.ledger.find(x => x.r === r);
      if (!l) return `<div class="tr-row muted"><span>Q${r}</span><span>${r === S.r ? '. . .' : ''}</span><b></b></div>`;
      const fresh = r === S.r && ui.printed !== r && (S.phase === 'reveal' || S.phase === 'review');
      if (fresh) ui.printed = r;
      return `<div class="tr-row${fresh ? ' new' : ''}"><span>Q${r}</span><span>${esc(l.subject)}<small>${l.autopilot ? 'AUTOPILOT' : esc(nm(l.author)).toUpperCase()} · ${esc(STAMP[l.stamp]).toUpperCase()}</small></span><b class="${tone(l.actual)}">${fmt(l.actual)}</b></div>`;
    }).join('');
    const wb = S.whistle && S.whistle.named != null ? `<div class="tr-row"><span>WB</span><span>${S.whistle.correct && S.whistle.clawed.length ? `CLAWBACK ${S.whistle.clawed.map(c => 'Q' + c.r).join(' ')}` : 'WHISTLEBLOWER'}<small>${esc(nm(S.whistle.named)).toUpperCase()}</small></span><b class="${S.whistle.correct ? 'pos' : 'neg'}">${fmt(S.whistle.swing)}</b></div>` : '';
    return `<section class="till" aria-label="Ledger"><div class="tr-paper"><div class="tr-head">${esc(brand().name).toUpperCase()}<small>${esc(brand().suffix).toUpperCase()} · LEDGER</small></div>
      ${rows}${wb}<div class="tr-total"><span>TOTAL</span><b class="${S.profit < 0 ? 'neg' : ''}">${fmt(S.profit)}</b></div>
      <div class="tr-foot">TARGET +${S.target}${S.easy ? ' (EASY)' : ''}<br>** THANK YOU FOR YOUR SERVICE **</div></div></section>`;
  }
  // staff are the name tags from the phone; the CEO rotation is a row of desk name plates
  function staffHTML() {
    const live = S.phase !== 'end' && S.phase !== 'whistle';
    const tags = S.P.map(p => {
      const meta = [];
      if (S.r && S.ceo === p.id && live) meta.push('<i class="tag-tape">CEO</i>');
      if (p.leave) meta.push('<i class="tag-tape grey">Stood down</i>');
      if (p.spec && ui.debug) meta.push(`<i class="tag-tape gold">${p.spec}</i>`);
      if (ui.debug || S.phase === 'end') meta.push(`<i class="tag-tape ${p.sab ? 'red' : 'green'}">${p.sab ? 'Disgruntled' : 'Loyal'}</i>`);
      const dept = S.r && ui.debug ? `<small class="tag-dept">${OP.DEPTS[p.dept]}</small>` : '';
      return `<div class="nametag staff-tag${p.leave ? ' down' : ''}" style="--r:${((p.id * 5) % 7 - 3) * .7}deg"><span class="hello">Hello<small>my name is</small></span>
        <b>${p.id === ME && mine() && ui.badge ? `<img class="ink-name" src="${ui.badge}" alt="You">` : esc(p.name)}</b>${dept}${meta.length ? `<span class="tag-tapes">${meta.join('')}</span>` : ''}${stickers(p)}</div>`;
    }).join('');
    const plates = OP.ceoSchedule(S).map(c => `<div class="plate-n${c.r === S.r && live ? ' now' : c.r < S.r ? ' past' : ''}"><small>Q${c.r}</small><b>${c.who == null ? esc(c.note) : esc(nm(c.who))}</b></div>`).join('');
    return `<section class="staff-desk" aria-label="Staff"><div class="staff-tags">${tags}</div><div class="plates" aria-label="CEO rotation">${plates}</div></section>`;
  }
  function pilesHTML() {
    const ph = S.phase;
    if (ph === 'work') {
      const sealed = S.envs.length;
      const cells = S.P.map((p, i) => i < sealed ? '<div class="placeholder sealed">Handed in</div>' : '<div class="placeholder"></div>').join('');
      return `<section><div class="pages n${S.n}">${cells}</div></section>`;
    }
    if (!['decide', 'board', 'reveal', 'review'].includes(ph)) return '';
    const click = ph === 'decide' && isCEO() ? 'sel' : null;
    const envs = S.envs.slice().sort((a, b) => a.id.localeCompare(b.id));
    const animKey = `${S.r}|${ph}`, anim = ui.envAnim !== animKey && !still();
    ui.envAnim = animKey;
    const motion = e => !anim ? '' : ph === 'board' ? (e.id === S.nominee ? 'pick' : 'fall') : ph === 'reveal' && e.approved ? 'pull' : '';
    return `<section><div class="pages n${envs.length}">${envs.map(e => pageHTML(e, { motion: motion(e), click, faded: ((ph === 'reveal' || ph === 'review') && !e.approved) || (ph === 'board' && e.id !== S.nominee) })).join('')}</div></section>`;
  }

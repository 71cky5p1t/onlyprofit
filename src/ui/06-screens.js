  function deskSpectate() {
    const ph = S.phase;
    if (ph === 'end') return deskEnd();
    const label = { decide: 'See the decision', review: S.r < 5 ? `Start Q${S.r + 1}` : 'Whistleblower' }[ph];
    const bits = [];
    if (ph === 'review') bits.push(boardSlip(), resultSlip());
    if (S.warn && ph === 'review') bits.push(slip(S.warn.target == null ? 'No warning' : `Warning · <b>${esc(nm(S.warn.target))}</b> ${S.warn.passed ? 'passed' : 'failed'}`));
    return deskWrap('Observing', `<div class="slips">${bits.join('')}</div>`, { foot: label ? key('advance', label) : '' });
  }
  function deskEnd() {
    const sabs = S.P.filter(p => p.sab);
    const youWon = mine() ? (me().sab ? !S.win : S.win) : null;
    const line = S.win ? 'Shareholders are mildly pleased. Bonuses have been deferred.' : sabs.length ? 'The company sank, with help.' : 'The company failed entirely on its own merits.';
    const body = `<div class="sheet letter"><div class="role ${S.win ? 'loyal' : 'sab'}">${youWon == null ? (S.win ? 'Target met' : 'Target missed') : youWon ? 'You win' : 'You lose'}</div>
      <div class="num big">${fmt(S.profit)} <small>/ +${S.target}</small></div><div>${line}</div>
      <div class="hint">${sabs.length ? `Mole${sabs.length > 1 ? 's' : ''}: <b>${sabs.map(p => esc(p.name)).join(', ')}</b>` : 'No moles'}</div></div>`;
    return deskWrap('Final figures', body, { foot: `<div class="two-keys"><button class="btn back" data-a="quit">Settings</button>${key('again', 'Again')}</div>` });
  }
  function desk() {
    if (S.spectate) return deskSpectate();
    const p = me(), ph = S.phase;
    if (ph === 'brief') {
      // a typed memo on letterhead; the only thing that matters is the rubber stamp
      const fine = p.sab ? 'Make sure it misses. Quietly.' : S.n >= 6 ? 'Up to two moles. Possibly none.' : 'Possibly a mole. Possibly not.';
      const body = `<div class="memo-sheet">
        <div class="lh"><span class="logo-mark" aria-hidden="true">${brandMark()}</span><span class="lh-name"><span class="brand-name">${esc(brand().name)}</span> ${esc(brand().suffix)}<small>People &amp; Culture</small></span><span class="lh-ref">Q0 / HR / ${String(S.seed % 1000).padStart(3, '0')}</span></div>
        <div class="memo-row"><span>To</span>${ui.badge ? `<img class="ink-name" src="${ui.badge}" alt="You">` : '<b>You</b>'}</div>
        <div class="memo-row"><span>Re</span><b>Your allegiance</b></div>
        <div class="memo-row"><span>Target</span><b>+${S.target}</b> by Q5</div>
        <div class="memo-stamp ${p.sab ? 'sab' : 'loyal'}">${p.sab ? 'Mole' : 'Loyal'}</div>
        ${p.spec ? `<div class="memo-spec">${p.spec}<small>${p.spec === 'Auditor' ? 'you see who wrote every proposal' : 'you choose next quarter’s cover page'}</small></div>` : ''}
        <div class="memo-fine">${fine}</div>
        <svg class="memo-sig" viewBox="0 0 160 40" aria-hidden="true"><path d="M4 30c10-18 18-24 22-16s-8 18 2 12 14-22 20-16-6 20 4 14 10-14 16-10 2 12 10 8 12-10 20-8 6 8 14 4 14-6 20-4"/></svg>
      </div>`;
      return deskWrap('Strictly confidential', body, { foot: key('begin', 'Start Q1') });
    }
    if (ph === 'work' && draft) return deskWork();
    const leave = p.leave ? slip('Stood down') : '';
    if (ph === 'decide') {
      if (isCEO()) return deskWrap('You are CEO', `${minis(S.envs.slice().sort((a, b) => a.id.localeCompare(b.id)), ui.sel)}`, { foot: key('approve', ui.sel ? `Nominate ${icon(ui.sel)}` : 'Nominate', !!ui.sel) });
      const own = S.envs.find(e => !e.autopilot && e.author === ME);
      return deskWrap(`${esc(nm(S.ceo))} is CEO`, `${leave}${auditor() ? minis(S.envs.slice().sort((a, b) => a.id.localeCompare(b.id)), null) : own ? `<div class="board-nom own">${coverHTML(own, { k: .6 })}${lineHTML(own)}</div>` : ''}`, { foot: key('advance', 'See the decision') });
    }
    if (ph === 'board') {
      const nom = S.envs.find(e => e.id === S.nominee);
      const body = `<div class="slips">${slip(`${esc(nm(S.ceo))} nominated ${icon(S.nominee)}${auditor() && !nom.autopilot ? ` · by <b>${nom.author === ME ? 'you' : esc(nm(nom.author))}</b>` : ''}`)}</div><div class="board-nom">${coverHTML(nom, { k: .6 })}${lineHTML(nom, { all: nom.openTo && nom.openTo.includes(ME) })}</div>
        <div class="bar3 two" role="radiogroup" aria-label="Board vote">${['ratify', 'open'].map(v => `<button class="b-${v}" role="radio" data-a="sel" data-id="${v}" aria-checked="${ui.sel === v}" aria-pressed="${ui.sel === v}"><span>${v === 'ratify' ? 'Rubber-stamp' : 'Open it'}</span></button>`).join('')}</div>`;
      return deskWrap('Board vote', `${leave}${body}${signHTML('board', ui.sel === 'ratify' || ui.sel === 'open')}`);
    }
    if (ph === 'reveal') {
      const list = S.P.filter(q => q.id !== ME && !q.leave);
      const won = S.envs.find(e => e.approved), go = won && ui.lineAnim !== S.r && !still();
      if (go) ui.lineAnim = S.r;
      return deskWrap('Written Warning', `<div class="slips">${boardSlip()}${resultSlip()}</div>${won ? lineHTML(won, { anim: go }) : ''}${nameTags(list, ui.sel, 'Nobody')}${signHTML('warn', ui.sel != null)}`);
    }
    if (ph === 'review') {
      const w = S.warn;
      const won = S.envs.find(e => e.approved), got = stickers(p, S.r);
      return deskWrap('Quarter closed', `<div class="slips">${resultSlip()}${slip(w.target == null ? 'No warning' : `Warning · <b>${esc(nm(w.target))}</b> ${w.passed ? 'passed' : 'failed'}`)}</div>${won ? lineHTML(won, { all: true }) : ''}
        ${isCEO() ? filesHTML() : ''}<div class="tags one"><div class="nametag mine"><span class="hello">Hello<small>my name is</small></span><b>${esc(p.name)}</b>${got || '<span class="stickers"><i class="stk grey">Present</i></span>'}</div></div>`, { foot: key('advance', S.r < 5 ? `Start Q${S.r + 1}` : 'Whistleblower') });
    }
    if (ph === 'whistle') {
      return deskWrap('Who’s the mole?', `<div class="slips">${slip(`<b class="pos">+</b> · <b class="neg">−3</b>`)}</div>${nameTags(S.P.filter(q => q.id !== ME), ui.sel, 'Nobody')}${signHTML('whistle', ui.sel != null)}`);
    }
    if (ph === 'end') return deskEnd();
    return deskWrap(PHASE[ph], '');
  }

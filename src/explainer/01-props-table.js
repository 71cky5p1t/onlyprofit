  const SPARES = [{ s: 0, v: 1, w: 'Automate' }, { s: 1, v: 2, w: 'the Interns' }, { s: 2, v: 0, w: 'Pending Review' }, { s: 0, v: -1, w: 'Outsource' }, { s: 1, v: 1, w: 'Customer Trust' }, { s: 2, v: 2, w: 'At Scale' }];
  // the reel swaps a card and shows one by itself; tapping a spare takes over
  function overtimeProp(cs) {
    const d = TRAIN.demo, swaps = Object.keys(d).length, auto = !TRAIN.touched;
    const policy = cs.map((c, su) => d[su] == null ? c : SPARES[d[su]]);
    const hand = SPARES.map((c, i) => cardHTML(d[c.s] === i ? cs[c.s] : c, auto && i === 1 ? 'b lift-out' : '', '', `role="button" tabindex="0" data-a="lesson-swap" data-su="${c.s}" data-i="${i}" aria-label="Swap in ${esc(c.w)}" ${auto && i === 1 ? at(.3) : ''}`)).join('');
    const row = auto
      ? cs.map((c, su) => su === 1 ? `<div class="swap-slot" style="${vt('vt-c1')}">${cardHTML(c, 'b swap-out', '', at(.34))}${cardHTML(SPARES[1], 'b swap-in', '', at(.34))}</div>` : cardHTML(c, '', '', `style="${vt('vt-c' + su)}"`)).join('')
      : policy.map((c, su) => cardHTML(c, '', '', `style="${vt('vt-c' + su)}"`)).join('');
    const spent = auto ? 2 : OP.SWAP_COST[swaps] || 0;
    const shown = auto ? `<p class="line i-shown"><span class="ph s-0"><mark>${esc(cs[0].w)}</mark><b class="v pos">${GLYPH[2]}</b><i class="redact b peel" ${at(.68)}></i></span> <span class="ph s-1 hid"><mark>█████</mark></span> <span class="ph s-2 hid"><mark>█████</mark></span></p>` : '';
    return `${punch(spent, auto ? [.36, .7] : [])}${cardRow(row, 'ot-policy')}${shown}<div class="i-cards spares">${hand}</div>`;
  }
  const SUBJECTS = ['Synergy Review: the Interns', 'Right-Sizing Morale', 'Customer Trust, Phase Two', 'Strategic Pivot to Vending', 'Going Forward, Again', 'Quick Win: Break Room Monetisation (Pilot)'];
  function trainingProp2(id, cs) {
    if (id === 'ceo') return `<div class="i-pile">${['fax', 'certificate', 'overhead', 'clipart', 'dossier', 'memo'].map((t, k) => `<div class="leaf b scatter${k === 5 ? ' pull' : ''}" style="--at:${.05 + k * .05};--k:${k};${k === 5 ? vt('vt-memo') : ''}">${page(t, { id: 'p' + k, subject: SUBJECTS[k], k: .42, tilt: (k * 37 % 11) - 5 })}</div>`).join('')}</div>
      <div class="i-ceo">${demoTag('Denise', null, `<span class="plate b slide-plate" ${at(.5)}>CEO</span>`)}</div>`;
    if (id === 'board') {
      const side = (word, names, f) => `<div class="i-vote"><span class="vote-word b thump" ${at(f)}>${word}</span>${names.map((n, k) => `<div class="i-signer">${demoTag(n, f + k * .04)}${squiggle(f + .06 + k * .05)}</div>`).join('')}</div>`;
      const bad = [{ s: 0, v: -2, w: 'Outsource' }, { s: 1, v: -1, w: 'Customer Trust' }, cs[2]];
      return `<div class="i-votes">${side('Rubber-stamp', ['Gary', 'Moira'], .05)}${side('Open it', ['Trevor', 'Clive', 'You'], .18)}</div>
        <div class="i-duel"><div class="leaf b deal nominee" ${at(.45)}>${page('memo', { id: 'n', subject: 'Outsource Customer Trust (Off the Books)', cards: bad, k: .4, tilt: -2 })}<p class="line b type" ${at(.52)}>${bad.map((c, su) => `<span class="ph s-${su}"><mark>${esc(c.w)}</mark><b class="v ${tone(c.v)}">${GLYPH[c.v]}</b></span>`).join(' ')}</p><span class="rubber red b thump" ${at(.64)}>Overruled</span></div>
        <div class="leaf b deal rival" style="--at:.48">${page('fax', { id: 'r', subject: SUBJECTS[0], k: .4, tilt: 3 })}</div></div>`;
    }
    if (id === 'approved') {
      const e = { ...demoPage('memo', { approved: true }), resolved: cs.map(c => c.v) };
      return `<div class="i-approved b deal" ${at(0, vt('vt-memo'))}>${coverHTML(e, { list: [{ id: 'demo' }], k: .56, tilt: -1, fresh: true })}</div>
        <div class="b rise" ${at(.3)}>${lineHTML(e, { all: true, anim: true })}</div>
        <div class="pg-from i-from b type" ${at(.62)}>From <b>Trevor</b> · Facilities</div>`;
    }
    let seat = 0;
    const tag = (n, extra, cls = '') => `<div class="i-year ${cls}">${demoTag(n, .02 * seat++, extra, cls !== 'star')}</div>`;
    return `<div class="i-staff year">
      ${tag('Gary', `<span class="rubber red b thump" ${at(.22)}>Mole</span>`)}
      ${tag('Denise', `<div class="stickers b slap" ${at(.58)}><span class="stk beige">See me</span></div>`)}
      ${tag('Trevor', `<div class="stickers b slap" ${at(.62)}><span class="stk gold">Great work!</span><span class="stk blue" style="--r:4deg">Team player</span></div><span class="eoty b frame-in" ${at(.76)}><span>Employee of the Year</span></span>`, 'star')}
      ${tag('Moira', `<div class="stickers b slap" ${at(.66)}><span class="stk grey">Noted</span></div>`)}</div>`;
  }

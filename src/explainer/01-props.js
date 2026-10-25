  function demoCards() {
    const L = OP.LEX[setup.brand] || OP.LEX.op;
    return [{ s: 0, v: 2, w: 'Monetise' }, { s: 1, v: -1, w: L.t[0] || 'the Break Room' }, { s: 2, v: 1, w: 'Off the Books' }];
  }
  const demoTag = (name, tape = '') => `<div class="nametag"><span class="hello">Hello<small>my name is</small></span><b>${name}</b>${tape ? `<span class="tag-tape">${tape}</span>` : ''}</div>`;
  function demoPage(tpl = 'memo', approved = false) {
    return { id: 'demo', cards: demoCards(), revealed: [], subject: 'Quick Win: Break Room Monetisation (Pilot)', stamp: 'Rec', approved, style: { tpl } };
  }
  function trainingProp(id) {
    const cs = demoCards(), row = (cards, cls = '') => `<div class="lesson-cards ${cls}">${cards.map(c => cardHTML(c)).join('')}</div>`;
    const page = tpl => coverHTML(demoPage(tpl), { list: [{ id: 'demo' }], k: .76 });
    if (id === 'welcome' || id === 'signoff') return `<div class="binder"><span class="binder-seal">${brandMark()}</span><small>People &amp; Culture · Training film 01</small><strong>STAFF<br>INDUCTION</strong><span class="binder-label">${id === 'signoff' ? 'READ & UNDERSTOOD' : 'MANDATORY VIEWING'}</span><span class="binder-foot">${esc(brand().name)} · Enjoyment is mandatory.</span></div>`;
    if (id === 'goal') return `<div class="lesson-calculator"><div class="calc"><div class="lcd"><div class="ann">PROFIT TARGET</div><div class="val">${lcd(S ? S.target : OP.TARGETS[setup.players] - (setup.easy ? 3 : 0))}</div></div><div class="lesson-quarters">${[1,2,3,4,5].map(q => `<span>Q${q}</span>`).join('')}</div></div><span class="slip">Five quarters to make it work.</span></div>`;
    if (id === 'saboteurs') return `<div class="lesson-people">${['Gary','Denise','Trevor','Moira','Clive','You'].map(n => demoTag(n, '?')).join('')}</div><div class="lesson-memo"><span>CONFIDENTIAL · YOUR ROLE IS PRIVATE</span><b>Loyal <i>or</i> Saboteur</b></div>`;
    if (id === 'inherit') return `<span class="slip inherited-note">From the last manager</span>${row(cs)}<div class="lesson-suits"><span>Action</span><span>Target</span><span>Modifier</span></div>`;
    if (id === 'policy') return `${row([cs[0], { ...cs[1], v: 'V' }, { ...cs[2], w: 'Retroactively', fx: 'x2', v: -2 }])}<div class="lesson-equation">(Action + Target) × 2 − 2</div><span class="slip">? resolves to +2 or −2</span>`;
    if (id === 'overtime') {
      const spares = [{s:0,v:1,w:'Automate'},{s:1,v:2,w:'the Interns'},{s:2,v:0,w:'Pending Review'},{s:0,v:-1,w:'Outsource'},{s:1,v:1,w:'Customer Trust'},{s:2,v:2,w:'At Scale'}];
      const spent = OP.SWAP_COST[Object.keys(TRAIN.demo).length];
      const policy = cs.map((c, su) => TRAIN.demo[su] == null ? c : spares[TRAIN.demo[su]]);
      const hand = spares.map((c, i) => cardHTML(TRAIN.demo[c.s] === i ? cs[c.s] : c, '', '', `role="button" tabindex="0" data-a="lesson-swap" data-su="${c.s}" data-i="${i}" aria-label="Try swapping ${esc(c.w)}"`)).join('');
      return `<div class="purse lesson-purse" aria-label="${3 - spent} hours left">${[1,2,3].map(n => `<i class="slotbox${n > 3 - spent ? ' punched' : ''}">${n}</i>`).join('')}</div>${row(policy, 'mini-policy')}<div class="lesson-cards six">${hand}</div><span class="slip">Try a spare card · ${3 - spent} hours left · tap again to undo</span>`;
    }
    if (id === 'reveal') return `${row(cs.map((c,i) => ({...c, w:i ? '█████' : c.w})))}<div class="lesson-choices"><span class="slip">Show one · 1h</span><span class="slip">Re-deal three · 2h</span></div>`;
    if (id === 'stamp') return `${row(cs)}<div class="bar3 stampstrip lesson-stamps">${Object.keys(STAMP).map(k => `<button tabindex="-1" class="s-${k} ${k === 'Rec' ? 'right' : ''}" aria-pressed="${k === 'Rec'}">${STAMP[k]}</button>`).join('')}</div><span class="slip">✓ Honest answer · lying is your decision</span>`;
    if (id === 'cover') return `<div class="lesson-pages">${page('fax')}${page('memo')}${page('wordart')}</div>`;
    if (id === 'ceo') return `<div class="lesson-ceo">${demoTag('Denise','CEO')}${page('memo')}</div><div class="lesson-choices"><span class="vote-prop">RATIFY</span><span class="vote-prop open">OPEN IT</span></div>`;
    if (id === 'approved') return `${coverHTML(demoPage('memo', true), { list: [{id:'demo'}], k:.7 })}${lineHTML({...demoPage(), approved:true, resolved:[2,-1,1]}, {all:true})}<span class="slip">From Trevor · Facilities</span>`;
    return `<div class="lesson-people final-people">${demoTag('Trevor', 'EMPLOYEE OF THE YEAR')}${demoTag('Gary', 'SABOTEUR')}</div><div class="lesson-record"><b>THE ANNUAL REPORT</b><span>Correct accusation: claw back losses</span><span>Wrong accusation: −3</span><span>Best positive record on the winning side wins the award</span></div>`;
  }

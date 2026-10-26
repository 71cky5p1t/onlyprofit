  // Demonstration props only, never live hidden information. --at is when a beat lands, as a share of the chapter.
  const at = (f, more = '') => `style="--at:${f};${more}"`;
  // the same object keeps its name from chapter to chapter, so it moves rather than reappears
  const vt = name => `view-transition-name:${name}`;
  function demoCards() {
    const L = OP.LEX[setup.brand] || OP.LEX.op;
    return [{ s: 0, v: 2, w: 'Monetise' }, { s: 1, v: -1, w: L.t[0] || 'the Break Room' }, { s: 2, v: 1, w: 'Off the Books' }];
  }
  const demoTag = (name, f, extra = '', carry = true) => `<div class="nametag b deal" ${at(f || 0, carry ? vt('vt-tag-' + name) : '')}><span class="hello">Hello<small>my name is</small></span><b>${name}</b>${extra}</div>`;
  const demoPage = (tpl, o = {}) => ({ id: o.id || 'demo', cards: o.cards || demoCards(), revealed: [], subject: o.subject || 'Quick Win: Break Room Monetisation (Pilot)', stamp: o.stamp || 'Rec', approved: !!o.approved, style: { tpl } });
  const page = (tpl, o = {}) => coverHTML(demoPage(tpl, o), { list: [{ id: o.id || 'demo' }], k: o.k || .62, tilt: o.tilt });
  const squiggle = f => `<svg class="squig b draw" ${at(f)} viewBox="0 0 120 40" aria-hidden="true"><path pathLength="1" d="M4 28c8-14 14-20 18-14s-6 16 2 12 10-20 16-16-4 18 4 14 12-18 18-12-2 14 6 10 16-12 22-8 6 8 14 2"/></svg>`;
  const flipCard = (c, f, k) => `<div class="flip b deal-flip" ${at(f, vt('vt-c' + k))}>${cardHTML(c)}<i class="cback">${brandMark()}</i></div>`;
  const cardRow = (html, cls = '') => `<div class="i-cards ${cls}">${html}</div>`;
  function binderHTML(stamped) {
    const b = brand();
    return `<div class="i-binder b ${stamped ? 'settle' : 'drop-in'}" style="${vt('vt-binder')}"><i class="rings"></i><div class="sleeve"><small>${esc(b.name)} · People &amp; Culture</small><strong>Staff<br>Induction</strong><span class="seal">${brandMark()}</span></div>${stamped ? `<span class="rubber b thump" ${at(.4)}>Read &amp;<br>Understood</span>` : ''}</div>`;
  }
  // a hole for every hour spent; holes arrive on their own beat
  const punch = (spent, beats = []) => `<span class="purse i-purse">${[0, 1, 2].map(k => `<i class="slotbox${k < spent ? ' punched' : ''}${beats[k] != null ? ' b hole' : ''}" ${beats[k] != null ? at(beats[k]) : ''}>${k + 1}</i>`).join('')}</span>`;
  function trainingProp(id) {
    const cs = demoCards(), target = S ? S.target : OP.TARGETS[setup.players] - (setup.easy ? 3 : 0);
    if (id === 'welcome') return binderHTML(false);
    if (id === 'signoff') return binderHTML(true);
    if (id === 'goal') return `<div class="calc i-calc b rise"><div class="lcd"><div class="ann"><span>PROFIT</span><span>TARGET +${target}</span></div><div class="val" data-count="${target}">${lcd(0)}</div></div></div>
      <div class="i-qtabs">${[1, 2, 3, 4, 5].map(q => `<span class="b fan-in" ${at(.3 + q * .06)}>Q${q}</span>`).join('')}</div>`;
    if (id === 'saboteurs') return `<div class="i-staff">${['Gary', 'Denise', 'Trevor', 'Moira', 'Clive', 'You'].map((n, k) => `<div class="i-seat">${demoTag(n, k * .03)}
      <div class="i-role b ${k === 2 ? 'peek' : ''}" style="--at:${.74 + k * .025}"><i class="face back">${brandMark()}</i><i class="face front">Loyal</i>${k === 2 ? `<i class="under">Mole</i>` : ''}</div></div>`).join('')}</div>`;
    if (id === 'inherit') return `<div class="i-leaver b exit-left" ${at(.08)}>${demoTag('Gary')}</div>${cardRow(cs.map((c, k) => flipCard(c, .28 + k * .08, k)).join(''))}`;
    if (id === 'policy') return cardRow(cs.map((c, k) => cardHTML(c, 'b pop', '', at(.3 + k * .1, vt('vt-c' + k)))).join('') + cardHTML({ s: 2, v: 'V', w: 'Going Forward' }, 'b spin-in coin', '', at(.78)));
    if (id === 'overtime') return overtimeProp(cs);
    if (id === 'stamp') return `<div class="i-stamp" ${at(.42, vt('vt-memo'))}>${page('memo', { cards: [cs[0], cs[1], { s: 2, v: 'V', w: 'Going Forward' }], stamp: 'Rec', tilt: -2 })}<span class="stk pip b slap" ${at(.74)}>PIP</span></div>
      <div class="bar3 stampstrip i-strip">${Object.keys(STAMP).map(k => `<button tabindex="-1" class="s-${k}${k === 'Risky' ? ' right' : ''}"><span class="${k === 'Rec' ? 'b press' : ''}" ${k === 'Rec' ? at(.38) : ''}>${STAMP[k]}</span></button>`).join('')}</div>`;
    if (id === 'cover') return `<div class="i-riffle">${['memo', 'report', 'wordart', 'fax'].map((t, k) => `<div class="leaf b ${k ? 'riffle' : 'keep'}" ${k ? at(.06 + (4 - k) * .07) : at(.88, vt('vt-memo'))}>${page(t, { tilt: (k - 1.5) * 2.4 })}${k ? '' : squiggle(.62)}</div>`).join('')}</div>`;
    return trainingProp2(id, cs);
  }

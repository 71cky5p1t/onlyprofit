  // ---------- pieces ----------
  function meter() {
    const lo = Math.min(-6, S.profit), hi = Math.max(S.target + 4, S.profit + 1), pct = v => ((v - lo) / (hi - lo)) * 100;
    const z = pct(0), p = pct(S.profit), left = Math.min(z, p), w = Math.abs(p - z);
    return `<div class="meter" aria-label="Profit ${fmt(S.profit)} of target ${S.target}">
      <div class="meter-lcd"><span class="ann"><span>PROFIT</span><span>TARGET +${S.target}</span></span><span class="v" id="lcd-profit">${lcd(ui.shown == null ? S.profit : ui.shown)}</span></div>
      <div class="meter-track"><div class="bar"><div class="meter-zero" style="left:${z}%"></div><div class="meter-fill ${S.profit < 0 ? 'neg' : ''}" style="left:${left}%;width:${w}%"></div><div class="meter-tick" style="left:calc(${pct(S.target)}% - 1px)"></div>${S.r ? `<div class="meter-pace" style="left:calc(${pct(S.target * Math.min(5, S.r) / 5)}% - 1px)"></div>` : ''}</div><div class="lbl"><span>Q${Math.max(1, S.r)}/5</span><span>Target</span></div></div></div>`;
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
  // the CEO sticker: a dog-eared one for this quarter, and a peeled-off gummy patch for every term before it
  function ceoMarks(p, live) {
    const past = S.history.filter(h => h.ceo === p.id).map(h => h.r);
    const gone = past.map(r => `<i class="ceo-gone" style="--k:${(p.id * 3 + r * 5) % 7}" aria-hidden="true"></i>`).join('');
    const now = S.r && S.ceo === p.id && live ? '<i class="ceo-stk">CEO</i>' : '';
    return gone || now ? `<span class="ceo-marks"${past.length ? ` aria-label="CEO ${past.length} time${past.length > 1 ? 's' : ''} before"` : ''}>${gone}${now}</span>` : '';
  }
  // staff are the name tags from the phone; the CEO rotation is a row of desk name plates
  function staffHTML() {
    const live = S.phase !== 'end' && S.phase !== 'whistle';
    const tags = S.P.map(p => {
      const meta = [];
      if (p.leave) meta.push('<i class="tag-tape grey">Stood down</i>');
      if (p.spec && ui.debug) meta.push(`<i class="tag-tape gold">${p.spec}</i>`);
      if (ui.debug || S.phase === 'end') meta.push(`<i class="tag-tape ${p.sab ? 'red' : 'green'}">${p.sab ? 'Saboteur' : 'Loyal'}</i>`);
      const dept = S.r && ui.debug ? `<small class="tag-dept">${OP.DEPTS[p.dept]}</small>` : '';
      return `<div class="nametag staff-tag${p.leave ? ' down' : ''}" style="--r:${((p.id * 5) % 7 - 3) * .7}deg"><span class="hello">Hello<small>my name is</small></span>
        <b>${p.id === ME && mine() && ui.badge ? `<img class="ink-name" src="${ui.badge}" alt="You">` : esc(p.name)}</b>${dept}${meta.length ? `<span class="tag-tapes">${meta.join('')}</span>` : ''}${stickers(p)}${ceoMarks(p, live)}</div>`;
    }).join('');
    const plates = OP.ceoSchedule(S).map(c => `<div class="plate-n${c.r === S.r && live ? ' now' : c.r < S.r ? ' past' : ''}"><small>Q${c.r}</small><b>${c.who == null ? esc(c.note) : esc(nm(c.who))}</b></div>`).join('');
    return `<section class="staff-desk" aria-label="Staff"><div class="staff-tags">${tags}</div><div class="plates" aria-label="CEO rotation">${plates}</div></section>`;
  }
  function observerHTML() {
    if (!ui.debug) return '';
    const sus = S.P.map(p => `<span class="pill ${p.sab ? 'red' : 'green'}">${esc(p.name)} · ${p.sab ? (p.ruthless ? 'SAB · ruthless' : 'SAB') : `LOYAL · ${OP.PERS_SAY[p.pers]}`} · sus ${OP.suspicion(S, p).toFixed(1)}</span>`).join('');
    return `<section class="observer"><div class="section-head" style="margin:0;border-bottom-width:1px"><h2>Observer view</h2><span class="label">Hidden from players</span></div>
      <div style="font-size:13.5px">Headcount Memo: <b>${S.nSab} saboteur${S.nSab === 1 ? '' : 's'}</b>. Loyal bots play <b>${TIER[S.loyalTier]}</b>; saboteur bots play <b>${TIER[S.sabTier]}</b>. Seed <span class="mono">${S.seed}</span>.
      ${S.nextStyle ? ` Designer has set next quarter: ${S.nextStyle.tpl} in ${S.nextStyle.font}.` : ''}</div>
      <div class="observer-grid">${sus}</div>
      <div class="hint">Debug strips show allegiance · bot mode (loyal, good = saboteur playing clean, disguised, bad) · true value · what the table would estimate · tokens spent. "sus" is the end-of-game Whistleblower score the bots use.</div></section>`;
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
    const b = S.board;
    if (ph === 'reveal' && b && b.opened && b.best !== b.nominee) {
      const side = (id, k) => { const e = envs.find(x => x.id === id); return `<div class="vs-side">${pageHTML(e, { motion: e.approved && anim ? 'pull' : '', faded: !e.approved })}<span class="vs-est ${tone(Math.round(b.est[k]))}">≈ ${fmt(Math.round(b.est[k]))}</span></div>`; };
      return `<section><div class="vs">${side(b.nominee, 0)}<i class="vs-x ${b.overruled ? 'over' : ''}">${b.overruled ? (b.own ? 'Overruled · CEO’s own' : 'Overruled') : 'It stands'}</i>${side(b.best, 1)}</div></section>`;
    }
    return `<section><div class="pages n${envs.length}">${envs.map(e => pageHTML(e, { motion: motion(e), click, faded: ((ph === 'reveal' || ph === 'review') && !e.approved) || (ph === 'board' && e.id !== S.nominee) })).join('')}</div></section>`;
  }
  function exitHTML() {
    const rounds = S.history.map(h => {
      const rows = h.envs.slice().sort((a, b) => a.id.localeCompare(b.id)).map(e => {
        const p = S.P[e.author];
        const vals = e.cards.map((c, k) => `<span class="${tone(e.resolved ? e.resolved[k] : c.v)}">${fmt(e.resolved ? e.resolved[k] : c.v)}${c.fx ? ' ' + FXSYM[c.fx] : ''}</span>`).join(' ');
        const tot = e.resolved ? OP.total(e.resolved, e.cards) : evs(e.cards);
        return `<tr class="${e.id === h.pick ? 'win' : ''}"><td class="num nw"><b class="ico-cell">${icon(e.id, h.envs)}</b>${e.id === h.pick ? ' ✓' : ''}${e.id === h.audit ? ' <span class="pill blue">aud</span>' : ''}</td>
          <td class="nw">${e.autopilot ? 'Autopilot · ' : ''}${esc(p.name)} <span class="pill ${p.sab ? 'red' : 'green'}">${p.sab ? 'Sab' : 'Loyal'}</span></td>
          <td class="muted">${OP.DEPTS[e.dept]}</td><td class="sub-mono">${esc(e.subject)}</td><td>${STAMP[e.stamp]}</td><td class="num nw">${vals}</td><td class="num ${tone(tot)}"><b>${fmt(tot)}</b></td></tr>`;
      }).join('');
      const memos = h.memos.filter(m => m.kind === 'report').map(m => `${esc(nm(m.by))} accused ${esc(nm(m.target))}${m.truthful ? '' : ' <span class="lie">LIE</span>'}`).join(' · ');
      return `<div class="exit-round"><h3>Q${h.r}<span class="label">CEO ${esc(nm(h.ceo))}</span>${h.warn && h.warn.passed ? `<span class="label">Warning: ${esc(nm(h.warn.target))}</span>` : ''}</h3>
        <div class="scroll-x"><table class="exit-t"><thead><tr><th>Page</th><th>Author</th><th>Dept</th><th>Subject</th><th>Stamp</th><th>Cards</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div>
        ${memos ? `<div class="hint">${memos}</div>` : ''}</div>`;
    }).join('');
    return `<section><div class="section-head"><h2>Exit interview</h2></div><div class="exit">${rounds}</div></section>`;
  }

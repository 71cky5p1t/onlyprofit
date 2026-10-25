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
      <div class="logo"><span class="logo-mark" aria-hidden="true">${brandMark()}</span><span class="logo-type"><span class="brand-name">${esc(brand().name)}</span><small>${esc(brand().suffix)} · Playtest build 0.4</small></span></div>
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
  function authorVisible(e) {
    if (e.approved || ui.debug) return true;
    if (!mine()) return false;
    if (e.author === ME) return true;
    return me().spec === 'Auditor' && !me().leave;
  }
  // one proposal on the TV: the cover page, its sentence once anything is shown, then the paperwork
  function pageHTML(e, opt) {
    opt = opt || {};
    const who = authorVisible(e) ? (e.autopilot ? 'Autopilot' : (mine() && e.author === ME ? 'You' : nm(e.author))) : null;
    const dept = (ui.debug || e.approved || (mine() && e.author === ME)) ? OP.DEPTS[e.dept] : null;
    const tags = [];
    if (e.audited) tags.push('<span class="pill blue">Audited</span>');
    if (e.autopilot) tags.push('<span class="pill grey">Autopilot</span>');
    if (e.unmasked && !e.approved) tags.push(`<span class="pill red">Overruled · ${e.author === S.ceo ? 'the CEO’s own' : esc(nm(e.author))}</span>`);
    if (mine() && !ui.debug && me().spec === 'Auditor' && e.author !== ME && !e.approved) tags.push('<span class="pill gold">Auditor sight</span>');
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
    return `<section><div class="section-head"><h2>Bulletin board</h2><span class="label">Memos are unverifiable</span></div>
      <div class="feed">${cur.length ? cur.map(item).join('') : '<div class="feed-empty">Nothing posted this quarter yet.</div>'}</div>
      ${old.length ? `<details class="rules" style="margin-top:10px"><summary>Earlier quarters (${old.length})</summary><div class="feed" style="margin-top:8px">${old.map(item).join('')}</div></details>` : ''}</section>`;
  }
  function ledgerHTML() {
    const rows = [1, 2, 3, 4, 5].map(r => {
      const l = S.ledger.find(x => x.r === r);
      if (!l) return `<tr><td class="num muted">Q${r}</td><td colspan="2" class="muted">${r === S.r ? 'In progress' : '—'}</td><td class="n muted">—</td></tr>`;
      const fresh = r === S.r && ui.printed !== r && (S.phase === 'reveal' || S.phase === 'review');
      if (fresh) ui.printed = r;
      return `<tr class="${fresh ? 'new' : ''}"><td class="num">Q${r}</td><td><div class="sub-mono">${esc(l.subject)}</div><span class="muted" style="font-size:12px">${STAMP[l.stamp]} · approved by ${esc(nm(l.ceo))}</span></td><td>${l.autopilot ? 'Autopilot' : esc(nm(l.author))}</td><td class="n ${tone(l.actual)}">${fmt(l.actual)}</td></tr>`;
    }).join('');
    const wb = S.whistle && S.whistle.named != null ? `<tr><td class="num">WB</td><td colspan="2">${S.whistle.correct && S.whistle.clawed.length ? `Clawback: ${esc(nm(S.whistle.named))}, ${S.whistle.clawed.map(c => 'Q' + c.r).join(', ')} reversed` : `Whistleblower: ${esc(nm(S.whistle.named))}`}</td><td class="n ${S.whistle.correct ? 'pos' : 'neg'}">${fmt(S.whistle.swing)}</td></tr>` : '';
    return `<section><div class="section-head"><h2>Quarterly ledger</h2><span class="label">Target +${S.target}${S.easy ? ' (easy)' : ''}</span></div>
      <table class="ledger"><thead><tr><th>Qtr</th><th>Approved policy</th><th>Author</th><th style="text-align:right">Δ</th></tr></thead><tbody>${rows}${wb}</tbody>
      <tfoot><tr><td colspan="3">Total</td><td class="n ${S.profit < 0 ? 'neg' : ''}">${fmt(S.profit)}</td></tr></tfoot></table></section>`;
  }
  function pips(n) { return `<span class="warn-pips" title="${n} written warning${n === 1 ? '' : 's'}"><i class="${n >= 1 ? 'on' : ''}"></i><i class="${n >= 2 ? 'on' : ''}"></i></span>`; }
  function staffHTML() {
    const rows = S.P.map(p => {
      const meta = [];
      if (S.r && S.ceo === p.id && S.phase !== 'end' && S.phase !== 'whistle') meta.push('<span class="pill">CEO</span>');
      if (p.leave) meta.push('<span class="pill grey">Stood down</span>');
      if (p.spec && (ui.debug || (mine() && p.id === ME))) meta.push(`<span class="pill gold">${p.spec}</span>`);
      if (ui.debug || S.phase === 'end') meta.push(p.sab ? '<span class="pill red">Saboteur</span>' : '<span class="pill green">Loyal</span>');
      meta.push(stickers(p));
      const dept = (S.r && (ui.debug || (mine() && p.id === ME))) ? `<span class="muted" style="font-size:12px"> · ${OP.DEPTS[p.dept]}</span>` : '';
      return `<div class="staff-row"><div><span class="staff-name">${p.id === ME && mine() && ui.badge ? `<img class="ink-name" src="${ui.badge}" alt="You">` : esc(p.name)}</span>${dept}</div><div class="staff-meta">${meta.join('')}</div></div>`;
    }).join('');
    const sched = OP.ceoSchedule(S).map(c => `<div class="${c.r === S.r && S.phase !== 'end' && S.phase !== 'whistle' ? 'now' : ''}"><span class="label">Q${c.r}</span><span class="nm">${c.who == null ? esc(c.note) : esc(nm(c.who))}</span></div>`).join('');
    return `<section><div class="section-head"><h2>Staff directory</h2><span class="label">${S.n} employees</span></div><div class="staff">${rows}</div>
      <div class="label" style="margin-top:16px">CEO rotation</div><div class="sched">${sched}</div></section>`;
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
      const cells = S.P.map((p, i) => i < sealed ? '<div class="placeholder sealed">Handed in</div>' : `<div class="placeholder">${mine() && S.work[ME] && i === sealed ? 'Your desk is open' : 'Working…'}</div>`).join('');
      return `<section><div class="section-head"><h2>Proposals</h2><span class="label">${sealed} of ${S.n} handed in</span></div><div class="pages">${cells}</div></section>`;
    }
    if (!['decide', 'board', 'reveal', 'review'].includes(ph)) return '';
    const click = ph === 'decide' && isCEO() ? 'sel' : null;
    const envs = S.envs.slice().sort((a, b) => a.id.localeCompare(b.id));
    const animKey = `${S.r}|${ph}`, anim = ui.envAnim !== animKey && !still();
    ui.envAnim = animKey;
    const motion = e => !anim ? '' : ph === 'board' ? (e.id === S.nominee ? 'pick' : 'fall') : ph === 'reveal' && e.approved ? 'pull' : '';
    const hint = ph === 'decide' ? (isCEO() ? 'You are CEO. Nominate one.' : 'Awaiting the CEO') : ph === 'board' ? `The Board is voting on ${icon(S.nominee)}` : 'Approved policy unmasked';
    return `<section><div class="section-head"><h2>Proposals on the table</h2><span class="label">${hint}</span></div>
      <div class="pages">${envs.map(e => pageHTML(e, { motion: motion(e), click, faded: ((ph === 'reveal' || ph === 'review') && !e.approved) || (ph === 'board' && e.id !== S.nominee) })).join('')}</div></section>`;
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
    return `<section><div class="section-head"><h2>Exit interview</h2><span class="label">Every proposal, unmasked. * = volatile</span></div><div class="exit">${rounds}</div></section>`;
  }

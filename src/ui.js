// Only Profit — browser UI. Renders from engine state; every change goes through OP.apply.
(() => {
  const $app = document.getElementById('app');
  const ME = 0;
  let S = null, draft = null, err = '', toastT = null;
  let setup = { players: 4, loyalTier: 'smart', sabTier: 'smart', easy: false, spectate: false, seed: '' };
  const ui = { debug: false, sel: null };
  try { ui.debug = localStorage.getItem('op-debug') === '1'; } catch (e) {}

  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = OP.fmt, evs = OP.evs;
  const tone = v => (v === 'V' ? 'gold' : v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero');
  const nm = i => (i === 'table' ? 'The table' : S.P[i].name);
  const mine = () => S && !S.spectate;
  const me = () => S.P[ME];
  const isCEO = () => mine() && S.ceo === ME;
  const STAMP = OP.STAMP_LABEL;
  const TIER = { smart: 'Smart', basic: 'Basic', naive: 'Gullible', patient: 'Patient', blatant: 'Blatant' };
  const PHASE = { brief: 'Onboarding', work: 'Work', pitch: 'Pitch + audit', decide: 'Decide', reveal: 'Reveal', review: 'Reveal', whistle: 'Whistleblower', end: 'Exit interview' };

  // ---------- actions ----------
  function dispatch(a) {
    const r = OP.apply(S, S.spectate ? -1 : ME, a);
    if (r.error) { err = r.error; render(); return; }
    err = ''; S = r.state; ui.sel = null;
    draft = S.phase === 'work' && S.work[ME] ? newDraft() : null;
    render();
  }
  function newDraft() {
    const p = me(), inh = p.inh;
    return { redeal: false, swaps: [], reveals: [], stamp: null, words: OP.SUBJ.map(l => Math.floor(Math.random() * l.length)), custom: '', useCustom: false,
      style: Object.assign({}, S.reqStyle || p.fav), claim: { kind: 'none', val: evs(inh.cards), stamp: inh.stamp || 'Rec' }, nextStyle: null };
  }
  const subjectOf = d => (d.useCustom && d.custom.trim() ? d.custom.trim() : d.words.map((k, i) => OP.SUBJ[i][k]).join(' '));
  function costWith(ch) { return OP.workCost(Object.assign({}, draft, ch)); }
  function toast(t) { let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200); }

  // ---------- pieces ----------
  function meter() {
    const lo = Math.min(-6, S.profit), hi = Math.max(S.target + 4, S.profit + 1), pct = v => ((v - lo) / (hi - lo)) * 100;
    const z = pct(0), p = pct(S.profit), left = Math.min(z, p), w = Math.abs(p - z);
    return `<div class="meter" aria-label="Profit ${fmt(S.profit)} of target ${S.target}">
      <div class="meter-row"><span class="label">Profit</span><b class="${S.profit < 0 ? 'neg' : ''}">${fmt(S.profit)} <span class="muted" style="font-size:12px">/ +${S.target}</span></b></div>
      <div class="meter-track"><div class="meter-zero" style="left:${z}%"></div><div class="meter-fill ${S.profit < 0 ? 'neg' : ''}" style="left:${left}%;width:${w}%"></div><div class="meter-tick" style="left:calc(${pct(S.target)}% - 1px)" title="Target"></div></div></div>`;
  }
  function mast() {
    const stats = S ? `<div class="stat"><span class="label">Quarter</span><b>Q${Math.max(1, S.r)}<span class="muted"> / 5</span></b></div>
      <div class="stat"><span class="label">CEO</span><b style="font-family:var(--f-body)">${S.r ? esc(nm(S.ceo)) : '—'}</b></div>${meter()}` : '';
    return `<header class="mast"><div class="wrap">
      <div class="logo"><span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span><span class="logo-type">Only Profit<small>Inc. · Playtest build 0.1</small></span></div>
      <div class="mast-stats">${stats}<div class="tools">
        <button class="chip-btn" data-a="debug" aria-pressed="${ui.debug}" title="Show hidden roles, envelope contents and bot reasoning">Observer</button>
        ${S ? '<button class="chip-btn" data-a="quit">New game</button>' : ''}</div></div></div></header>`;
  }
  function cardHTML(c, cls, extra) {
    return `<div class="card ${cls || ''}">${extra || ''}<span class="word">${esc(c.w)}</span><span class="val ${tone(c.v)}">${fmt(c.v)}</span></div>`;
  }
  function authorVisible(e) {
    if (e.approved || ui.debug) return true;
    if (!mine()) return false;
    if (e.author === ME) return true;
    return me().spec === 'Auditor' && !me().leave;
  }
  function envHTML(e, opt) {
    opt = opt || {};
    const showAll = e.audited || e.autopilot || e.approved || ui.debug || (mine() && e.author === ME);
    const vis = su => showAll || (isCEO() && e.revealed.includes(su));
    const anyVis = [0, 1, 2].some(vis);
    const cards = anyVis ? `<div class="env-cards">${e.cards.map((c, su) => {
      if (!vis(su)) return `<div class="env-card hidden"><span class="w">${OP.SUITS[su]}</span><b>?</b></div>`;
      const v = e.resolved ? e.resolved[su] : c.v;
      return `<div class="env-card"><span class="w">${esc(c.w)}</span><b class="${tone(v)}">${fmt(v)}${e.resolved && c.v === 'V' ? '*' : ''}</b></div>`;
    }).join('')}</div>` : '';
    const who = authorVisible(e) ? (e.autopilot ? 'Autopilot' : (mine() && e.author === ME ? 'You' : nm(e.author))) : null;
    const dept = (ui.debug || e.approved || (mine() && e.author === ME)) ? OP.DEPTS[e.dept] : null;
    const tags = [];
    if (e.audited) tags.push('<span class="pill blue">Audited</span>');
    if (e.autopilot) tags.push('<span class="pill grey">Autopilot</span>');
    if (isCEO() && e.revealed.length && !showAll) tags.push(`<span class="pill blue">${e.revealed.length} shown to you</span>`);
    if (mine() && e.author === ME && !e.approved) tags.push('<span class="pill grey">Yours</span>');
    if (mine() && !ui.debug && me().spec === 'Auditor' && e.author !== ME && !e.approved) tags.push('<span class="pill gold">Auditor sight</span>');
    const dbg = ui.debug ? `<div class="env-dbg">${S.P[e.author].sab ? 'SAB' : 'LOYAL'} · ${esc(e.mode)} · true ${fmt(evs(e.cards))} · table est ${OP.estimate(e, S.loyalTier, false).toFixed(1)} · spent ${e.cost}${e.redeal ? ' · re-dealt' : ''}${e.revealed.length ? ' · showed CEO ' + e.revealed.map(s => OP.SUITS[s][0]).join('') : ''}</div>` : '';
    const tag = opt.click ? 'button' : 'div';
    return `<${tag} class="env c-${e.style.color} t-${e.style.trim} ${ui.sel === e.id ? 'sel' : ''} ${e.approved ? 'approved' : ''} ${opt.faded ? 'faded' : ''}" ${opt.click ? `data-a="${opt.click}" data-id="${e.id}" aria-pressed="${ui.sel === e.id}"` : ''}>
      <div class="env-top"><span class="env-id">${e.id}</span><span class="env-kind">Inter-office<br>mail</span><span class="clasp" aria-hidden="true"></span></div>
      <div class="env-subj">${esc(e.subject)}</div>
      <div class="env-route"><div><span>From</span>${who ? `<b>${esc(who)}</b>` : '<i class="redact"></i>'}</div><div><span>Dept</span>${dept ? esc(dept) : '<i class="redact"></i>'}</div></div>
      <div class="env-stamp ${e.stamp}">${STAMP[e.stamp]}</div>
      ${tags.length ? `<div class="env-tags">${tags.join('')}</div>` : ''}${cards}${dbg}
      ${e.approved ? '<span class="big-stamp" aria-hidden="true">Approved</span>' : ''}</${tag}>`;
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
      return `<tr><td class="num">Q${r}</td><td><div class="sub-mono">${esc(l.subject)}</div><span class="muted" style="font-size:12px">${STAMP[l.stamp]} · approved by ${esc(nm(l.ceo))}</span></td><td>${l.autopilot ? 'Autopilot' : esc(nm(l.author))}</td><td class="n ${tone(l.actual)}">${fmt(l.actual)}</td></tr>`;
    }).join('');
    const wb = S.whistle && S.whistle.named != null ? `<tr><td class="num">WB</td><td colspan="2">Whistleblower: ${esc(nm(S.whistle.named))}</td><td class="n ${S.whistle.correct ? 'pos' : 'neg'}">${S.whistle.correct ? '+3' : '−3'}</td></tr>` : '';
    return `<section><div class="section-head"><h2>Quarterly ledger</h2><span class="label">Target +${S.target}${S.easy ? ' (easy)' : ''}</span></div>
      <table class="ledger"><thead><tr><th>Qtr</th><th>Approved policy</th><th>Author</th><th style="text-align:right">Δ</th></tr></thead><tbody>${rows}${wb}</tbody>
      <tfoot><tr><td colspan="3">Total</td><td class="n ${S.profit < 0 ? 'neg' : ''}">${fmt(S.profit)}</td></tr></tfoot></table></section>`;
  }
  function pips(n) { return `<span class="warn-pips" title="${n} written warning${n === 1 ? '' : 's'}"><i class="${n >= 1 ? 'on' : ''}"></i><i class="${n >= 2 ? 'on' : ''}"></i></span>`; }
  function staffHTML() {
    const rows = S.P.map(p => {
      const meta = [];
      if (S.r && S.ceo === p.id && S.phase !== 'end' && S.phase !== 'whistle') meta.push('<span class="pill">CEO</span>');
      if (p.leave) meta.push('<span class="pill grey">Garden leave</span>');
      if (p.spec && (ui.debug || (mine() && p.id === ME))) meta.push(`<span class="pill gold">${p.spec}</span>`);
      if (ui.debug || S.phase === 'end') meta.push(p.sab ? '<span class="pill red">Saboteur</span>' : '<span class="pill green">Loyal</span>');
      if (p.accusations) meta.push(`<span class="muted" style="font-size:12px">${p.accusations} complaint${p.accusations > 1 ? 's' : ''}</span>`);
      meta.push(`<span class="muted num" style="font-size:12px">${p.approved.length} appr.</span>`);
      meta.push(pips(p.warnings));
      const dept = (S.r && (ui.debug || (mine() && p.id === ME))) ? `<span class="muted" style="font-size:12px"> · ${OP.DEPTS[p.dept]}</span>` : '';
      return `<div class="staff-row"><div><span class="staff-name">${esc(p.name)}</span>${dept}</div><div class="staff-meta">${meta.join('')}</div></div>`;
    }).join('');
    const sched = OP.ceoSchedule(S).map(c => `<div class="${c.r === S.r && S.phase !== 'end' && S.phase !== 'whistle' ? 'now' : ''}"><span class="label">Q${c.r}</span><span class="nm">${c.who == null ? esc(c.note) : esc(nm(c.who))}</span></div>`).join('');
    return `<section><div class="section-head"><h2>Staff directory</h2><span class="label">${S.n} employees</span></div><div class="staff">${rows}</div>
      <div class="label" style="margin-top:16px">CEO rotation</div><div class="sched">${sched}</div></section>`;
  }
  function observerHTML() {
    if (!ui.debug) return '';
    const sus = S.P.map(p => `<span class="pill ${p.sab ? 'red' : 'green'}">${esc(p.name)} · ${p.sab ? 'SAB' : 'LOYAL'} · sus ${OP.suspicion(S, p).toFixed(1)}</span>`).join('');
    return `<section class="observer"><div class="section-head" style="margin:0;border-bottom-width:1px"><h2>Observer view</h2><span class="label">Hidden from players</span></div>
      <div style="font-size:13.5px">Headcount Memo: <b>${S.nSab} saboteur${S.nSab === 1 ? '' : 's'}</b>. Loyal bots play <b>${TIER[S.loyalTier]}</b>; saboteur bots play <b>${TIER[S.sabTier]}</b>. Seed <span class="mono">${S.seed}</span>.
      ${S.nextStyle ? ` Designer has set next quarter: ${S.nextStyle.color}/${S.nextStyle.trim}.` : ''}</div>
      <div class="observer-grid">${sus}</div>
      <div class="hint">Envelope strips show allegiance · bot mode (loyal, good = saboteur playing clean, disguised, bad) · true value · what the table would estimate · tokens spent. "sus" is the end-of-game Whistleblower score the bots use.</div></section>`;
  }
  function envelopesHTML() {
    const ph = S.phase;
    if (ph === 'work') {
      const sealed = S.envs.length;
      const cells = S.P.map((p, i) => i < sealed ? '<div class="placeholder sealed">Sealed</div>' : `<div class="placeholder">${mine() && S.work[ME] && i === sealed ? 'Your desk is open' : 'Working…'}</div>`).join('');
      return `<section><div class="section-head"><h2>Envelopes</h2><span class="label">${sealed} of ${S.n} sealed</span></div><div class="envs">${cells}</div></section>`;
    }
    if (!['pitch', 'decide', 'reveal', 'review'].includes(ph)) return '';
    const click = ph === 'pitch' && mine() ? 'sel' : ph === 'decide' && isCEO() ? 'sel' : null;
    const envs = S.envs.slice().sort((a, b) => a.id.localeCompare(b.id));
    const hint = ph === 'pitch' ? 'Shuffled. No authors, no departments.' : ph === 'decide' ? (isCEO() ? 'You are CEO. Pick one.' : 'Awaiting the CEO') : 'Approved policy unmasked';
    return `<section><div class="section-head"><h2>Envelopes on the table</h2><span class="label">${hint}</span></div>
      <div class="envs">${envs.map(e => envHTML(e, { click: click && !(ph === 'pitch' && e.autopilot) ? click : null, faded: (ph === 'reveal' || ph === 'review') && !e.approved })).join('')}</div></section>`;
  }
  function exitHTML() {
    const rounds = S.history.map(h => {
      const rows = h.envs.slice().sort((a, b) => a.id.localeCompare(b.id)).map(e => {
        const p = S.P[e.author];
        const vals = e.cards.map((c, k) => `<span class="${tone(e.resolved ? e.resolved[k] : c.v)}">${fmt(e.resolved ? e.resolved[k] : c.v)}</span>`).join(' ');
        const tot = e.resolved ? e.resolved.reduce((a, b) => a + b, 0) : evs(e.cards);
        return `<tr class="${e.id === h.pick ? 'win' : ''}"><td class="num nw"><b>${e.id}</b>${e.id === h.pick ? ' ✓' : ''}${e.id === h.audit ? ' <span class="pill blue">aud</span>' : ''}</td>
          <td class="nw">${e.autopilot ? 'Autopilot · ' : ''}${esc(p.name)} <span class="pill ${p.sab ? 'red' : 'green'}">${p.sab ? 'Sab' : 'Loyal'}</span></td>
          <td class="muted">${OP.DEPTS[e.dept]}</td><td class="sub-mono">${esc(e.subject)}</td><td>${STAMP[e.stamp]}</td><td class="num nw">${vals}</td><td class="num ${tone(tot)}"><b>${fmt(tot)}</b></td></tr>`;
      }).join('');
      const memos = h.memos.filter(m => m.kind === 'report').map(m => `${esc(nm(m.by))} accused ${esc(nm(m.target))}${m.truthful ? '' : ' <span class="lie">LIE</span>'}`).join(' · ');
      return `<div class="exit-round"><h3>Q${h.r}<span class="label">CEO ${esc(nm(h.ceo))}</span>${h.warn && h.warn.passed ? `<span class="label">Warning: ${esc(nm(h.warn.target))}</span>` : ''}</h3>
        <div class="scroll-x"><table class="exit-t"><thead><tr><th>Env</th><th>Author</th><th>Dept</th><th>Subject</th><th>Stamp</th><th>Cards</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div>
        ${memos ? `<div class="hint">${memos}</div>` : ''}</div>`;
    }).join('');
    return `<section><div class="section-head"><h2>Exit interview</h2><span class="label">Every envelope, unmasked. * = volatile</span></div><div class="exit">${rounds}</div></section>`;
  }

  // ---------- desk ----------
  function deskWrap(title, right, body) {
    return `<aside class="desk" aria-label="Your desk"><div class="desk-head"><h3>${title}</h3>${right || ''}</div><div class="desk-body">${body}${err ? `<div class="err" role="alert">${esc(err)}</div>` : ''}</div></aside>`;
  }
  function tokenPips(spent) { return `<span class="tokens" aria-label="${3 - spent} of 3 work tokens left">${[0, 1, 2].map(k => `<i class="${k < 3 - spent ? 'on' : ''}"></i>`).join('')}</span>`; }
  function provenance(inh) {
    if (inh.kind === 'legacy') return 'A <b>legacy policy</b> left by management who have since moved on to new opportunities.';
    if (inh.kind === 'cleanup') return `<b>Post-launch cleanup</b>: the spare cards from ${inh.author === ME ? 'your own' : esc(nm(inh.author)) + "'s"} approved policy last quarter.`;
    if (inh.kind === 'autopilot') return 'Cards from a department that was on <b>autopilot</b>. No one to blame.';
    return `A rejected envelope from <b>${inh.author === ME ? 'yourself' : esc(nm(inh.author))}</b>, stamped <b>${STAMP[inh.stamp]}</b>, subject <span class="mono">${esc(inh.subject)}</span>. Only you know what was inside.`;
  }
  function deskWork() {
    const p = me(), inh = p.inh, wr = OP.workResult(S, ME, draft), cost = OP.workCost(draft);
    const cols = [0, 1, 2].map(su => {
      const on = draft.swaps.includes(su);
      const next = on ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su);
      const cNext = costWith({ swaps: next });
      const nth = on ? '' : `${OP.SWAP_COST[next.length] - OP.SWAP_COST[draft.swaps.length]}`;
      const rv = draft.reveals.includes(su);
      const rvNext = costWith({ reveals: rv ? draft.reveals.filter(x => x !== su) : draft.reveals.concat(su) });
      return `<div class="suit-col"><span class="label">${OP.SUITS[su]}</span>
        ${cardHTML(wr.prop[su], '', rv ? '<span class="rev-tag">SHOWN TO CEO</span>' : '')}
        <button class="reveal-btn" data-a="reveal" data-su="${su}" aria-pressed="${rv}" ${!rv && rvNext > 3 ? 'disabled' : ''}>${rv ? 'Hide' : 'Show CEO · 1'}</button>
        <button class="swap" data-a="swap" data-su="${su}" aria-pressed="${on}" ${!on && cNext > 3 ? 'disabled' : ''}>${on ? 'Undo swap' : `⇅ Swap · ${nth}`}</button>
        ${cardHTML(wr.aside[su], 'spare')}</div>`;
    }).join('');
    const v = evs(wr.prop), vol = wr.prop.some(c => c.v === 'V');
    const canRedeal = !draft.redeal && costWith({ redeal: true }) <= 3;
    const claimable = inh.kind === 'rejected' && inh.author != null && inh.author !== ME;
    const claim = claimable ? `<div class="block"><span class="label">Memo to the bulletin board (optional)</span>
      <div class="radio-list">
        <button class="radio" data-a="claim" data-k="none" aria-pressed="${draft.claim.kind === 'none'}"><span class="grow">Say nothing</span></button>
        <button class="radio" data-a="claim" data-k="report" aria-pressed="${draft.claim.kind === 'report'}"><span class="grow">Report ${esc(nm(inh.author))}<div class="sub">Files a complaint. Nobody can check it.</div></span></button>
        <button class="radio" data-a="claim" data-k="vouch" aria-pressed="${draft.claim.kind === 'vouch'}"><span class="grow">Vouch for ${esc(nm(inh.author))}</span></button></div>
      ${draft.claim.kind === 'report' ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <label class="field"><span class="hint">Say it was stamped</span><select class="input" id="claim-stamp" data-in="claimStamp">${Object.keys(STAMP).map(k => `<option value="${k}" ${draft.claim.stamp === k ? 'selected' : ''}>${STAMP[k]}</option>`).join('')}</select></label>
        <label class="field"><span class="hint">Say it was worth</span><select class="input" id="claim-val" data-in="claimVal">${[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(x => `<option value="${x}" ${+draft.claim.val === x ? 'selected' : ''}>${fmt(x)}</option>`).join('')}</select></label></div>
        <div class="hint">It was really stamped ${STAMP[inh.stamp]} and worth ${fmt(evs(inh.cards))}.</div>` : ''}</div>` : '';
    const locked = !!S.reqStyle;
    const styleBlock = `<div class="block"><span class="label">Envelope style${locked ? ' · mandated by the Designer' : ''}</span>
      <div class="styles">${OP.COLORS.map(c => `<button class="swatch" style="background:var(--env-${c})" data-a="color" data-v="${c}" aria-pressed="${draft.style.color === c}" aria-label="${c}" ${locked ? 'disabled' : ''}></button>`).join('')}</div>
      <div class="styles">${OP.TRIMS.map(t => `<button class="trim-btn" data-a="trim" data-v="${t}" aria-pressed="${draft.style.trim === t}" ${locked ? 'disabled' : ''}>${t}</button>`).join('')}</div></div>`;
    const designer = p.spec === 'Designer' ? `<div class="block"><span class="label">Designer: mandate next quarter's envelopes</span>
      <select class="input" id="next-style" data-in="nextStyle"><option value="">No mandate</option>${OP.COLORS.flatMap(c => OP.TRIMS.map(t => `<option value="${c}/${t}" ${draft.nextStyle && draft.nextStyle.color === c && draft.nextStyle.trim === t ? 'selected' : ''}>${c} · ${t}</option>`)).join('')}</select>
      <div class="hint">Wipe out everyone's signature, or make them all look like someone in particular.</div></div>` : '';
    const body = `<div class="prov">${provenance(inh)}</div>
      <div class="block"><div class="sumline"><span>Top row goes in the envelope. Bottom row is set aside.</span></div>
        <div class="suits">${cols}</div>
        <div class="sumline"><span>Envelope value${vol ? ' (volatile cards swing ±2)' : ''}</span><b class="${tone(v)}">${fmt(v)}</b></div>
        <button class="btn small" data-a="redeal" ${canRedeal ? '' : 'disabled'}>${draft.redeal ? 'Re-dealt. Inherited cards shredded.' : 'Re-deal the inherited three · 2 tokens'}</button></div>
      <div class="block"><span class="label">Stamp</span><div class="stamps">${Object.keys(STAMP).map(k => `<button class="stamp-btn" data-a="stamp" data-v="${k}" aria-pressed="${draft.stamp === k}">${STAMP[k]}</button>`).join('')}</div></div>
      <div class="block"><span class="label">Subject line · click a word to reroll</span>
        <div class="subj">${draft.words.map((k, i) => `<button class="subj-word" data-a="reroll" data-i="${i}" ${draft.useCustom ? 'disabled style="opacity:.4"' : ''}>${esc(OP.SUBJ[i][k])}</button>`).join('')}</div>
        <input class="input" id="custom-subject" data-in="custom" maxlength="80" placeholder="Or write your own…" value="${esc(draft.custom)}"></div>
      ${styleBlock}${claim}${designer}
      <button class="btn primary wide" data-a="seal" ${draft.stamp ? '' : 'disabled'}>${draft.stamp ? 'Seal envelope' : 'Stamp it to seal'}</button>`;
    return deskWrap(`Q${S.r} · ${OP.DEPTS[p.dept]}`, tokenPips(cost), body);
  }
  function voteList(action, opts, current) {
    return `<div class="radio-list">${opts.map(o => `<button class="radio" data-a="${action}" data-id="${o.id}" aria-pressed="${String(current) === String(o.id)}"><span class="grow">${o.label}${o.sub ? `<div class="sub">${o.sub}</div>` : ''}</span>${o.tag || ''}</button>`).join('')}</div>`;
  }
  function votesLine(votes) {
    return Object.entries(votes).map(([i, v]) => `${esc(nm(+i))} → ${v === 'none' ? 'none' : esc(typeof v === 'number' || /^\d+$/.test(v) ? nm(+v) : v)}`).join(' · ');
  }
  function deskSpectate() {
    const ph = S.phase;
    const label = { decide: 'See the CEO decide', review: S.r < 5 ? `Start Q${S.r + 1}` : 'Go to the Whistleblower vote' }[ph];
    let body = `<p class="hint" style="margin:0">You're watching ${S.n} bots. Turn on Observer to see what each of them knows.</p>`;
    if (S.audit && ph !== 'end') body += `<div class="prov">Audit: ${S.audit.winner === 'none' ? 'nothing opened' : 'envelope ' + S.audit.winner}. <span class="hint">${votesLine(S.audit.votes)}</span></div>`;
    if (S.warn && ph === 'review') body += `<div class="prov">${S.warn.target == null ? 'No warning motion.' : `Motion to warn ${esc(nm(S.warn.target))}: ${S.warn.passed ? 'passed' : 'failed'}.`}<div class="hint">${votesLine(S.warn.votes)}</div></div>`;
    if (ph === 'end') return deskEnd();
    body += label ? `<button class="btn primary wide" data-a="advance">${label}</button>` : '';
    return deskWrap(`Observing · ${PHASE[ph]}`, '', body);
  }
  function deskEnd() {
    const sabs = S.P.filter(p => p.sab);
    const youWon = mine() ? (me().sab ? !S.win : S.win) : null;
    const head = S.win ? 'Target met.' : 'Target missed.';
    const line = S.win ? 'Shareholders are mildly pleased. Bonuses have been deferred.' : sabs.length ? 'The company sank, with help.' : 'The company failed entirely on its own merits. There was no saboteur.';
    const body = `<div class="letter"><div class="role ${S.win ? 'loyal' : 'sab'}">${head}</div><div>${line}</div>
      <div>Final profit <b class="num">${fmt(S.profit)}</b> against +${S.target}. Headcount Memo: ${S.nSab} saboteur${S.nSab === 1 ? '' : 's'}${sabs.length ? ` (${sabs.map(p => esc(p.name)).join(', ')})` : ''}.</div>
      ${S.whistle ? `<div class="hint">Whistleblower vote: ${S.whistle.named == null ? 'declined' : esc(nm(S.whistle.named)) + (S.whistle.correct ? ', correctly' : ', wrongly')}. ${votesLine(S.whistle.votes)}</div>` : ''}
      ${youWon != null ? `<div><b>${youWon ? 'You win.' : 'You lose.'}</b></div>` : ''}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-a="again">Same settings, new game</button><button class="btn" data-a="quit">Change settings</button></div>`;
    return deskWrap('Exit interview', '', body);
  }
  function desk() {
    if (S.spectate) return deskSpectate();
    const p = me(), ph = S.phase;
    if (ph === 'brief') {
      const body = `<div class="letter"><span class="label">Employment letter · strictly confidential</span>
        <div>Dear colleague,</div><div>Welcome to Only Profit Inc. Over the next five quarters the company must reach <b>+${S.target} profit</b>. Your allegiance is:</div>
        <div class="role ${p.sab ? 'sab' : 'loyal'}">${p.sab ? 'Saboteur' : 'Loyal'}</div>
        <div>${p.sab ? `You win if the company finishes below +${S.target}. You don't know whether anyone else shares your views.` : `You win if the company reaches +${S.target}. There may be ${S.n >= 6 ? 'one or two saboteurs' : 'a saboteur'} on staff, or nobody at all.`}</div>
        ${p.spec ? `<div>You are also the <b>${p.spec}</b>. ${p.spec === 'Auditor' ? 'You can see who wrote every envelope, every quarter. Deciding what to say about it is your problem.' : 'Each quarter you can mandate the envelope style everyone must use next quarter.'}</div>` : ''}
        <div class="sig">Warm regards,<br>People &amp; Culture</div></div>
        <button class="btn primary wide" data-a="begin">Start Q1</button>`;
      return deskWrap('Onboarding', '', body);
    }
    if (ph === 'work' && draft) return deskWork();
    const leave = p.leave ? '<div class="prov">You are on <b>garden leave</b>. Your department runs itself. You can still talk and vote.</div>' : '';
    if (ph === 'pitch') {
      const opts = S.envs.filter(e => !e.autopilot).sort((a, b) => a.id.localeCompare(b.id)).map(e => ({ id: e.id, label: `Envelope ${e.id}`, sub: esc(e.subject), tag: `<span class="env-stamp ${e.stamp}" style="transform:none">${STAMP[e.stamp]}</span>` }));
      opts.push({ id: 'none', label: 'Audit nothing' });
      const body = `${leave}<p class="hint" style="margin:0">Read the bulletin board, then vote on one envelope to open publicly before the CEO decides. Its author stays sealed. Plurality wins.</p>
        ${voteList('sel', opts, ui.sel)}<button class="btn primary wide" data-a="audit" ${ui.sel ? '' : 'disabled'}>Cast audit vote</button>`;
      return deskWrap(`Q${S.r} · Pitch`, '', body);
    }
    const auditLine = S.audit ? `<div class="prov">Audit: ${S.audit.winner === 'none' ? 'the table opened nothing' : `envelope <b>${S.audit.winner}</b> was opened`}.<div class="hint">${votesLine(S.audit.votes)}</div></div>` : '';
    if (ph === 'decide') {
      if (isCEO()) {
        const opts = S.envs.slice().sort((a, b) => a.id.localeCompare(b.id)).map(e => ({ id: e.id, label: `Envelope ${e.id}${e.author === ME ? ' (yours)' : ''}`, sub: esc(e.subject), tag: `<span class="env-stamp ${e.stamp}" style="transform:none">${STAMP[e.stamp]}</span>` }));
        return deskWrap(`Q${S.r} · You are CEO`, '', `${auditLine}<p class="hint" style="margin:0">Approve one envelope. Cards other managers paid to show you are visible on the board. Approving your own is allowed, and noted.</p>${voteList('sel', opts, ui.sel)}<button class="btn primary wide" data-a="approve" ${ui.sel ? '' : 'disabled'}>Approve envelope ${ui.sel || ''}</button>`);
      }
      return deskWrap(`Q${S.r} · Decide`, '', `${leave}${auditLine}<p class="hint" style="margin:0">${esc(nm(S.ceo))} is choosing which envelope to approve.</p><button class="btn primary wide" data-a="advance">See the decision</button>`);
    }
    const res = S.result ? (() => { const e = S.envs.find(x => x.id === S.result.id); if (!e) return ''; return `<div class="prov">Envelope <b>${S.result.id}</b> by <b>${e.autopilot ? 'Autopilot' : esc(nm(S.result.author))}</b>, stamped ${STAMP[e.stamp]}: <b class="${tone(S.result.actual)}">${fmt(S.result.actual)}</b>.</div>`; })() : '';
    if (ph === 'reveal') {
      const opts = S.P.filter(q => q.id !== ME && !q.leave).map(q => {
        const c = (S.accused[q.id] || []).length;
        return { id: q.id, label: `Warn ${esc(q.name)}`, sub: c ? `${c} complaint${c > 1 ? 's' : ''} this quarter` : `${q.accusations} complaint${q.accusations === 1 ? '' : 's'} so far`, tag: pips(q.warnings) };
      });
      opts.push({ id: 'none', label: 'No warning this quarter' });
      return deskWrap(`Q${S.r} · Reveal`, '', `${res}<p class="hint" style="margin:0">The table may issue one Written Warning by majority (more than ${Math.floor(S.n / 2)} votes). A second warning sends someone on garden leave.</p>${voteList('sel', opts, ui.sel)}<button class="btn primary wide" data-a="warn" ${ui.sel != null ? '' : 'disabled'}>Cast vote</button>`);
    }
    if (ph === 'review') {
      const w = S.warn;
      const wl = w.target == null ? 'No warning motion this quarter.' : `Motion to warn <b>${esc(nm(w.target))}</b>: ${w.passed ? 'passed' : 'failed'}.`;
      return deskWrap(`Q${S.r} · Reveal`, '', `${res}<div class="prov">${wl}<div class="hint">${votesLine(w.votes)}</div></div><button class="btn primary wide" data-a="advance">${S.r < 5 ? `Start Q${S.r + 1}` : 'Go to the Whistleblower vote'}</button>`);
    }
    if (ph === 'whistle') {
      const opts = S.P.filter(q => q.id !== ME).map(q => ({ id: q.id, label: `Name ${esc(q.name)}`, sub: `${q.approved.map(a => `Q${a.r} ${STAMP[a.stamp]} ${fmt(a.actual)}`).join(', ') || 'No approved policies'} · ${q.accusations} complaint${q.accusations === 1 ? '' : 's'}`, tag: pips(q.warnings) }));
      opts.push({ id: 'none', label: 'Decline to name anyone' });
      return deskWrap('The Whistleblower', '', `<p class="hint" style="margin:0">Profit stands at <b>${fmt(S.profit)}</b> against +${S.target}. Name one saboteur: +3 if right, −3 if wrong. Plurality wins; ties mean nobody is named.</p>${voteList('sel', opts, ui.sel)}<button class="btn primary wide" data-a="whistle" ${ui.sel != null ? '' : 'disabled'}>Cast vote</button>`);
    }
    if (ph === 'end') return deskEnd();
    return deskWrap(PHASE[ph], '', '');
  }

  // ---------- setup ----------
  function seg(key, opts) { return `<div class="seg">${opts.map(([v, l]) => `<button data-a="set" data-k="${key}" data-v="${v}" aria-pressed="${String(setup[key]) === String(v)}">${l}</button>`).join('')}</div>`; }
  function setupHTML() {
    return `<div class="wrap"><div class="setup">
      <div class="setup-hero"><span class="label">Playtest build 0.1 · one human, the rest bots</span><h1>Only Profit</h1>
        <p>Inherit someone else's mess, seal it in an anonymous envelope, and find out whose name was on it only once it's approved. Hit the profit target in five quarters, or quietly make sure nobody does.</p></div>
      <div class="setup-body">
        <div class="field"><span class="label">Employees</span>${seg('players', [[4, '4'], [5, '5'], [6, '6'], [7, '7'], [8, '8']])}</div>
        <div class="field"><span class="label">Your seat</span>${seg('spectate', [[false, 'Play'], [true, 'Watch the bots']])}</div>
        <div class="field"><span class="label">Loyal bots</span>${seg('loyalTier', [['smart', 'Smart'], ['basic', 'Basic'], ['naive', 'Gullible']])}</div>
        <div class="field"><span class="label">Saboteur bots</span>${seg('sabTier', [['smart', 'Smart'], ['patient', 'Patient'], ['blatant', 'Blatant']])}</div>
        <div class="field"><span class="label">Target</span>${seg('easy', [[false, 'Standard'], [true, 'Easy mode (−3)']])}</div>
        <div class="field"><label class="label" for="seed">Seed (optional, to replay a deal)</label><input class="input" id="seed" data-in="seed" inputmode="numeric" placeholder="Random" value="${esc(setup.seed)}" style="max-width:200px"></div>
        <details class="rules"><summary>The quarter, in brief</summary><ol>
          <li><b>Work.</b> The 3 cards you inherit are your proposal. Draw 3 more. Spend 3 tokens: swap a card in (1, then 2), re-deal all three (2), or show one card to the CEO (1). Stamp it, write a subject line, style the envelope.</li>
          <li><b>Pitch.</b> Envelopes appear shuffled and anonymous. Memos on the bulletin board say who left whom a mess. Nobody can check them. The table votes to audit one envelope.</li>
          <li><b>Decide + Reveal.</b> The CEO approves one. Profit moves and its author is unmasked. Rejected envelopes pass, sealed, to that department's next manager. The table may issue a Written Warning; two means garden leave.</li>
          <li><b>After Q5.</b> The table may name a saboteur: +3 if right, −3 if wrong.</li></ol></details>
        <div class="setup-foot"><button class="btn primary" data-a="start">Start the game</button><span class="hint">About 10 minutes against bots.</span></div>
      </div></div></div>`;
  }

  // ---------- render ----------
  function render() {
    document.documentElement.dataset.phase = S ? S.phase : 'setup';
    if (!S) { $app.innerHTML = mast() + setupHTML(); return; }
    const board = S.phase === 'end' || S.phase === 'whistle'
      ? `${observerHTML()}${S.phase === 'end' ? exitHTML() : ''}<div class="two">${ledgerHTML()}${staffHTML()}</div>${feedHTML()}`
      : `${observerHTML()}${envelopesHTML()}${feedHTML()}<div class="two">${ledgerHTML()}${staffHTML()}</div>`;
    $app.innerHTML = `${mast()}<div class="wrap"><div class="layout"><main class="board">${board}</main>${desk()}</div></div>`;
  }

  // ---------- events ----------
  $app.addEventListener('click', ev => {
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a, d = b.dataset;
    switch (a) {
      case 'debug': ui.debug = !ui.debug; try { localStorage.setItem('op-debug', ui.debug ? '1' : '0'); } catch (e) {} render(); break;
      case 'quit': S = null; draft = null; render(); break;
      case 'set': setup[d.k] = d.k === 'players' ? +d.v : (d.v === 'true' ? true : d.v === 'false' ? false : d.v); render(); break;
      case 'start': case 'again': {
        const seed = a === 'start' && /^\d+$/.test(String(setup.seed).trim()) ? +setup.seed : Math.floor(Math.random() * 1e9) + 1;
        S = OP.newGame(Object.assign({}, setup, { seed })); draft = null; err = ''; ui.sel = null; render(); window.scrollTo(0, 0); break;
      }
      case 'begin': dispatch({ type: 'begin' }); break;
      case 'advance': dispatch({ type: 'advance' }); break;
      case 'swap': { const su = +d.su; draft.swaps = draft.swaps.includes(su) ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su); render(); break; }
      case 'reveal': { const su = +d.su; draft.reveals = draft.reveals.includes(su) ? draft.reveals.filter(x => x !== su) : draft.reveals.concat(su); render(); break; }
      case 'redeal': draft.redeal = true; toast('Inherited cards shredded. Three fresh ones dealt.'); render(); break;
      case 'stamp': draft.stamp = d.v; render(); break;
      case 'reroll': { const i = +d.i, l = OP.SUBJ[i].length; let k; do { k = Math.floor(Math.random() * l); } while (k === draft.words[i] && l > 1); draft.words[i] = k; render(); break; }
      case 'color': draft.style.color = d.v; render(); break;
      case 'trim': draft.style.trim = d.v; render(); break;
      case 'claim': draft.claim.kind = d.k; render(); break;
      case 'seal': {
        const sel = window.getSelection && window.getSelection(); if (sel) sel.removeAllRanges();
        dispatch({ type: 'submitWork', redeal: draft.redeal, swaps: draft.swaps, reveals: draft.reveals, stamp: draft.stamp, subject: subjectOf(draft), style: draft.style,
          claim: draft.claim.kind === 'none' ? null : draft.claim, nextStyle: draft.nextStyle });
        toast('Envelope sealed and sent.'); break;
      }
      case 'sel': ui.sel = d.id; render(); break;
      case 'audit': dispatch({ type: 'auditVote', target: ui.sel }); break;
      case 'approve': dispatch({ type: 'approve', id: ui.sel }); break;
      case 'warn': dispatch({ type: 'warnVote', target: ui.sel }); break;
      case 'whistle': dispatch({ type: 'whistleVote', target: ui.sel }); break;
    }
  });
  $app.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset && el.dataset.in; if (!k) return;
    if (k === 'seed') setup.seed = el.value;
    if (k === 'custom') {
      draft.custom = el.value; const was = draft.useCustom; draft.useCustom = !!el.value.trim();
      if (was !== draft.useCustom) document.querySelectorAll('.subj-word').forEach(b => { b.disabled = draft.useCustom; b.style.opacity = draft.useCustom ? '.4' : ''; });
    }
    if (k === 'claimStamp') draft.claim.stamp = el.value;
    if (k === 'claimVal') draft.claim.val = +el.value;
    if (k === 'nextStyle') { const [c, t] = el.value.split('/'); draft.nextStyle = el.value ? { color: c, trim: t } : null; }
  });

  // keep a game in progress across page updates
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ S, draft, setup, debug: ui.debug }));
  const start = data => { if (data && data.S) { S = data.S; draft = data.draft; setup = data.setup || setup; } render(); };
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start); else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
  window.__op = { get S() { return S; }, dispatch };
})();

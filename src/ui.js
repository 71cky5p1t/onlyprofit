// Only Profit — browser UI. Renders from engine state; every change goes through OP.apply.
(() => {
  const $app = document.getElementById('app');
  const ME = 0;
  let S = null, draft = null, err = '', toastT = null;
  let setup = { players: 4, loyalTier: 'smart', sabTier: 'smart', easy: false, spectate: false, seed: '', brand: window.__opBrand || 'op' };
  const ui = { debug: false, sel: null, deal: false, land: null, printed: 0, stamped: '', lastKey: null, shown: null, tick: null };
  try { ui.debug = localStorage.getItem('op-debug') === '1'; } catch (e) {}

  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = OP.fmt, evs = OP.evs;
  const tone = v => (v === 'V' ? 'gold' : v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero');
  const GLYPH = { 2: '++', 1: '+', 0: '0', '-1': '−', '-2': '−−', V: '?' };
  const glyph = v => `<b class="glyph ${v === 'V' ? 'v-v' : tone(v)}">${GLYPH[v]}</b>`;
  const FXSYM = { null: '×0', x2: '×2', shield: '≥0', flip: '×−1' };
  const FXSAY = { null: 'Cancels the rest', x2: 'Doubles the rest', shield: "Rest can't lose", flip: 'Flips the rest' };
  const lcd = n => { const t = (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n) + '.0'; return `<span class="ghost">${'8'.repeat(Math.max(0, 5 - t.length))}</span>${t}`; };
  const nm = i => (i === 'table' ? 'The table' : S.P[i].name);
  const mine = () => S && !S.spectate;
  const me = () => S.P[ME];
  // the company brand lives on objects only: logo, wax seals, card backs, letterhead. Never on card faces, never red or green
  // (Only Profit itself is the placeholder house brand)
  const BRANDS = [
    { id: 'op', name: 'Only Profit', suffix: 'Inc.', mono: 'OP', color: '#D9261C', hi: '#EF4A37', lo: '#8E160F', ink: '#fff', font: 'house' },
    { id: 'granny', name: 'Family Granny Dating', suffix: 'Pty Ltd', mono: 'FG', color: '#9B7BB8', hi: '#BBA0D4', lo: '#5E4478', ink: '#fff', font: 'round',
      icon: '<circle cx="7" cy="13" r="3.5"/><circle cx="17" cy="13" r="3.5"/><path d="M10.5 13h3M3.5 12 2.5 9M20.5 12l1-3"/>' },
    { id: 'clown', name: 'Ultra Clown Childcare', suffix: '& Co.', mono: 'UC', color: '#E8B81E', hi: '#F7D560', lo: '#9A7406', ink: '#1a1a1a', font: 'heavy',
      icon: '<circle cx="12" cy="13" r="6.5"/><circle cx="9.8" cy="10.6" r="1.6"/>' },
    { id: 'widow', name: 'Eternal Widow', suffix: 'Holdings', mono: 'EW', color: '#4A3E60', hi: '#6E5F8A', lo: '#211A2D', ink: '#fff', font: 'serif',
      icon: '<path d="M12 3c-5 0-7 5-7 9v8l3-2 2 2 2-2 2 2 2-2 3 2v-8c0-4-2-9-7-9z"/>' },
    { id: 'kidney', name: 'Executive Kidney Destruction', suffix: 'Group', mono: 'EK', color: '#2F5D8A', hi: '#4F7FB0', lo: '#18344F', ink: '#fff', font: 'wide',
      icon: '<path d="M15 4c4 0 6 4 5 9s-5 8-9 7-6-4-3-6 3-4 1-6 1-4 6-4z"/>' },
    { id: 'stepdad', name: 'Compassionate Stepdad Childcare', suffix: 'Ltd', mono: 'CS', color: '#C2793A', hi: '#DC9C63', lo: '#7A4519', ink: '#fff', font: 'script',
      icon: '<path d="M12 12c-2-3-6-3-8 0 1 2 4 3 8 0 4 3 7 2 8 0-2-3-6-3-8 0z"/>' }];
  const brand = () => BRANDS.find(b => b.id === setup.brand) || BRANDS[0];
  const brandMark = () => { const b = brand(); return b.icon ? `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${b.icon}</svg>` : b.mono; };
  function applyBrand() {
    const b = brand(), r = document.documentElement;
    r.style.setProperty('--brand', b.color); r.style.setProperty('--brand-hi', b.hi); r.style.setProperty('--brand-lo', b.lo); r.style.setProperty('--brand-ink', b.ink);
    r.style.setProperty('--mono', `"${b.mono}"`); r.dataset.brandFont = b.font;
  }
  // envelopes are told apart by an office object, not a letter; same icon on the TV and the phone
  const ICONS = [
    '<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2M8.5 3.5v2M12 3.5v2"/>',
    '<path d="M16 7v9a4 4 0 0 1-8 0V6a2.5 2.5 0 0 1 5 0v9a1 1 0 0 1-2 0V8"/>',
    '<path d="M9 3h6l-1 6 3 3H7l3-3z"/><path d="M12 12v9"/>',
    '<path d="M10 3h4l-1 3 2 10-3 5-3-5 2-10z"/>',
    '<circle cx="8" cy="8" r="4"/><path d="M11 11l9 9M17 17l2-2M14.5 14.5l2-2"/>',
    '<path d="M12 21V6a2 2 0 0 1 4 0v7a2 2 0 0 1-2 2h-2M12 12H10a2 2 0 0 1-2-2V8M7 21h10"/>',
    '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 15.6L18 3M16 15.6L6 3"/>',
    '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/>',
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'];
  const ICON_NAMES = ['mug', 'paperclip', 'pushpin', 'tie', 'key', 'cactus', 'light bulb', 'scissors', 'umbrella', 'phone'];
  const iconIdx = (id, list) => Math.max(0, (list || S.envs).map(e => e.id).sort().indexOf(id)) % ICONS.length;
  const icon = (id, list) => `<svg class="ico" viewBox="0 0 24 24" role="img" aria-label="${ICON_NAMES[iconIdx(id, list)]}"><title>${ICON_NAMES[iconIdx(id, list)]}</title>${ICONS[iconIdx(id, list)]}</svg>`;
  // a person's record as cheap, dog-eared praise stickers
  function stickers(q) {
    const filed = S.history.flatMap(h => h.memos).concat(S.memos).filter(m => m.kind === 'report' && m.by === q.id).length;
    const out = [];
    q.approved.forEach(a => out.push(a.actual > 0 ? ['gold', 'Great work!'] : ['beige', 'Acceptable!']));
    if (filed) out.push(['blue', 'Team player']);
    for (let k = 0; k < q.warnings; k++) out.push(['red', 'See me']);
    if (q.accusations) out.push(['grey', `Noted ×${q.accusations}`]);
    if (!out.length) return '';
    return `<span class="stickers">${out.map(([c, t], k) => `<i class="stk ${c}" style="--r:${((q.id * 7 + k * 13) % 11) - 5}deg">${t}</i>`).join('')}</span>`;
  }
  const isCEO = () => mine() && S.ceo === ME;
  const STAMP = OP.STAMP_LABEL;
  const TIER = { smart: 'Smart', basic: 'Basic', naive: 'Gullible', patient: 'Patient', blatant: 'Blatant' };
  const PHASE = { brief: 'Onboarding', work: 'Work', pitch: 'Pitch + audit', decide: 'Decide', board: 'Board vote', reveal: 'Reveal', review: 'Reveal', whistle: 'Whistleblower', end: 'Exit interview' };

  // ---------- actions ----------
  function dispatch(a) {
    const r = OP.apply(S, S.spectate ? -1 : ME, a);
    if (r.error) { err = r.error; render(); return; }
    err = ''; S = r.state; ui.sel = null;
    draft = S.phase === 'work' && S.work[ME] ? newDraft() : null;
    if (draft) ui.deal = true;
    render();
  }
  function newDraft() {
    const p = me(), inh = p.inh;
    return { redeal: false, swaps: [], reveals: [], stamp: null, words: (S.subj || OP.SUBJ).map(l => Math.floor(Math.random() * l.length)), custom: '', useCustom: false,
      style: Object.assign({}, S.reqStyle || p.fav), claim: { kind: 'none', val: evs(inh.cards), stamp: inh.stamp || 'Rec' }, nextStyle: null };
  }
  const subjectOf = d => (d.useCustom && d.custom.trim() ? d.custom.trim() : d.words.map((k, i) => (S.subj || OP.SUBJ)[i][k]).join(' '));
  function costWith(ch) { return OP.workCost(Object.assign({}, draft, ch)); }
  function toast(t) { let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200); }

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
        <button class="chip-btn" data-a="debug" aria-pressed="${ui.debug}" title="Show hidden roles, envelope contents and bot reasoning">Observer</button>
        ${S ? '<button class="chip-btn" data-a="quit">New game</button>' : ''}</div></div></div></header>`;
  }
  function cardHTML(c, cls, extra, attrs) {
    const amt = c.fx ? '' : c.v === 'V' ? '+2 or −2' : c.v === 0 ? 'No effect' : `${fmt(c.v)} profit`;
    const face = c.fx ? `${glyph(c.v)}<span class="dymo fx-${c.fx}" title="${FXSAY[c.fx]}"><i class="m0"></i><i class="m1"></i><b>${FXSYM[c.fx]}</b></span>` : glyph(c.v);
    return `<div class="card s-${c.s} ${c.fx ? 'has-fx' : ''} ${cls || ''}" ${attrs || ''}>${extra || ''}<div class="hd"><i class="sp"></i>${OP.SUITS[c.s]}</div><div class="fx">${face}<span class="amt">${amt}</span></div><span class="word">${esc(c.w)}</span></div>`;
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
    const vis = su => showAll || e.revealed.includes(su);
    const anyVis = [0, 1, 2].some(vis);
    const cards = anyVis ? `<div class="env-cards">${e.cards.map((c, su) => {
      if (!vis(su)) return `<div class="env-card hidden"><b>${brand().mono}</b><span class="w">${OP.SUITS[su]}</span></div>`;
      const v = e.resolved ? e.resolved[su] : c.v;
      return `<div class="env-card s-${su}" title="${esc(c.w)}: ${fmt(v)}"><b class="${tone(v)}">${GLYPH[v]}${e.resolved && c.v === 'V' ? '*' : ''}${c.fx ? `<i class="eff fx-${c.fx}">${FXSYM[c.fx]}</i>` : ''}</b><span class="w">${esc(c.w)}</span></div>`;
    }).join('')}</div>` : '';
    const who = authorVisible(e) ? (e.autopilot ? 'Autopilot' : (mine() && e.author === ME ? 'You' : nm(e.author))) : null;
    const dept = (ui.debug || e.approved || (mine() && e.author === ME)) ? OP.DEPTS[e.dept] : null;
    const tags = [];
    if (e.audited) tags.push('<span class="pill blue">Audited</span>');
    if (e.autopilot) tags.push('<span class="pill grey">Autopilot</span>');
    if (e.revealed.length && !showAll) tags.push(`<span class="pill blue">${e.revealed.length} shown</span>`);
    if (e.unmasked && !e.approved) tags.push(`<span class="pill red">Overruled · ${e.author === S.ceo ? 'the CEO’s own' : esc(nm(e.author))}</span>`);
    if (mine() && e.author === ME && !e.approved) tags.push('<span class="pill grey">Yours</span>');
    if (mine() && !ui.debug && me().spec === 'Auditor' && e.author !== ME && !e.approved) tags.push('<span class="pill gold">Auditor sight</span>');
    const dbg = ui.debug ? `<div class="env-dbg">${S.P[e.author].sab ? 'SAB' : 'LOYAL'} · ${esc(e.mode)} · true ${fmt(evs(e.cards))} · table est ${OP.estimate(e, S.loyalTier, false).toFixed(1)} · spent ${e.cost}${e.redeal ? ' · re-dealt' : ''}${e.revealed.length ? ' · showed ' + e.revealed.map(s => OP.SUITS[s][0]).join('') : ''}</div>` : '';
    const tag = opt.click ? 'button' : 'div';
    const fresh = e.approved && ui.stamped !== `${S.r}${e.id}`;
    if (fresh) ui.stamped = `${S.r}${e.id}`;
    return `<${tag} class="env c-${e.style.color} t-${e.style.trim} ${ui.sel === e.id ? 'sel' : ''} ${e.approved ? 'approved' : ''} ${e.audited ? 'audited' : ''} ${opt.faded ? 'faded' : ''}" ${opt.click ? `data-a="${opt.click}" data-id="${e.id}" aria-pressed="${ui.sel === e.id}"` : ''}>
      <div class="env-top"><span class="env-id">${e.id.length === 1 && S && S.envs.some(x => x.id === e.id) ? icon(e.id) : e.id}</span><span class="env-kind">Inter-office<br>mail</span><span class="clasp" aria-hidden="true"></span></div>
      <div class="env-subj">${esc(e.subject)}</div>
      <div class="env-route"><div><span>From</span>${who ? `<b>${esc(who)}</b>` : '<i class="redact"></i>'}</div><div><span>Dept</span>${dept ? esc(dept) : '<i class="redact"></i>'}</div></div>
      <div class="env-stamp ${e.stamp}">${STAMP[e.stamp]}</div>
      ${opt.preview ? '' : `${tags.length ? `<div class="env-tags">${tags.join('')}</div>` : ''}${cards}${dbg}`}
      ${e.approved ? `<span class="big-stamp${fresh ? '' : ' no-anim'}" aria-hidden="true">Approved</span>` : ''}</${tag}>`;
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
    if (!['pitch', 'decide', 'board', 'reveal', 'review'].includes(ph)) return '';
    const click = ph === 'pitch' && mine() ? 'sel' : ph === 'decide' && isCEO() ? 'sel' : null;
    const envs = S.envs.slice().sort((a, b) => a.id.localeCompare(b.id));
    const hint = ph === 'pitch' ? 'Shuffled. No authors, no departments.' : ph === 'decide' ? (isCEO() ? 'You are CEO. Nominate one.' : 'Awaiting the CEO') : ph === 'board' ? `The Board is voting on ${icon(S.nominee)}` : 'Approved policy unmasked';
    return `<section><div class="section-head"><h2>Envelopes on the table</h2><span class="label">${hint}</span></div>
      <div class="envs">${envs.map(e => envHTML(e, { click: click && !(ph === 'pitch' && e.autopilot) ? click : null, faded: ((ph === 'reveal' || ph === 'review') && !e.approved) || (ph === 'board' && e.id !== S.nominee) })).join('')}</div></section>`;
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
        <div class="scroll-x"><table class="exit-t"><thead><tr><th>Env</th><th>Author</th><th>Dept</th><th>Subject</th><th>Stamp</th><th>Cards</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div>
        ${memos ? `<div class="hint">${memos}</div>` : ''}</div>`;
    }).join('');
    return `<section><div class="section-head"><h2>Exit interview</h2><span class="label">Every envelope, unmasked. * = volatile</span></div><div class="exit">${rounds}</div></section>`;
  }

  // ---------- desk: your phone. Objects on the felt, same as the TV; almost no prose ----------
  // a bakelite header bar (nameplate, coins, timer tape) and a footer bar that holds the one key that matters
  function deskWrap(title, body, o) {
    o = o || {};
    return `<aside class="desk" aria-label="Your desk"><div class="desk-head"><div class="bar-row"><h3 class="plate">${title}</h3>${o.right || ''}</div>${o.fuse || ''}</div>
      <div class="desk-body">${body}${err ? `<div class="err" role="alert">${esc(err)}</div>` : ''}</div>${o.foot ? `<div class="desk-foot">${o.foot}</div>` : ''}</aside>`;
  }
  const slip = html => `<span class="slip">${html}</span>`;
  const stampMark = k => `<span class="env-stamp ${k}">${STAMP[k]}</span>`;
  const key = (a, label, on) => `<button class="btn primary wide" data-a="${a}" ${on === false ? 'disabled' : ''}>${label}</button>`;
  const coins = n => '<i class="coin"></i>'.repeat(n);
  function inhSource(inh) {
    if (inh.kind === 'legacy') return 'Legacy';
    if (inh.kind === 'cleanup') return `Leftovers <b>${inh.author === ME ? 'yours' : esc(nm(inh.author))}</b>`;
    if (inh.kind === 'autopilot') return 'Autopilot';
    return `From <b>${inh.author === ME ? 'yourself' : esc(nm(inh.author))}</b>${stampMark(inh.stamp)}`;
  }
  // work has two timed pages: the cards (strategy), then dressing the envelope (the fun bit)
  const TIME = { cards: 45, dress: 20 };
  let timer = null;
  function stopTimer() { if (timer) clearInterval(timer.iv); timer = null; }
  function fuse(key, secs, onEnd) {
    if (!timer || timer.key !== key) {
      stopTimer();
      timer = { key, total: secs * 1000, end: Date.now() + secs * 1000, iv: null };
      if (!window.__opFreeze) timer.iv = setInterval(() => {
        const left = timer.end - Date.now(), el = document.querySelector('.fuse i');
        if (el) el.style.width = Math.max(0, left / timer.total * 100) + '%';
        if (left <= 0) { stopTimer(); onEnd(); }
      }, 200);
    }
    const pct = window.__opFreeze ? 64 : Math.max(0, (timer.end - Date.now()) / timer.total * 100);
    return `<div class="fuse" role="timer" aria-label="Time left"><i style="width:${pct}%"></i></div>`;
  }
  // Finalise: the hand drops away, the policy slides together and is stuffed into an envelope, then styling opens
  function finalise() {
    if (!draft || draft.page === 2 || ui.stuffing) return;
    if (!draft.stamp) draft.stamp = 'Rec';
    stopTimer();
    const play = document.querySelector('.play');
    if (!play || still()) { draft.page = 2; render(); return; }
    ui.stuffing = true;
    play.style.setProperty('--env', `var(--env-${draft.style.color})`);
    play.insertAdjacentHTML('beforeend', '<i class="stuff back" aria-hidden="true"></i><i class="stuff front" aria-hidden="true"></i><i class="stuff flap" aria-hidden="true"></i>');
    play.classList.add('stuff');
    setTimeout(() => { ui.stuffing = false; if (draft && S.phase === 'work') { draft.page = 2; ui.arrive = true; render(); } }, 1450);
  }
  function seal() {
    const sel = window.getSelection && window.getSelection(); if (sel) sel.removeAllRanges();
    stopTimer();
    dispatch({ type: 'submitWork', redeal: draft.redeal, swaps: draft.swaps, reveals: draft.reveals, stamp: draft.stamp || 'Rec', subject: subjectOf(draft), style: draft.style,
      claim: null, nextStyle: draft.nextStyle });
    toast('Sealed.');
  }
  function deskWork() {
    const p = me(), inh = p.inh, wr = OP.workResult(S, ME, draft), cost = OP.workCost(draft);
    if (draft.page === 2) return deskDress(p, wr);
    const slot = (zone, su, card) => `<div class="slot" data-drop="${zone}" data-su="${su}">${card}</div>`;
    // tokens are coins: price tags on the hand, paid coins sit on the policy card they bought
    const paid = su => (draft.swaps.indexOf(su) + 1) + (draft.reveals.includes(su) ? 1 : 0);
    const env = [0, 1, 2].map(su => {
      const c = wr.prop[su], rv = draft.reveals.includes(su), n = paid(su);
      const ok = rv || costWith({ reveals: draft.reveals.concat(su) }) <= 3;
      return slot('env', su, cardHTML(c, `drag${rv ? ' shown' : ''}${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}`, `<i class="eye" aria-hidden="true"></i>${n ? `<span class="coins paid">${coins(n)}</span>` : ''}`,
        `data-drag="env" data-su="${su}" role="button" tabindex="0" aria-pressed="${rv}" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${rv ? 'Shown to the table' : 'Show to the table for 1 token'}"`));
    }).join('');
    const hand = [0, 1, 2].map(su => {
      const c = wr.aside[su], on = draft.swaps.includes(su);
      const next = on ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su);
      const price = on ? 0 : OP.SWAP_COST[next.length] - OP.SWAP_COST[draft.swaps.length];
      const ok = costWith({ swaps: next }) <= 3;
      return slot('hand', su, cardHTML(c, `drag${ok ? '' : ' broke'}${ui.land === su ? ' land' : ''}`, on ? '<span class="tag back">↺</span>' : `<span class="tag">${coins(price)}</span>`,
        `data-drag="hand" data-su="${su}" role="button" tabindex="0" aria-label="${esc(c.w)}, ${fmt(c.v)}. ${on ? 'Swap back for free' : `Swap into the envelope for ${price} token${price === 1 ? '' : 's'}`}"`));
    }).join('');
    ui.land = null;
    const v = evs(wr.prop), vol = wr.prop.some(c => c.v === 'V');
    const canRedeal = !draft.redeal && costWith({ redeal: true }) <= 3;
    const left = Math.max(0, 3 - cost), dealCls = ui.deal ? (ui.deal === 'redeal' ? ' deal redeal' : ' deal') : '';
    // a fresh quarter waits for the stripe wipe to clear before dealing
    const wait = ui.deal === true && ui.lastKey !== `${S.r}|${PHASE[S.phase]}` ? .85 : 0;
    ui.deal = false;
    const purse = `<span class="purse" role="img" aria-label="${left} of 3 tokens left">${coins(left)}${'<i class="coin spent"></i>'.repeat(3 - left)}</span>`;
    // one strip of adding-machine tape between the policy and the hand: where it came from, what it's worth, re-deal
    const tray = `<div class="tape"><span class="t-src">${inhSource(inh)}</span>
        <span class="t-worth ${tone(v)}" aria-label="Policy worth ${fmt(v)}${vol ? ', volatile' : ''}">${fmt(v)}${vol ? '<small>±2</small>' : ''}</span>
        <button class="t-redeal" data-a="redeal" ${canRedeal ? '' : 'disabled'} aria-label="Re-deal the inherited three for 2 tokens">${draft.redeal ? 'Re-dealt' : '↻ Re-deal'}<span class="t-cost">${coins(2)}</span></button></div>`;
    const stamps = `<div class="bar3 stampstrip" role="radiogroup" aria-label="Stamp">${Object.keys(STAMP).map(k => `<button class="s-${k}" role="radio" data-a="stamp" data-v="${k}" aria-checked="${draft.stamp === k}" aria-pressed="${draft.stamp === k}"><span>${STAMP[k]}</span></button>`).join('')}</div>`;
    const body = `<div class="play${dealCls}" style="--wait:${wait}s"><div class="policy">${env}</div>${tray}<div class="fan">${hand}</div></div>${stamps}`;
    return deskWrap(OP.DEPTS[p.dept], body, { right: purse, fuse: fuse(`${S.r}-cards`, TIME.cards, finalise), foot: key('finalise', 'Finalise') });
  }
  function deskDress(p, wr) {
    const locked = !!S.reqStyle;
    const mock = { id: '·', style: draft.style, subject: subjectOf(draft), stamp: draft.stamp || 'Rec', cards: wr.prop, revealed: [], author: ME, dept: p.dept };
    const arrive = ui.arrive ? ' arrive' : ''; ui.arrive = false;
    const designer = p.spec === 'Designer' ? `<div class="row-l"><span class="label">Next quarter</span><label class="drop"><select id="next-style" data-in="nextStyle"><option value="">Any envelope</option>${OP.COLORS.flatMap(c => OP.TRIMS.map(t => `<option value="${c}/${t}" ${draft.nextStyle && draft.nextStyle.color === c && draft.nextStyle.trim === t ? 'selected' : ''}>${c} · ${t}</option>`)).join('')}</select></label></div>` : '';
    const body = `<div class="preview${arrive}">${envHTML(mock, { preview: true })}</div>
      <div class="subj">${draft.words.map((k, i) => `<button class="subj-word" data-a="reroll" data-i="${i}" ${draft.useCustom ? 'disabled' : ''}>${esc((S.subj || OP.SUBJ)[i][k])}</button>`).join('')}</div>
      <input class="input" id="custom-subject" data-in="custom" maxlength="80" placeholder="Or write your own…" value="${esc(draft.custom)}">
      <div class="styles">${OP.COLORS.map(c => `<button class="swatch" style="background:var(--env-${c})" data-a="color" data-v="${c}" aria-pressed="${draft.style.color === c}" aria-label="${c}" ${locked ? 'disabled' : ''}></button>`).join('')}
        <span class="sep"></span>${OP.TRIMS.map(t => `<button class="trim-btn" data-a="trim" data-v="${t}" aria-pressed="${draft.style.trim === t}" ${locked ? 'disabled' : ''}>${t}</button>`).join('')}</div>
      ${designer}`;
    return deskWrap(OP.DEPTS[p.dept], body, { fuse: fuse(`${S.r}-dress`, TIME.dress, seal), foot: `<div class="two-keys"><button class="btn back" data-a="back">‹ Cards</button>${key('seal', 'Seal')}</div>` });
  }
  // pick-one grids: envelopes as small envelopes, people as name tags
  function minis(list, current, none) {
    return `<div class="minis">${list.map(e => {
      const peek = e.audited || e.revealed.length ? `<span class="peek">${e.cards.map((c, su) => e.audited || e.revealed.includes(su) ? `<b class="s-${su} ${tone(c.v)}">${GLYPH[c.v]}</b>` : `<i class="s-${su}">${brand().mono}</i>`).join('')}</span>` : '';
      return `<button class="mini c-${e.style.color} t-${e.style.trim}" data-a="sel" data-id="${e.id}" aria-pressed="${current === e.id}" aria-label="Envelope ${ICON_NAMES[iconIdx(e.id)]}: ${esc(e.subject)}">
        ${peek}<span class="mid">${icon(e.id)}</span>${stampMark(e.stamp)}<span class="ms">${esc(e.subject)}</span>${mine() && e.author === ME ? '<i class="yours">You</i>' : ''}</button>`;
    }).join('')}${none ? `<button class="mini none" data-a="sel" data-id="none" aria-pressed="${current === 'none'}">${none}</button>` : ''}</div>`;
  }
  function nameTags(list, current, none) {
    return `<div class="tags">${list.map(q => `<button class="nametag" data-a="sel" data-id="${q.id}" aria-pressed="${String(current) === String(q.id)}"><span class="hello">Hello<small>my name is</small></span><b>${esc(q.name)}</b>${stickers(q)}</button>`).join('')}
      ${none ? `<button class="nametag none" data-a="sel" data-id="none" aria-pressed="${String(current) === 'none'}"><b>${none}</b></button>` : ''}</div>`;
  }
  const boardSlip = () => S.board ? slip(S.board.overruled ? `Board overruled ${icon(S.board.nominee)} · ${S.board.own ? 'the CEO’s own' : S.board.author == null ? 'autopilot' : esc(nm(S.board.author))}` : `Board ratified ${icon(S.board.nominee)}`) : '';
  const auditSlip = () => S.audit ? slip(S.audit.winner === 'none' ? 'Nothing audited' : `Audited ${icon(S.audit.winner)}`) : '';
  function resultSlip() {
    if (!S.result) return '';
    const e = S.envs.find(x => x.id === S.result.id); if (!e) return '';
    return slip(`${icon(S.result.id)} ${e.autopilot ? 'Autopilot' : esc(nm(S.result.author))} <b class="${tone(S.result.actual)}">${fmt(S.result.actual)}</b>`);
  }
  function deskSpectate() {
    const ph = S.phase;
    if (ph === 'end') return deskEnd();
    const label = { decide: 'See the decision', review: S.r < 5 ? `Start Q${S.r + 1}` : 'Whistleblower' }[ph];
    const bits = [auditSlip()];
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
      <div class="hint">${sabs.length ? `Saboteur${sabs.length > 1 ? 's' : ''}: <b>${sabs.map(p => esc(p.name)).join(', ')}</b>` : 'No saboteur'}</div></div>`;
    return deskWrap('Final figures', body, { foot: `<div class="two-keys"><button class="btn back" data-a="quit">Settings</button>${key('again', 'Again')}</div>` });
  }
  function desk() {
    if (S.spectate) return deskSpectate();
    const p = me(), ph = S.phase;
    if (ph === 'brief') {
      // a typed memo on letterhead; the only thing that matters is the rubber stamp
      const fine = p.sab ? 'Make sure it misses. Quietly.' : S.n >= 6 ? 'Up to two saboteurs. Possibly none.' : 'Possibly a saboteur. Possibly not.';
      const body = `<div class="memo-sheet">
        <div class="lh"><span class="logo-mark" aria-hidden="true">${brandMark()}</span><span class="lh-name"><span class="brand-name">${esc(brand().name)}</span> ${esc(brand().suffix)}<small>People &amp; Culture</small></span><span class="lh-ref">Q0 / HR / ${String(S.seed % 1000).padStart(3, '0')}</span></div>
        <div class="memo-row"><span>To</span>${ui.badge ? `<img class="ink-name" src="${ui.badge}" alt="You">` : '<b>You</b>'}</div>
        <div class="memo-row"><span>Re</span><b>Your allegiance</b></div>
        <div class="memo-row"><span>Target</span><b>+${S.target}</b> by Q5</div>
        <div class="memo-stamp ${p.sab ? 'sab' : 'loyal'}">${p.sab ? 'Saboteur' : 'Loyal'}</div>
        ${p.spec ? `<div class="memo-spec">${p.spec}<small>${p.spec === 'Auditor' ? 'you see who wrote every envelope' : 'you choose next quarter’s envelope'}</small></div>` : ''}
        <div class="memo-fine">${fine}</div>
        <svg class="memo-sig" viewBox="0 0 160 40" aria-hidden="true"><path d="M4 30c10-18 18-24 22-16s-8 18 2 12 14-22 20-16-6 20 4 14 10-14 16-10 2 12 10 8 12-10 20-8 6 8 14 4 14-6 20-4"/></svg>
      </div>`;
      return deskWrap('Strictly confidential', body, { foot: key('begin', 'Start Q1') });
    }
    if (ph === 'work' && draft) return deskWork();
    const leave = p.leave ? slip('Stood down') : '';
    if (ph === 'pitch') {
      const list = S.envs.filter(e => !e.autopilot).sort((a, b) => a.id.localeCompare(b.id));
      return deskWrap('Audit vote', `${leave}${minis(list, ui.sel, 'Open nothing')}`, { foot: key('audit', ui.sel && ui.sel !== 'none' ? `Open ${icon(ui.sel)}` : 'Vote', !!ui.sel) });
    }
    if (ph === 'decide') {
      if (isCEO()) return deskWrap('You are CEO', `<div class="slips">${auditSlip()}</div>${minis(S.envs.slice().sort((a, b) => a.id.localeCompare(b.id)), ui.sel)}`, { foot: key('approve', ui.sel ? `Nominate ${icon(ui.sel)}` : 'Nominate', !!ui.sel) });
      return deskWrap(`${esc(nm(S.ceo))} is CEO`, `${leave}<div class="slips">${auditSlip()}</div>`, { foot: key('advance', 'See the decision') });
    }
    if (ph === 'board') {
      const nom = S.envs.find(e => e.id === S.nominee);
      const body = `<div class="slips">${auditSlip()}${slip(`${esc(nm(S.ceo))} nominated ${icon(S.nominee)}`)}</div><div class="board-nom">${envHTML(nom, {})}</div>
        <div class="bar3 two" role="radiogroup" aria-label="Board vote">${['ratify', 'overrule'].map(v => `<button class="b-${v}" role="radio" data-a="sel" data-id="${v}" aria-checked="${ui.sel === v}" aria-pressed="${ui.sel === v}"><span>${v === 'ratify' ? 'Ratify' : 'Overrule'}</span></button>`).join('')}</div>`;
      return deskWrap('Board vote', `${leave}${body}`, { foot: key('board', 'Sign', ui.sel === 'ratify' || ui.sel === 'overrule') });
    }
    if (ph === 'reveal') {
      const list = S.P.filter(q => q.id !== ME && !q.leave);
      return deskWrap('Written Warning', `<div class="slips">${boardSlip()}${resultSlip()}</div>${nameTags(list, ui.sel, 'Nobody')}`, { foot: key('warn', 'Vote', ui.sel != null) });
    }
    if (ph === 'review') {
      const w = S.warn;
      return deskWrap('Quarter closed', `<div class="slips">${resultSlip()}${slip(w.target == null ? 'No warning' : `Warning · <b>${esc(nm(w.target))}</b> ${w.passed ? 'passed' : 'failed'}`)}</div>`, { foot: key('advance', S.r < 5 ? `Start Q${S.r + 1}` : 'Whistleblower') });
    }
    if (ph === 'whistle') {
      return deskWrap('Name a saboteur', `<div class="slips">${slip(`Right: <b class="pos">Clawback</b> · wrong <b class="neg">−3</b>`)}</div>${nameTags(S.P.filter(q => q.id !== ME), ui.sel, 'Nobody')}`, { foot: key('whistle', 'Vote', ui.sel != null) });
    }
    if (ph === 'end') return deskEnd();
    return deskWrap(PHASE[ph], '');
  }

  // ---------- clocking in: type a name, trace it one letter at a time, get a name badge ----------
  // A letter passes as soon as every part of it is at least half inked and no more than 30% of the ink spills outside,
  // however many strokes that took. The stroke budget only decides when a failed letter starts again.
  const TRACE = { size: 520, brush: 58, spill: .3, part: .1, partCover: .4, dwell: 1800 };
  const maxStrokes = ch => ('IJLOCSUVZ017'.includes(ch) ? 3 : 'MWEKBRQ#'.includes(ch) ? 5 : 4);
  let naming = null;
  const nameLetters = t => t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  function badgeHTML() { return `<div class="nametag big"><span class="hello">Hello<small>my name is</small></span><img src="${ui.badge}" alt="${esc(ui.badgeName)}"></div>`; }
  function deskNaming() {
    const n = naming;
    if (n.phase === 'type') return deskWrap('Clocking in', `<div class="nametag big blank"><span class="hello">Hello<small>my name is</small></span>
        <input id="name-in" data-in="name" maxlength="10" autocomplete="off" spellcheck="false" placeholder="Your name" value="${esc(n.name)}" aria-label="Your name"></div>`,
      { foot: `<div class="two-keys"><button class="btn back" data-a="name-skip">Skip</button>${key('name-go', 'Sign in', nameLetters(n.name).length > 0)}</div>` });
    if (n.phase === 'trace') {
      const ch = n.letters[n.i], left = maxStrokes(ch) - n.strokes;
      return deskWrap('Clocking in', `<div class="trace-top"><span class="dots">${n.letters.split('').map((_, k) => `<i class="${k < n.i ? 'done' : k === n.i ? 'now' : ''}"></i>`).join('')}</span>
          <span class="nibs" aria-label="${left} strokes left">${'<i></i>'.repeat(left)}${'<i class="used"></i>'.repeat(n.strokes)}</span></div>
        <div class="pad" id="pad"><canvas id="guide" width="${TRACE.size}" height="${TRACE.size}" aria-hidden="true"></canvas><canvas id="ink" width="${TRACE.size}" height="${TRACE.size}" aria-label="Trace the letter ${ch}"></canvas></div>`,
        { foot: `<div class="two-keys"><button class="btn back" data-a="name-back">‹ Name</button><button class="btn back" data-a="name-redo">Redo letter</button></div>` });
    }
    return deskWrap('Clocking in', `<div class="badge-hold reveal">${badgeHTML()}</div>`, { foot: key('start', 'Clock in') });
  }
  function namingBoard() {
    return `<section><div class="section-head"><h2>Clocking in</h2></div><div class="clock-wall">${naming && naming.phase === 'badge' ? badgeHTML() : '<div class="nametag big blank"><span class="hello">Hello<small>my name is</small></span><span class="ghost-name"></span></div>'}</div></section>`;
  }
  async function mountTrace() {
    const n = naming, g = document.getElementById('guide'), c = document.getElementById('ink');
    if (!g || !c) return;
    const ch = n.letters[n.i], Z = TRACE.size;
    try { await document.fonts.load(`700 100px "Schibsted Grotesk"`); } catch (e) {}
    const gx = g.getContext('2d');
    gx.clearRect(0, 0, Z, Z); gx.font = `700 ${Z * .86}px "Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif`;
    gx.textAlign = 'center'; gx.textBaseline = 'alphabetic'; gx.fillStyle = 'rgba(20,20,20,.13)';
    const m = gx.measureText(ch), h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    gx.fillText(ch, Z / 2, Z / 2 + h / 2 - m.actualBoundingBoxDescent);
    const mask = gx.getImageData(0, 0, Z, Z).data;
    gx.setLineDash([10, 12]); gx.lineWidth = 3; gx.strokeStyle = 'rgba(20,20,20,.28)';
    gx.strokeText(ch, Z / 2, Z / 2 + h / 2 - m.actualBoundingBoxDescent);
    // checkpoints: the letter's box is cut into a 3×3 grid, and every cell with a real part of the letter in it
    // (the E's middle bar, the ends of its top and bottom bands) has to be inked on its own
    let bx0 = Z, by0 = Z, bx1 = 0, by1 = 0;
    for (let y = 0; y < Z; y += 2) for (let x = 0; x < Z; x += 2) if (mask[(y * Z + x) * 4 + 3] > 20) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    const cell = (x, y) => Math.min(2, Math.floor((x - bx0) / ((bx1 - bx0 + 2) / 3))) * 3 + Math.min(2, Math.floor((y - by0) / ((by1 - by0 + 2) / 3)));
    const ix = c.getContext('2d');
    ix.lineCap = ix.lineJoin = 'round'; ix.lineWidth = TRACE.brush; ix.strokeStyle = '#161A2E';
    let down = null;
    const pad = document.getElementById('pad');
    const at = ev => { const r = c.getBoundingClientRect(); return [(ev.clientX - r.left) * Z / r.width, (ev.clientY - r.top) * Z / r.height]; };
    c.onpointerdown = ev => {
      ev.preventDefault(); c.setPointerCapture(ev.pointerId);
      clearTimeout(n.wait); pad.classList.remove('ok');
      down = at(ev); ix.beginPath(); ix.moveTo(...down); ix.lineTo(down[0] + .1, down[1]); ix.stroke();
    };
    c.onpointermove = ev => { if (!down) return; const p = at(ev); ix.beginPath(); ix.moveTo(...down); ix.lineTo(...p); ix.stroke(); down = p; };
    c.onpointerup = c.onpointercancel = () => {
      if (!down) return; down = null; n.strokes++;
      const ink = ix.getImageData(0, 0, Z, Z).data;
      let L = 0, cov = 0, inkN = 0, out = 0, x0 = Z, y0 = Z, x1 = 0, y1 = 0;
      const cl = new Array(9).fill(0), cc = new Array(9).fill(0);
      for (let y = 0; y < Z; y += 2) for (let x = 0; x < Z; x += 2) {
        const k = (y * Z + x) * 4, gi = mask[k + 3] > 20, ii = ink[k + 3] > 60;
        if (gi) { L++; const q = cell(x, y); cl[q]++; if (ii) cc[q]++; }
        if (ii) { inkN++; if (gi) cov++; else out++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      const area = ((bx1 - bx0) / 3) * ((by1 - by0) / 3) / 4;
      const parts = cl.every((v, q) => v < area * TRACE.part || cc[q] / v >= TRACE.partCover);
      const pass = L && parts && out / Math.max(1, inkN) <= TRACE.spill;
      if (pass) {
        // looks right: wait for the pen to stay lifted before moving on, in case they're still going
        pad.classList.add('ok');
        n.wait = setTimeout(() => {
          const crop = document.createElement('canvas'); crop.width = x1 - x0 + 2; crop.height = Z;
          crop.getContext('2d').drawImage(c, x0, 0, crop.width, Z, 0, 0, crop.width, Z);
          n.inks.push(crop); n.i++; n.strokes = 0;
          if (n.i >= n.letters.length) { composeBadge(); n.phase = 'badge'; }
          render();
        }, TRACE.dwell);
      } else if (n.strokes >= maxStrokes(ch)) {
        pad.classList.remove('nope'); void pad.offsetWidth; pad.classList.add('nope');
        toast('Inside the lines, please.');
        setTimeout(() => { n.strokes = 0; render(); }, 450);
      }
      const nb = document.querySelectorAll('.nibs i:not(.used)'); if (nb.length) nb[nb.length - 1].classList.add('used');
    };
  }
  // the badge shows only the ink, letter by letter, in a row: never the typed text
  function composeBadge() {
    const n = naming, k = .2, gap = 6, H = Math.round(TRACE.size * k);
    const W = n.inks.reduce((w, c) => w + Math.round(c.width * k) + gap, 0);
    const b = document.createElement('canvas'); b.width = W * 2; b.height = H * 2;
    const x = b.getContext('2d'); x.scale(2, 2);
    let at = 0;
    n.inks.forEach((c, i) => { x.save(); x.translate(at, 0); x.rotate((((i * 37) % 9) - 4) * Math.PI / 180 / 2); x.drawImage(c, 0, 0, c.width * k, H); x.restore(); at += Math.round(c.width * k) + gap; });
    ui.badge = b.toDataURL(); ui.badgeName = n.letters;
  }
  function startGame(seedFrom) {
    const seed = seedFrom === 'start' && /^\d+$/.test(String(setup.seed).trim()) ? +setup.seed : Math.floor(Math.random() * 1e9) + 1;
    naming = null;
    S = OP.newGame(Object.assign({}, setup, { seed })); draft = null; err = ''; ui.sel = null; ui.shown = null; ui.lastKey = null; ui.printed = 0; render(); window.scrollTo(0, 0);
  }

  // ---------- setup ----------
  function seg(key, opts) { return `<div class="seg">${opts.map(([v, l]) => `<button data-a="set" data-k="${key}" data-v="${v}" aria-pressed="${String(setup[key]) === String(v)}">${l}</button>`).join('')}</div>`; }
  function setupHTML() {
    return `<div class="wrap"><div class="setup">
      <div class="setup-hero"><span class="label">One human, the rest bots</span><h1>Only Profit</h1>
        <p>Inherit someone else's mess, seal it in an anonymous envelope, and find out whose name was on it only once it's approved. Hit the profit target in five quarters, or quietly make sure nobody does.</p></div>
      <div class="setup-body">
        <div class="field"><span class="label">Employees</span>${seg('players', [[4, '4'], [5, '5'], [6, '6'], [7, '7'], [8, '8']])}</div>
        <div class="field"><span class="label">Your seat</span>${seg('spectate', [[false, 'Play'], [true, 'Watch the bots']])}</div>
        <div class="field"><span class="label">Loyal bots</span>${seg('loyalTier', [['smart', 'Smart'], ['basic', 'Basic'], ['naive', 'Gullible']])}</div>
        <div class="field"><span class="label">Saboteur bots</span>${seg('sabTier', [['smart', 'Smart'], ['patient', 'Patient'], ['blatant', 'Blatant']])}</div>
        <div class="field"><span class="label">Company</span>${seg('brand', BRANDS.map(b => [b.id, b.name]))}</div>
        <div class="field"><span class="label">Target</span>${seg('easy', [[false, 'Standard'], [true, 'Easy mode (−3)']])}</div>
        <div class="field"><label class="label" for="seed">Seed (optional, to replay a deal)</label><input class="input" id="seed" data-in="seed" inputmode="numeric" placeholder="Random" value="${esc(setup.seed)}" style="max-width:200px"></div>
        <details class="rules"><summary>The quarter, in brief</summary><ol>
          <li><b>Work.</b> The 3 cards you inherit are your proposal. Draw 3 more. Spend 3 tokens: swap a card in (1, then 2), re-deal all three (2), or show one card to the table (1). Stamp it, write a subject line, style the envelope.</li>
          <li><b>Pitch.</b> Envelopes appear shuffled and anonymous. Memos on the bulletin board say who left whom a mess. Nobody can check them. The table votes to audit one envelope.</li>
          <li><b>Decide + Reveal.</b> The CEO nominates one; the Board (everyone else) ratifies it or overrules it, and a majority Overrule puts the best-looking envelope through instead. An overruled nominee is unmasked, and a CEO caught pushing their own sits out their next turn as CEO. Profit moves and the approved author is unmasked. Rejected envelopes pass, sealed, to that department's next manager. The table may issue a Written Warning; two means you're stood down.</li>
          <li><b>Effect Modifiers.</b> Four Modifiers rewrite the other two cards: ∅ cancels them, ×2 doubles them, ≥0 stops them losing, ⇅ flips them. Each also has its own value.</li>
          <li><b>After Q5.</b> The table may name a saboteur. Right, and Clawback reverses every losing policy they wrote (at least +3). Wrong costs −3. Audit and Whistleblower ties are drawn at random (a tied Whistleblower names nobody).</li></ol></details>
        <div class="setup-foot"><button class="btn primary" data-a="start">Start the game</button><span class="hint">About 10 minutes against bots.</span></div>
      </div></div></div>`;
  }

  // ---------- render ----------
  function render() {
    applyBrand();
    document.documentElement.dataset.phase = S ? S.phase : 'setup';
    if (!S && naming) { $app.innerHTML = `${mast()}<div class="wrap"><div class="layout"><main class="board">${namingBoard()}</main>${deskNaming()}</div></div>`; if (naming.phase === 'trace') mountTrace(); return; }
    if (!S) { $app.innerHTML = mast() + setupHTML(); return; }
    const board = S.phase === 'end' || S.phase === 'whistle'
      ? `${observerHTML()}${S.phase === 'end' ? exitHTML() : ''}<div class="two">${ledgerHTML()}${staffHTML()}</div>${feedHTML()}`
      : `${observerHTML()}${envelopesHTML()}${feedHTML()}<div class="two">${ledgerHTML()}${staffHTML()}</div>`;
    if (!(S.phase === 'work' && draft)) stopTimer();
    $app.innerHTML = `${mast()}<div class="wrap"><div class="layout"><main class="board">${board}</main>${desk()}</div></div>`;
    transition();
  }
  // stripe wipe when the phase label changes; the profit calculator counts up to the new total
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function transition() {
    const key = `${S.r}|${PHASE[S.phase]}`;
    if (ui.lastKey && ui.lastKey !== key && !still()) {
      const w = document.createElement('div'); w.className = 'wipe'; w.setAttribute('aria-hidden', 'true');
      w.innerHTML = `<span><b>Q${Math.max(1, S.r)}</b><i>${PHASE[S.phase]}</i></span>`;
      document.body.appendChild(w); setTimeout(() => w.remove(), 1400);
    }
    ui.lastKey = key;
    if (ui.shown == null || still()) { ui.shown = S.profit; return; }
    if (ui.shown === S.profit || ui.tick) return;
    const step = () => {
      ui.shown += Math.sign(S.profit - ui.shown);
      const el = document.getElementById('lcd-profit'); if (el) el.innerHTML = lcd(ui.shown);
      ui.tick = ui.shown === S.profit ? null : setTimeout(step, 160);
    };
    ui.tick = setTimeout(step, 700);
  }

  // ---------- events ----------
  $app.addEventListener('click', ev => {
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a, d = b.dataset;
    switch (a) {
      case 'debug': ui.debug = !ui.debug; try { localStorage.setItem('op-debug', ui.debug ? '1' : '0'); } catch (e) {} render(); break;
      case 'quit': S = null; draft = null; ui.lastKey = null; render(); break;
      case 'set': setup[d.k] = d.k === 'players' ? +d.v : (d.v === 'true' ? true : d.v === 'false' ? false : d.v); render(); break;
      case 'start':
        if (!naming && !setup.spectate && !ui.badge && !window.__opSkipName) { naming = { phase: 'type', name: '' }; render(); break; }
        startGame('start'); break;
      case 'again': startGame('again'); break;
      case 'name-go': { const l = nameLetters(naming.name); if (!l) break; Object.assign(naming, { phase: 'trace', letters: l, i: 0, strokes: 0, inks: [] }); render(); break; }
      case 'name-skip': naming = null; ui.badge = null; startGame('start'); break;
      case 'name-back': clearTimeout(naming.wait); naming.phase = 'type'; render(); break;
      case 'name-redo': clearTimeout(naming.wait); naming.strokes = 0; render(); break;
      case 'begin': dispatch({ type: 'begin' }); break;
      case 'advance': dispatch({ type: 'advance' }); break;
      case 'swap': { const su = +d.su; draft.swaps = draft.swaps.includes(su) ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su); render(); break; }
      case 'reveal': { const su = +d.su; draft.reveals = draft.reveals.includes(su) ? draft.reveals.filter(x => x !== su) : draft.reveals.concat(su); render(); break; }
      case 'redeal': draft.redeal = true; ui.deal = 'redeal'; toast('Inherited cards shredded. Three fresh ones dealt.'); render(); break;
      case 'stamp': draft.stamp = d.v; render(); break;
      case 'finalise': finalise(); break;
      case 'back': draft.page = 1; render(); break;
      case 'reroll': { const i = +d.i, l = (S.subj || OP.SUBJ)[i].length; let k; do { k = Math.floor(Math.random() * l); } while (k === draft.words[i] && l > 1); draft.words[i] = k; render(); break; }
      case 'color': draft.style.color = d.v; render(); break;
      case 'trim': draft.style.trim = d.v; render(); break;
      case 'claim': draft.claim.kind = d.k; render(); break;
      case 'seal': seal(); break;
      case 'sel': ui.sel = d.id; render(); break;
      case 'audit': dispatch({ type: 'auditVote', target: ui.sel }); break;
      case 'approve': dispatch({ type: 'approve', id: ui.sel }); break;
      case 'board': dispatch({ type: 'boardVote', vote: ui.sel }); break;
      case 'warn': dispatch({ type: 'warnVote', target: ui.sel }); break;
      case 'whistle': dispatch({ type: 'whistleVote', target: ui.sel }); break;
    }
  });
  // ---------- cards: drag between envelope and hand, or tap ----------
  function swapSuit(su) {
    const next = draft.swaps.includes(su) ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su);
    if (costWith({ swaps: next }) > 3) return refuse(su);
    draft.swaps = next; ui.land = su; render();
  }
  function revealSuit(su) {
    const next = draft.reveals.includes(su) ? draft.reveals.filter(x => x !== su) : draft.reveals.concat(su);
    if (costWith({ reveals: next }) > 3) return refuse(su);
    draft.reveals = next; render();
  }
  function refuse(su) {
    toast('Not enough tokens.');
    document.querySelectorAll(`.card[data-su="${su}"]`).forEach(el => { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); });
  }
  const tapCard = (zone, su) => (zone === 'hand' ? swapSuit(su) : revealSuit(su));
  let drag = null;
  function endDrag() {
    if (!drag) return;
    if (drag.clone) drag.clone.remove();
    drag.el.classList.remove('lifted');
    document.querySelectorAll('.slot.ok, .slot.hot').forEach(x => x.classList.remove('ok', 'hot'));
    drag = null;
  }
  const slotAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest('.slot'); };
  $app.addEventListener('pointerdown', ev => {
    const el = ev.target.closest('.card[data-drag]'); if (!el || !draft || ev.button > 0) return;
    const r = el.getBoundingClientRect();
    drag = { el, zone: el.dataset.drag, su: +el.dataset.su, x: ev.clientX, y: ev.clientY, ox: ev.clientX - r.left, oy: ev.clientY - r.top, w: r.width, h: r.height, clone: null };
  });
  window.addEventListener('pointermove', ev => {
    if (!drag) return;
    if (!drag.clone) {
      if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 6) return;
      const c = drag.el.cloneNode(true); c.classList.add('dragging'); c.removeAttribute('data-drag');
      c.style.width = drag.w + 'px'; c.style.height = drag.h + 'px';
      document.body.appendChild(c); drag.clone = c; drag.el.classList.add('lifted');
      const other = drag.zone === 'hand' ? 'env' : 'hand';
      document.querySelectorAll(`.slot[data-drop="${other}"][data-su="${drag.su}"]`).forEach(x => x.classList.add('ok'));
    }
    ev.preventDefault();
    drag.clone.style.transform = `translate(${ev.clientX - drag.ox}px, ${ev.clientY - drag.oy}px) rotate(${Math.max(-8, Math.min(8, (ev.clientX - drag.x) / 18))}deg) scale(1.06)`;
    const t = slotAt(ev.clientX, ev.clientY);
    document.querySelectorAll('.slot.hot').forEach(x => x !== t && x.classList.remove('hot'));
    if (t && t.classList.contains('ok')) t.classList.add('hot');
  }, { passive: false });
  window.addEventListener('pointerup', ev => {
    if (!drag) return;
    const { zone, su, clone } = drag;
    const t = clone && slotAt(ev.clientX, ev.clientY);
    const hit = t && t.classList.contains('ok');
    endDrag();
    if (!clone) tapCard(zone, su); else if (hit) swapSuit(su);
  });
  window.addEventListener('pointercancel', endDrag);
  $app.addEventListener('keydown', ev => {
    const el = ev.target.closest && ev.target.closest('.card[data-drag]');
    if (el && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); tapCard(el.dataset.drag, +el.dataset.su); }
    if (ev.target.id === 'name-in' && ev.key === 'Enter') { ev.preventDefault(); const b = document.querySelector('[data-a="name-go"]'); if (b && !b.disabled) b.click(); }
  });
  $app.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset && el.dataset.in; if (!k) return;
    if (k === 'seed') setup.seed = el.value;
    if (k === 'name') { naming.name = el.value; const go = document.querySelector('[data-a="name-go"]'); if (go) go.disabled = !nameLetters(el.value); }
    if (k === 'custom') {
      draft.custom = el.value; const was = draft.useCustom; draft.useCustom = !!el.value.trim();
      if (was !== draft.useCustom) document.querySelectorAll('.subj-word').forEach(b => { b.disabled = draft.useCustom; });
      const pv = document.querySelector('.preview .env-subj'); if (pv) pv.textContent = subjectOf(draft);
    }
    if (k === 'claimStamp') draft.claim.stamp = el.value;
    if (k === 'claimVal') draft.claim.val = +el.value;
    if (k === 'nextStyle') { const [c, t] = el.value.split('/'); draft.nextStyle = el.value ? { color: c, trim: t } : null; }
  });

  // keep a game in progress across page updates
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ S, draft, setup, debug: ui.debug }));
  const start = data => { if (data && data.S) { S = data.S; draft = data.draft; setup = data.setup || setup; } render(); };
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start); else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
  window.__op = { get S() { return S; }, dispatch, brand: id => { setup.brand = id; render(); }, BRANDS };
})();

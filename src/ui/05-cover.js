  // ---------- cover pages: every proposal is a pile of paper with a cover page on top ----------
  // a page is laid out once at 280×396 and scaled whole (--k), so it reads the same on the TV and the phone
  const TPL = {
    fax: { name: 'Fax', font: 'typewriter', align: 'left', art: 'chart' },
    memo: { name: 'Memo', font: 'grotesk', align: 'left', art: 'chart' },
    wordart: { name: 'WordArt', font: 'poster', align: 'center', art: 'thumb' },
    clipart: { name: 'Good news', font: 'comic', align: 'center', art: 'trophy' },
    report: { name: 'Report', font: 'serif', align: 'left', art: 'chart' },
    dossier: { name: 'Dossier', font: 'typewriter', align: 'left', art: 'grave' },
    overhead: { name: 'Overhead', font: 'grotesk', align: 'left', art: 'bulb' },
    certificate: { name: 'Certificate', font: 'serif', align: 'center', art: 'planet' }};
  const FONTS = { grotesk: 'Grotesk', typewriter: 'Typewriter', comic: 'Comic', serif: 'Serif', poster: 'Poster' };
  const FW = { poster: .58, grotesk: .6, typewriter: .62, comic: .56, serif: .6 };
  const hash = t => { let h = 7; for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  function lookOf(e) {
    const st = e.style || {}, tpl = TPL[st.tpl] ? st.tpl : 'memo', d = TPL[tpl];
    // bots don't pick clip-art; theirs is dealt from the subject line
    return { tpl, font: FONTS[st.font] ? st.font : d.font, align: st.align || d.align, art: ART.includes(st.art) ? st.art : ART[hash(e.subject) % ART.length] };
  }
  // the subject sized to fit its box
  function subjHTML(text, font, align, base, area) {
    const fs = Math.max(13, Math.min(base, Math.sqrt(area / (Math.max(8, text.length) * FW[font] * 1.12))));
    return `<div class="cp-subj f-${font}" style="text-align:${align};font-size:${fs.toFixed(1)}px">${esc(text)}</div>`;
  }
  // WordArt: one span per letter around an arc, two lines split near the middle
  function arcHTML(text, font) {
    const words = text.split(' '), half = text.length / 2;
    let cut = 0, run = 0;
    words.forEach((w, k) => { if (run < half) { run += w.length + 1; cut = k + 1; } });
    const lines = words.length > 1 ? [words.slice(0, cut).join(' '), words.slice(cut).join(' ')].filter(Boolean) : [text];
    const W = FW[font], fs = Math.max(12, Math.min(32, 236 / (W * Math.max(...lines.map(l => l.length)))));
    let n = 0;
    const out = lines.flatMap((line, li) => {
      const R = 210, cy = 236 + li * (fs + 6) + (lines.length === 1 ? 24 : 0), step = (fs * W) / R, start = -((line.length - 1) * step) / 2;
      return [...line].map((c, k) => {
        const t = start + k * step, x = 128 + R * Math.sin(t), y = cy - R * Math.cos(t);
        return `<span class="r${n++ % 6}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;transform:translate(-50%,-50%) rotate(${(t * 180 / Math.PI).toFixed(1)}deg)">${esc(c)}</span>`;
      });
    }).join('');
    return `<div class="cp-arc f-${font}" role="img" aria-label="${esc(text)}" style="font-size:${fs.toFixed(1)}px">${out}</div>`;
  }
  const artBox = (id, cls) => `<span class="cp-art ${cls || ''}">${artSVG(id)}</span>`;
  const redact = w => `<i class="cp-redact" style="width:${w}"></i>`;
  function coverInner(e, L) {
    const s = e.subject, q = `Q${Math.max(1, S ? S.r : 1)}`, b = brand();
    const sub = (base, area) => subjHTML(s, L.font, L.align, base, area);
    switch (L.tpl) {
      case 'fax': return `<div class="cp-in"><div class="fax-h">FAX COVER SHEET</div>
        <div class="fax-g"><b>TO:</b><span>The CEO</span><b>FROM:</b>${redact('100%')}<b>PAGES:</b><span>3 (incl. this one)</span></div>
        <div class="grow">${sub(23, 236 * 150)}</div><div class="fax-f">If you received this in error, please shred yourself.</div></div>`;
      case 'memo': return `<div class="cp-in"><div class="memo-h"><span class="memo-seal">${brandMark()}</span><span>${esc(b.name)}<small>${esc(b.suffix)}</small></span></div>
        <div class="memo-t">MEMORANDUM</div><div class="memo-g"><b>TO</b><span>All staff</span><b>FROM</b>${redact('70%')}<b>DATE</b><span>${q}</span></div>
        <div class="grow ruled">${sub(24, 236 * 140)}</div><div class="memo-lines"><i></i><i></i><i></i></div></div>`;
      case 'wordart': return `<div class="cp-in center">${arcHTML(s, L.font)}<div class="grow">${artBox(L.art, 'big')}</div></div>`;
      case 'clipart': return `<div class="cp-in center"><div class="clip-h">Good news!</div>${artBox(L.art, 'big')}<div class="grow">${sub(22, 236 * 120)}</div></div>`;
      case 'report': return `<div class="cp-in report"><div class="rep-h">QUARTERLY REPORT</div><div class="rep-box">${sub(23, 190 * 110)}</div>
        <div class="grow">${artBox(L.art, 'big')}</div><div class="rep-f">${q} · PREPARED BY ${redact('70px')}</div></div>`;
      case 'dossier': return `<div class="cp-in dos"><div class="dos-stamp">CONFIDENTIAL</div><div class="dos-ref"><span>FILE NO. ${String(hash(s) % 9000 + 1000)}-B</span><span>EYES ONLY</span></div>
        <div class="grow">${sub(22, 236 * 130)}</div><div class="dos-bars">${redact('100%')}${redact('64%')}${redact('82%')}</div></div>`;
      case 'overhead': return `<div class="cp-in oh">${sub(25, 216 * 110)}<div class="oh-rule"></div><div class="oh-list"><span>• Profit</span><span>• More profit</span><span>• Questions (none)</span></div>
        <div class="grow end">${artBox(L.art, 'small')}</div></div>`;
      default: return `<div class="cp-in center cert"><div class="cert-h">CERTIFICATE OF POLICY</div><div class="cert-i">this is to certify that</div>
        <div class="grow">${sub(24, 220 * 120)}</div><div class="cert-i">is a good idea</div><div class="cert-seal">${artBox(L.art, 'small')}</div></div>`;
    }
  }
  // the page itself: sticky note with the proposal's office icon, stamp in the corner
  function coverHTML(e, o) {
    o = o || {};
    const L = lookOf(e), tilt = o.tilt == null ? ((hash(e.id + e.subject) % 7) - 3) * .6 : o.tilt;
    return `<div class="cp-w" style="${o.k ? `--k:${o.k};` : ''}--t:${tilt}deg"><div class="cp t-${L.tpl}">${coverInner(e, L)}
      ${o.note === false ? '' : `<span class="cp-note">${icon(e.id, o.list)}</span>`}<span class="env-stamp cp-stamp ${e.stamp}">${STAMP[e.stamp]}</span>
      ${e.approved ? `<span class="big-stamp${o.fresh ? '' : ' no-anim'}" aria-hidden="true">Approved</span>` : ''}</div></div>`;
  }
  // ---------- the policy as one sentence: Action, Target, Modifier, highlighted in suit colours ----------
  const FXSFX = { null: 'pfft.', x2: 'KA-CHING!', shield: 'CLANG!', flip: 'FWOOMP!' };
  const sfxOf = (c, v) => c.fx ? FXSFX[c.fx] : v > 0 ? 'DING!' : v < 0 ? 'BWAMP.' : 'meh.';
  // what the Modifier does to the other two
  const after = (fx, v) => fx === 'null' ? 0 : fx === 'x2' ? 2 * v : fx === 'shield' ? Math.max(0, v) : fx === 'flip' ? -v : v;
  const val = v => v === 'V' ? '?' : v > 2 || v < -2 ? fmt(v) : GLYPH[v];
  function lineHTML(e, o) {
    o = o || {};
    const all = o.all || e.audited || e.autopilot || e.approved || ui.debug || (mine() && e.author === ME);
    const vis = su => all || e.revealed.includes(su);
    if (![0, 1, 2].some(vis)) return '';
    const fx = e.cards[2].fx, live = o.anim && e.resolved;
    const ph = e.cards.map((c, su) => {
      if (!vis(su)) return `<span class="ph s-${su} hid"><mark aria-label="Hidden ${OP.SUITS[su]}">${'█'.repeat(5)}</mark></span>`;
      const v = e.resolved ? e.resolved[su] : c.v;
      const change = live && su < 2 && fx && after(fx, v) !== v;
      const mark = change ? `<b class="v ${tone(v)} was">${val(v)}</b><b class="v ${tone(after(fx, v))} now">${val(after(fx, v))}</b>` : `<b class="v ${tone(v)}">${val(v)}</b>`;
      return `<span class="ph s-${su}${su === 2 ? ' mod' : ''}"><mark>${esc(c.w)}</mark>${mark}${c.fx ? `<i class="fxs">${FXSYM[c.fx]}</i>` : ''}${su === 2 && live ? `<i class="sfx" aria-hidden="true">${sfxOf(c, v)}</i>` : ''}</span>`;
    }).join(' ');
    const sum = e.resolved ? `<b class="sum ${tone(OP.total(e.resolved, e.cards))}">= ${fmt(OP.total(e.resolved, e.cards))}</b>` : '';
    return `<p class="line${live ? ' go' : ''}">${ph}${sum}</p>`;
  }

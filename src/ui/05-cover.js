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
  const plain = e => e.cards.map(c => c.w).join(' ');
  function lookOf(e) {
    const st = e.style || {}, tpl = TPL[st.tpl] ? st.tpl : 'memo', d = TPL[tpl];
    // bots don't pick clip-art; theirs is dealt from the sentence
    return { tpl, font: FONTS[st.font] ? st.font : d.font, align: st.align || d.align, art: ART.includes(st.art) ? st.art : ART[hash(plain(e)) % ART.length] };
  }
  // who can read what: words show unless blacked out; worth only once it's out in the open
  const inOpen = (e, o) => !!(o.all || e.audited || e.autopilot || e.approved || ui.debug);
  const seesAll = (e, o) => inOpen(e, o) || (mine() && e.author === ME);
  const BLOT = '█████';
  // the cover says the policy: its three card words, blacked-out ones inked over
  // see: the author's own sealed page, ink they can read through
  const wordsOf = (e, all, see) => e.cards.map((c, su) => !(e.redacted || []).includes(su) || (all && !see) ? { w: c.w } : all ? { w: c.w, ink: 'see' } : { w: BLOT, ink: true });
  const sayOf = (e, o) => wordsOf(e, seesAll(e, o || {})).map(p => p.ink ? 'blacked out' : p.w).join(' ');
  // the sentence sized to fill its box: short ones get big, no word wider than the box
  function subjHTML(parts, font, align, base, w, h) {
    const text = parts.map(p => p.w).join(' '), long = Math.max(...text.split(/\s+/).map(x => x.length)), W = FW[font];
    const fs = Math.max(12, Math.min(base * 1.7, Math.sqrt(w * h / (Math.max(6, text.length) * W * 1.2)), w / (long * W * 1.08)));
    return `<div class="cp-subj f-${font}" style="text-align:${align};font-size:${fs.toFixed(1)}px">${parts.map(p => p.ink === 'see' ? `<mark class="cp-ink see">${esc(p.w)}</mark>` : p.ink ? `<mark class="cp-ink" aria-label="blacked out">${BLOT}</mark>` : esc(p.w)).join(' ')}</div>`;
  }
  // WordArt: short lines, each on a gentle arc in one solid colour with a block shadow
  function arcHTML(parts, font) {
    const words = parts.flatMap(p => p.w.split(' ').map(w => ({ w, ink: p.ink })));
    let max = 14, lines;
    do {
      lines = [];
      for (const w of words) { const l = lines[lines.length - 1]; if (l && l.reduce((n, x) => n + x.w.length + 1, w.w.length) <= max) l.push(w); else lines.push([w]); }
      max += 3;
    } while (lines.length > 5);
    const len = l => l.reduce((n, x) => n + x.w.length + 1, -1);
    const W = FW[font], long = Math.max(...lines.map(len)), fs = Math.max(14, Math.min(40, 236 / (W * long)));
    const R = 300, gap = fs * 1.2, sag = R - Math.sqrt(R * R - 118 * 118);
    const out = lines.map((line, li) => {
      const chars = line.flatMap((x, k) => [...(k ? ' ' : '') + x.w].map(c => ({ c, ink: x.ink && c !== ' ' ? (x.ink === 'see' ? 'ink see' : 'ink') : '' })));
      const step = (fs * W * 1.06) / R, start = -((chars.length - 1) * step) / 2;
      return chars.map(({ c, ink }, k) => {
        const t = start + k * step, x = 128 + R * Math.sin(t), y = fs / 2 + li * gap + R * (1 - Math.cos(t));
        return `<span class="l${li % 3}${ink ? ' ' + ink : ''}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;transform:translate(-50%,-50%) rotate(${(t * 180 / Math.PI).toFixed(1)}deg)">${esc(c)}</span>`;
      }).join('');
    }).join('');
    return `<div class="cp-arc f-${font}" role="img" aria-label="${esc(parts.map(p => p.ink === true ? 'blacked out' : p.w).join(' '))}" style="font-size:${fs.toFixed(1)}px;height:${(lines.length * gap + sag).toFixed(0)}px">${out}</div>`;
  }
  const artBox = (id, cls) => `<span class="cp-art ${cls || ''}">${artSVG(id)}</span>`;
  const redact = w => `<i class="cp-redact" style="width:${w}"></i>`;
  // nothing on the page but the template's look, the sentence and the stamp
  function coverInner(e, L, all, see) {
    const s = wordsOf(e, all, see);
    const sub = (base, w, h) => subjHTML(s, L.font, L.align, base, w, h);
    switch (L.tpl) {
      case 'fax': return `<div class="cp-in"><div class="fax-h"></div><div class="grow">${sub(24, 236, 190)}</div></div>`;
      case 'memo': return `<div class="cp-in"><div class="memo-h"><span class="memo-seal">${brandMark()}</span><i class="memo-rule"></i></div>
        <div class="grow ruled">${sub(25, 236, 180)}</div><div class="memo-lines"><i></i><i></i><i></i></div></div>`;
      case 'wordart': return `<div class="cp-in center">${arcHTML(s, L.font)}<div class="grow">${artBox(L.art, 'big')}</div></div>`;
      case 'clipart': return `<div class="cp-in center">${artBox(L.art, 'big')}<div class="grow">${sub(23, 236, 140)}</div></div>`;
      case 'report': return `<div class="cp-in report"><div class="rep-box">${sub(22, 180, 130)}</div><div class="grow">${artBox(L.art, 'big')}</div></div>`;
      case 'dossier': return `<div class="cp-in dos"><div class="grow">${sub(23, 236, 170)}</div><div class="dos-bars">${redact('100%')}${redact('64%')}${redact('82%')}</div></div>`;
      case 'overhead': return `<div class="cp-in oh">${sub(26, 170, 150)}<div class="oh-rule"></div><div class="grow end">${artBox(L.art, 'small')}</div></div>`;
      default: return `<div class="cp-in center cert"><div class="grow">${sub(25, 210, 170)}</div><div class="cert-seal">${artBox(L.art, 'small')}</div></div>`;
    }
  }
  // the page itself: sticky note with the proposal's office icon, stamp in the corner
  function coverHTML(e, o) {
    o = o || {};
    const L = lookOf(e), tilt = o.tilt == null ? ((hash(e.id + plain(e)) % 7) - 3) * .6 : o.tilt;
    return `<div class="cp-w" style="${o.k ? `--k:${o.k};` : ''}--t:${tilt}deg"><div class="cp t-${L.tpl}">${coverInner(e, L, seesAll(e, o), !inOpen(e, o))}
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
    // the words are on the cover; this line is for once the worth is out in the open too
    if (!inOpen(e, o)) return '';
    const all = seesAll(e, o), vis = su => all || !(e.redacted || []).includes(su);
    const fx = e.cards[2].fx, live = o.anim && e.resolved;
    const ph = e.cards.map((c, su) => {
      if (!vis(su)) return `<span class="ph s-${su} hid"><mark aria-label="Hidden ${OP.SUITS[su]}">${'█'.repeat(5)}</mark></span>`;
      const v = e.resolved ? e.resolved[su] : c.v;
      const change = live && su < 2 && fx && after(fx, v) !== v;
      const mark = !all ? '' : change ? `<b class="v ${tone(v)} was">${val(v)}</b><b class="v ${tone(after(fx, v))} now">${val(after(fx, v))}</b>` : `<b class="v ${tone(v)}">${val(v)}</b>`;
      return `<span class="ph s-${su}${su === 2 ? ' mod' : ''}"><mark>${esc(c.w)}</mark>${mark}${c.fx ? `<i class="fxs">${FXSYM[c.fx]}</i>` : ''}${su === 2 && live ? `<i class="sfx" aria-hidden="true">${sfxOf(c, v)}</i>` : ''}</span>`;
    }).join(' ');
    const sum = e.resolved ? `<b class="sum ${tone(OP.total(e.resolved, e.cards))}">= ${fmt(OP.total(e.resolved, e.cards))}</b>` : '';
    return `<p class="line${live ? ' go' : ''}">${ph}${sum}</p>`;
  }

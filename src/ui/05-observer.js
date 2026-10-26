  function observerHTML() {
    if (!ui.debug) return '';
    const sus = S.P.map(p => `<span class="pill ${p.sab ? 'red' : 'green'}">${esc(p.name)} · ${p.sab ? (p.ruthless ? 'SAB · ruthless' : 'SAB') : `LOYAL · ${OP.PERS_SAY[p.pers]}`} · sus ${OP.suspicion(S, p).toFixed(1)}</span>`).join('');
    return `<section class="observer"><div class="section-head" style="margin:0;border-bottom-width:1px"><h2>Observer view</h2><span class="label">Hidden from players</span></div>
      <div style="font-size:13.5px">Headcount Memo: <b>${S.nSab} mole${S.nSab === 1 ? '' : 's'}</b>. Loyal bots play <b>${TIER[S.loyalTier]}</b>; mole bots play <b>${TIER[S.sabTier]}</b>. Seed <span class="mono">${S.seed}</span>.
      ${S.nextStyle ? ` Designer has set next quarter: ${S.nextStyle.tpl} in ${S.nextStyle.font}.` : ''}</div>
      <div class="observer-grid">${sus}</div>
      <div class="hint">Debug strips show allegiance · bot mode (loyal, good = mole playing clean, disguised, bad) · true value · what the table would estimate · tokens spent. "sus" is the end-of-game Whistleblower score the bots use.</div></section>`;
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

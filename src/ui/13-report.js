  // ---------- annual report: the five approved pages, then who was who ----------
  // pinned to the best record on the winning side
  const ROSETTE = `<svg class="rosette" viewBox="0 0 80 104" role="img" aria-label="Employee of the Year"><path d="M24 52 14 100l14-9 9 13 5-44M56 52l10 48-14-9-9 13-5-44" fill="#B8322A"/><path d="M24 52 14 100l7-4.5L33 56M56 52l10 48-7-4.5L47 56" fill="#8E211B"/>
    <path d="${Array.from({ length: 24 }, (_, k) => { const a = k / 24 * Math.PI * 2, r = k % 2 ? 31 : 36; return `${k ? 'L' : 'M'}${(40 + r * Math.sin(a)).toFixed(1)} ${(38 - r * Math.cos(a)).toFixed(1)}`; }).join('')}Z" fill="#E3B34A"/>
    <circle cx="40" cy="38" r="25" fill="#F5E2A6" stroke="#B98A2A" stroke-width="1.5"/><text x="40" y="33" text-anchor="middle" font-size="7.4" font-weight="900" letter-spacing=".6" fill="#5C3E07">EMPLOYEE</text>
    <text x="40" y="42" text-anchor="middle" font-size="6" font-weight="800" letter-spacing=".6" fill="#5C3E07">OF THE</text><text x="40" y="51" text-anchor="middle" font-size="7.4" font-weight="900" letter-spacing=".6" fill="#5C3E07">YEAR</text></svg>`;
  function reportHTML() {
    const claw = new Set(S.whistle && S.whistle.clawed ? S.whistle.clawed.map(c => c.r) : []);
    const pages = S.history.map(h => {
      const e = h.envs.find(x => x.id === h.pick); if (!e) return '';
      const q = S.P[e.author], sab = !e.autopilot && q.sab;
      return `<figure class="rp-pg"><span class="rp-q">Q${h.r}</span><div class="rp-cover">${coverHTML(e, { k: .5, list: h.envs })}
        ${sab ? '<i class="rp-stamp sab">Saboteur</i>' : ''}${claw.has(h.r) ? '<i class="rp-stamp back">Reversed</i>' : ''}</div>
        ${lineHTML(e)}<figcaption>${e.autopilot ? 'Autopilot' : esc(q.name)}</figcaption></figure>`;
    }).join('');
    const named = q => S.whistle && S.whistle.named === q.id ? `<span class="stickers"><i class="stk ${S.whistle.correct ? 'gold' : 'red'}">Named ${fmt(S.whistle.swing)}</i></span>` : '';
    const score = q => S.scores ? `<span class="rp-score ${tone(S.scores[q.id])}" aria-label="Record ${fmt(S.scores[q.id])}">${fmt(S.scores[q.id])}</span>` : '';
    const staff = S.P.map(q => `<div class="nametag rp-tag${S.eoty === q.id ? ' eoty' : ''}"><span class="hello">Hello<small>my name is</small></span>${score(q)}<b>${esc(q.name)}</b><i class="rp-stamp ${q.sab ? 'sab' : 'ok'}">${q.sab ? 'Saboteur' : 'Loyal'}</i>${named(q)}${S.eoty === q.id ? ROSETTE : ''}</div>`).join('');
    return `<section class="report"><div class="rp-pages">${pages}</div>
      <div class="rp-total"><span class="num">${fmt(S.profit)}<small>/ +${S.target}</small></span><i class="rp-stamp big ${S.win ? 'ok' : 'sab'}">${S.win ? 'Target met' : 'Target missed'}</i></div>
      <div class="rp-staff">${staff}</div></section>`;
  }

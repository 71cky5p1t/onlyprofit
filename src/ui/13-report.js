  // ---------- annual report: the five approved pages, then who was who ----------
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
    const staff = S.P.map(q => `<div class="nametag rp-tag"><span class="hello">Hello<small>my name is</small></span><b>${esc(q.name)}</b><i class="rp-stamp ${q.sab ? 'sab' : 'ok'}">${q.sab ? 'Saboteur' : 'Loyal'}</i>${named(q)}</div>`).join('');
    return `<section class="report"><div class="rp-pages">${pages}</div>
      <div class="rp-total"><span class="num">${fmt(S.profit)}<small>/ +${S.target}</small></span><i class="rp-stamp big ${S.win ? 'ok' : 'sab'}">${S.win ? 'Target met' : 'Target missed'}</i></div>
      <div class="rp-staff">${staff}</div></section>`;
  }

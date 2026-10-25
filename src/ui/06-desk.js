  // ---------- desk: your phone. Objects on the felt, same as the TV; almost no prose ----------
  // a bakelite header bar (nameplate, time card, timer tape) and a footer bar that holds the one key that matters
  function deskWrap(title, body, o) {
    o = o || {};
    return `<aside class="desk" aria-label="Your desk"><div class="desk-head"><div class="bar-row"><h3 class="plate">${title}</h3>${o.right || ''}</div>${o.fuse || ''}</div>
      <div class="desk-body">${body}${err ? `<div class="err" role="alert">${esc(err)}</div>` : ''}</div>${o.foot ? `<div class="desk-foot">${o.foot}</div>` : ''}</aside>`;
  }
  const slip = html => `<span class="slip">${html}</span>`;
  const stampMark = k => `<span class="env-stamp ${k}">${STAMP[k]}</span>`;
  const key = (a, label, on) => `<button class="btn primary wide" data-a="${a}" ${on === false ? 'disabled' : ''}>${label}</button>`;
  const hrs = n => `<i class="hrs">${n}h</i>`;
  function inhSource(inh) {
    if (inh.kind === 'legacy') return 'Legacy';
    if (inh.kind === 'cleanup') return `Leftovers <b>${inh.author === ME ? 'yours' : esc(nm(inh.author))}</b>`;
    if (inh.kind === 'autopilot') return 'Autopilot';
    return `From <b>${inh.author === ME ? 'yourself' : esc(nm(inh.author))}</b>${stampMark(inh.stamp)}`;
  }

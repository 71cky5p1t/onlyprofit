  // ---------- signing a vote: pick one, squiggle on the line, it locks a moment after the pen lifts ----------
  const SIGN = { w: 600, h: 150, ink: 140, hold: 1000 };
  const SIGNED = { board: () => ({ type: 'boardVote', vote: ui.sel }), warn: () => ({ type: 'warnVote', target: ui.sel }), whistle: () => ({ type: 'whistleVote', target: ui.sel }), investigate: () => ({ type: 'investigate', target: ui.sel }) };
  // every vote is a form on the blotter: printed heading, the choice filled in by hand, then a ballpoint signature
  const FORM = { board: ['Board Resolution', 'BR'], warn: ['Written Warning', 'WW'], whistle: ['Whistleblower Disclosure', 'WD'], investigate: ['Personnel File Request', 'PF'] };
  const tick = '<svg class="f-tick" viewBox="0 0 28 24" aria-hidden="true"><path d="M3 13c3 2 5 5 7 8 4-8 9-14 16-19"/></svg>';
  const fBox = (id, label) => `<button class="f-opt" role="radio" data-a="sel" data-id="${id}" aria-checked="${ui.sel === id}" aria-pressed="${ui.sel === id}"><i class="f-box">${ui.sel === id ? tick : ''}</i>${label}</button>`;
  const fField = (label, val) => `<div class="f-row"><span class="f-lbl">${label}</span><span class="f-val">${val ? `<b>${val}</b>` : ''}</span></div>`;
  const signHTML = (kind, ready, rows) => `<div class="form${ready ? '' : ' off'}" data-sign="${kind}">
    <div class="f-hd"><span class="f-org"><span class="logo-mark" aria-hidden="true">${brandMark()}</span>People &amp; Culture</span><span class="f-no">Form ${FORM[kind][1]}-${String(S.seed % 100).padStart(2, '0')} · Q${S.r}</span></div>
    <h4 class="f-title">${FORM[kind][0]}</h4>${rows || ''}
    <div class="f-sig"><span class="f-lbl">Signed</span><span class="sign-x" aria-hidden="true">×</span><canvas width="${SIGN.w}" height="${SIGN.h}" aria-label="${ready ? 'Sign here to lock in your vote' : 'Pick one, then sign here'}"></canvas></div>
    <i class="f-rcvd" aria-hidden="true">Received</i></div>`;
  function mountSign() {
    const box = document.querySelector('.desk [data-sign]'); if (!box) return;
    const c = box.querySelector('canvas'), x = c.getContext('2d'), kind = box.dataset.sign;
    x.lineCap = x.lineJoin = 'round'; x.lineWidth = 5; x.strokeStyle = '#25398C';
    let down = null, len = 0, wait = null;
    const at = ev => { const r = c.getBoundingClientRect(); return [(ev.clientX - r.left) * SIGN.w / r.width, (ev.clientY - r.top) * SIGN.h / r.height]; };
    c.onpointerdown = ev => {
      if (box.classList.contains('off')) { box.classList.remove('nope'); void box.offsetWidth; box.classList.add('nope'); return; }
      ev.preventDefault(); c.setPointerCapture(ev.pointerId); clearTimeout(wait); box.classList.remove('ok'); down = at(ev);
    };
    c.onpointermove = ev => { if (!down) return; const p = at(ev); x.beginPath(); x.moveTo(...down); x.lineTo(...p); x.stroke(); len += Math.hypot(p[0] - down[0], p[1] - down[1]); down = p; };
    c.onpointerup = c.onpointercancel = () => {
      if (!down) return; down = null;
      if (len < SIGN.ink) return;
      box.classList.add('ok');
      wait = setTimeout(() => { box.classList.add('done'); cueSigned(); setTimeout(() => dispatch(SIGNED[kind]()), 350); }, SIGN.hold);
    };
  }

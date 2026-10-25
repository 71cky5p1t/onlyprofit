  // ---------- signing a vote: pick one, squiggle on the line, it locks a moment after the pen lifts ----------
  const SIGN = { w: 600, h: 130, ink: 140, hold: 1000 };
  const SIGNED = { board: () => ({ type: 'boardVote', vote: ui.sel }), warn: () => ({ type: 'warnVote', target: ui.sel }), whistle: () => ({ type: 'whistleVote', target: ui.sel }), investigate: () => ({ type: 'investigate', target: ui.sel }) };
  const signHTML = (kind, ready) => `<div class="sign${ready ? '' : ' off'}" data-sign="${kind}"><span class="sign-x" aria-hidden="true">×</span><canvas width="${SIGN.w}" height="${SIGN.h}" aria-label="${ready ? 'Sign here to lock in your vote' : 'Pick one, then sign here'}"></canvas></div>`;
  function mountSign() {
    const box = document.querySelector('.desk [data-sign]'); if (!box) return;
    const c = box.querySelector('canvas'), x = c.getContext('2d'), kind = box.dataset.sign;
    x.lineCap = x.lineJoin = 'round'; x.lineWidth = 7; x.strokeStyle = '#161A2E';
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
      wait = setTimeout(() => { box.classList.add('done'); setTimeout(() => dispatch(SIGNED[kind]()), 350); }, SIGN.hold);
    };
  }

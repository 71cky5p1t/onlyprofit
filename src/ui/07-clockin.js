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

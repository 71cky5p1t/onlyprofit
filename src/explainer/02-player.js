  const TRAIN = { active: false, i: 0, elapsed: 0, pause: false, tick: null, audio: null, duration: 0, game: false, last: 0, demo: {}, touched: false, fired: 0, outro: 0 };
  // sound beats, as a share of the chapter
  const BEATS = {
    goal: [[.1, 'calc-key'], [.2, 'calc-key'], [.3, 'calc-key'], [.42, 'calc-total']],
    saboteurs: [[.05, 'paper-shuffle'], [.3, 'desk-card-flip'], [.74, 'paper-shuffle']],
    inherit: [[.08, 'paper-pull'], [.28, 'desk-card-deal'], [.36, 'desk-card-deal'], [.44, 'desk-card-deal']],
    policy: [[.36, 'desk-ding'], [.46, 'desk-ding'], [.56, 'desk-ding'], [.78, 'desk-card-flip']],
    overtime: [[.34, 'desk-card-drop'], [.36, 'desk-stapler'], [.7, 'desk-stapler']],
    stamp: [[.42, 'desk-stamp'], [.74, 'desk-sticker']],
    cover: [[.13, 'paper-shuffle'], [.3, 'paper-typing'], [.62, 'desk-sign'], [.8, 'paper-pull']],
    ceo: [[.05, 'paper-shuffle'], [.5, 'desk-sticker'], [.8, 'paper-pull']],
    board: [[.12, 'desk-sign'], [.3, 'desk-sign'], [.45, 'paper-pull'], [.64, 'sting-overruled']],
    approved: [[.05, 'desk-stamp'], [.12, 'sting-approved'], [.62, 'paper-type-key']],
    endgame: [[.22, 'sting-saboteur'], [.6, 'desk-sticker'], [.76, 'desk-ding']],
    signoff: [[.4, 'desk-stamp']]
  };
  const clock = s => { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const tapeAt = () => LESSONS.slice(0, TRAIN.i).reduce((n, l) => n + l[3], 0) + TRAIN.elapsed;
  function subtitle(line) {
    const w = line.split(' '), span = .82 / w.length;
    return w.map((x, k) => `<span style="--at:${(k * span).toFixed(3)}">${esc(x)}</span>`).join(' ');
  }
  function tabsHTML() {
    return LESSONS.map((l, k) => `<button class="itab${k < TRAIN.i ? ' past' : ''}" data-a="induction-chapter" data-i="${k}" aria-label="${l[1]}" ${k === TRAIN.i ? 'aria-current="step"' : ''}><span>${String(k + 1).padStart(2, '0')}</span>${k === TRAIN.i ? '<i></i>' : ''}</button>`).join('');
  }
  function inductionHTML() {
    const [id, , line] = LESSONS[TRAIN.i], skip = TRAIN.outro;
    return `<main class="induction${TRAIN.pause ? ' paused' : ''}${skip ? ' outro' : ''}${skip === 2 ? ' stamped' : ''}" style="--dur:${TRAIN.duration}s;--played:${TRAIN.elapsed}s" aria-label="Staff induction">
      <button class="i-osd" data-a="induction-pause" aria-label="${TRAIN.pause ? 'Play' : 'Pause'}"><b>${TRAIN.pause ? 'PAUSE ❚❚' : 'PLAY ▶'}</b><span>${clock(tapeAt())}</span></button>
      <button class="i-skip" data-a="induction-exit">Skip</button>
      <div class="i-stage lesson-${id}">${trainingProp(id)}</div>
      <p class="i-sub" aria-live="polite">${subtitle(line)}</p>
      <nav class="i-tabs" aria-label="Chapters">${tabsHTML()}</nav>
      ${skip ? outroHTML(skip === 2) : ''}</main>`;
  }
  function inductionStart(game = false) {
    stopTimer(); TRAIN.active = true; TRAIN.game = game; TRAIN.outro = 0; TRAIN.pause = !!window.__opFreeze;
    inductionChapter(0); window.scrollTo(0, 0);
  }
  function inductionChapter(i) {
    if (TRAIN.outro) return;
    if (i >= LESSONS.length) return inductionExit();
    clearInterval(TRAIN.tick); if (TRAIN.audio) TRAIN.audio.pause(); TRAIN.audio = null;
    TRAIN.i = Math.max(0, i); TRAIN.demo = {}; TRAIN.touched = false; TRAIN.fired = 0; TRAIN.elapsed = 0; TRAIN.duration = LESSONS[TRAIN.i][3];
    music('music/05-hold-music-clean'); hold(true); sfx('paper-pull', 0, .4);
    const files = window.__opVoiceFiles || [], clip = [LESSONS[TRAIN.i][0], voiceClip(TRAIN.i)].find(n => files.includes(n));
    voDuck(false);
    if (clip) {
      const a = TRAIN.audio = new Audio(AU_BASE + 'induction/' + clip + '.mp3'); a.muted = !AU.on;
      a.onloadedmetadata = () => { if (TRAIN.audio === a && Number.isFinite(a.duration)) setDuration(a.duration + .6); };
      a.onerror = () => { if (TRAIN.audio === a) { a.pause(); TRAIN.audio = null; voDuck(false); } };
      a.onplay = () => voDuck(true); a.onpause = a.onended = () => voDuck(false);
      if (!TRAIN.pause) a.play().catch(() => { if (TRAIN.audio === a) TRAIN.audio = null; });
    }
    TRAIN.last = performance.now(); flow(render);
    TRAIN.tick = setInterval(step, 100);
  }
  // the music bed sits about 7 dB under the narrator, and comes back when the line ends
  function voDuck(on) {
    const c = auCtx(); if (c) AU.mus.gain.setTargetAtTime(on ? .22 : .5, c.currentTime, on ? .08 : .2);
  }
  // between chapters, objects that carry over slide to their new spot; the rest is swept off the desk
  const SWEEP = ['l', 'r', 'd'];
  function flow(paint) {
    const old = document.querySelector('.induction .i-stage');
    if (!old || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return paint();
    const kept = new Set([...old.querySelectorAll('[style*="view-transition-name"]')].map(e => e.style.viewTransitionName));
    document.documentElement.dataset.sweep = SWEEP[TRAIN.i % 3];
    document.startViewTransition(() => {
      paint();
      document.querySelectorAll('.i-stage [style*="view-transition-name"]').forEach(e => { if (kept.has(e.style.viewTransitionName)) e.classList.add('carry'); });
    });
  }
  function setDuration(d) {
    TRAIN.duration = d; const m = document.querySelector('.induction'); if (m) m.style.setProperty('--dur', d + 's');
  }
  function step() {
    const now = performance.now(), delta = (now - TRAIN.last) / 1000; TRAIN.last = now;
    if (TRAIN.audio) TRAIN.audio.muted = !AU.on;
    if (TRAIN.pause || document.hidden) return;
    TRAIN.elapsed = TRAIN.audio && !TRAIN.audio.paused && !TRAIN.audio.ended ? TRAIN.audio.currentTime : TRAIN.elapsed + delta;
    const f = TRAIN.elapsed / TRAIN.duration, id = LESSONS[TRAIN.i][0], beats = BEATS[id] || [];
    while (TRAIN.fired < beats.length && beats[TRAIN.fired][0] <= f) sfx(beats[TRAIN.fired++][1], 0, .7);
    const m = document.querySelector('.induction'); if (!m) return;
    const bar = m.querySelector('.itab[aria-current] i'); if (bar) bar.style.width = Math.min(100, f * 100) + '%';
    const osd = m.querySelector('.i-osd span'); if (osd) osd.textContent = clock(tapeAt());
    const n = m.querySelector('[data-count]'); if (n) n.innerHTML = lcd(Math.round(+n.dataset.count * Math.min(1, f / .42)));
    if (f >= 1) inductionChapter(TRAIN.i + 1);
  }
  // READ & UNDERSTOOD, then the Time & Attendance clock drops in and the induction lets go
  function inductionExit() {
    if (TRAIN.outro) return inductionDone();
    clearInterval(TRAIN.tick); if (TRAIN.audio) TRAIN.audio.pause(); TRAIN.audio = null;
    const signed = LESSONS[TRAIN.i][0] === 'signoff';
    TRAIN.outro = signed ? 2 : 1; TRAIN.pause = false; render();
    if (!signed) sfx('desk-stamp');
    sfx('clock-yank', .55, .6); sfx('clock-flip', 1.5); sfx('clock-bell', 1.75, .8);
    if (window.__opFreeze) return;
    TRAIN.tick = setTimeout(inductionDone, 2900);
  }
  function inductionDone() {
    clearTimeout(TRAIN.tick); clearInterval(TRAIN.tick);
    TRAIN.active = false; TRAIN.outro = 0; ui.inducted = true; hold(false); voDuck(false);
    try { localStorage.setItem('op-induction-seen', '1'); } catch (e) {}
    render(); window.scrollTo(0, 0);
  }
  function inductionPause() {
    if (TRAIN.outro) return;
    TRAIN.pause = !TRAIN.pause;
    if (TRAIN.audio) { if (TRAIN.pause) TRAIN.audio.pause(); else TRAIN.audio.play().catch(() => {}); }
    const m = document.querySelector('.induction'); if (!m) return render();
    m.classList.toggle('paused', TRAIN.pause);
    const b = m.querySelector('.i-osd'); b.setAttribute('aria-label', TRAIN.pause ? 'Play' : 'Pause'); b.querySelector('b').textContent = TRAIN.pause ? 'PAUSE ❚❚' : 'PLAY ▶';
  }
  $app.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a;
    if (a === 'lesson-swap' && TRAIN.active) {
      const su = b.dataset.su, idx = +b.dataset.i;
      if (!TRAIN.touched) { TRAIN.touched = true; TRAIN.demo = {}; }
      if (TRAIN.demo[su] === idx) delete TRAIN.demo[su];
      else if (TRAIN.demo[su] != null || OP.SWAP_COST[Object.keys(TRAIN.demo).length + 1] <= 3) TRAIN.demo[su] = idx;
      sfx('desk-card-drop', 0, .5); render();
    }
    if (a === 'induction') inductionStart(false);
    if (a === 'induction-chapter') inductionChapter(+b.dataset.i);
    if (a === 'induction-exit') inductionExit();
    if (a === 'induction-pause') inductionPause();
  });
  addEventListener('keydown', e => {
    if (!TRAIN.active || e.target.matches('input,textarea,select') || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-a="lesson-swap"]')) { e.preventDefault(); e.target.click(); return; }
    if (e.key === ' ' && !e.target.matches('button')) { e.preventDefault(); inductionPause(); }
    if (e.key === 'Escape') { e.preventDefault(); inductionExit(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); inductionChapter(TRAIN.i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); inductionChapter(TRAIN.i - 1); }
  });
  document.addEventListener('visibilitychange', () => { if (TRAIN.active && document.hidden && !TRAIN.pause) inductionPause(); });

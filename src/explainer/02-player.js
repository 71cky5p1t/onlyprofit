  const TRAIN = { active: false, i: 0, elapsed: 0, pause: false, tick: null, audio: null, duration: 0, game: false, last: 0, demo: {} };
  function inductionHTML() {
    const [id, title, line] = LESSONS[TRAIN.i];
    return `<main class="induction" aria-label="Staff induction"><header class="lesson-top"><span>STAFF INDUCTION <b>${String(TRAIN.i + 1).padStart(2,'0')} / ${LESSONS.length}</b></span><button class="lesson-skip" data-a="induction-exit">${TRAIN.game ? 'Skip induction' : 'Back to menu'} ↗</button></header><div class="lesson-heading"><p>ONLY PROFIT · PEOPLE &amp; CULTURE</p><h1 tabindex="-1">${title}</h1></div><div class="lesson-stage lesson-${id}">${trainingProp(id)}</div><p class="lesson-caption" aria-live="polite">${line}</p><footer class="lesson-controls"><button data-a="induction-back" ${TRAIN.i ? '' : 'disabled'} aria-label="Previous chapter">←</button><button data-a="induction-pause">${TRAIN.pause ? 'Play' : 'Pause'}</button><nav aria-label="Induction chapters">${LESSONS.map((l,i) => `<button data-a="induction-chapter" data-i="${i}" aria-label="${l[1]}" aria-current="${i === TRAIN.i ? 'step' : 'false'}"></button>`).join('')}</nav><button data-a="induction-next">${TRAIN.i === LESSONS.length - 1 ? (TRAIN.game ? 'Read your role' : 'Finished') : 'Next →'}</button></footer><div class="lesson-progress"><i style="width:${TRAIN.elapsed / TRAIN.duration * 100}%"></i></div></main>`;
  }
  function inductionStart(game = false) {
    stopTimer(); TRAIN.active = true; TRAIN.game = game; TRAIN.pause = !!window.__opFreeze;
    inductionChapter(0); window.scrollTo(0, 0);
  }
  function inductionChapter(i) {
    if (i >= LESSONS.length) return inductionExit();
    clearInterval(TRAIN.tick); if (TRAIN.audio) TRAIN.audio.pause(); TRAIN.audio = null;
    TRAIN.i = Math.max(0, i); TRAIN.demo = {}; TRAIN.elapsed = 0; TRAIN.duration = LESSONS[TRAIN.i][3];
    music('music/05-hold-music-clean'); hold(true); sfx('paper-pull', 0, .4);
    const id = 'vo-' + String(TRAIN.i + 1).padStart(2, '0') + '-' + LESSONS[TRAIN.i][0];
    if ((window.__opVoiceFiles || []).includes(id)) {
      const a = TRAIN.audio = new Audio(AU_BASE + 'vo/' + id + '.mp3'); a.muted = !AU.on;
      a.onloadedmetadata = () => { if (TRAIN.audio === a && Number.isFinite(a.duration)) TRAIN.duration = a.duration + .4; };
      a.onerror = () => { if (TRAIN.audio === a) { a.pause(); TRAIN.audio = null; TRAIN.duration = Math.max(TRAIN.elapsed + 1, LESSONS[TRAIN.i][3]); } };
      if (!TRAIN.pause) a.play().catch(() => { if (TRAIN.audio === a) TRAIN.audio = null; });
      duck(TRAIN.duration);
    }
    TRAIN.last = performance.now(); render();
    const heading = document.querySelector('.lesson-heading h1'); if (heading) heading.focus({ preventScroll: true });
    TRAIN.tick = setInterval(() => {
      const now = performance.now(), delta = (now - TRAIN.last) / 1000; TRAIN.last = now;
      if (TRAIN.audio) TRAIN.audio.muted = !AU.on;
      if (TRAIN.pause || document.hidden) return;
      TRAIN.elapsed = TRAIN.audio && !TRAIN.audio.paused ? TRAIN.audio.currentTime : TRAIN.elapsed + delta;
      if (TRAIN.audio && TRAIN.audio.ended) TRAIN.elapsed += delta;
      const bar = document.querySelector('.lesson-progress i'); if (bar) bar.style.width = Math.min(100, TRAIN.elapsed / TRAIN.duration * 100) + '%';
      if (TRAIN.elapsed >= TRAIN.duration) inductionChapter(TRAIN.i + 1);
    }, 100);
  }
  function inductionExit() {
    clearInterval(TRAIN.tick); if (TRAIN.audio) TRAIN.audio.pause(); TRAIN.audio = null;
    TRAIN.active = false; ui.inducted = true; hold(false); sfx('desk-stamp');
    try { localStorage.setItem('op-induction-seen', '1'); } catch (e) {}
    render(); window.scrollTo(0, 0);
  }
  function inductionPause() {
    TRAIN.pause = !TRAIN.pause;
    if (TRAIN.audio) { if (TRAIN.pause) TRAIN.audio.pause(); else TRAIN.audio.play().catch(() => {}); }
    render();
  }
  $app.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a;
    if (a === 'lesson-swap' && TRAIN.active) {
      const su = b.dataset.su, idx = +b.dataset.i;
      if (TRAIN.demo[su] === idx) delete TRAIN.demo[su];
      else if (TRAIN.demo[su] != null || Object.keys(TRAIN.demo).length < 2) TRAIN.demo[su] = idx;
      sfx('desk-card-drop', 0, .5); render();
    }
    if (a === 'induction') inductionStart(false);
    if (a === 'induction-next') inductionChapter(TRAIN.i + 1);
    if (a === 'induction-back') inductionChapter(TRAIN.i - 1);
    if (a === 'induction-chapter') inductionChapter(+b.dataset.i);
    if (a === 'induction-exit') inductionExit();
    if (a === 'induction-pause') inductionPause();
  });
  addEventListener('keydown', e => {
    if (!TRAIN.active || e.target.matches('input,textarea,select') || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-a="lesson-swap"]')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Escape') { e.preventDefault(); inductionExit(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); inductionChapter(TRAIN.i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); inductionChapter(TRAIN.i - 1); }
  });
  document.addEventListener('visibilitychange', () => { if (TRAIN.active && document.hidden && !TRAIN.pause) inductionPause(); });

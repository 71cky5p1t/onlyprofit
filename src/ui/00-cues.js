  // ---------- cues: which sound goes with which moment. Diffs state on every render ----------
  const CUE = { prev: null, idle: null, bound: false };
  const TAP = new Set(['set', 'debug', 'quit', 'begin', 'advance', 'sel', 'tpl', 'font', 'align', 'art', 'claim', 'back', 'start', 'again', 'name-skip', 'name-back', 'name-redo', 'board', 'warn', 'whistle']);

  function cueSnap() {
    if (!S) return { lobby: !naming };
    const d = draft;
    return {
      phase: S.phase, r: S.r, key: `${S.r}|${S.phase}`, profit: S.profit,
      result: S.result ? `${S.r}:${S.result.id}` : null, actual: S.result ? S.result.actual : 0,
      over: S.board && S.board.overruled ? `${S.r}:${S.board.nominee}` : null,
      inv: S.invq ? `${S.invq.r}:${S.invq.t}` : null,
      pips: S.P.filter(p => p.pip).length, warns: S.P.reduce((a, p) => a + p.warnings, 0),
      named: S.whistle ? S.whistle.named : undefined, correct: S.whistle && S.whistle.correct,
      d: d ? { sw: d.swaps.length, rv: d.reveals.length, sh: d.discards.length, st: d.stamp, pg: d.page || 1 } : null,
    };
  }

  function cueMusic(n) {
    if (!S) { music('music/05-hold-music-clean'); if (naming) hold(false); else if (!CUE.idle) hold(true); return; }
    hold(false);
    music(n.phase === 'end' ? null : n.phase === 'whistle' || S.r >= 5 ? 'music/04-q5-overtime' : 'music/01-water-cooler');
  }

  function cueSync() {
    if (!CUE.bound) cueBind();
    const n = cueSnap(), p = CUE.prev; CUE.prev = n;
    cueMusic(n);
    if (!p) return;
    if (!('phase' in p)) { if ('phase' in n) sfx('clock-bell', .1, .7); return; }
    if (!('phase' in n)) return;
    let wipe = p.key !== n.key, t = 0;
    // verdicts
    if (n.over && n.over !== p.over) { sfx('sting-overruled'); duck(2.6); t = 2.4; wipe = false; }
    if (n.result && n.result !== p.result) {
      sfx(n.actual >= 0 ? 'sting-approved' : 'sting-rejected', t); duck(n.actual >= 0 ? 2.2 : 4.5, t); wipe = false;
    }
    if (n.profit !== p.profit) {
      const k = Math.abs(n.profit - p.profit);
      for (let i = 0; i < k; i++) sfx('calc-key', .7 + i * .16, .5);
      sfx('calc-total', .7 + k * .16, .6);
    }
    if (n.inv && n.inv !== p.inv) sfx('cabinet-drawer', .3);
    if (n.pips > p.pips) { sfx('desk-stamp'); sfx('paper-type-bell', .4, .7); }
    if (n.warns > p.warns) sfx('desk-stamp');
    // the end of Q5 and the end of the year
    if (n.phase === 'whistle' && p.phase !== 'whistle') { sfx('clock-quitting-time', 0, .8); duck(2.2); wipe = false; }
    let end = 0;
    if (n.named !== undefined && p.named === undefined && n.named != null) {
      sfx(n.correct ? 'sting-saboteur' : 'sting-rejected'); duck(5.5); end = 5.6; wipe = false;
    }
    if (n.phase === 'end' && p.phase !== 'end') { sfx(S.win ? 'sting-quarter-won' : 'sting-company-lost', end); wipe = false; }
    if (wipe) { sfx('music/06-stripe-wipe', 0, .8); duck(2.4); }
    // the desk
    const a = p.d, b = n.d;
    if (a && b && b.sh > a.sh) { sfx('paper-shuffle'); sfx('desk-card-deal', .35, .8); sfx('desk-card-flip', .7, .7); }
    if (b && !a) {
      [0, .12, .24].forEach((s, i) => { sfx('desk-card-deal', .45 + s, .8); sfx('desk-card-flip', .9 + i * .08, .7); });
    }
    if (a && b) {
      if (b.sw > a.sw) { sfx('desk-stapler'); sfx('desk-card-drop', .12, .7); }
      if (b.sw < a.sw || b.rv > a.rv) sfx('desk-card-flip');
      if (b.st && b.st !== a.st) sfx('desk-stamp');
      if (b.pg !== a.pg) sfx('paper-pull', 0, .8);
    }
    if (a && !b && p.phase === 'work') sfx('paper-shuffle', 0, .8);
  }

  function cueSigned() { sfx('desk-ding', 0, .7); }

  function cueBind() {
    CUE.bound = true; auMount();
    document.addEventListener('click', ev => {
      const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
      const a = b.dataset.a;
      if (a === 'approve') sfx('paper-pull');
      else if (a === 'reroll') sfx('paper-type-key');
      else if (a === 'name-go') sfx('paper-type-bell', 0, .7);
      else if (TAP.has(a)) sfx('desk-tap', 0, .7);
      // the lobby comes off hold while you poke at the menu, and goes back on when you stop
      if (!S && !naming) { hold(false); clearTimeout(CUE.idle); CUE.idle = setTimeout(() => { CUE.idle = null; if (!S && !naming) hold(true); }, 6000); }
    }, true);
    document.addEventListener('keydown', ev => {
      if (!ev.target.matches || !ev.target.matches('input, textarea')) return;
      if (ev.key === 'Enter') sfx('paper-type-bell', 0, .6);
      else if (ev.key.length === 1 || ev.key === 'Backspace') sfx('paper-type-key', 0, .5);
    }, true);
  }

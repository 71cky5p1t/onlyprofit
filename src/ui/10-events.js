  // ---------- events ----------
  $app.addEventListener('click', ev => {
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a, d = b.dataset;
    switch (a) {
      case 'debug': ui.debug = !ui.debug; try { localStorage.setItem('op-debug', ui.debug ? '1' : '0'); } catch (e) {} render(); break;
      case 'quit': S = null; draft = null; ui.lastKey = null; render(); break;
      case 'set': setup[d.k] = d.k === 'players' ? +d.v : (d.v === 'true' ? true : d.v === 'false' ? false : d.v); render(); break;
      case 'start':
        if (!naming && !setup.spectate && !ui.badge && !window.__opSkipName) { naming = { phase: 'type', name: '' }; render(); break; }
        startGame('start'); break;
      case 'again': startGame('again'); break;
      case 'name-go': { const l = nameLetters(naming.name); if (!l) break; Object.assign(naming, { phase: 'trace', letters: l, i: 0, strokes: 0, inks: [] }); render(); break; }
      case 'name-skip': naming = null; ui.badge = null; startGame('start'); break;
      case 'name-back': clearTimeout(naming.wait); naming.phase = 'type'; render(); break;
      case 'name-redo': clearTimeout(naming.wait); naming.strokes = 0; render(); break;
      case 'begin': dispatch({ type: 'begin' }); break;
      case 'advance': dispatch({ type: 'advance' }); break;
      case 'swap': { const su = +d.su; draft.swaps = draft.swaps.includes(su) ? draft.swaps.filter(x => x !== su) : draft.swaps.concat(su); render(); break; }
      case 'reveal': { const su = +d.su; draft.reveals = draft.reveals.includes(su) ? draft.reveals.filter(x => x !== su) : draft.reveals.concat(su); render(); break; }
      case 'redeal': draft.redeal = true; ui.deal = 'redeal'; toast('Inherited cards shredded. Three fresh ones dealt.'); render(); break;
      case 'stamp': draft.stamp = d.v; render(); break;
      case 'finalise': finalise(); break;
      case 'back': draft.page = draft.page === 3 && !S.reqStyle ? 2 : 1; render(); break;
      case 'reroll': { const i = +d.i, l = (S.subj || OP.SUBJ)[i].length; let k; do { k = Math.floor(Math.random() * l); } while (k === draft.words[i] && l > 1); draft.words[i] = k; render(); break; }
      case 'tpl': Object.assign(draft.style, { tpl: d.v, font: TPL[d.v].font, align: TPL[d.v].align }); if (!draft.artSet) draft.style.art = TPL[d.v].art; draft.page = 3; ui.arrive = true; render(); break;
      case 'font': draft.style.font = d.v; render(); break;
      case 'align': draft.style.align = d.v; render(); break;
      case 'art': { const w = b.closest('[data-wheel]'); if (w) w.scrollTo({ left: ART.indexOf(d.v) * WHEEL, behavior: still() ? 'auto' : 'smooth' }); break; }
      case 'claim': draft.claim.kind = d.k; render(); break;
      case 'seal': seal(); break;
      case 'sel': ui.sel = d.id; render(); break;
      case 'audit': dispatch({ type: 'auditVote', target: ui.sel }); break;
      case 'approve': {
        const id = ui.sel, el = document.querySelector(`.desk .mini[data-id="${id}"]`);
        if (!el || still()) { dispatch({ type: 'approve', id }); break; }
        el.closest('.minis').classList.add('picking'); el.classList.add('chosen');
        el.insertAdjacentHTML('beforeend', [0, 1, 2].map(k => `<i class="pull" style="--k:${k}"></i>`).join(''));
        document.querySelectorAll('.desk [data-a]').forEach(b => { b.disabled = true; });
        setTimeout(() => dispatch({ type: 'approve', id }), 1150);
        break;
      }
      case 'board': dispatch({ type: 'boardVote', vote: ui.sel }); break;
      case 'warn': dispatch({ type: 'warnVote', target: ui.sel }); break;
      case 'whistle': dispatch({ type: 'whistleVote', target: ui.sel }); break;
    }
  });

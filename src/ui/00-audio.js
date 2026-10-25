  // ---------- audio: music bus with a phone-line filter, one-shot SFX (files in dist/audio) ----------
  const AU = { ctx: null, buf: {}, on: true, want: null, cur: null };
  try { AU.on = localStorage.getItem('op-sound') !== '0'; } catch (e) {}
  const AU_BASE = window.__opAudio || 'audio/';
  const MUSIC = { 'music/01-water-cooler': [152, 16], 'music/04-q5-overtime': [172, 16], 'music/05-hold-music-clean': [120, 16] };

  function auCtx() {
    if (AU.ctx) return AU.ctx;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    const c = AU.ctx = new C();
    AU.master = c.createGain(); AU.master.gain.value = AU.on ? 1 : 0; AU.master.connect(c.destination);
    AU.mus = c.createGain(); AU.mus.gain.value = .5;
    AU.hp = c.createBiquadFilter(); AU.hp.type = 'highpass'; AU.hp.frequency.value = 20;
    AU.lp = c.createBiquadFilter(); AU.lp.type = 'lowpass'; AU.lp.frequency.value = 20000;
    AU.mus.connect(AU.hp).connect(AU.lp).connect(AU.master);
    AU.fx = c.createGain(); AU.fx.gain.value = .8; AU.fx.connect(AU.master);
    return c;
  }
  function auLoad(name) {
    const c = auCtx(); if (!c) return Promise.reject(new Error('no audio'));
    return AU.buf[name] || (AU.buf[name] = fetch(AU_BASE + name + '.mp3')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(b => new Promise((ok, no) => c.decodeAudioData(b, ok, no))));
  }
  function sfx(name, delay = 0, gain = 1) {
    const c = auCtx(); if (!c || !AU.on || c.state !== 'running') return;
    auLoad(name.includes('/') ? name : 'sfx/' + name).then(b => {
      const s = c.createBufferSource(), g = c.createGain();
      g.gain.value = gain; s.buffer = b; s.connect(g).connect(AU.fx); s.start(c.currentTime + delay);
    }).catch(() => {});
  }
  // stings sit on top of the music
  function duck(sec, delay = 0) {
    const c = auCtx(); if (!c) return; const t = c.currentTime + delay, g = AU.mus.gain;
    g.cancelScheduledValues(t); g.setTargetAtTime(.12, t, .08); g.setTargetAtTime(.5, t + sec, .4);
  }
  // a looping track; crossfades from whatever is playing. null fades out
  function music(name) {
    if (AU.want === name) return; AU.want = name;
    const c = auCtx(); if (!c) return;
    const old = AU.cur; AU.cur = null;
    if (old) { old.g.gain.setTargetAtTime(0, c.currentTime, .4); old.s.stop(c.currentTime + 2.5); }
    if (!name) return;
    auLoad(name).then(b => {
      if (AU.want !== name) return;
      const [bpm, bars] = MUSIC[name], len = Math.round(bars * 240 / bpm * b.sampleRate);
      // some decoders keep the MP3 encoder delay; skip it so the loop is seamless
      const off = Math.abs(b.length - len) > 64 ? 1105 / 44100 : 0;
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; s.loop = true; s.loopStart = off; s.loopEnd = off + len / b.sampleRate;
      g.gain.value = 0; g.gain.setTargetAtTime(1, c.currentTime, .5);
      s.connect(g).connect(AU.mus); s.start(0, off); AU.cur = { s, g };
    }).catch(() => {});
  }
  // on hold: the music squeezed down a phone line
  function hold(on) {
    const c = auCtx(); if (!c) return; const t = c.currentTime;
    AU.hp.frequency.setTargetAtTime(on ? 380 : 20, t, .12);
    AU.lp.frequency.setTargetAtTime(on ? 3200 : 20000, t, .12);
  }
  function soundOn(on) {
    AU.on = on; try { localStorage.setItem('op-sound', on ? '1' : '0'); } catch (e) {}
    const c = auCtx(); if (c) AU.master.gain.setTargetAtTime(on ? 1 : 0, c.currentTime, .05);
    const b = document.querySelector('.au-btn'); if (b) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Mute sound' : 'Turn sound on'); }
  }
  function auMount() {
    if (document.querySelector('.au-btn')) return;
    const b = document.createElement('button'); b.className = 'au-btn';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="w" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/><path class="x" d="M16 9l6 6M22 9l-6 6"/></svg>';
    b.onclick = () => soundOn(!AU.on);
    document.body.appendChild(b); soundOn(AU.on);
    // browsers start audio only after a gesture
    const wake = () => { const c = auCtx(); if (c && c.state !== 'running') c.resume(); };
    addEventListener('pointerdown', wake, true); addEventListener('keydown', wake, true);
  }

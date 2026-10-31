// Browser glue: mount a scene, change the hour with a crossfade, keep idle loops in phase.
(() => {
  if (typeof document === 'undefined') return;
  const t0 = performance.now();
  const clock = () => (performance.now() - t0) / 1000;
  OPS.mount = (el, id, opts = {}) => {
    el.classList.add('ops-stage');
    el._ops = Object.assign({ id, time: 'midday', seed: undefined }, el._ops, opts, { id });
    const s = el._ops;
    const holder = document.createElement('div');
    holder.className = 'ops-layer';
    holder.innerHTML = OPS.render(s.id, { time: s.time, seed: s.seed, clock: clock() });
    const old = [...el.querySelectorAll('.ops-layer')];
    el.appendChild(holder);
    if (old.length && !opts.cut) {
      holder.classList.add('ops-in');
      requestAnimationFrame(() => requestAnimationFrame(() => holder.classList.remove('ops-in')));
      setTimeout(() => old.forEach(o => o.remove()), 1300);
    } else old.forEach(o => o.remove());
    return el;
  };
  OPS.setTime = (el, time) => OPS.mount(el, el._ops.id, { time });
})();

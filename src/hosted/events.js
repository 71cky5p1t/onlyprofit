import { cost } from './pieces.js';
export function bindActions(ctx) {
  const { app, ui, edit } = ctx;
  app.addEventListener('submit', e => {
    if (e.target.id !== 'join-form') return; e.preventDefault();
    const button = e.target.querySelector('button[type=submit]'); button.disabled = true;
    ctx.join(e.target).catch(error => { ctx.notice(error.message); button.disabled = false; });
  });
  app.addEventListener('click', async e => {
    const b = e.target.closest('[data-action]'); if (!b || b.disabled) return;
    const a = b.dataset.action;
    try {
      if (a === 'theme') return ctx.theme(b.dataset.theme);
      if (a === 'create') { b.disabled = true; await ctx.create(); return; }
      if (a === 'sound') return ctx.sound();
      if (a === 'practice') { const su = +b.dataset.suit; if (ui.demo.includes(su)) ui.demo = ui.demo.filter(x => x !== su); else if (ui.demo.length < 2) ui.demo.push(su); else ctx.notice('Three hours covers two replacements.'); return ctx.render(); }
      if (a === 'suit') { ui.suit = +b.dataset.suit; return ctx.render(); }
      if (a === 'step') { ui.step = +b.dataset.step; ctx.render(); window.scrollTo(0, 0); return; }
      if (a === 'spare') return edit(d => { d.picks[ui.suit] = +b.dataset.index; if (!d.swaps.includes(ui.suit)) d.swaps.push(ui.suit); });
      if (a === 'keep') return edit(d => { d.swaps = d.swaps.filter(su => su !== ui.suit); });
      if (a === 'reveal') return edit(d => { d.reveals = d.reveals.includes(ui.suit) ? d.reveals.filter(su => su !== ui.suit) : d.reveals.concat(ui.suit); });
      if (a === 'redeal') return edit(d => { d.redeal = !d.redeal; });
      if (a === 'art') return edit(d => { d.style.art = b.dataset.art; });
      if (a === 'stamp') return edit(d => { d.stamp = b.dataset.stamp; });
      if (a === 'close' && !confirm('Close this room for everyone?')) return;
      if (a === 'submitWork') {
        ui.submitting = true; ctx.saveDraft(); ctx.render();
        try { await ctx.command(a, { value: ui.draft }); } finally { ui.submitting = false; ctx.render(); } return;
      }
      b.disabled = true;
      await ctx.command(a, { id: b.dataset.id, target: b.dataset.target, vote: b.dataset.vote });
    } catch (error) { ctx.notice(error.message); b.disabled = false; }
  });
  app.addEventListener('input', e => {
    if (e.target.id === 'subject') edit(d => { d.subject = e.target.value; }, false);
    if (e.target.id === 'claim-value') edit(d => { d.claim.val = Number(e.target.value); }, false);
  });
  app.addEventListener('change', e => {
    const v = e.target.value;
    if (e.target.id === 'template') edit(d => { d.style.tpl = v; });
    if (e.target.id === 'next-template') edit(d => { d.nextStyle = v ? { tpl: v, font: 'grotesk' } : undefined; });
    if (e.target.id === 'claim') edit(d => { d.claim = { kind: v, val: 0, stamp: 'Risky' }; });
    if (e.target.id === 'claim-stamp') edit(d => { d.claim.stamp = v; });
  });
}

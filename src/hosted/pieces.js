export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const suits = ['Action', 'Target', 'Modifier'];
export const stamps = { Rec: 'Recommended', Risky: 'Risky', Not: 'Not recommended' };
export const templates = ['memo', 'fax', 'wordart', 'clipart', 'report', 'dossier', 'overhead', 'certificate'];
export const glyph = c => c.v === 'V' ? '?' : c.v > 0 ? '+'.repeat(c.v) : c.v < 0 ? '−'.repeat(-c.v) : '0';
export const effects = { null: 'Cancels Action + Target', x2: 'Doubles Action + Target', shield: 'Action + Target cannot lose', flip: 'Reverses Action + Target' };
export function card(c, extra = '') {
  return c ? `<div class="card suit-${c.s} ${extra}"><b>${esc(c.w)}</b><strong>${glyph(c)}</strong>${c.fx ? `<small>${effects[c.fx]}</small>` : ''}</div>` : '<div class="card hidden-card"><span>ONLY<br>PROFIT.</span><small>Confidential</small></div>';
}
export function cover(e, names = []) {
  return `<article class="cover tpl-${esc(e.style?.tpl || 'memo')}"><small>ONLY PROFIT INC. · ${esc(e.id || 'DRAFT')}</small><h3>${esc(e.subject || 'Quarterly improvement proposal')}</h3><div class="cover-art">${esc(e.style?.art || '↗')}</div><b class="stamp">${stamps[e.stamp] || 'Awaiting stamp'}</b>${e.author !== null && e.author !== undefined ? `<p class="byline">By ${esc(names[e.author]?.name || 'Employee')}</p>` : ''}</article>`;
}
export function cardsValue(cards) {
  const [a, b, m] = cards.map(c => c.v === 'V' ? 0 : c.v), fx = cards[2].fx;
  return fx === 'null' ? m : fx === 'x2' ? m + 2 * (a + b) : fx === 'shield' ? m + Math.max(a, 0) + Math.max(b, 0) : fx === 'flip' ? m - a - b : a + b + m;
}
export const cost = d => (d.redeal ? 2 : 0) + [0, 1, 3, 6][d.swaps.length] + d.reveals.length;
export function policy(self, d) { return (d.redeal ? self.work.redeal : self.inherited.cards).map((c, su) => d.swaps.includes(su) ? self.work.spares[d.picks[su]] : c); }
export function freshDraft() { return { swaps: [], picks: [0, 1, 2], reveals: [], redeal: false, stamp: 'Risky', subject: '', style: { tpl: 'memo', font: 'grotesk', art: '↗' } }; }
export const button = (action, label, more = '') => `<button data-action="${action}" ${more}>${label}</button>`;
export const themePicker = current => `<fieldset class="theme-picker"><legend>Your desk</legend>${['oak', 'graphite', 'mint'].map(t => button('theme', `<span class="swatch ${t}"></span>${t === 'oak' ? 'Warm oak' : t === 'mint' ? 'Mint laminate' : 'Graphite'}`, `data-theme="${t}" aria-pressed="${current === t}"`)).join('')}</fieldset>`;

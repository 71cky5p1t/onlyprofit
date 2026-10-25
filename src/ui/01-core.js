  const $app = document.getElementById('app');
  const ME = 0;
  let S = null, draft = null, err = '', toastT = null;
  let setup = { players: 4, loyalTier: 'smart', sabTier: 'smart', easy: false, spectate: false, seed: '', brand: window.__opBrand || 'op', cards: window.__opCards || 'paper' };
  const ui = { debug: false, sel: null, deal: false, land: null, printed: 0, stamped: '', lastKey: null, shown: null, tick: null };
  try { ui.debug = localStorage.getItem('op-debug') === '1'; } catch (e) {}

  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = OP.fmt, evs = OP.evs;
  const tone = v => (v === 'V' ? 'gold' : v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero');
  const GLYPH = { 2: '++', 1: '+', 0: '0', '-1': '−', '-2': '−−', V: '?' };
  const glyph = v => `<b class="glyph ${v === 'V' ? 'v-v' : tone(v)}">${GLYPH[v]}</b>`;
  const FXSYM = { null: '×0', x2: '×2', shield: '≥0', flip: '×−1' };
  const FXSAY = { null: 'Cancels the rest', x2: 'Doubles the rest', shield: "Rest can't lose", flip: 'Flips the rest' };
  const lcd = n => { const t = (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n) + '.0'; return `<span class="ghost">${'8'.repeat(Math.max(0, 5 - t.length))}</span>${t}`; };
  const nm = i => (i === 'table' ? 'The table' : S.P[i].name);
  const mine = () => S && !S.spectate;
  const me = () => S.P[ME];
  // the company brand lives on objects only: logo, wax seals, card backs, letterhead. Never on card faces, never red or green
  // (Only Profit itself is the placeholder house brand)

import { card, button, esc } from './pieces.js';
export const trainingCards = [
  { s: 0, w: 'Automate', v: 1 }, { s: 1, w: 'the Break Room', v: -1 }, { s: 2, w: 'Going Forward', v: 1 }
];
export function chapterAt(lessons, elapsed) {
  let end = 0;
  for (let i = 0; i < lessons.length; i++) { end += lessons[i][3] * 1000; if (elapsed < end) return i; }
  return Math.max(0, lessons.length - 1);
}
export function inductionHTML(s, lessons, index, tv, demo) {
  const [id, title, line] = lessons[index] || ['welcome', 'Welcome aboard.', 'Your induction is loading.'];
  let prop = `<div class="training-policy">${trainingCards.map(c => card(c)).join('')}</div>`;
  if (id === 'welcome' || id === 'signoff') prop = '<div class="binder">STAFF<br>INDUCTION<small>Enjoyment is mandatory.</small></div>';
  if (id === 'goal' || id === 'endgame') prop = `<div class="training-target">5 QUARTERS<strong>+${s.game.target}</strong><small>One company target.</small></div>`;
  if (id === 'saboteurs') prop = '<div class="binder confidential">LOYAL?<br>SABOTEUR?<small>Check your own phone. Trust nobody else’s.</small></div>';
  if (id === 'stamp') prop = '<div class="training-stamps"><b>RECOMMENDED</b><b>RISKY</b><b>NOT RECOMMENDED</b></div>';
  if (!tv && ['overtime', 'reveal'].includes(id)) prop = `<p>Try it here. This is practice.</p><div class="training-policy">${trainingCards.map((c, i) => button('practice', card({ ...c, v: demo.includes(i) ? 2 : c.v }), `data-suit="${i}" aria-pressed="${demo.includes(i)}"`)).join('')}</div><p>${3 - [0,1,3][demo.length]} hours left. Tap a card to replace it, or undo.</p>`;
  if (!tv && !['overtime', 'reveal'].includes(id)) prop = '<div class="paper"><h2>Look at the TV.</h2><p>Your practice exercise appears here when we reach overtime.</p></div>';
  return `<section class="induction"><small>STAFF INDUCTION · ${index + 1} / ${lessons.length || 13}</small><h1>${esc(title)}</h1>${prop}<p class="caption">${esc(line)}</p>${s.isHost ? button('skipInduction','Skip induction') : ''}</section>`;
}

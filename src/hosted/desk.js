import { esc, card, cover, policy, cost, suits, stamps, templates, cardsValue, button } from './pieces.js';
export function workHTML(s, ui) {
  const self = s.game.self, d = ui.draft;
  if (!self.work) return '<section class="paper wait"><h2>Filed. Impeccable work.</h2><p>Look at the TV while your colleagues finish.</p></section>';
  const cards = policy(self, d), left = 3 - cost(d), honest = cards.some(c => c.v === 'V') || cardsValue(cards) === 0 ? 'Risky' : cardsValue(cards) > 0 ? 'Rec' : 'Not';
  const current = ui.suit;
  let content = '';
  if (ui.step === 0) {
    content = `<p class="hint">Choose a part of your policy to edit.</p><div class="policy">${cards.map((c, su) => button('suit', card(c), `data-suit="${su}" aria-label="Edit ${suits[su]}: ${esc(c.w)}" aria-pressed="${su === current}"`)).join('')}</div>
      <section class="choices"><h2>${suits[current]} alternatives</h2><div class="spares">${self.work.spares.map((c, k) => c.s !== current ? '' : button('spare', card(c), `data-index="${k}" aria-pressed="${d.swaps.includes(current) && d.picks[current] === k}"`)).join('')}</div>
      <p class="hint">First replacement: 1h. Second: 2h. Changing your choice costs no extra.</p>${button('keep', 'Keep inherited ' + suits[current].toLowerCase())}
      ${button('reveal', `${d.reveals.includes(current) ? '✓ Shown · undo' : 'Show this card to the table · 1h'}`, `aria-pressed="${d.reveals.includes(current)}"`)}
      ${button('redeal', d.redeal ? 'Undo re-deal · refund 2h' : 'Re-deal inherited policy · 2h', `aria-pressed="${d.redeal}"`)}</section>`;
  } else if (ui.step === 1) {
    content = `<div class="mini-policy">${cards.map(c => card(c)).join('')}</div><section class="paper"><label for="subject">Your deeply convincing subject</label><input id="subject" maxlength="80" value="${esc(d.subject)}" placeholder="Quarterly improvement proposal" autocomplete="off">
      <label for="template">Cover paper</label><select id="template" ${s.game.reqStyle ? 'disabled' : ''}>${templates.map(t => `<option ${d.style.tpl === t ? 'selected' : ''} value="${t}">${t}</option>`).join('')}</select>
      ${s.game.reqStyle ? '<p>The Designer has chosen this quarter’s cover paper.</p>' : ''}
      <fieldset><legend>Office clip-art</legend><div class="art-options">${['↗', '☕', '📎', '📌', '💼', '★'].map(a => button('art', a, `data-art="${a}" aria-label="Clip-art ${a}" aria-pressed="${d.style.art === a}"`)).join('')}</div></fieldset>
      <fieldset><legend>Stamp your proposal</legend>${Object.entries(stamps).map(([k, v]) => button('stamp', `${v}${k === honest ? ' ✓ honest' : ''}`, `data-stamp="${k}" aria-pressed="${d.stamp === k}"`)).join('')}</fieldset>
      ${self.spec === 'Designer' && !self.leave ? `<label for="next-template">Next quarter’s cover requirement</label><select id="next-template"><option value="">No requirement</option>${templates.map(t => `<option value="${t}" ${d.nextStyle?.tpl === t ? 'selected' : ''}>${t}</option>`).join('')}</select>` : ''}
      ${self.inherited.kind === 'rejected' && self.inherited.author !== self.id ? `<label for="claim">Inherited from ${esc(s.game.players[self.inherited.author]?.name)}: handover memo</label><select id="claim"><option value="none">Say nothing</option><option value="vouch" ${d.claim?.kind === 'vouch' ? 'selected' : ''}>Vouch for them</option><option value="report" ${d.claim?.kind === 'report' ? 'selected' : ''}>Report their policy</option></select>${d.claim?.kind === 'report' ? `<label for="claim-value">Claimed value</label><input id="claim-value" type="number" min="-6" max="6" value="${d.claim.val || 0}"><label for="claim-stamp">Claimed stamp</label><select id="claim-stamp">${Object.entries(stamps).map(([k,v]) => `<option value="${k}" ${d.claim.stamp === k ? 'selected' : ''}>${v}</option>`).join('')}</select>` : ''}` : ''}
      </section>`;
  } else content = `${cover({ ...d, style: s.game.reqStyle || d.style })}<div class="mini-policy">${cards.map(c => card(c)).join('')}</div><p class="paper">${d.reveals.length} card(s) shown to the table. ${left} overtime hour(s) unused. Submission locks your proposal.</p>`;
  return `<div class="desk-rail"><b>${['Build policy', 'Design cover', 'Submit'][ui.step]}</b><span>${left}/3 overtime hours</span></div><nav class="steps" aria-label="Policy steps">${['Build', 'Design', 'Submit'].map((t,i) => button('step', `${i + 1}. ${t}`, `data-step="${i}" aria-current="${ui.step === i ? 'step' : 'false'}"`)).join('')}</nav>${content}
    <footer class="desk-actions">${ui.step > 0 ? button('step', 'Back', `data-step="${ui.step - 1}"`) : ''}${ui.step < 2 ? button('step', 'Continue →', `data-step="${ui.step + 1}" class="primary"`) : button('submitWork', 'Submit proposal', `class="primary" ${ui.submitting ? 'disabled' : ''}`)}<small id="save-status">${ui.dirty ? 'Saving draft…' : 'Draft saved'}</small></footer>`;
}
export function playerHTML(s, ui) {
  const g = s.game, self = g?.self;
  if (s.stage === 'roles') return `<article class="paper role"><small>STRICTLY CONFIDENTIAL</small><h2>${self.sab ? 'Saboteur' : 'Loyal employee'}</h2><p>${self.sab ? 'Quietly keep the company below its profit target.' : 'Get the company to its profit target by the end of Q5.'}</p>${self.spec ? `<h3>${self.spec}</h3><p>${self.spec === 'Auditor' ? 'You can see who wrote every proposal.' : 'You choose next quarter’s cover paper.'}</p>` : ''}${s.acknowledged.includes(s.seat) ? '<p>Role acknowledged. Waiting for your colleagues.</p>' : button('ackRole', 'Read and understood', 'class="primary"')}</article>`;
  if (s.stage === 'work') return workHTML(s, ui);
  if (s.stage === 'end') return `<article class="paper"><h2>${g.win ? 'Target met.' : 'Target missed.'}</h2><p>${g.win !== self.sab ? 'Your side wins.' : 'Your side loses.'}</p><p>Your record: ${g.players[self.id].score}</p><p>Employee of the Year: ${esc(g.players[g.eoty]?.name || 'Nobody. HR is disappointed.')}</p></article>`;
  let action = '';
  if (s.stage === 'decide' && g.ceo === s.seat) action = `<h2>Nominate a proposal</h2><div class="phone-proposals">${g.envelopes.map(e => `<section>${cover(e,g.players)}<div class="mini-policy">${e.cards.map(c => card(c)).join('')}</div>${button('approve', 'Nominate ' + esc(e.id), `data-id="${e.id}" class="primary"`)}</section>`).join('')}</div>`;
  if (s.stage === 'board' && g.ceo !== s.seat && !g.ready.includes(s.seat)) {
    const e = g.envelopes.find(e => e.id === g.nominee);
    action = `${cover(e,g.players)}<div class="mini-policy">${e.cards.map(c => card(c)).join('')}</div><p class="paper">Ratify this proposal, or open it for inspection?</p><div class="two-actions">${button('boardVote','Ratify','data-vote="ratify"')}${button('boardVote','Open it','data-vote="open"')}</div>`;
  }
  if (['reveal', 'whistle'].includes(s.stage) && !g.ready.includes(s.seat)) action = `<section class="paper"><h2>${s.stage === 'whistle' ? 'Name a saboteur' : 'Issue a written warning?'}</h2>${g.players.map(p => button(s.stage === 'whistle' ? 'whistleVote' : 'warnVote', esc(p.name), `data-target="${p.id}"`)).join('')}${button(s.stage === 'whistle' ? 'whistleVote' : 'warnVote', 'Abstain', 'data-target="none"')}</section>`;
  if (s.stage === 'investigate' && g.ceo === s.seat) action = `<section class="paper"><h2>Private CEO investigation</h2>${self.investigation ? `<p>${esc(g.players[self.investigation.t].name)} used ${self.investigation.guilty ? 'a dishonest' : 'an honest'} stamp.</p>` : g.players.filter(p => p.id !== s.seat && !p.pip && !p.leave).map(p => button('investigate', esc(p.name), `data-target="${p.id}"`)).join('')}${button('skipInvestigation',self.investigation ? 'Finish investigation' : 'Skip investigation')}</section>`;
  return action || `<section class="paper wait"><h2>Eyes on the TV.</h2><p>${s.stage === 'decide' ? `${esc(g.players[g.ceo]?.name)} is choosing a proposal.` : s.stage === 'investigate' ? 'The CEO is checking the paperwork.' : 'Your part is done. Watch what happens next.'}</p></section>`;
}

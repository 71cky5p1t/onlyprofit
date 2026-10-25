// Explicit projections are the only state allowed across the room transport.
const OP = require('./core.js');
const fields = (value, keys) => Object.fromEntries(keys.filter(k => value?.[k] !== undefined).map(k => [k, value[k]]));
const card = c => fields(c, ['s', 'v', 'w', 'fx']);
function viewFor(s, audience) {
  const seat = Number.isInteger(audience) && s.P[audience]?.human ? audience : null;
  const me = seat === null ? null : s.P[seat];
  const ended = s.phase === 'end';
  const envelope = e => {
    const publicOpen = e.approved || e.audited || e.autopilot;
    const privateOpen = me && (e.author === seat || e.openTo?.includes(seat));
    const authorKnown = e.approved || e.unmasked || (me && (e.author === seat || (me.spec === 'Auditor' && !me.leave)));
    return {
      ...fields(e, ['id', 'subject', 'stamp', 'style', 'approved', 'audited', 'autopilot', 'revealed', 'resolved']),
      author: authorKnown ? e.author : null,
      cards: e.cards.map((c, su) => publicOpen || privateOpen || e.revealed.includes(su) ? card(c) : null)
    };
  };
  const v = {
    ...fields(s, ['n', 'r', 'phase', 'brand', 'profit', 'target', 'ceo', 'nominee', 'pick', 'result', 'reqStyle']),
    players: s.P.map(p => ({ ...fields(p, ['id', 'name', 'human', 'warnings', 'leave', 'pip', 'ceoTurns']), ...(ended ? { sab: p.sab, score: s.scores[p.id] } : {}) })),
    envelopes: s.phase === 'work' || s.phase === 'brief' ? [] : s.envs.map(envelope),
    ledger: s.ledger.map(l => fields(l, ['r', 'id', 'subject', 'author', 'ceo', 'actual', 'stamp', 'autopilot'])),
    feed: s.feed.map(e => fields(e, ['r', 'kind', 'text'])),
    ready: s.P.filter(p => s.phase === 'work' ? !(p.id in s.work) : s.phase === 'board' ? p.id in s.bvotes : s.phase === 'reveal' ? p.id in s.wvotes : s.phase === 'whistle' ? p.id in s.wb : false).map(p => p.id),
    schedule: OP.ceoSchedule(s),
    ...(ended ? { win: s.win, eoty: s.eoty, whistle: fields(s.whistle, ['named', 'correct', 'swing']) } : {}),
    self: me ? {
      ...fields(me, ['id', 'name', 'sab', 'spec', 'dept', 'leave', 'pip']),
      inherited: me.inh ? { ...fields(me.inh, ['author', 'kind', 'stamp', 'subject']), cards: me.inh.cards.map(card) } : null,
      work: s.work[seat] ? { spares: s.work[seat].D.map(card), redeal: s.work[seat].R.map(card) } : null,
      investigation: seat === s.ceo && s.invq ? fields(s.invq, ['t', 'guilty']) : null
    } : null
  };
  return JSON.parse(JSON.stringify(v));
}
module.exports = { viewFor };

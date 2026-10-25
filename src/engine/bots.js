// Bot players: saboteur modes and loyal temperaments.
const OP_BOTS = (() => {
  // [memo belief, warning threshold]
  const PERS = { trusting: [1, 0.5], sceptic: [0.5, 1], gossip: [1, 0.5], beancounter: [0.75, 0.75], yesman: [1, 1] };
  const PERS_SAY = { trusting: 'believes a memo', sceptic: 'wants hard evidence', gossip: 'reports small losses', beancounter: 'trusts audited numbers', yesman: 'votes with the CEO' };
  const make = K => {
    const { rand, pickOne, argmax, evs, estimate, plans, draw3, discard, revealPositive, randomSubject, randomStyle, isHuman, accuse, pubEst, TOKENS, SLACK } = K;
    function sabMode(s) {
      const S = s.sabTier, r = s.r;
      if (S === 'naive' || S === 'blatant') return 'bad';
      if (S === 'patient') return r >= 3 ? 'bad' : 'good';
      const pace = r > 1 ? s.profit / (r - 1) * 5 : 99;
      return (r >= 3 || pace >= s.target) ? 'disguised' : 'good';
    }
    function botWork(s, i, I, D) {
      const p = s.P[i], L = s.loyalTier, tok = TOKENS;
      const mode = p.sab ? (p.ruthless && s.ceo === i ? 'bad' : sabMode(s)) : 'loyal';
      const tier = p.sab ? (s.sabTier === 'smart' ? 'smart' : 'basic') : L;
      let cost, prop, hand, redeal = false;
      if (mode === 'loyal' || mode === 'good') {
        [cost, prop, hand] = argmax(plans(I, D), x => [evs(x[1]), -x[0]]);
        if (evs(prop) <= -1) {
          const R = draw3(s); discard(s, I); redeal = true;
          [cost, prop, hand] = argmax(plans(R, D, 1), x => [evs(x[1]), -x[0]]); cost += 2;
        }
      } else if (mode === 'bad') {
        [cost, prop, hand] = argmax(plans(I, D), x => [-evs(x[1]), -x[0]]);
      } else {
        [cost, prop, hand] = argmax(plans(I, D), ([c, pr]) => {
          const env = { cards: pr, revealed: revealPositive(pr, tok - c), stamp: 'Risky' };
          return [evs(pr) <= -1 ? 1 : 0, estimate(env, L, true) - evs(pr)];
        });
      }
      const left = tok - cost, v = evs(prop);
      let stamp, rev;
      if (mode === 'loyal' || mode === 'good') {
        stamp = v >= 2 ? 'Rec' : v >= 0 ? 'Risky' : 'Not';
        rev = tier === 'naive' ? [] : v >= 1 ? revealPositive(prop, left, tier === 'smart') : [];
      } else if (mode === 'bad') {
        stamp = 'Rec'; rev = s.sabTier === 'naive' ? [] : revealPositive(prop, left);
      } else { stamp = 'Risky'; rev = revealPositive(prop, left); }
      const style = s.reqStyle || (rand(s) < 0.75 ? p.fav : randomStyle(s));
      return [{ author: i, cards: prop, stamp, revealed: rev, subject: randomSubject(s), style: Object.assign({}, style), mode, cost: cost + rev.length, redeal }, hand];
    }
    function autopilot(s, i, I, D) {
      const cards = draw3(s); discard(s, I);
      return [{ author: i, cards, stamp: 'Risky', revealed: [], autopilot: true, subject: 'Interim Management Update', style: { color: 'manila', trim: 'plain' }, mode: 'autopilot', cost: 0 }, D];
    }
    function botInheritMemo(s, i, inh) {
      const p = s.P[i];
      if (p.leave || inh.kind !== 'rejected' || inh.author == null || inh.author === i) return;
      const v = evs(inh.cards), a = inh.author;
      if (!p.sab && s.loyalTier === 'smart') {
        if ((inh.stamp === 'Rec' && v <= -1) || (inh.stamp === 'Risky' && v <= (p.pers === 'sceptic' ? -3 : -2)) || (p.pers === 'gossip' && v <= -1)) accuse(s, i, a, inh.stamp, v, true);
        else if (v >= 2 && rand(s) < 0.5) s.memos.push({ by: i, target: a, kind: 'vouch', truthful: true });
      } else if (p.sab && s.sabTier === 'smart' && !s.P[a].leave) {
        const lie = !(inh.stamp === 'Rec' && v <= -1);
        accuse(s, i, a, 'Rec', lie ? pickOne(s, [-2, -3, -3, -4]) : v, !lie);
      }
    }
    function viewValue(s, i, e) { return e.author === i ? evs(e.cards) : estimate(e, s.loyalTier, i === s.ceo); }
    function botAuditVote(s, i) {
      const c = s.envs.filter(e => !e.autopilot);
      if (!c.length) return 'none';
      const p = s.P[i];
      if (p.sab) {
        if (s.sabTier === 'naive' || s.sabTier === 'blatant') return 'none';
        const sorted = c.slice().sort((a, b) => viewValue(s, i, b) - viewValue(s, i, a));
        const top = sorted[0];
        if (top.author === i && evs(top.cards) <= 0) return sorted[1] ? sorted[1].id : 'none';
        return top.id;
      }
      if (s.loyalTier === 'naive') return pickOne(s, c).id;
      return argmax(c, e => [viewValue(s, i, e)]).id;
    }
    function botPick(s) {
      const ceo = s.ceo, L = s.loyalTier, envs = s.envs;
      const est = e => estimate(e, L, true);
      if (s.P[ceo].sab && s.P[ceo].ruthless) { const own = envs.find(e => e.author === ceo && !e.autopilot); if (own) return own.id; }
      if (s.P[ceo].sab) {
        const top = Math.max(...envs.map(est));
        const deny = envs.filter(e => est(e) >= top - SLACK);
        return argmax(deny, e => [-(e.author === ceo || e.audited || e.autopilot ? evs(e.cards) : est(e))]).id;
      }
      if (L === 'naive') {
        const rank = { Rec: 2, Risky: 1, Not: 0 }; const top = Math.max(...envs.map(e => rank[e.stamp]));
        return pickOne(s, envs.filter(e => rank[e.stamp] === top)).id;
      }
      return argmax(envs, e => [e.author === ceo ? evs(e.cards) : est(e)]).id;
    }
    // memos from suspects count less; table evidence counts double
    function credibility(s, i, by) {
      if (by === 'table') return 2;
      if (by === i) return 0;
      const a = s.P[by];
      return Math.max(0.25, 1 - 0.5 * a.warnings - (s.accused[by] ? 0.5 : 0) - (a.claims > 2 ? 0.5 : 0));
    }
    function warnScore(s, i, t) {
      const w = s.P[i].sab ? PERS.trusting : PERS[s.P[i].pers] || PERS.trusting;
      return s.accused[t].reduce((a, by) => a + (by === 'table' ? 2 : w[0] * credibility(s, i, by)), 0) + 0.25 * s.P[t].warnings;
    }
    function botWarnVote(s, i) {
      const p = s.P[i];
      if (!p.sab && p.pers === 'yesman' && s.ceo !== i && !isHuman(s, s.ceo) && s.P[s.ceo].pers !== 'yesman') {
        const v = botWarnVote(s, s.ceo); if (v !== 'none' && v !== i) return v;
      }
      const c = Object.keys(s.accused).map(Number).filter(t => t !== i && !s.P[t].leave);
      if (!c.length) return 'none';
      const t = argmax(c, t => [warnScore(s, i, t), s.P[t].accusations, s.P[t].warnings]);
      const need = p.sab ? 1 : (PERS[p.pers] || PERS.trusting)[1];
      return warnScore(s, i, t) >= need ? t : 'none';
    }
    const suspicion = (s, q) => q.claims + 4 * Math.min(q.accusations, 2);
    function botWhistle(s, i) {
      const others = s.P.filter(q => q.id !== i);
      if (!s.P[i].sab && s.loyalTier === 'naive') return pickOne(s, others).id;
      const best = argmax(others, q => [suspicion(s, q), q.warnings, -q.id]);
      return suspicion(s, best) < 3 ? 'none' : best.id;
    }
    function botDesign(s) {
      const d = s.P.find(p => p.spec === 'Designer');
      if (!d || isHuman(s, d.id) || d.leave) return;
      if (d.sab && rand(s) < 0.6) { const loyal = pickOne(s, s.P.filter(p => p.id !== d.id)); s.nextStyle = Object.assign({}, loyal.fav); }
      else s.nextStyle = rand(s) < 0.5 ? randomStyle(s) : null;
    }

    function botBoardVote(s, i) {
      const p = s.P[i], nom = s.envs.find(x => x.id === s.nominee);
      if (p.sab || !nom) return 'ratify';
      const best = Math.max(...s.envs.map(x => pubEst(s, x)));
      return pubEst(s, nom) <= best - 2 ? 'overrule' : 'ratify';
    }
    return { botWork, autopilot, botInheritMemo, botAuditVote, botPick, botWarnVote, botWhistle, botDesign, botBoardVote, suspicion };
  };
  return { PERS, PERS_SAY, make };
})();
if (typeof module !== 'undefined') module.exports = OP_BOTS;

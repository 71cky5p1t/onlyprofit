// Bot players: saboteur modes, loyal temperaments, and each bot's memory of the table.
const OP_BOTS = (() => {
  // [memo belief, warning threshold, risk appetite, faith in a hidden card, faith in a stamp]
  const PERS = { trusting: [1, 0.5, 0.2, 0.2, 1.5], sceptic: [0.5, 1, -0.3, -0.5, 0.5], gossip: [1, 0.5, 0.1, 0, 1], beancounter: [0.75, 0.75, -0.2, -0.3, 0.75], yesman: [1, 1, 0, 0.1, 1.25] };
  const PERS_SAY = { trusting: 'believes a memo', sceptic: 'wants hard evidence', gossip: 'reports small losses', beancounter: 'trusts audited numbers', yesman: 'votes with the CEO' };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const styleKey = st => st ? st.color + '/' + st.trim : '';
  const make = K => {
    const { rand, pickOne, argmax, ev, evs, estimate, STAMP_ADJ, plans, draw3, discard, revealPositive, randomSubject, randomStyle, isHuman, accuse, pubEst, TOKENS, SLACK } = K;
    const pers = p => PERS[p.pers] || PERS.trusting;

    // ---------- memory ----------
    // t: trust per seat (negative = suspect), st: envelope style -> authors seen, risk: appetite
    function initMind(s) {
      for (const p of s.P) p.mind = { t: {}, st: {}, risk: +(pers(p)[2] + (rand(s) - 0.5) * 0.6).toFixed(2) };
    }
    const trust = (s, i, j) => (s.P[i].mind && s.P[i].mind.t[j]) || 0;
    function nudge(s, i, j, d) { if (i === j) return; const t = s.P[i].mind.t; t[j] = +clamp((t[j] || 0) + d, -6, 3).toFixed(2); }
    function seeStyle(s, i, e) {
      if (e.autopilot || e.author === i || s.reqStyle) return;
      const m = s.P[i].mind.st, k = styleKey(e.style); m[k] = m[k] || {}; m[k][e.author] = (m[k][e.author] || 0) + 1;
    }
    // best guess at an anonymous envelope's author, from styles seen before
    function guess(s, i, e) {
      if (e.autopilot || s.reqStyle) return null;
      if (e.author === i) return i;
      const m = (s.P[i].mind && s.P[i].mind.st[styleKey(e.style)]) || {};
      const ks = Object.keys(m).filter(k => +k !== i); if (!ks.length) return null;
      const k = argmax(ks, k => [m[k]]); return m[k] >= 1 ? +k : null;
    }
    // lies told about me this quarter, which only I can know
    const liesAboutMe = (s, i) => s.P[i].sab ? [] : s.memos.filter(m => m.kind === 'report' && m.target === i && !m.truthful).map(m => m.by);
    // bots answer memos about them, truthfully or not
    function botDisputes(s) {
      const out = [];
      for (const m of s.memos.slice()) {
        if (m.kind !== 'report' || isHuman(s, m.target) || s.P[m.target].leave) continue;
        const q = s.P[m.target];
        if (!m.truthful || (q.sab && rand(s) < 0.6)) { m.disputed = true; const d = { by: m.target, target: m.by, kind: 'dispute', truthful: !m.truthful }; s.memos.push(d); out.push(d); }
      }
      return out;
    }
    // how much i believes a memo, given whether its target denied it
    function belief(s, i, m) {
      if (!m.disputed) return 1;
      if (m.target === i) return 0;
      const a = credibility(s, i, m.by), b = credibility(s, i, m.target);
      return 2 * a / (a + b);
    }
    // end of quarter: everyone updates what they think of everyone
    function observe(s) {
      const e = s.envs.find(x => x.id === s.pick), nom = s.board && s.board.overruled && s.envs.find(x => x.id === s.board.nominee);
      for (const p of s.P) {
        if (isHuman(s, p.id)) continue;
        const i = p.id, w = pers(p);
        // memories fade
        for (const j in p.mind.t) p.mind.t[j] = +(p.mind.t[j] * 0.85).toFixed(2);
        if (e) {
          seeStyle(s, i, e);
          if (!e.autopilot && e.author !== i) {
            const a = s.result.actual;
            if (e.stamp === 'Rec') nudge(s, i, e.author, a <= -1 ? -1.5 : a >= 2 ? 0.5 : 0);
            else if (a <= -2) nudge(s, i, e.author, -0.5);
            if (e.author === s.ceo && a <= -1) nudge(s, i, s.ceo, -1);
          }
        }
        if (nom) { seeStyle(s, i, nom); nudge(s, i, s.ceo, s.board.own ? -1.5 : -0.5); }
        for (const m of s.memos) {
          if (m.target === i && !p.sab) nudge(s, i, m.by, (m.kind === 'report' || m.kind === 'dispute') && !m.truthful ? -3 : m.kind === 'vouch' ? 0.3 : 0);
          else if (m.kind === 'report' && m.target !== i) nudge(s, i, m.target, -0.6 * w[0] * credibility(s, i, m.by) * belief(s, i, m));
        }
        if (s.wvotes && !p.sab) for (const [j, v] of Object.entries(s.wvotes)) if (v === i) nudge(s, i, +j, -1);
      }
    }

    // ---------- work ----------
    function sabMode(s, p) {
      const S = s.sabTier, r = s.r;
      if (S === 'naive' || S === 'blatant') return 'bad';
      if (S === 'patient') return r >= 3 ? 'bad' : 'good';
      // lie low for a quarter when the heat is on
      if (S === 'smart' && r < 5 && (p.warnings >= 1 || p.accusations >= 2) && !p.lowDone) { p.lowDone = true; return 'good'; }
      const pace = r > 1 ? s.profit / (r - 1) * 5 : 99;
      return (r >= 3 || pace >= s.target) ? 'disguised' : 'good';
    }
    function botWork(s, i, I, D) {
      const p = s.P[i], L = s.loyalTier, tok = TOKENS;
      const mode = p.sab ? (p.ruthless && s.ceo === i ? 'bad' : sabMode(s, p)) : 'loyal';
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
          // a trap: looks good on the cards shown, loses money
          const shown = revealPositive(pr, tok - c).reduce((a, su) => a + ev(pr[su]), 0);
          return [evs(pr) <= -1 ? 1 : 0, 1.5 * shown - evs(pr)];
        });
      }
      const left = tok - cost, v = evs(prop);
      let stamp, rev;
      if (mode === 'loyal' || mode === 'good') {
        stamp = v >= 2 ? 'Rec' : v >= 0 ? 'Risky' : 'Not';
        rev = tier === 'naive' ? [] : v >= 1 ? revealPositive(prop, left, tier === 'smart') : [];
      } else if (mode === 'bad') {
        stamp = 'Rec'; rev = s.sabTier === 'naive' ? [] : revealPositive(prop, left);
      } else { stamp = !p.accusations && !p.warnings && rand(s) < 0.5 ? 'Rec' : 'Risky'; rev = revealPositive(prop, left); }
      let style = s.reqStyle || (rand(s) < 0.75 ? p.fav : randomStyle(s));
      // a smart saboteur sends bad envelopes in someone else's colours
      if (!s.reqStyle && p.sab && tier === 'smart' && mode !== 'good' && rand(s) < 0.5) style = pickOne(s, s.P.filter(q => q.id !== i)).fav;
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
        const real = inh.stamp === 'Rec' && v <= -1;
        // pile on whoever is already under suspicion; go easy on the table favourite
        const heat = s.P[a].accusations + 2 * s.P[a].warnings, back = trust(s, a, i) < -1;
        if (real || (v <= -1 && inh.stamp !== 'Not')) accuse(s, i, a, inh.stamp, v, true);
        else if (heat >= 2 || back || rand(s) < 0.35) accuse(s, i, a, 'Rec', pickOne(s, [-2, -3, -3, -4]), false);
        else if (v >= 2 && rand(s) < 0.4) s.memos.push({ by: i, target: a, kind: 'vouch', truthful: true });
      }
    }

    // ---------- judging envelopes ----------
    function viewValue(s, i, e) { return e.author === i ? evs(e.cards) : estimate(e, s.loyalTier, i === s.ceo); }
    // what this bot thinks an envelope is worth: public read, plus who it looks like, plus nerve
    function feel(s, i, e) {
      if (e.author === i || e.audited || e.autopilot) return viewValue(s, i, e);
      const g = guess(s, i, e), unk = 3 - e.revealed.length;
      const behind = s.r > 1 ? s.profit / (s.r - 1) * 5 < s.target - 2 : false;
      const risk = s.P[i].mind.risk + (behind ? 0.4 : s.profit >= s.target ? -0.3 : 0);
      const w = pers(s.P[i]), read = e.revealed.reduce((a, su) => a + ev(e.cards[su]), 0) + unk * w[3] + w[4] * STAMP_ADJ[e.stamp];
      return read + (g == null ? 0 : 0.5 * clamp(trust(s, i, g), -3, 1) * unk / 3) + 0.35 * risk * unk + (rand(s) - 0.5) * 0.8;
    }
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
      // open the front-runner unless a contender smells off
      const top = c.map(e => [e, feel(s, i, e)]).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return argmax(top, ([e, f]) => {
        const g = guess(s, i, e), smell = (g != null && g !== i ? -Math.min(0, trust(s, i, g)) : 0) + (e.stamp === 'Rec' && !e.revealed.length ? 1 : 0);
        return [e.author === i ? -9 : f - top[0][1] + 0.8 * smell];
      })[0].id;
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
      return argmax(envs, e => [feel(s, ceo, e)]).id;
    }

    // ---------- warnings and the whistle ----------
    // memos from suspects count less; table evidence counts double
    function credibility(s, i, by) {
      if (by === 'table') return 2;
      if (by === i) return 0;
      const a = s.P[by];
      const base = Math.max(0.25, 1 - 0.5 * a.warnings - (s.accused[by] ? 0.5 : 0) - (a.claims > 2 ? 0.5 : 0));
      return Math.max(0.1, base * (1 + 0.25 * clamp(trust(s, i, by), -3, 2)));
    }
    // my private case against t: grudges, track record, lies only I can see
    const hunch = (s, i, t) => -Math.min(0, trust(s, i, t)) * 0.5 + (liesAboutMe(s, i).includes(t) ? 3 : 0);
    function warnScore(s, i, t) {
      const w = s.P[i].sab ? PERS.trusting : pers(s.P[i]);
      const memo = by => s.memos.find(m => m.kind === 'report' && m.by === by && m.target === t);
      const pub = (s.accused[t] || []).reduce((a, by) => a + (by === 'table' ? 2 : w[0] * credibility(s, i, by) * (memo(by) ? belief(s, i, memo(by)) : 1)), 0)
        + s.memos.filter(m => m.kind === 'dispute' && m.target === t && m.by !== i).reduce((a, m) => a + 0.5 * w[0] * credibility(s, i, m.by), 0);
      return pub + 0.25 * s.P[t].warnings + (s.P[i].sab ? 0 : hunch(s, i, t));
    }
    function botWarnVote(s, i) {
      const p = s.P[i];
      if (!p.sab && p.pers === 'yesman' && s.ceo !== i && !isHuman(s, s.ceo) && s.P[s.ceo].pers !== 'yesman') {
        const v = botWarnVote(s, s.ceo); if (v !== 'none' && v !== i) return v;
      }
      const c = [...new Set(Object.keys(s.accused).map(Number).concat(liesAboutMe(s, i), s.memos.filter(m => m.kind === 'dispute').map(m => m.target)))].filter(t => t !== i && !s.P[t].leave);
      if (!c.length) return 'none';
      const t = argmax(c, t => [warnScore(s, i, t), s.P[t].accusations, s.P[t].warnings]);
      // slow to point fingers early, quicker late
      const need = (p.sab ? 1 : pers(p)[1]) * (s.r <= 1 ? 1.4 : s.r >= 4 ? 0.85 : 1);
      return warnScore(s, i, t) >= need ? t : 'none';
    }
    const suspicion = (s, q) => q.claims + 4 * Math.min(q.accusations, 2);
    function botWhistle(s, i) {
      const others = s.P.filter(q => q.id !== i), p = s.P[i];
      if (!p.sab && s.loyalTier === 'naive') return pickOne(s, others).id;
      if (p.sab) { const best = argmax(others, q => [suspicion(s, q), q.warnings, -q.id]); return suspicion(s, best) < 2 ? 'none' : best.id; }
      const score = q => suspicion(s, q) + 2 * hunch(s, i, q.id) - 0.5 * Math.max(0, trust(s, i, q.id));
      const best = argmax(others, q => [score(q), q.warnings, -q.id]);
      // weigh the stakes: name freely when it can't hurt or must happen, hold back when it could cost the win
      const gap = s.target - s.profit, need = gap > 0 ? 2.5 : gap > -3 ? 5 : 3;
      return score(best) < need ? 'none' : best.id;
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
      if (nom.author === i) return 'ratify';
      const f = new Map(s.envs.map(x => [x.id, feel(s, i, x)])), best = Math.max(...f.values());
      // recognises the CEO's own colours, or a suspect's
      const g = guess(s, i, nom), tell = g != null && (g === s.ceo || trust(s, i, g) <= -2);
      return f.get(nom.id) <= best - (tell ? 1 : 2) ? 'overrule' : 'ratify';
    }
    return { initMind, observe, botDisputes, botWork, autopilot, botInheritMemo, botAuditVote, botPick, botWarnVote, botWhistle, botDesign, botBoardVote, suspicion };
  };
  return { PERS, PERS_SAY, make };
})();
if (typeof module !== 'undefined') module.exports = OP_BOTS;

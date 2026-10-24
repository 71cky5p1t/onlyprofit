"""Only Profit v0.1 (with rejected-envelope handover) - strategy-tier balance simulator.

Loyal tiers:  naive (sensible cards, no reveals, trusts stamps, random audit) | basic | smart      Saboteur tiers: naive | blatant | patient | smart
Levers (consequences for being caught): none | pip (flagged player's envelopes auto-open)
                                        | full (pip + no-confidence vote skips a flagged CEO)
"""
import random, statistics as st, itertools
from math import comb

V = 'V'
SUIT_MIX = {2: 3, 1: 5, 0: 4, -1: 6, -2: 4, V: 2}
def ev(c): return 0 if c == V else c
def evs(cards): return sum(ev(c) for c in cards)
POOL = [v for v, k in SUIT_MIX.items() for _ in range(k)]
MU = st.mean(ev(c) for c in POOL)
TARGETS = {4: 17, 5: 18, 6: 19, 7: 20, 8: 21}

class Deck:
    def __init__(self, rng):
        self.rng = rng
        self.piles = [rng.sample(POOL, len(POOL)) for _ in range(3)]
        self.disc = [[] for _ in range(3)]
    def draw(self, s):
        if not self.piles[s]:
            self.piles[s], self.disc[s] = self.disc[s], []
            self.rng.shuffle(self.piles[s])
        return self.piles[s].pop()
    def draw3(self): return [self.draw(s) for s in range(3)]
    def discard(self, cards):
        for s, c in enumerate(cards): self.disc[s].append(c)

def plans(I, D, max_cost=3):
    yield 0, I[:], D[:]
    for s in range(3):
        p, h = I[:], D[:]; p[s], h[s] = D[s], I[s]; yield 1, p, h
    if max_cost >= 3:
        for a, b in itertools.combinations(range(3), 2):
            p, h = I[:], D[:]
            for s in (a, b): p[s], h[s] = D[s], I[s]
            yield 3, p, h

STAMP_W = {'naive': 1.5, 'basic': 1.5, 'smart': 0.5}
STAMP_ADJ = {'Rec': 1.0, 'Risky': 0.0, 'Not': -1.5}

def estimate(env, tier):
    """What the loyal table believes an envelope is worth."""
    if env['audited'] or env['pip']: return evs(env['cards'])
    known = sum(ev(env['cards'][s]) for s in env['revealed'])
    hidden = 3 - len(env['revealed'])
    hid_mu = MU - (0.4 if tier == 'smart' else 0.0)  # smart tables discount unproven cards
    return known + hidden * hid_mu + STAMP_W[tier] * STAMP_ADJ[env['stamp']]

def reveal_positive(prop, tokens, all_if_good=False):
    order = sorted(range(3), key=lambda s: -ev(prop[s]))
    if all_if_good: return order[:tokens]
    return [s for s in order if ev(prop[s]) > 0][:tokens]

class Game:
    def __init__(self, n, n_sab, cfg, rng):
        self.n, self.cfg, self.rng = n, cfg, rng
        self.L, self.S = cfg['loyal'], cfg['sab']
        self.deck = Deck(rng)
        self.sab = [False] * n
        for i in rng.sample(range(n), n_sab): self.sab[i] = True
        self.flag = [False] * n
        self.nflag = [0] * n
        self.target = cfg.get('target') or round(TARGETS[n] * cfg['rounds'] / 5)
        self.profit = 0
        self.ceo_order = rng.sample(range(n), n)
        self.false_flags = 0; self.true_flags = 0
        self.claims = [0.0] * n

    # ---------- department work ----------
    def work(self, i, I, D, rnd):
        rng, cfg = self.rng, self.cfg
        if cfg['lever'] != 'fire' or not self.flag[i]: pass
        tok = cfg['tokens'] - getattr(self, 'tok_pen', 0)
        mode = 'loyal'
        if self.sab[i] and not self.cfg.get('sab_env_honest'):
            S = self.S
            if S in ('naive', 'blatant'): mode = 'bad'
            elif S == 'patient': mode = 'bad' if rnd >= 3 else 'good'
            elif S == 'smart':
                pace = self.profit / max(rnd - 1, 1) * 5 if rnd > 1 else 99
                if self.flag[i] and cfg['lever'] != 'none': mode = 'poison'
                elif rnd >= cfg['smart_strike_from'] or pace >= self.target: mode = 'disguised'
                else: mode = 'good'
            tier = 'basic' if S in ('naive', 'blatant', 'patient') else 'smart'
        else:
            tier = self.L if not self.sab[i] else 'basic'
        pip = self.flag[i] and cfg['lever'] != 'none'
        if self.flag[i] and cfg['lever'] == 'fire':
            # interim management: department runs on autopilot, fully visible
            prop = self.deck.draw3(); self.deck.discard(I)
            return dict(author=i, cards=prop, stamp='Risky', revealed=set(), audited=False, pip=True, fired=True), D
        # ---- choose plan ----
        if mode in ('loyal', 'good'):
            cost, prop, hand = max(plans(I, D), key=lambda x: (evs(x[1]), -x[0]))
            # re-deal if the inherited policy is poor and drawn cards can't fix it
            if evs(prop) <= -1 and tok >= 2:
                R = self.deck.draw3(); self.deck.discard(I)
                cost, prop, hand = max(plans(R, D, 1), key=lambda x: (evs(x[1]), -x[0]))
                cost += 2
        elif mode in ('bad', 'poison'):
            cost, prop, hand = min(plans(I, D), key=lambda x: (evs(x[1]), x[0]))
        else:  # disguised: low true value, high believed value after reveals
            best = None
            for c, p, h in plans(I, D):
                r = reveal_positive(p, tok - c)
                env = dict(cards=p, revealed=set(r), stamp=self.cfg.get('smart_stamp', 'Rec'), audited=False, pip=False)
                key = (evs(p) <= -1, estimate(env, self.L) - evs(p))
                if best is None or key > best[0]: best = (key, c, p, h)
            _, cost, prop, hand = best
        left = tok - cost
        v = evs(prop)
        # ---- stamp + reveals ----
        if mode in ('loyal', 'good'):
            stamp = 'Rec' if v >= 2 else ('Risky' if v >= 0 else 'Not')
            if tier == 'naive': rev = []
            elif tier == 'smart': rev = reveal_positive(prop, left, all_if_good=True) if v >= 1 else []
            else: rev = reveal_positive(prop, left) if v >= 1 else []
        elif mode == 'bad':
            stamp = 'Rec'
            rev = [] if self.S == 'naive' else reveal_positive(prop, left)
        elif mode == 'poison':
            stamp = 'Not'; rev = []
        else:
            stamp = self.cfg.get('smart_stamp', 'Rec'); rev = reveal_positive(prop, left)
        return dict(author=i, cards=prop, stamp=stamp, revealed=set(rev), audited=False, pip=pip), hand

    # ---------- one game ----------
    def play(self):
        n, rng, cfg = self.n, self.rng, self.cfg
        hands = [dict(cards=self.deck.draw3(), author=None, stamp=None) for _ in range(n)]
        ceo_ptr = 0
        log = []
        for rnd in range(1, cfg['rounds'] + 1):
            assign = rng.sample(range(n), n)  # player i -> dept assign[i]
            # CEO, with optional no-confidence skip of a flagged CEO
            ceo = self.ceo_order[ceo_ptr % n]
            if cfg['lever'] in ('full', 'fire') and self.flag[ceo]:
                for k in range(1, n):
                    alt = self.ceo_order[(ceo_ptr + k) % n]
                    if not self.flag[alt]: ceo = alt; break
            ceo_ptr += 1
            envs, leftovers = [], {}
            for i in range(n):
                d = assign[i]; inh = hands[d]
                # smart loyal inheritor learns what a rejected envelope really was
                self.tok_pen = 0
                if self.L == 'smart' and not self.sab[i] and inh['author'] is not None \
                        and ((inh['stamp'] == 'Rec' and evs(inh['cards']) <= -1)
                             or (inh['stamp'] == 'Risky' and evs(inh['cards']) <= -2)):
                    self.raise_flag(inh['author'])
                    if cfg.get('receipts'): self.tok_pen = cfg.get('receipt_cost', 1)
                # a smart saboteur inheritor lies: "they left me junk" (unverifiable)
                if self.sab[i] and self.S == 'smart' and cfg.get('frame') and inh['author'] is not None \
                        and not self.sab[inh['author']] and not self.flag[i] and rng.random() < cfg['frame'] \
                        and not (cfg.get('receipts') and self.L == 'smart'):
                    self.raise_flag(inh['author'])
                e, ho = self.work(i, inh['cards'], self.deck.draw3(), rnd)
                e['dept'] = d; envs.append(e); leftovers[d] = ho
            # audit: table opens one envelope
            for _ in range(cfg.get('audits', 1)):
                cand = [e for e in envs if len(e['revealed']) < 3 and not e['pip'] and not e['audited']]
                if not cand: break
                if self.L == 'naive': rng.choice(cand)['audited'] = True
                else: max(cand, key=lambda e: estimate(e, self.L))['audited'] = True
            # CEO decision
            if self.sab[ceo] and not cfg.get('sab_ceo_honest'):
                top = max(estimate(e, self.L) for e in envs)
                deny = [e for e in envs if estimate(e, self.L) >= top - cfg['slack']]
                pick = min(deny, key=lambda e: evs(e['cards']) if (e['author'] == ceo or e['audited'] or e['pip']) else estimate(e, self.L))
            elif self.L == 'naive':
                rank = {'Rec': 2, 'Risky': 1, 'Not': 0}
                top = max(rank[e['stamp']] for e in envs)
                pick = rng.choice([e for e in envs if rank[e['stamp']] == top])
            else:
                pick = max(envs, key=lambda e: evs(e['cards']) if e['author'] == ceo else estimate(e, self.L))
            actual = sum(rng.choice((2, -2)) if c == V else c for c in pick['cards'])
            best_known = max(estimate(e, self.L) for e in envs)
            self.profit += actual
            log.append((pick['author'], pick['stamp'], actual, ceo))
            self.claims[pick['author']] += {'Rec': 2.5, 'Risky': 0.5, 'Not': -1.0}[pick['stamp']] - actual
            # smart table flags provable misconduct
            if self.L == 'smart':
                if pick['stamp'] == 'Rec' and actual <= -1: self.raise_flag(pick['author'])
                if estimate(pick, self.L) <= best_known - 3: self.raise_flag(ceo)
            # handovers
            new = [None] * n
            for e in envs:
                d = e['dept']
                if e is pick:
                    self.deck.discard(e['cards'])
                    new[d] = dict(cards=leftovers[d], author=None, stamp=None)
                else:
                    self.deck.discard(leftovers[d])
                    if cfg.get('sab_handover_clean') and self.sab[e['author']]:
                        new[d] = dict(cards=self.deck.draw3(), author=None, stamp=None)
                    else:
                        new[d] = dict(cards=e['cards'], author=None if e.get('fired') else e['author'], stamp=e['stamp'])
            hands = new
        win = self.profit >= self.target
        acc = cfg.get('accuse')
        bonus, penalty = cfg.get('wb_pay', (4, -3))  # end-of-game whistleblower vote
        caught = None
        if acc:
            if self.L == 'naive': sus = [rng.random() for _ in range(n)]
            else: sus = [self.claims[i] + 4 * min(self.nflag[i], 2) + rng.random() * 0.01 for i in range(n)]
            top = max(range(n), key=lambda i: sus[i])
            if self.L != 'naive' and sus[top] < cfg.get('accuse_threshold', 3):
                top = None  # table declines to accuse
            caught = self.sab[top] if top is not None else False
            if top is None: self.accused_none = True
            if acc == 'win' and caught: win = True
            elif acc == 'bonus' and top is not None:
                self.profit += bonus if caught else penalty
                win = self.profit >= self.target
        return dict(win=win, profit=self.profit, caught=caught,
                    n_sab=sum(self.sab), ff=self.false_flags, tf=self.true_flags)

    def raise_flag(self, i):
        self.nflag[i] += 1
        if not self.flag[i] and self.nflag[i] >= self.cfg.get('fire_at', 1):
            self.flag[i] = True
            if self.sab[i]: self.true_flags += 1
            else: self.false_flags += 1

BASE = dict(rounds=5, tokens=3, loyal='basic', sab='blatant', lever='none', slack=2.0,
            smart_strike_from=3, target=None)

def run(n, n_sab, games=3000, seed=7, **kw):
    cfg = dict(BASE, **kw); rng = random.Random(seed)
    res = [Game(n, n_sab, cfg, rng).play() for _ in range(games)]
    return dict(loyal_win=st.mean(r['win'] for r in res), profit=st.mean(r['profit'] for r in res),
                false_flags=st.mean(r['ff'] for r in res), true_flags=st.mean(r['tf'] for r in res),
                caught=st.mean(r['caught'] for r in res) if res[0]['caught'] is not None else None)

POOLS = {4: (5, 1), 5: (6, 1), 6: (8, 2), 7: (9, 2), 8: (10, 2)}  # (cards dealt from, saboteur cards)

def sab_dist(n):
    """Distribution of real saboteur count when n cards are dealt from the pool."""
    tot, s = POOLS[n]; extra = tot - n
    return {k: comb(s, k) * comb(tot - s, n - k) / comb(tot, n) for k in range(s + 1) if n - k >= 0 and n - k <= tot - s}

def pooled(n, games=3000, **kw):
    """Loyal win rate across the real role-deal, plus conditioned on saboteurs present."""
    d = sab_dist(n); per = {k: run(n, k, games, **kw)['loyal_win'] for k in d}
    overall = sum(d[k] * per[k] for k in d)
    with_sab = sum(d[k] * per[k] for k in d if k) / sum(d[k] for k in d if k)
    return dict(dist=d, per=per, overall=overall, with_sab=with_sab)


MEMO = {4: {0: .2, 1: .8}, 5: {0: .2, 1: .8}, 6: {0: .2, 1: .4, 2: .4}, 7: {0: .2, 1: .4, 2: .4}, 8: {0: .2, 1: .4, 2: .4}}
FINAL = dict(loyal='smart', sab='smart', smart_stamp='Risky', frame=1.0, lever='fire', accuse='bonus')

def memo(n, games=2000, **kw):
    """Headcount Memo deal: loyal win overall, with no saboteur, and with saboteurs present."""
    cfg = dict(FINAL, **kw); d = MEMO[n]
    per = {k: run(n, k, games, **cfg) for k in d}
    win = {k: per[k]['loyal_win'] for k in d}
    pres = sum(d[k] * win[k] for k in d if k) / sum(d[k] for k in d if k)
    return dict(overall=sum(d[k] * win[k] for k in d), clean=win[0], with_sab=pres,
                wrongly_sent=sum(d[k] * per[k]['false_flags'] for k in d))

def set_mix(mix):
    global SUIT_MIX, POOL, MU
    SUIT_MIX = mix; POOL = [v for v, k in mix.items() for _ in range(k)]; MU = st.mean(ev(c) for c in POOL)

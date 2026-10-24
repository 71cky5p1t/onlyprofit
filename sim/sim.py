"""Monte Carlo simulator for Only Profit rules v0.1 (bot players, no talking)."""
import random, statistics as st, itertools, sys

V = 'V'  # volatile card: +2 or -2, coin flip at resolution
SUIT_MIX = {2: 3, 1: 5, 0: 4, -1: 6, -2: 4, V: 2}
STAMP_ADJ = {'Rec': 1.5, 'Risky': 0.0, 'Not': -2.0}
CLAIM = {'Rec': 2.5, 'Risky': 0.5, 'Not': -1.0}

def ev(c): return 0 if c == V else c
def evs(cards): return sum(ev(c) for c in cards)
MU = sum(ev(v) * n for v, n in SUIT_MIX.items()) / sum(SUIT_MIX.values())

class Deck:
    def __init__(self, rng, mix):
        self.rng, self.mix = rng, mix
        self.piles = [self._fresh() for _ in range(3)]
        self.discards = [[] for _ in range(3)]
    def _fresh(self):
        p = [v for v, n in self.mix.items() for _ in range(n)]
        self.rng.shuffle(p); return p
    def draw(self, s):
        if not self.piles[s]:
            self.piles[s] = self.discards[s]; self.discards[s] = []
            self.rng.shuffle(self.piles[s])
        return self.piles[s].pop()
    def draw3(self): return [self.draw(s) for s in range(3)]
    def discard(self, cards):
        for s, c in enumerate(cards): self.discards[s].append(c)

def plans(I, D):
    """Yield (cost, proposal, handover, redeal) for every legal work plan without redeal."""
    yield 0, I[:], D[:], False
    for s in range(3):
        p, h = I[:], D[:]; p[s], h[s] = D[s], I[s]
        yield 1, p, h, False
    for a, b in itertools.combinations(range(3), 2):
        p, h = I[:], D[:]
        for s in (a, b): p[s], h[s] = D[s], I[s]
        yield 3, p, h, False

def best_plan(I, D, score):
    return max(plans(I, D), key=lambda x: (score(x[1], x[2]), -x[0]))

def work(player, I, D, deck, rnd, cfg, rng):
    """Returns envelope dict and handover cards."""
    sab = player['sab']
    mode = 'loyal'
    if sab:
        strat = cfg['sab_strat']
        if strat == 'blatant' or (strat == 'patient' and rnd >= cfg['patient_from']):
            mode = 'sabotage'
        elif strat == 'poisoner':
            mode = 'poison'
    h = cfg['handover_weight']
    if mode == 'loyal':   score = lambda p, ho: evs(p) + h * evs(ho)
    elif mode == 'poison': score = lambda p, ho: evs(p) - 1.0 * evs(ho)
    else:                  score = lambda p, ho: -evs(p)
    cost, prop, hand, _ = best_plan(I, D, score)
    tokens = cfg['tokens'] - cost
    # redeal: estimate by sampling fresh draws (bot can't see them in advance)
    if cfg['allow_redeal'] and mode != 'sabotage':
        samples = [best_plan([rng.choice(SAMPLE_POOL) for _ in range(3)], D, score) for _ in range(12)]
        sample_val = st.mean(score(p, ho) for c, p, ho, _ in samples if c <= 1) if any(c <= 1 for c, *_ in samples) else -99
        if sample_val > score(prop, hand) + 0.25:
            R = deck.draw3(); deck.discard(I)
            opts = [x for x in plans(R, D) if x[0] <= 1]
            cost, prop, hand, _ = max(opts, key=lambda x: (score(x[1], x[2]), -x[0]))
            tokens = cfg['tokens'] - 2 - cost
            player['stats']['redeals'] += 1
    v = evs(prop)
    if mode == 'sabotage':
        stamp = 'Rec' if v < 0 else rng.choice(['Rec', 'Risky'])
        order = sorted(range(3), key=lambda s: -ev(prop[s]))
        reveal = [s for s in order if ev(prop[s]) > 0][:tokens]
    else:
        stamp = 'Rec' if v >= 2 else ('Risky' if v >= 0 else 'Not')
        order = sorted(range(3), key=lambda s: -ev(prop[s]))
        reveal = [s for s in order if ev(prop[s]) > 0][:tokens] if v >= 1 else []
    player['stats']['reveals'] += len(reveal)
    player['stats']['tokens_spent'] += cfg['tokens'] - tokens + len(reveal)
    return dict(author=player['id'], cards=prop, stamp=stamp, revealed=set(reveal), audited=False), hand

def estimate(env):
    if env['audited']: return evs(env['cards'])
    known = sum(ev(env['cards'][s]) for s in env['revealed'])
    hidden = 3 - len(env['revealed'])
    return known + hidden * MU + STAMP_ADJ[env['stamp']]

def play(n, n_sab, cfg, rng):
    deck = Deck(rng, cfg['mix'])
    players = [dict(id=i, sab=False, stats=dict(reveals=0, redeals=0, tokens_spent=0)) for i in range(n)]
    for p in rng.sample(players, n_sab): p['sab'] = True
    n_dept = n
    handovers = [deck.draw3() for _ in range(n_dept)]  # Q1 legacy policies
    ceo_order = list(range(n)); rng.shuffle(ceo_order)
    profit = 0; approved_log = []; handover_vals = []
    for rnd in range(1, cfg['rounds'] + 1):
        assign = list(range(n)); rng.shuffle(assign)  # player i runs dept assign[i]
        ceo = players[ceo_order[(rnd - 1) % n]]
        envs, new_hand = [], [None] * n_dept
        for i, p in enumerate(players):
            d = assign[i]
            I, D = handovers[d], deck.draw3()
            e, ho = work(p, I, D, deck, rnd, cfg, rng)
            envs.append(e); new_hand[d] = ho; handover_vals.append(evs(ho))
        # audit: table opens the most-hyped envelope that still hides cards
        if cfg['audit']:
            cand = [e for e in envs if len(e['revealed']) < 3]
            if cand: max(cand, key=lambda e: (estimate(e), 3 - len(e['revealed'])))['audited'] = True
        if cfg['perfect_ceo']:
            pick = max(envs, key=lambda e: evs(e['cards']))
        elif ceo['sab']:
            seen = lambda e: evs(e['cards']) if e['author'] == ceo['id'] else estimate(e)
            top = max(estimate(e) for e in envs)
            deniable = [e for e in envs if estimate(e) >= top - cfg['sab_ceo_slack']]
            pick = min(deniable, key=lambda e: (evs(e['cards']) if (e['audited'] or e['author'] == ceo['id']) else estimate(e)))
        else:
            pick = max(envs, key=lambda e: evs(e['cards']) if e['author'] == ceo['id'] else estimate(e))
        actual = sum(rng.choice((2, -2)) if c == V else c for c in pick['cards'])
        profit += actual
        approved_log.append((pick['author'], pick['stamp'], actual, ceo['id']))
        if cfg['handover_mode'] == 'rejected':
            # rejected envelopes pass on intact; approved dept inherits the leftovers
            for i, e in enumerate(envs):
                d = assign[i]
                if e is pick: deck.discard(e['cards'])
                else: deck.discard(new_hand[d]); new_hand[d] = e['cards']
        else:
            for e in envs: deck.discard(e['cards'])
        handovers = new_hand
    win = profit >= cfg['target']
    # naive end-of-game deduction: who over-claimed most on approved envelopes?
    sus = [0.0] * n
    for a, stamp, act, c in approved_log: sus[a] += CLAIM[stamp] - act
    top = max(range(n), key=lambda i: (sus[i], rng.random()))
    return dict(profit=profit, win=win, sab_ids=[p['id'] for p in players if p['sab']],
                top_suspect=top, top_is_sab=players[top]['sab'], handover_mean=st.mean(handover_vals),
                reveals=sum(p['stats']['reveals'] for p in players) / (n * cfg['rounds']),
                redeals=sum(p['stats']['redeals'] for p in players) / (n * cfg['rounds']),
                sab_approved=sum(1 for a, *_ in approved_log if players[a]['sab']))

SAMPLE_POOL = [v for v, k in SUIT_MIX.items() for _ in range(k)]

BASE = dict(rounds=5, target=8, tokens=3, handover_weight=0.0, allow_redeal=True, audit=True,
            perfect_ceo=False, sab_strat='blatant', patient_from=3, sab_ceo_slack=2.0, mix=SUIT_MIX, handover_mode='leftover')

def run(n, n_sab, games=4000, seed=1, **over):
    cfg = dict(BASE, **over); rng = random.Random(seed)
    res = [play(n, n_sab, cfg, rng) for _ in range(games)]
    profits = [r['profit'] for r in res]
    out = dict(win=sum(r['win'] for r in res) / games, mean=st.mean(profits), sd=st.pstdev(profits),
               p10=sorted(profits)[games // 10], p90=sorted(profits)[9 * games // 10],
               reveals=st.mean(r['reveals'] for r in res), redeals=st.mean(r['redeals'] for r in res),
               handover=st.mean(r['handover_mean'] for r in res))
    if n_sab:
        out['suspect_hit'] = sum(r['top_is_sab'] for r in res) / games
        out['sab_approved'] = st.mean(r['sab_approved'] for r in res)
    out['profits'] = profits
    return out

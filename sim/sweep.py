import sim, json
G = 3000
def row(label, n, ns, **kw):
    r = sim.run(n, ns, G, **kw); r.pop('profits')
    print(f"{label:<42}", {k: round(v, 2) for k, v in r.items()}, flush=True)
    return r
print("== target sweep, 4p, base rules ==")
for t in (8, 12, 14, 16, 18):
    row(f"t={t} 0 sab", 4, 0, target=t); row(f"t={t} 1 sab blatant", 4, 1, target=t)
print("== saboteur strategies, 4p, t=14 ==")
for s in ('blatant', 'patient', 'poisoner'):
    row(f"{s}", 4, 1, target=14, sab_strat=s)
print("== redeal / handover ==")
row("no redeal, 0 sab t=14", 4, 0, target=14, allow_redeal=False)
row("no redeal, 1 sab t=14", 4, 1, target=14, allow_redeal=False)
row("no redeal, poisoner t=14", 4, 1, target=14, allow_redeal=False, sab_strat='poisoner')
row("steward loyals h=0.5, 0 sab", 4, 0, target=14, handover_weight=0.5)
row("steward loyals h=0.5, 1 sab", 4, 1, target=14, handover_weight=0.5)
print("== audit / info ==")
row("no audit 1 sab", 4, 1, target=14, audit=False)
row("perfect CEO 0 sab (ceiling)", 4, 0, target=14, perfect_ceo=True)
print("== player counts ==")
for n, ns in ((6, 0), (6, 1), (6, 2), (8, 0), (8, 1), (8, 2)):
    row(f"{n}p {ns} sab t=14", n, ns, target=14)

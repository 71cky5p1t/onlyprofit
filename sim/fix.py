import sim
G = 3000
def row(label, n, ns, **kw):
    r = sim.run(n, ns, G, **kw); r.pop('profits')
    print(f"{label:<40}", {k: round(v, 2) for k, v in r.items()}, flush=True)
for t in (14, 16, 18, 20):
  for ns, s in ((0, 'blatant'), (1, 'blatant'), (1, 'patient'), (1, 'poisoner')):
    row(f"REJ t={t} {ns} {s}", 4, ns, target=t, handover_mode='rejected', sab_strat=s)
row("REJ no redeal 0 sab t=16", 4, 0, target=16, handover_mode='rejected', allow_redeal=False)
row("REJ no redeal 1 sab t=16", 4, 1, target=16, handover_mode='rejected', allow_redeal=False)
for n, ns in ((6, 1), (6, 2), (8, 2), (8, 0)):
    row(f"REJ {n}p {ns} sab t=16", n, ns, target=16, handover_mode='rejected', sab_strat='patient')

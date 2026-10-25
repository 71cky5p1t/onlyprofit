# python3 build_sfx.py [name...] -> ../sfx/*.mp3 (+ WAV in ../wav/sfx)
import os, sys, shutil
import foley as F
from score import write
from stings import STINGS

FOLEY = {
  'desk-tap': (F.tap, .45), 'desk-card-deal': (F.card_deal, .5), 'desk-card-flip': (F.card_flip, .5),
  'desk-card-drop': (F.card_drop, .65), 'desk-stapler': (F.stapler, .8), 'desk-sticker': (F.sticker, .6),
  'desk-stamp': (F.stamp, .95), 'desk-sign': (F.sign, .6),
  'paper-pull': (F.paper_pull, .45), 'paper-shuffle': (F.paper_shuffle, .5),
  'paper-type-key': (F.type_key, .55), 'paper-typing': (F.typing, .55), 'paper-type-bell': (F.type_bell, .6),
  'clock-tick': (F.clock_tick, .45), 'clock-flip': (F.clock_flip, .6), 'clock-bell': (F.office_bell, .7),
  'clock-quitting-time': (F.quitting_time, .75), 'clock-yank': (F.clock_yank, .6), 'clock-hurry': (F.timer_hurry, .55),
  'calc-key': (F.adding_key, .6), 'calc-total': (F.adding_total, .8), 'cabinet-drawer': (F.drawer, .8),
}

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out, tmp = os.path.join(root, 'sfx'), os.path.join(root, 'wav', 'sfx')
for d in (out, tmp): os.makedirs(d, exist_ok=True)
for name in (sys.argv[1:] or list(FOLEY) + list(STINGS)):
  base = os.path.join(tmp, name)
  if name in FOLEY:
    fn, pk = FOLEY[name]
    write(F.stereo(F.room(fn(), .1)), base, peak=pk)
  else:
    write(STINGS[name](tmp), base, peak=.9)
  shutil.move(base + '.mp3', os.path.join(out, name + '.mp3'))
  print(name)

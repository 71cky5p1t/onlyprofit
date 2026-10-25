# python3 build.py [cue...] -> ../mid, ../mp3 (+ WAV in ../wav, git-ignored)
import os, sys, shutil
from score import render
from cues import CUES

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
for d in ('mid', 'mp3', 'wav'): os.makedirs(os.path.join(root, d), exist_ok=True)
for name in (sys.argv[1:] or CUES):
  song, loop, post = CUES[name]()
  base = os.path.join(root, 'wav', name)
  render(song, base, loop=loop, post=post)
  shutil.move(base + '.mid', os.path.join(root, 'mid', name + '.mid'))
  shutil.move(base + '.mp3', os.path.join(root, 'mp3', name + '.mp3'))
  print(name, 'loop' if loop else 'one-shot', f'{song.bpm} bpm')

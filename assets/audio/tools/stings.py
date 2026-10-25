# Riff-based stings; return stereo arrays
import os, numpy as np
from score import Song, synth, trim, SR
import foley as F

KICK, SNARE, CRASH, TIMP = 36, 38, 49, 47


def _r(s, tmp, name):
  return trim(synth(s, os.path.join(tmp, name)))


def _at(y, t, x, g=1.0):
  if x.ndim == 1: x = F.stereo(x)
  i = int(t * SR); n = max(len(y), i + len(x))
  out = np.zeros((n, 2)); out[:len(y)] += y; out[i:i + len(x)] += x * g
  return out


def approved(tmp):
  s = Song(160, 2, seed=21)
  s.track('xylo', 0, 13, vol=100, rev=50); s.track('brass', 1, 61, vol=104, rev=55)
  s.track('vibes', 2, 11, vol=90, rev=70); s.track('drums', 9, 0, vol=100, rev=40)
  for k, p in enumerate([63, 63, 66, 66]):
    s.note('xylo', k / 4, .2, p + 12, 90, jit=0); s.note('brass', k / 4, .2, p, 88, jit=0)
  s.chord('brass', 1, 1.5, [51, 58, 63, 67, 72], 108)
  s.chord('vibes', 1, 2, [75, 79, 82, 84], 96, spread=.03)
  s.note('drums', 1, .5, CRASH, 90); s.note('drums', 1, .2, KICK, 100)
  return _r(s, tmp, 'approved')


def rejected(tmp):
  # the riff's own descent, as a sad trombone
  s = Song(72, 2, seed=22)
  s.track('bone', 0, 57, vol=110, rev=45)
  for k, p in enumerate([54, 53, 52]):
    s.note('bone', k * .9, .85, p, 92 - k * 4, jit=0)
  s.note('bone', 2.7, 2.6, 51, 84, jit=0)
  for k in range(12):
    s.cc('bone', 2.9 + k * .2, 1, min(127, 20 + k * 10))
  return _r(s, tmp, 'rejected')


def overruled(tmp):
  s = Song(120, 2, seed=23)
  s.track('brass', 0, 61, vol=106, rev=50); s.track('low', 1, 48, vol=100, rev=55)
  s.track('timp', 2, TIMP, vol=110, rev=50)
  s.chord('brass', 1.6, .6, [39, 46, 51, 54], 112); s.chord('low', 1.6, 1.2, [27, 39], 110)
  s.note('timp', 1.6, 1, 39, 110)
  return _at(_r(s, tmp, 'overruled'), 0, F.room(F.gavel(), .2), 1.6)


def saboteur(tmp):
  s = Song(110, 3, seed=24)
  s.track('box', 0, 10, vol=96, rev=70); s.track('low', 1, 48, vol=108, rev=60)
  s.track('brass', 2, 61, vol=106, rev=55); s.track('timp', 3, TIMP, vol=112, rev=55)
  s.track('trem', 4, 44, vol=90, rev=70)
  for k, p in enumerate([75, 75, 78, 78, 77, 77, 76, 76]):
    s.note('box', k / 2, .45, p, 80, jit=0)
  for b, d in ((4, .4), (4.75, .4), (5.5, 2.5)):
    s.chord('brass', b, d, [39, 45, 51], 112); s.chord('low', b, d, [27, 33], 112); s.note('timp', b, d, 39, 115)
  s.chord('trem', 5.5, 2.5, [63, 69, 75], 90)
  return _r(s, tmp, 'saboteur')


def quarter_won(tmp):
  s = Song(168, 3, swing=.6, seed=25)
  s.track('brass', 0, 61, vol=104, rev=50); s.track('bass', 1, 32, vol=112, rev=25)
  s.track('vibes', 2, 11, vol=92, rev=65); s.track('drums', 9, 0, vol=104, rev=35)
  riff = [63, 63, 66, 66, 65, 65, 64, 64]
  for k, p in enumerate(riff):
    s.note('brass', k / 2, .4, p + 12, 100, jit=0); s.note('bass', k / 2, .4, p - 24, 100, jit=0)
    s.note('drums', k / 2, .1, SNARE, 60 + k * 6, jit=0)
  s.chord('brass', 4, 3, [51, 58, 63, 67, 72, 75], 115)
  s.chord('vibes', 4, 3, [75, 79, 82, 84, 87], 100, spread=.03)
  s.chord('bass', 4, 2, [27, 39], 115)
  s.note('drums', 4, .5, CRASH, 112); s.note('drums', 4, .2, KICK, 115)
  return _r(s, tmp, 'won')


def company_lost(tmp):
  # hold music, slowing down a phone line, then the line goes dead
  s = Song(84, 3, seed=26)
  s.track('flute', 0, 73, vol=96, rev=55); s.track('nylon', 1, 24, vol=90, rev=40); s.track('bass', 2, 32, vol=100, rev=30)
  for b, d, p in [(0, .5, 70), (.5, .5, 66), (1, .5, 65), (1.5, .5, 64), (2, 2.5, 63)]:
    s.note('flute', b, d, p, 84, jit=0)
  s.chord('nylon', 0, 1.5, [55, 60, 65, 70], 60, spread=.03); s.chord('nylon', 2, 2.5, [56, 61, 66, 71], 58, spread=.03)
  for b, p in ((0, 41), (1.5, 41), (2, 40), (3.5, 40)):
    s.note('bass', b, 1.2, p, 84, jit=0)
  y = _r(s, tmp, 'lost')
  m = F.phone(y.mean(1)); y = F.stereo(m / np.abs(m).max())
  return _at(y, len(y) / SR + .25, F.phone(F.busy_tone()) * .5, 1)


STINGS = {
  'sting-approved': approved, 'sting-rejected': rejected, 'sting-overruled': overruled,
  'sting-saboteur': saboteur, 'sting-quarter-won': quarter_won, 'sting-company-lost': company_lost,
}

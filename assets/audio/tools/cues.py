# One function per cue; each returns (song, loop, post)
import numpy as np
from score import Song, SR
from form import BASS, HARM, MINOR, VOICE, MEL, bar, strum_shape

KICK, STICK, SNARE, CLAP, CHH, PHH, OHH = 36, 37, 38, 39, 42, 44, 46
CRASH, RIDE, TOMS, MARACA, SHAKER, WBH, WBL = 49, 51, [50, 48, 47, 45, 43], 70, 82, 76, 77


def melody(s, tr, bars, up=0, vel=88, legato=0.95):
  for i in bars:
    for b, d, p in MEL[bar(i)]:
      s.note(tr, i * 4 + b, d * legato, p + up, vel + (6 if b % 1 == 0 else 0))


def chord_at(i, beat, minor=False):
  c = HARM[bar(i)][0 if beat < 2 else 1]
  return MINOR[c] if minor else c


def water_cooler():
  s = Song(152, 16, swing=0.64, seed=3)
  s.track('bass', 0, 32, vol=112, pan=60, rev=22)
  s.track('piano', 1, 0, vol=78, pan=46, rev=40)
  s.track('trumpet', 2, 59, vol=100, pan=78, rev=55)
  s.track('vibes', 3, 11, vol=96, pan=52, rev=60)
  s.track('drums', 9, 40, vol=100, rev=35)
  for i in range(16):
    t = i * 4
    for k, p in enumerate(BASS[bar(i)]):
      s.note('bass', t + k, 0.88, p, 98 if k % 2 == 0 else 84)
    if i >= 8 and i % 2 == 1:
      s.note('bass', t + 3.5, 0.3, BASS[bar(i + 1)][0], 55)
    if i % 2 == 0:
      for b, d in ((0, .6), (1.5, .4)):
        s.chord('piano', t + b, d, VOICE[chord_at(i, b)], 62)
      s.chord('piano', t + 3.5, .3, VOICE[chord_at(i, 3)], 56)
    else:
      s.chord('piano', t + .5, .5, VOICE[chord_at(i, 0)], 58)
      s.chord('piano', t + 2, 1.2, VOICE[chord_at(i, 2)], 66)
    for b in (0, 1, 1.5, 2, 3, 3.5):
      s.note('drums', t + b, .2, RIDE, 72 if b % 1 == 0 else 52)
    for b in (1, 3):
      s.note('drums', t + b, .2, PHH, 70)
    for b in range(4):
      s.note('drums', t + b, .2, KICK, 34)
    if s.rng.random() < .6:
      s.note('drums', t + s.rng.choice([.5, 1.5, 2.5]), .2, SNARE, 34)
    if i in (7, 15):
      for b in (2, 2 + 1/3, 2 + 2/3, 3, 3.5):
        s.note('drums', t + b, .2, SNARE, 60, jit=0)
  s.note('drums', 32, .5, CRASH, 62)
  melody(s, 'trumpet', range(8), vel=92)
  melody(s, 'vibes', range(8, 16), vel=92)
  return s, True, None


def strum_policy():
  s = Song(136, 16, swing=0.62, seed=5)
  s.track('guitar', 0, 26, vol=108, pan=42, rev=35, cho=20)
  s.track('bass', 1, 33, vol=100, pan=64, rev=20)
  s.track('celesta', 2, 8, vol=72, pan=74, rev=60)
  s.track('whistle', 3, 78, vol=104, pan=70, rev=65)
  s.track('drums', 9, 32, vol=88, rev=30)
  for i in range(16):
    t = i * 4
    for k, p in enumerate(BASS[bar(i)]):
      s.note('bass', t + k, 0.7, p, 92 if k % 2 == 0 else 80)
      shape = strum_shape(chord_at(i, k))
      notes = [p + 12 + (x - shape[0]) for x in shape]
      s.chord('guitar', t + k, .42, notes, 90 if k % 2 else 78, spread=.028)
      s.chord('guitar', t + k + .5, .12, notes[-3:][::-1], 38, spread=.018)
    for b in (1, 3):
      s.note('drums', t + b, .2, STICK, 78)
      s.note('drums', t + b, .2, PHH, 60)
    s.note('drums', t, .2, KICK, 58)
    s.note('drums', t + 2, .2, KICK, 48)
    for b in range(8):
      s.note('drums', t + b / 2, .1, SHAKER, 52 if b % 2 else 40)
  melody(s, 'celesta', range(8), up=12, vel=80)
  melody(s, 'whistle', range(8, 16), vel=96)
  melody(s, 'celesta', range(8, 16), up=12, vel=50)
  return s, True, None


def overcooked_shift():
  s = Song(168, 16, swing=0.58, seed=7)
  s.track('tuba', 0, 58, vol=112, pan=60, rev=20)
  s.track('organ', 1, 17, vol=78, pan=38, rev=30)
  s.track('marimba', 2, 12, vol=74, pan=92, rev=40)
  s.track('xylo', 3, 13, vol=96, pan=58, rev=45)
  s.track('brass', 4, 61, vol=92, pan=66, rev=45)
  s.track('accordion', 5, 21, bank=8, vol=66, pan=26, rev=40)
  s.track('drums', 9, 0, vol=104, rev=22)
  for i in range(16):
    t = i * 4
    for k, p in enumerate(BASS[bar(i)]):
      s.note('tuba', t + k, .42, p, 104 if k % 2 == 0 else 92)
      v = VOICE[chord_at(i, k)]
      s.chord('organ', t + k + .5, .22, v, 72)
      if i >= 8:
        s.chord('accordion', t + k + .5, .22, [x + 12 for x in v[1:]], 64)
    for e in range(8):
      v = VOICE[chord_at(i, e / 2)]
      arp = v + [v[0] + 12]
      s.note('marimba', t + e / 2, .4, arp[[0, 1, 2, 3, 4, 3, 2, 1][e]] + 12, 66 if e % 2 == 0 else 52)
    s.note('drums', t, .2, KICK, 100)
    s.note('drums', t + 2, .2, KICK, 92)
    if i % 2: s.note('drums', t + 2.5, .2, KICK, 76)
    for b in (1, 3):
      s.note('drums', t + b, .2, SNARE, 92)
      if i >= 8: s.note('drums', t + b, .2, CLAP, 70)
    for e in range(8):
      if not (i % 2 and e == 7):
        s.note('drums', t + e / 2, .1, CHH, 62 if e % 2 == 0 else 44)
    if i % 2: s.note('drums', t + 3.5, .4, OHH, 64)
    if i in (7, 15):
      for n in range(8):
        s.note('drums', t + 2 + n / 4, .1, TOMS[min(n // 2, 4)] if n < 6 else SNARE, 70 + n * 5, jit=0)
  for b in (0, 32):
    s.note('drums', b, .5, CRASH, 92)
  for i in (3, 7, 11):
    s.chord('brass', i * 4 + 2.5, .35, [x + 12 for x in VOICE['E6']], 96)
  s.chord('brass', 15 * 4 + 3.5, .4, [x + 12 for x in VOICE['Eb6']], 100)
  melody(s, 'xylo', range(8), up=12, vel=96)
  melody(s, 'brass', range(8, 16), vel=92, legato=.8)
  melody(s, 'xylo', range(8, 16), up=12, vel=64)
  return s, True, None


def minorise(i, pitch):
  # Eb6 bars go minor: G -> Gb, Gb -> F keeps the grace-note shape
  if HARM[bar(i)][0] != 'Eb6': return pitch
  return pitch - 1 if pitch % 12 in (6, 7) else pitch


def overtime():
  # Water Cooler after hours: minor, quicker, a clock ticking under it
  s = Song(172, 16, swing=0.62, seed=11)
  s.track('bass', 0, 32, vol=112, pan=60, rev=22)
  s.track('piano', 1, 0, vol=76, pan=46, rev=40)
  s.track('trumpet', 2, 59, vol=98, pan=78, rev=55)
  s.track('vibes', 3, 11, vol=80, pan=52, rev=60)
  s.track('trem', 4, 44, vol=58, pan=84, rev=70)
  s.track('drums', 9, 32, vol=96, rev=30)
  m = lambda c: {'Eb6': 'Ebm', 'E6': 'Em'}.get(c, c)
  for i in range(16):
    t = i * 4
    for k, p in enumerate(BASS[bar(i)]):
      s.note('bass', t + k, .86, p, 98 if k % 2 == 0 else 84)
    if i % 2 == 1:
      s.note('bass', t + 3.5, .3, BASS[bar(i + 1)][0], 52)
    if i % 2 == 0:
      for b, d in ((0, .5), (1.5, .4)):
        s.chord('piano', t + b, d, VOICE[m(chord_at(i, b))], 60)
    else:
      s.chord('piano', t + 2.5, .8, VOICE[m(chord_at(i, 2))], 62)
    for b in (0, 1, 1.5, 2, 3, 3.5):
      s.note('drums', t + b, .2, RIDE, 70 if b % 1 == 0 else 50)
    for b in (1, 3):
      s.note('drums', t + b, .2, PHH, 66)
    for b in range(4):
      s.note('drums', t + b, .2, KICK, 36)
      s.note('drums', t + b, .1, WBH if b % 2 == 0 else WBL, 44 if i < 8 else 54, jit=0)
    if s.rng.random() < .5:
      s.note('drums', t + s.rng.choice([1.5, 2.5, 3.5]), .2, SNARE, 40)
    if i >= 8:
      s.chord('trem', t, 3.95, [x + 12 for x in VOICE[m(chord_at(i, 0))]], 60)
  for i in range(8, 16):
    s.cc('trem', i * 4, 11, 70 + 7 * (i - 8))
  for i in (7, 15):
    for b in (2, 2 + 1/3, 2 + 2/3, 3, 3.5):
      s.note('drums', i * 4 + b, .2, SNARE, 62, jit=0)
  s.note('drums', 32, .5, CRASH, 60)
  for i in range(16):
    tr = 'trumpet' if i < 8 else 'vibes'
    for b, d, p in MEL[bar(i)]:
      s.note(tr, i * 4 + b, d * .9, minorise(i, p), 90)
      if i >= 8: s.note('trumpet', i * 4 + b, d * .6, minorise(i, p) - 12, 62)
  return s, True, None


def phone_line(y, song):
  # bars 1-8 sound like a phone line, bars 9-16 are "taken off hold"
  n = len(y); f = np.fft.rfftfreq(n, 1 / SR)
  m = y.mean(1)
  band = np.fft.irfft(np.fft.rfft(m) * ((f > 380) & (f < 3200)), n)
  band = np.tanh(band * 3) / 3
  band *= np.sqrt((m ** 2).mean() / max((band ** 2).mean(), 1e-9)) * 0.8
  w = np.zeros(n); h, xf = n // 2, int(.12 * SR)
  w[:h - xf] = 1; w[h - xf:h] = np.linspace(1, 0, xf); w[n - xf // 2:] = np.linspace(0, 1, xf // 2)
  return y * (1 - w)[:, None] + band[:, None] * w[:, None]


def hold_music():
  s = Song(120, 16, swing=0.5, seed=13)
  s.track('bass', 0, 32, vol=104, pan=60, rev=25)
  s.track('nylon', 1, 24, vol=98, pan=44, rev=40)
  s.track('flute', 2, 73, vol=92, pan=72, rev=65)
  s.track('vibes', 3, 11, vol=92, pan=56, rev=60)
  s.track('pad', 4, 49, vol=52, pan=64, rev=75)
  s.track('drums', 9, 0, vol=82, rev=35)
  for i in range(16):
    t = i * 4
    b4 = BASS[bar(i)]
    for b, d, p in ((0, 1.4, b4[0]), (1.5, .45, b4[1]), (2, 1.4, b4[2]), (3.5, .45, b4[3])):
      s.note('bass', t + b, d, p, 92 if d > 1 else 74)
    for b in ((0, 1.5, 3) if i % 2 == 0 else (1, 2.5)):
      s.chord('nylon', t + b, .5, VOICE[chord_at(i, b)], 64, spread=.02)
    for h in (0, 2):
      s.chord('pad', t + h, 1.95, [x + 12 for x in VOICE[chord_at(i, h)][1:]], 50)
    for b in ((0, 1.5, 3) if i % 2 == 0 else (1, 2)):
      s.note('drums', t + b, .1, STICK, 62)
    for b in (0, 1.5, 2, 3.5):
      s.note('drums', t + b, .2, KICK, 50)
    for e in range(8):
      s.note('drums', t + e / 2, .1, MARACA, 52 if e % 2 else 38)
  melody(s, 'flute', range(8), vel=84)
  melody(s, 'vibes', range(8, 16), vel=88)
  return s, True, phone_line


def stripe_wipe():
  s = Song(150, 3, swing=0.5, seed=17)
  s.track('xylo', 0, 13, vol=100, pan=58, rev=50)
  s.track('piano', 1, 0, vol=86, pan=46, rev=45)
  s.track('brass', 2, 61, vol=104, pan=62, rev=55)
  s.track('vibes', 3, 11, vol=90, pan=70, rev=70)
  s.track('bass', 4, 32, vol=112, pan=64, rev=25)
  s.track('drums', 9, 0, vol=104, rev=40)
  run = [63, 66, 65, 64, 67, 70, 69, 68, 71, 74, 73, 72]
  for k, p in enumerate(run):
    v = 70 + k * 3
    s.note('xylo', k / 4, .22, p + 12, v, jit=0)
    s.note('piano', k / 4, .22, p, v - 10, jit=0)
  for n in range(24):
    s.note('drums', n / 8, .1, SNARE, 30 + n * 3, jit=0, vj=0)
  s.chord('brass', 3, 1.75, [51, 58, 63, 67, 72, 75], 110)
  s.chord('vibes', 3, 2, [75, 79, 82, 84, 87], 100, spread=.03)
  s.chord('bass', 3, 1.5, [27, 39], 110)
  s.note('drums', 3, .5, CRASH, 110); s.note('drums', 3, .2, KICK, 110)
  s.note('bass', 5.5, .3, 39, 92, jit=0); s.note('bass', 6, .3, 39, 86, jit=0)
  return s, False, None


CUES = {
  '01-water-cooler': water_cooler,
  '02-strum-policy': strum_policy,
  '03-overcooked-shift': overcooked_shift,
  '04-q5-overtime': overtime,
  '05-hold-music': hold_music,
  '05-hold-music-clean': lambda: hold_music()[:2] + (None,),
  '06-stripe-wipe': stripe_wipe,
}

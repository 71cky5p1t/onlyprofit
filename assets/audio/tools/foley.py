# Procedural office foley: noise, filters, struck partials
import numpy as np
from scipy import signal
from score import SR

rng = np.random.default_rng(7)


def T(s): return np.arange(int(s * SR)) / SR
def noise(s): return rng.standard_normal(int(s * SR))
def dec(s, tau): return np.exp(-T(s) / tau)


def _f(x, kind, f, order=2):
  return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x)


def bp(x, lo, hi): return _f(x, 'bandpass', [lo, hi])
def lp(x, f): return _f(x, 'lowpass', f)
def hp(x, f): return _f(x, 'highpass', f)
def phone(x): return np.tanh(bp(x, 380, 3200) * 2.5)


def sweep(x, f0, f1, width=0.5):
  # band-pass whose centre glides f0 -> f1 (log), via STFT mask
  f, t, Z = signal.stft(x, SR, nperseg=512)
  c = np.geomspace(f0, f1, len(t))
  mask = np.exp(-(np.log((f[:, None] + 1) / c[None, :]) / width) ** 2)
  return signal.istft(Z * mask, SR, nperseg=512)[1][:len(x)]


def click(s=.004, lo=2000, hi=8000):
  return bp(noise(s), lo, hi) * dec(s, s / 4)


def tone(f, s, tau, parts=((1, 1),)):
  t = T(s)
  return sum(a * np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6)) * np.exp(-t / (tau / r ** .5)) for r, a in parts)


def bell(f, s=1.2):
  return tone(f, s, .5, ((1, 1), (2.0, .45), (2.76, .55), (5.4, .22), (8.93, .1))) * (1 - np.exp(-T(s) / .001))


def thump(f0, f1, s, tau):
  t = T(s); fr = f1 + (f0 - f1) * np.exp(-t / .02)
  return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / tau)


def hump(n, a=.5, b=1.5):
  x = np.linspace(0, 1, n); e = x ** a * (1 - x) ** b
  return e / e.max()


def mix(parts, s=None):
  # parts: (time, signal, gain)
  end = max(int(t * SR) + len(x) for t, x, _ in parts)
  out = np.zeros(max(end, int((s or 0) * SR)))
  for t, x, g in parts:
    i = int(t * SR); out[i:i + len(x)] += x * g
  return out


def room(x, amt=.12, size=.3):
  ir = lp(noise(size), 4000) * dec(size, size / 5); ir /= np.abs(ir).sum() ** .5 * 6
  x = np.pad(x, (0, len(ir)))
  return x + amt * signal.fftconvolve(x, ir)[:len(x)]


def stereo(x, width=.0004):
  d = int(width * SR)
  return np.stack([x, np.concatenate([np.zeros(d), x[:-d or None]]) * .97 + x * .03], 1)


# desk
def tap(): return mix([(0, click(.004, 1500, 6000), .6), (0, tone(1150, .04, .008), .4)])

def card_flip():
  n = .09; x = sweep(noise(n), 900, 5000) * np.sin(np.pi * T(n) / n) ** 2
  return mix([(0, x, 1), (.085, click(.003, 3000, 9000), .4)])

def card_deal():
  n = .16; x = bp(noise(n), 600, 4500) * hump(len(T(n)))
  return mix([(0, x, .8), (.15, thump(220, 120, .05, .015), .5), (.15, click(), .3)])

def card_drop():
  return mix([(0, thump(180, 90, .08, .02), 1), (0, lp(noise(.05), 2500) * dec(.05, .008), .6)])

def stapler():
  ring = tone(2300, .2, .03, ((1, 1), (1.61, .7), (2.22, .4)))
  return mix([(0, click(.003, 3000, 10000), .6), (0, ring, .25), (.07, thump(120, 60, .14, .03), 1),
              (.07, bp(noise(.03), 1000, 5000) * dec(.03, .006), .8), (.075, tone(1700, .25, .08), .12)])

def sticker():
  n = .14; peel = sweep(noise(n), 1500, 7000, .4) * (T(n) / n) ** 2
  return mix([(0, peel, .7), (.17, thump(150, 100, .06, .015), .8), (.17, lp(noise(.03), 2000) * dec(.03, .006), .5)])

def stamp():
  rat = [(.02 + rng.uniform(0, .06), click(.002, 3000, 9000), .15) for _ in range(4)]
  return mix([(0, click(.003, 800, 3000), .4), (0, thump(110, 45, .3, .06), 1),
              (0, lp(noise(.12), 900) * dec(.12, .02), .7)] + rat)

def sign():
  n = .85; env = np.zeros(len(T(n))); t = 0
  while t < n - .12:
    w = int(rng.uniform(.05, .11) * SR); i = int(t * SR)
    env[i:i + w] += np.hanning(w)[:len(env) - i] * rng.uniform(.5, 1)
    t += rng.uniform(.05, .1)
  ink = (bp(noise(n), 2500, 7000) + .5 * bp(noise(n), 900, 2000)) * env
  return mix([(0, ink, .35), (.95, bell(1244.5, 1.1), .5)])


# paper
def paper_pull():
  n = .35; grain = 1 + .6 * lp(noise(n), 40) / .05
  return bp(noise(n), 400, 5000) * hump(len(T(n)), .3, 2) * np.clip(grain, .2, 2)

def paper_shuffle():
  return mix([(i * .11 + rng.uniform(0, .03), paper_pull()[:int(.22 * SR)], .7 + .3 * rng.random()) for i in range(4)])

def type_key():
  return mix([(0, click(.004, 2000, 9000), .7), (0, tone(2800, .05, .012, ((1, 1), (1.46, .6))), .25),
              (0, thump(300, 200, .03, .008), .4)])

def typing():
  t, parts = 0, []
  for _ in range(7):
    parts.append((t, type_key(), .7 + .3 * rng.random())); t += rng.uniform(.08, .17)
  return mix(parts)

def type_bell():
  rat = [(.18 + .32 * (1 - (1 - k / 10) ** 1.6), click(.003, 1500, 6000), .35) for k in range(10)]
  return mix([(0, bell(2489, 1.1), .6)] + rat)


# clock
def clock_tick():
  tick = mix([(0, click(.003, 3000, 8000), .6), (0, tone(2600, .03, .004), .4)])
  tock = mix([(0, click(.003, 1500, 5000), .6), (0, tone(1700, .03, .005), .4)])
  return mix([(0, tick, 1), (.5, tock, 1)], 1.0)

def clock_flip():
  return mix([(0, click(.003, 2000, 7000), .5), (.04, thump(140, 80, .1, .02), 1), (.04, bp(noise(.04), 1000, 3000) * dec(.04, .01), .5)])

def office_bell():
  n = 1.3; t = T(n)
  ring = sum(a * np.sin(2 * np.pi * 1100 * r * t) for r, a in ((1, 1), (2.4, .5), (3.9, .25)))
  ham = np.abs(np.sin(np.pi * 18 * t)) ** 3
  on = np.minimum(1, t / .01) * np.where(t < 1.0, 1, np.exp(-(t - 1.0) / .12))
  return ring * (.35 + .65 * ham) * on + .05 * hp(noise(n), 3000) * ham * on

def quitting_time():
  n = 2.0; t = T(n)
  bend = np.where(t < .3, -3 * (1 - t / .3) ** 2, 0) + np.where(t > 1.7, -2 * ((t - 1.7) / .3) ** 2, 0)
  vib = .08 * np.sin(2 * np.pi * 5.5 * t)
  x = 0
  for f, a in ((622.3, 1), (784, .8), (932.3, .7), (623.5, .5)):
    fr = f * 2 ** ((bend + vib) / 12); x = x + a * np.sin(2 * np.pi * np.cumsum(fr) / SR)
  env = np.minimum(1, t / .08) * np.minimum(1, (n - t) / .25)
  return (x + .4 * bp(noise(n), 500, 2500)) * env

def clock_yank():
  n = .35; x = sweep(noise(n), 300, 3500, .45) * hump(len(T(n)), .8, .8)
  return mix([(0, x, 1), (.33, click(.004, 1000, 4000), .5), (.33, thump(160, 100, .06, .015), .4)])

def timer_hurry():
  t, parts, gap = 0, [], .4
  for k in range(8):
    parts.append((t, mix([(0, click(.003, 2500, 8000), .6), (0, tone(1800 + k * 90, .03, .005), .5)]), .8 + k * .03))
    t += gap; gap *= .82
  return mix(parts)


# calculator, filing cabinet
def adding_key():
  return mix([(0, thump(250, 150, .05, .012), .8), (0, click(.004, 1000, 4000), .6), (0, tone(900, .08, .02), .12)])

def drawer_ching():
  return mix([(0, thump(90, 60, .25, .05), .8), (0, bell(2489, 1.2), .5), (.03, bell(1865, 1.2), .45),
              (0, bp(noise(.1), 1500, 6000) * dec(.1, .03), .3)])

def adding_total():
  n = .5; t = T(n)
  motor = lp(np.sign(np.sin(2 * np.pi * 120 * t)), 600) * hump(len(t), .2, .4) * .25
  rat = [(k / 28, click(.003, 1200, 5000), .5) for k in range(int(n * 28))]
  return mix([(0, motor, 1)] + rat + [(.58, drawer_ching(), 1)])

def drawer():
  n = .5; t = T(n)
  roll = lp(noise(n), 600) * (1 + .6 * np.sin(2 * np.pi * 35 * t)) * hump(len(t), .3, .2)
  stop = mix([(0, thump(100, 60, .15, .04), 1), (0, tone(600, .4, .1, ((1, 1), (2.42, .6))), .25)])
  return mix([(0, roll, .8), (.48, stop, 1)])

def gavel():
  knock = lambda: mix([(0, thump(200, 120, .08, .012), 1), (0, click(.003, 1500, 5000), .5), (0, tone(850, .06, .015), .3)])
  return mix([(0, knock(), .8), (.32, knock(), 1)])

def busy_tone(n=3):
  beep = np.sin(2 * np.pi * 425 * T(.375)) * np.minimum(1, np.minimum(T(.375), .375 - T(.375)) / .005)
  return mix([(k * .75, beep, .5) for k in range(n)])

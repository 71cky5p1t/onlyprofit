# Tiny score -> MIDI -> fluidsynth -> loopable WAV/MP3
import random, subprocess, os
import numpy as np, mido
from scipy.io import wavfile

SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
SR = 44100
PPQ = 480


class Song:
  def __init__(s, bpm, bars, swing=0.5, seed=1):
    s.bpm, s.bars, s.swing = bpm, bars, swing
    s.tracks, s.rng = {}, random.Random(seed)

  def track(s, name, ch, prog, bank=0, vol=100, pan=64, rev=40, cho=0, swing=None):
    s.tracks[name] = dict(ch=ch, prog=prog, bank=bank, vol=vol, pan=pan, rev=rev, cho=cho,
                          swing=s.swing if swing is None else swing, ev=[], cc=[])

  def _sw(s, beat, sw):
    b = int(beat // 1); f = beat - b
    f = f / 0.5 * sw if f < 0.5 else sw + (f - 0.5) / 0.5 * (1 - sw)
    return b + f

  def note(s, tr, beat, dur, pitch, vel=80, jit=0.012, vj=6):
    t = s.tracks[tr]; sw = t['swing']
    a, e = s._sw(beat, sw), s._sw(beat + dur, sw)
    j = s.rng.uniform(-jit, jit)
    v = max(1, min(127, int(vel + s.rng.uniform(-vj, vj))))
    t['ev'].append((a + j, max(e + j - 0.01, a + j + 0.02), int(pitch), v))

  def chord(s, tr, beat, dur, pitches, vel=70, spread=0.0):
    for i, p in enumerate(pitches):
      s.note(tr, beat + i * spread, dur, p, vel)

  def cc(s, tr, beat, num, val):
    s.tracks[tr]['cc'].append((beat, num, int(val)))

  def midi(s, path, tail_bars=2):
    mf = mido.MidiFile(ticks_per_beat=PPQ)
    meta = mido.MidiTrack(); mf.tracks.append(meta)
    meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(s.bpm)))
    end = (s.bars + tail_bars) * 4 * PPQ
    for name, t in s.tracks.items():
      tk = mido.MidiTrack(); mf.tracks.append(tk)
      tk.append(mido.MetaMessage('track_name', name=name))
      ch, raw = t['ch'], []
      if ch != 9:
        raw += [(0, 0, mido.Message('control_change', channel=ch, control=0, value=t['bank']))]
      for c, v in ((7, t['vol']), (10, t['pan']), (91, t['rev']), (93, t['cho']), (11, 127)):
        raw.append((0, 0, mido.Message('control_change', channel=ch, control=c, value=v)))
      raw.append((0, 1, mido.Message('program_change', channel=ch, program=t['prog'])))
      for b, n, v in t['cc']:
        raw.append((max(2, int(b * PPQ)), 1, mido.Message('control_change', channel=ch, control=n, value=v)))
      for a, e, p, v in t['ev']:
        raw.append((max(2, int(a * PPQ)), 2, mido.Message('note_on', channel=ch, note=p, velocity=v)))
        raw.append((max(3, int(e * PPQ)), 0, mido.Message('note_off', channel=ch, note=p, velocity=0)))
      raw.sort(key=lambda r: (r[0], r[1]))
      now = 0
      for tick, _, m in raw:
        m.time = tick - now; now = tick; tk.append(m)
      tk.append(mido.MetaMessage('end_of_track', time=max(0, end - now)))
    mf.save(path)

  def loop_len(s):
    return int(round(s.bars * 4 * 60 / s.bpm * SR))


def synth(song, base, gain=0.45):
  mid, raw = base + '.mid', base + '.raw.wav'
  song.midi(mid)
  subprocess.run(['fluidsynth', '-ni', '-q', '-g', str(gain), '-r', str(SR), '-R', '1', '-C', '1',
                  '-o', 'synth.reverb.room-size=0.55', '-o', 'synth.reverb.level=0.7',
                  '-o', 'synth.reverb.width=0.8', '-F', raw, SF2, mid],
                 check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
  sr, y = wavfile.read(raw); os.remove(raw)
  return y.astype(np.float32) / 32768.0


def trim(y, floor=0.01, fade=0.25):
  nz = np.where(np.abs(y).max(1) > np.abs(y).max() * floor)[0]
  y = y[:nz[-1] + 1]
  f = min(len(y), int(fade * SR)); y[-f:] *= np.linspace(1, 0, f)[:, None]
  return y


def write(y, base, rms=0.2, peak=None):
  # level-match by RMS (or peak for short SFX), soft-clip, write WAV + MP3
  y = y * (rms / np.sqrt((y ** 2).mean())) if peak is None else y * (peak / np.abs(y).max())
  y = 0.95 * np.tanh(y / 0.95)
  wav = base + '.wav'
  wavfile.write(wav, SR, (y * 32767).astype(np.int16))
  subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '192k', base + '.mp3'], check=True)
  return wav


def render(song, base, loop=True, post=None, gain=0.45):
  y = synth(song, base, gain)
  if loop:
    L = song.loop_len()
    y = np.pad(y, ((0, max(0, 2 * L - len(y))), (0, 0)))
    out = y[:L].copy(); tail = y[L:2 * L]
    out[:len(tail)] += tail
    y = out
  else:
    y = trim(y)
  if post: y = post(y, song)
  return write(y, base)

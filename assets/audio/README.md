# Audio

Generated soundtrack sketches built on Joel's riff (D♯ D♯ F♯ F♯ F F E E, written in E♭).

- `tools/` composes each cue in Python and renders it through fluidsynth.
  - `form.py` riff, 8-bar form, voicings, melody
  - `cues.py` one arrangement per cue
  - `score.py` score → MIDI → WAV/MP3, folds the reverb tail so loops are seamless
- `mid/` MIDI for each cue, `mp3/` rendered audio. WAVs go to `wav/` (ignored).

Rebuild: `apt-get install fluidsynth fluid-soundfont-gm ffmpeg`, `pip install numpy scipy mido`, then `python3 tools/build.py [cue]`.

| Cue | Tempo | Use |
| --- | --- | --- |
| 01-water-cooler | 152 swing | main theme, Pitch |
| 02-strum-policy | 136 swing | Work desk |
| 03-overcooked-shift | 168 shuffle | busy loop |
| 04-q5-overtime | 184 minor | final quarter |
| 05-hold-music | 120 bossa | lobby |
| 06-stripe-wipe | stinger | phase transitions |

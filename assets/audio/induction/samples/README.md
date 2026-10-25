# Induction voice samples

Model: `mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-4bit` (mlx-audio 0.6.0), run locally on the Mac mini from `~/Coding/Joel Archive/work/qwen-voice`.
Settings: `lang_code="english"`, temperature 0.7, max_tokens 600, seed reset before each line.
Post: trim silence to 80 ms each end, two-pass loudnorm I=-16 TP=-1.5 (linear), MP3 44.1 kHz mono 128k.

| Take | Seed | Prompt |
|---|---|---|
| A Training tape | 1001 | A middle-aged Australian man narrating a 1980s corporate training video. Warm, brisk, mid-range, relentlessly cheerful but completely deadpan. Clear studio recording, close mic, no music. |
| B HR manager | 2002 | An Australian woman in her forties, a calm, polished HR manager reading a staff induction. Pleasant, unhurried, faintly condescending, completely deadpan. Clear studio recording, close mic. |
| C Slow and grave | 3003 | An older Australian man with a low, measured voice, like a government safety announcement. Slow, serious, very dry. Clear studio recording, close mic. |

VoiceDesign creates the voice fresh on every call, so the same seed and prompt does not guarantee the same speaker on every line. Once a take is chosen, clone it with the Base model to keep the voice consistent.

Generate (WAVs to `<dir>`, then encode with ffmpeg):

```
"~/Coding/Joel Archive/work/qwen-voice/venv/bin/python" generate.py <dir>
```

# Ocker narrator auditions

Text: the first three narrator lines from `src/explainer/00-lessons.js` (welcome, goal, saboteurs), recorded as one take.

Qwen3-TTS 1.7B VoiceDesign 4-bit via mlx-audio 0.6.0, local. temperature 0.7, max_tokens 1200.
Post: atempo 1.12, trim end silence to 80 ms, loudnorm I=-16 TP=-1.5, then `tools/vo/tape.sh`.

| Take | Seed | Length | Mean F0 | Prompt |
|---|---|---|---|---|
| O1 | 4001 | 31.2 s | ~87 Hz | A middle-aged man with a broad, thick, full-ocker Australian accent, like an outback publican reading a 1980s corporate training video. Flat nasal vowels, lazy drawl, completely deadpan and unimpressed. Brisk pace. Close mic, studio recording. |
| O2 | 4002 | 27.2 s | ~174 Hz | A gruff Australian tradie foreman in his fifties with a very broad ocker accent, reading a staff induction he clearly thinks is rubbish. Dry, laconic, deadpan, brisk. Close mic, studio recording. |
| O3 | 4003 | 26.0 s | ~128 Hz | An older Australian man with a low, measured voice and a very broad, strong ocker accent, like a country-radio safety announcement. Serious, very dry, flat vowels. Steady but brisk pace. Close mic, studio recording. |

Whisper base.en: all three word for word.

Model: `mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-4bit` (mlx-audio 0.6.0, local), take C prompt, seed 3003 (3103 for the lines in `RESEED`). Base-model cloning from `../samples/C-welcome.mp3` was tried (`MODE=clone`) and dropped: pitch drifted off C and pace ran ~30% fast.
Tempo: ffmpeg `atempo=1.12` (pitch-preserving), then 80 ms silence trim, two-pass loudnorm I=-16 TP=-1.5, MP3 44.1 kHz mono 128k.
Run: `"~/Coding/Joel Archive/work/qwen-voice/venv/bin/python" generate.py <wav_dir>` (all lines) or `... <wav_dir> id=seed ...`.

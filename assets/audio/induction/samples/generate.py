"""Induction voice samples: Qwen3-TTS VoiceDesign via mlx-audio, fully local."""
import os, sys, json, time, wave
from pathlib import Path

QWEN = Path(os.environ.get("QWEN_DIR", "/Users/bbd/Coding/Joel Archive/work/qwen-voice"))
os.environ["HF_HOME"] = str(QWEN / "hf-cache")
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

import numpy as np
import mlx.core as mx
from mlx_audio.tts.utils import load_model

WAV = Path(sys.argv[1])
WAV.mkdir(parents=True, exist_ok=True)

LINES = {
    "welcome": "Welcome aboard. Please enjoy this mandatory induction. Enjoyment is also mandatory.",
    "goal": "You've got five quarters to hit the profit target. Hit it, and everyone keeps their job. Probably.",
    "saboteurs": "Some of your colleagues may be quietly sinking the company. Maybe one. Maybe two. "
                 "Maybe nobody, and we're just like this.",
}
TAKES = {
    "A": (1001, "A middle-aged Australian man narrating a 1980s corporate training video. Warm, brisk, "
                "mid-range, relentlessly cheerful but completely deadpan. Clear studio recording, close mic, no music."),
    "B": (2002, "An Australian woman in her forties, a calm, polished HR manager reading a staff induction. "
                "Pleasant, unhurried, faintly condescending, completely deadpan. Clear studio recording, close mic."),
    "C": (3003, "An older Australian man with a low, measured voice, like a government safety announcement. "
                "Slow, serious, very dry. Clear studio recording, close mic."),
}

model = load_model(str(QWEN / "model"))
log = []
for take, (seed, instruct) in TAKES.items():
    for line, text in LINES.items():
        mx.random.seed(seed)
        t = time.perf_counter()
        audio = np.concatenate([np.asarray(r.audio).reshape(-1) for r in model.generate(
            text=text, instruct=instruct, lang_code="english",
            max_tokens=600, temperature=0.7, verbose=False)])
        gen = time.perf_counter() - t
        peak = float(np.max(np.abs(audio)))
        audio = np.clip(audio / max(1.0, peak / 0.98), -1, 1)
        with wave.open(str(WAV / f"{take}-{line}.wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
            w.writeframes((audio * 32767).astype("<i2").tobytes())
        log.append({"file": f"{take}-{line}", "seed": seed, "seconds": round(len(audio) / 24000, 2),
                    "gen_seconds": round(gen, 1), "peak": round(peak, 3)})
        print(json.dumps(log[-1]), flush=True)
        mx.clear_cache()
(WAV / "log.json").write_text(json.dumps(log, indent=2))

"""Induction VO, O2 tradie-foreman voice, Qwen3-TTS via mlx-audio, local only.
Each set (reel, stingers) is ONE take so the cadence holds across clips; cut.py splits it.
Usage: generate.py <wav_dir> [reel|stingers] [seed]   (default: both, seed 4012)"""
import os, re, sys, json, time, wave
from pathlib import Path

QWEN = Path(os.environ.get("QWEN_DIR", "/Users/bbd/Coding/Joel Archive/work/qwen-voice"))
os.environ["HF_HOME"] = str(QWEN / "hf-cache")
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

import numpy as np
import mlx.core as mx
from mlx_audio.tts.utils import load_model

ROOT = Path(__file__).resolve().parents[4]
SEED = 4012
INSTRUCT = ("A gruff Australian tradie foreman in his fifties with a very broad ocker accent, reading a staff induction "
            "he clearly thinks is rubbish. Dry, laconic, deadpan, brisk. Close mic, studio recording.")


def lines():
    """{set: [(clip id, text)]} from the lesson source and the stinger table."""
    src = (ROOT / "src/explainer/00-lessons.js").read_text()
    reel = re.findall(r"\['(\w+)', '[^']*', '((?:[^'\\]|\\.)*)', \d+\]", src)
    reel = [(f"vo-{i + 1:02d}-{k}", t.replace("\\'", "'")) for i, (k, t) in enumerate(reel)]
    md = (ROOT / "docs/how-to-play/script.md").read_text()
    stingers = [(k, t.strip()) for k, t in re.findall(r"^\| `vo-(j-[\w-]+)` \|[^|]*\| ([^|]+) \|", md, re.M)]
    return {"reel": reel, "stingers": stingers}


if __name__ == "__main__":
    wav_dir = Path(sys.argv[1]); wav_dir.mkdir(parents=True, exist_ok=True)
    sets = [sys.argv[2]] if len(sys.argv) > 2 else ["reel", "stingers"]
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else SEED
    all_lines = lines()
    model = load_model(str(QWEN / "model"))
    for name in sets:
        text = "\n\n".join(t for _, t in all_lines[name])
        mx.random.seed(seed)
        t = time.perf_counter()
        audio = np.concatenate([np.asarray(r.audio).reshape(-1) for r in model.generate(
            text=text, instruct=INSTRUCT, lang_code="english",
            max_tokens=3000, temperature=0.7, verbose=False)])
        audio = np.clip(audio / max(1.0, float(np.max(np.abs(audio))) / 0.98), -1, 1)
        with wave.open(str(wav_dir / f"{name}-{seed}.wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
            w.writeframes((audio * 32767).astype("<i2").tobytes())
        print(json.dumps({"set": name, "seed": seed, "raw_s": round(len(audio) / 24000, 2),
                          "gen_s": round(time.perf_counter() - t, 1)}), flush=True)
        mx.clear_cache()

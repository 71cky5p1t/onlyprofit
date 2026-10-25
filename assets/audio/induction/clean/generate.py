"""Induction VO in take C's voice, Qwen3-TTS via mlx-audio, local only.
Usage: [MODE=clone|design] generate.py <wav_dir> [id=seed ...]   (default: all lines, seed 3003)"""
import os, sys, json, time, wave, subprocess
from pathlib import Path

QWEN = Path(os.environ.get("QWEN_DIR", "/Users/bbd/Coding/Joel Archive/work/qwen-voice"))
os.environ["HF_HOME"] = str(QWEN / "hf-cache")
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

import numpy as np
import mlx.core as mx
from mlx_audio.tts.utils import load_model

HERE = Path(__file__).resolve().parent
REF = HERE.parent / "samples/C-welcome.mp3"
REF_TEXT = "Welcome aboard. Please enjoy this mandatory induction. Enjoyment is also mandatory."
SEED, TEMPO = 3003, 1.12
MODE = os.environ.get("MODE", "design")
RESEED = {"vo-05-policy": 3103, "vo-07-stamp": 3103, "j-fx-shield": 3103, "j-warning": 3103}
INSTRUCT = ("An older Australian man with a low, measured voice, like a government safety announcement. "
            "Slow, serious, very dry. Clear studio recording, close mic.")

LINES = {
    "vo-01-welcome": REF_TEXT,
    "vo-02-goal": "You've got five quarters to hit the profit target. Hit it, and everyone keeps their job. Probably.",
    "vo-03-saboteurs": "Some of your colleagues may be quietly sinking the company. Maybe one. Maybe two. Maybe nobody, and we're just like this.",
    "vo-04-inherit": "Each quarter, you run a department. You inherit the last manager's work. It's yours now. Congratulations.",
    "vo-05-policy": "One Action. One Target. One Modifier. Read together, that's a policy. Add up the marks. A question mark is a coin toss.",
    "vo-06-overtime": "You'll draw some spares. Overtime hours buy you swaps, or show a card to the whole table. You get three hours. They're unpaid.",
    "vo-07-stamp": "Then stamp it. The pencil tick marks the honest answer. You can lie. You can also be put on a Performance Improvement Plan.",
    "vo-08-cover": "Dress it up with a cover page. Nobody knows who wrote what. That's the whole point.",
    "vo-09-ceo": "Each quarter, someone has a go as CEO, and picks one proposal from the pile.",
    "vo-10-board": "Everyone else is the Board. Ratify it, or open it up. If it's dodgy, a better one goes through instead. The CEO has some explaining to do.",
    "vo-11-approved": "Only the approved policy gets a name on it. Profit moves. Everyone acts like they saw it coming.",
    "vo-12-endgame": "After quarter five, the table names a saboteur. Get it right, and their damage is reversed. Get it wrong, and that's an unfair dismissal claim. Best record on the winning side is Employee of the Year.",
    "vo-13-signoff": "That concludes your induction. The clock starts now. Please look busy.",
    "j-rejected": "This one came back rejected. The sticky note says who wrote it. Use that responsibly.",
    "j-cleanup": "These are the leftovers from an approved policy. Somebody has to tidy up.",
    "j-fx-x2": "Retroactively doubles the other two cards. Mistakes included.",
    "j-fx-null": "Thoughts and Prayers cancels the other two. It's the thought that counts.",
    "j-fx-shield": "Per Legal's Advice, the other two can't lose money. Legal would like that in writing.",
    "j-fx-flip": "Without Consultation flips the other two. Up is down. Nobody was asked.",
    "j-investigate": "As CEO, you can check one person's stamp. Quietly.",
    "j-pip": "Someone's on a Performance Improvement Plan. We can't say why. From now on, the CEO can read their cover pages.",
    "j-warning": "Time for a Written Warning. Two of those, and you're stood down. Your department will run itself.",
    "j-overrule": "The Board has overruled the CEO. This will be discussed at length. Behind their back.",
    "j-designer": "You're the Designer. Next quarter's cover pages are your call.",
    "j-auditor": "You're the Auditor. You can see who wrote everything. Keep it to yourself.",
    "j-q5": "Final quarter. Whatever you've been planning, now's the time.",
}

FF = os.environ.get("FFMPEG", "ffmpeg")
TRIM = ("silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse,"
        "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse")


def encode(src, dst):
    pre = f"atempo={TEMPO},{TRIM},loudnorm=I=-16:TP=-1.5:LRA=11"
    out = subprocess.run([FF, "-nostdin", "-i", src, "-af", pre + ":print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = json.loads(out[out.rindex("{\n"):out.rindex("}") + 1])
    ln = (f"{pre}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run([FF, "-nostdin", "-loglevel", "error", "-y", "-i", src, "-af", ln,
                    "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", dst], check=True)


def ref_audio():
    pcm = subprocess.run([FF, "-nostdin", "-loglevel", "error", "-i", str(REF), "-f", "f32le",
                          "-ac", "1", "-ar", "24000", "-"], check=True, capture_output=True).stdout
    return mx.array(np.frombuffer(pcm, "<f4"))


wav_dir = Path(sys.argv[1]); wav_dir.mkdir(parents=True, exist_ok=True)
picks = dict(a.split("=") for a in sys.argv[2:]) or {k: RESEED.get(k, SEED) for k in LINES}
model = load_model(str(QWEN / ("base-model" if MODE == "clone" else "model")))
voice = ({"ref_audio": ref_audio(), "ref_text": REF_TEXT} if MODE == "clone" else {"instruct": INSTRUCT})
for lid, seed in picks.items():
    mx.random.seed(int(seed))
    t = time.perf_counter()
    audio = np.concatenate([np.asarray(r.audio).reshape(-1) for r in model.generate(
        text=LINES[lid], **voice, lang_code="english",
        max_tokens=900, temperature=0.7, verbose=False)])
    gen = time.perf_counter() - t
    audio = np.clip(audio / max(1.0, float(np.max(np.abs(audio))) / 0.98), -1, 1)
    wav = wav_dir / f"{lid}.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
        w.writeframes((audio * 32767).astype("<i2").tobytes())
    encode(str(wav), str(Path(os.environ.get("OUT", HERE)) / f"{lid}.mp3"))
    print(json.dumps({"id": lid, "seed": int(seed), "raw_s": round(len(audio) / 24000, 2),
                      "gen_s": round(gen, 1)}), flush=True)
    mx.clear_cache()

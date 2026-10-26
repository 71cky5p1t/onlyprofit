"""Splits one processed take into clips at the middle of each between-line silence, from Whisper word times.
Usage (faster-whisper venv): cut.py <take.wav> <set> <out_dir>   (set: reel | stingers)"""
import re, sys, json, difflib, subprocess
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel

sys.path.insert(0, str(Path(__file__).parent))
src = (Path(__file__).parent / "generate.py").read_text()
exec(src[src.index("ROOT ="):src.index("SEED =")]); exec(src[src.index("def lines"):src.index('if __name__')])

FF = "ffmpeg"
norm = lambda t: re.sub(r"[^a-z0-9' ]", " ", t.lower().replace("’", "'").replace("-", " ")).split()

take, name, out = sys.argv[1], sys.argv[2], Path(sys.argv[3])
L = lines()[name]
pcm = np.frombuffer(subprocess.run([FF, "-v", "error", "-i", take, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                                   capture_output=True, check=True).stdout, "<f4")
model = WhisperModel("base.en", device="cpu", compute_type="float32",
                     download_root="/Users/bbd/Coding/Joel Archive/work/video-models", local_files_only=True)
heard = [(w.word, w.start, w.end) for seg in model.transcribe(pcm, beam_size=5, language="en", word_timestamps=True)[0]
         for w in seg.words]
# whisper word -> its normalised tokens, each with the word's times
H = [(tok, s, e) for w, s, e in heard for tok in norm(w)]
ref, owner = [], []
for k, (_, t) in enumerate(L):
    toks = norm(t); ref += toks; owner += [k] * len(toks)
sm = difflib.SequenceMatcher(None, ref, [h[0] for h in H], autojunk=False)
span = {}
for a, b, n in sm.get_matching_blocks():
    for j in range(n):
        k = owner[a + j]; s, e = H[b + j][1], H[b + j][2]
        lo, hi = span.get(k, (s, e)); span[k] = (min(lo, s), max(hi, e))
dur = len(pcm) / 16000
log = subprocess.run([FF, "-i", take, "-af", "silencedetect=noise=-40dB:d=0.08", "-f", "null", "-"], capture_output=True, text=True).stderr
quiet = [(float(a), float(b)) for a, b in re.findall(r"silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)", log)]


def cut_at(k):
    # whisper's word edges are loose: take the longest real silence near the line break
    e, s = span[k][1], span[k + 1][0]
    near = [q for q in quiet if q[1] > min(e, s) - 0.25 and q[0] < max(e, s) + 0.25]
    if not near: return (e + s) / 2, None
    a, b = min(near, key=lambda q: abs((q[0] + q[1]) / 2 - (e + s) / 2))
    return (a + b) / 2, (a, b)


snaps = [cut_at(k) for k in range(len(L) - 1)]
cuts = [0.0] + [c for c, _ in snaps] + [dur]
diffs = [(op, " ".join(ref[i1:i2]), " ".join(h[0] for h in H[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal"]
report = []
for k, (cid, text) in enumerate(L):
    a, b = cuts[k], cuts[k + 1]
    # keep 80 ms of the silence either side
    if k and snaps[k - 1][1]: a = max(a, snaps[k - 1][1][1] - 0.08)
    if k < len(L) - 1 and snaps[k][1]: b = min(b, snaps[k][1][0] + 0.08)
    if k == 0 and quiet and quiet[0][0] < 0.05: a = max(0.0, quiet[0][1] - 0.08)
    if k == len(L) - 1 and quiet and quiet[-1][1] > dur - 0.05: b = quiet[-1][0] + 0.08
    dst = out / f"{cid}.mp3"
    subprocess.run([FF, "-nostdin", "-v", "error", "-y", "-i", take, "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                    "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", str(dst)], check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dst)],
                             capture_output=True, text=True).stdout)
    report.append({"id": cid, "dur": round(d, 2), "cut": round(b, 2), "pause": round(snaps[k][1][1] - snaps[k][1][0], 2) if k < len(L) - 1 and snaps[k][1] else None})
print(json.dumps({"diffs": diffs}))
for r in report: print(json.dumps(r))

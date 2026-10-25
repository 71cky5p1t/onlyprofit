#!/bin/sh
# clean/*.mp3 -> induction/*.mp3 with the tape texture
cd "$(dirname "$0")/../../assets/audio/induction" || exit 1
for f in clean/*.mp3; do ../../../tools/vo/tape.sh "$f" "$(basename "$f")"; done

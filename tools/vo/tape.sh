#!/bin/sh
# tape + low-bit: band-limit, wow/flutter, soft saturation, gentle crush, faint hiss
in="$1"; out="$2"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
ffmpeg -v error -y -i "$in" -f lavfi -t "$d" -i "anoisesrc=c=pink:a=0.0035:r=44100" -filter_complex "\
[0:a]aresample=44100,highpass=f=110,lowpass=f=6800,\
vibrato=f=0.7:d=0.012,vibrato=f=9:d=0.004,\
acrusher=bits=11:mix=0.35:mode=log:aa=1,\
aresample=16000,aresample=44100,\
equalizer=f=1800:t=q:w=1.2:g=2,\
asoftclip=type=tanh:threshold=0.85[v];\
[1:a]highpass=f=2500,lowpass=f=9000[h];\
[v][h]amix=inputs=2:weights=1 1:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11" \
-ac 1 -ar 44100 -b:a 128k "$out"

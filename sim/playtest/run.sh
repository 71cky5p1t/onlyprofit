#!/usr/bin/env bash
# usage: run.sh '<x json>' strategies...
xs="$1"; shift
for st in "$@"; do node play.js "$st" 4,6 1000 "$xs" | sed 's/ x={[^}]*}//'; done

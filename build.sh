#!/usr/bin/env bash
# Concatenates the engine, UI and styles into one self-contained page: dist/only-profit.html
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
{ cat src/head.html; echo '<div id="app"></div>'; echo '<script>'; sed '/^if (typeof module/d' src/engine.js; echo '</script>'; echo '<script>'; cat src/ui.js; echo '</script>'; } > dist/only-profit.html
echo "Built dist/only-profit.html"

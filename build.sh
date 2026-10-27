#!/usr/bin/env bash
# Builds dist/only-profit.html (one self-contained page) and dist/viewer.html
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
{
  cat src/head.html; echo '<style>'; cat src/styles/*.css; echo '</style>'
  echo '<div id="app"></div>'
  echo '<script>'; sed '/^if (typeof module/d' src/engine/lex.js src/engine/content.js src/engine/bots.js src/engine/core.js; echo '</script>'
  echo '<script>'; echo '(() => {'; cat src/ui/*.js; echo '})();'; echo '</script>'
} > dist/only-profit.html
# the viewer embeds the built game
node -e '
const fs = require("fs"), j = x => JSON.stringify(x).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");
const v = fs.readFileSync("src/viewer.html", "utf8").replace("/*PROTO*/", () => j(fs.readFileSync("dist/only-profit.html", "utf8")));
fs.writeFileSync("dist/viewer.html", v);'
# audio is fetched from dist/audio beside the page
rm -rf dist/audio && mkdir -p dist/audio/music && cp -r assets/audio/sfx dist/audio/
for m in 01-water-cooler 04-q5-overtime 05-hold-music-clean 06-stripe-wipe; do cp "assets/audio/mp3/$m.mp3" dist/audio/music/; done
# the site root serves the game
cp dist/only-profit.html dist/index.html
echo "Built dist/only-profit.html, dist/index.html, dist/viewer.html and dist/audio"

#!/usr/bin/env bash
# Builds dist/only-profit.html (one self-contained page) and dist/viewer.html
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
{
  cat src/head.html; echo '<style>'; cat src/styles/*.css; echo '</style>'
  echo '<div id="app"></div>'
  echo '<script>'; sed '/^if (typeof module/d' src/engine/lex.js src/engine/content.js src/engine/ink.js src/engine/bots.js src/engine/core.js; echo '</script>'
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
# Petty Cash: its own page
{
  cat src/petty/head.html; echo '<style>'; cat src/petty/styles/*.css; echo '</style>'
  echo '<div class="scene"></div><div id="app"></div><div id="ov" aria-live="polite"></div>'
  echo '<script>'; sed '/^if (typeof module/d' src/petty/engine/cards.js src/petty/engine/bots.js src/petty/engine/core.js; echo '</script>'
  echo '<script>'; echo '(() => {'; cat src/petty/ui/*.js; echo '})();'; echo '</script>'
} > dist/petty-cash.html
# location scene gallery (src/scenes)
node -e '
const fs = require("fs"), d = "src/scenes/", js = fs.readdirSync(d).filter(f => /^\d.*\.js$/.test(f)).sort().map(f => fs.readFileSync(d + f, "utf8")).join("\n");
const html = fs.readFileSync(d + "gallery.html", "utf8").replace("/*SCENES_CSS*/", () => fs.readFileSync(d + "scenes.css", "utf8"))
  .replace("/*SCENES_JS*/", () => js).replace("/*GALLERY_JS*/", () => fs.readFileSync(d + "gallery.js", "utf8"));
fs.writeFileSync("dist/scenes.html", html);'
# the site root serves the game
cp dist/only-profit.html dist/index.html
echo "Built dist/only-profit.html, dist/index.html, dist/viewer.html, dist/petty-cash.html, dist/scenes.html and dist/audio"

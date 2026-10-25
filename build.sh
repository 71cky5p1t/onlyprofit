#!/usr/bin/env bash
# Builds dist/only-profit.html (one self-contained page) and dist/viewer.html
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
{
  cat src/head.html; echo '<style>'; cat src/styles/*.css; echo '</style>'
  echo '<div id="app"></div>'
  echo '<script>'; sed '/^if (typeof module/d' src/engine/content.js src/engine/bots.js src/engine/core.js; echo '</script>'
  echo '<script>'; echo '(() => {'; cat src/ui/*.js; echo '})();'; echo '</script>'
} > dist/only-profit.html
# the viewer embeds the built game and the styles for its parts sheet
node -e '
const fs = require("fs"), j = x => JSON.stringify(x).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");
const css = fs.readdirSync("src/styles").sort().map(f => fs.readFileSync("src/styles/" + f, "utf8")).join("\n");
const v = fs.readFileSync("src/viewer.html", "utf8").replace("/*PROTO*/", () => j(fs.readFileSync("dist/only-profit.html", "utf8"))).replace("/*KITCSS*/", () => j(css));
fs.writeFileSync("dist/viewer.html", v);'
echo "Built dist/only-profit.html and dist/viewer.html"

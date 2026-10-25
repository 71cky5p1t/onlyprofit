#!/usr/bin/env bash
# Concatenates the engine, UI and styles into one self-contained page: dist/only-profit.html
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
{ cat src/head.html; echo '<div id="app"></div>'; echo '<script>'; sed '/^if (typeof module/d' src/engine/content.js src/engine/bots.js src/engine/core.js; echo '</script>'; echo '<script>'; cat src/ui.js; echo '</script>'; } > dist/only-profit.html
# The screens viewer embeds the built game and replays it into a TV and a phone frame for each phase
node -e '
const fs = require("fs"), j = x => JSON.stringify(x).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");
const head = fs.readFileSync("src/head.html", "utf8"), css = head.slice(head.indexOf("<style>") + 7, head.lastIndexOf("</style>"));
const v = fs.readFileSync("src/viewer.html", "utf8").replace("/*PROTO*/", () => j(fs.readFileSync("dist/only-profit.html", "utf8"))).replace("/*KITCSS*/", () => j(css));
fs.writeFileSync("dist/viewer.html", v);'
echo "Built dist/only-profit.html and dist/viewer.html"

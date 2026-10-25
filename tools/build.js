const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
process.chdir(path.join(__dirname, '..'));
const read = file => fs.readFileSync(file, 'utf8');
const files = (dir, ext) => fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort().map(f => path.join(dir, f));
const join = paths => paths.map(read).join('\n');
const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file) || read(file) !== content) fs.writeFileSync(file, content);
};
const voice = fs.existsSync('assets/audio/induction') ? files('assets/audio/induction', '.mp3') : [];
const engine = join(['src/engine/content.js', 'src/engine/bots.js', 'src/engine/core.js']).replace(/^if \(typeof module.*$/gm, '');
const ui = 'window.__opVoiceFiles=' + JSON.stringify(voice.map(f => path.basename(f, '.mp3'))) + ';\n(() => {\n'
  + join([...files('src/ui', '.js'), ...files('src/explainer', '.js'), 'src/boot.js']) + '\n})();';
new vm.Script(engine); new vm.Script(ui);
const game = read('src/head.html') + '<style>\n' + join(files('src/styles', '.css')) + '\n</style>\n<div id="app"></div>\n<script>\n' + engine + '\n</script>\n<script>\n' + ui + '\n</script>\n';
const quote = value => JSON.stringify(value).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
const viewerJS = join(['src/viewer/main.js', 'src/viewer/parts.js']);
new vm.Script('(() => {\n' + viewerJS + '\n})();');
const viewer = read('src/viewer.html').replace('/*VIEWER_CSS*/', () => read('src/viewer/viewer.css'))
  .replace('/*VIEWER_JS*/', () => viewerJS).replace('/*PROTO*/', () => quote(game));
write('dist/only-profit.html', game); write('dist/viewer.html', viewer);
const music = ['01-water-cooler', '04-q5-overtime', '05-hold-music-clean', '06-stripe-wipe'];
const assets = new Map([
  ...files('assets/audio/sfx', '.mp3').map(f => ['sfx/' + path.basename(f), f]),
  ...music.map(m => ['music/' + m + '.mp3', 'assets/audio/mp3/' + m + '.mp3']),
  ...voice.map(f => ['induction/' + path.basename(f), f])
]);
for (const [rel, source] of assets) {
  const target = 'dist/audio/' + rel, src = fs.statSync(source), dst = fs.existsSync(target) && fs.statSync(target);
  if (dst && dst.size === src.size && Math.abs(dst.mtimeMs - src.mtimeMs) < 2) continue;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target); fs.utimesSync(target, src.atime, src.mtime);
}
const prune = dir => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) prune(file);
    else if (!assets.has(path.relative('dist/audio', file))) fs.unlinkSync(file);
  }
};
prune('dist/audio');
console.log('Built game, screen viewer and audio; unchanged files retained.');

import { Connection } from './connection.js';
import { landing, joinHTML, lobby, tvHTML, header } from './screens.js';
import { playerHTML } from './desk.js';
import { inductionHTML, chapterAt } from './induction.js';
import { freshDraft, cost, esc, button } from './pieces.js';
import { bindActions } from './events.js';
const app = document.getElementById('app');
const safeRead = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const params = new URLSearchParams(location.search), fragment = new URLSearchParams(location.hash.slice(1));
const tv = location.pathname === '/tv';
const roomCode = params.get('room')?.toUpperCase() || '';
const ui = { theme: safeRead('op-hosted-theme') || 'oak', step: 0, suit: 0, draft: freshDraft(), revision: 0, dirty: false, submitting: false, demo: [], chapter: -1 };
let session = safeRead(`op-session:${tv ? 'tv' : 'player'}:${roomCode}`), snap, conn, saveTimer, lessons = [], sound = false, qrKey = '', qrObject;
const music = new Audio('/audio/music/05-hold-music-clean.mp3'); music.loop = true; music.volume = .22;
const notice = message => { const el = document.getElementById('notice'); el.textContent = message; clearTimeout(notice.timer); notice.timer = setTimeout(() => { el.textContent = ''; }, 5000); };
const draftKey = () => `op-draft:${session?.token}:${snap?.phaseId}`;
const api = async (url, payload) => { const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const body = await res.json(); if (!res.ok) throw new Error(body.error); return body; };
async function command(type, payload) {
  if (!conn || !snap) return;
  try { return await conn.send(type, payload, snap.phaseId); } catch (e) { notice(e.message); throw e; }
}
function saveDraft() {
  clearTimeout(saveTimer);
  if (snap?.stage !== 'work' || !snap.game.self?.work) return;
  const revision = ++ui.revision, value = structuredClone(ui.draft), key = draftKey();
  ui.dirty = true; safeWrite(key, { revision, value });
  if (!conn.connected) return;
  conn.send('draft', { revision, value }, snap.phaseId).then(() => {
    if (ui.revision === revision) { ui.dirty = false; const status = document.getElementById('save-status'); if (status) status.textContent = 'Draft saved'; }
  }).catch(e => notice(e.message));
}
function edit(mutator, redraw = true) {
  const before = structuredClone(ui.draft); mutator(ui.draft);
  if (cost(ui.draft) > 3) { ui.draft = before; notice('Not enough overtime. Undo a replacement or shown card first.'); return; }
  ui.dirty = true; safeWrite(draftKey(), { revision: ui.revision + 1, value: ui.draft });
  clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 180);
  if (redraw) render(); else { const el = document.getElementById('save-status'); if (el) el.textContent = 'Saving draft…'; }
}
function received(next) {
  if (snap && next.version < snap.version) return;
  const previous = snap;
  const newPhase = !previous || previous.phaseId !== next.phaseId;
  snap = next;
  if (tv && sound && previous && newPhase && next.presentation.id !== previous.presentation.id && conn.now() - next.presentation.startedAt < 1500) {
    const cue = new Audio('/audio/sfx/paper-pull.mp3'); cue.volume = .35; cue.play().catch(() => {});
  }
  if (newPhase) {
    clearTimeout(saveTimer); ui.step = 0; ui.suit = 0; ui.submitting = false; ui.demo = []; ui.chapter = -1;
    const local = safeRead(draftKey()), saved = next.draft;
    const best = local && local.revision > (saved?.revision || 0) ? local : saved;
    ui.draft = best?.value || freshDraft(); ui.revision = best?.revision || 0; ui.dirty = !!local && local.revision > (saved?.revision || 0);
    if (next.game?.reqStyle) ui.draft.style = { ...ui.draft.style, ...next.game.reqStyle };
    if (previous) safeWrite(`op-draft:${session.token}:${previous.phaseId}`, null);
  }
  if (!newPhase && !ui.dirty && next.draft?.revision > ui.revision) { ui.draft = next.draft.value; ui.revision = next.draft.revision; }
  if (next.game?.self && !next.game.self.work && next.stage === 'work') { ui.dirty = false; safeWrite(draftKey(), null); }
  const focused = document.activeElement;
  const typing = focused && ['INPUT','TEXTAREA','SELECT'].includes(focused.tagName);
  if (newPhase || !typing) render();
  if (ui.dirty && conn.connected && newPhase) saveDraft();
}
async function qr() {
  const key = snap.code + snap.claimed;
  if (!tv || snap.stage !== 'lobby') return;
  if (key !== qrKey) {
    qrKey = key;
    try {
      const response = await fetch(`/api/qr?code=${snap.code}`, { headers: { Authorization: `Bearer ${session.token}` } });
      if (!response.ok) throw new Error('Could not load joining code.');
      if (qrObject) URL.revokeObjectURL(qrObject); qrObject = URL.createObjectURL(await response.blob());
    } catch (e) { qrKey = ''; notice(e.message); }
  }
  const img = document.getElementById('room-qr'); if (img && qrObject) img.src = qrObject;
}
function elapsed() {
  if (!snap || snap.stage !== 'induction') return 0;
  return snap.inductionElapsed + (snap.paused ? 0 : Math.max(0, conn.now() - snap.serverNow));
}
function render() {
  document.documentElement.dataset.deskTheme = ui.theme;
  document.body.classList.toggle('tv-mode', tv);
  if (!snap) { app.innerHTML = location.pathname === '/join' ? joinHTML(roomCode, fragment.get('claim'), ui.theme) : landing(ui.theme); return; }
  let body;
  if (snap.stage === 'closed') body = '<section class="paper"><h1>Office closed.</h1><a href="/">Start a new game</a></section>';
  else if (snap.stage === 'lobby') body = lobby(snap, tv);
  else if (snap.stage === 'induction') { ui.chapter = chapterAt(lessons, elapsed()); body = inductionHTML(snap, lessons, ui.chapter, tv, ui.demo); }
  else body = tv ? tvHTML(snap) : playerHTML(snap, ui);
  app.innerHTML = header(snap, tv, !!conn?.connected) + `<main class="${tv ? 'tv-stage' : 'phone-desk'}">${body}</main>` + (snap.isHost && snap.stage !== 'closed' ? `<details class="host-controls"><summary>Host controls</summary>${button(snap.paused ? 'resume' : 'pause',snap.paused ? 'Resume room' : 'Pause room')}${button('close','Close room')}</details>` : '');
  qr(); clock();
  if (tv) document.getElementById('sound-toggle')?.setAttribute('aria-pressed', String(sound));
  if (tv && document.getElementById('sound-toggle')) document.getElementById('sound-toggle').textContent = sound ? 'Sound on' : 'Sound off';
}
function clock() {
  if (!snap) return;
  const node = document.getElementById('clock'), ms = snap.paused ? snap.remaining : snap.deadline === null ? null : snap.deadline - conn.now();
  if (node) node.textContent = snap.paused ? 'PAUSED' : ms === null ? '' : Math.max(0, Math.ceil(ms / 1000)) + 's';
  if (snap.stage === 'induction' && lessons.length && chapterAt(lessons, elapsed()) !== ui.chapter) render();
}
function connect() {
  conn = new Connection(session, received, connected => {
    if (snap) { render(); if (connected && ui.dirty) saveDraft(); }
  }, notice);
}
bindActions({ app, ui, get snap() { return snap; }, command, edit, render, notice, saveDraft,
  async create() { const result = await api('/api/rooms', {}); safeWrite(`op-session:tv:${result.code}`, { code: result.code, token: result.tvToken }); location.href = `/tv?room=${result.code}`; },
  async join(form) { const values = new FormData(form), result = await api('/api/join', { code: String(values.get('code')).trim().toUpperCase(), name: values.get('name'), claim: fragment.get('claim') || undefined }); safeWrite(`op-session:player:${result.code}`, result); location.replace(`/play?room=${result.code}`); },
  theme(value) { ui.theme = value; safeWrite('op-hosted-theme', value); document.documentElement.dataset.deskTheme = value; app.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === value))); },
  sound() { sound = !sound; if (sound) music.play().catch(() => { sound = false; render(); }); else music.pause(); render(); }
});
fetch('/api/lessons').then(r => r.json()).then(data => { lessons = data; if (snap?.stage === 'induction') render(); }).catch(() => notice('Induction captions could not load. Reconnect or ask the host to skip.'));
if (session && ['/tv','/play'].includes(location.pathname)) connect();
else if (['/tv','/play'].includes(location.pathname)) { location.replace('/join?room=' + roomCode); }
render(); setInterval(clock, 250);

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import { WebSocketServer, WebSocket } from 'ws';
import { Rooms } from './rooms';
import { LESSONS } from './rules';
export function createApp(rooms: Rooms, publicUrl?: string) {
  const root = path.resolve(__dirname, '..');
  const limits = new Map<string, { count: number; until: number }>();
  const clients = new Map<WebSocket, { code: string; token: string; seat: number }>();
  const online = (code: string) => [...clients.values()].filter(c => c.code === code).map(c => c.seat);
  const send = (ws: WebSocket, data: unknown) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); };
  const publish = (code: string) => {
    for (const [ws, c] of clients) if (c.code === code) {
      try { send(ws, rooms.snapshot(code, c.token, online(code))); } catch { ws.close(); }
    }
  };
  rooms.changed = publish;
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    const reply = (status: number, body: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    try {
      const base = publicUrl || `http://${req.headers.host}`;
      const url = new URL(req.url || '/', base);
      if (url.pathname === '/health') return reply(200, { ok: true });
      if (url.pathname.startsWith('/api/') && req.method === 'POST') {
        if (req.headers.origin && req.headers.origin !== new URL(base).origin) return reply(403, { error: 'Wrong origin.' });
        const key = req.socket.remoteAddress || 'unknown', now = Date.now();
        for (const [k, v] of limits) if (v.until < now) limits.delete(k);
        const limit = limits.get(key) || { count: 0, until: now + 60000 };
        if (++limit.count > 30) return reply(429, { error: 'Please wait before trying again.' });
        limits.set(key, limit);
        let body = '';
        for await (const chunk of req) { body += chunk; if (body.length > 4096) { reply(413, { error: 'Request too large.' }); return; } }
        const input = JSON.parse(body || '{}');
        if (url.pathname === '/api/rooms') return reply(201, { ...rooms.create(), publicUrl: base });
        if (url.pathname === '/api/join') return reply(200, await rooms.join(String(input.code).toUpperCase(), input.name, input.claim));
        return reply(404, { error: 'Not found.' });
      }
      if (url.pathname === '/api/lessons') return reply(200, LESSONS);
      if (url.pathname === '/api/qr') {
        const code = url.searchParams.get('code') || '', credential = req.headers.authorization?.replace(/^Bearer /, '') || '';
        const actor = rooms.authenticate(code, credential);
        if (actor.kind !== 'tv') return reply(403, { error: 'TV only.' });
        const room = rooms.get(code);
        const link = `${base}/join?room=${code}${room.claimToken ? '#claim=' + room.claimToken : ''}`;
        res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(await QRCode.toString(link, { type: 'svg', margin: 2 })); return;
      }
      const pages = ['/', '/tv', '/join', '/play'];
      let file = pages.includes(url.pathname) ? path.join(root, 'src/hosted/index.html') : '';
      if (url.pathname.startsWith('/hosted/')) file = path.resolve(root, 'src', '.' + url.pathname);
      if (url.pathname === '/practice') file = path.join(root, 'dist/only-profit.html');
      if (url.pathname.startsWith('/audio/')) file = path.resolve(root, 'dist', '.' + url.pathname);
      const allowed = [path.join(root, 'src/hosted') + path.sep, path.join(root, 'dist/audio') + path.sep];
      if (!file || (!pages.includes(url.pathname) && url.pathname !== '/practice' && !allowed.some(p => file.startsWith(p)))) return reply(404, { error: 'Not found.' });
      const content = await readFile(file);
      const type: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg' };
      res.writeHead(200, { 'Content-Type': type[path.extname(file)] || 'application/octet-stream' }); res.end(content);
    } catch (e) { reply(400, { error: e instanceof Error ? e.message : 'Request failed.' }); }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 32768 });
  server.on('upgrade', (req, socket, head) => {
    const expected = publicUrl ? new URL(publicUrl).origin : `http://${req.headers.host}`;
    if (req.url !== '/socket' || (req.headers.origin && req.headers.origin !== expected)) { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  });
  wss.on('connection', ws => {
    const authTimeout = setTimeout(() => { if (!clients.has(ws)) ws.close(); }, 5000);
    let count = 0, windowStart = Date.now();
    ws.on('message', async data => {
      let id: string | undefined;
      try {
        if (Date.now() - windowStart > 10000) { count = 0; windowStart = Date.now(); }
        if (++count > 120) throw new Error('Too many commands.');
        const msg = JSON.parse(String(data)); id = msg.id;
        if (msg.type === 'auth' && !clients.has(ws)) {
          const actor = rooms.authenticate(msg.code, msg.token);
          clients.set(ws, { code: msg.code, token: msg.token, seat: actor.seat }); clearTimeout(authTimeout); publish(msg.code); return;
        }
        const client = clients.get(ws); if (!client) throw new Error('Join the room first.');
        if (msg.type === 'ping') return send(ws, { type: 'pong', clientNow: msg.clientNow, serverNow: Date.now() });
        send(ws, await rooms.execute(client.code, client.token, msg));
      } catch (e) { send(ws, { type: 'error', id, message: e instanceof Error ? e.message : 'Command failed.' }); }
    });
    ws.on('close', () => { clearTimeout(authTimeout); const c = clients.get(ws); clients.delete(ws); if (c) publish(c.code); });
    ws.on('error', () => ws.close());
  });
  const ticker = setInterval(() => { rooms.tick().catch(error => console.error('Room tick failed:', error.message)); }, 250);
  ticker.unref();
  return { server, wss, close: async () => { clearInterval(ticker); for (const ws of wss.clients) ws.terminate(); await new Promise<void>(resolve => wss.close(() => resolve())); await new Promise<void>(resolve => server.close(() => resolve())); } };
}

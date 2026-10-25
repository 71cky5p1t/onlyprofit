export class Connection {
  constructor(session, onSnapshot, onStatus, onError) {
    this.session = session; this.onSnapshot = onSnapshot; this.onStatus = onStatus; this.onError = onError;
    this.pending = new Map(); this.offset = 0; this.connected = false; this.stopped = false;
    this.connect();
    this.pinger = setInterval(() => this.ping(), 10000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.ping(); });
  }
  connect() {
    const socket = this.socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/socket`);
    socket.addEventListener('open', () => socket.send(JSON.stringify({ type: 'auth', code: this.session.code, token: this.session.token })));
    socket.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'snapshot') {
        const first = !this.connected; this.connected = true;
        if (first) { this.offset = msg.serverNow - Date.now(); this.onStatus(true); this.ping(); }
        this.onSnapshot(msg);
        if (first) for (const item of this.pending.values()) socket.send(JSON.stringify(item.command));
      } else if (msg.type === 'pong') this.offset = msg.serverNow - (msg.clientNow + Date.now()) / 2;
      else if (msg.type === 'ack' || msg.type === 'error') {
        const item = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.type === 'error') { if (item) item.reject(new Error(msg.message)); else this.onError(msg.message); }
        else item?.resolve(msg);
      }
    });
    socket.addEventListener('close', () => { this.connected = false; this.onStatus(false); if (!this.stopped) this.retry = setTimeout(() => this.connect(), 1500); });
    socket.addEventListener('error', () => socket.close());
  }
  ping() { if (this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: 'ping', clientNow: Date.now() })); }
  now() { return Date.now() + this.offset; }
  send(type, payload, phaseId) {
    const command = { id: crypto.randomUUID(), phaseId, type, payload };
    return new Promise((resolve, reject) => {
      this.pending.set(command.id, { command, resolve, reject });
      if (this.connected) this.socket.send(JSON.stringify(command));
    });
  }
  close() { this.stopped = true; clearTimeout(this.retry); clearInterval(this.pinger); this.socket.close(); }
}

import { randomInt } from 'node:crypto';
import type { Actor, Command, Room, Store } from './types';
import { authenticate, expire, snapshot, token } from './lifecycle';
import { command } from './commands';
export class Rooms {
  rooms = new Map<string, Room>();
  queues = new Map<string, Promise<unknown>>();
  changed: (code: string) => void = () => {};
  constructor(public store: Store, public now = Date.now) {
    for (const room of store.all()) {
      if (room.stage !== 'closed') {
        if (!room.paused) room.remaining = room.deadline === null ? null : Math.max(0, room.deadline - this.now());
        room.deadline = null; room.paused = true; room.version++;
        store.save(room);
      }
      this.rooms.set(room.code, room);
    }
  }
  get(code: string) { const room = this.rooms.get(code); if (!room) throw new Error('Room not found.'); return room; }
  serial<T>(code: string, task: () => T): Promise<T> {
    const next = (this.queues.get(code) || Promise.resolve()).then(task);
    this.queues.set(code, next.catch(() => {}));
    return next;
  }
  commit(room: Room) { this.store.save(room); this.rooms.set(room.code, room); this.changed(room.code); }
  create() {
    let code = '';
    do { code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt(31)]).join(''); } while (this.rooms.has(code));
    const now = this.now();
    const room: Room = { code, tvToken: token(), claimToken: token(), host: null, members: [], state: null, stage: 'lobby', phaseId: 1, version: 1,
      deadline: null, remaining: null, paused: false, presentation: { id: '1:lobby', startedAt: now }, acknowledged: [], drafts: {}, receipts: {}, createdAt: now, closedAt: null };
    this.commit(room); return { code, tvToken: room.tvToken, claimToken: room.claimToken };
  }
  join(code: string, name: string, claim?: string) {
    return this.serial(code, () => {
      const room = structuredClone(this.get(code));
      if (room.stage !== 'lobby' || room.members.length >= 8) throw new Error('Room is full or already playing.');
      if (room.host === null && (!claim || claim !== room.claimToken)) throw new Error('The host must claim the room first.');
      if (claim && claim !== room.claimToken) throw new Error('Host invitation already used or invalid.');
      const credential = token();
      const seat = room.members.length;
      room.members.push({ name: String(name || 'Employee').trim().slice(0, 24) || 'Employee', human: true, token: credential, theme: 'oak' });
      if (claim) { room.host = seat; room.claimToken = null; }
      room.version++; this.commit(room); return { code, token: credential, seat };
    });
  }
  authenticate(code: string, credential: string): Actor { return authenticate(this.get(code), credential); }
  snapshot(code: string, credential: string, online: number[] = []) {
    const room = this.get(code); return snapshot(room, authenticate(room, credential), this.now(), online);
  }
  execute(code: string, credential: string, cmd: Command) {
    return this.serial(code, () => {
      const original = this.get(code), actor = authenticate(original, credential);
      if (!cmd || typeof cmd.id !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(cmd.id)) throw new Error('Invalid action ID.');
      const key = `${actor.kind}:${actor.seat}:${cmd.id}`;
      if (original.receipts[key]) return original.receipts[key];
      let room = structuredClone(original);
      if (expire(room, this.now())) { room.version++; this.commit(room); room = structuredClone(room); }
      if (cmd.phaseId !== room.phaseId) throw new Error('This phase has ended.');
      command(room, actor, cmd, this.now()); room.version++;
      const ack = { type: 'ack', id: cmd.id, version: room.version };
      room.receipts[key] = ack;
      const keys = Object.keys(room.receipts); if (keys.length > 4096) delete room.receipts[keys[0]];
      this.commit(room); return ack;
    });
  }
  async tick() {
    await Promise.all([...this.rooms.keys()].map(code => this.serial(code, () => {
      const room = structuredClone(this.get(code)), now = this.now();
      if (room.closedAt !== null && now - room.closedAt >= 86400000) { this.store.remove(code); this.rooms.delete(code); this.queues.delete(code); return; }
      if (expire(room, now)) { room.version++; this.commit(room); }
    })));
  }
}

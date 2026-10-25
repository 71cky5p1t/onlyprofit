import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import WebSocket from 'ws';
import { Rooms } from '../server/rooms';
import { SQLiteStore } from '../server/store';
import { createApp } from '../server/http';
import type { Room, Store } from '../server/types';
class MemoryStore implements Store {
  data = new Map<string, Room>();
  save(r: Room) { this.data.set(r.code, structuredClone(r)); }
  all() { return [...this.data.values()].map(r => structuredClone(r)); }
  remove(c: string) { this.data.delete(c); }
}
let sequence = 0;
async function setup(n = 4, human = n) {
  let now = 1000000;
  const store = new MemoryStore(), rooms = new Rooms(store, () => now), room = rooms.create(), credentials: string[] = [];
  for (let i = 0; i < human; i++) credentials.push((await rooms.join(room.code, 'Player ' + i, i ? undefined : room.claimToken!)).token);
  const send = (seat: number, type: string, payload: any = {}, phaseId = rooms.get(room.code).phaseId, id = 'command_' + (++sequence)) => rooms.execute(room.code, credentials[seat], { id, phaseId, type, payload });
  for (let i = human; i < n; i++) await send(0, 'addBot');
  const advance = async (ms: number) => { now += ms; await rooms.tick(); };
  return { rooms, room, store, credentials, send, advance };
}
async function begin(c: Awaited<ReturnType<typeof setup>>) {
  await c.send(0, 'start', { seed: 123 }); await c.send(0, 'skipInduction');
  for (let i = 0; i < c.credentials.length; i++) await c.send(i, 'ackRole');
}
for (const [n,h] of [[4,4],[8,8],[8,3]]) test(`${h} humans, ${n-h} bots finish five quarters`, async () => {
  const c = await setup(n,h); await begin(c);
  for (let count = 0; c.rooms.get(c.room.code).stage !== 'end' && count < 80; count++) {
    const r = c.rooms.get(c.room.code);
    if (r.stage === 'work') for (const key of Object.keys(r.state.work)) await c.send(+key, 'submitWork', { value: { swaps: [0,1], picks: [3,4,5], stamp: 'Risky', subject: '<b>Untrusted title</b>' } });
    else await c.advance(96000);
  }
  const r = c.rooms.get(c.room.code); assert.equal(r.stage,'end'); assert.equal(r.state.ledger.length,5);
});
test('auth, duplicate actions, stale phases, deadline races and saved drafts', async () => {
  const c = await setup(); await begin(c);
  const r = c.rooms.get(c.room.code), phase = r.phaseId;
  await assert.rejects(c.rooms.execute(r.code,'invalid',{id:'bad_token_01',phaseId:phase,type:'pause'}),/credential/);
  await assert.rejects(c.rooms.execute(r.code,c.room.tvToken,{id:'tv_command01',phaseId:phase,type:'pause'}),/read-only/);
  await assert.rejects(c.send(1,'pause'),/Host/);
  await assert.rejects(c.send(0,'advance'),/unavailable/);
  const action = { id:'duplicate_test',phaseId:phase,type:'draft',payload:{revision:1,value:{swaps:[0],picks:[3,1,2],subject:'My saved draft'}} };
  const [a,b] = await Promise.all([c.rooms.execute(r.code,c.credentials[0],action),c.rooms.execute(r.code,c.credentials[0],action)]);
  assert.deepEqual(a,b);
  assert.equal(c.rooms.snapshot(r.code,c.credentials[0]).draft!.value.subject,'My saved draft');
  assert.equal(c.rooms.snapshot(r.code,c.credentials[1]).draft,null);
  assert.equal(c.rooms.snapshot(r.code,c.room.tvToken).draft,null);
  await assert.rejects(c.send(0,'draft',{revision:1,value:{}}),/Older/);
  await c.advance(95000);
  assert.notEqual(c.rooms.get(r.code).stage,'work');
  await assert.rejects(c.send(0,'submitWork',{value:{}},phase),/ended/);
  const current = c.rooms.get(r.code); assert.equal(current.state.envs.length,4);
  assert.equal(current.state.envs.find((e:any)=>e.author===0).subject,'My saved draft');
  assert.deepEqual(await c.rooms.execute(r.code,c.credentials[0],action),a);
});
test('pause, reconnect, role barriers and persisted recovery', async () => {
  const c = await setup(); await c.send(0,'start'); await c.send(0,'skipInduction');
  for (let i = 0; i < 3; i++) await c.send(i,'ackRole');
  assert.equal(c.rooms.get(c.room.code).stage,'roles');
  await c.send(3,'ackRole'); await c.advance(10000); await c.send(0,'pause');
  const remaining = c.rooms.get(c.room.code).remaining; await c.advance(200000);
  assert.equal(c.rooms.get(c.room.code).stage,'work');
  assert.equal(c.rooms.snapshot(c.room.code,c.credentials[3]).seat,3);
  const restarted = new Rooms(c.store,()=>2000000);
  assert.equal(restarted.get(c.room.code).paused,true); assert.equal(restarted.get(c.room.code).remaining,remaining);
  await c.send(0,'resume'); await c.advance(remaining!); assert.notEqual(c.rooms.get(c.room.code).stage,'work');
});
test('SQLite saves credentials and drafts, purges closed rooms, and commit failures roll back', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(),'op-room-'));
  const store = new SQLiteStore(path.join(dir,'rooms.sqlite'));
  const rooms = new Rooms(store), created = rooms.create(); const host = await rooms.join(created.code,'Host',created.claimToken!);
  store.close();
  const reopened = new SQLiteStore(path.join(dir,'rooms.sqlite')); const resumed = new Rooms(reopened);
  assert.equal(resumed.snapshot(created.code,host.token).isHost,true); assert.equal(resumed.get(created.code).paused,true);
  reopened.close(); rmSync(dir,{recursive:true,force:true});
  const c = await setup(); const old = c.rooms.get(c.room.code).version;
  c.store.save = () => { throw new Error('Disk full'); };
  await assert.rejects(c.send(0,'start'),/Disk full/); assert.equal(c.rooms.get(c.room.code).version,old);
  c.store.save = MemoryStore.prototype.save;
  await c.send(0,'close'); await c.advance(86400001); assert.throws(()=>c.rooms.get(c.room.code),/not found/);
});
test('WebSocket clients get private snapshots and deduplicated acknowledgements', async () => {
  const c = await setup(); await begin(c);
  const app = createApp(c.rooms); app.server.listen(0,'127.0.0.1'); await once(app.server,'listening');
  const port = (app.server.address() as any).port;
  const sockets: WebSocket[] = [];
  try {
    for (const credential of [c.room.tvToken,...c.credentials]) {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/socket`); sockets.push(ws); await once(ws,'open');
      const message = once(ws,'message'); ws.send(JSON.stringify({type:'auth',code:c.room.code,token:credential}));
      const [raw] = await message, data = JSON.parse(String(raw));
      assert.equal(data.type,'snapshot');
      assert(!JSON.stringify(data).includes('"deck"')); assert(!JSON.stringify(data).includes('"rs"'));
      if (credential === c.room.tvToken) { assert.equal(data.game.self,null); assert.equal(data.draft,null); }
      else { assert.equal(data.game.self.id,c.credentials.indexOf(credential)); assert(data.game.self.work.spares.length===6); }
    }
    const response = await fetch(`http://127.0.0.1:${port}/api/qr?code=${c.room.code}`,{headers:{Authorization:`Bearer ${c.room.tvToken}`}});
    assert.equal(response.status,200); assert((await response.text()).includes('<svg'));
    assert.equal((await fetch(`http://127.0.0.1:${port}/hosted/app.js`)).status,200);
  } finally { for (const ws of sockets) ws.terminate(); await app.close(); }
});
test('four and eight live sockets submit independently and survive reconnect', async () => {
  for (const n of [4,8]) {
    const c = await setup(n); await begin(c);
    const app = createApp(c.rooms); app.server.listen(0,'127.0.0.1'); await once(app.server,'listening');
    const port = (app.server.address() as any).port;
    const connect = async (seat: number) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/socket`); await once(ws,'open');
      const ready = once(ws,'message'); ws.send(JSON.stringify({type:'auth',code:c.room.code,token:c.credentials[seat]})); await ready; return ws;
    };
    const clients: WebSocket[] = [];
    const action = (seat: number, type: string, payload: any = {}) => new Promise<any>((resolve,reject) => {
      const ws = clients[seat], id = 'live_command_' + (++sequence);
      const timeout = setTimeout(()=>reject(new Error('No acknowledgement')),3000);
      const listener = (raw: any) => {
        const m = JSON.parse(String(raw));
        if (m.id !== id) return;
        clearTimeout(timeout); ws.off('message',listener);
        if (m.type === 'error') reject(new Error(m.message)); else resolve(m);
      };
      ws.on('message',listener); ws.send(JSON.stringify({id,type,payload,phaseId:c.rooms.get(c.room.code).phaseId}));
    });
    try {
      for (let seat = 0; seat < n; seat++) clients.push(await connect(seat));
      await action(0,'draft',{revision:1,value:{subject:'Recovered over the wire',swaps:[0],picks:[3,1,2]}});
      clients[0].terminate(); clients[0] = await connect(0);
      assert.equal(c.rooms.snapshot(c.room.code,c.credentials[0]).draft!.value.subject,'Recovered over the wire');
      for (let guard=0; c.rooms.get(c.room.code).stage !== 'end' && guard<90; guard++) {
        const r = c.rooms.get(c.room.code);
        if (r.stage === 'work') await Promise.all(Object.keys(r.state.work).map(i=>action(+i,'submitWork',{value:{stamp:'Risky'}})));
        else if (r.stage === 'decide') await action(r.state.ceo,'approve',{id:r.state.envs[0].id});
        else if (r.stage === 'board') await Promise.all(r.state.P.filter((p:any)=>p.id!==r.state.ceo).map((p:any)=>action(p.id,'boardVote',{vote:'ratify'})));
        else if (r.stage === 'reveal') await Promise.all(r.state.P.map((p:any)=>action(p.id,'warnVote',{target:'none'})));
        else if (r.stage === 'investigate') await action(r.state.ceo,'skipInvestigation');
        else if (r.stage === 'whistle') await Promise.all(r.state.P.map((p:any)=>action(p.id,'whistleVote',{target:'none'})));
        else await c.advance(10001);
      }
      assert.equal(c.rooms.get(c.room.code).stage,'end');
    } finally { for (const ws of clients) ws.terminate(); await app.close(); }
  }
});

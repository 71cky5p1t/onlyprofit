import { randomBytes } from 'node:crypto';
import type { Actor, Room } from './types';
import { apply, defaultWork, DURATIONS, INDUCTION_MS, OP, viewFor } from './rules';
export const token = () => randomBytes(32).toString('base64url');
export function authenticate(room: Room, credential: string): Actor {
  if (credential === room.tvToken) return { kind: 'tv', seat: -1, token: credential };
  const seat = room.members.findIndex(m => m.human && m.token === credential);
  if (seat < 0) throw new Error('Invalid room credential.');
  return { kind: 'player', seat, token: credential };
}
export function stage(room: Room, next: Room['stage'], now: number) {
  room.stage = next; room.phaseId++; room.drafts = {};
  room.deadline = DURATIONS[next] ? now + DURATIONS[next] : null;
  room.presentation = { id: `${room.phaseId}:${next}`, startedAt: now };
}
export function syncStage(room: Room, now: number) {
  let next = room.state.phase;
  if (next === 'review' && room.stage === 'reveal') next = room.state.P[room.state.ceo].human ? 'investigate' : 'review';
  if (next !== room.stage) stage(room, next, now);
}
export function expire(room: Room, now: number) {
  if (room.paused || room.deadline === null || now < room.deadline) return false;
  if (room.stage === 'induction') stage(room, 'roles', now);
  else if (room.stage === 'work') {
    for (const key of Object.keys(room.state.work)) {
      const seat = Number(key);
      try { apply(room, seat, room.drafts[seat]?.value || defaultWork(room, seat)); }
      catch { apply(room, seat, defaultWork(room, seat)); }
    }
    syncStage(room, now);
  } else if (room.stage === 'investigate') stage(room, 'review', now);
  else if (room.stage === 'review') { apply(room, -1, { type: 'advance' }); syncStage(room, now); }
  else if (['decide', 'board', 'reveal', 'whistle'].includes(room.stage)) { apply(room, -1, { type: 'timeout' }); syncStage(room, now); }
  return true;
}
export function snapshot(room: Room, actor: Actor, now: number, online: number[]) {
  const isHost = actor.kind === 'player' && room.host === actor.seat;
  const remaining = room.paused ? room.remaining : room.deadline === null ? null : Math.max(0, room.deadline - now);
  return { type: 'snapshot', code: room.code, version: room.version, phaseId: room.phaseId, stage: room.stage,
    serverNow: now, deadline: room.deadline, paused: room.paused, remaining, presentation: room.presentation,
    inductionElapsed: room.stage === 'induction' ? INDUCTION_MS - (remaining || 0) : null,
    members: room.members.map((m, seat) => ({ seat, name: m.name, human: m.human, online: online.includes(seat) })),
    seat: actor.seat, isHost, invitation: actor.kind === 'tv' ? room.claimToken : null, acknowledged: room.acknowledged, claimed: room.host !== null,
    game: room.state ? viewFor(room.state, actor.kind === 'tv' ? 'tv' : actor.seat) : null,
    draft: actor.kind === 'player' ? room.drafts[actor.seat] || null : null };
}

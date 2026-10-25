import { randomInt } from 'node:crypto';
import type { Actor, Command, Room } from './types';
import { OP, apply, validWork } from './rules';
import { stage, syncStage } from './lifecycle';
export function command(room: Room, actor: Actor, cmd: Command, now: number) {
  const host = actor.kind === 'player' && room.host === actor.seat;
  const p = cmd.payload || {};
  if (actor.kind !== 'player') throw new Error('The TV is read-only.');
  if (room.stage === 'closed') throw new Error('Room closed.');
  if (cmd.type === 'pause' || cmd.type === 'resume' || cmd.type === 'close') {
    if (!host) throw new Error('Host only.');
    if (cmd.type === 'close') { room.state = null; room.drafts = {}; room.closedAt = now; stage(room, 'closed', now); }
    else if (cmd.type === 'pause' && !room.paused) { room.remaining = room.deadline === null ? null : Math.max(0, room.deadline - now); room.deadline = null; room.paused = true; }
    else if (cmd.type === 'resume' && room.paused) { room.deadline = room.remaining === null ? null : now + room.remaining; room.paused = false; }
    return;
  }
  if (room.paused) throw new Error('Room is paused.');
  if (cmd.type === 'addBot' || cmd.type === 'removeBot' || cmd.type === 'start') {
    if (!host || room.stage !== 'lobby') throw new Error('Host lobby control only.');
    if (cmd.type === 'addBot') {
      if (room.members.length >= 8) throw new Error('Room full.');
      room.members.push({ name: `Bot ${room.members.filter(m => !m.human).length + 1}`, human: false, token: '', theme: 'oak' });
    } else if (cmd.type === 'removeBot') {
      const index = room.members.findLastIndex(m => !m.human);
      if (index >= 0) room.members.splice(index, 1);
    } else {
      if (room.members.length < 4) throw new Error('Add players or bots to reach four seats.');
      room.state = OP.newGame({ roster: room.members, seed: randomInt(1, 0x100000000), brand: 'op' });
      stage(room, 'induction', now);
    }
    return;
  }
  if (cmd.type === 'skipInduction') {
    if (!host || room.stage !== 'induction') throw new Error('No induction to skip.');
    stage(room, 'roles', now); return;
  }
  if (cmd.type === 'ackRole') {
    if (room.stage !== 'roles') throw new Error('No role acknowledgement open.');
    if (!room.acknowledged.includes(actor.seat)) room.acknowledged.push(actor.seat);
    if (room.members.every((m, i) => !m.human || room.acknowledged.includes(i))) { apply(room, -1, { type: 'begin' }); syncStage(room, now); }
    return;
  }
  if (cmd.type === 'draft' || cmd.type === 'submitWork') {
    if (room.stage !== 'work') throw new Error('Work has closed.');
    const action = validWork(room, actor.seat, p.value);
    if (cmd.type === 'draft') {
      if (!Number.isSafeInteger(p.revision) || p.revision <= (room.drafts[actor.seat]?.revision || 0)) throw new Error('Older draft ignored.');
      room.drafts[actor.seat] = { revision: p.revision, value: action };
    } else { apply(room, actor.seat, action); delete room.drafts[actor.seat]; syncStage(room, now); }
    return;
  }
  const allowed: Record<string, string[]> = { decide: ['approve'], board: ['boardVote'], reveal: ['warnVote'], investigate: ['investigate', 'skipInvestigation'], whistle: ['whistleVote'] };
  if (!allowed[room.stage]?.includes(cmd.type)) throw new Error('Action unavailable in this phase.');
  if (cmd.type === 'skipInvestigation') {
    if (actor.seat !== room.state.ceo) throw new Error('CEO only.');
    stage(room, 'review', now); return;
  }
  apply(room, actor.seat, { type: cmd.type, id: p.id, target: p.target, vote: p.vote });
  if (cmd.type === 'investigate') return;
  syncStage(room, now);
}

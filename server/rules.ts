import type { Room } from './types';
export const OP = require('../src/engine/core.js');
export const { viewFor } = require('../src/engine/views.js');
export const LESSONS: [string, string, string, number][] = require('node:vm').runInNewContext(require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/explainer/00-lessons.js'), 'utf8') + ';LESSONS');
export const INDUCTION_MS = LESSONS.reduce((n, l) => n + l[3] * 1000, 0);
export const DURATIONS: Record<string, number> = { induction: INDUCTION_MS, work: 95000, decide: 30000, board: 20000, reveal: 20000, investigate: 20000, review: 10000, whistle: 20000 };
export function apply(room: Room, seat: number, action: any) {
  const result = OP.apply(room.state, seat, action);
  if (result.error) throw new Error(result.error);
  room.state = result.state;
}
export function defaultWork(room: Room, seat: number) {
  return { type: 'submitWork', swaps: [], picks: [0, 1, 2], reveals: [], redeal: false, stamp: OP.rightStamp(room.state.P[seat].inh.cards), subject: 'Quarterly improvement proposal', style: { tpl: 'memo', font: 'grotesk' } };
}
export function cleanWork(input: any) {
  if (!input || typeof input !== 'object') throw new Error('Invalid draft.');
  const arr = (v: any, fallback: number[]) => {
    if (v === undefined) return fallback;
    if (!Array.isArray(v) || v.length > 3 || v.some(x => !Number.isInteger(x))) throw new Error('Invalid card choices.');
    return v;
  };
  return { type: 'submitWork', swaps: arr(input.swaps, []), picks: arr(input.picks, [0, 1, 2]), reveals: arr(input.reveals, []), redeal: !!input.redeal,
    stamp: ['Rec', 'Risky', 'Not'].includes(input.stamp) ? input.stamp : 'Risky', subject: String(input.subject || '').slice(0, 80),
    style: { tpl: String(input.style?.tpl || 'memo').slice(0, 24), font: String(input.style?.font || 'grotesk').slice(0, 24), art: String(input.style?.art || '').slice(0, 24), align: input.style?.align },
    claim: input.claim ? { kind: input.claim.kind, val: Number(input.claim.val) || 0, stamp: input.claim.stamp } : undefined,
    nextStyle: input.nextStyle ? { tpl: input.nextStyle.tpl, font: input.nextStyle.font } : undefined };
}
export function validWork(room: Room, seat: number, input: any) {
  const action = cleanWork(input);
  const result = OP.apply(room.state, seat, action);
  if (result.error) throw new Error(result.error);
  return action;
}

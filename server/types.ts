export type Stage = 'lobby' | 'induction' | 'roles' | 'work' | 'decide' | 'board' | 'reveal' | 'investigate' | 'review' | 'whistle' | 'end' | 'closed';
export interface Member { name: string; token: string; human: boolean; theme: string }
export interface Draft { revision: number; value: Record<string, any> }
export interface Room {
  code: string; tvToken: string; claimToken: string | null; host: number | null;
  members: Member[]; state: any; stage: Stage; phaseId: number; version: number;
  deadline: number | null; remaining: number | null; paused: boolean;
  presentation: { id: string; startedAt: number }; acknowledged: number[];
  drafts: Record<number, Draft>; receipts: Record<string, any>; createdAt: number; closedAt: number | null;
}
export interface Actor { kind: 'tv' | 'player'; seat: number; token: string }
export interface Command { id: string; phaseId: number; type: string; payload?: any }
export interface Store { save(room: Room): void; all(): Room[]; remove(code: string): void }

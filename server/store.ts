import { DatabaseSync } from 'node:sqlite';
import type { Room, Store } from './types';
export class SQLiteStore implements Store {
  db: DatabaseSync;
  constructor(file: string) {
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, body TEXT NOT NULL)');
  }
  save(room: Room) { this.db.prepare('INSERT OR REPLACE INTO rooms(code, body) VALUES (?, ?)').run(room.code, JSON.stringify(room)); }
  all(): Room[] { return this.db.prepare('SELECT body FROM rooms').all().map(row => JSON.parse(String(row.body))); }
  remove(code: string) { this.db.prepare('DELETE FROM rooms WHERE code = ?').run(code); }
  close() { this.db.close(); }
}

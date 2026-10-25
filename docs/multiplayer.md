# TV rooms and phone desks

## Run locally

Use Node 22.13+ (SQLite is built in), then `npm ci`, `npm run build`, and `npm start`. Open `http://127.0.0.1:8787` on the TV laptop. Create a room, open/scan the host invitation on one phone, then let everyone scan the replacement joining QR. Add bots explicitly if there are fewer than four players. Solo practice is at `/practice`.

Localhost is a development preview, not a phone-accessible hosted address. For real phones use a persistent HTTPS deployment with `PUBLIC_URL=https://your-domain`, `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=8787`, and a persistent writable `DATA_DIR`. Terminate TLS at a reverse proxy that forwards WebSocket upgrades and preserves the original Host. Do not cache `/api/*` or credentials. The server checks browser Origin against PUBLIC_URL. The production process refuses to start without an HTTPS public URL. No hosting account or domain has been provisioned by this change.

SQLite uses WAL and full synchronous writes. Run one service process per database: rooms are serialized in-process. Multiple workers or horizontal replicas need a room owner/coordination layer first. Back up the database and WAL consistently. Treat DATA_DIR as private: it contains reconnect credentials and unrevealed game data. Do not serve or commit it.

## Source boundaries

- `src/engine/`: deterministic rules, roster-aware actions, explicit `views.js` public/private projection. The legacy single-human API still works.
- `server/`: typed room lifecycle, command validation, synchronous SQLite persistence and HTTP/WebSocket transport. No game rule changes from browser clients.
- `src/hosted/`: projected-data-only TV and mobile UI, connection recovery, suit editing and induction. It never imports the full engine or Observer.

The static prototype and screen viewer remain separate local development tools. `build.sh` rebuilds them. The room server serves hosted source modules directly, with no separate frontend bundler.

## Protocol and recovery

POST `/api/rooms` creates a TV credential and one-use host claim. POST `/api/join` exchanges a room code/name (and first-host claim) for a player credential. The QR is generated locally, not through a third-party service. Credentials persist in the joining browser to survive refresh; use your own phone for private play.

WebSocket `/socket` begins with `{type:'auth',code,token}`. A command has `{id,phaseId,type,payload}`. The authenticated connection determines its seat; client seat fields are ignored. Accepted commands return an acknowledgement only after persistence. IDs deduplicate retries (latest 4096 per room); the phase guard rejects older actions. Clients receive monotonically versioned, audience-filtered snapshots. Draft writes have independent increasing revisions and cannot follow submission. Drafts carry tentative game choices, never engine state.

The server serializes arrivals and deadline expiry. Due deadlines take priority over newly processed commands. Preparation is 95s; nomination 30s; Board, warning, investigation and whistle decisions 20s; review 10s. Early completion advances voting/work. Roles wait for every human acknowledgement. Disconnections do not stop the clock. The host can pause/resume; all commands except host pause/resume/close are blocked while paused.

Missing work uses the last validated draft, otherwise the inherited policy with an honest stamp and default cover. Missing votes ratify/abstain, investigation skips, and human CEO timeout chooses a seeded random legal proposal. Bot CEOs use existing bot logic. Server seeds are generated cryptographically, not chosen by the host.

A restart recovers rooms paused with remaining time computed from the stored deadline at recovery. Reconnecting restores the current snapshot; expired presentation effects are not replayed. The TV handles music and shared effects; phones are silent. Induction captions follow the room clock and practice uses fabricated cards. Recorded narration is still absent.

Closed rooms and their private data expire after 24 hours. A room stays available until the host closes it; there is no automatic pause on player disconnection and no mid-game joining or seat replacement.

## Verification

`npm run typecheck`, `npm run test:multiplayer`, `npm run test:rooms`, `node test/human-actions.js`, `node test/hand.js`, `node test/balance.js`, `node sim/fun/fun.js`, `node sim/fun/sweep.js`, `npm run build`, `node test/explainer.js`, `node tools/check-structure.js`.

Integration tests include real WebSocket clients, 4/8-human five-quarter games, mixed bots, draft recovery, duplicate and stale commands, private payloads, role acknowledgement barriers, pause/restart and storage failures. Browser verification and physical iOS/Android device acceptance must be recorded separately; server tests do not establish touch/browser compatibility.

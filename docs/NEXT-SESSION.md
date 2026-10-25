# Multiplayer checkpoint — 25 October 2026

This is a committed implementation checkpoint, not a production-ready multiplayer release. Joel asked to stop and hand over so another task can proceed.

## Implemented

- Earlier title/desk polish, selectable desk aesthetics, six spare cards, standalone induction and source-file splits.
- Explicit multi-human roster and vote barriers, preserving legacy solo practice.
- Allowlisted TV/player projections, including own hands, Auditor authors and CEO/PIP visibility.
- TypeScript room service, WebSockets, SQLite snapshots, per-room serialization, reconnect credentials, private draft revisions, deduplication, server deadlines and pause/restart recovery.
- Hosted TV/join/phone routes, one-use host claim and QR joining, optional lobby bots, role acknowledgements, phone suit-by-suit editing, cover design, submissions and decision controls.
- Shared induction clock with captioned scenes and a phone practice exercise; TV-only music and short transition cues.

## Verified so far

- TypeScript check passed before the final small handover/invitation/test additions.
- Multi-human engine tests passed 24 full 4/8-player games, vote barriers and projection checks.
- Original human-action and six-card conservation suites passed.
- Balance/fun/sweep passed with unchanged baseline bot results; see sim/fun/CHANGELOG.md round 8.
- All eight room tests passed, including real-socket 4/8-player full games and reconnects: full 4/8-human and mixed-bot games, commands/deadlines/drafts, pause/restart, SQLite and actual WebSocket private snapshots.
- Standalone build, induction checks, source budgets and diff whitespace checks passed during implementation.
- Browser: hosted landing, create-room navigation and the TV host-claim QR render successfully. The local server uses port 8787. A restart deliberately recovers existing rooms paused.

## Next work, in priority order

1. Complete browser end-to-end testing: claim host, add/join players, induction/practice, role acknowledgements, phone edits, draft refresh, submission, votes and finish. The new hosted phone flow has not yet been exercised in a browser. Fix any issues before release.
2. Test real iPhone Safari and Android Chrome at 320–430px, on-screen keyboards, background/foreground, flaky mobile data, and TV at 1080p. No physical-device acceptance has been done.
3. Review command/privacy boundaries adversarially across every phase. Test multi-tab stale draft ownership and late edits during deadline expiry; confirm role/card information never appears in TV traffic. Current tests cover the principal paths, not an exhaustive security audit.
4. Polish coordinated presentation: hosted induction uses simplified captioned scenes and existing music. It does not yet reuse all of the richer standalone props or load optional narration clips. Recorded narration is still missing. Shared cues use presentation IDs/start times; music playback itself is not seek-synchronised after reconnection.
5. Review phone copy/feedback and public game logs for multiplayer wording (some legacy "your" wording remains). Check TV proposal density with eight seats and complete results readability.
6. Configure a persistent HTTPS deployment and a domain. No remote deployment was created. Localhost QR links cannot be used from another physical phone. Read docs/multiplayer.md for PUBLIC_URL, TLS proxy and persistent DATA_DIR.

## Start here

`npm ci`, `npm run build`, `npm start`; open http://127.0.0.1:8787. A fresh room avoids an earlier paused test lobby. To resume a recovered room, use its host phone's Resume control.

Run `npm run typecheck`, `npm run test:multiplayer`, `npm run test:rooms`, and `node tools/check-structure.js`. The source map is docs/architecture.md; protocol/hosting details are docs/multiplayer.md. Do not load generated dist HTML to locate source. Do not commit data/ (private room database), node_modules/, or the pre-existing untracked experiments/ directory.

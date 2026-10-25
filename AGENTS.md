# Notes for coding agents

- Keep `src/engine/` pure: no DOM, no network, no `Date.now()` or `Math.random()`. Randomness goes through `rand(s)`, which advances `s.rs`.
- Keep comments to one short line. Split files by concern as they grow (engine: core / bots / content).
- `OP.apply(state, seat, action)` is the only way state changes. It deep-copies its input and returns `{ state, events }` or `{ error }`.
- The plan is to move the engine into a shared TypeScript package for an authoritative server (one room per game), with a `viewFor(state, seat)` that strips hidden information. The UI does not do that filtering yet, so don't add new UI reads of hidden fields outside the Observer view.
- Bot logic mirrors `sim/sim2.py` (FINAL config). If you change a bot, run `node test/balance.js` and compare with the sim's roughly 50/50 balance.
- Rebuild with `./build.sh` after any change in `src/`, and run both test scripts.
- Style: two-space indent, single quotes, terse comments, matching the existing code.

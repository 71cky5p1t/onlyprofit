# Notes for coding agents

- Keep `src/engine/` pure: no DOM, no network, no `Date.now()` or `Math.random()`. Randomness goes through `rand(s)`, which advances `s.rs`.
- Keep comments brief and minimal: one short line. Keep compartments separate (engine, bots, content, brand, UI screens, animations, audio, viewer) and split files as they grow.
- `OP.apply(state, seat, action)` is the only way state changes. It deep-copies its input and returns `{ state, events }` or `{ error }`.
- The plan is to move the engine into a shared TypeScript package for an authoritative server (one room per game), with a `viewFor(state, seat)` that strips hidden information. The UI does not do that filtering yet, so don't add new UI reads of hidden fields outside the Observer view.
- Bots started as a port of `sim/sim2.py` and now keep a memory per bot (`p.mind`). After a bot change run `node test/balance.js` and `node sim/fun/fun.js`, keep bot games near 50/50 with `sim/fun/sweep.js`, and log the round in `sim/fun/CHANGELOG.md`.
- Rebuild with `./build.sh` after any change in `src/`, and run both test scripts.
- Player-facing words are current game terms in Australian English: proposal and cover page (not envelope), overtime hours (not tokens or coins), stood down, Board Ratify / Open it, Performance Improvement Plan. Code names like `envs` and `TOKENS` stay.
- Rules change only when Joel agrees. Log rule rounds in `sim/fun/CHANGELOG.md` and keep the README rule list current. `sim/playtest/` and `sim/*.py` are historical.
- Style: two-space indent, single quotes, terse comments, matching the existing code.

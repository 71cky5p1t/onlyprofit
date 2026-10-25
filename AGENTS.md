# Notes for coding agents

- Keep `src/engine/` pure: no DOM, no network, no `Date.now()` or `Math.random()`. Randomness goes through `rand(s)`, which advances `s.rs`.
- Keep comments to one short line. Split files by concern as they grow (engine: core / bots / content).
- `OP.apply(state, seat, action)` is the only way state changes. It deep-copies its input and returns `{ state, events }` or `{ error }`.
- The plan is to move the engine into a shared TypeScript package for an authoritative server (one room per game), with a `viewFor(state, seat)` that strips hidden information. The UI does not do that filtering yet, so don't add new UI reads of hidden fields outside the Observer view.
- Bots started as a port of `sim/sim2.py` and now keep a memory per bot (`p.mind`). After a bot change run `node test/balance.js` and `node sim/fun/fun.js`, keep bot games near 50/50 with `sim/fun/sweep.js`, and log the round in `sim/fun/CHANGELOG.md`.
- Rebuild with `./build.sh` after any change in `src/`, and run both test scripts.
- Style: two-space indent, single quotes, terse comments, matching the existing code.

## Efficient navigation

- Start with `docs/architecture.md`; read only the modules relevant to the task. Skip generated `dist/`, SVG path data and audio unless needed.
- UI concerns are split across `06-desk`, `06-work`, `06-dress`, `06-votes`, `06-screens`; induction lives in `src/explainer/`.
- `src/boot.js` is the only startup entry and is built last. New modules must initialize before it.
- Edit a component's stylesheet instead of adding generic override files. Run `node tools/check-structure.js` after structural work.
- Hand changes: also run `node test/hand.js`. Induction/build changes: also run `node test/explainer.js` after building.

- Hosted multiplayer: read `docs/multiplayer.md` first. Run `npm run typecheck`, `npm run test:multiplayer`, and `npm run test:rooms`; never send raw engine state to clients.

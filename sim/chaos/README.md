# Chaos sims for Petty Cash

Rough models (about 40 lines each) of borrowed game engines, scored on the same "is it a game?" yardsticks as Petty Cash today.
`node sim/chaos/run.js` runs all of them (1,500 games, 5 players) and writes `results.json`.

- `baseline.js` Petty Cash through the real engine
- `overtime.js` push your luck
- `pool.js` bonus pool greed
- `buck.js` pass the buck (hot potato, hidden fuse)
- `bribe.js` bribes on audit
- `forecast.js` bluff bidding
- `mix.js` overtime + bribes + buck

# Only Profit

A Jackbox-style social deduction game for 4–8 players. One cheerfully awful company has to hit its profit target in five quarters. Some employees might be quietly sinking it, or nobody is, and the company is just like this.

This repo holds the playable prototype: one human against bots, in a single HTML page.

## Run it

```sh
./build.sh
open dist/only-profit.html
```

No dependencies. The page loads its fonts from Google Fonts and works offline with fallback fonts.

## Layout

| Path | What it is |
| --- | --- |
| `src/engine/` | Pure engine: `core.js` rules and state, `bots.js` bot players, `content.js` words. No DOM, no `Math.random`, no clock. |
| `src/ui/*.js` | Browser UI, split by screen (core, brand, clip-art, cover pages, desk, clock-in, render, events, drag). Concatenated in order into one scope. |
| `src/head.html` | Page title and fonts. |
| `src/styles/*.css` | Styles, in cascade order (tokens in `01-base.css`). |
| `build.sh` | Builds `dist/only-profit.html` from the files above. |
| `sim/` | The Python Monte Carlo balance simulations the bots are ported from (`sim2.py` has the final config). |
| `test/` | Node scripts: `balance.js` plays bot-only games at every table size, and `human-actions.js` drives the human seat through 900 games. |

## Engine API

```js
const s0 = OP.newGame({ players: 4, seed: 123, loyalTier: 'smart', sabTier: 'smart', easy: false, spectate: false });
const { state, events } = OP.apply(s0, seat, { type: 'begin' });   // or { error }
```

Actions: `begin`, `submitWork` (`redeal`, `swaps`, `reveals`, `stamp`, `subject`, `style`, `claim`, `nextStyle`), `auditVote`, `approve` (the CEO nominates), `boardVote` (`vote`: `ratify` or `overrule`), `warnVote`, `whistleVote`, `advance`. `apply` never mutates the state it is given.

Seat 0 is the human. With `spectate: true` every seat is a bot and the game moves on `advance`.

## Rule assumptions not yet in the rules doc

- Whoever inherits a rejected proposal learns who wrote it. That is what makes complaint memos possible.
- Complaints are public memos on a bulletin board. Nobody can check them, and the human may lie.
- Cards revealed with overtime hours (work tokens) are shown to the whole table, so the Board can judge the CEO's nominee.
- Board vote, Clawback, ruthless saboteur bots, credibility-weighted warnings and loyal temperaments were added 2026-10-25 after the playtest review (https://claude.ai/artifact/66RMt61UfSLPKBWumRuCAd). Harness: `sim/playtest/`.
- No phase timers yet.

## Tests

```sh
node test/balance.js
node test/human-actions.js
```

# Only Profit

A Jackbox-style social deduction game for 4–8 players. One cheerfully awful company has to hit its profit target in five quarters. Some employees might be quietly sinking it, or nobody is, and the company is just like this.

This repo holds the playable prototype (one human against bots, in a single HTML page) and a screens viewer that shows every phase on TV and phone.

## Run it

```sh
./build.sh
open dist/only-profit.html
```

No dependencies. The page loads its fonts from Google Fonts (fallbacks offline) and its sound from `dist/audio/`, so serve `dist/` as a folder.

## Layout

| Path | What it is |
| --- | --- |
| `src/engine/` | Pure engine: `core.js` rules and state, `bots.js` bot players, `content.js` words and their values, `lex.js` each company noun's own valued words. No DOM, no `Math.random`, no clock. |
| `src/ui/*.js` | Browser UI, split by screen (audio, cues, core, brand, clip-art, cover pages, desk, clock-in, signing, render, events, drag, annual report). Concatenated in order into one scope. |
| `src/head.html` | Page title and fonts. |
| `src/styles/*.css` | Styles, in cascade order (tokens in `01-base.css`). |
| `src/viewer.html` | Screens viewer; embeds the built game. |
| `assets/audio/` | Music and SFX, with the tools that generate them. |
| `build.sh` | Builds `dist/only-profit.html`, `dist/viewer.html` and `dist/audio/`. |
| `sim/fun/` | Balance and fun harness against the live engine; `CHANGELOG.md` logs each rule round. |
| `tools/sentences.js` | Lists every Action × Target × Modifier sentence per company with its value (`deal=SEED` for one real deck), to audit that monstrous sentences pay and decent ones cost. |
| `sim/playtest/`, `sim/*.py` | Historical: scripted playtests on the PR #2 engine, and the original Python sims the bots were ported from. Their rules and targets are out of date. |
| `docs/how-to-play/` | The Staff Induction (how-to-play video): voiceover script, build brief, UI findings. |
| `test/` | Node scripts: `balance.js` plays bot-only games at every table size, and `human-actions.js` drives the human seat through 900 games. |

## Engine API

```js
const s0 = OP.newGame({ players: 4, seed: 123, loyalTier: 'smart', sabTier: 'smart', easy: false, spectate: false });
const { state, events } = OP.apply(s0, seat, { type: 'begin' });   // or { error }
```

Actions: `begin`, `submitWork` (`discards`: `[{pile: "inh"|"spare", su}]`, `swaps`, `reveals`, `stamp`, `subject`, `style`, `claim`, `nextStyle`), `approve` (the CEO nominates), `boardVote` (`vote`: `ratify` or `open`), `warnVote`, `investigate` (CEO, `target`), `whistleVote`, `advance`. `apply` never mutates the state it is given.

Seat 0 is the human. With `spectate: true` every seat is a bot and the game moves on `advance`.

## Rules not yet in the rules doc

Logged round by round in `sim/fun/CHANGELOG.md`.
- Whoever inherits a rejected proposal learns who wrote it, which makes complaint memos possible. Memos are public and unverifiable, and the human may lie.
- Cards shown with inputs are public, so the Board can judge the nominee.
- Setup option `ink: 'one'` (Blackouts: Luck of the draw): nobody picks what's blacked out. One random word on every page is inked when it's handed in, free; targets drop 1 at 4, 7 and 8 players. `src/engine/ink.js` holds every blackout rule.
- The Board votes Ratify or Open it on the CEO's nominee. An opened nominee that trails the best-looking proposal by more than 1 is overruled; a CEO caught on their own sits out a CEO turn.
- Stamps have a right answer. The CEO may privately investigate one stamp a quarter; a wrong one puts that player on a Performance Improvement Plan (announced, never explained), and their proposals open to the CEO only.
- Two Written Warnings and you're stood down (your department runs on autopilot). After Q5 the table names a saboteur: right reverses their losing policies (at least +3, the Clawback), wrong costs −3.
- Personal records: loyal staff score money-makers someone else approved, minus their losses; saboteurs score their approved losses. The best positive record on the winning side is Employee of the Year.
- Effect Modifiers rewrite the other two cards: With Thoughts and Prayers, Retroactively, Per Legal's Advice, Without Consultation.
- The engine has no phase timers; the UI times the work desk.

## Tests

```sh
node test/balance.js
node test/human-actions.js
```

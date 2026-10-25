# Staff Induction: build brief

A skippable how-to-play video that plays before Q1, built from the game's own pieces (felt, paper, colour cards, cover pages, stickers, the calculator) and narrated by an ElevenLabs voice. Script and shot list: [`script.md`](script.md). Things the explainer exposed about the UI: [`ui-findings.md`](ui-findings.md).

Read `AGENTS.md` first. Its rules apply: terse comments, small files, rebuild `dist/` and run both tests.

## What the research says

- **Jackbox** narrates every tutorial in character, in a TV-host register, with the phone screen shown beside the main screen. Tutorials are roughly a minute to ninety seconds. Since Party Pack 6, the VIP (first player to join) sees a Skip prompt on their phone and nobody else can skip. Complex rules are taught the first time they happen, not up front.
- **Gartic Phone** and **Among Us** barely explain anything up front; they rely on the first round being easy. That works for them because each round asks for one thing.
- **Takeaway for us**: a short in-character reel for the shape of a quarter, then one-line stingers over the live game for everything else. The reel shows; the voice only says what the picture can't.

## Where it lives

```
src/explainer/
  00-demo.js      fake state for the reel: 6 name tags, demo cards, demo cover pages
  01-shots.js     the shot list as data: id, est, line, tv(), phone(), beats[], sfx[]
  02-stage.js     mounts a shot into the existing TV and desk columns, runs its beats
  03-player.js    play / next / skip, VO clip loading, captions, the seen flag
  04-stingers.js  first-time stingers, diffed from state like 00-cues.js
src/styles/31-explainer.css
assets/audio/induction/  one mp3 per id in script.md
tools/vo/gen.mjs  reads script.md, calls the TTS, writes assets/audio/induction/
```

- `build.sh`: concatenate `src/explainer/*.js` after `src/ui/*.js` inside the same IIFE, so the explainer can call `cardHTML`, `coverHTML`, `lineHTML`, `stickers`, `artSVG`, `brandMark`, `sfx`, `music`, `hold` and `duck` directly. Copy `assets/audio/induction/` to `dist/audio/induction/`.
- **The engine is not touched.** The explainer is UI only; it never calls `OP.apply` except to `begin` when it ends.
- Build every visual from the real piece functions with demo data, never from screenshots, so the reel restyles itself when a piece changes and when the brand changes.

## When it plays

- **The reel** plays in the `brief` phase, after clocking in, in place of the current Begin screen. When it ends or is skipped, dispatch `{ type: 'begin' }`.
- **The setup screen**: replace the `<details class="rules">` block in `08-setup.js` with a way to watch the induction on its own (the binder object, closed, on the felt). That rules list is the kind of explanatory text Joel wants gone.
- **Stingers** fire from a `stingSync()` called next to `cueSync()` in `render()`. Each keeps a fired flag for the game. They duck the music and never block input.

## Skip

- A paper tag in the bottom-right of the felt, same control style as the mute button: two chevrons, no word. It appears after shot 2 the first time, immediately once `op-induction-seen` is set in `localStorage` (wrap in try/catch).
- Keys: `Esc` skips, `→` jumps to the next shot.
- Skipping plays the sign-off: READ & UNDERSTOOD stamps the binder, the binder shuts (under a second), then the clock drops and Q1 starts. Skipping should feel like stamping a form, not closing a window.
- **Multiplayer later**: only the VIP's phone gets the skip tag, as in Jackbox. Everyone else's phone mirrors the phone half of each shot, so they see their own screen being explained.

## Playback

- A shot runs until its VO clip ends plus a 400 ms tail. Beats inside a shot (`{ at: 0.4, add: 'flip' }`) are timed as a fraction of the clip's real duration, so retakes of different lengths still line up.
- No clip (not recorded yet, or failed to load): use `est` from the shot list and show captions.
- **Captions**: off while VO plays, on when muted or a clip is missing. Typed onto a strip of adding-machine tape along the bottom of the felt, the same tape as the timer. One line at a time, no speaker label.
- Music: `05-hold-music-clean` with `hold(true)` under the reel; `duck()` for each line. The sign-off opens the filter as the clock drops, then the Water Cooler starts with Q1 as it does now.
- Reduced motion: each shot shows its end state with a short crossfade; VO still plays.
- Mute: the existing mute button mutes VO too.

## Demo data

- Name tags: Gary, Denise, Trevor, Moira, Clive, You. CEO: Denise. Approved author: Trevor, Facilities.
- Inherited: `Monetise` (Action, +2), `the Break Room` (Target, −1), `Off the Books` (Modifier, +1).
- Drawn: `Automate`, `the Interns`, `Pending Review`. The swap in shot 6 is the Interns over the Break Room.
- The ? card: any Target with `v: 'V'`.
- The overruled nominee in shot 10: `Gamify the Pension Fund Indefinitely`, worth −4, written by the CEO.
- Cover page in shot 8: Memo, subject "Quick Win: Break Room Monetisation (Pilot)".
- Pull card words from `content.js` so brand LEX words appear when a brand is picked.

## The end-game shot

`01-shots.js` holds both variants of shot 12 (`12B` and `12W` in `script.md`) behind one constant, `ENDGAME = 'B' | 'W'`. Default `'W'`: the end vote plus personal records and Employee of the Year, which is what `core.js` does now. It's the only shot that should need editing when the end-game rules change.

## VO generation

`tools/vo/gen.mjs`, Node 18+, no dependencies:

1. Parse the `**<id>** — line` entries and the stinger table in `script.md`.
2. For each id, POST to `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` with the line, `model_id`, and the voice settings in `script.md`. Key from `ELEVENLABS_API_KEY`, voice from `ELEVENLABS_VOICE_ID`.
3. Write `assets/audio/induction/<id>.mp3`. Skip ids that already exist unless `--force` or the id is named on the command line, so one line can be re-recorded alone.
4. Trim and normalise with ffmpeg if it's installed (`silenceremove`, `loudnorm=I=-16`); otherwise write the raw clip.

Until the voice exists, the reel runs on captions and `est`.

## Tests

- Add `test/explainer.js`: every shot has an id, a line and an `est`; every `sfx` name exists in `assets/audio/sfx/` or `assets/audio/mp3/`; every stinger id appears in `script.md`; total `est` of the reel is under 110 s.
- Keep `node test/balance.js` and `node test/human-actions.js` passing (the engine is unchanged, so they should).

## Done when

- A new game plays the induction after clocking in, then Q1 begins.
- Skip works by tag and `Esc`, plays the stamp-and-shut, and appears early on a second game.
- With no VO files the reel still runs, captioned, at about 95 s.
- Dropping a VO file into `assets/audio/induction/` and rebuilding makes that shot speak and time itself to the clip.
- At least the rejected-inheritance, effect-Modifier and PIP stingers fire once each in a real game.
- The phone column and TV column of every shot share the same look; no shot uses a text box, a callout or an arrow to explain itself.
- `dist/` rebuilt, tests pass, `dist/viewer.html` gets an Induction entry so the shots can be stepped through.

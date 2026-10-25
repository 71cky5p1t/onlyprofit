# Source map

Read this map, then the relevant module. Do not read `dist/` to understand the code.
Solo practice remains a static build. Hosted multiplayer uses a Node/TypeScript room service, WebSockets and SQLite; see `docs/multiplayer.md`.

| Change | Source |
| --- | --- |
| Rule/state transitions, targets, deck and handovers | `src/engine/core.js` |
| Bot decisions and memory | `src/engine/bots.js` |
| Card words, effects and company lexicons | `src/engine/content.js` |
| UI state, draft and engine dispatch | `src/ui/01-core.js`, `04-actions.js` |
| Brand appearance | `src/ui/02-brand.js` |
| Shared cards, cover pages, policy lines | `src/ui/05-pieces.js`, `05-cover.js` |
| Public table and diagnostics | `src/ui/05-table.js`, `05-observer.js` |
| Private desk shell | `src/ui/06-desk.js` |
| Hand, overtime, timer and submission | `src/ui/06-work.js`, `11-drag.js` |
| Cover designer | `src/ui/06-dress.js` |
| Private role and phase screens | `src/ui/06-screens.js`, `06-votes.js` |
| Setup and screen composition | `src/ui/08-setup.js`, `09-render.js` |
| Induction narration, props, player, tips | `src/explainer/00-lessons.js` through `03-teaching.js` |
| Startup | `src/boot.js` (always last) |
| Screen viewer / parts catalogue | `src/viewer/main.js`, `parts.js`, `viewer.css` |
| Build and size guard | `tools/build.js`, `tools/check-structure.js` |

## Boundaries

The pure engine exposes `OP.newGame`, `OP.apply` and selectors. `apply` owns state transitions and returns a deep copy. UI drafts are tentative; submitting a draft goes through `apply`. Keep seeded randomness inside the engine. Do not import browser APIs into it.

The UI and explainer files share one private IIFE, concatenated alphabetically within each directory. Their declarations initialize before `src/boot.js` calls `render`. Keep top-level work to declarations/listener registration. Startup belongs only in the bootstrap. This preserves the downloadable single-page build without adding a runtime loader.

Reuse `cardHTML`, `coverHTML`, `lineHTML` and the existing design tokens. Tutorial props are fabricated; they never borrow other players' hidden fields. Public and private renderers are distinct, but the prototype still lacks a complete server-side `viewFor` boundary.

CSS is ordered by filename. Edit the owning component stylesheet; do not create another generic patch/override tail. `03-desk.css` and `18-work.css` retain some historical overlapping rules: consolidate only with rendered regression checks. Avoid a blanket CSS purge based on text search; templates generate class names dynamically.

## Six-spare hand contract

Each quarter: three inherited policy cards, six drawn spares (two per suit), three overtime hours. `swaps` still lists suits, preserving old actions. Optional `picks: [actionIndex, targetIndex, modifierIndex]` selects an index in `work[seat].D`; defaults are `[0,1,2]`. Swapping two suits costs three hours. Editing or undoing a tentative selection does not spend extra hours.

The deck has 48 cards per suit with distinct IDs. Bots consider both alternatives. After approval, the next manager inherits one seeded-random leftover per suit; the remaining leftovers are discarded. Rejected policies still pass intact. Card and handover invariants live in `test/hand.js`.

## Efficient checks

- Discover symbols: `rg -n 'function name|const name' src/`.
- Build: `./build.sh` (syntax-checks scripts, writes only changed HTML, copies only changed audio).
- Required regression: `node test/human-actions.js` and `node test/balance.js`.
- Hand / tutorial: `node test/hand.js`, `node test/explainer.js`.
- Structure: `node tools/check-structure.js` (source byte budgets; top 12 only).
- Bot-affecting changes also need `node sim/fun/fun.js`, `node sim/fun/sweep.js` and a changelog entry.
- Browser: inspect the playable page and `dist/viewer.html`; engine tests do not verify layout or gestures.

## Audit, 25 October 2026

The biggest editable UI file mixed work, design, voting and phase screens (~21 KB); these now have separate owners. The ~24 KB viewer was split into shell, layout, navigation and catalogue. Induction data, props, playback and contextual teaching are separate. The build now initializes once, after all modules, and avoids recopying unchanged audio.

`core.js` remains ~26 KB and bots ~14 KB. These are cohesive but coupled; the simulation variants patch core symbols, so an untested engine breakup would be risky. Use targeted symbol reads. Explicit size budgets prevent continued growth; extract a concern when its next substantial change warrants it. `05-art.js` is mostly SVG path data (~13 KB): skip it unless editing artwork. Generated `dist/` embeds source intentionally and must not be counted as source duplication.

## Hosted entry points

Read `server/rooms.ts` for serialized persistence, `server/lifecycle.ts` for deadlines, and `src/engine/views.js` for privacy. `src/hosted/app.js` coordinates projected snapshots; `desk.js` renders private controls. Hosted UI must never import the full engine. Keep server and hosted modules under the normal 12 KB source budget.

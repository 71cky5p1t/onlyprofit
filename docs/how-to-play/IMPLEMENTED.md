# Current induction

The lobby has a Staff Induction binder. New games play the induction before the private role memo; Start Q1 remains an explicit action after reading the role.

`src/explainer/00-lessons.js` is the current caption and chapter source (13 chapters, 106 seconds). `01-props.js` renders real game pieces with fabricated training data, including an interactive six-spare overtime exercise. `02-player.js` owns playback, chapter navigation, captions, pause and skip. `03-teaching.js` adds contextual first-time reminders. The screen viewer includes Induction.

Narration has not been recorded. The current introduction uses captions and existing music. Optional MP3 clips go in `assets/audio/vo/` as `vo-01-welcome.mp3`, etc., using the numbered lesson ID. Rebuild to discover and copy clips; loaded clips determine chapter duration. No external voice service is called by the build or game.

The attached script and original brief remain preserved as design references. Current rules provide six spare cards (two per suit), three overtime hours, and a three-card policy. The tutorial supports pause, previous/next chapter, chapter selection and immediate skip. Escape exits; arrow keys navigate. Skipping returns to the private role memo, so it cannot hide the allegiance instruction.

Validation: `./build.sh`, `node test/explainer.js`, `node test/hand.js`. The original engine balance and human-action suites also pass. Browser checks covered the lobby, induction playback and skip, role memo, overtime selections and refunds, honest stamp, and submission into CEO selection. Recorded narration and human multiplayer are not implemented.

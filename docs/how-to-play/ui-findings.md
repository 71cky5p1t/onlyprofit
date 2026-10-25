# What the induction exposed

Writing the script meant finding a picture for every rule. Where there was no clean picture, or the voice had to carry a rule the screen should, it's listed here. Worst first.

1. **The stamp's honesty rule can't be guessed.** A policy worth exactly 0 is "Risky", and so is anything with a ? card, even when the other two are worth +4. Nobody would infer that, so the script leans on the pencil tick ("the pencil tick marks the honest answer"). That makes the tick a rule, not a hint: it has to be on every stamp bar, always, and read as a tick rather than decoration. Alternative: let 0 be "Not recommended" so the rule becomes "is it a gamble, and if not, does it make money".

2. **Effect Modifiers need their own moment.** Four cards that rewrite the other two are too much for the main reel, so they're stingers the first time one lands in your hand. The ×2 / ×0 / ≥0 / ×−1 Dymo label is a symbol you have to learn. Better: when the card is in the Modifier slot, the other two marks visibly change (double, fade to 0, clamp, flip) on the desk before you commit, the same animation the TV plays at ratification. Then the card explains itself and the stinger becomes optional.

3. **What "it stinks" means for an opened nominee is invisible.** The Board overrules only if the nominee looks more than 1 worse than the best-looking proposal, computed from public estimates nobody sees. The voice says "if it stinks" because the screen can't show the test. Proposal: when a nominee is opened, slide the best-looking rival beside it, and let the comparison be the drama.

4. **Overtime prices escalate and the screen doesn't say so ahead of time.** Swaps cost 1, then 2, then 3; a re-deal is 2; a reveal is 1. The script avoids numbers entirely. The punch card should preview the holes a move will punch while you drag (ghosted holes), so the price is on the object before you commit.

5. **Inherited cards don't look inherited.** "You inherit the last manager's work" is the hook of the game, but on the desk your three inherited cards look like any three cards. Give them a mark of their previous owner: the sticky note on a rejected stack, a coffee ring on leftovers, a different paperclip. Then the two handover kinds (rejected stack with the author's note vs. approved leftovers) explain themselves and two stingers shrink to sound cues.

6. **Saboteurs have nothing to watch.** Loyal players watch the calculator crawl to the target. Saboteurs now score their approved losses (PR #24) but no object shows that score to them. Their role memo, or the back of their name tag on their phone, should keep a private tally they can glance at. Without it the end-game shot is explaining a number nobody saw all game.

7. **Written Warnings aren't in the reel.** The warning vote happens every quarter, but there's no room for it in 95 seconds and it's still under review alongside the end vote. It's a stinger for now (`j-warning`). If warnings stay, the reveal phone screen needs to read as a vote without its "Written Warning" heading doing the explaining.

8. **The pace isn't readable.** A target of +21 over five quarters means about +4 a quarter, but the calculator only shows the total. A notch per quarter on the meter (where you should be by now) would let the goal shot say "hit the target" and the table see if it's on track, without a number.

9. **"Onboarding" should be "Induction".** The `brief` phase label reads Onboarding; induction is the Australian term and matches the tape. Rename it in `PHASE` when the reel lands.

10. **The setup screen's rules list.** `08-setup.js` still carries a `<details>` block of rules prose. Once the reel exists, replace it with the closed binder as the way to rewatch.

11. **Specialists are role-memo text.** The Auditor and Designer at 6+ players are explained by a subtitle on the memo ("you see who wrote every proposal"), which is the hint-text pattern Joel doesn't want. The stingers can carry it; the memo can then be just the title and a stamp.

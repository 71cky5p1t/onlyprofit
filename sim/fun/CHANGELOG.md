# Refinement rounds

`node sim/fun/fun.js 1000` prints the fun table, `node sim/fun/sweep.js` prints win rate by target, and
`node sim/fun/fun.js 600 '{}' table <variant>` runs a rule experiment from `variant.js`.

## Round 1 (2026-10-25): humanlike bots

Each bot keeps a memory (`p.mind`): trust per player, the envelope colours it has seen each player use, and a risk appetite.
- Knows when a memo about it is a lie, holds the grudge, and answers it out loud. Saboteurs deny true memos too.
- Weighs a memo by who wrote it and whether it was denied. Memories fade about 15% a quarter.
- Reads envelopes like a person: shown cards, a temperament's faith in hidden cards and stamps, a guess at the author from colours, more nerve when behind.
- Board votes on its own read; overrules faster when the nominee looks like the CEO's or a suspect's colours.
- Slow to warn in Q1, quicker by Q4. At the whistle, names freely when it can't cost the win, holds back when it could.
- Saboteurs lie low for a quarter when suspected, pile on people already under suspicion, report real bad handovers truthfully, sometimes stamp a trap Recommended, and send bad envelopes in someone else's colours.
- Targets retuned for the sharper table: 4p 19, 5p 21, 6p 21, 7p 22, 8p 23.

| | before | after |
|---|---|---|
| company wins (bots) | 44–53% | 47–54% |
| whistle names the right person | 62–67% | 81–86% |
| warnings that hit a loyal player | 40–50% | 17–27% |
| loyal players stood down, of all stood down | 13–18% | 2–7% |
| no-saboteur games where someone is named anyway | 19–26% | 9–20% |
| lies that get a loyal player warned | 3–19% | 1–10% |
| scripted human saboteur (exploit / subtle) | 46–34% / 45–38% | 46–42% / 58–47% |

Unchanged and the main fun problems: an audit catches a losing envelope in 0–3% of quarters, an approved policy loses
money in 2–5%, the CEO has a close call in 28–55%, and a saboteur's own envelope is almost never approved.

## Round 2 (2026-10-25): what would make the big moments happen

Saboteurs now build traps on purpose: they show their good cards, hide the losing ones, and stamp the envelope Recommended about half the time when nobody suspects them yet.
That was a small effect. Bot games are 48–53% wins for the company, and a trap gets approved in 5–8% of quarters (it was 4–7%).

The rule experiments are in `variant.js`, run at 800 games per player count:
- `fineprint` (Modifier never shown), `reveal1` (one card shown), `fx8` (eight effect Modifiers), `tamper` (the saboteur secretly swaps one card, once a game).
  None of them pushes losing approvals or audit catches above about 5% of quarters. Card values cap the damage a trap can do.
- `openNom`: the separate Audit vote is removed. After the CEO nominates, the Board can vote to open the nominee and overrule only if it disappoints.
  This is one vote fewer per quarter. The Board opens the nominee in 11–21% of quarters, and about half of those catch a losing envelope (6–9% of quarters, up from 1–4%).
  Warnings that hit loyal players fall to 8–10%. The company gains 4–7 points of win rate, so it needs targets about 1 higher (4p 20, 5p 22, 6p 22, 7p 23, 8p 24).
  This one needs Joel's call.

## Round 3 (2026-10-25): the Board opens the pick (Joel: yes)

The separate Audit vote is gone. After the CEO nominates, the Board votes Ratify or Open it. If the opened envelope trails the best-looking one by more than 1, the Board overrules: the author is named, and a CEO caught on their own envelope sits out a turn, as before.
Bots open the nominee when it trails their own read, wears the CEO's or a suspect's colours, or is Recommended with little shown. Targets: 4p 19, 5p 21, 6p 22, 7p 23, 8p 23.

| | round 2 | round 3 |
|---|---|---|
| votes per quarter | 3 | 2 |
| company wins (bots) | 48–53% | 44–54% |
| quarters where an opened envelope is a loser | 1–4% | 6–8% |
| warnings that hit a loyal player | 17–27% | 7–9% |
| no-saboteur games where someone is named anyway | 9–20% | 3–6% |
| whistle names the right person | 81–87% | 88–92% |
| scripted human saboteur (exploit / subtle) | 46–42% / 58–46% | 54–43% / 58–44% |

The table is now very good at finding the saboteur. Humans will lie better than these bots, so this needs a live playtest before anything is softened.
The `tamper` and `openNom` experiments were removed from `variant.js` (one is now the rule, and the other hooked into the old Audit).

## Round 4 (2026-10-25): UI and language continuity

Full review with screenshots: `/mnt/project-files/only-profit/refinement/ui-review-round4.md`. Fixed in this round:
- The TV no longer shows "From You · Legal" or your department before approval. The shared screen only names authors once their proposal is approved. The Auditor's sight moved to the phone.
- Explanatory labels are gone ("Memos are unverifiable", "Awaiting the CEO", "Approved policy unmasked", "Your desk is open", "Playtest build 0.4"). "Clawback" jargon on the Whistleblower phone became `+ · −3`.
- The TV says "Quarter closed" when the phone does. Pages sit in one row at 4–8 players.
- The calculator's unlit segments are dimmer, so "8+5.0" no longer reads as eight plus five.
- The end screen is now an Annual report: the five approved cover pages with their sentences, saboteur pages stamped, the total against the target, and everyone's name tag stamped Loyal or Saboteur. The old table is still there in Observer mode.
Handed to the UI thread: TV panels as objects, phone downtime screens, squiggle-to-sign on the votes.

## Round 5 (2026-10-25): investigations and the PIP (Joel: yes)

The stamps now have a right answer. Any wildcard means Risky, a sure gain means Recommended, and a sure loss (or zero without a wildcard) means Not recommended. Lying is still allowed.
Each quarter, once the reveal is done, the CEO may investigate one person. The check is private, and it looks at the stamp on that person's proposal from that quarter. If the stamp was wrong, the person goes on a Performance Improvement Plan. That is announced at the start of next quarter, but not why. A cleared player is never announced. From then on, a PIP player's proposal is open to the CEO only, and the TV still shows it sealed.
Bots: a loyal bot always stamps right. A disguised saboteur stamps a trap with a wildcard Risky, which is honest. A saboteur on a PIP plays straight unless the CEO is a fellow saboteur. A bot CEO investigates whoever it would warn.

| | round 4 | round 5 |
|---|---|---|
| company wins (bots) | 44–54% | 45–54% |
| investigations per game | — | 0.8–1.4 |
| investigated players who are saboteurs | — | 82–86% |
| loyal players put on a PIP | — | 0% |
| investigated saboteurs put on a PIP | — | 39–42% |
| scripted human saboteur (exploit / subtle) | 52–51% / 56–57% | 52–51% / 58–59% |

No retune was needed. Experiments kept in `variant.js`: `nowhistle` (saboteurs win 63–70% even with lower targets in `lowtgt`), `nowarn`, and `ceowhistle` + `ceotgt` (only the Q5 CEO names the saboteur; that version is balanced).

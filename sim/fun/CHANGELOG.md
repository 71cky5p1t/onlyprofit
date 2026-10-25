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

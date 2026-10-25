# Variants to test

A brief for Codex (or anyone) to run through `sim/fun/`. Each variant is a rule change aimed at one known problem. None of these is a rule yet. Joel decides after the numbers.

## What we're trying to fix

From the sim rounds so far (`sim/fun/CHANGELOG.md`):

1. **Saboteurs are too easy to name.** Bots name the right one about 90% of the time. Humans will be worse at it, but the game has too little noise.
2. **Losing policies almost never get through** (1–3% of quarters). A saboteur's damage comes from blocking good pages as CEO and handing over junk, not from sneaking bad pages through. That's the least dramatic kind of sabotage.
3. **The end vote decides too much.** The ±3 accusation flips 24–32% of results.
4. **Downtime.** Most players do nothing between Work and the vote.
5. **Every quarter feels the same.** Nothing changes the shape of Q2 against Q4.

## Two rules every variant must keep

- **Authorship stays anonymous until approval.** Nothing may tie a player to an unapproved page, including by timing (a public penalty straight after a challenge on page C names C's author).
- **Inheritance stays unprovable.** Nobody can prove what they were handed.

Each variant below has a **Risk** line against these.

## Ranking

Test in this order. Rank weighs how many problems it hits, how cheap it is to sim, and whether it reads well on a TV with friends.

| # | Variant | From | Fixes | Sim cost |
|---|---|---|---|---|
| 1 | E1 HR Knows | Avalon | 3, 1 | medium |
| 2 | B4 Implementation Team | The Resistance | 2, 4 | medium |
| 3 | C1 Market Report | Pandemic, Balatro's boss blinds | 5 | low |
| 4 | B5 Two-Key Sign-off | Secret Hitler | 2, 1 | low |
| 5 | A4 Golden Parachute | Werewolf's Tanner | 1, 3 | medium |
| 6 | B6 The Break Room Fridge | Overcooked, Sushi Go | 2, 4 | medium |
| 7 | D4 Best Cover Page | Quiplash | 4 | low |
| 8 | A1 Hungover Auditor | Blood on the Clocktower | 1 | low |
| 9 | B2 Executive Powers | Secret Hitler | 2 | medium |
| 10 | C5 Financial Year | (short mode) | pacing | low |
| 11 | A3 Restructure | Battlestar Galactica | 1, 5 | low |
| 12 | F1 Banked Leave | Balatro's interest | 5 | low |
| 13 | B1 Crisis Meeting | Battlestar Galactica | 2 | medium |
| 14 | C3 Hot Desking | Overcooked | 1, 2 | medium |
| 15 | D3 Exit Interview | Blood on the Clocktower | 3, 4 | low |
| 16 | A2 KPIs | Dead of Winter | 1, 4 | high |
| 17 | E2 Profit Guidance | Two Rooms and a Boom | 5 | low |
| 18 | C2 Corporate Perks | Balatro's jokers | 3, 5 | medium |
| 19 | F2 Kickbacks | Diplomacy, Coup | 4 | live only |
| 20 | B3 Sweeteners | Sheriff of Nottingham | 2, 4 | medium |
| 21 | D1 "That's a lie" | Coup | 1, 4 | medium |
| 22 | A5 The Founder's Nephew | Blood on the Clocktower's Saint | 3 | medium |
| 23 | C4 Core Values | Monikers | laughs | low |
| 24 | D2 Emergency All-Hands | Among Us | 4 | medium |
| 25 | F3 Best Practice | Balatro's deck upgrades | 5 | low |

B1 and B4 overlap (both give saboteurs a deniable hand in the result). Run both and keep one. B3 and F2 overlap the same way.

## How to run one

- Add the patch to `V` in `sim/fun/variant.js` (search-and-replace on `core.js`, `content.js` or `bots.js`), or copy the engine to a scratch folder when the change is too big to patch.
- `node sim/fun/fun.js 1500 '{}' table <variant>` gives the fun table. `node sim/fun/sweep.js 1500 <variant>` gives win rate by target.
- `node sim/fun/compare.js 1500 main=src/engine/core.js x=<path to patched core.js>` gives main against the variant on the same seeds, including the scripted human saboteur (`sim/fun/human.js`).
- Retune targets so bots and the scripted saboteur both sit near 50%, then compare what moved.
- Report these for each variant: company wins, scripted saboteur wins (exploit and subtle), right saboteur named, warnings on loyal players, losing policies approved, end-vote flips, comebacks, live going into Q5, and how many extra taps or decisions it adds per quarter.
- Bots need to play the new rule sensibly or the numbers mean nothing. Each **Hook** says what the bots need. Keep the bot logic in `bots.js` (or a new `bots-<variant>.js` in the scratch engine), not in `core.js`.
- Add each round's results to `sim/fun/CHANGELOG.md`.

## The variants

### A. Noise: harder to read the table

**A1. Hungover Auditor** (Blood on the Clocktower's Drunk). At 6+ players, the Auditor sees the wrong author on one page per quarter and doesn't know which one. **Tests:** problem 1. **Hook:** where the Auditor's view is built, swap one author. **Watch:** right saboteur named should drop toward 75–80% without making the company lose. **Risk:** none.

**A2. KPIs** (Dead of Winter's secret objectives). Every loyal player also gets a private selfish target, like "Be the CEO's pick twice", "Never stamp Not recommended" or "Get someone a Written Warning". Meeting it scores on their personal record. Loyal players then act a bit dodgy for their own reasons, so they look suspicious. **Tests:** problems 1 and 4. **Hook:** add `p.kpi` to bots and have them chase it with some weight. **Watch:** wrong warnings go up, but not past about 15%. **Risk:** none.

**A3. Restructure** (Battlestar Galactica's sleeper phase). At the start of Q3, a second Headcount Memo can turn one loyal player into a saboteur (30% chance), and they're told privately. Everything the table worked out in Q1–Q2 is now suspect. **Tests:** problems 1 and 5. **Hook:** in `startRound` when `s.r === 3`. **Watch:** whether early reads stop deciding the end vote. **Risk:** none. Records need a rule for a player who changed sides (score each half on its own side).

**A4. Golden Parachute** (Werewolf's Tanner, Clocktower's Jester). At 5+ players, one loyal seat is instead the Departing Executive. Their role memo says only "Your package is generous if you are let go." They win alone, alongside whichever side wins, if they are stood down or named in the end vote. A wrong name still costs the company 3, so naming them is a real mistake. **Tests:** problems 1 and 3. **Hook:** `p.exec = true`, drawn from the loyal seats in `newGame`. The bot plays a "looks guilty, isn't": lies on its stamp half the time, writes memos with wrong numbers, but builds pages near zero. `scoreStaff` gives them a win flag. **Watch:** right saboteur named should fall to 75–85%; wrong warnings may rise past 15%, which is too far. Company wins will drop, so retune. **Risk:** none. It adds a third reason to act shifty, which is the point.

**A5. The Founder's Nephew** (Blood on the Clocktower's Saint). One loyal player is the Founder's Nephew, and knows it. The saboteurs also know who it is. If the table stands the Nephew down or names them in the end vote, the company pays 4 instead of 3 ("Legal has been in touch with his father."). Saboteurs now have a framing target. **Tests:** problem 3. **Hook:** `p.nephew`; saboteur bots aim lie memos and warning votes at the Nephew; the end-vote swing reads −4 for them. **Watch:** lie memos per game, wrong warnings, and whether loyal bots get more cautious about naming anyone (`named` should drop). **Risk:** none.

### B. Make bad policies land

**B1. Crisis Meeting** (Battlestar Galactica's skill checks). In Q3, after the normal pick, everyone puts one card face down into a shared pot. The pot is shuffled and totalled, and it must reach +2 or the company loses 3. Nobody can tell who threw the −2, but the pot is revealed card by card. **Tests:** problem 2. It gives saboteurs deniable damage that the table *sees*. **Hook:** a new phase after `approve` in Q3. Bots throw their best spare (loyal) or worst (saboteur, unless suspected). **Watch:** saboteur wins, and whether the right-name rate drops. **Risk:** none; the pot shows cards, never who threw them.

**B2. Executive Powers** (Secret Hitler). When a policy loses money, the CEO who approved it gets a power, picked in quarter order: investigate anyone, pick the next CEO, or force a reshuffle of a department. Failure hands out power, so a saboteur has a reason to push a loser through. **Tests:** problem 2. **Hook:** in `approve` when `actual < 0`. **Watch:** losing policies approved should rise to 5–10% of quarters. **Risk:** "investigate anyone" must stay a stamp check with the PIP outcome, never a look at authorship.

**B3. Sweeteners** (Sheriff of Nottingham's bribes). An author can clip spare overtime hours to their cover page. If it's approved, the CEO banks those hours toward their personal record. A sweetened page looks like confidence, or like a bribe. **Tests:** problems 2 and 4. **Hook:** spend unused tokens on `e.sweet`, and have bots weigh it in `feel`. **Watch:** whether loyal CEOs take more bad pages. **Risk:** none.

**B4. Implementation Team** (The Resistance's missions). After the Board's vote, the CEO picks an implementation team: 2 players at 4–5p, 3 at 6–8p, never themselves. Each team member secretly taps Deliver or Botch. Each Botch takes 2 off the policy's result, and the TV shows only how many Botches there were ("Implementation was… mixed."). Loyal players can't Botch. **Tests:** problems 2 and 4. Damage no longer depends on a saboteur's own page being picked, and the CEO's team choice becomes something to argue about. Round 2's `tamper` didn't move anything because card values cap the damage; a Botch isn't capped. **Hook:** a `team` phase between `resolveBoard` and `approve`; `s.team`, `s.botches`. CEO bots pick their lowest-suspicion players. Saboteur bots Botch unless the team is 2 and they're already suspected. A Botch nudges suspicion on every team member, Resistance style. **Watch:** losing policies approved should rise to 10–20% of quarters. Right saboteur named could go either way: team logic is strong evidence in The Resistance. Count the extra phase (about 15 seconds). **Risk:** none to authorship; Botches are counted, never named. If two saboteurs share a team and both Botch, the table learns there are two, which is fine.

**B5. Two-Key Sign-off** (Secret Hitler's President and Chancellor). The CEO shortlists two pages. The Deputy picks one of the two, and the Board votes Ratify or Open on that one as now. The Deputy is last quarter's CEO (in Q1, next quarter's). A bad policy now has two suspects: "I gave you two good ones" against "You gave me two duds." **Tests:** problems 2 and 1. It also blunts CEO self-approval, the old exploit worth 66–82% to a saboteur, since the Deputy decides. **Hook:** `nominate` takes two ids; the Deputy bot runs `botPick` over the shortlist only; a saboteur CEO shortlists one good page and their worst. Suspicion for a loser splits between CEO and Deputy. **Watch:** scripted exploit saboteur wins should fall; losing policies approved should rise a little; right saboteur named should drop. **Risk:** none.

**B6. The Break Room Fridge** (Overcooked's pass, Sushi Go's drafting). At the start of Work, everyone puts one of their three drawn cards in the office fridge, face down. Loyal players' card is picked at random (it's whatever was at the back). Saboteurs choose. During Work, anyone can spend 1 overtime hour to take one card out of the fridge blind (its suit shows, nothing else) and swap it into their page. On Friday the fridge is cleaned out on the TV, card by card: "+1, −2, ?, −2". A fridge full of −2s tells the table someone's poisoning it, but not who. **Tests:** problems 2 and 4, and paranoia in clean games. **Hook:** `s.fridge`; a `fridge` choice in `submitWork`; loyal bots take from the fridge when their hand is bad and the last clean-out looked healthy; saboteur bots leave their worst card. **Watch:** losing policies approved, and `cleanParanoia` (naming someone in a game with no saboteurs). **Risk:** none. Fridge cards are anonymous by design, and inheritance is untouched.

### C. Chaos: quarters that feel different

**C1. Market Report** (event decks from Pandemic and Dead of Winter, Balatro's boss blinds). Each quarter opens with one public card that changes how cards are valued: Recession (every Target −1), Bubble (wildcards swing ±4), Audit Season (every reveal is free), Hiring Freeze (no re-deals), Synergy (Modifiers count double). Five or six cards, one drawn per quarter. **Tests:** problem 5, and Joel's "more chaotic". **Hook:** `s.market` read by `total()` and `workCost()`. Bots read it through `evs()`. **Watch:** margin spread and comebacks. Targets probably barely move. **Risk:** none.

**C2. Corporate Perks** (Balatro's jokers). When profit runs 3+ above pace, the company must spend 2 of it on a permanent perk that bends the rules: Open Plan (every page shows one card), Flexible Hours (+1 overtime hour for everyone), Casual Friday (stamps are optional). It's a runaway brake that still feels like a reward. **Tests:** problems 3 and 5. **Hook:** in `next()`. **Watch:** blowouts and comebacks. **Risk:** none.

**C3. Hot Desking** (Overcooked's kitchens that move under you). In one random quarter from Q2 to Q4, announced when it starts, everyone builds their page as normal, then every desk slides one seat to the left. You stamp and dress a page you didn't build, and it goes on your record if it's approved. You know what you were handed; nobody else does. **Tests:** problems 1 and 2. A saboteur can stamp a neighbour's mediocre page Recommended and let it sink, and a loyal player can get blamed for someone else's junk. **Hook:** in `startRound`, `s.hot = true`; bots build, then stamp the page they receive (loyal: `rightStamp`; saboteur: Rec on anything losing). The `author` becomes the stamper. **Watch:** losing policies approved, right saboteur named, wrong warnings. **Risk:** inheritance stays unprovable, since you can't prove what slid onto your desk. Make sure the TV never shows seat order during the slide.

**C4. Core Values** (Monikers' callbacks). Every approved policy's Target word gets pinned to the TV as a Core Value ("We are a Hamster-first company."). Any later page that uses a card with a pinned word gets +1 per pinned word. By Q5 the company believes in four deranged things. **Tests:** laughs, and gives the table a reason to remember Q1. **Hook:** `s.values` in `approve`; `total()` adds the bonus. Words repeat because each suit's 12 words appear twice (more words per suit would help everything, per the card-chaos round). **Watch:** targets (likely +1), and how often a page carries a Core Value. **Risk:** none.

**C5. Financial Year** (a short mode). Four quarters instead of five, for a 22–25 minute game. **Tests:** pacing. **Hook:** `ROUNDS = 4`; the 4p "most approvals" Q5 CEO rule becomes Q4. Retune targets with `sweep.js` (expect about 0.8× today's). **Watch:** right saboteur named (less evidence), live going into the last quarter, end-vote flips. **Risk:** none.

### D. Table talk: give everyone something to do

**D1. "That's a lie"** (Coup's challenge). Once per quarter, any player can challenge one page's stamp for 1 overtime hour. If they're right, the author gets a Written Warning. If they're wrong, the challenger does. This replaces the CEO-only investigation. **Tests:** problems 1 and 4. **Hook:** in the reveal phase, have bots challenge their top suspect when confidence is high. **Watch:** wrong warnings. If the bots get too sharp here, so will the table. **Risk: high as written.** A Written Warning straight after a challenge on page C names C's author. Safer version to test: a caught page is shredded (can't be picked; the TV says only "Proposal C has been withdrawn."), the challenger gets their hour back plus one, and a wrong challenger loses the hour. No warning either way.

**D2. Emergency All-Hands** (Among Us). Once per game, any player can stop the quarter before the CEO picks and force an immediate warning vote. If it fails, the caller is on a PIP. **Tests:** problem 4. **Hook:** a bot calls it when one player's suspicion passes a threshold. **Watch:** whether being stood down happens earlier, and whether that's fun or just brutal. **Risk:** none.

**D3. Exit Interview** (Blood on the Clocktower's ghost vote). A stood-down player keeps one secret vote that counts double in the end vote. Being sacked isn't the end of your game. **Tests:** problems 3 and 4. **Hook:** in `resolveWhistle` weights. **Watch:** end-vote accuracy. **Risk:** none.

**D4. Best Cover Page** (Quiplash). After each Reveal, every phone shows all the quarter's cover pages, minus your own, and you tap the one you liked best. The winner's subject line gets a gold star on the TV and its author gets 1 extra overtime hour next quarter, delivered privately. The TV never says whose it was. **Tests:** problem 4, and laughs. It rewards the subject lines and cover pages, which are the funniest thing players write. **Hook:** laughs can't be simmed. For balance, give +1 hour to a random non-CEO author each quarter. **Watch:** company wins should barely move; if they do, the extra hour is too strong. **Risk:** low. A player whose turn suddenly gets better could be linked to the starred page; the hour is small enough that nobody should spot it.

### E. The endgame

**E1. HR Knows** (Avalon's Merlin and Assassin). One loyal player, HR, knows who the saboteurs are. If the company wins, the saboteurs get one guess at who HR is, and naming them steals the win. HR has to steer the table without being obvious. This could replace the ±3 end vote. **Tests:** problem 3 and Joel's open question about an end-game he likes. **Hook:** add `p.spec = 'HR'`. HR bots vote with knowledge plus noise, and saboteur bots guess HR from voting patterns. **Watch:** how often the steal lands. Aim for 25–35%. **Risk:** none; HR knows roles, not authorship. In a clean game HR knows there's nobody, which is its own joke: test whether HR's confident "trust everyone" is too strong a tell.

**E2. Profit Guidance** (hidden targets, like Two Rooms' hidden roles). The exact target is sealed until the end of Q3. Q1–Q2 only show a range (say 20–26). **Tests:** problem 5, and Q5 tension. **Hook:** draw `s.target` from a range at Q3. **Watch:** live going into Q5. **Risk:** none.

### F. Economy

**F1. Banked Leave** (Balatro's interest). Unspent overtime hours carry into the next quarter, up to 6. A player who sat on their hands in Q2 can re-deal and swap twice in Q3. **Tests:** problem 5. Quarters stop being identical, and a saboteur can save up for one big Q5. **Hook:** `p.bank` in `submitWork`; `workCost` checks `TOKENS + bank`. Bots need a saving rule: loyal save when their inherited page is already good, saboteur bots save for their CEO quarter. **Watch:** proposals per desk by quarter, Q5 margin spread, scripted saboteur wins. **Risk:** none.

**F2. Kickbacks** (Diplomacy's deals, Coup's foreign aid). During the CEO's pick, any player can send any other player 1 of next quarter's overtime hours, publicly and named ("Trevor has sent Denise a fruit basket."). It's a public favour, so it reads as a bribe, an alliance or a tell. **Tests:** problem 4. **Hook:** bots won't do this well; this one needs a live playtest. In the sim, check only that a stream of gifted hours to one player doesn't break balance. **Watch:** in a live game, whether people use it. **Risk:** none; gifts are public and say nothing about pages.

**F3. Best Practice** (Balatro's deck upgrades). When a policy makes money, its best card goes back into its pile one point better, with a BEST PRACTICE sticker. A losing policy's worst card goes back one point worse. The deck remembers the company's history. **Tests:** problem 5. **Hook:** in `handovers`, edit the discarded card's `v` before it goes to `disc`. **Watch:** targets (likely +1–2), and comebacks. **Risk:** none.

## Not on this list

Already simmed, already rejected, or thought about and dropped:
- No end vote, or a saboteur damage threshold in its place (option B): saboteurs win 63–69%.
- Receipts that prove an inheritance: kills framing.
- Q5 doubled, banning CEO self-approval, rotating the 4p Q5 CEO: rejected in the first playtest review.
- Six spares; everyone submits two pages: both raise detection. Four random spares is the recommended hand if the hand changes.
- Swingier card values (`wide`, `wild4`, `wild3`, `chaos`): bots just avoid the bad cards.
- "CEO approves two" (`two`): adds noise but needs the Board on both picks and targets 26–35.
- A Spyfall-style secret word only loyal players know: it makes saboteurs easier to spot, which is the wrong direction.

## Already simmed (2026-10-25)

- Six spares, two per suit: balances at 24/25/26/26/27 (4p should be 23), but the table names saboteurs more often. See the Claude Doc "Six spare cards: balance verdict".
- Four spares with random suits: balances at 20/22/23/24/25 with main's deduction profile. This is the recommended hand if the hand changes.
- Card chaos (`wide`, `wild4`, `wild3`, `chaos`) and two policies (`two`): results in `sim/fun/CHANGELOG.md`.

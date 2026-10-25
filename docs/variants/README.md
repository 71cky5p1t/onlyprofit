# Variants to test

A brief for Codex (or anyone) to run through `sim/fun/`. Each variant is a rule change aimed at one known problem. None of these is a rule yet. Joel decides after the numbers.

## What we're trying to fix

From the sim rounds so far (`sim/fun/CHANGELOG.md`):

1. **Saboteurs are too easy to name.** Bots name the right one about 90% of the time. Humans will be worse at it, but the game has too little noise.
2. **Losing policies almost never get through** (1–3% of quarters). A saboteur's damage comes from blocking good pages as CEO and handing over junk, not from sneaking bad pages through. That's the least dramatic kind of sabotage.
3. **The end vote decides too much.** The ±3 accusation flips 24–32% of results.
4. **Downtime.** Most players do nothing between Work and the vote.
5. **Every quarter feels the same.** Nothing changes the shape of Q2 against Q4.

## How to run one

- Add the patch to `V` in `sim/fun/variant.js` (search-and-replace on `core.js`, `content.js` or `bots.js`), or copy the engine to a scratch folder when the change is too big to patch.
- `node sim/fun/fun.js 1500 '{}' table <variant>` gives the fun table. `node sim/fun/sweep.js 1500 <variant>` gives win rate by target.
- `node sim/fun/compare.js 1500 main=src/engine/core.js x=<path to patched core.js>` gives main against the variant on the same seeds, including the scripted human saboteur (`sim/fun/human.js`).
- Retune targets so bots and the scripted saboteur both sit near 50%, then compare what moved.
- Report these for each variant: company wins, scripted saboteur wins (exploit and subtle), right saboteur named, warnings on loyal players, losing policies approved, end-vote flips, comebacks, live going into Q5, and how many extra taps or decisions it adds per quarter.

## The variants

### A. Noise: harder to read the table

**A1. Hungover Auditor** (Blood on the Clocktower's Drunk). At 6+ players, the Auditor sees the wrong author on one page per quarter and doesn't know which one. **Tests:** problem 1. **Hook:** where the Auditor's view is built, swap one author. **Watch:** right saboteur named should drop toward 75–80% without making the company lose.

**A2. KPIs** (Dead of Winter's secret objectives). Every loyal player also gets a private selfish target, like "Be the CEO's pick twice", "Never stamp Not recommended" or "Get someone a Written Warning". Meeting it scores on their personal record. Loyal players then act a bit dodgy for their own reasons, so they look suspicious. **Tests:** problems 1 and 4. **Hook:** add `p.kpi` to bots and have them chase it with some weight. **Watch:** wrong warnings go up, but not past about 15%.

**A3. Restructure** (Battlestar Galactica's sleeper phase). At the start of Q3, a second Headcount Memo can turn one loyal player into a saboteur (30% chance), and they're told privately. Everything the table worked out in Q1–Q2 is now suspect. **Tests:** problems 1 and 5. **Hook:** in `startRound` when `s.r === 3`. **Watch:** whether early reads stop deciding the end vote.

### B. Make bad policies land

**B1. Crisis Meeting** (Battlestar Galactica's skill checks). In Q3, after the normal pick, everyone puts one card face down into a shared pot. The pot is shuffled and totalled, and it must reach +2 or the company loses 3. Nobody can tell who threw the −2, but the pot is revealed card by card. **Tests:** problem 2. It gives saboteurs deniable damage that the table *sees*. **Hook:** a new phase after `approve` in Q3. Bots throw their best spare (loyal) or worst (saboteur, unless suspected). **Watch:** saboteur wins, and whether the right-name rate drops.

**B2. Executive Powers** (Secret Hitler). When a policy loses money, the CEO who approved it gets a power, picked in quarter order: investigate anyone, pick the next CEO, or force a reshuffle of a department. Failure hands out power, so a saboteur has a reason to push a loser through. **Tests:** problem 2. **Hook:** in `approve` when `actual < 0`. **Watch:** losing policies approved should rise to 5–10% of quarters.

**B3. Sweeteners** (Sheriff of Nottingham's bribes). An author can clip spare overtime hours to their cover page. If it's approved, the CEO banks those hours toward their personal record. A sweetened page looks like confidence, or like a bribe. **Tests:** problems 2 and 4. **Hook:** spend unused tokens on `e.sweet`, and have bots weigh it in `feel`. **Watch:** whether loyal CEOs take more bad pages.

### C. Chaos: quarters that feel different

**C1. Market Report** (event decks from Pandemic and Dead of Winter). Each quarter opens with one public card that changes how cards are valued: Recession (every Target −1), Bubble (wildcards swing ±4), Audit Season (every reveal is free), Hiring Freeze (no re-deals), Synergy (Modifiers count double). Five or six cards, one drawn per quarter. **Tests:** problem 5, and Joel's "more chaotic". **Hook:** `s.market` read by `total()` and `workCost()`. Bots read it through `evs()`. **Watch:** margin spread and comebacks. Targets probably barely move.

**C2. Corporate Perks** (Balatro's jokers). When profit runs 3+ above pace, the company must spend 2 of it on a permanent perk that bends the rules: Open Plan (every page shows one card), Flexible Hours (+1 overtime hour for everyone), Casual Friday (stamps are optional). It's a runaway brake that still feels like a reward. **Tests:** problems 3 and 5. **Hook:** in `next()`. **Watch:** blowouts and comebacks.

### D. Table talk: give everyone something to do

**D1. "That's a lie"** (Coup's challenge). Once per quarter, any player can challenge one page's stamp for 1 overtime hour. If they're right, the author gets a Written Warning. If they're wrong, the challenger does. This replaces the CEO-only investigation. **Tests:** problems 1 and 4. **Hook:** in the reveal phase, have bots challenge their top suspect when confidence is high. **Watch:** wrong warnings. If the bots get too sharp here, so will the table.

**D2. Emergency All-Hands** (Among Us). Once per game, any player can stop the quarter before the CEO picks and force an immediate warning vote. If it fails, the caller is on a PIP. **Tests:** problem 4. **Hook:** a bot calls it when one player's suspicion passes a threshold. **Watch:** whether being stood down happens earlier, and whether that's fun or just brutal.

**D3. Exit Interview** (Blood on the Clocktower's ghost vote). A stood-down player keeps one secret vote that counts double in the end vote. Being sacked isn't the end of your game. **Tests:** problems 3 and 4. **Hook:** in `resolveWhistle` weights. **Watch:** end-vote accuracy.

### E. The endgame

**E1. HR Knows** (Avalon's Merlin and Assassin). One loyal player, HR, knows who the saboteurs are. If the company wins, the saboteurs get one guess at who HR is, and naming them steals the win. HR has to steer the table without being obvious. This could replace the ±3 end vote. **Tests:** problem 3 and Joel's open question about an end-game he likes. **Hook:** add `p.spec = 'HR'`. HR bots vote with knowledge plus noise, and saboteur bots guess HR from voting patterns. **Watch:** how often the steal lands. Aim for 25–35%.

**E2. Profit Guidance** (hidden targets, like Two Rooms' hidden roles). The exact target is sealed until the end of Q3. Q1–Q2 only show a range (say 20–26). **Tests:** problem 5, and Q5 tension. **Hook:** draw `s.target` from a range at Q3. **Watch:** live going into Q5.

## Already simmed (2026-10-25)

- Six spares, two per suit: balances at 24/25/26/26/27 (4p should be 23), but the table names saboteurs more often. See the Claude Doc "Six spare cards: balance verdict".
- Four spares with random suits: balances at 20/22/23/24/25 with main's deduction profile. This is the recommended hand if the hand changes.
- Card chaos (`wide`, `wild4`, `wild3`, `chaos`) and two policies (`two`): results in `sim/fun/CHANGELOG.md`.

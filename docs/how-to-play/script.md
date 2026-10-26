# Staff Induction: voiceover script

The how-to-play video, framed as a mandatory staff induction tape. One narrator, cheerful 1980s corporate training register, Australian voice. Every joke is delivered straight; the narrator never laughs and never winks.

- **Main reel**: 13 shots, about 95 seconds. Plays in the `brief` phase, before Q1. Skippable.
- **First-time stingers**: short lines that play over the real game the first time something happens (Jackbox teaches the same way). They carry the rules that would bloat the main reel.
- **End-game shot is a module.** Two variants below; 12W matches the code today.

Timings assume about 2.6 words a second with a beat after each joke. The build advances on the end of each audio clip, so these are estimates for captions-only playback.

Shot ids double as audio file names: `assets/audio/vo/<id>.mp3`.

## Main reel

| # | id | est | TV (the felt) | Phone (the desk) | Sound |
|---|----|-----|---------------|------------------|-------|
| 1 | `vo-01-welcome` | 5s | A ring binder slides onto the felt, spine label STAFF INDUCTION. It flops open to tab 1. | The same binder, smaller, slides in. | Hold music, phone-line filter on. `paper-pull` on the binder. |
| 2 | `vo-02-goal` | 7s | The desk calculator rises into frame. LCD counts up to the target; annunciator TARGET +21. Five tab dividers Q1–Q5 fan out along the binder edge. | Nameplate and overtime punch card settle into the header. | `calc-key` per tick, `calc-total` on the target. |
| 3 | `vo-03-saboteurs` | 8s | Six name tags in a row. A typed role memo slides under each, face down. One corner lifts on "quietly": a red SABOTEUR stamp edge shows, the corner drops. On "maybe nobody", every memo flips: all LOYAL. | Your role memo, face down, then face up: LOYAL. | `paper-shuffle`, `desk-card-flip` on the corner. |
| 4 | `vo-04-inherit` | 8s | Someone else's name tag slides off the left edge. | Three cards slide in from where it went, face down, and flip: Monetise · the Break Room · Off the Books. | `desk-card-deal` ×3, `desk-card-flip` ×3. |
| 5 | `vo-05-policy` | 8s | The three cards rise into the one-sentence line, suit colours highlighted. Value marks pop above each: ++ · − · +. On "coin toss" an orange ? card spins in beside them and wobbles. | Same cards, same marks. | `desk-ding` per mark. |
| 6 | `vo-06-overtime` | 8s | The TV cover page's sentence shows █████ █████ █████. On "show a card", the first block flips to Monetise ++. | Three drawn cards fan below. A pointer drags the Interns onto the Break Room. One hole punches in the punch card. Then the reveal: one more hole. | `desk-stapler`, `desk-card-drop`, punch: `desk-stamp` at low gain. |
| 7 | `vo-07-stamp` | 8s | — (hold the page). | The stamp bar: Recommended · Risky · Not recommended. The pencil tick appears beside Risky. The stamp lands on Recommended anyway. On "Plan", a PIP sticker slaps onto the corner, holds, peels off. | `desk-stamp`, `desk-sticker`. |
| 8 | `vo-08-cover` | 7s | — | Templates riffle: Memo, Fax, WordArt, Certificate. Lands on Memo. Subject types on: "Quick Win: Break Room Monetisation (Pilot)". Squiggle signature, page seals and slides up off the phone. | `paper-typing`, `desk-sign`, `paper-pull`. |
| 9 | `vo-09-ceo` | 6s | Six cover pages scatter onto the felt, sticky-note icons on each. The CEO nameplate slides onto Denise's name tag. | CEO phone: the fanned stack. One page pulls up. | `paper-shuffle`, `paper-pull`. |
| 10 | `vo-10-board` | 10s | Five signature squiggles draw across the Board's name tags. Tally: 3–2 OPEN. The nominee lifts; its whole sentence shows; it's bad. A gavel. The nominee's sticky note peels to show "the CEO's own". A different page slides up in its place. | Board phone: Ratify · Open. A squiggle under Open. | `desk-sign` ×5, `sting-overruled`. |
| 11 | `vo-11-approved` | 7s | APPROVED thumps onto the page. The sentence plays with its comic words (DING! … BWAMP.). Calculator ticks +2. "From Trevor · Facilities" types under the page. | Nothing; phones dim to the TV. | `desk-stamp`, `sting-approved`, `calc-key` ×2, `paper-type-key`. |
| 12 | `vo-12-endgame` | 12s | See the end-game module. | Your role memo again, with your record clipped to it. | `sting-saboteur` at low gain. |
| 13 | `vo-13-signoff` | 5s | READ & UNDERSTOOD stamps the binder; it snaps shut and slides away. The Time & Attendance clock drops in on its chain at 08:59, flips to 09:00. Stripe wipe into Q1 Work. | Phone wipes into the Work desk. | `desk-stamp`, `clock-flip`, `clock-bell`, `06-stripe-wipe`, then Water Cooler. |

### The lines

1. **vo-01-welcome** — Welcome aboard. Please enjoy this mandatory induction. Enjoyment is also mandatory.
2. **vo-02-goal** — The company has five quarters to hit its profit target. Hit it, and everyone keeps their job. Probably.
3. **vo-03-saboteurs** — Some of you are Disgruntled, and want the company to sink. Your role memo will say if it's you. Maybe it's nobody, and we're just bad at our jobs.
4. **vo-04-inherit** — Every quarter, you move to a new department and inherit the last manager's three cards. Nobody can prove they weren't yours. Congratulations.
5. **vo-05-policy** — Three cards make a proposal: an Action, a Target and a Modifier. Read as one sentence, the worse it sounds, the more it makes.
6. **vo-06-overtime** — You also get spares. Spend overtime hours to swap one in, or turn a card face up so people trust you. The hours are unpaid.
7. **vo-07-stamp** — Then stamp it: Recommended, Risky, or Not. The pencil tick marks the honest one. You can lie, but the CEO can check. Get caught, and you're on a Performance Improvement Plan.
8. **vo-08-cover** — Give it a cover page and drop it in the pile. No names. Nobody knows who wrote what.
9. **vo-09-ceo** — Each quarter, someone takes a turn as CEO. They read the pile and pick one.
10. **vo-10-board** — Everyone else is the Board. Rubber-stamp the pick, or open it up. If there was a better one, that goes through instead, and the dud's author is named.
11. **vo-11-approved** — Whatever goes through hits the books, and its author is named. Everyone acts like they saw it coming.
12. **vo-12-endgame** — *(module, below)*
13. **vo-13-signoff** — That concludes your induction. The clock starts now. Please look busy.

### End-game module (shot 12)

Record both. The build picks one with a single constant. The end-game rules are still moving, so this is the only shot that should change when they do.

**12W, the end vote + personal records** (what `core.js` does today: the whistleblower vote stays, PR #24 adds records):
> After quarter five, you vote on who was Disgruntled. Right, and their damage is undone. Wrong, and the innocent one sues for unfair dismissal. Then we count the money.

TV: name tags in a row; a whistle; one tag takes the red SABOTEUR stamp and the calculator un-ticks the clawback (KA-CHING!). Then a personnel file slides in with dog-eared stickers on it (Great work!, See me) and an EMPLOYEE OF THE YEAR frame drops over one name tag. Phone: your role memo with your record clipped to it.

**12B, damage threshold** (the variant that was simmed and shelved; keep the take in case it returns):
> Loyal staff win if we hit the target. Saboteurs win if enough of their losses get approved, target or no target. And every approved policy goes on your permanent record.

TV: the calculator on the left, a second red tally on the right, both counting. The red one reaches its notch first; the SABOTAGE stamp edge shows on the role memo.

## First-time stingers

Each plays once per game, the first time its moment happens, over the live game. The music ducks; nothing pauses; phones stay live. Two to six seconds each.

| id | Fires when | Line | Shows |
|----|------------|------|-------|
| `vo-j-rejected` | You first inherit a rejected proposal (Q2 onwards) | This one came back rejected. The sticky note says who wrote it. Use that responsibly. | The inherited stack arrives sealed with the author's sticky note; it wobbles once. |
| `vo-j-cleanup` | You first inherit the approved department's leftovers | These are the leftovers from an approved policy. Somebody has to tidy up. | Cards arrive with a coffee ring. |
| `vo-j-fx-x2` | First time an effect Modifier is in your six cards: Retroactively | Retroactively doubles the other two cards. Including the mistakes. | The Dymo label on the card pulses; the other two marks double for a beat. |
| `vo-j-fx-null` | … With Thoughts and Prayers | Thoughts and Prayers cancels the other two. It's the thought that counts. | The other two marks fade to 0. |
| `vo-j-fx-shield` | … Per Legal's Advice | Per Legal's Advice, the other two can't lose money. Legal would like that in writing. | Negative marks clamp to 0. |
| `vo-j-fx-flip` | … Without Consultation | Without Consultation flips the other two. Up is down. Nobody was asked. | Marks flip sign. |
| `vo-j-investigate` | You are first CEO at a quarter's close | As CEO, you may quietly check one person's stamp. Quietly. | The filing cabinet drawer slides out on the CEO's phone only. |
| `vo-j-pip` | First PIP of the game (TV) | Someone's on a Performance Improvement Plan. We can't say why. From now on, the CEO can read their cover pages. | PIP sticker on the name tag; their next page on the TV stays sealed. |
| `vo-j-warning` | First Written Warning vote (Reveal) | Time for a Written Warning. Two of those, and you're stood down. Your department will run itself. | Name tags in a row on the phone; one squiggle. |
| `vo-j-overrule` | First Board overrule | The Board has overruled the CEO. This will be discussed at length, behind their back. | Plays after `sting-overruled`. |
| `vo-j-designer` | Role memo shows Designer (6+ players) | You're the Designer. Next quarter's cover pages are your call. | Role memo. |
| `vo-j-auditor` | Role memo shows Auditor (6+ players) | You're the Auditor. You can see who wrote everything. Keep it to yourself. | Role memo. |
| `vo-j-q5` | Q5 begins | Final quarter. Whatever you've been planning, now would be the time. | Overtime music kicks in under it. |

## Voice direction (ElevenLabs)

- **Voice**: warm, brisk, mid-range, Australian, a little too pleased. Think the narrator of a 1987 workplace safety tape who has never had a bad day. Pick it from the Voice Library and keep one voice for everything.
- **Model**: Eleven v3 for delivery tags; Multilingual v2 if the takes wobble. v3 ignores SSML `<break>`; pace with full stops and ellipses.
- **Delivery tags (v3)**: use sparingly, only where the line needs it. `[cheerfully]` on the first line, `[deadpan]` on the punchline sentences (Probably. / They're unpaid. / Please look busy.). Test each; tags vary by voice.
- **One request per line**, so each shot gets its own clip and the build can advance on clip end.
- **Settings**: stability around 0.5, similarity 0.75, style low. Export MP3 44.1 kHz mono, trim leading and trailing silence to 80 ms, normalise to about −16 LUFS so the lines sit over the hold music.
- **Never commit the API key.** The generator reads `ELEVENLABS_API_KEY` from the environment.

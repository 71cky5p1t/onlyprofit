# Staff Induction: voiceover script

The how-to-play video, framed as a mandatory staff induction tape. One narrator, cheerful 1980s corporate training register, Australian voice. Every joke is delivered straight; the narrator never laughs and never winks.

- **Main reel**: 13 shots, about 95 seconds. Plays in the `brief` phase, before Q1. Skippable.
- **First-time stingers**: short lines that play over the real game the first time something happens (Jackbox teaches the same way). They carry the rules that would bloat the main reel.
- **End-game shot is a module.** Two variants below; 12W matches the code today.

Timings assume about 2.6 words a second with a beat after each joke. The build advances on the end of each audio clip, so these are estimates for captions-only playback.

Chapter ids match the induction player's (`src/explainer/00-lessons.js`) and double as audio file names: `assets/audio/induction/<id>.mp3`. Stingers use `assets/audio/induction/<stinger-id>.mp3`.

## Writing for the voice

- One idea per sentence, eight words or fewer where possible. Full stops are the pacing; the narrator breathes on every one.
- The punchline is its own sentence, last, and short. Nothing follows it.
- Numbers as words ("quarter five", "three hours"); no "Q5", "PIP" or "+2" in a spoken line. The captions can use the short forms.
- Australian, lightly: "have a go", "dodgy", "unfair dismissal", "stood down". No "G'day", no "mate", no slang played for laughs. The joke is the company, never the accent.
- Spare counts and targets are left unsaid so the lines survive the hand-size decision.

## Main reel

| # | id | est | TV (the felt) | Phone (the desk) | Sound |
|---|----|-----|---------------|------------------|-------|
| 1 | `welcome` | 5s | A ring binder slides onto the felt, spine label STAFF INDUCTION. It flops open to tab 1. | The same binder, smaller, slides in. | Hold music, phone-line filter on. `paper-pull` on the binder. |
| 2 | `goal` | 7s | The desk calculator rises into frame. LCD counts up to the target. Five tab dividers Q1–Q5 fan out along the binder edge. | Nameplate and overtime punch card settle into the header. | `calc-key` per tick, `calc-total` on the target. |
| 3 | `saboteurs` | 8s | Six name tags in a row. A typed role memo slides under each, face down. One corner lifts on "quietly": a red SABOTEUR stamp edge shows, the corner drops. On "maybe nobody", every memo flips: all LOYAL. | Your role memo, face down, then face up: LOYAL. | `paper-shuffle`, `desk-card-flip` on the corner. |
| 4 | `inherit` | 7s | Someone else's name tag slides off the left edge. | Three cards slide in from where it went, face down, and flip: Monetise · the Break Room · Off the Books. | `desk-card-deal` ×3, `desk-card-flip` ×3. |
| 5 | `policy` | 8s | The three cards rise into the one-sentence line, suit colours highlighted. Value marks pop above each: ++ · − · +. On "coin toss" an orange ? card spins in beside them and wobbles. | Same cards, same marks. | `desk-ding` per mark. |
| 6 | `overtime` | 6s | — (hold the line). | Spares fan below. A pointer drags the Interns onto the Break Room. One hole punches in the punch card. | `desk-card-drop`, punch: `desk-stamp` at low gain. |
| 7 | `reveal` | 7s | The TV cover page's sentence shows █████ █████ █████. On "the whole table", the first block flips to Monetise ++. | One more hole. Then the inherited three sweep off and three new ones deal in; two holes. | `desk-card-flip`, `desk-card-deal` ×3. |
| 8 | `stamp` | 8s | — (hold the page). | The stamp bar: Recommended · Risky · Not recommended. The pencil tick appears beside Risky. The stamp lands on Recommended anyway. On "Plan", a PIP sticker slaps onto the corner, holds, peels off. | `desk-stamp`, `desk-sticker`. |
| 9 | `cover` | 6s | — | Templates riffle: Memo, Fax, WordArt, Certificate. Lands on Memo. Subject types on: "Quick Win: Break Room Monetisation (Pilot)". Squiggle signature, page seals and slides up off the phone. | `paper-typing`, `desk-sign`, `paper-pull`. |
| 10 | `ceo` | 8s | Six cover pages scatter onto the felt. The CEO nameplate slides onto Denise's name tag. One page pulls up. Five squiggles draw across the Board's name tags. | CEO phone: the fanned stack. Board phone: Ratify · Open. | `paper-shuffle`, `paper-pull`, `desk-sign` ×5. |
| 11 | `approved` | 9s | Tally 3–2 OPEN. The nominee's sentence shows; it's bad. A gavel. A different page slides up in its place. APPROVED thumps onto it; the sentence plays with its comic words. Calculator ticks +2. "From Trevor · Facilities" types under the page. | Phones dim to the TV. | `sting-overruled`, `desk-stamp`, `sting-approved`, `calc-key` ×2, `paper-type-key`. |
| 12 | `endgame` | 11s | See the end-game module. | Your role memo again, with your record clipped to it. | `sting-saboteur` at low gain. |
| 13 | `signoff` | 5s | READ & UNDERSTOOD stamps the binder; it snaps shut and slides away. The Time & Attendance clock drops in on its chain at 08:59, flips to 09:00. Stripe wipe into Q1 Work. | Phone wipes into the Work desk. | `desk-stamp`, `clock-flip`, `clock-bell`, `06-stripe-wipe`, then Water Cooler. |

### The lines

1. **welcome** — Welcome aboard. Please enjoy this mandatory induction. Enjoyment is also mandatory.
2. **goal** — You've got five quarters to hit the profit target. Hit it, and everyone keeps their job. Probably.
3. **saboteurs** — Some of your colleagues may be quietly sinking the company. Maybe one. Maybe two. Maybe nobody, and we're just like this.
4. **inherit** — Each quarter, you run a department. You inherit the last manager's work. It's yours now. Congratulations.
5. **policy** — One Action. One Target. One Modifier. Read together, that's a policy. Add up the marks. A question mark is a coin toss.
6. **overtime** — You'll draw some spares. Swapping one in costs overtime. You get three hours. They're unpaid.
7. **reveal** — An hour shows a card to the whole table. Two hours bins the lot and starts again. Nobody gets those hours back.
8. **stamp** — Then stamp it. The pencil tick marks the honest answer. You can lie. You can also be put on a Performance Improvement Plan.
9. **cover** — Dress it up with a cover page. Nobody knows who wrote what. That's the whole point.
10. **ceo** — Each quarter, someone has a go as CEO, and picks one proposal. Everyone else is the Board. Ratify it, or open it up.
11. **approved** — If it's dodgy, the Board puts a better one through. Only the approved policy gets a name on it. Everyone acts like they saw it coming.
12. **endgame** — *(module, below)*
13. **signoff** — That concludes your induction. Read your role memo. Clock in. Please look busy.

### End-game module (shot 12)

Record both. The build picks one with a single constant. The end-game rules are still moving, so this is the only shot that should change when they do.

**12W, the end vote + personal records** (what `core.js` does today: the whistleblower vote stays, PR #24 adds records):
> After quarter five, the table names a saboteur. Get it right, and their damage is reversed. Get it wrong, and that's an unfair dismissal claim. Best record on the winning side is Employee of the Year.

TV: name tags in a row; a whistle; one tag takes the red SABOTEUR stamp and the calculator un-ticks the clawback (KA-CHING!). Then a personnel file slides in with dog-eared stickers on it (Great work!, See me) and an EMPLOYEE OF THE YEAR frame drops over one name tag. Phone: your role memo with your record clipped to it.

**12B, damage threshold** (the variant that was simmed and shelved; keep the take in case it returns):
> Loyal staff win if we hit the target. Saboteurs win if enough of their losses get approved. Target or no target. Every approved policy goes on your permanent record.

TV: the calculator on the left, a second red tally on the right, both counting. The red one reaches its notch first; the SABOTAGE stamp edge shows on the role memo.

## First-time stingers

Each plays once per game, the first time its moment happens, over the live game. The music ducks; nothing pauses; phones stay live. Two to six seconds each.

| id | Fires when | Line | Shows |
|----|------------|------|-------|
| `j-rejected` | You first inherit a rejected proposal (Q2 onwards) | This one came back rejected. The sticky note says who wrote it. Use that responsibly. | The inherited stack arrives sealed with the author's sticky note; it wobbles once. |
| `j-cleanup` | You first inherit the approved department's leftovers | These are the leftovers from an approved policy. Somebody has to tidy up. | Cards arrive with a coffee ring. |
| `j-fx-x2` | First time an effect Modifier is in your six cards: Retroactively | Retroactively doubles the other two cards. Mistakes included. | The Dymo label on the card pulses; the other two marks double for a beat. |
| `j-fx-null` | … With Thoughts and Prayers | Thoughts and Prayers cancels the other two. It's the thought that counts. | The other two marks fade to 0. |
| `j-fx-shield` | … Per Legal's Advice | Per Legal's Advice, the other two can't lose money. Legal would like that in writing. | Negative marks clamp to 0. |
| `j-fx-flip` | … Without Consultation | Without Consultation flips the other two. Up is down. Nobody was asked. | Marks flip sign. |
| `j-investigate` | You are first CEO at a quarter's close | As CEO, you can check one person's stamp. Quietly. | The filing cabinet drawer slides out on the CEO's phone only. |
| `j-pip` | First PIP of the game (TV) | Someone's on a Performance Improvement Plan. We can't say why. From now on, the CEO can read their cover pages. | PIP sticker on the name tag; their next page on the TV stays sealed. |
| `j-warning` | First Written Warning vote (Reveal) | Time for a Written Warning. Two of those, and you're stood down. Your department will run itself. | Name tags in a row on the phone; one squiggle. |
| `j-overrule` | First Board overrule | The Board has overruled the CEO. This will be discussed at length. Behind their back. | Plays after `sting-overruled`. |
| `j-designer` | Role memo shows Designer (6+ players) | You're the Designer. Next quarter's cover pages are your call. | Role memo. |
| `j-auditor` | Role memo shows Auditor (6+ players) | You're the Auditor. You can see who wrote everything. Keep it to yourself. | Role memo. |
| `j-q5` | Q5 begins | Final quarter. Whatever you've been planning, now's the time. | Overtime music kicks in under it. |

## Voice direction

One voice for everything: warm, brisk, mid-range, Australian, a little too pleased. The narrator of a 1987 workplace safety tape who has never had a bad day. Never laughs, never winks; the punchlines land flat and quick.

### Qwen3-TTS (local, Mac mini)

Runs on the mini with MLX; nothing leaves the machine. Samples and settings: `assets/audio/induction/samples/`.

- **Voice design prompt** (VoiceDesign model): "A middle-aged Australian man narrating a 1980s corporate training video. Warm, brisk, mid-range, relentlessly cheerful but completely deadpan. Clear studio recording, close mic, no music."
- **One request per line**, so each chapter gets its own clip and the build can advance on clip end.
- Lock the voice once picked: keep the seed and prompt, or clone from the chosen take with the Base model so every line matches.
- Export MP3 44.1 kHz mono, trim leading and trailing silence to 80 ms, normalise to about −16 LUFS so the lines sit over the hold music.

### ElevenLabs (fallback)

Eleven v3 with `[deadpan]` on the punchlines; stability 0.5, similarity 0.75, style low. Key from `ELEVENLABS_API_KEY`, never committed.

# Scripted playtests (2026-10-25)

Historical. This runs the PR #2 engine (envelopes, Audit vote, old targets); the flags it tested that were adopted are now rules. Use `sim/fun/` for current balance.

A scripted "human" in seat 0 plays against the prototype bots, over 1,000 seeds per line, to check what Codex's
LLM playtest found. `engine-pr2.js` is a snapshot of `src/engine.js` from PR #2 (commit e753a3e).
`patch.js` writes `engine-x.js`: the same engine with experiment flags read from `s.x`. Nothing here changes the game.

    node patch.js
    ./run.sh '{}' '' exploit blatant subtle          # current rules
    ./run.sh '{"claw":2,"fair":1}' '' exploit        # a variant
    node dmg.js exploit 4                            # where the saboteur's damage comes from

Seat-0 strategies (`play.js`): `exploit` (worst envelope, show the good card, self-approve as CEO, lie in every memo),
`noself`, `subtle` (small losses, truthful memos), `blatant` (worst envelope, honest). Empty strategy = bots only.

Flags: `ruthless` (bot saboteurs self-approve as CEO, like humans did), `fair` (bots judge human CEOs like bot CEOs),
`bots2` (credibility-weighted warning votes), `pers` (bot temperaments), `claw` (1 = restore losses, 2 = reverse every
policy the named saboteur wrote), `board` (table can overrule the CEO's pick), `pubRev` (paid reveals are public),
`leaveOpen` (stood-down staff keep working, envelope opened publicly), `selfPen` (with `board`: a CEO overruled on their own envelope is named and skips their next CEO turn), `noSelf`, `q5x2`, `rot4`, `noLeave`, `sabTier`.

Results and recommendations: https://claude.ai/artifact/66RMt61UfSLPKBWumRuCAd

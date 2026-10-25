const { play } = require('./play.js');
const [, , strat, n, xs = '{}'] = process.argv;
let own = 0, ownSum = 0, byOther = 0, otherSum = 0, ceoPickOthers = 0, ceoPickOthersSum = 0, G = 1000, ceoTurns = 0, firstLoss = [0,0,0,0,0,0];
for (let i = 1; i <= G; i++) {
  const { s } = play(+n, i * 7919 + +n, JSON.parse(xs), strat);
  ceoTurns += s.P[0].ceoTurns;
  for (const l of s.ledger) {
    if (l.ceo === 0 && l.author === 0) { own++; ownSum += l.actual; }
    else if (l.ceo === 0) { ceoPickOthers++; ceoPickOthersSum += l.actual; }
    else if (l.author === 0) { byOther++; otherSum += l.actual; }
  }
}
console.log(`${strat} ${n}p: your CEO turns/g ${(ceoTurns/G).toFixed(2)} | self-approved/g ${(own/G).toFixed(2)} avg ${(ownSum/own).toFixed(1)} | as CEO picked others/g ${(ceoPickOthers/G).toFixed(2)} avg ${(ceoPickOthersSum/Math.max(1,ceoPickOthers)).toFixed(1)} | bots approved yours/g ${(byOther/G).toFixed(2)} avg ${(otherSum/Math.max(1,byOther)).toFixed(1)}`);

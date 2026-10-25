const OP=require('../src/engine/core.js');
function play(n,seed,o={}){let s=OP.newGame(Object.assign({players:n,seed,spectate:true},o));let k=0;
 while(s.phase!=='end'){const r=OP.apply(s,-1,{type:'advance'}); if(r.error) throw new Error(r.error+' '+s.phase); s=r.state; if(++k>100) throw 'loop';}
 return s;}
for(const n of [4,5,6,7,8]){let w=0,ws=0,ns=0,pr=0,leave=0,wrong=0,named=0,corr=0;const G=600;
 for(let i=1;i<=G;i++){const s=play(n,i*7919);w+=s.win;pr+=s.profit;if(s.nSab){ns++;ws+=s.win;}
  leave+=s.P.filter(p=>p.leave).length; wrong+=s.P.filter(p=>p.leave&&!p.sab).length; if(s.whistle.named!=null){named++;corr+=s.whistle.correct}}
 console.log(n,'loyal win',(w/G).toFixed(2),'with sab',(ws/ns).toFixed(2),'profit',(pr/G).toFixed(1),'leave/g',(leave/G).toFixed(2),'wrong',(wrong/G).toFixed(2),'named',(named/G).toFixed(2),'correct',(corr/Math.max(named,1)).toFixed(2));}

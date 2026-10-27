const OP=require('../src/engine/core.js');
for(let seed=1;seed<300;seed++){ for(const n of [4,6,8]){
let s=OP.newGame({players:n,seed,ink:seed%4?'choose':'one'});
const go=a=>{const r=OP.apply(s,0,a); if(r.error) throw new Error(s.phase+' '+JSON.stringify(a)+' '+r.error); s=r.state;};
go({type:'begin'});
while(s.phase!=='end'){
 if(s.phase==='work') go({type:'submitWork',stamp:['Rec','Risky','Not'][seed%3],swaps:seed%2?[0,1]:[2],discards:seed%5==0&&seed%2==0?[{pile:'inh',su:1},{pile:'spare',su:2}]:[],redacts:(seed%3&&seed%2==0&&seed%5)?[0]:[],claim:{kind:'report',val:-3,stamp:'Rec'},nextStyle:{tpl:'fax',font:'comic'}});
 else if(s.phase==='decide') { if(s.ceo===0) go({type:'approve',id:s.envs[0].id}); else go({type:'advance'}); }
 else if(s.phase==='board') go(seed%4?{type:'boardVote',vote:seed%3?'open':'ratify'}:{type:'advance'});
 else if(s.phase==='reveal') go({type:'warnVote',target:String(1+seed%(n-1))});
 else if(s.phase==='review') { if(s.ceo===0&&seed%2){const t=s.envs.find(e=>e.author!==0&&!e.autopilot&&!s.P[e.author].pip); if(t) go({type:'investigate',target:String(t.author)});} go({type:'advance'}); }
 else if(s.phase==='whistle') go({type:'whistleVote',target:'none'});
}
 if(s.investigations.some(q=>q.guilty&&!s.P[q.t].pip)) throw new Error('guilty but not on a PIP');
}}
console.log('ok');

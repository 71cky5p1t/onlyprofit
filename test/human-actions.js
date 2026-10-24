const OP=require('../src/engine.js');
for(let seed=1;seed<300;seed++){ for(const n of [4,6,8]){
let s=OP.newGame({players:n,seed});
const go=a=>{const r=OP.apply(s,0,a); if(r.error) throw new Error(s.phase+' '+JSON.stringify(a)+' '+r.error); s=r.state;};
go({type:'begin'});
while(s.phase!=='end'){
 if(s.phase==='work') go({type:'submitWork',stamp:['Rec','Risky','Not'][seed%3],swaps:seed%2?[0,1]:[2],redeal:seed%5==0&&seed%2==0,reveals:(seed%3&&seed%2==0&&seed%5)?[0]:[],claim:{kind:'report',val:-3,stamp:'Rec'},nextStyle:{color:'mint',trim:'airmail'}});
 else if(s.phase==='pitch') go({type:'auditVote',target:s.envs.find(e=>!e.autopilot)?.id||'none'});
 else if(s.phase==='decide') { if(s.ceo===0) go({type:'approve',id:s.envs[0].id}); else go({type:'advance'}); }
 else if(s.phase==='reveal') go({type:'warnVote',target:String(1+seed%(n-1))});
 else if(s.phase==='review') go({type:'advance'});
 else if(s.phase==='whistle') go({type:'whistleVote',target:'none'});
}}}
console.log('ok');

/* J4 V7 — pièces indépendantes, faîtage et noue. Une case = un module de mur en largeur. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RoofModules=Object.freeze(api);})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const UNIT=1,SEAT=122,RISE=64,EPS=1e-8;
 const turn=(x,y,r)=>[[x,y],[1-y,x],[1-x,1-y],[y,1-x]][((r%4)+4)%4];
 const inverse=(x,y,r)=>turn(x,y,4-r);
 const shape=(kind,x,y)=>kind==='angle'?Math.min(x,y):kind==='valley'?Math.max(x,y):kind==='ridge'?Math.min(y,1-y):y;
 const height=(p,u,v)=>{const [x,y]=inverse(u-p.u,v-p.v,p.rot);return p.base+RISE*shape(p.kind,x,y);};
 function mesh(p){
  const local=p.kind==='angle'?[[[0,0,0],[1,0,0],[1,1,1]],[[0,0,0],[1,1,1],[0,1,0]]]:p.kind==='valley'?[[[0,0,0],[1,0,1],[1,1,1]],[[0,0,0],[1,1,1],[0,1,1]]]:p.kind==='ridge'?[[[0,0,0],[1,0,0],[1,.5,.5],[0,.5,.5]],[[0,.5,.5],[1,.5,.5],[1,1,0],[0,1,0]]]:[[[0,0,0],[1,0,0],[1,1,1],[0,1,1]]];
  return local.map(face=>{const points=face.map(([x,y,z])=>{const q=turn(x,y,p.rot);return {u:p.u+q[0],v:p.v+q[1],z:p.base+z*RISE};});
   const a=points[0],b=points[1],c=points[2],du=b.u-a.u,dv=b.v-a.v,eu=c.u-a.u,ev=c.v-a.v,det=du*ev-dv*eu,zu=((b.z-a.z)*ev-(c.z-a.z)*dv)/det,zv=(du*(c.z-a.z)-eu*(b.z-a.z))/det;
   return {points,plane:{zu,zv,c:a.z-zu*a.u-zv*a.v}};
  });
 }
 const ends=p=>[[{u:p.u,v:p.v},{u:p.u+1,v:p.v}],[{u:p.u+1,v:p.v},{u:p.u+1,v:p.v+1}],[{u:p.u+1,v:p.v+1},{u:p.u,v:p.v+1}],[{u:p.u,v:p.v+1},{u:p.u,v:p.v}]].map(edge=>edge.map(q=>({...q,z:height(p,q.u,q.v)})));
 const cell=(p,u,v)=>p.u===u&&p.v===v;
 const shared=(p,q)=>Math.abs(p.u-q.u)+Math.abs(p.v-q.v)===1;
 function sharedEdge(p,q){if(!shared(p,q))return null;const side=q.v<p.v?0:q.u>p.u?1:q.v>p.v?2:3,[a,b]=ends(p)[side];return [a,...[.25,.5,.75].map(t=>{const u=a.u+(b.u-a.u)*t,v=a.v+(b.v-a.v)*t;return {u,v,z:height(p,u,v)};}),b];}
 function solve(raw,pieces){
  if(!['pan','angle','ridge','valley'].includes(raw.kind)||!Number.isSafeInteger(raw.u)||!Number.isSafeInteger(raw.v)||![0,1,2,3].includes(raw.rot))return {valid:false,reason:'Pièce ou coordonnées invalides.'};
  const p={...raw,base:SEAT},others=pieces.filter(q=>!cell(q,p.u,p.v)),neighbours=others.filter(q=>shared(p,q));let base=null;
  for(const q of neighbours){const edge=sharedEdge(p,q),values=edge.map(a=>height(q,a.u,a.v)-(height(p,a.u,a.v)-SEAT));
   if(values.some(v=>Math.abs(v-values[0])>EPS))return {valid:false,p:{...p,base:base??values[0]},reason:'Les profils ne se rejoignent pas. Tourne la pièce.'};
   if(base!==null&&Math.abs(base-values[0])>EPS)return {valid:false,p:{...p,base},reason:'Les bords voisins demandent deux hauteurs différentes.'};base=values[0];
  }
  p.base=base??SEAT;if(p.base<SEAT-EPS)return {valid:false,p,reason:'Cette orientation descend sous le sommet des murs.'};
  return {valid:true,p,reason:'',neighbours:neighbours.length};
 }
 function joins(pieces){const out=[];for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){const a=pieces[i],b=pieces[j],edge=sharedEdge(a,b);if(!edge)continue;const error=Math.max(...edge.map(q=>Math.abs(q.z-height(b,q.u,q.v))));out.push({a:a.id,b:b.id,edge,error,valid:error<EPS});}return out;}
 function preset(name){
  if(name==='ridge')return [{id:1,kind:'pan',u:0,v:-1,rot:0,base:SEAT},{id:2,kind:'ridge',u:0,v:0,rot:0,base:SEAT+RISE},{id:3,kind:'pan',u:0,v:1,rot:2,base:SEAT}];
  if(name==='ridge-line')return [{id:1,kind:'ridge',u:0,v:-1,rot:0,base:SEAT+RISE},{id:2,kind:'ridge',u:1,v:-1,rot:0,base:SEAT+RISE},{id:3,kind:'pan',u:0,v:0,rot:2,base:SEAT},{id:4,kind:'pan',u:1,v:0,rot:2,base:SEAT}];
  if(['valley','valley4'].includes(name)){const p=[{id:1,kind:'valley',u:0,v:0,rot:0,base:SEAT},{id:2,kind:'pan',u:-1,v:0,rot:0,base:SEAT},{id:3,kind:'pan',u:0,v:-1,rot:3,base:SEAT}];if(name==='valley4')p.push({id:4,kind:'angle',u:-1,v:-1,rot:2,base:SEAT});return p;}
  const p=[{id:1,kind:'angle',u:0,v:0,rot:3,base:SEAT},{id:2,kind:'pan',u:1,v:0,rot:2,base:SEAT}];
  if(['L','2x2'].includes(name))p.push({id:3,kind:'pan',u:0,v:-1,rot:3,base:SEAT});
  if(name==='2x2')p.push({id:4,kind:'angle',u:1,v:-1,rot:3,base:SEAT+RISE});return p;
 }
 return {UNIT,SEAT,RISE,EPS,turn,height,mesh,ends,sharedEdge,solve,joins,preset};
});

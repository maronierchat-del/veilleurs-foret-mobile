/* Répartition proposée : mêmes ressources et progression, carte plus aérée. */
'use strict';
const Landscape=(()=>{
 const forests=[{x:1050,y:1000},{x:4450,y:1100},{x:1150,y:3850}],quarries=[{x:3250,y:850},{x:4450,y:3750},{x:3200,y:3900}];
 if(!BuildingArea.tools){WORLD.width=5400;WORLD.height=4800;}
 const oldGap=naturalGap;
 naturalGap=function(a,b){return !BuildingArea.tools&&a.type==='tree'&&b.type==='tree'?[140,190]:oldGap(a,b);};
 function migrate(s,{toGrid,toWorld}){
  if(BuildingArea.tools||s.landscapeVersion===1)return;
  const rnd=random(261026),fixed=s.objects.filter(o=>o.placed),wild=s.objects.filter(o=>!o.placed),queues=s.respawnQueue||[],occupied=[...fixed];
  const blocked=(type,x,y)=>{
   if(Math.hypot(x-s.player.x,y-s.player.y)<(type==='tree'||type==='rock'?210:70))return true;
   const q=toGrid(x,y),t=s.constructionTrial;
   if([...(t.freeFloors||[]),...(t.freeRoofs||[])].some(p=>q.u>p.u-.7&&q.u<p.u+1.7&&q.v>p.v-.7&&q.v<p.v+1.7))return true;
   return (t.freeWalls||[]).some(w=>{const [a,b]=LabGeometry.ends(w),p=toWorld((a[0]+b[0])/2,(a[1]+b[1])/2);return Math.hypot(x-p.x,y-p.y)<200;});
  };
  const counts={};
  // Les repousses gardent leur type, leur échéance et leur état, même lors de l'absence.
  for(const o of [...wild,...queues].sort((a,b)=>({tree:0,rock:1}[a.type]??2)-({tree:0,rock:1}[b.type]??2))){
   const n=counts[o.type]||0;counts[o.type]=n+1;let chosen;
   for(let attempt=0;attempt<12000&&!chosen;attempt++){
    let x,y;const groups=o.type==='tree'?forests:o.type==='rock'?quarries:null;
    if(groups){const c=groups[(n+Math.floor(attempt/2000))%groups.length],a=rnd()*Math.PI*2,r=Math.sqrt(rnd());x=c.x+Math.cos(a)*r*(o.type==='tree'?540:430);y=c.y+Math.sin(a)*r*(o.type==='tree'?480:380);}
    else if(n<1&&!['bush','orties'].includes(o.type)&&attempt<150){const a=n*Math.PI+Object.keys(counts).indexOf(o.type)*.8+attempt*.37,r=160+attempt*3;x=s.player.x+Math.cos(a)*r;y=s.player.y+Math.sin(a)*r;}
    else{x=160+rnd()*(WORLD.width-320);y=165+rnd()*(WORLD.height-330);}
    if(!blocked(o.type,x,y)&&naturalPositionOK(o.type,x,y,occupied,s.player,false))chosen={x,y};
   }
   if(!chosen)throw Error('Répartition des ressources impossible sans chevauchement ; partie conservée.');
   Object.assign(o,chosen);occupied.push({...o,placed:false});
  }
  s.landscapeVersion=1;
 }
 return {migrate,forests,quarries};
})();

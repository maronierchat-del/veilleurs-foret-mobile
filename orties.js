/* Dessin encré validé le 26 octobre ; hauteur visible du buisson à baies. */
'use strict';
const NettleResource=(()=>{
 PATHS.orties='../propositions/massif-orties-encre-v1.png';
 SIZES.orties=SIZES.bush*NETTLE_SPRITE.bushVisibleRatio;
 COLLECT.orties={name:'Massif d’orties',item:'fibres',qty:COLLECT.tree.qty,cost:COLLECT.tree.cost,tool:COLLECT.tree.tool};
 TEST_RESPAWN_HOURS.orties=TEST_RESPAWN_HOURS.tree;NATURAL_TYPES.add('orties');
 PRECOMPUTED_HIT_MASKS.orties=NETTLE_SPRITE.mask;
 const originalGap=naturalGap;
 naturalGap=function(a,b){return originalGap({...a,type:a.type==='orties'?'bush':a.type},{...b,type:b.type==='orties'?'bush':b.type});};
 // Retirer les marges transparentes au chargement pour aligner pieds, image et masque.
 // Le PNG approuvé est conservé intact ; aucune déformation du dessin.
 const originalAssets=loadAssets;
 loadAssets=async function(){await originalAssets();const image=IMAGES.orties;if(!image)throw Error('Image des orties introuvable.');const [x,y,w,h]=NETTLE_SPRITE.crop,c=document.createElement('canvas');c.width=w;c.height=h;c.naturalWidth=w;c.naturalHeight=h;c.getContext('2d').drawImage(image,x,y,w,h,0,0,w,h);IMAGES.orties=c;};
 function migrate(s,{toGrid,toWorld}){
  if(s.nettlesVersion===1)return;
  const t=s.constructionTrial,rnd=random(25102619),existing=s.objects.filter(o=>o.type==='orties').length+s.respawnQueue.filter(o=>o.type==='orties').length;
  const protectedPosition=(x,y)=>{
   if(Math.hypot(x-s.player.x,y-s.player.y)<130)return true;
   const q=toGrid(x,y);
   if(q.u>-.8&&q.u<4.8&&q.v>-.8&&q.v<5.5)return true;
   if([...(t.freeFloors||[]),...(t.freeRoofs||[])].some(p=>q.u>p.u-.7&&q.u<p.u+1.7&&q.v>p.v-.7&&q.v<p.v+1.7))return true;
   return (t.freeWalls||[]).some(w=>{const [a,b]=LabGeometry.ends(w),p=toWorld((a[0]+b[0])/2,(a[1]+b[1])/2);return Math.hypot(x-p.x,y-p.y)<192;});
  };
  // D'abord près de la clairière, puis dans la région ; aucun objet existant déplacé.
  const preferred=[[300,260],[-360,300],[470,-100],[-460,-140]];
  for(let n=existing;n<12;n++)for(let attempt=0;attempt<3000;attempt++){
   const p=attempt===0&&n<preferred.length?{x:WORLD.centerX+preferred[n][0],y:WORLD.centerY+preferred[n][1]}:{x:160+rnd()*(WORLD.width-320),y:165+rnd()*(WORLD.height-330)};
   if(protectedPosition(p.x,p.y)||!naturalPositionOK('orties',p.x,p.y,s.objects,s.player,false))continue;
   s.objects.push({id:s.nextId++,type:'orties',x:p.x,y:p.y,placed:false});break;
  }
  s.nettlesVersion=1;
 }
 return {migrate};
})();

/* Cache spatial : mêmes modèles et profondeurs, sans image géante de toute la région. */
'use strict';
const ConstructionTiles=(()=>{
 const SIZE=768,OFFSET={x:64,y:384};
 const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function bounds(points,pad=24){const x=Math.min(...points.map(p=>p.x))-pad,y=Math.min(...points.map(p=>p.y))-pad;return {x,y,w:Math.max(...points.map(p=>p.x))+pad-x,h:Math.max(...points.map(p=>p.y))+pad-y};}
 function create({G,M,images,depths}){
  const cache=new Map();let active=[],stamp=0,rebuilt=0,totalRebuilt=0,lastSample=null;
  const zero={x:0,y:0,zoom:1},P=(u,v,z=0)=>G.project(u,v,zero,z);
  function drawFloors(tile,pieces){
   if(!tile.floorSurface){tile.floorSurface=document.createElement('canvas');tile.floorSurface.width=tile.floorSurface.height=SIZE;}
   const fc=tile.floorSurface.getContext('2d');fc.clearRect(0,0,SIZE,SIZE);FloorProposal.draw(fc,pieces,(u,v,z=0)=>G.project(u,v,tile.camera,z),1);
  }
  function render({floors,walls,roofs,objects,hiddenWalls,extras,screen}){
   stamp++;rebuilt=0;
   const floorBounds=floors.map(p=>bounds([[p.u,p.v],[p.u+1,p.v],[p.u+1,p.v+1],[p.u,p.v+1]].map(q=>P(...q)))),wallBounds=walls.map(p=>bounds([...G.ends(p).flatMap(q=>[P(...q),P(...q,126)]),...(p.key==='porte'&&p.open?HouseDoor.geometry(p,G).corners.map(q=>P(q.u,q.v,q.z)):[])])),roofBounds=roofs.map(p=>bounds(RoofModules.mesh(p).flatMap(f=>f.points.map(q=>P(q.u,q.v,q.z))))),objectBounds=objects.map(p=>M.bounds(p,zero,G));
   const roofCharts=ModuleRoofArt.charts(roofs),viewport={x:-screen.x/screen.zoom-1,y:-screen.y/screen.zoom-1,w:W/screen.zoom+2,h:H/screen.zoom+2},keys=new Set();
   for(const b of [...floorBounds,...wallBounds,...roofBounds,...objectBounds,...extras.filter(e=>e.construction).map(e=>e.rect)]){
    if(!intersects(b,viewport))continue;const x0=Math.floor((Math.max(b.x,viewport.x)+OFFSET.x)/SIZE),x1=Math.floor((Math.min(b.x+b.w,viewport.x+viewport.w)+OFFSET.x)/SIZE),y0=Math.floor((Math.max(b.y,viewport.y)+OFFSET.y)/SIZE),y1=Math.floor((Math.min(b.y+b.h,viewport.y+viewport.h)+OFFSET.y)/SIZE);
    for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)keys.add(x+':'+y);
   }
   active=[];
   for(const key of keys){const [x,y]=key.split(':').map(Number),rect={x:x*SIZE-OFFSET.x,y:y*SIZE-OFFSET.y,w:SIZE,h:SIZE},localFloors=floors.filter((p,i)=>intersects(floorBounds[i],{x:rect.x-164,y:rect.y-164,w:SIZE+328,h:SIZE+328})),localWalls=walls.flatMap((p,i)=>intersects(wallBounds[i],rect)?[[i,p]]:[]),localObjects=objects.flatMap((p,i)=>intersects(objectBounds[i],rect)?[[i,p]]:[]),localExtras=extras.filter(e=>intersects(e.rect,rect));
    // Inclure la phase de matière et les raccords locaux, sans invalider une zone éloignée.
    const localRoofs=new Set(roofs.filter((p,i)=>intersects(roofBounds[i],rect))),roofSignature=roofCharts.filter(f=>localRoofs.has(f.p)).map(f=>[f.p,f.sign,f.offset,f.links.map(l=>[l.a,l.b])]);
    const floorSignature=JSON.stringify(localFloors.map(p=>[p.u,p.v])),signature=JSON.stringify([floorSignature,localWalls,localObjects,roofSignature,hiddenWalls.filter(p=>localWalls.some(([,q])=>p===q)).map(G.edgeId),localExtras.map(e=>[e.owner,e.image.src,e.rect])]);
    let tile=cache.get(key);if(!tile){const surface=document.createElement('canvas');surface.width=surface.height=SIZE;tile={key,surface,camera:{x:-rect.x,y:-rect.y,zoom:1},left:rect.x,top:rect.y,rect};cache.set(key,tile);}
    tile.stamp=stamp;
    if(tile.signature!==signature){const context=tile.surface.getContext('2d',{willReadFrequently:true});context.clearRect(0,0,SIZE,SIZE);if(tile.floorSignature!==floorSignature){drawFloors(tile,localFloors);tile.floorSignature=floorSignature;}context.drawImage(tile.floorSurface,0,0);
     if(!tile.worker)tile.worker=MeshOcclusion.create(context,G,M,depths);
     tile.last=tile.worker.render({ownerBands:true,camera:tile.camera,objects,hero:[-100,-100],images,floors,walls,roofs,roofAlpha:roofs.length?1:0,hiddenWalls,extras:localExtras.map(e=>({...e,footY:e.footY-rect.y,rect:{...e.rect,x:e.rect.x-rect.x,y:e.rect.y-rect.y}}))});
     tile.transparent=tile.last.layers.filter(l=>l.alpha<.98||l.rgba.some((a,i)=>i%4===3&&a>0&&a<250));tile.signature=signature;tile.lastBuild=stamp;rebuilt++;totalRebuilt++;
    }
    active.push(tile);
   }
   // Les images visibles restent en cache ; deux moteurs seulement conservent leurs caches de travail.
   const ordered=[...cache.values()].sort((a,b)=>b.stamp-a.stamp),workers=ordered.filter(t=>t.worker).sort((a,b)=>b.lastBuild-a.lastBuild);for(const t of workers.slice(2))t.worker=null;
   const stale=ordered.filter(t=>t.stamp!==stamp);for(const t of stale.slice(2)){cache.delete(t.key);t.worker=null;t.last=null;t.surface.width=t.surface.height=1;if(t.floorSurface)t.floorSurface.width=t.floorSurface.height=1;}
   return active;
  }
  function sample(x,y){let t=lastSample;if(!t||t.stamp!==stamp||x<t.left||y<t.top||x>=t.left+SIZE||y>=t.top+SIZE)t=cache.get(Math.floor((x+OFFSET.x)/SIZE)+':'+Math.floor((y+OFFSET.y)/SIZE));if(!t||t.stamp!==stamp)return null;lastSample=t;const px=Math.floor(x-t.left),py=Math.floor(y-t.top);return {tile:t,x:px,y:py,index:py*SIZE+px};}
  return {render,sample,get views(){return active;},get metrics(){return {visible:active.length,cached:cache.size,rebuilt,totalRebuilt};}};
 }
 return {create,SIZE};
})();

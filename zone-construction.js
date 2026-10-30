/* Même grille partout dans la région ; l'affichage ne parcourt que le champ visible. */
'use strict';
const BuildingArea=(()=>{
 const G=LabGeometry,origin={x:1500,y:1400},legacy={minU:-1,maxU:3,minV:4,maxV:6};
 const tools=new URLSearchParams(location.search).has('outils')||new URLSearchParams(location.search).has('maison-test');
 const restricted=new URLSearchParams(location.search).has('outils');
 const world=(u,v)=>{const p=G.project(u,v,{x:0,y:0,zoom:1});return {x:origin.x+p.x,y:origin.y+p.y/.7};};
 const grid=(x,y)=>G.unproject(x-origin.x,(y-origin.y)*.7,{x:0,y:0,zoom:1});
 const inside=([u,v])=>{const p=world(u,v);return p.x>=90&&p.y>=90&&p.x<=WORLD.width-90&&p.y<=WORLD.height-90;};
 function cell(p){return Number.isSafeInteger(p?.u)&&Number.isSafeInteger(p?.v)&&[[p.u,p.v],[p.u+1,p.v],[p.u+1,p.v+1],[p.u,p.v+1]].every(inside);}
 function edge(p){return Number.isSafeInteger(p?.u)&&Number.isSafeInteger(p?.v)&&[0,3].includes(p.rot)&&G.ends(p).every(inside);}
 function bounds(points,pad=0){return {minU:Math.floor(Math.min(...points.map(p=>p.u)))-pad,maxU:Math.ceil(Math.max(...points.map(p=>p.u)))+pad,minV:Math.floor(Math.min(...points.map(p=>p.v)))-pad,maxV:Math.ceil(Math.max(...points.map(p=>p.v)))+pad};}
 function visible(height=0){
  if(restricted)return legacy;
  const corners=[[0,0],[W,0],[W,H],[0,H]].flatMap(([x,y])=>[0,height].map(z=>{const p=unproject(x,y+z*ui.camera.zoom);return grid(p.x,p.y);})),view=bounds(corners,1),region=bounds([[90,90],[WORLD.width-90,90],[WORLD.width-90,WORLD.height-90],[90,WORLD.height-90]].map(([x,y])=>grid(x,y)),1);
  return {minU:Math.max(view.minU,region.minU),maxU:Math.min(view.maxU,region.maxU),minV:Math.max(view.minV,region.minV),maxV:Math.min(view.maxV,region.maxV)};
 }
 const previewPoint=()=>unproject(W/2,H*.55);
 return {cell,edge,visible,previewPoint,legacy,tools,restricted,fixedCount:tools?16:0};
})();

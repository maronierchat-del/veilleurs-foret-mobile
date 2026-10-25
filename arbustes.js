/* Objets approuvés : transplantation, feu et marmite sur la grille commune. */
'use strict';
const BushTransplant=(()=>{
 let api;const measures=new Map(),G=LabGeometry,M=ValidatedModel;
 const isBush=o=>o?.placed&&o.type==='arbuste';
 const stations={feu:{height:90,ground:{x:160,y:274}},marmite:{height:78,ground:{x:157,y:232}}};
 const supports=key=>key==='arbuste'||Object.hasOwn(stations,key),isFixture=o=>o?.placed&&supports(o.type);
 function measure(image,stage){const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const cx=c.getContext('2d');cx.drawImage(image,0,0);const data=cx.getImageData(0,0,c.width,c.height).data;let left=c.width,right=0,top=c.height,bottom=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const height=bottom-top+1;return {width:c.width,height:c.height,visible:height,ground:stations[stage]?.ground||{x:stage===2?160:(left+right)/2,y:bottom-(stage===1?19:19*height/278)}};
 }
 function load(){for(const [stage,spr]of [[1,'bush_planted'],[2,'bush_empty'],[3,'bush'],['feu','feu'],['marmite','marmite']])measures.set(stage,measure(IMAGES[spr],stage));}
 function bounds(o,foot,zoom=1){if(!isFixture(o))return null;const stage=isBush(o)?o.stage??1:o.type,m=measures.get(stage);if(!m)return null;const visible=stations[o.type]?.height||(stage===1?65:100),scale=visible*zoom/m.visible;return {x:foot.x-m.ground.x*scale,y:foot.y-m.ground.y*scale,w:m.width*scale,h:m.height*scale,foot,scale,visibleHeight:visible};}
 function footprint(o){const q=api.toGrid(o.x,o.y),half=isBush(o)?.5:.25;return [[q.u-half,q.v-half],[q.u+half,q.v-half],[q.u+half,q.v+half],[q.u-half,q.v+half]];}
 function blocked(q){return state.objects.filter(isFixture).some(o=>{const poly=footprint(o);return M.contains([q.u,q.v],poly)||poly.some((a,i)=>G.segmentDistance({x:q.u,y:q.v},{x:a[0],y:a[1]},{x:poly[(i+1)%4][0],y:poly[(i+1)%4][1]})<.1);});}
 function snap(x,y){const q=api.toGrid(x,y);return api.toWorld(Math.round(q.u*4)/4,Math.round(q.v*4)/4);}
 function evaluate(x,y,key='arbuste'){const p=snap(x,y),o={type:key,placed:true,stage:key==='arbuste'?1:0,...p},poly=footprint(o),player=api.toGrid(state.player.x,state.player.y);
  if(!supports(key))return {valid:false,p,reason:'Objet non raccordé.'};
  if(key!=='arbuste'&&!hasTool('marteau'))return {valid:false,p,reason:'Équipe le marteau pour poser cette installation.'};
  if(!amount(key))return {valid:false,p,reason:'Cet objet n’est plus dans le sac.'};
  if(Math.hypot(p.x-state.player.x,p.y-state.player.y)>255)return {valid:false,p,reason:'Approche-toi de l’emplacement pour planter.'};
  if(poly.some(([u,v])=>{const a=api.toWorld(u,v);return a.x<90||a.y<90||a.x>WORLD.width-90||a.y>WORLD.height-90;}))return {valid:false,p,reason:'Emplacement hors de la région accessible.'};
  if(M.contains([player.u,player.v],poly)||poly.some((a,i)=>G.segmentDistance({x:player.u,y:player.v},{x:a[0],y:a[1]},{x:poly[(i+1)%4][0],y:poly[(i+1)%4][1]})<.1))return {valid:false,p,reason:'Le personnage occupe cet emplacement.'};
  if(api.walls.some(w=>M.overlap(poly,M.wallPoly(w,G))||w.key==='porte'&&w.open&&M.overlap(poly,HouseDoor.geometry(w,G).polygon))||api.objects.some(o=>CultivationPlacement.clearance(o).some(q=>M.overlap(poly,q))))return {valid:false,p,reason:'Un mur, une porte ou une installation occupe cet emplacement.'};
  for(const other of state.objects){if(other.trialFixture||CultivationPlacement.isFixture(other)||other.placed&&['sol','toit','chemin_terre','chemin_pierre'].includes(other.type))continue;
   if(isFixture(other)){if(M.overlap(poly,footprint(other)))return {valid:false,p,reason:'Une installation occupe cet emplacement.'};continue;}
   const q=api.toGrid(other.x,other.y),radius=other.type==='tree'?47:other.type==='rock'?42:other.type==='bush'?36:35;
   const worldPoly=poly.map(([u,v])=>{const a=api.toWorld(u,v);return [a.x,a.y];});if(M.contains([other.x,other.y],worldPoly)||worldPoly.some((a,i)=>G.segmentDistance({x:other.x,y:other.y},{x:a[0],y:a[1]},{x:worldPoly[(i+1)%4][0],y:worldPoly[(i+1)%4][1]})<radius))return {valid:false,p,reason:'Un objet ou une ressource occupe cet emplacement.'};
  }
  return {valid:true,p,reason:key==='arbuste'?'Emplacement libre · planter : 1 énergie.':'Emplacement libre.'};
 }
 function start(key='arbuste'){if(!supports(key)||!amount(key))return toast('Cet objet n’est plus dans le sac.');FloorPlacement.stop();WallPlacement.stop();RoofPlacement.stop();ui.auto=null;ui.selection=null;drawSelection();ui.placing=key;ui.hover={x:state.player.x+100,y:state.player.y};closePanel();$('placementHelp').hidden=false;$('placementLabel').textContent=(key==='arbuste'?'Buisson':LABEL[key])+' · touche le terrain pour placer';}
 function apply(x,y,key=ui.placing||'arbuste'){const r=evaluate(x,y,key);if(!r.valid){toast(r.reason);return false;}if(key==='arbuste'&&!pay(1))return false;give(key,-1);const o={id:state.nextId++,type:key,placed:true,stage:key==='arbuste'?1:0,...r.p};if(key==='arbuste')nextReady(o,TEST_HOURS.arbusteFirst);state.objects.push(o);sound('place');if(!amount(key))stopPlacing();commit();toast(key==='arbuste'?'Buisson planté · 1 énergie.':LABEL[key]+' installé.');return true;}
 function drawPreview(){if(!supports(ui.placing)||!ui.hover||MapControls.active)return;const key=ui.placing,r=evaluate(ui.hover.x,ui.hover.y,key),o={type:key,placed:true,stage:key==='arbuste'?1:0,...r.p},rect=bounds(o,project(r.p.x,r.p.y),ui.camera.zoom);ctx.save();ctx.drawImage(IMAGES[spriteFor(o)],rect.x,rect.y,rect.w,rect.h);ctx.beginPath();footprint(o).map(([u,v])=>{const a=api.toWorld(u,v);return project(a.x,a.y);}).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.strokeStyle=r.valid?'#c9f6aa':'#ff8276';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
 function init(trial){api=trial;const oldRect=objectRect,oldDraw=drawObject,oldPlace=tryPlace,oldPoint=placementPoint;
  objectRect=function(o){return bounds(o,project(o.x,o.y),ui.camera.zoom)||oldRect(o);};
  drawObject=function(o){if(!isFixture(o))return oldDraw(o);const r=objectRect(o);ctx.drawImage(IMAGES[spriteFor(o)],r.x,r.y,r.w,r.h);};
  placementPoint=function(key,x,y){return supports(key)?snap(x,y):oldPoint(key,x,y);};
  tryPlace=function(x,y){return supports(ui.placing)?apply(x,y):oldPlace(x,y);};
 }
 return {init,load,start,apply,evaluate,bounds,footprint,blocked,drawPreview,isBush,isFixture};
})();

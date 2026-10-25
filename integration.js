/* Première intégration : scène approuvée, commandes et systèmes V0.4.1 conservés.
   Toutes les écritures restent dans la sauvegarde propre à cette copie. */
'use strict';
const ConstructionTrial=(()=>{
 const G=LabGeometry,M=ValidatedModel,origin={x:1500,y:1400},openWorld=!BuildingArea.tools;let tiles;
 const camera={x:180,y:350,zoom:1},surface=document.createElement('canvas');
 surface.width=1100;surface.height=850;
 const context=surface.getContext('2d',{willReadFrequently:true}),floorSurface=document.createElement('canvas');floorSurface.width=surface.width;floorSurface.height=surface.height;
 const floors=Array.from({length:16},(_,i)=>({key:'sol',u:i%4,v:Math.floor(i/4)}));
 const roofs=[],walls=[],objects=[],images={};let rotation=0,occlusion,ready=false,lastKey='',lastMs=0,renderFloors=floors,renderWalls=walls,renderRoofs=roofs;
 const modelObjects=()=>[...objects,...CultivationPlacement.models()];
 function refreshRoofs(preview=null){renderRoofs=preview||roofs;lastKey='';}
 function refreshWalls(preview=null){renderWalls=preview||walls;lastKey='';}
 function refreshFloors(preview=null){renderFloors=preview||floors;if(openWorld){lastKey='';return;}floorSurface.getContext('2d').clearRect(0,0,surface.width,surface.height);FloorProposal.draw(floorSurface.getContext('2d'),renderFloors,(u,v,z=0)=>G.project(u,v,camera,z),1);lastKey='';}
 const toWorld=(u,v)=>{const p=G.project(u,v,{x:0,y:0,zoom:1});return {x:origin.x+p.x,y:origin.y+p.y/.7};};
 const toGrid=(x,y)=>G.unproject(x-origin.x,(y-origin.y)*.7,{x:0,y:0,zoom:1});
 const turn=([u,v],r)=>[[u,v],[4-v,u],[4-u,4-v],[v,4-u]][r];
 function shell(r=0,open=true){
  rotation=r;walls.length=0;roofs.length=0;objects.length=0;
  for(let u=0;u<4;u++)for(let v=0;v<4;v++){
   const d=[v,3-u,3-v,u],low=Math.min(...d),s=d.map((n,i)=>n===low?i:-1).filter(i=>i>=0);
   const rot=s.length===1?s[0]:s.includes(0)&&s.includes(3)?0:s.includes(0)&&s.includes(1)?1:s.includes(1)&&s.includes(2)?2:3;
   roofs.push({id:roofs.length,kind:s.length===1?'pan':'angle',u,v,rot,base:122+64*low});
  }
  const raw=[];for(let i=0;i<4;i++)raw.push({u:i,v:0,rot:0,key:i===2?'fenetre':'mur'},{u:4,v:i,rot:3,key:i===1?'fenetre':'mur'},{u:0,v:i,rot:3,key:i===2?'fenetre':'mur'},{u:i,v:4,rot:0,key:i===0?'porte':'mur',...(i===0?{open}:{})});
  for(const p of raw){const e=G.ends(p).map(q=>turn(q,r)),w={...p,u:Math.min(...e.map(q=>q[0])),v:Math.min(...e.map(q=>q[1])),rot:Math.abs(e[0][1]-e[1][1])<1e-8?0:3};if(w.key==='porte'){const inward=InteriorWallArt.layout(w,G.ends,floors).inward;w.outward=[-inward.u,-inward.v];}walls.push(w);}
  const corners=M.rect({key:'etabli',u:.5,v:.5,rot:0}).map(q=>turn(q,r));
  objects.push({key:'etabli',stage:'',u:Math.min(...corners.map(q=>q[0])),v:Math.min(...corners.map(q=>q[1])),rot:r});lastKey='';
 }
 shell();
 function fixture(s){
  if(!s.constructionTrial)s.constructionTrial={version:1,rotation:0,doorOpen:true};
  const keep=(list,clean)=>clean.map((p,i)=>({...list?.[i],...p}));
  s.constructionTrial.freeFloors=keep(s.constructionTrial.freeFloors,FloorPlacement.sanitize(s.constructionTrial.freeFloors));
  floors.splice(16);floors.push(...s.constructionTrial.freeFloors);
  shell(s.constructionTrial.rotation,s.constructionTrial.doorOpen);
  const savedOut=s.constructionTrial.doorOutward;if(Array.isArray(savedOut)&&savedOut.length===2&&savedOut.every(Number.isFinite)&&Math.abs(savedOut[0])+Math.abs(savedOut[1])===1)walls.find(w=>w.key==='porte').outward=[...savedOut];
  s.constructionTrial.freeWalls=keep(s.constructionTrial.freeWalls,WallPlacement.sanitize(s.constructionTrial.freeWalls,s.constructionTrial.freeFloors,walls));
  walls.push(...s.constructionTrial.freeWalls);renderWalls=walls;
  s.constructionTrial.freeRoofs=keep(s.constructionTrial.freeRoofs,RoofPlacement.sanitize(s.constructionTrial.freeRoofs,roofs));roofs.push(...s.constructionTrial.freeRoofs);renderRoofs=roofs;
  // Clairière d'essai : les ressources naturelles sont conservées hors de la maison.
  // Déplacement déterministe des seules ressources qui empêcheraient de la visiter.
  for(const o of s.objects){if(o.placed)continue;const q=toGrid(o.x,o.y);if(q.u>-.8&&q.u<4.8&&q.v>-.8&&q.v<5.5){o.x-=720;o.y-=400;}}
  let bench=s.objects.find(o=>o.trialFixture==='bench');
  const a=M.anchor(objects[0]),p=toWorld(...a);
  if(!bench){bench={id:s.nextId++,type:'etabli',placed:true,stage:0,trialFixture:'bench'};s.objects.push(bench);}Object.assign(bench,p);
  NettleResource.migrate(s,{toGrid,toWorld});return s;
 }
 function returnToDoor(){MapControls.center();const p=toWorld(...turn([.5,4.65],rotation));Object.assign(state.player,p);ui.auto=null;ui.keys.clear();ui.touch.clear();ui.camera.x=p.x;ui.camera.y=p.y-120/(ui.camera.zoom*.7);lastKey='';saveSoon();}
 const originalNewState=newState;
 newState=function(){const s=fixture(originalNewState()),p=toWorld(.5,4.65);Object.assign(s.player,p);return s;};
 SaveContinuity.install({prepare(s){
  spaceWildResources(s);migrateSave(s);
  // Refuser une pièce perdue par normalisation plutôt que réenregistrer une scène amputée.
  const t=s.constructionTrial;
  const lists=[['freeFloors',FloorPlacement.sanitize(t.freeFloors)],['freeWalls',WallPlacement.sanitize(t.freeWalls,t.freeFloors,walls.slice(0,16))],['freeRoofs',RoofPlacement.sanitize(t.freeRoofs,roofs.slice(0,16))]];
  for(const [key,clean]of lists){const old=t[key]||[];if(clean.length!==old.length)throw Error('Constructions incompatibles : '+key+'. Aucune pièce supprimée.');t[key]=clean.map((p,i)=>({...old[i],...p}));}
  NettleResource.migrate(s,{toGrid,toWorld});
 },activate(s){fixture(s);refreshFloors();refreshWalls();refreshRoofs();}});
 const safeLoad=loadSave;
 loadSave=function(){return fixture(safeLoad());};
 const originalPickup=pickup;
 pickup=function(o){if(!o||!state.objects.includes(o))return;if(o.trialFixture){toast('La maison et son établi sont fixes pour ce premier essai.');return;}const result=originalPickup(o);if(!state.objects.includes(o)&&ui.stationId===o.id){ui.stationId=null;closePanel();}return result;};
 placeStart=function(key){if(CultivationPlacement.supports(key)){CultivationPlacement.start(key);return;}if(['arbuste','feu','marmite'].includes(key)){BushTransplant.start(key);return;}if(key==='sol'){FloorPlacement.start();return;}if(['mur','fenetre','porte'].includes(key)){WallPlacement.start('add',key);return;}if(key==='toit'){if(!amount('toit'))return toast('Fabrique des éléments de toiture à l’établi.');RoofPlacement.start();return;}toast('Construction libre prévue au prochain jalon. La maison est déjà posée pour cet essai.');};
 const stockPieces=['sol','mur','fenetre','porte'];
 for(const key of [...stockPieces,'pepiniere','potager','champignonniere'])CRAFT[key].bench=true;
 const originalCraft=craft;
 craft=function(key){if(key==='feu'&&!hasTool('marteau')){toast('Équipe le marteau pour fabriquer le feu de camp.');return;}if([...stockPieces,'toit','feu','marmite'].includes(key)||CultivationPlacement.supports(key)){originalCraft(key);return;}if(CRAFT[key]?.kind!=='outil'){toast('Fabrication des installations et constructions raccordée au prochain jalon.');return;}const before=amount(key);originalCraft(key);if(amount(key)>before&&key!=='sac'){if(!state.quickTools.includes(key))state.quickTools.push(key);commit();toast('Outil fabriqué et équipé.');}};
 const originalCanCraft=canCraft;
 canCraft=function(key){return (key!=='feu'||hasTool('marteau'))&&([...stockPieces,'toit','feu','marmite'].includes(key)||CultivationPlacement.supports(key)||CRAFT[key]?.kind==='outil')&&originalCanCraft(key);};
 const originalProtectedSpot=protectedSpot;
 protectedSpot=function(x,y){if(originalProtectedSpot(x,y))return true;if(!openWorld)return false;const q=toGrid(x,y);if([...floors,...roofs].some(p=>q.u>=p.u&&q.u<=p.u+1&&q.v>=p.v&&q.v<=p.v+1))return true;return walls.some(w=>{const [a,b]=G.ends(w),p=toWorld((a[0]+b[0])/2,(a[1]+b[1])/2);return Math.hypot(x-p.x,y-p.y)<192;});};
 const originalWalk=canWalk;
 canWalk=function(x,y){const q=toGrid(x,y);return !BushTransplant.blocked(q)&&!M.blocked([q.u,q.v],modelObjects(),walls,DoorGeometry,G)&&originalWalk(x,y);};
 const search=ObstacleNavigation.create((x,y)=>canWalk(x,y),WORLD),navigation={clear:search.clear,plan(from,to,radius=0){const a=toGrid(from.x,from.y),b=toGrid(to.x,to.y),inside=q=>q.u>=0&&q.u<4&&q.v>=0&&q.v<4;if(inside(a)!==inside(b)&&!walls.find(w=>w.key==='porte').open)return null;return search.plan(from,to,radius);}};
 // Les fenêtres et murs transparents restent physiques ; le banc est déjà testé par M.
 SIZES.person=SIZES.right=SIZES.left=SIZES.back=110;
 function interior(){const q=toGrid(state.player.x,state.player.y);return q.u>=0&&q.u<4&&q.v>=0&&q.v<4;}
 function hiddenWalls(){const main=interior()?renderWalls.slice(0,16).filter(w=>w.rot%2?Math.abs(w.u)<1e-8:Math.abs(w.v-4)<1e-8):[];return [...main,...WallPlacement.hidden(toGrid(state.player.x,state.player.y),renderWalls)];}
 function toggleDoor(p=walls.find(w=>w.key==='porte')){if(!walls.includes(p)||p.key!=='porte')return false;const q=toGrid(state.player.x,state.player.y),next={...p,open:!p.open,...(!p.open?{outward:HouseDoor.awayFrom(p,q,G)}:{})};
  const touches=(point,poly,radius=.1)=>M.contains([point.u,point.v],poly)||poly.some((a,i)=>{const b=poly[(i+1)%poly.length];return G.segmentDistance({x:point.u,y:point.v},{x:a[0],y:a[1]},{x:b[0],y:b[1]})<radius;});
  // Tester tout le balayage, pas seulement la position finale du battant.
  let blocked=M.blocked([q.u,q.v],[],[next],DoorGeometry,G);
  for(let i=0;i<=20&&!blocked;i++){const leaf=HouseDoor.geometry({...next,open:true},G,i/20).polygon;
   blocked=touches(q,leaf)||modelObjects().some(o=>CultivationPlacement.clearance(o).some(poly=>M.overlap(poly,leaf)))||walls.some(w=>w!==p&&(M.overlap(leaf,M.wallPoly(w,G))||w.key==='porte'&&w.open&&M.overlap(leaf,HouseDoor.geometry(w,G).polygon)));
   if(!blocked)blocked=state.objects.some(o=>{if(o.trialFixture||CultivationPlacement.isFixture(o))return false;if(BushTransplant.isFixture(o))return M.overlap(leaf,BushTransplant.footprint(o));const poly=leaf.map(([u,v])=>{const a=toWorld(u,v);return [a.x,a.y];}),radius=o.type==='tree'?47:o.type==='rock'?42:o.type==='bush'?36:35;return touches({u:o.x,v:o.y},poly,radius);});
  }
  if(blocked){toast('La porte est bloquée par le personnage ou un obstacle.');return false;}
  p.open=next.open;p.outward=next.outward;if(walls.indexOf(p)<16){state.constructionTrial.doorOpen=p.open;state.constructionTrial.doorOutward=[...p.outward];}ui.auto=null;lastKey='';saveSoon();return true;
 }
 const screenCamera=()=>{const p=project(origin.x,origin.y);return {x:p.x,y:p.y,zoom:ui.camera.zoom};};
 function doorAt(x,y){
  if(!ready)return false;for(const p of walls.filter(w=>w.key==='porte')){const c=screenCamera(),pr=(u,v,z=0)=>G.project(u,v,c,z),m=InteriorWallArt.describe(p,G.ends,pr,floors),o=m.opening;
  const index=walls.indexOf(p),targets=p.open?[{points:HouseDoor.geometry(p,G).corners.map(q=>pr(q.u,q.v,q.z)),owner:(openWorld?5000:300)+index},{points:[m.point(o.left-.055,0),m.point(o.right+.055,0),m.point(o.right+.055,o.top+6),m.point(o.left-.055,o.top+6)],owner:(openWorld?1000:10)+index}]:[{points:[m.point(o.left+.025,2),m.point(o.right-.025,2),m.point(o.right-.025,o.top-2),m.point(o.left+.025,o.top-2)],owner:(openWorld?1000:10)+index}];
  const q=G.unproject(x,y,c),pt=G.project(q.u,q.v,camera),px0=Math.floor(pt.x),py0=Math.floor(pt.y),sample=openWorld&&tiles.sample(pt.x-camera.x,pt.y-camera.y),px=sample?sample.x:px0,py=sample?sample.y:py0,d=openWorld?sample?.tile.last:occlusion.last;
  for(const target of targets){if(!M.contains([x,y],target.points.map(p=>[p.x,p.y])))continue;const layer=d?.layers.find(l=>l.owner===target.owner);
   if(!layer||px<layer.x||py<layer.y||px>=layer.x+layer.w||py>=layer.y+layer.h)continue;
   const i=(py-layer.y)*layer.w+px-layer.x;if(layer.rgba[i*4+3]&&layer.z[i]>=d.zbuffer[py*d.W+px]-1e-5)return p;
  }
  }return false;
 }
 const originalObjectAt=objectAt;
 // Même pixel et mêmes propriétaires que le rendu : ne jamais viser une couche cachée.
 function recoveryTargetAt(x,y){
  if(!ready)return null;
  const q=G.unproject(x,y,screenCamera()),p=G.project(q.u,q.v,camera),sample=openWorld&&tiles?.sample(p.x-camera.x,p.y-camera.y),d=openWorld?sample?.tile.last:occlusion?.last,px=sample?sample.x:Math.floor(p.x),py=sample?sample.y:Math.floor(p.y);
  const inside=d&&px>=0&&py>=0&&px<d.W&&py<d.H;let owner=inside?d.owners[py*d.W+px]:0;
  // Les murs intérieurs à 22 % restent cliquables sur leurs pixels visibles.
  if(inside){let depth=d.zbuffer[py*d.W+px];for(const layer of d.layers){
   const construction=layer.owner===200||layer.owner>=(openWorld?1000:10)&&layer.owner<(openWorld?20000:2000);if(!construction||px<layer.x||py<layer.y||px>=layer.x+layer.w||py>=layer.y+layer.h)continue;
   const i=(py-layer.y)*layer.w+px-layer.x;if(layer.rgba[i*4+3]*layer.alpha>5&&layer.z[i]>=depth-1e-5){owner=layer.owner;depth=layer.z[i];}
  }}
  if(owner===200){const piece=RoofPlacement.pick(x,y,'remove');return piece?{kind:'roof',piece}:{kind:'blocked'};}
  const wallIndex=owner-(openWorld?1000:10),leafIndex=owner-(openWorld?5000:300);
  if(wallIndex>=0&&wallIndex<walls.length)return {kind:'wall',piece:walls[wallIndex]};
  if(leafIndex>=0&&leafIndex<walls.length)return {kind:'wall',piece:walls[leafIndex]};
  if(owner>=(openWorld?10000:1000)&&owner<(openWorld?20000:2000))return {kind:'blocked'};
  if(owner)return null;
  // Les sols sont peints sous les couches de profondeur, à leur vraie case monde.
  if(objectAt(x,y))return null;
  const piece=floors.find(f=>f.u===Math.floor(q.u)&&f.v===Math.floor(q.v));return piece?{kind:'floor',piece}:null;
 }
 objectAt=function(x,y){const c=screenCamera(),q=G.unproject(x,y,c),p=G.project(q.u,q.v,camera),d=occlusion?.last,px=Math.floor(p.x),py=Math.floor(p.y);
  const sample=openWorld&&tiles?.sample(p.x-camera.x,p.y-camera.y),owner=openWorld?(sample?.tile.last.owners[sample.index]||0):d&&px>=0&&py>=0&&px<d.W&&py<d.H?d.owners[py*d.W+px]:0;
  if(owner===1)return state.objects.find(o=>o.trialFixture==='bench');
  const model=modelObjects()[owner-1];if(model?.sourceId)return state.objects.find(o=>o.id===model.sourceId);
  const found=originalObjectAt(x,y);if(openWorld&&sample&&found&&(found.type==='bush'||BushTransplant.isFixture(found))&&owner!==30000+state.objects.filter(o=>!o.trialFixture).indexOf(found))return null;return found?.trialFixture||CultivationPlacement.isFixture(found)?null:found;
 };
 function imageRect(im,foot,height){const h=height,w=h*im.naturalWidth/im.naturalHeight;return {x:foot.x-w/2,y:foot.y-h,w,h};}
 // Le personnage est toujours dessiné depuis son image source à la densité
 // réelle de l'écran ; aucun passage par l'image de maison à résolution fixe.
 const heroCanvas=document.createElement('canvas'),heroContext=heroCanvas.getContext('2d',{willReadFrequently:true}),heroMetrics=new Map();
 let walkLeft,transparencySource=null,transparentLayers=[],heroCacheKey='',heroCacheResult=null;
 function heroPose(){const p=state.player,walking=ui.walkMoving&&(p.face==='right'||p.face==='left')&&ui.walkClock<.18&&IMAGES.walk1;
  return {image:walking?(p.face==='left'?walkLeft:IMAGES.walk1):IMAGES[p.face]||IMAGES.person,key:walking?'walk-'+p.face:p.face};
 }
 function heroBounds(image,foot,zoom){
  if(image===IMAGES.person){const s=110*zoom/458;return {x:foot.x-98*s,y:foot.y-464*s,w:166*s,h:472*s};}
  const metrics=heroMetrics.get(image),s=110*zoom/(metrics?.height||image.height);
  return {x:foot.x-image.width*s/2,y:foot.y-(metrics?.bottom||image.height)*s,w:image.width*s,h:image.height*s};
 }
 function drawHero(){
  const start=performance.now();
  const pose=heroPose(),p=state.player,foot=project(p.x,p.y),r=heroBounds(pose.image,foot,ui.camera.zoom);
  const left=Math.floor(r.x*dpr),top=Math.floor(r.y*dpr),width=Math.ceil((r.x+r.w)*dpr)-left,height=Math.ceil((r.y+r.h)*dpr)-top;
  const cacheKey=openWorld?JSON.stringify([pose.key,r,dpr,p.x,p.y,ui.camera.zoom,tiles.metrics.totalRebuilt]):'';
  if(openWorld&&cacheKey===heroCacheKey){ctx.drawImage(heroCanvas,left/dpr,top/dpr,width/dpr,height/dpr);return heroCacheResult;}
  heroCanvas.width=width;heroCanvas.height=height;
  heroContext.imageSmoothingEnabled=true;heroContext.imageSmoothingQuality='high';
  heroContext.drawImage(pose.image,r.x*dpr-left,r.y*dpr-top,r.w*dpr,r.h*dpr);
  const data=heroContext.getImageData(0,0,width,height),grid=toGrid(p.x,p.y),c=screenCamera(),depth=openWorld?null:occlusion.last;
  if(!openWorld&&transparencySource!==depth){transparencySource=depth;transparentLayers=depth.layers.filter(l=>l.alpha<.98||l.rgba.some((a,i)=>i%4===3&&a>0&&a<250));}
  const transparent=transparentLayers;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const n=(y*width+x)*4;if(!data.data[n+3])continue;
   const sx=(left+x+.5)/dpr,sy=(top+y+.5)/dpr;
   const sample=openWorld?tiles.sample((sx-c.x)/c.zoom,(sy-c.y)/c.zoom):null,frame=openWorld?sample?.tile.last:depth;
   if(!frame)continue;const lx=openWorld?sample.x:Math.floor((sx-c.x)/c.zoom+camera.x),ly=openWorld?sample.y:Math.floor((sy-c.y)/c.zoom+camera.y);
   if(lx<0||ly<0||lx>=frame.W||ly>=frame.H)continue;
   const z=MeshOcclusion.world(grid.u,grid.v,(foot.y-sy)/c.zoom);
   if(z<frame.zbuffer[ly*frame.W+lx]-1e-5){data.data[n+3]=0;continue;}
   for(const layer of openWorld?sample.tile.transparent:transparent){const xx=lx-layer.x,yy=ly-layer.y;if(xx<0||yy<0||xx>=layer.w||yy>=layer.h)continue;const i=yy*layer.w+xx,a=layer.rgba[i*4+3]/255*layer.alpha;
    if(!a||a>=.98||layer.z[i]<z-1e-5)continue;for(let channel=0;channel<3;channel++)data.data[n+channel]=data.data[n+channel]*(1-a)+layer.rgba[i*4+channel]*a;
   }
  }
  heroContext.putImageData(data,0,0);ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(heroCanvas,left/dpr,top/dpr,width/dpr,height/dpr);ctx.restore();
  lastMs+=performance.now()-start;const result={pose:pose.key,rect:r,pixels:data.data.filter((v,i)=>i%4===3&&v>0).length,density:dpr};if(openWorld){heroCacheKey=cacheKey;heroCacheResult=result;}return result;
 }
 function sceneObjects(){return state.objects.filter(o=>!o.trialFixture&&!CultivationPlacement.isFixture(o)).map(o=>{const spr=spriteFor(o),im=IMAGES[spr];if(!im)return null;const q=toGrid(o.x,o.y),foot=G.project(q.u,q.v,camera),rect=BushTransplant.bounds(o,foot,1)||imageRect(im,foot,sizeFor(o,spr));return {o,image:im,u:q.u,v:q.v,footY:foot.y,rect,owner:2000+o.id};}).filter(e=>e&&e.rect.x>=0&&e.rect.y>=0&&e.rect.x+e.rect.w<=surface.width&&e.rect.y+e.rect.h<=surface.height);}
 function draw(){if(!ready)return;
  lastMs=0;
  const activeRoofs=RoofPlacement.visible(renderRoofs,interior()),key=JSON.stringify([interior(),hiddenWalls().map(G.edgeId),rotation,renderWalls,activeRoofs,state.objects.map(o=>[o.id,spriteFor(o),o.x,o.y,o.rot])]);
  if(key!==lastKey){const start=performance.now();lastKey=key;context.clearRect(0,0,surface.width,surface.height);context.drawImage(floorSurface,0,0);
   const extras=sceneObjects();
   occlusion.render({camera,objects:modelObjects(),hero:[-100,-100],images,floors:renderFloors,walls:renderWalls,roofs:activeRoofs,roofAlpha:activeRoofs.length?1:0,hiddenWalls:hiddenWalls(),extras});lastMs=performance.now()-start;
  }
  const p=screenCamera();ctx.drawImage(surface,p.x-camera.x*p.zoom,p.y-camera.y*p.zoom,surface.width*p.zoom,surface.height*p.zoom);
 }
 function worldExtras(){return state.objects.filter(o=>!o.trialFixture).map((o,index)=>{if(CultivationPlacement.isFixture(o))return null;const image=IMAGES[spriteFor(o)];if(!image)return null;const q=toGrid(o.x,o.y),foot=G.project(q.u,q.v,{x:0,y:0,zoom:1});return {o,image,construction:BushTransplant.isFixture(o),u:q.u,v:q.v,footY:foot.y,rect:BushTransplant.bounds(o,foot,1)||imageRect(image,foot,sizeFor(o,spriteFor(o))),owner:30000+index};}).filter(Boolean);}
 function worldFrame(){
  const start=performance.now(),screen=screenCamera(),active=RoofPlacement.visible(renderRoofs,interior()),views=tiles.render({floors:renderFloors,walls:renderWalls,roofs:active,objects:modelObjects(),hiddenWalls:hiddenWalls(),extras:worldExtras(),screen});
  const outside=state.objects.filter(o=>!o.trialFixture&&!CultivationPlacement.isFixture(o)).sort((a,b)=>a.y-b.y),clipOutside=()=>{ctx.beginPath();ctx.rect(0,0,W,H);for(const t of views)ctx.rect(screen.x+t.left*screen.zoom,screen.y+t.top*screen.zoom,t.surface.width*screen.zoom,t.surface.height*screen.zoom);ctx.clip('evenodd');};
  ctx.save();clipOutside();outside.filter(o=>o.y<=state.player.y).forEach(drawObject);ctx.restore();
  for(const t of views)ctx.drawImage(t.surface,screen.x+t.left*screen.zoom,screen.y+t.top*screen.zoom,t.surface.width*screen.zoom,t.surface.height*screen.zoom);
  lastMs=performance.now()-start;lastHero=drawHero();ctx.save();clipOutside();outside.filter(o=>o.y>state.player.y).forEach(drawObject);ctx.restore();FloorPlacement.draw();WallPlacement.draw();RoofPlacement.draw();BushTransplant.drawPreview();CultivationPlacement.drawPreview();ConstructionUI.update();EdgeMarkers.update();
 }
 let lastHero=null;
 render=function(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);drawGround();if(openWorld&&ready){worldFrame();return;}
  // Le cache contient les sprites proches avec leurs profondeurs ; les autres gardent le rendu du jeu.
  const set=new Set(sceneObjects().map(e=>e.o.id));
  const outside=state.objects.filter(o=>!o.trialFixture&&!CultivationPlacement.isFixture(o)&&!set.has(o.id)).sort((a,b)=>a.y-b.y);
  outside.filter(o=>o.y<=state.player.y).forEach(drawObject);draw();if(ready)lastHero=drawHero();outside.filter(o=>o.y>state.player.y).forEach(drawObject);if(ready){FloorPlacement.draw();WallPlacement.draw();RoofPlacement.draw();BushTransplant.drawPreview();CultivationPlacement.drawPreview();}
 };
 const originalEvents=initEvents;
 initEvents=function(){originalEvents();let start=null;
  MapControls.init();
  FloorPlacement.init(ConstructionTrial);
  WallPlacement.init(ConstructionTrial);
  RoofPlacement.init(ConstructionTrial);
  GameInterface.init();
  CultivationUI.init();
  BushTransplant.init(ConstructionTrial);
  CultivationPlacement.init(ConstructionTrial);
  EdgeMarkers.init(ConstructionTrial);
  ToolRecovery.init();
  InventoryUI.init();
  // Capture avant les actions génériques du jeu : le battant reste sa cible propre.
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||ui.placing)return;const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,p=doorAt(x,y);if(p){start={x:e.clientX,y:e.clientY,door:p};e.preventDefault();e.stopImmediatePropagation();canvas.setPointerCapture(e.pointerId);}},true);
  canvas.addEventListener('pointerup',e=>{if(!start)return;const q=start;start=null;e.stopImmediatePropagation();if(Math.hypot(e.clientX-q.x,e.clientY-q.y)<8){ui.auto=null;toggleDoor(q.door);}},true);
  canvas.addEventListener('pointercancel',()=>{start=null;},true);
  $('trialReturn').onclick=returnToDoor;
  $('trialTurn').onclick=()=>{FloorPlacement.stop();WallPlacement.stop();RoofPlacement.stop();if(state.constructionTrial.doorOutward){const [u,v]=state.constructionTrial.doorOutward;state.constructionTrial.doorOutward=[-v,u];}shell((rotation+1)%4,walls.find(w=>w.key==='porte').open);state.constructionTrial.rotation=rotation;fixture(state);refreshFloors();returnToDoor();toast('Maison tournée : '+rotation*90+'°.');};
 };
 const originalAssets=loadAssets;
 loadAssets=async function(){await originalAssets();BushTransplant.load();const sources={wood:'construction/bois-encre-v1.png',pan:'construction/pan-encre-v1.png'};
  for(const p of objects)sources[M.file(p)]='construction/sprites/'+M.file(p);
  for(let r=0;r<4;r++)sources['etabli-'+r*90+'.png']='construction/sprites/etabli-'+r*90+'.png';
  await Promise.all(Object.entries(sources).map(async([k,url])=>{const im=new Image();im.src=url;await im.decode();images[k]=im;}));
  walkLeft=document.createElement('canvas');walkLeft.width=IMAGES.walk1.width;walkLeft.height=IMAGES.walk1.height;const flip=walkLeft.getContext('2d');flip.translate(walkLeft.width,0);flip.scale(-1,1);flip.drawImage(IMAGES.walk1,0,0);
  for(const image of [IMAGES.right,IMAGES.left,IMAGES.back,IMAGES.walk1,walkLeft]){const measure=document.createElement('canvas');measure.width=image.width;measure.height=image.height;const mc=measure.getContext('2d');mc.drawImage(image,0,0);const pixels=mc.getImageData(0,0,measure.width,measure.height).data;let top=image.height,bottom=0;for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>20){top=Math.min(top,y);bottom=Math.max(bottom,y+1);}heroMetrics.set(image,{height:bottom-top,bottom});}
  Object.assign(images,await CultivationPlacement.load());refreshFloors();
  images.hero=IMAGES.person;const depths=await MeshOcclusion.unpack();occlusion=MeshOcclusion.create(context,G,M,depths);if(openWorld)tiles=ConstructionTiles.create({G,M,images,depths});
  ui.camera.zoom=W<650?.5:1;$('zoomValue').textContent=Math.round(ui.camera.zoom*100)+' %';ui.camera.y-=120/(ui.camera.zoom*.7);ready=true;
 };
 return {toWorld,toGrid,screenCamera,floors,walls,roofs,get objects(){return modelObjects();},refreshFloors,refreshWalls,refreshRoofs,interior,hiddenWalls,toggleDoor,doorAt,recoveryTargetAt,returnToDoor,navigation,heroPose,get frames(){return openWorld?tiles?.views||[]:[{surface,camera,last:occlusion?.last}];},get tileMetrics(){return tiles?.metrics;},get lastHero(){return lastHero;},get rotation(){return rotation;},get ready(){return ready;},get lastMs(){return lastMs;},get occlusion(){return occlusion;},surface,camera};
})();
window.constructionTrial=ConstructionTrial;
boot();

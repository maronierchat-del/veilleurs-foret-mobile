/* Raccordement des trois cultures aux modèles et profondeurs approuvés. */
'use strict';
const CultivationPlacement=(()=>{
 let api,rotation=0;const images={},M=ValidatedModel,G=LabGeometry;
 const supports=key=>['pepiniere','potager','champignonniere'].includes(key),isFixture=o=>o?.placed&&supports(o.type);
 function model(o){const q=api.toGrid(o.x,o.y),rot=Number.isInteger(o.rot)?((o.rot%4)+4)%4:0;return {key:o.type,u:q.u-.5,v:q.v-.5,rot,stage:o.type==='pepiniere'?(o.stage===2?'ouverte':'fermee'):M.specs[o.type].states[o.stage]||'vide',sourceId:o.id};}
 const models=()=>api?state.objects.filter(isFixture).map(model):[];
 // Réserver aussi les battants de la pépinière prête : la maturation ne doit
 // pas faire apparaître une porte au travers d'une installation voisine.
 const clearance=p=>M.polygons(p.key==='pepiniere'?{...p,stage:'ouverte'}:p,DoorGeometry);
 function snap(x,y){const q=api.toGrid(x,y);return api.toWorld(Math.floor(q.u)+.5,Math.floor(q.v)+.5);}
 function evaluate(x,y,key=ui.placing,rot=rotation){const p=snap(x,y),o={type:key,placed:true,stage:0,rot,...p},m=supports(key)?model(o):null;
  const fail=reason=>({valid:false,p,m,reason});
  if(!m)return fail('Objet non raccordé.');
  if(!hasTool('marteau'))return fail('Équipe le marteau pour poser cette installation.');
  if(!amount(key))return fail('Cet objet n’est plus dans le sac.');
  if(Math.hypot(p.x-state.player.x,p.y-state.player.y)>255)return fail('Approche-toi de cet emplacement.');
  const polys=clearance(m),player=api.toGrid(state.player.x,state.player.y);
  if(polys.some(poly=>poly.some(([u,v])=>{const w=api.toWorld(u,v);return w.x<90||w.y<90||w.x>WORLD.width-90||w.y>WORLD.height-90;})))return fail('Emplacement hors de la région accessible.');
  if(M.blocked([player.u,player.v],[{...m,stage:key==='pepiniere'?'ouverte':m.stage}],[],DoorGeometry,G))return fail('Le personnage occupe cet emplacement.');
  const wall=M.evaluate({...m,stage:key==='pepiniere'?'ouverte':m.stage},[],api.walls,DoorGeometry,G);if(!wall.valid)return fail(wall.reason);
  if(api.objects.some(other=>clearance(other).some(b=>polys.some(a=>M.overlap(a,b)))))return fail('Une installation ou ses portes occupe cet emplacement.');
  for(const other of state.objects){if(other.trialFixture||isFixture(other)||other.placed&&['sol','toit','chemin_terre','chemin_pierre'].includes(other.type))continue;
   if(BushTransplant.isFixture(other)){if(polys.some(poly=>M.overlap(poly,BushTransplant.footprint(other))))return fail('Une installation occupe cet emplacement.');continue;}
   const radius=other.type==='tree'?47:other.type==='rock'?42:other.type==='bush'?36:35;
   if(polys.some(poly=>{const world=poly.map(([u,v])=>{const w=api.toWorld(u,v);return [w.x,w.y];});return M.contains([other.x,other.y],world)||world.some((a,i)=>G.segmentDistance(other,{x:a[0],y:a[1]},{x:world[(i+1)%world.length][0],y:world[(i+1)%world.length][1]})<radius);}))return fail('Un objet ou une ressource occupe cet emplacement.');
  }
  return {valid:true,p,m,reason:'Emplacement libre.'};
 }
 function start(key){if(!amount(key))return toast('Cet objet n’est plus dans le sac.');FloorPlacement.stop();WallPlacement.stop();RoofPlacement.stop();ui.auto=null;ui.selection=null;drawSelection();ui.placing=key;rotation=0;ui.hover={x:state.player.x+120,y:state.player.y};closePanel();$('placementHelp').hidden=false;$('cultureTurn').hidden=false;label();}
 function label(){$('placementLabel').textContent=LABEL[ui.placing]+' · '+rotation*90+'°';}
 function turn(){if(!supports(ui.placing))return;rotation=(rotation+1)%4;label();}
 function apply(x,y){const key=ui.placing,r=evaluate(x,y);if(!r.valid){toast(r.reason);return false;}give(key,-1);state.objects.push({id:state.nextId++,type:key,placed:true,stage:0,rot:rotation,...r.p});sound('place');if(!amount(key))stopPlacing();commit();return true;}
 function bounds(o){return M.bounds(model(o),api.screenCamera(),G);}
 function drawPreview(){if(!supports(ui.placing)||!ui.hover||MapControls.active)return;const r=evaluate(ui.hover.x,ui.hover.y),b=M.bounds(r.m,api.screenCamera(),G);ctx.save();ctx.drawImage(images[M.file(r.m)],b.x,b.y,b.w,b.h);ctx.beginPath();M.rect(r.m).map(([u,v])=>G.project(u,v,api.screenCamera())).forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.strokeStyle=r.valid?'#c9f6aa':'#ff8276';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
 async function load(){await Promise.all(Object.keys(M.specs).filter(supports).flatMap(key=>M.specs[key].states.flatMap(stage=>[0,1,2,3].map(async rot=>{const file=M.file({key,stage,rot}),im=new Image();im.src='construction/sprites/'+file;await im.decode();images[file]=im;}))));return images;}
 function init(trial){api=trial;const button=document.createElement('button');button.id='cultureTurn';button.type='button';button.textContent='Tourner ↻';button.hidden=true;$('placementHelp').insertBefore(button,$('cancelPlacement'));button.onclick=turn;
  const oldStop=stopPlacing;stopPlacing=function(){button.hidden=true;oldStop();};
  const oldStart=BushTransplant.start;BushTransplant.start=function(key){button.hidden=true;return oldStart(key);};
  const oldRect=objectRect,oldPoint=placementPoint,oldPlace=tryPlace;
  objectRect=o=>isFixture(o)?bounds(o):oldRect(o);
  placementPoint=(key,x,y)=>supports(key)?snap(x,y):oldPoint(key,x,y);
  tryPlace=(x,y)=>supports(ui.placing)?apply(x,y):oldPlace(x,y);
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'&&supports(ui.placing)&&!e.repeat){e.preventDefault();turn();}});
 }
 return {init,load,supports,isFixture,model,models,clearance,start,evaluate,apply,drawPreview,bounds,get rotation(){return rotation;}};
})();

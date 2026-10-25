/* Plancher approuvé : stock réel consommé à la pose et restitué au retrait. */
'use strict';
const FloorPlacement=(()=>{
 const G=LabGeometry,zone={minU:-1,maxU:3,minV:4,maxV:6};
 let api,mode=null,hover=null,gesture=null,previewKey='';
 const inZone=p=>BuildingArea.cell(p)&&(!BuildingArea.tools||p.u>=zone.minU&&p.u<=zone.maxU&&p.v>=zone.minV&&p.v<=zone.maxV);
 const same=(a,b)=>a.u===b.u&&a.v===b.v;
 function sanitize(list){const seen=new Set();return (Array.isArray(list)?list:[]).filter(p=>{if(!BuildingArea.cell(p)||p.u>=0&&p.u<4&&p.v>=0&&p.v<4)return false;const key=p.u+':'+p.v;if(seen.has(key))return false;seen.add(key);return true;}).map(p=>({key:'sol',id:'sol-libre-'+p.u+':'+p.v,u:p.u,v:p.v}));}
 function evaluate(p,action=mode){if(!hasTool('marteau'))return {valid:false,reason:'Équipe le marteau depuis le sac, ou fabrique-le.'};if(!inZone(p))return {valid:false,reason:'Choisis une case libre dans la région.'};if(p.u>=0&&p.u<4&&p.v>=0&&p.v<4)return {valid:false,reason:'Le plancher de la maison existante est conservé.'};
  const found=state.constructionTrial.freeFloors.some(q=>same(p,q));
  if(action==='remove')return {valid:found,reason:found?'Retirer ce sol.':'Aucun sol ajouté sur cette case.'};
  if(action!=='add')return {valid:false,reason:'Choisis Poser ou Retirer.'};
  if(found)return {valid:false,reason:'Cette case possède déjà un sol.'};
  // Vérifier aussi les emprises des ressources du jeu, sans les déplacer.
  for(const o of state.objects){if(o.trialFixture||BushTransplant.isFixture(o)||CultivationPlacement.isFixture(o))continue;const q=api.toGrid(o.x,o.y);if(q.u>p.u-.25&&q.u<p.u+1.25&&q.v>p.v-.25&&q.v<p.v+1.25)return {valid:false,reason:'Un objet ou une ressource occupe cette case.'};}
  if(!amount('sol'))return {valid:false,reason:'Aucun sol disponible : fabrique un lot à l’établi.'};
  return {valid:true,reason:'Emplacement libre · 1 sol par case.'};
 }
 function preview(p){hover=p;const result=evaluate(p),key=JSON.stringify([mode,p?.u,p?.v,result.valid]);$('floorStatus').textContent=result.reason;
  if(key===previewKey)return result;previewKey=key;let floors=api.floors;
  if(result.valid)floors=mode==='add'?[...floors,{key:'sol',u:p.u,v:p.v}]:floors.filter(q=>!same(q,p));
  api.refreshFloors(floors);return result;
 }
 function apply(p,action=mode){const result=evaluate(p,action);if(!result.valid){toast(result.reason);return false;}const list=state.constructionTrial.freeFloors;
  if(action==='add'){give('sol',-1);list.push(...sanitize([p]));}else{list.splice(list.findIndex(q=>same(p,q)),1);give('sol',1);}updateHUD();
  api.floors.splice(16);api.floors.push(...list);previewKey='';hover=null;api.refreshFloors();saveNow();$('floorStatus').textContent=action==='add'?'Sol posé. Choisis une autre case.':'Sol retiré.';return true;
 }
 function stop(){mode=null;hover=null;gesture=null;previewKey='';if(api)api.refreshFloors();$('floorControls').hidden=true;}
 function start(action='add'){if(!api.ready)return;RoofPlacement.stop();WallPlacement.stop();stopPlacing();closePanel();ui.auto=null;ui.selection=null;drawSelection();mode=action;hover=null;gesture=null;previewKey='';$('floorControls').hidden=false;$('floorAdd').setAttribute('aria-pressed',String(action==='add'));$('floorRemove').setAttribute('aria-pressed',String(action==='remove'));$('floorStatus').textContent=hasTool('marteau')?'Touche une case du chantier. ':'Équipe le marteau depuis le sac, ou fabrique-le.';api.refreshFloors();}
 function cell(e){const r=canvas.getBoundingClientRect(),p=unproject(e.clientX-r.left,e.clientY-r.top),q=api.toGrid(p.x,p.y);return {u:Math.floor(q.u+1e-9),v:Math.floor(q.v+1e-9)};}
 function point(x,y,show=true){const r=canvas.getBoundingClientRect(),p=cell({clientX:x+r.left,clientY:y+r.top});if(show)preview(p);return ()=>{if(!show)preview(p);return apply(p);};}
 function clearPreview(){hover=null;gesture=null;previewKey='';if(api)api.refreshFloors();}
 function init(trial){api=trial;$('floorOpen').onclick=()=>start();$('floorAdd').onclick=()=>start('add');$('floorRemove').onclick=()=>start('remove');$('floorClose').onclick=stop;
  canvas.addEventListener('pointermove',e=>{if(mode)preview(cell(e));},true);
  canvas.addEventListener('pointerdown',e=>{if(!mode||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();gesture={id:e.pointerId};canvas.setPointerCapture(e.pointerId);preview(cell(e));},true);
  canvas.addEventListener('pointerup',e=>{if(!mode||gesture?.id!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const p=cell(e);gesture=null;apply(p);},true);
  canvas.addEventListener('pointercancel',()=>{gesture=null;hover=null;previewKey='';if(mode)api.refreshFloors();},true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode)stop();});
 }
 function draw(){if(!mode)return;ctx.save();const zone=BuildingArea.visible(),projectCell=(u,v)=>{const p=api.toWorld(u,v);return project(p.x,p.y);};
  for(let u=zone.minU;u<=zone.maxU;u++)for(let v=zone.minV;v<=zone.maxV;v++){const p={u,v};if(!BuildingArea.cell(p))continue;const chosen=hover&&same(p,hover),ok=chosen&&evaluate(p).valid;ctx.beginPath();[[u,v],[u+1,v],[u+1,v+1],[u,v+1]].forEach(([a,b],i)=>{const q=projectCell(a,b);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.strokeStyle=chosen?(ok?'#c2db83':'#e69178'):'#d8ce9c88';ctx.lineWidth=chosen?3:1;ctx.stroke();}
  ctx.restore();
 }
 return {init,start,stop,draw,point,clearPreview,sanitize,evaluate,preview,apply,zone,get mode(){return mode;}};
})();

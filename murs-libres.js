/* Arêtes et dessins approuvés ; stock par type, recettes existantes à l’établi. */
'use strict';
const WallPlacement=(()=>{
 const G=LabGeometry,M=ValidatedModel,kinds=new Set(['mur','fenetre','porte']);
 let api,mode=null,kind='mur',flipped=false,hover=null,gesture=null,previewKey='';
 const same=(a,b)=>a.u===b.u&&a.v===b.v;
 function cells(p){return p.rot===0?[{u:p.u,v:p.v-1},{u:p.u,v:p.v}]:[{u:p.u-1,v:p.v},{u:p.u,v:p.v}];}
 const inZone=p=>BuildingArea.edge(p)&&(!BuildingArea.tools||cells(p).some(c=>c.u>=FloorPlacement.zone.minU&&c.u<=FloorPlacement.zone.maxU&&c.v>=FloorPlacement.zone.minV&&c.v<=FloorPlacement.zone.maxV));
 const supported=(p,floors)=>cells(p).some(c=>floors.some(f=>same(c,f)));
 function sanitize(list,floors,fixed){const seen=new Set(fixed.map(G.edgeId));return (Array.isArray(list)?list:[]).filter(p=>{if(!p||!kinds.has(p.key)||!Number.isInteger(p.u)||!Number.isInteger(p.v)||![0,3].includes(p.rot)||!BuildingArea.edge(p))return false;const id=G.edgeId(p);if(seen.has(id))return false;seen.add(id);return true;}).map(p=>({id:'arete-libre-'+G.edgeId(p),key:p.key,u:p.u,v:p.v,rot:p.rot,...(p.key==='porte'?{hinge:p.hinge==='right'?'right':'left',open:p.open===true,outward:p.rot===0?[0,p.outward?.[1]===-1?-1:1]:[p.outward?.[0]===1?1:-1,0]}:{})}));}
 function candidate(edge){const p={...edge,key:kind,id:'arete-libre-'+G.edgeId(edge)};if(kind==='porte'){p.hinge=flipped?'right':'left';p.outward=HouseDoor.awayFrom(p,api.toGrid(state.player.x,state.player.y),G);p.open=false;}return p;}
 function evaluate(edge,action=mode){if(!hasTool('marteau'))return {valid:false,reason:'Équipe le marteau depuis le sac, ou fabrique-le.'};if(!edge||![0,3].includes(edge.rot)||!Number.isInteger(edge.u)||!Number.isInteger(edge.v))return {valid:false,reason:'Vise une arête de la grille.'};
  const id=G.edgeId(edge),fixed=api.walls.slice(0,BuildingArea.fixedCount).some(w=>G.edgeId(w)===id),found=state.constructionTrial.freeWalls.find(w=>G.edgeId(w)===id);
  if(fixed)return {valid:false,reason:'La maison témoin est conservée.'};
  if(action==='remove')return {valid:!!found,reason:found?'Retirer ce panneau.':'Aucun panneau ajouté sur ce bord.'};
  if(action!=='add'||!inZone(edge))return {valid:false,reason:'Choisis un bord de case dans la région.'};
  if(found)return {valid:false,reason:'Ce bord possède déjà un panneau. Retire-le pour le remplacer.'};
  const p=candidate(edge),player=api.toGrid(state.player.x,state.player.y);
  if(M.blocked([player.u,player.v],[],[p],DoorGeometry,G))return {valid:false,reason:'Le personnage bloque ce bord.'};
  const poly=M.wallPoly(p,G);
  if(api.objects.some(o=>!M.evaluate(o.key==='pepiniere'?{...o,stage:'ouverte'}:o,[],[p],DoorGeometry,G).valid)||api.walls.some(w=>w.key==='porte'&&w.open&&M.overlap(poly,HouseDoor.geometry(w,G).polygon)))return {valid:false,reason:'Un objet ou une porte ouverte bloque ce bord.'};
  for(const o of state.objects){if(o.trialFixture||CultivationPlacement.isFixture(o))continue;if(BushTransplant.isFixture(o)&&M.overlap(poly,BushTransplant.footprint(o)))return {valid:false,reason:'Une installation bloque ce bord.'};const q=api.toGrid(o.x,o.y);if(M.blocked([q.u,q.v],[],[p],DoorGeometry,G))return {valid:false,reason:'Une ressource ou un objet bloque ce bord.'};}
  if(!amount(kind))return {valid:false,reason:'Aucun élément disponible : fabrique un lot à l’établi.'};
  return {valid:true,reason:'Bord libre · 1 élément par panneau.'};
 }
 function preview(edge){hover=edge;const result=evaluate(edge),key=JSON.stringify([mode,kind,flipped,edge,result.valid]);$('wallStatus').textContent=result.reason;if(key===previewKey)return result;previewKey=key;
  let walls=api.walls;if(result.valid)walls=mode==='add'?[...walls,candidate(edge)]:walls.filter(w=>G.edgeId(w)!==G.edgeId(edge));api.refreshWalls(walls);return result;
 }
 function apply(edge,action=mode){const result=evaluate(edge,action);if(!result.valid){toast(result.reason);return false;}const list=state.constructionTrial.freeWalls;
  if(action==='add'){give(kind,-1);list.push(candidate(edge));}else{const removed=list.splice(list.findIndex(w=>G.edgeId(w)===G.edgeId(edge)),1)[0];give(removed.key,1);}updateHUD();
  api.walls.splice(BuildingArea.fixedCount);api.walls.push(...list);previewKey='';hover=null;gesture=null;ui.auto=null;api.refreshWalls();saveNow();$('wallStatus').textContent=action==='add'?'Panneau posé. Choisis un autre bord.':'Panneau retiré.';return true;
 }
 function stop(){mode=null;hover=null;gesture=null;previewKey='';if(api)api.refreshWalls();$('wallControls').hidden=true;}
 // Masquage local sur le groupe de sols où se trouve le personnage. La détection
 // de pièces closes et de bâtiments indépendants reste au jalon de généralisation.
 // Seuls les panneaux déjà posés sont concernés : le candidat d'aperçu reste opaque.
 function hidden(point,walls){const floors=[...state.constructionTrial.freeFloors,...(state.constructionTrial.freeRoofs||[])],start=floors.find(f=>f.u===Math.floor(point.u)&&f.v===Math.floor(point.v));if(!start)return [];const group=[start],seen=new Set([start.u+':'+start.v]);for(let i=0;i<group.length;i++)for(const f of floors){const p=group[i],key=f.u+':'+f.v;if(!seen.has(key)&&Math.abs(f.u-p.u)+Math.abs(f.v-p.v)===1){seen.add(key);group.push(f);}}return walls.slice(BuildingArea.fixedCount).filter(w=>api.walls.includes(w)&&supported(w,group)&&(w.rot===0?w.v>=point.v:w.u<=point.u));}
 function start(action='add',chosen=kind){if(!api.ready)return;if(kinds.has(chosen)){kind=chosen;$('wallKind').value=kind;}RoofPlacement.stop();FloorPlacement.stop();stopPlacing();closePanel();ui.auto=null;ui.selection=null;drawSelection();mode=action;hover=null;gesture=null;previewKey='';$('wallControls').hidden=false;$('wallAdd').setAttribute('aria-pressed',String(action==='add'));$('wallRemove').setAttribute('aria-pressed',String(action==='remove'));$('wallKind').disabled=action==='remove';$('wallFlip').hidden=action==='remove'||kind!=='porte';$('wallStatus').textContent='Vise une arête de la grille, avec ou sans sol. Marteau requis.';api.refreshWalls();if(action==='add')ConstructionUI.begin('wall');}
 function edgeAt(e){const r=canvas.getBoundingClientRect(),p=unproject(e.clientX-r.left,e.clientY-r.top),q=api.toGrid(p.x,p.y),s=G.project(q.u,q.v,{x:0,y:0,zoom:1});return G.nearestEdge(s.x,s.y,{x:0,y:0,zoom:1});}
 function point(x,y,show=true){const r=canvas.getBoundingClientRect(),p=edgeAt({clientX:x+r.left,clientY:y+r.top});if(show)preview(p);return ()=>{if(!show)preview(p);return apply(p);};}
 function clearPreview(){hover=null;gesture=null;previewKey='';if(api)api.refreshWalls();}
 function init(trial){api=trial;$('wallOpen').onclick=()=>start();$('wallAdd').onclick=()=>start('add');$('wallRemove').onclick=()=>start('remove');$('wallClose').onclick=stop;$('wallFloors').onclick=()=>FloorPlacement.start();
  $('wallKind').onchange=e=>{kind=e.target.value;flipped=false;$('wallFlip').setAttribute('aria-pressed','false');$('wallFlip').textContent='Gonds à gauche · changer';previewKey='';$('wallFlip').hidden=kind!=='porte';if(hover)preview(hover);};
  $('wallFlip').onclick=()=>{flipped=!flipped;$('wallFlip').setAttribute('aria-pressed',String(flipped));$('wallFlip').textContent=(flipped?'Gonds à droite':'Gonds à gauche')+' · changer';previewKey='';if(hover)preview(hover);};
  canvas.addEventListener('pointermove',e=>{if(mode)preview(edgeAt(e));},true);
  canvas.addEventListener('pointerdown',e=>{if(!mode||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();gesture={id:e.pointerId};canvas.setPointerCapture(e.pointerId);preview(edgeAt(e));},true);
  canvas.addEventListener('pointerup',e=>{if(!mode||gesture?.id!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();gesture=null;apply(edgeAt(e));},true);
  canvas.addEventListener('pointercancel',()=>{gesture=null;hover=null;previewKey='';if(mode)api.refreshWalls();},true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode)stop();});
 }
 function draw(){if(!mode)return;const edges=new Map(),zone=BuildingArea.visible(),grid=[];for(let u=zone.minU;u<=zone.maxU;u++)for(let v=zone.minV;v<=zone.maxV;v++)if(BuildingArea.cell({u,v}))grid.push({u,v});for(const p of grid)for(const rot of [0,1,2,3]){const a=G.ends({...p,rot}),w={u:Math.min(a[0][0],a[1][0]),v:Math.min(a[0][1],a[1][1]),rot:a[0][1]===a[1][1]?0:3};edges.set(G.edgeId(w),w);}if(hover)edges.set(G.edgeId(hover),hover);
  ctx.save();for(const p of edges.values()){const chosen=hover&&G.edgeId(p)===G.edgeId(hover),ok=chosen&&evaluate(p).valid;ctx.beginPath();G.ends(p).forEach(([u,v],i)=>{const w=api.toWorld(u,v),q=project(w.x,w.y);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=chosen?(ok?'#c2db83':'#e69178'):'#d8ce9c88';ctx.lineWidth=chosen?4:1;ctx.stroke();}if(kind==='porte'&&mode==='add'&&hover&&evaluate(hover).valid)drawHinge(candidate(hover));ctx.restore();
 }
 function drawHinge(p){const g=HouseDoor.geometry(p,G),w=api.toWorld(...g.hinge),q=project(w.x,w.y);ctx.fillStyle='#f3d58c';ctx.beginPath();ctx.arc(q.x,q.y,4,0,Math.PI*2);ctx.fill();}
 return {init,start,stop,draw,point,clearPreview,cells,sanitize,evaluate,preview,apply,hidden,get selection(){return {kind,flipped,target:hover};},get doorPreview(){return mode==='add'&&kind==='porte'&&hover?candidate(hover):null;},get mode(){return mode;}};
})();

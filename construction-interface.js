/* Catalogue et commandes de construction. Aucun état persistant propre à l'interface. */
'use strict';
const ConstructionUI=(()=>{
 const icons={
  sol:['sol',392,222,[9,9,384,213],[1.376,1.403,1.36]],
  mur:['mur',246,290,[9,9,237,282],[1.333,1.382,1.36]],
  fenetre:['mur-fenetre',1254,1254,[126,105,1131,1176],[1,1,.958]],
  porte:['mur-porte',1254,1254,[129,75,1152,1188],[.865,.870,.895]],
  toit:['toiture-generale',1536,1024,[78,156,1461,876],[1.019,1.026,.956]],
  pan:['pan',1536,1024,[144,63,1464,996],[.941,.960,1.066]],
  angle:['angle',1351,1164,[24,60,1326,1098],[1,.983,.956]],
  ridge:['faitage',1536,1024,[216,96,1392,915],[.988,.967,.942]],
  valley:['noue',1536,1024,[81,60,1446,966],[1,1.017,1.066]]
 };
 const names={sol:'Sol en bois',mur:'Mur en bois',fenetre:'Mur avec fenêtre',porte:'Mur avec porte',pan:'Pan de toit',angle:'Angle extérieur',ridge:'Faîtage',valley:'Angle rentrant'};
 let button,actions,api,lastKey='',ready=false;
 const tools=new URLSearchParams(location.search).has('outils');
 function image(key){
  if(tools)return null;
  const icon=icons[key];if(!icon)return null;
  const [name,w,h,[left,top,right,bottom]]=icon,bw=right-left,bh=bottom-top;
  // Surface apparente commune, sans étirement et sans les marges transparentes.
  const scale=Math.min(Math.sqrt(.72/(bw*bh)),.94/bw,.94/bh);
  return '<span class="construction-icon" aria-hidden="true"><svg viewBox="'+[left,top,bw,bh].join(' ')+'" style="width:'+bw*scale*100+'%;height:'+bh*scale*100+'%;filter:url(#construction-color-'+key+')"><image href="assets/construction-menu/'+name+'.png" width="'+w+'" height="'+h+'" /></svg></span>';
 }
 function catalogue(){
  const cards=[['floor','sol'],['wall','mur'],['wall','fenetre'],['wall','porte'],...['pan','angle','ridge','valley'].map(key=>['roof',key])];
  return '<div class="construction-stock">'+image('toit')+'<span>Éléments de toiture : <strong>'+amount('toit')+'</strong><small>Stock commun aux quatre formes</small></span></div><div class="construction-catalogue">'+cards.map(([layer,key])=>'<button type="button" class="construction-card" data-build-layer="'+layer+'" data-build-piece="'+key+'">'+image(key)+'<strong>'+names[key]+'</strong>'+(layer==='roof'?'':'<small>× '+amount(key)+'</small>')+'</button>').join('')+'</div>'+(!hasTool('marteau')?'<p>Équipe le marteau pour poser les éléments.</p>':'');
 }
 function start(layer,key){
  if(layer==='floor')FloorPlacement.start();
  else if(layer==='wall')WallPlacement.start('add',key);
  else {RoofPlacement.choose(key);RoofPlacement.start();}
 }
 function selection(){
  if(WallPlacement.mode==='add')return {layer:'wall',...WallPlacement.selection};
  if(RoofPlacement.mode==='add')return {layer:'roof',...RoofPlacement.selection};
  return null;
 }
 function anchor(selected){
  const p=selected.target;if(!p)return null;
  const screen=(u,v,z=0)=>{const world=api.toWorld(u,v),q=project(world.x,world.y);return {x:q.x,y:q.y-z*ui.camera.zoom};};
  let points;
  if(selected.layer==='wall')points=LabGeometry.ends(p).map(([u,v])=>screen(u,v));
  else {
   const solved=RoofPlacement.evaluate(p),piece=solved.p;
   if(!piece)return null;
   points=RoofModules.mesh(piece).flatMap(face=>face.points.map(q=>screen(q.u,q.v,q.z)));
  }
  return {x:(Math.min(...points.map(q=>q.x))+Math.max(...points.map(q=>q.x)))/2,y:Math.max(...points.map(q=>q.y))+9};
 }
 function begin(layer){
  if(tools||!ready)return;
  lastKey='';
  const x=W/2,y=H*.46;
  if(layer==='floor'){FloorPlacement.point(x,y);return;}
  const module=layer==='wall'?WallPlacement:RoofPlacement;
  module.point(x,y);
  // Donner un aperçu accessible dès l'ouverture, également sur écran tactile.
  if(!module.evaluate(module.selection.target).valid){
   const world=unproject(x,y+(layer==='roof'?RoofModules.SEAT*ui.camera.zoom:0)),q=api.toGrid(world.x,world.y);
   outer:for(let radius=0;radius<=4;radius++)for(let du=-radius;du<=radius;du++)for(let dv=-radius;dv<=radius;dv++){
    if(Math.max(Math.abs(du),Math.abs(dv))!==radius)continue;
    for(const rot of layer==='wall'?[0,3]:[0]){
     const p={u:Math.floor(q.u)+du,v:Math.floor(q.v)+dv,...(layer==='wall'?{rot}:{})};
     if(!module.evaluate(p).valid)continue;
     const pos=anchor({layer,target:p});if(!pos||pos.x<35||pos.x>W-35||pos.y<150||pos.y>H-240)continue;
     module.preview(p);break outer;
    }
   }
  }
  update();
 }
 function update(){
  if(!ready)return;
  const s=selection(),active=!!(FloorPlacement.mode||WallPlacement.mode||RoofPlacement.mode);
  document.body.classList.toggle('construction-active',active);
  const key=JSON.stringify([s,active,FloorPlacement.mode,WallPlacement.mode,RoofPlacement.mode,amount('sol'),amount('mur'),amount('fenetre'),amount('porte'),amount('toit'),hasTool('marteau'),ui.camera,W,H,MapControls.active,ui.open]);
  if(key===lastKey)return;lastKey=key;
  if(FloorPlacement.mode)$('floorControls').querySelector('strong').textContent='Sol en bois · × '+amount('sol');
  if(s?.layer==='wall')$('wallControls').querySelector('strong').textContent=names[s.kind]+' · × '+amount(s.kind);
  if(s?.layer==='roof')$('roofControls').querySelector('strong').textContent=names[s.kind];
  $('roofCraft').hidden=amount('toit')>0;
  actions.hidden=!active||ui.open;
  button.hidden=s?.layer!=='roof';
  $('wallFlip').hidden=s?.layer!=='wall'||s.kind!=='porte';
  if(!button.hidden){
   button.setAttribute('aria-label','Tourner '+names[s.kind]+' · '+s.rot*90+'°');
  }
 }
 function init(trial){
  if(tools)return;api=trial;
  const palette=document.createElementNS('http://www.w3.org/2000/svg','svg');palette.classList.add('construction-palette');palette.setAttribute('aria-hidden','true');
  palette.innerHTML='<defs>'+Object.entries(icons).map(([key,[,,,,[r,g,b]]])=>'<filter id="construction-color-'+key+'" color-interpolation-filters="sRGB"><feColorMatrix values="'+r+' 0 0 0 0 0 '+g+' 0 0 0 0 0 '+b+' 0 0 0 0 0 1 0" /></filter>').join('')+'</defs>';document.body.append(palette);
  actions=document.createElement('div');actions.id='constructionActions';actions.hidden=true;actions.setAttribute('role','group');actions.setAttribute('aria-label','Commandes de pose');
  button=document.createElement('button');button.type='button';button.id='constructionRotate';button.hidden=true;
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10a8 8 0 1 0-1.5 7M20 4v6h-6" /></svg>';
  button.addEventListener('pointerdown',e=>e.stopPropagation());button.onclick=e=>{e.stopPropagation();if(selection()?.layer!=='roof')return;RoofPlacement.rotate(1,true);lastKey='';update();};actions.append(button);
  const cancel=document.createElement('button');cancel.id='constructionCancel';cancel.type='button';cancel.setAttribute('aria-label','Quitter la pose');cancel.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>';
  cancel.onclick=()=>{FloorPlacement.stop();WallPlacement.stop();RoofPlacement.stop();lastKey='';update();};actions.append(cancel,$('wallFlip'));document.body.append(actions);
  const back=document.createElement('button');back.type='button';back.id='floorCatalogue';back.textContent='← Construire';back.onclick=()=>setTab('construction');$('floorControls').append(back);
  // Les actions sont des enfants directs pour conserver leur ordre tactile.
  for(const prefix of ['floor','wall','roof'])$(prefix+'Controls').append($(prefix+'Close'));
  ready=true;
 }
 return {image,catalogue,start,init,begin,update};
})();

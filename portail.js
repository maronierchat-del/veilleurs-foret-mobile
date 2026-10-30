/* Portail alpha 2 local : construction et présence au Refuge, voyages au jalon suivant. */
'use strict';
const PortalConstruction=(()=>{
 const key='portail',M=ValidatedModel,G=LabGeometry;let api;
 CRAFT[key]={name:'Portail',kind:'construction',materials:{bois:8,pierre:8,fibres:4},bench:false,spr:key};
 LABEL[key]='Portail';PATHS[key]='../../construction/portail-v12/icone.png';
 M.specs[key]={name:'Portail',states:[''],size:[1.5,.6],centered:true};
 const present=()=>state.objects.some(o=>o.placed&&o.type===key);
 function grantTestResources(){
  if(!MalleTrial.testScene||new URLSearchParams(location.search).get('ressources-portail')!=='1'||!state.expeditionPreparation||state.expeditionPreparation.testPortalResourcesGranted)return false;
  if(!saveNow())return false;
  const before=structuredClone(state),backup=SAVE_KEY+'.avant-ressources-portail-test-v1';
  try{const raw=localStorage.getItem(SAVE_KEY);if(localStorage.getItem(backup)===null){localStorage.setItem(backup,raw);if(localStorage.getItem(backup)!==raw)throw Error('Secours non enregistré.');}}
  catch{toast('Ressources non ajoutées : sauvegarde préalable indisponible.');return false;}
  give('bois',8);give('pierre',8);give('fibres',4);state.sport+=4;
  if(!amount('marteau'))give('marteau',1);
  if(!state.quickTools.includes('marteau'))state.quickTools.push('marteau');
  state.expeditionPreparation.testPortalResourcesGranted=true;
  if(!saveNow()){state=before;updateHUD();return false;}
  updateHUD();render();toast('Essai du portail : 8 bois, 8 pierres, 4 fibres et 4 énergie sportive ajoutés.');return true;
 }
 function transaction(change){
  if(!saveNow())return false;
  const before=structuredClone(state);
  change();
  if(!saveNow()){state=before;updateHUD();renderPanel();return false;}
  updateHUD();renderPanel();api.refreshFloors();render();return true;
 }
 function fabricate(){
  if(!hasTool('marteau')){toast('Équipe le marteau pour construire un portail.');return false;}
  if(!enough(CRAFT[key].materials)){toast('Matériaux insuffisants.');return false;}
  if(state.sport<4-Math.min(state.cul,2)){toast('Énergie insuffisante.');return false;}
  if(!transaction(()=>{pay(4);spendMaterials(CRAFT[key].materials);give(key,1);log('Fabrication : Portail');}))return false;
  CultivationPlacement.start(key);return true;
 }
 function place(x,y){
  const result=CultivationPlacement.evaluate(x,y,key,CultivationPlacement.rotation);
  if(!result.valid){toast(result.reason);return false;}
  if(!transaction(()=>{give(key,-1);state.objects.push({id:state.nextId++,type:key,placed:true,stage:0,rot:CultivationPlacement.rotation,...result.p});}))return false;
  if(!amount(key))stopPlacing();sound('place');return true;
 }
 async function loadDepths(){
  const response=await fetch('construction/portail-v12/profondeurs.json');if(!response.ok)throw Error('Profondeurs du portail indisponibles.');
  const atlas=await response.json(),maps={};
  for(const[file,raw]of Object.entries(atlas.maps)){const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));maps[file]=new Uint16Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());}
  return maps;
 }
 function init(trial){
  api=trial;
  const oldAssets=loadAssets;loadAssets=async()=>{await oldAssets();grantTestResources();};
  const oldCraft=craft;craft=k=>k===key?fabricate():oldCraft(k);
  const oldCanCraft=canCraft;canCraft=k=>k===key?hasTool('marteau')&&enough(CRAFT[key].materials)&&state.sport>=4-Math.min(state.cul,2):oldCanCraft(k);
  const oldPickup=pickup;pickup=o=>{
   if(o?.type!==key)return oldPickup(o);
   if(!state.objects.includes(o)||!o.placed)return false;
   if(!hasTool('marteau')){toast('Équipe le marteau pour récupérer le portail.');return false;}
   const ok=transaction(()=>{give(key,1);state.objects=state.objects.filter(v=>v.id!==o.id);});
   if(ok){ui.selection=null;if(ui.stationId===o.id){ui.stationId=null;closePanel();}drawSelection();}return ok;
  };
  const oldPanel=renderPanel;renderPanel=()=>{
   const o=state.objects.find(o=>o.id===ui.stationId&&o.placed&&o.type===key);
   if(ui.tab!=='installation'||!o)return oldPanel();
   $('panel').classList.remove('expedition-panel','craft-panel','kitchen-panel');if($('prepHeaderLegend'))$('prepHeaderLegend').hidden=true;
   $('panelTitle').textContent='Portail du Refuge';document.querySelector('.eyebrow').textContent='PORTAIL';
   $('panelBody').innerHTML='<p>Aucune autre zone reliée pour le moment.</p>';return;
  };
  const oldInteract=interactWith;interactWith=(o,kind='gather')=>{
   if(o?.type!==key||!['open','station'].includes(kind))return oldInteract(o,kind);
   if(Math.hypot(o.x-state.player.x,o.y-state.player.y)>115){ui.auto={x:o.x,y:o.y,id:o.id,action:kind};return;}
   dismissObjectMenu();ui.stationId=o.id;setTab('installation');
  };
 }
 return {init,present,fabricate,place,loadDepths,grantTestResources};
})();

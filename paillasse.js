/* Jalon paillasse : quatre orientations, fabrication et pose ; sommeil au jalon suivant. */
'use strict';
const PaillasseConstruction=(()=>{
 const key='paillasse',M=ValidatedModel;let api;
 CRAFT[key].bench=true;
 PATHS[key]='../../construction/paillasse-v3/icone.png';
 M.specs[key]={name:'Paillasse',states:[''],size:[1.3094894334807874,.6688000559806824],centered:true};
 const needsMigration=s=>s.objects.some(o=>o.placed&&o.type===key&&o.paillasseVersion!==1);
 function migrate(s){for(const o of s.objects)if(o.placed&&o.type===key){if(!Number.isInteger(o.rot))o.rot=0;o.paillasseVersion=1;}return s;}
 function grantTestResources(){
  const params=new URLSearchParams(location.search),cultures=params.get('ressources-cultures')==='1',marker=cultures?'nightTestResourcesGranted':'paillasseTestResourcesGranted';
  if(!MalleTrial.enabled||(!cultures&&params.get('ressources-paillasse')!=='1')||state[marker]===true)return false;
  if(!saveNow())return false;
  const before=structuredClone(state),backup=SAVE_KEY+(cultures?'.avant-ressources-cultures-test-v1':'.avant-ressources-paillasse-test-v1');
  try{const raw=localStorage.getItem(SAVE_KEY);if(localStorage.getItem(backup)===null){localStorage.setItem(backup,raw);if(localStorage.getItem(backup)!==raw)throw Error('Secours non enregistré.');}}
  catch{toast('Ressources non ajoutées : secours préalable indisponible.');return false;}
  const minimums=cultures?{bois:17,fibres:16,marteau:1,carotte:1,jeunes_plants:4,champignon:1}:{bois:4,fibres:6,marteau:1};
  for(const [item,minimum]of Object.entries(minimums))if(amount(item)<minimum)give(item,minimum-amount(item));
  state.sport=Math.max(state.sport,cultures?20:4);
  if(!state.quickTools.includes('marteau'))state.quickTools.push('marteau');
  state[marker]=true;
  if(!saveNow()){state=before;updateHUD();return false;}
  updateHUD();toast(cultures?'Maison de test : matériaux, plants et énergie prêts pour les trois cultures.':'Maison de test : marteau équipé, bois, fibres et énergie prêts pour la paillasse.');return true;
 }
 function transaction(change){
  if(!saveNow())return false;
  const before=structuredClone(state);change();
  if(!saveNow()){state=before;updateHUD();api.refreshFloors();render();return false;}
  updateHUD();renderPanel();api.refreshFloors();render();return true;
 }
 function fabricate(){
  if(!hasTool('marteau')){toast('Équipe le marteau pour fabriquer la paillasse.');return false;}
  if(!activeWorkbench()){toast('Approche-toi de ton établi pour fabriquer la paillasse.');return false;}
  if(!enough(CRAFT[key].materials)){toast('Matériaux insuffisants.');return false;}
  if(state.sport<4-Math.min(state.cul,2)){toast('Énergie insuffisante.');return false;}
  if(!transaction(()=>{pay(4);spendMaterials(CRAFT[key].materials);give(key,1);log('Fabrication : Paillasse');}))return false;
  CultivationPlacement.start(key);return true;
 }
 function place(x,y){
  const result=CultivationPlacement.evaluate(x,y,key,CultivationPlacement.rotation);
  if(!result.valid){toast(result.reason);return false;}
  if(!transaction(()=>{give(key,-1);state.objects.push({id:state.nextId++,type:key,placed:true,stage:0,rot:CultivationPlacement.rotation,paillasseVersion:1,...result.p});}))return false;
  if(!amount(key))stopPlacing();sound('place');return true;
 }
 async function loadDepths(){
  const response=await fetch('construction/paillasse-v3/profondeurs.json');if(!response.ok)throw Error('Profondeurs de la paillasse indisponibles.');
  const atlas=await response.json(),maps={};
  for(const[file,raw]of Object.entries(atlas.maps)){const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));maps[file]=new Uint16Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());}
  return maps;
 }
 function init(trial){
  api=trial;
  const oldAssets=loadAssets;loadAssets=async()=>{await oldAssets();grantTestResources();};
  const oldCraft=craft;craft=k=>k===key?fabricate():oldCraft(k);
  const oldCanCraft=canCraft;canCraft=k=>k===key?hasTool('marteau')&&!!viewedWorkbench()&&enough(CRAFT[key].materials)&&state.sport>=4-Math.min(state.cul,2):oldCanCraft(k);
  const oldPickup=pickup;pickup=o=>{
   if(o?.type!==key)return oldPickup(o);
   if(!state.objects.includes(o)||!o.placed)return false;
   if(!hasTool('marteau')){toast('Équipe le marteau pour récupérer la paillasse.');return false;}
   const ok=transaction(()=>{give(key,1);state.objects=state.objects.filter(v=>v.id!==o.id);});
   if(ok){ui.selection=null;if(ui.stationId===o.id){ui.stationId=null;closePanel();}drawSelection();}return ok;
  };
  const oldPanel=renderPanel;renderPanel=function(){
   const o=state.objects.find(o=>o.id===ui.stationId&&o.placed&&o.type===key);
   if(ui.tab!=='installation'||!o)return oldPanel();
   $('panel').classList.remove('expedition-panel','craft-panel','kitchen-panel');
   $('panelTitle').textContent='Paillasse';document.querySelector('.eyebrow').textContent='COUCHAGE';
   $('panelBody').innerHTML='<p>Paillasse rudimentaire. Le sommeil sera raccordé au prochain jalon, après validation de la pose.</p>';
  };
 }
 return {init,fabricate,place,loadDepths,needsMigration,migrate,grantTestResources};
})();

/* Table alpha 3 : fonctionnement accepté, visuel provisoire. */
'use strict';
const TableConstruction=(()=>{
 const key='table',M=ValidatedModel;let api;
 CRAFT[key].bench=true;
 M.specs[key]={name:'Table en bois',states:[''],size:[.8,.55],centered:true};
 function validate(s){
  if(Object.hasOwn(s,'tablePlacementVersion')&&s.tablePlacementVersion!==1)throw Error('Version de table incompatible.');
  for(const o of s.objects)if(Object.hasOwn(o,'tableVersion')&&(o.type!=='table'||!o.placed||o.tableVersion!==1))throw Error('Modèle de table incompatible.');
 }
 function migrate(s){validate(s);if(s.tablePlacementVersion===1)return false;s.tablePlacementVersion=1;return true;}
 function transaction(change){
  if(!saveNow())return false;
  const before=structuredClone(state);change();
  if(!saveNow()){state=before;updateHUD();api.refreshFloors();render();return false;}
  updateHUD();renderPanel();api.refreshFloors();render();return true;
 }
 function fabricate(){
  if(!hasTool('marteau'))return toast('Équipe le marteau pour fabriquer la table.');
  if(!activeWorkbench())return toast('Approche-toi de ton établi pour fabriquer la table.');
  if(!enough(CRAFT[key].materials))return toast('Matériaux insuffisants.');
  if(state.sport<4-Math.min(state.cul,2))return toast('Énergie insuffisante.');
  if(!transaction(()=>{pay(4);spendMaterials(CRAFT[key].materials);give(key,1);log('Fabrication : Table en bois');}))return false;
  CultivationPlacement.start(key);return true;
 }
 function place(x,y){
  const result=CultivationPlacement.evaluate(x,y,key,CultivationPlacement.rotation);
  if(!result.valid){toast(result.reason);return false;}
  if(!transaction(()=>{give(key,-1);state.objects.push({id:state.nextId++,type:key,placed:true,stage:0,rot:CultivationPlacement.rotation,tableVersion:1,...result.p});}))return false;
  if(!amount(key))stopPlacing();sound('place');return true;
 }
 async function loadDepths(){
  const response=await fetch('construction/table-v1/profondeurs.json');if(!response.ok)throw Error('Profondeurs de la table indisponibles.');
  const atlas=await response.json(),maps={};
  for(const[file,raw]of Object.entries(atlas.maps)){const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));maps[file]=new Uint16Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());}
  return maps;
 }
 function init(trial){
  api=trial;
  const oldCraft=craft;craft=k=>k===key?fabricate():oldCraft(k);
  const oldCanCraft=canCraft;canCraft=k=>k===key?hasTool('marteau')&&!!viewedWorkbench()&&enough(CRAFT[key].materials)&&state.sport>=4-Math.min(state.cul,2):oldCanCraft(k);
  const oldMenu=openObjectMenu;openObjectMenu=o=>{if(o?.type!==key)return oldMenu(o);closePanel();ui.selection=o.id;ui.stationId=null;ui.objectMenu=null;drawSelection();};
  const oldSelection=drawSelection;drawSelection=function(){oldSelection();const o=state.objects.find(o=>o.id===ui.selection);if(o?.type!==key||ToolRecovery.active)return;const el=$('selection');el.hidden=false;el.replaceChildren();const title=document.createElement('strong');title.className='resource-summary';title.textContent='Table en bois';el.append(title);};
  const oldPickup=pickup;pickup=o=>{
   if(o?.type!==key)return oldPickup(o);
   if(!state.objects.includes(o)||!o.placed)return false;
   if(!hasTool('marteau'))return toast('Équipe le marteau pour récupérer la table.');
   const ok=transaction(()=>{give(key,1);state.objects=state.objects.filter(v=>v.id!==o.id);});
   if(ok){ui.selection=null;drawSelection();}return ok;
  };
 }
 function equipTestHouse(){
  if(SAVE_KEY!=='veilleurs_alpha3_maison_test_v1'||state.tableTestHouseVersion===1)return;
  if(!saveNow())throw Error('Table de test : sauvegarde préalable impossible.');
  const raw=localStorage.getItem(SAVE_KEY),backup=SAVE_KEY+'.avant-table-maison-v1',before=structuredClone(state);
  try{
   if(localStorage.getItem(backup)===null){localStorage.setItem(backup,raw);if(localStorage.getItem(backup)!==raw)throw Error('Table de test : secours impossible.');}
   state.items.table=Math.max(amount(key),2);
   if(!state.objects.some(o=>o.type===key&&o.placed)){
    for(const [u,v]of [[2.5,2.5],[3.5,3.5],[2.5,3.5],[3.5,2.5],[4.5,4.5]]){
     const p=api.toWorld(u,v),r=CultivationPlacement.evaluate(p.x,p.y,key,0);
     if(r.valid){state.objects.push({id:state.nextId++,type:key,placed:true,stage:0,rot:0,tableVersion:1,...r.p});give(key,-1);break;}
    }
    // Si la maison est pleine, les exemplaires du sac restent prêts à poser.
   }
   state.tableTestHouseVersion=1;if(!saveNow())throw Error('Table de test : enregistrement impossible.');api.refreshFloors();updateHUD();
  }catch(error){state=before;throw error;}
 }
 const oldAssets=loadAssets;loadAssets=async()=>{await oldAssets();equipTestHouse();};
 return {init,fabricate,place,loadDepths,validate,migrate};
})();

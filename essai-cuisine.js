/* Lot demandé par la joueuse, uniquement dans sa maison test locale. */
'use strict';
(()=>{
 const original=loadAssets;
 loadAssets=async function(){
  await original();
  if(!new URLSearchParams(location.search).has('maison-test')||new URLSearchParams(location.search).get('ressources-cuisine')!=='1')return;
  const marker=SAVE_KEY+'.ressources-cuisine-test-v1',backup=SAVE_KEY+'.avant-ressources-cuisine-test-v1';
  if(localStorage.getItem(marker))return;
  if(!saveNow())return;
  const before=structuredClone(state);
  try{
   const raw=localStorage.getItem(SAVE_KEY);
   if(localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);
   if(!localStorage.getItem(backup))throw Error('Secours indisponible');
   for(const[k,n]of Object.entries({carotte:40,champignon:30,baies:40,bois:30,pierre:30,fibres:20}))give(k,n);
   state.sport+=60;
   if(!amount('marteau'))give('marteau',1);
   if(!state.quickTools.includes('marteau'))state.quickTools.push('marteau');
   if(!saveNow())throw Error('Enregistrement indisponible');
   localStorage.setItem(marker,'1');
   updateHUD();toast('Essai cuisine : ingrédients, matériaux et 60 énergie sportive ajoutés.');
  }catch{state=before;saveNow();updateHUD();toast('Lot cuisine non ajouté : enregistrement impossible.');}
 };
})();

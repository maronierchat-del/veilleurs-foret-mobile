/* Scène d'essai demandée : ajout unique, sauvegarde maison exclusivement. */
'use strict';
const EquippedTestHouse=(()=>{
 const enabled=new URLSearchParams(location.search).has('maison-test');
 const types=['paillasse','potager','pepiniere','champignonniere','feu','marmite','portail','arbuste'];
 const resources={bois:200,pierre:200,fibres:200,carotte:40,champignon:40,baies:40,jeunes_plants:40,arbuste:8};
 const positions={paillasse:[1.5,1.5],potager:[6.5,.5],pepiniere:[6.5,3.5],champignonniere:[6.5,6.5],feu:[-1.5,2.5],marmite:[-1.5,4.5],portail:[2.5,-2.5],arbuste:[3.5,6.5]};
 function setup(){
  if(!enabled||state.equippedTestHouseVersion===1)return false;
  if(SAVE_KEY!=='veilleurs_alpha3_maison_test_v1')throw Error('Maison équipée : sauvegarde de test requise.');
  if(!saveNow())throw Error('Maison équipée : sauvegarde préalable impossible.');
  const before=structuredClone(state),raw=localStorage.getItem(SAVE_KEY),backup=SAVE_KEY+'.avant-maison-equipee-v1';
  try{
   if(localStorage.getItem(backup)===null){localStorage.setItem(backup,raw);if(localStorage.getItem(backup)!==raw)throw Error('Secours non enregistré exactement.');}
   if(localStorage.getItem(backup)===null)throw Error('Secours non enregistré.');
   for(const [key,n]of Object.entries(resources))state.items[key]=Math.max(state.items[key]||0,n);
   for(const key of ['marteau','hache','pioche','pelle']){state.items[key]=Math.max(state.items[key]||0,1);if(!state.quickTools.includes(key))state.quickTools.push(key);}
   for(const key of Object.keys(FOOD))state.items[key]=Math.max(state.items[key]||0,20);
   for(const key of ['bloc_bois','bloc_toit'])state.items[key]=Math.max(state.items[key]||0,40);
   for(const key of ['etabli','malle',...types])state.items[key]=Math.max(state.items[key]||0,2);
   state.equippedTool=null;state.sport=Math.max(state.sport,1000);state.cul=Math.max(state.cul,100);
   for(const type of types){
    if(state.objects.some(o=>o.placed&&o.type===type))continue;
    const [u,v]=positions[type],offsets=[[0,0]];
    for(let r=1;r<=6;r++)for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++)if(Math.max(Math.abs(a),Math.abs(b))===r)offsets.push([a*2,b*2]);
    let selected;
    for(const [du,dv]of offsets){
     const p=ConstructionTrial.toWorld(u+du,v+dv);
     const result=['feu','marmite','arbuste'].includes(type)?BushTransplant.evaluate(p.x,p.y,type):CultivationPlacement.evaluate(p.x,p.y,type,0);
     if(result.valid){selected=result.p;break;}
    }
    if(!selected)throw Error('Aucun emplacement libre pour '+LABEL[type]);
    state.objects.push({id:state.nextId++,type,placed:true,stage:type==='arbuste'?3:0,rot:0,...selected,...(type==='paillasse'?{paillasseVersion:1}:{}),alpha3TestFixture:true});
   }
   state.equippedTestHouseVersion=1;
   if(!saveNow())throw Error('Enregistrement de la maison équipée impossible.');
   ConstructionTrial.refreshFloors();updateHUD();return true;
  }catch(error){state=before;updateHUD();throw error;}
 }
 const original=loadAssets;
 loadAssets=async function(){await original();setup();};
 return {enabled,setup,types,resources};
})();

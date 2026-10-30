/* Préparation locale : stocks transférés, restitution libre, aucune dépense de départ anticipée. */
'use strict';
const ExpeditionPrep=(()=>{
 const cost=200,cap=Math.floor(cost/2),enabled=MalleTrial.enabled;
 const empty=()=>({version:1,sport:0,meals:{}});
 const provisions={...FOOD,baies:{name:'Baies',cul:1}};
 const energy=p=>Object.entries(p.meals).reduce((sum,[key,n])=>sum+provisions[key].cul*n,0);
 // Reprise des seules réserves valides avec le tarif temporaire erroné à 5.
 function restoreMarmiteGains(s){
  const p=s?.expeditionPreparation,integer=n=>Number.isSafeInteger(n)&&n>=0;
  if(!p||p.version!==1||!integer(p.sport)||p.sport>cost||!p.meals||typeof p.meals!=='object'||Array.isArray(p.meals)||!s.items||typeof s.items!=='object')return false;
  if(Object.entries(p.meals).some(([k,n])=>!Object.hasOwn(provisions,k)||!integer(n)))return false;
  const oldEnergy=Object.entries(p.meals).reduce((sum,[k,n])=>sum+(k==='baies'?1:5)*n,0);
  if(oldEnergy>cap||p.sport+oldEnergy>cost)return false;
  const limit=Math.min(cap,cost-p.sport);if(energy(p)<=limit)return false;
  for(const key of ['ragout','soupe']){
   if(s.items[key]!==undefined&&!integer(s.items[key]))return false;
  }
  for(const key of ['ragout','soupe']){
   const returned=Math.min(p.meals[key]||0,Math.max(0,Math.ceil((energy(p)-limit)/10)));
   if(returned){p.meals[key]-=returned;if(!p.meals[key])delete p.meals[key];s.items[key]=(s.items[key]||0)+returned;}
  }
  return true;
 }
 function validate(s){
  if(!Object.hasOwn(s,'expeditionPreparation'))return;
  const p=s.expeditionPreparation,integer=n=>Number.isSafeInteger(n)&&n>=0;
  if(!p||p.version!==1||!integer(p.sport)||!p.meals||typeof p.meals!=='object'||Array.isArray(p.meals))throw Error('Préparation d’expédition incompatible.');
  if(Object.entries(p.meals).some(([key,n])=>!Object.hasOwn(provisions,key)||!integer(n)))throw Error('Provisions d’expédition invalides.');
  if(Object.hasOwn(p,'testMealsGranted')&&typeof p.testMealsGranted!=='boolean')throw Error('Marqueur de provisions test invalide.');
  if(Object.hasOwn(p,'testPortalResourcesGranted')&&typeof p.testPortalResourcesGranted!=='boolean')throw Error('Marqueur de ressources test invalide.');
  if(energy(p)>cap||p.sport+energy(p)>cost)throw Error('Énergie de préparation incompatible.');
 }
 const needsMigration=s=>enabled&&!Object.hasOwn(s,'expeditionPreparation');
 function migrate(s){if(needsMigration(s))s.expeditionPreparation=empty();return s;}
 function summary(p=state.expeditionPreparation){const meals=energy(p);return {cost,cap,meals,sport:p.sport,total:p.sport+meals,missing:cost-p.sport-meals,ready:p.sport+meals===cost};}
 function change(action,key,quantity){
  if(!enabled||!state.expeditionPreparation)return false;
  const object=state.objects.find(o=>o.id===ui.stationId&&MalleTrial.isFixture(o));if(!object)return false;
  if(!Number.isSafeInteger(quantity)||quantity<=0)return false;
  const old={sport:state.sport,items:{...state.items},preparation:structuredClone(state.expeditionPreparation)},p=state.expeditionPreparation,s=summary();
  if(action==='deposit'){
   if(!Object.hasOwn(provisions,key)||amount(key)<quantity)return false;
   const gain=provisions[key].cul*quantity;
   if(s.meals+gain>cap||s.total+gain>cost){toast('Retirez de l’énergie si nécessaire : les repas peuvent couvrir au plus 100 points.');return false;}
   give(key,-quantity);p.meals[key]=(p.meals[key]||0)+quantity;
  }else if(action==='withdraw'){
   if(!Object.hasOwn(provisions,key)||(p.meals[key]||0)<quantity)return false;
   p.meals[key]-=quantity;if(!p.meals[key])delete p.meals[key];give(key,quantity);
  }else if(action==='reserve'){
   if(state.sport<quantity||s.total+quantity>cost)return false;
   state.sport-=quantity;p.sport+=quantity;
  }else if(action==='release'){
   if(p.sport<quantity)return false;p.sport-=quantity;state.sport+=quantity;
  }else return false;
  if(!saveNow()){state.sport=old.sport;state.items=old.items;state.expeditionPreparation=old.preparation;updateHUD();renderPanel();return false;}
  updateHUD();renderPanel();return true;
 }
 function supplyTestMeals(){
  if(!enabled||!state.expeditionPreparation||state.expeditionPreparation.testMealsGranted)return false;
  if(!saveNow())return false;
  try{const key=SAVE_KEY+'.avant-plats-test-v1',raw=localStorage.getItem(SAVE_KEY);if(localStorage.getItem(key)===null){localStorage.setItem(key,raw);if(localStorage.getItem(key)!==raw)throw Error('Secours non enregistré.');}}catch{toast('Les plats n’ont pas été ajoutés : secours indisponible.');return false;}
  const items={...state.items},previous=structuredClone(state.expeditionPreparation);
  for(const key of Object.keys(FOOD))give(key,10);
  state.expeditionPreparation.testMealsGranted=true;
  if(!saveNow()){state.items=items;state.expeditionPreparation=previous;return false;}
  updateHUD();renderPanel();toast('40 portions ajoutées au sac pour les essais.');return true;
 }
 const bolt=()=>'<svg class="energy-symbol" role="img" aria-label="énergie"><use href="#energy-bolt" /></svg>';
 function header(){
  const s=summary();
  $('panelTitle').innerHTML=`<span class="prep-progress" role="progressbar" aria-label="Préparation : ${s.sport} sportifs et ${s.meals} culinaires sur ${cost}" aria-valuemin="0" aria-valuemax="${cost}" aria-valuenow="${s.total}"><span data-prep-bar="sport" style="width:${s.sport/cost*100}%"></span><span data-prep-bar="meals" style="width:${s.meals/cost*100}%"></span></span>`;
  let legend=$('prepHeaderLegend');if(!legend){legend=document.createElement('div');legend.id='prepHeaderLegend';document.querySelector('#panel .panel-top').after(legend);}
  legend.hidden=false;legend.innerHTML=`<span class="prep-sport">Sportive : ${s.sport}</span> · <span class="prep-meals">Culinaire : ${s.meals}</span> <span class="prep-required">/ ${cost} ${bolt()} nécessaires</span>`;
 }
 function stepper(minus,plus,value,label,key='',minusDisabled=false,plusDisabled=false){return `<div class="prep-stepper"><button type="button" data-prep="${minus}" data-key="${key}" aria-label="Retirer ${label}" ${minusDisabled?'disabled':''}>−</button><output aria-label="${label} dans la malle">${value}</output><button type="button" data-prep="${plus}" data-key="${key}" aria-label="Ajouter ${label}" ${plusDisabled?'disabled':''}>+</button></div>`;}
 function panel(){
  const p=state.expeditionPreparation,s=summary();
  const rows=Object.entries(provisions).filter(([key])=>key==='baies'||amount(key)||(p.meals[key]||0)).map(([key,r])=>`<div class="prep-meal">${rowImage(key)}<div class="prep-food-label"><strong>${r.name}</strong><small>Sac : ${amount(key)} · ${r.cul} ${bolt()}</small></div>${stepper('withdraw','deposit',p.meals[key]||0,r.name,key,!p.meals[key],!amount(key)||s.meals+r.cul>cap||s.total+r.cul>cost)}</div>`).join('');
  const sports=[[-10,'release'],[-1,'release'],[1,'reserve'],[10,'reserve']].map(([delta,action])=>{const n=Math.abs(delta),disabled=delta<0?s.sport<n:state.sport<n||s.total+n>cost;return `<button type="button" data-prep="${action}" data-quantity="${n}" aria-label="${delta<0?'Retirer':'Ajouter'} ${n} énergie sportive" ${disabled?'disabled':''}>${delta<0?'−':'+'}${n}</button>`;}).join('');
  return `<div class="prep-sport-row"><strong>Énergie sportive</strong><div class="prep-stepper prep-sport-buttons">${sports}</div></div><h3>Repas</h3>${p.testMealsGranted?'':'<button class="btn full secondary" data-prep-test-meals>Ajouter les plats pour les essais</button>'}${rows}<button class="btn full prep-depart" disabled>Partir en expédition</button><p class="soft">${PortalConstruction.present()?'Portail du Refuge construit.':'Construisez un portail dans le Refuge avant le départ.'}</p><p class="soft">Première expédition : départ indisponible pour le moment.</p>`;
 }
 document.addEventListener('click',e=>{const button=e.target.closest('[data-prep]');if(!button)return;change(button.dataset.prep,button.dataset.key,Number(button.dataset.quantity||1));});
 if(enabled){const base=newState;newState=()=>{const s=base();s.expeditionPreparation=empty();return s;};}
 document.addEventListener('click',e=>{if(e.target.closest('[data-prep-test-meals]'))supplyTestMeals();});
 return {cost,cap,validate,needsMigration,migrate,restoreMarmiteGains,summary,change,panel,header,supplyTestMeals};
})();

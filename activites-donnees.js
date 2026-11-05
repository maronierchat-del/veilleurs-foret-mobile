/* Suivi daté sport/PAI ; aucun gain passé n'est recalculé lors de la transition. */
'use strict';
const ActivityData=(()=>{
 const legacyModes={pls:5,tres_doux:10,doux:15,normal:30,sportif:60};
 const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const today=()=>dateKey(new Date());
 function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;}
 function fresh(){return {version:1,startDate:today(),nextId:1,entries:[]};}
 function migrate(s){
  if(Object.hasOwn(s,'activityTracking'))return false;
  s.activityTracking=fresh();s.remainders={normal:0,malade:0,pls:0};
  // Les anciens modes retirés n'ont pas d'équivalent implicite : retour au mode Normal.
  if(!Object.hasOwn(MODES,s.mode))s.mode='normal';
  return true;
 }
 function validate(s){
  if(!Object.hasOwn(s,'activityTracking'))return;
  const a=s.activityTracking,fail=message=>{throw Error('Suivi d’activité incompatible : '+message);};
  if(!a||a.version!==1||!validDate(a.startDate)||!Number.isSafeInteger(a.nextId)||a.nextId<1||!Array.isArray(a.entries))fail('format inconnu.');
  const ids=new Set();let maxId=0;
  for(const e of a.entries){
   if(!e||!Number.isSafeInteger(e.id)||e.id<1||ids.has(e.id)||!validDate(e.date)||e.date<a.startDate||!Object.hasOwn(MODES,e.mode)||!Number.isSafeInteger(e.seconds)||e.seconds<1||e.seconds>6000059||!Number.isSafeInteger(e.gain)||e.gain<0||e.gain>Math.ceil(e.seconds/MODES[e.mode]))fail('saisie invalide.');
   ids.add(e.id);maxId=Math.max(maxId,e.id);
  }
  if(a.nextId<=maxId)fail('identifiant invalide.');
  if(Object.keys(s.remainders).length!==3||Object.keys(MODES).some(k=>!Object.hasOwn(s.remainders,k)))fail('compteurs incomplets.');
 }
 const originalNewState=newState;
 newState=function(){const s=originalNewState();s.activityTracking=fresh();return s;};
 function record(seconds){
  if(!Number.isSafeInteger(seconds)||seconds<1||seconds>6000059)return false;
  const before={sport:state.sport,remainders:{...state.remainders},history:[...state.history],tracking:structuredClone(state.activityTracking)},mode=state.mode,total=seconds+state.remainders[mode],gain=Math.floor(total/MODES[mode]);
  state.remainders[mode]=total%MODES[mode];state.sport+=gain;
  const a=state.activityTracking;a.entries.push({id:a.nextId++,date:today(),mode,seconds,gain});
  log(`Sport : ${Math.floor(seconds/60)} min ${seconds%60} s, +${gain} points (${mode})`);
  if(!saveNow()){state.sport=before.sport;state.remainders=before.remainders;state.history=before.history;state.activityTracking=before.tracking;updateHUD();return false;}
  updateHUD();toast(`+${gain} énergie sportive · ${state.remainders[mode]} s conservées.`);return true;
 }
 return {legacyModes,dateKey,today,validDate,migrate,validate,record};
})();

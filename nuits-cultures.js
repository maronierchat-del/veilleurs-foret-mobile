/* Une étape par nuit ; conversion des anciens délais avec secours piloté par SaveContinuity. */
'use strict';
const NightGrowth=(()=>{
 const crops=new Set(['pepiniere','potager','champignonniere','arbuste']);let api;
 const fraction=(remaining,total)=>Math.max(0,Math.min(1,1-remaining/total));
 const growing=o=>o.placed&&(o.type==='arbuste'?o.stage===1||o.stage===2:crops.has(o.type)&&o.stage===1&&(o.type!=='champignonniere'||o.seeded));
 const needsMigration=s=>!Object.hasOwn(s,'nightCycle');
 function validate(s){
  if(!Object.hasOwn(s,'nightCycle'))return;
  const n=s.nightCycle;if(!n||n.version!==1||!Number.isSafeInteger(n.nights)||n.nights<0)throw Error('Cycle nocturne incompatible.');
  for(const o of [...s.objects,...(s.respawnQueue||[])]){
   if(Object.hasOwn(o,'nightProgress')&&(!Number.isFinite(o.nightProgress)||o.nightProgress<0||o.nightProgress>1))throw Error('Avancement nocturne invalide.');
   if(Object.hasOwn(o,'legacyOverdue')&&typeof o.legacyOverdue!=='boolean')throw Error('Repousse héritée invalide.');
  }
 }
 function migrate(s,now=Date.now()){
  if(!needsMigration(s))return s;
  s.nightCycle={version:1,nights:0};
  for(const o of s.objects){
   if(growing(o)){
    if(o.readyAt&&o.readyAt<=now){o.stage=o.type==='arbuste'?3:2;o.nightProgress=0;}
    else if(o.type==='arbuste'){
     const step=TEST_HOURS.arbuste*HOUR;
     if(o.stage===1&&o.readyAt&&now>=o.readyAt-step)o.stage=2;
     const total=o.stage===1?TEST_HOURS.arbusteFirst*HOUR:step;
     o.nightProgress=o.readyAt?fraction(o.readyAt-now-(o.stage===1?step:0),o.stage===1?total-step:total):0;
    }else o.nightProgress=o.readyAt?fraction(o.readyAt-now,TEST_HOURS[o.type]*HOUR):0;
    o.readyAt=null;
   }else if(o.placed&&crops.has(o.type)&&Object.hasOwn(o,'readyAt'))o.readyAt=null;
   if(!o.placed&&o.type==='bush'&&o.harvested){
    if(o.readyAt&&o.readyAt<=now)o.harvested=false;
    o.nightProgress=o.harvested&&o.readyAt?fraction(o.readyAt-now,TEST_HOURS.wildBush*HOUR):0;o.readyAt=null;
   }
  }
  for(const q of s.respawnQueue){q.legacyOverdue=q.at<=now;q.nightProgress=fraction(q.at-now,(TEST_RESPAWN_HOURS[q.type]||8)*HOUR);}
  return s;
 }
 function refresh(){updateHUD();if(api?.ready){api.refreshFloors();drawSelection();if(ui.open)renderPanel();render();}}
 function transaction(change){
  if(!saveNow())return false;
  const before=structuredClone(state);
  try{change();if(!saveNow()){state=before;refresh();return false;}}
  catch(error){state=before;refresh();toast('Nuit non enregistrée : '+error.message);return false;}
  refresh();return true;
 }
 function restore(entries){
  const restored=new Set();
  for(const q of entries){
   if(state.objects.length>=99999)break;
   const blocked=(x,y)=>{if(protectedSpot(x,y))return true;if(api&&BuildingArea.fixedCount){const grid=api.toGrid(x,y);if(grid.u>-.8&&grid.u<4.8&&grid.v>-.8&&grid.v<5.5)return true;}return false;};
   let p=findRegrowthPosition(q);if(p&&blocked(p.x,p.y))p=null;
   // Une recherche aléatoire courte ne doit pas manquer un emplacement libre connu.
   if(!p&&!blocked(q.x,q.y)&&naturalPositionOK(q.type,q.x,q.y,state.objects,state.player,true))p={x:q.x,y:q.y};
   if(!p){
    const columns=Math.floor((WORLD.width-300)/40)+1,rows=Math.floor((WORLD.height-320)/40)+1,total=columns*rows;
    const start=(state.nextId*17+Math.round(q.x)+Math.round(q.y))%total;
    for(let i=0;i<total;i++){const cell=(start+i)%total,x=150+(cell%columns)*40,y=160+Math.floor(cell/columns)*40;if(!blocked(x,y)&&naturalPositionOK(q.type,x,y,state.objects,state.player,true)){p={x,y};break;}}
   }
   if(p){state.objects.push({id:state.nextId++,type:q.type,x:p.x,y:p.y,placed:false});restored.add(q);}
   else q.attempt=(q.attempt||0)+1;
  }
  state.respawnQueue=state.respawnQueue.filter(q=>!restored.has(q));
 }
 function settleOverdue(){
  const due=state.respawnQueue.filter(q=>q.legacyOverdue);
  if(!due.length)return true;
  return transaction(()=>restore(due));
 }
 function sleep(point){
  if(!state.nightCycle||state.nightCycle.nights>=Number.MAX_SAFE_INTEGER)return false;
  return transaction(()=>{
   if(point){if(!canWalk(point.x,point.y))throw Error('Emplacement de réveil occupé.');Object.assign(state.player,point);}
   state.nightCycle.nights++;
   for(const o of state.objects){
    if(growing(o)){o.stage=o.type==='arbuste'?o.stage+1:2;o.readyAt=null;if(!growing(o))o.nightProgress=0;}
    else if(!o.placed&&o.type==='bush'&&o.harvested){o.harvested=false;o.readyAt=null;o.nightProgress=0;}
   }
   const types=new Map(),eligible=[];for(const q of state.respawnQueue){if(q.legacyOverdue){eligible.push(q);continue;}if(!types.has(q.type))types.set(q.type,[]);types.get(q.type).push(q);}
   for(const entries of types.values())eligible.push(...entries.slice(0,Math.ceil(entries.length/2)));
   restore(eligible);
  });
 }
 function label(o){return o?.type==='arbuste'&&o.stage===1?'Adulte après une nuit · baies après deux nuits':o?.type==='arbuste'||o?.type==='bush'?'Baies après une nuit':'Prêt après une nuit';}
 function init(trial){
  api=trial;
  const oldAssets=loadAssets;loadAssets=async()=>{await oldAssets();if(!settleOverdue())throw Error('La reprise des repousses précédentes n’a pas pu être enregistrée.');};
 }
 return {init,validate,needsMigration,migrate,sleep,label,growing};
})();
const stateBeforeNights=newState;
newState=function(){const s=stateBeforeNights();s.nightCycle={version:1,nights:0};return s;};
nextReady=function(o){o.readyAt=null;o.nightProgress=0;};
scheduledReplacement=function(type,origin){state.respawnQueue.push({type,x:origin.x,y:origin.y,at:0,attempt:0,nightProgress:0,legacyOverdue:false});};
updateNatureAndCrops=function(){/* L'horloge réelle ne fait plus avancer la nature. */};
timeRemaining=function(){return 'Prochaine étape : après une nuit.';};

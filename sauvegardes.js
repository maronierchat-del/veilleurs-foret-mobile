/* Continuité du laboratoire : format identifié, migrations et écritures protégées.
   La clé historique reste stable ; aucune clé du jeu principal n'est lue. */
'use strict';
const SaveContinuity=(()=>{
 const APPLICATION='veilleurs-construction-etape1',FORMAT=2,LIMIT=12000000;
 const migrationKey=SAVE_KEY+'.avant-migration-v1',importKey=SAVE_KEY+'.avant-import',worldKey=SAVE_KEY+'.avant-monde-libre-v1';
 let expectedRaw=null,loaded=false,prepare,activate,lastError='',importing=false;
 const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const own=(o,k)=>Object.hasOwn(o,k);
 const requireValue=(ok,message)=>{if(!ok)throw Error(message);};
 const nonnegative=n=>Number.isFinite(n)&&n>=0;
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 function safeTree(value,depth=0){
  requireValue(depth<40,'Données trop imbriquées.');
  if(typeof value==='number')requireValue(Number.isFinite(value),'Nombre invalide.');
  if(value&&typeof value==='object')for(const [key,child]of Object.entries(value)){
   requireValue(!['__proto__','prototype','constructor'].includes(key),'Clé de données interdite.');safeTree(child,depth+1);
  }
 }
 function inventory(items){
  requireValue(record(items),'Inventaire manquant.');
  for(const [key,n]of Object.entries(items))requireValue(own(LABEL,key)&&integer(n),'Objet ou quantité d’inventaire incompatible.');
 }
 function validate(s){
  requireValue(record(s)&&s.version===1,'Version des données de jeu incompatible.');safeTree(s);
  if(own(s,'nettlesVersion'))requireValue(s.nettlesVersion===1,'Version des massifs d’orties incompatible.');
  for(const key of ['settlementVersion','landscapeVersion'])if(own(s,key))requireValue(s[key]===1,'Version de la carte incompatible.');
  requireValue(record(s.player)&&Number.isFinite(s.player.x)&&Number.isFinite(s.player.y),'Position du personnage invalide.');
  requireValue(['person','right','left','back'].includes(s.player.face),'Orientation du personnage invalide.');
  requireValue(nonnegative(s.sport)&&nonnegative(s.cul),'Réserves d’énergie invalides.');
  requireValue(own(MODES,s.mode),'Difficulté inconnue.');inventory(s.items);
  requireValue(record(s.remainders)&&record(s.cardioDays),'Activités incomplètes.');
  for(const [k,n]of Object.entries(s.remainders))requireValue(own(MODES,k)&&integer(n)&&n<MODES[k],'Secondes reportées invalides.');
  for(const [day,n]of Object.entries(s.cardioDays))requireValue(/^\d{4}-\d{2}-\d{2}$/.test(day)&&integer(n),'Points cardio invalides.');
  requireValue(Array.isArray(s.history)&&s.history.every(v=>typeof v==='string'),'Historique invalide.');
  requireValue(Array.isArray(s.objects)&&s.objects.length<100000,'Liste des objets invalide.');
  const ids=new Set();let maxId=0,benches=0;
  for(const o of s.objects){
   requireValue(record(o)&&Number.isSafeInteger(o.id)&&o.id>0&&!ids.has(o.id),'Identifiants d’objets invalides ou répétés.');ids.add(o.id);maxId=Math.max(maxId,o.id);
   requireValue(Number.isFinite(o.x)&&Number.isFinite(o.y)&&typeof o.placed==='boolean','Position d’objet invalide.');
   requireValue(o.placed?(o.type==='arbuste'||own(CRAFT,o.type)&&CRAFT[o.type].kind!=='outil'):own(COLLECT,o.type),'Type d’objet incompatible.');
   if(own(o,'rot'))requireValue([0,1,2,3].includes(o.rot),'Rotation d’installation invalide.');
   if(own(o,'readyAt'))requireValue(o.readyAt===null||nonnegative(o.readyAt),'Échéance de culture invalide.');
   if(['pepiniere','potager','champignonniere','arbuste'].includes(o.type))requireValue(integer(o.stage)&&o.stage<=(o.type==='arbuste'?3:2),'Stade de culture invalide.');
   if(own(o,'seeded'))requireValue(typeof o.seeded==='boolean','Ensemencement invalide.');
   if(o.type==='champignonniere')requireValue(o.seeded===true||o.stage===0,'Champignonnière active sans ensemencement.');
   if(own(o,'harvested'))requireValue(typeof o.harvested==='boolean','État de récolte invalide.');
   if(own(o,'contents'))inventory(o.contents);
   if(own(o,'trialFixture')){requireValue(o.trialFixture==='bench'&&o.type==='etabli'&&o.placed,'Témoin du laboratoire invalide.');benches++;}
  }
  requireValue(benches<=1&&Number.isSafeInteger(s.nextId)&&s.nextId>maxId,'Prochain identifiant invalide.');
  if(own(s,'quickTools'))requireValue(Array.isArray(s.quickTools)&&new Set(s.quickTools).size===s.quickTools.length&&s.quickTools.every(k=>own(CRAFT,k)&&CRAFT[k].kind==='outil'&&k!=='sac'&&s.items[k]>0),'Équipement invalide.');
  if(own(s,'audio'))requireValue(record(s.audio)&&typeof s.audio.music==='boolean'&&typeof s.audio.sfx==='boolean','Réglages audio invalides.');
  for(const key of ['natureLayoutVersion','cropTimeVersion','constructionGridVersion'])if(own(s,key))requireValue(integer(s[key])&&s[key]<=2,'Version de sous-système incompatible.');
  if(own(s,'respawnQueue')){
   requireValue(Array.isArray(s.respawnQueue),'Repousses sauvages invalides.');
   for(const q of s.respawnQueue)requireValue(record(q)&&own(COLLECT,q.type)&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&nonnegative(q.at)&&(!own(q,'attempt')||integer(q.attempt)),'Échéance sauvage invalide.');
  }
  const t=s.constructionTrial;
  requireValue(record(t)&&t.version===1&&[0,1,2,3].includes(t.rotation)&&typeof t.doorOpen==='boolean','Cette sauvegarde ne provient pas du laboratoire compatible.');
  if(own(t,'doorOutward'))requireValue(Array.isArray(t.doorOutward)&&t.doorOutward.length===2&&t.doorOutward.every(Number.isInteger)&&Math.abs(t.doorOutward[0])+Math.abs(t.doorOutward[1])===1,'Sens de porte invalide.');
  for(const key of ['freeFloors','freeWalls','freeRoofs'])if(own(t,key))requireValue(Array.isArray(t[key])&&t[key].length<100000,'Constructions invalides.');
  for(const p of t.freeWalls||[])if(p?.key==='porte'){
   if(own(p,'hinge'))requireValue(['left','right'].includes(p.hinge),'Gonds invalides.');
   if(own(p,'open'))requireValue(typeof p.open==='boolean','État de porte invalide.');
   if(own(p,'outward'))requireValue(Array.isArray(p.outward)&&p.outward.length===2&&(p.rot===0?p.outward[0]===0&&[-1,1].includes(p.outward[1]):p.outward[1]===0&&[-1,1].includes(p.outward[0])),'Sens de battant invalide.');
  }
  return s;
 }
 function decode(raw){
  requireValue(typeof raw==='string'&&new Blob([raw]).size<=LIMIT,'Fichier trop volumineux ou vide.');
  let input;try{input=JSON.parse(raw);}catch{throw Error('Fichier JSON illisible ou endommagé.');}safeTree(input);
  const envelope=record(input)&&own(input,'application');
  if(envelope)requireValue(input.application===APPLICATION&&input.formatVersion===FORMAT,'Sauvegarde d’un autre jeu ou d’une version non prise en charge.');
  else requireValue(record(input)&&input.version===1&&record(input.constructionTrial),'Ancienne sauvegarde extérieure au laboratoire ou version incompatible.');
  const candidate=validate(envelope?input.state:input);
  // Toutes les transformations portent sur cette nouvelle valeur JSON, jamais sur state.
  const nettlesMigrated=candidate.nettlesVersion!==1,worldMigrated=!BuildingArea.tools&&(candidate.settlementVersion!==1||candidate.landscapeVersion!==1);
  prepare(candidate);validate(candidate);
  return {state:candidate,legacy:!envelope,nettlesMigrated,worldMigrated};
 }
 function encode(s){validate(s);return JSON.stringify({application:APPLICATION,formatVersion:FORMAT,savedAt:Date.now(),state:s});}
 function unchanged(){requireValue(localStorage.getItem(SAVE_KEY)===expectedRaw,'La partie a changé dans un autre onglet. Exporte ta progression puis recharge ce jeu.');}
 function checkpoint(key,raw){localStorage.setItem(key,raw);requireValue(localStorage.getItem(key)===raw,'Copie de secours non enregistrée.');}
 function write(raw){unchanged();localStorage.setItem(SAVE_KEY,raw);expectedRaw=raw;}
 function report(error){
  const message='Sauvegarde impossible : '+error.message+' Exporte ta partie pour la conserver.';
  const button=$('btnSave');button.title=message;button.querySelector('span').textContent='Exporter un secours';button.onclick=()=>exportSave();
  $('saveWarning').hidden=false;$('saveWarningText').textContent=message;$('saveWarningExport').onclick=()=>exportSave();
  if(lastError!==message)toast(message);lastError=message;
 }
 function clearNotice(){lastError='';$('saveWarning').hidden=true;$('btnSave').title='Sauvegarder maintenant';$('btnSave').querySelector('span').textContent='Enregistrer';$('btnSave').onclick=null;}
 function download(raw,name){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function load(){
  expectedRaw=localStorage.getItem(SAVE_KEY);
  let candidate;
  if(expectedRaw===null){
   requireValue(localStorage.getItem(migrationKey)===null&&localStorage.getItem(importKey)===null&&localStorage.getItem(worldKey)===null,'Sauvegarde principale absente. Un secours est disponible ci-dessous.');
   candidate=newState();validate(candidate);
  }
  else{
   const decoded=decode(expectedRaw);candidate=decoded.state;
   if(decoded.legacy||decoded.nettlesMigrated){unchanged();checkpoint(migrationKey,expectedRaw);}
   if(decoded.worldMigrated){unchanged();checkpoint(worldKey,expectedRaw);}
  }
  loaded=true;return candidate;
 }
 function save(show=false){
  if(!loaded||!state)return false;
  try{write(encode(state));clearNotice();if(show)toast('Progression enregistrée sur cet appareil.');return true;}
  catch(e){report(e);return false;}
 }
 async function importFile(file){
  if(!file||importing)return false;importing=true;
  try{
   requireValue(file.size<=LIMIT,'Fichier trop volumineux.');const candidate=decode(await file.text()).state;
   if(!confirm('Importer cette sauvegarde ? Elle remplacera ta partie actuelle. Un secours de la partie remplacée sera conservé.'))return false;
   // Capture aussi les actions encore en attente de l’enregistrement différé.
   const previous=state?encode(state):expectedRaw;
   const raw=encode(candidate);unchanged();const oldBackup=localStorage.getItem(importKey);if(previous!==null)checkpoint(importKey,previous);
   const oldState=state,oldRaw=expectedRaw;
   try{write(raw);}catch(error){if(oldBackup===null)localStorage.removeItem(importKey);else localStorage.setItem(importKey,oldBackup);throw error;}
   clearTimeout(saveTimer);state=candidate;loaded=true;
   try{
    if(constructionTrial.ready){
     FloorPlacement.stop();WallPlacement.stop();RoofPlacement.stop();stopPlacing();
     ui.selection=null;ui.stationId=null;ui.objectMenu=null;ui.auto=null;ui.lastHit=null;ui.keys.clear();ui.touch.clear();
     activate(state);idSequence=state.nextId;applyAudioSettings();closePanel();drawSelection();
     MapControls.center();updateHUD();render();clearNotice();
    }else{location.reload();return true;}
   }catch(error){
    state=oldState;
    // Un échec de reconstruction ne doit jamais laisser la partie importée en place.
    if(localStorage.getItem(SAVE_KEY)===raw){if(oldRaw===null)localStorage.removeItem(SAVE_KEY);else localStorage.setItem(SAVE_KEY,oldRaw);expectedRaw=oldRaw;}
    if(oldBackup===null)localStorage.removeItem(importKey);else localStorage.setItem(importKey,oldBackup);
    if(oldState){activate(oldState);idSequence=oldState.nextId;MapControls.center();updateHUD();saveSoon();}
    throw error;
   }
   toast('Sauvegarde importée. Le secours précédent est disponible dans Paramètres.');return true;
  }catch(e){toast('Import impossible : '+e.message);return false;}
  finally{importing=false;const input=$('importFile');if(input)input.value='';}
 }
 function recovery(error){
  loaded=false;const host=$('loading');host.classList.remove('hidden');host.classList.add('save-recovery');host.replaceChildren();
  const p=document.createElement('p');p.textContent='Partie conservée, chargement interrompu : '+error.message;host.append(p);
  const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;host.append(b);};
  if(expectedRaw!==null)button('Exporter les données conservées',()=>download(expectedRaw,'veilleurs-donnees-conservees.json'));
  for(const [key,label]of [[migrationKey,'Exporter le secours avant mise à jour'],[importKey,'Exporter le secours avant import'],[worldKey,'Exporter le secours avant retrait du témoin / paysage']]){
   try{const raw=localStorage.getItem(key);if(raw!==null)button(label,()=>download(raw,'veilleurs-secours.json'));}catch{}
  }
  const label=document.createElement('label');label.textContent='Importer un fichier de secours : ';
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>importFile(input.files?.[0]);label.append(input);host.append(label);
 }
 function install(hooks){
  prepare=hooks.prepare;activate=hooks.activate;loadSave=load;saveNow=save;importSave=importFile;
  exportSave=function(){try{download(encode(state),'veilleurs-construction-'+new Date().toISOString().slice(0,10)+'.json');toast('Fichier de sauvegarde exporté.');}catch(e){toast('Export impossible : '+e.message);}};
  const originalPanelClick=handlePanelClick;
  handlePanelClick=function(e){const b=e.target.closest('[data-action=export-rescue]');if(b){try{if(![migrationKey,importKey,worldKey].includes(b.dataset.backup))return;const raw=localStorage.getItem(b.dataset.backup);if(raw!==null)download(raw,'veilleurs-secours.json');else toast('Aucun secours de ce type : aucune opération correspondante effectuée.');}catch(error){toast(error.message);}return;}return originalPanelClick(e);};
 }
 function backupButtons(){return `<button class="btn full secondary" data-action="export-rescue" data-backup="${migrationKey}">Exporter le secours avant mise à jour</button><button class="btn full secondary" data-action="export-rescue" data-backup="${importKey}">Exporter le secours avant import</button><button class="btn full secondary" data-action="export-rescue" data-backup="${worldKey}">Exporter le secours avant retrait du témoin / paysage</button>`;}
 return {install,decode,encode,validate,recovery,backupButtons,migrationKey,importKey,worldKey,get error(){return lastError;}};
})();

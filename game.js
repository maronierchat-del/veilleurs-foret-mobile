'use strict';
// Les Veilleurs de la Forêt • version locale 0.4.1
// Règles : dossier de conception du 21 octobre 2026. Aucun sprite n'est retouché.
const $ = id => document.getElementById(id);
const canvas = $('scene'), ctx = canvas.getContext('2d',{alpha:false});
const ROOT='assets/sprites/';
const IMAGES={};
const PATHS={
  arbuste:'cultures/arbuste_00_deracine.png',person:'personnage/face.png',right:'personnage/debout_droite.png',left:'personnage/debout_gauche.png',back:'personnage/dos.png',
  ...Object.fromEntries(Array.from({length:8},(_,i)=>['walk'+(i+1),'personnage/marche_'+String(i+1).padStart(2,'0')+'.png'])),
  tree:'ressources/arbre.png',rock:'ressources/rocher.png',twig:'ressources/brindilles.png',grass:'ressources/herbe.png',pebbles:'ressources/cailloux_sol.png',carrot:'ressources/carotte.png',mushroom:'ressources/champignon.png',bush:'cultures/arbuste_03_fruits.png',
  bush_empty:'cultures/arbuste_02_adulte.png',bush_planted:'cultures/arbuste_01_plante.png',bush_root:'cultures/arbuste_00_deracine.png',
  potager:'cultures/potager_00_vide.png',potager_young:'cultures/potager_01_jeunes_pousses.png',potager_ripe:'cultures/potager_02_carottes_mures.png',
  champignonniere:'cultures/champignonniere_00_vide.png',champignonniere_young:'cultures/champignonniere_01_petits_champignons.png',champignonniere_ripe:'cultures/champignonniere_02_champignons_murs.png',
  pepiniere:'installations/pepiniere.png',pepiniere_prete:'installations/pepiniere_prete.png',feu:'installations/feu_de_camp.png',etabli:'installations/etabli.png',coffre:'installations/coffre.png',paillasse:'installations/paillasse.png',marmite:'installations/marmite.png',
  table:'mobilier/table.png',chaise:'mobilier/chaise.png',etagere:'mobilier/etagere.png',
  sol:'construction/sol_bois.png',mur:'construction/mur_bois.png',porte:'construction/porte_bois.png',fenetre:'construction/fenetre.png',toit:'construction/toit_bois.png',cloture:'construction/cloture.png',portillon:'construction/portillon.png',chemin_terre:'construction/chemin_terre.png',chemin_pierre:'construction/chemin_pierre.png',
  hache:'outils/hache.png',pioche:'outils/pioche.png',pelle:'outils/pelle.png',marteau:'outils/marteau.png',sac:'outils/sac_a_dos.png',torche:'outils/torche.png',
  bois:'ressources/bois.png',pierre:'ressources/pierre.png',fibres:'ressources/fibres.png',baies:'ressources/baies.png',champignon:'ressources/champignon.png',carotte_item:'ressources/carotte.png',
  carottes_cuites:'cuisine/carottes_cuites.png',champignons_cuits:'cuisine/champignons_cuits.png',soupe:'cuisine/soupe_carottes.png',ragout:'cuisine/ragout_forestier.png',baies_crues:'cuisine/baies_crues.png'
};
const SIZES={person:116,right:116,left:116,back:116,tree:288,rock:116,twig:45,grass:60,pebbles:42,carrot:45,mushroom:43,bush:103,bush_empty:103,bush_planted:92,bush_root:103,
  potager:96,potager_young:96,potager_ripe:96,champignonniere:130,champignonniere_young:130,champignonniere_ripe:130,pepiniere:170,pepiniere_prete:170,
  feu:96,etabli:104,coffre:82,paillasse:111,marmite:105,table:80,chaise:78,etagere:105,
  sol:65,mur:96,porte:108,fenetre:94,toit:107,cloture:75,portillon:79,chemin_terre:60,chemin_pierre:60};
const CRAFT={
 hache:{name:'Hache rudimentaire',kind:'outil',materials:{bois:3,pierre:2},desc:'Abattre les arbres.',spr:'hache'},
 pioche:{name:'Pioche rudimentaire',kind:'outil',materials:{bois:3,pierre:3},desc:'Miner les rochers.',spr:'pioche'},
 marteau:{name:'Marteau',kind:'outil',materials:{bois:3,pierre:2},desc:'Démonter les constructions.',spr:'marteau'},
 pelle:{name:'Pelle',kind:'outil',materials:{bois:4,pierre:3},bench:true,desc:'Déterrer les arbustes à baies.',spr:'pelle'},
 sac:{name:'Sac à dos',kind:'outil',materials:{bois:4,fibres:6},bench:true,desc:'Capacité d’inventaire à définir.',spr:'sac'},
 torche:{name:'Torche',kind:'outil',materials:{bois:2,fibres:1},bench:true,desc:'Éclairage décoratif.',spr:'torche'},
 feu:{name:'Feu de camp',kind:'installation',materials:{bois:5,pierre:3},spr:'feu'},
 etabli:{name:'Établi',kind:'installation',materials:{bois:10,pierre:5,fibres:4},spr:'etabli'},
 coffre:{name:'Coffre',kind:'installation',materials:{bois:8,fibres:2},spr:'coffre'},
 paillasse:{name:'Paillasse',kind:'installation',materials:{bois:4,fibres:6},spr:'paillasse'},
 marmite:{name:'Marmite',kind:'installation',materials:{bois:4,pierre:6},spr:'marmite'},
 potager:{name:'Potager',kind:'installation',materials:{bois:3,fibres:4},spr:'potager'},
 pepiniere:{name:'Pépinière',kind:'installation',materials:{bois:8,fibres:6},spr:'pepiniere'},
 champignonniere:{name:'Champignonnière',kind:'installation',materials:{bois:6,fibres:6},spr:'champignonniere'},
 sol:{name:'Sol en bois',kind:'construction',materials:{bois:4},qty:4,spr:'sol'},
 mur:{name:'Mur en bois',kind:'construction',materials:{bois:6},qty:3,spr:'mur'},
 porte:{name:'Porte en bois',kind:'construction',materials:{bois:6,fibres:2},qty:2,spr:'porte'},
 fenetre:{name:'Fenêtre',kind:'construction',materials:{bois:8},qty:4,spr:'fenetre'},
 toit:{name:'Éléments de toiture en chaume',kind:'construction',materials:{bois:4,fibres:8},qty:4,bench:true,spr:'toit',desc:'Stock commun : choisir la forme au placement.'},
 cloture:{name:'Clôture en bois',kind:'construction',materials:{bois:4},qty:4,spr:'cloture'},
 portillon:{name:'Portillon',kind:'construction',materials:{bois:3,fibres:1},qty:2,spr:'portillon'},
 table:{name:'Table en bois',kind:'meuble',materials:{bois:5},spr:'table'},
 chaise:{name:'Chaise en bois',kind:'meuble',materials:{bois:3},spr:'chaise'},
 etagere:{name:'Étagère en bois',kind:'meuble',materials:{bois:6,fibres:2},spr:'etagere'}
};
const FOOD={
 carottes_cuites:{name:'Carottes cuites',materials:{carotte:2},qty:2,cul:5,station:'feu'},
 champignons_cuits:{name:'Champignons cuits',materials:{champignon:4},qty:2,cul:5,station:'feu'},
 soupe:{name:'Soupe de carottes',materials:{carotte:4},qty:2,cul:10,station:'marmite'},
 ragout:{name:'Ragoût forestier',materials:{champignon:2,baies:4},qty:2,cul:10,station:'marmite'}
};
const LABEL={bois:'Bois',pierre:'Pierre',fibres:'Fibres végétales',carotte:'Carottes',baies:'Baies',champignon:'Champignons',jeunes_plants:'Jeunes plants de carottes',arbuste:'Arbuste transplanté'};
for(const [k,v] of Object.entries(CRAFT))LABEL[k]=v.name;
for(const [k,v] of Object.entries(FOOD))LABEL[k]=v.name;
const MODES={pls:5,tres_doux:10,doux:15,normal:30,sportif:60};
const MODENAMES={pls:'PLS — exceptionnel (1 pt / 5 s)',tres_doux:'Très doux (1 pt / 10 s)',doux:'Doux (1 pt / 15 s)',normal:'Normal (1 pt / 30 s)',sportif:'Sportif (1 pt / 60 s)'};
const COLLECT={twig:{name:'Brindilles',item:'bois',qty:3,cost:1},grass:{name:'Touffe d’herbe',item:'fibres',qty:4,cost:1},pebbles:{name:'Cailloux',item:'pierre',qty:3,cost:1},tree:{name:'Arbre',item:'bois',qty:8,cost:2,tool:'hache'},rock:{name:'Rocher',item:'pierre',qty:8,cost:2,tool:'pioche'},carrot:{name:'Carotte sauvage',item:'carotte',qty:1,cost:1},mushroom:{name:'Champignon sauvage',item:'champignon',qty:1,cost:1},bush:{name:'Arbuste à baies',item:'baies',qty:2,cost:1}};
const SAVE_KEY='veilleurs_construction_test_etape1_v1';
const WORLD={width:3600,height:3200,centerX:1800,centerY:1600};
// DURÉES PROVISOIRES de la maquette : aucune n'est déclarée validée.
const TEST_HOURS={pepiniere:6,potager:12,champignonniere:12,arbusteFirst:24,arbuste:12,wildBush:12};
const TEST_RESPAWN_HOURS={tree:8,rock:10,twig:3,pebbles:3,grass:4,carrot:5,mushroom:5,bush:8};
const HOUR=3600000;
const STRUCTURE_TYPES=new Set([...Object.keys(CRAFT).filter(k=>CRAFT[k].kind!=='outil'),'arbuste']);
const FLOOR_BASIS={a:{x:75,y:-39},b:{x:33,y:50}}; // Vecteurs au sol d'après les arêtes du sprite validé, squash Y=0,70.
const FLOOR_GRID_ORIGIN={x:WORLD.centerX,y:WORLD.centerY};
const WALL_STEP=79; // largeur visible d'un mur en projection, rangée continue.

let state, ui={lastHit:null,lastHitAt:0,tab:'inventory',craftFilter:'outil',stationId:null,walkMoving:false,walkClock:0,lastStep:0,open:false,selection:null,placing:null,hover:null,auto:null,lastToast:null,mouse:{x:0,y:0},keys:new Set(),touch:new Set(),camera:{x:WORLD.centerX,y:WORLD.centerY,zoom:1,squash:.70},time:0}, patches=[], dpr=1, W=0,H=0,groundPattern=null,toastTimeout=0,saveTimer=0,idSequence=1;
function random(seed){return()=>{seed|=0;seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
// Placement naturel : des ressources disponibles, mais pas de tas d'arbres superposés.
// Les valeurs ci-dessous règlent seulement l'espacement visuel, jamais les récoltes.
const NATURAL_TYPES=new Set(Object.keys(COLLECT));
function naturalGap(a,b){
 const t=a.type,u=b.type;
 if(t==='tree'||u==='tree'){
   const other=t==='tree'?u:t;
   if(other==='tree')return [265,430];
   if(other==='rock')return [190,320];
   if(other==='bush')return [150,275];
   if(NATURAL_TYPES.has(other))return [125,255];
   return [175,300]; // Ne pas réinstaller une ressource sur une construction.
 }
 if(t==='rock'||u==='rock')return [110,190];
 if(t==='bush'||u==='bush')return [90,145];
 return [49,88];
}
function naturalPositionOK(type,x,y,objects,player,clearSpawn=false){
 if(x<145||y<155||x>WORLD.width-145||y>WORLD.height-145)return false;
 if(clearSpawn){
   // La clairière de départ laisse visibles les petites ressources posées à la main.
   if(Math.hypot(x-WORLD.centerX,y-WORLD.centerY)<365)return false;
   if(player&&Math.hypot(x-player.x,y-player.y)<130)return false;
 }
 for(const other of objects){
   if(!other.placed&&!NATURAL_TYPES.has(other.type))continue;
   const [rx,ry]=naturalGap({type},{type:other.type});
   const dx=(x-other.x)/rx,dy=(y-other.y)/ry;
   if(dx*dx+dy*dy<1)return false;
 }
 return true;
}
function seekNaturalPosition(type,preferred,objects,player,rnd,clearSpawn=true){
 if(naturalPositionOK(type,preferred.x,preferred.y,objects,player,clearSpawn))return preferred;
 // Premièrement : repositionnement local, pour conserver la géographie d'une partie.
 for(let i=0;i<320;i++){
   const radius=85+rnd()*(140+Math.floor(i/32)*115);
   const a=rnd()*Math.PI*2;
   const x=preferred.x+Math.cos(a)*radius,y=preferred.y+Math.sin(a)*radius;
   if(naturalPositionOK(type,x,y,objects,player,clearSpawn))return {x,y};
 }
 // Secours : chercher à l'échelle de la vallée, sans forcer de chevauchement.
 for(let i=0;i<1800;i++){
   const x=160+rnd()*(WORLD.width-320),y=165+rnd()*(WORLD.height-330);
   if(naturalPositionOK(type,x,y,objects,player,clearSpawn))return {x,y};
 }
 return null;
}
// Migration douce des V0.1/V0.2/V0.3 : mêmes objets et identifiants, bâtiments intacts.
function spaceWildResources(save){
 if(save.natureLayoutVersion>=2)return 0;
 const rnd=random(21002631),fixed=save.objects.filter(o=>o.placed||!NATURAL_TYPES.has(o.type));
 const priority={tree:0,rock:1,bush:2};
 const wild=save.objects.filter(o=>!o.placed&&NATURAL_TYPES.has(o.type));
 const large=wild.filter(o=>Object.hasOwn(priority,o.type)).sort((a,b)=>
   priority[a.type]-priority[b.type]||
   Math.hypot(a.x-WORLD.centerX,a.y-WORLD.centerY)-Math.hypot(b.x-WORLD.centerX,b.y-WORLD.centerY)||a.id-b.id);
 // On laisse les petits objets déjà récoltables en place, pour changer le moins
 // possible une vallée où la joueuse a peut-être commencé à s'installer.
 const small=wild.filter(o=>!Object.hasOwn(priority,o.type));
 let moved=0;
 for(const obj of large){
   if(!naturalPositionOK(obj.type,obj.x,obj.y,fixed,null,false)){
     const closeToStart=Math.hypot(obj.x-WORLD.centerX,obj.y-WORLD.centerY)<365;
     const spot=seekNaturalPosition(obj.type,{x:obj.x,y:obj.y},[...fixed,...small],save.player,rnd,!closeToStart);
     if(spot){obj.x=spot.x;obj.y=spot.y;moved++;}
   }
   fixed.push(obj);
 }
 save.natureLayoutVersion=2;
 return moved;
}
function newState(){let s={version:1,natureLayoutVersion:2,player:{x:WORLD.centerX,y:WORLD.centerY,face:'person'},sport:0,cul:0,mode:'normal',equippedTool:null,quickTools:[],audio:{music:false,sfx:false},remainders:{pls:0,tres_doux:0,doux:0,normal:0,sportif:0},cardioDays:{},items:{},objects:[],nextId:1,history:[],respawnQueue:[],cropTimeVersion:2,constructionGridVersion:2};
 const rnd=random(210026);
 const add=(type,x,y,extra={})=>s.objects.push({id:s.nextId++,type,x,y,placed:false,...extra});
 // Clairière naturelle : aucun feu de camp, établi, potager ou autre objet fabriqué.
 [["twig",90,45],["pebbles",-110,53],["grass",165,-52],["carrot",-58,-155],["mushroom",215,116],["bush",-265,38],["tree",310,-200],["rock",-315,-125],["twig",-180,175],["pebbles",170,220]].forEach(([t,dx,dy])=>add(t,WORLD.centerX+dx,WORLD.centerY+dy));
 const types=['tree','rock','twig','grass','pebbles','carrot','mushroom','bush'];
 const weights=[.17,.09,.16,.15,.13,.10,.09,.11];
 for(let n=0;n<230;n++){
   let r=rnd(),type=types[types.length-1];
   for(let i=0;i<types.length;i++){r-=weights[i];if(r<=0){type=types[i];break;}}
   const point=seekNaturalPosition(type,{x:145+rnd()*(WORLD.width-290),y:155+rnd()*(WORLD.height-310)},s.objects,s.player,rnd,true);
   if(point)add(type,point.x,point.y);
 }
 return s;
}
function migrateSave(s){
 if(!Array.isArray(s.respawnQueue))s.respawnQueue=[];
 if(!s.cropTimeVersion){
  // Aucun cycle déjà en cours n'est effacé lors du changement de version.
  const now=Date.now();
  for(const o of s.objects){
   if(!o.placed&&o.type==='bush'&&o.harvested&&!o.readyAt)o.readyAt=now+TEST_HOURS.wildBush*HOUR;
   if(o.placed&&o.type==='potager'&&o.stage===1&&!o.readyAt)o.readyAt=now+TEST_HOURS.potager*HOUR;
   if(o.placed&&o.type==='champignonniere'&&o.seeded&&o.stage===1&&!o.readyAt)o.readyAt=now+TEST_HOURS.champignonniere*HOUR;
   if(o.placed&&o.type==='arbuste'&&o.stage<3&&!o.readyAt)o.readyAt=now+(o.stage===1?TEST_HOURS.arbusteFirst:TEST_HOURS.arbuste)*HOUR;
  }
  s.cropTimeVersion=2;
 }
 if(!s.constructionGridVersion){
  // Les anciennes versions utilisaient un snap cartésien, décalant les dalles.
  // Recalage sans supprimer de pièce, et seulement pour les anciens sols/murs.
  const occupied=new Set();
  for(const o of s.objects.filter(a=>a.placed&&a.type==='sol').sort((a,b)=>a.id-b.id)){
   const pos=floorCoords(o.x,o.y),u0=Math.round(pos.u),v0=Math.round(pos.v);
   let best=null,bestDistance=Infinity;
   for(let radius=0;radius<=5;radius++)for(let du=-radius;du<=radius;du++)for(let dv=-radius;dv<=radius;dv++){
    const u=u0+du,v=v0+dv,key=u+':'+v;if(occupied.has(key))continue;
    const pt=floorWorld(u,v),dist=Math.hypot(pt.x-o.x,(pt.y-o.y)*.7);
    if(dist<bestDistance){best={pt,key};bestDistance=dist;}
   }
   if(best){o.x=best.pt.x;o.y=best.pt.y;occupied.add(best.key);}
  }
  const wallTypes=new Set(['mur','porte','fenetre','cloture','portillon']);
  const walls=s.objects.filter(o=>o.placed&&wallTypes.has(o.type)).sort((a,b)=>a.y-b.y||a.x-b.x);
  const rows=[];
  for(const o of walls){
   let row=rows.find(r=>Math.abs(r.y-o.y)<28);
   if(!row){row={y:o.y,values:[]};rows.push(row);}
   const x0=row.values.length?row.values[0]:o.x;
   let n=Math.round((o.x-x0)/WALL_STEP),nx=x0+n*WALL_STEP;
   while(row.values.some(x=>Math.abs(x-nx)<12)){n+=1;nx=x0+n*WALL_STEP;}
   o.x=nx;o.y=row.y;row.values.push(nx);
  }
  s.constructionGridVersion=2;
 }
 if(!Array.isArray(s.quickTools))s.quickTools=s.equippedTool?[s.equippedTool]:[];
 s.quickTools=s.quickTools.filter(k=>CRAFT[k]?.kind==='outil'&&k!=='sac'&&Number(s.items[k]||0)>0);
 s.equippedTool=null; // tous les outils présents dans la barre sont équipés simultanément.
 if(!s.audio)s.audio={music:false,sfx:false};
 return s;
}
function validateSave(s){if(!s||s.version!==1||!s.player||!Array.isArray(s.objects)||typeof s.sport!=='number'||typeof s.cul!=='number'||!s.items||!s.remainders||!s.cardioDays)return false;return Number.isFinite(s.sport)&&s.sport>=0&&Number.isFinite(s.cul)&&s.cul>=0&&s.objects.length<100000;}
function loadSave(){try{let raw=localStorage.getItem(SAVE_KEY);if(raw){let parsed=JSON.parse(raw);if(validateSave(parsed)){if(!('equippedTool' in parsed))parsed.equippedTool=null;spaceWildResources(parsed);return migrateSave(parsed);}}}catch(e){console.warn('Sauvegarde locale non disponible',e)}return newState();}
function saveNow(show=false){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));if(show)toast('Progression enregistrée sur cet appareil.');}catch(e){if(show)toast('Stockage indisponible : exporte ta sauvegarde pour la conserver.');}}
function saveSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNow(),500);}
function imgPath(key){return ROOT+(PATHS[key]||'ressources/bois.png');}
async function loadAssets(){const progress=$('loadProgress');let all=[...new Set(Object.entries(PATHS).map(([k,v])=>[k,v]))];let count=0;
 await Promise.all(all.map(([k,path])=>new Promise(resolve=>{const i=new Image();i.onload=()=>{IMAGES[k]=i;progress.textContent=`${++count}/${all.length} images`;resolve();};i.onerror=()=>{console.warn('Sprite manquant',path);++count;resolve();};i.src=ROOT+path;})));
 await Promise.all(['01_herbe_olive_512_sans_joint.png','04_herbe_terre_512_sans_joint.png'].map((path,n)=>new Promise(resolve=>{const i=new Image();i.onload=()=>{IMAGES['terrain'+n]=i;resolve();};i.onerror=resolve;i.src='assets/terrains/'+path;})));
}
function initPatches(){let rnd=random(14055);for(let i=0;i<35;i++){let x=80+rnd()*(WORLD.width-160),y=80+rnd()*(WORLD.height-160),rx=165+rnd()*265,ry=150+rnd()*270;patches.push({x,y,rx,ry});}}
function fmtMaterials(materials){return Object.entries(materials).map(([k,v])=>`${v} ${LABEL[k]||k}`).join(' · ');}
function amount(key){return Math.max(0,Number(state.items[key]||0));}
function enough(items){return Object.entries(items).every(([k,v])=>amount(k)>=v);}
function give(key,quantity){state.items[key]=(state.items[key]||0)+quantity;if(state.items[key]<=0)delete state.items[key];}
function pay(cost){const culinary=Math.min(state.cul,Math.floor(cost/2)),sport=cost-culinary;if(state.sport<sport){toast(`Il manque ${sport-state.sport} énergie sportive pour cette action.`);return false;}state.sport-=sport;state.cul-=culinary;return true;}
function spendMaterials(materials){for(let [k,v] of Object.entries(materials))give(k,-v);}
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('visible'),3100);}
function log(s){state.history.unshift(s);state.history=state.history.slice(0,18);}
function nearest(type,maxDistance=150){return state.objects.find(o=>o.placed&&o.type===type&&Math.hypot(o.x-state.player.x,o.y-state.player.y)<maxDistance);}
function viewedWorkbench(){return ui.open&&ui.tab==='craft'&&state.objects.find(o=>o.id===ui.stationId&&o.type==='etabli'&&o.placed);}
function activeWorkbench(){const o=viewedWorkbench();return o&&Math.hypot(o.x-state.player.x,o.y-state.player.y)<150&&o;}
function canCraft(key){const r=CRAFT[key];return enough(r.materials)&&state.sport>=4-Math.min(state.cul,2)&&(!r.bench||!!viewedWorkbench());}
function craft(key){let r=CRAFT[key];if(!r)return;if(r.bench&&!activeWorkbench()){toast('Pour cette fabrication, approche-toi de ton établi.');return;}
 if(!enough(r.materials)){toast('Matériaux insuffisants.');return;}if(!pay(4))return;
 spendMaterials(r.materials);give(key,r.qty||1);sound('craft');log(`Fabrication : ${r.name}`);
 if(r.kind==='outil'){toast(`Fabriqué : ${r.name} · va dans le sac pour l’équiper.`);sound('craft');commit();}
 else {commit();placeStart(key);}
}
function cook(key){const r=FOOD[key];if(!r)return;if(!nearest(r.station)){toast(`Approche-toi de ${r.station==='feu'?'ton feu de camp':'ta marmite'}.`);return;}
 if(!enough(r.materials)){toast('Ingrédients insuffisants.');return;}
 if(!pay(4))return;spendMaterials(r.materials);give(key,r.qty);sound('craft');toast(`${r.qty} portions de ${r.name.toLowerCase()} préparées.`);commit();}
function eat(key){if(key==='baies'){if(!amount('baies'))return;give('baies',-1);state.cul++;toast('Baie crue : +1 énergie culinaire.');}
 else {let r=FOOD[key];if(!r||!amount(key))return;give(key,-1);state.cul+=r.cul;toast(`${r.name} : +${r.cul} énergie culinaire.`);}
 commit();}
// Bande originale fournie par la joueuse (MP3 en boucle) + effets de jeu distincts.
// Le navigateur peut exiger une interaction avant la première lecture.
let audioCtx=null;
let musicNeedsGesture=false;
function audioReady(){const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)return null;
 if(!audioCtx)audioCtx=new AudioCtor();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return audioCtx;}
function tone(hz,duration=.16,amp=.025,shape='sine',delay=0){const a=audioReady();if(!a)return;
 let osc=a.createOscillator(),vol=a.createGain(),start=a.currentTime+delay;
 osc.type=shape;osc.frequency.setValueAtTime(hz,start);vol.gain.setValueAtTime(.0001,start);
 vol.gain.exponentialRampToValueAtTime(Math.max(.001,amp),start+.025);
 vol.gain.exponentialRampToValueAtTime(.0001,start+duration);
 osc.connect(vol).connect(a.destination);osc.start(start);osc.stop(start+duration+.025);}
function sound(type){if(!state?.audio?.sfx)return;switch(type){
 case 'click':tone(420,.09,.012,'sine');break;
 case 'gather':tone(350,.09,.024,'triangle');tone(530,.17,.014,'sine',.08);break;
 case 'craft':tone(400,.12,.022,'triangle');tone(600,.2,.022,'sine',.12);break;
 case 'place':tone(185,.12,.022,'triangle');tone(290,.17,.011,'sine',.10);break;
 case 'step':tone(110,.055,.004,'triangle');break;
 }}
function applyAudioSettings(){
 const music=$('forestMusic');if(!music)return;
 music.volume=.35;music.loop=true;
 if(!state?.audio?.music){music.pause();musicNeedsGesture=false;return;}
 if(!music.paused){musicNeedsGesture=false;return;}
 // Le vrai fichier fourni remplace la mélodie synthétique des précédents prototypes.
 const attempt=music.play();
 if(attempt&&typeof attempt.then==='function')attempt.then(()=>{musicNeedsGesture=false;}).catch(()=>{musicNeedsGesture=true;});
}
function commit(){saveSoon();renderPanel();updateHUD();}
function updateHUD(){
 $('sportBalance').textContent=state.sport.toLocaleString('fr-FR');$('foodBalance').textContent=state.cul.toLocaleString('fr-FR');
 $('resourceStrip').innerHTML=['bois','pierre','fibres'].map(k=>`<div class="resource-counter" title="${LABEL[k]}">${rowImage(k)}<strong>${amount(k).toLocaleString('fr-FR')}</strong></div>`).join('');
 const owned=[...new Set(state.quickTools||[])].filter(k=>amount(k)>0);
 const belt=$('toolbelt');belt.hidden=!owned.length;
 belt.innerHTML=owned.map(k=>['marteau','pelle'].includes(k)?`<button type="button" class="toolslot equipped" data-recovery-tool="${k}" aria-pressed="false" title="${LABEL[k]} : remettre ${k==='pelle'?'un arbuste':'une installation'} dans l’inventaire"><img src="${imgPath(k)}" alt="${LABEL[k]}"></button>`:`<div class="toolslot equipped" title="${LABEL[k]} équipé automatiquement"><img src="${imgPath(k)}" alt="${LABEL[k]}"></div>`).join('');
}
function hasTool(key){return amount(key)>0&&(state.quickTools||[]).includes(key);}
function toggleQuickTool(key){if(!amount(key)||!CRAFT[key]||CRAFT[key].kind!=='outil'||key==='sac')return;
 if(!Array.isArray(state.quickTools))state.quickTools=[];
 if(state.quickTools.includes(key)){state.quickTools=state.quickTools.filter(k=>k!==key);toast(`${LABEL[key]} déséquipé.`);}
 else {state.quickTools.push(key);toast(`${LABEL[key]} équipé et disponible.`);}
 sound('click');commit();}

function setTab(tab){if(ui.objectMenu!=null){ui.auto=null;ui.selection=null;ui.objectMenu=null;ui.stationId=null;drawSelection();}ui.tab=tab;ui.open=true;$('panel').classList.remove('closed','object-menu');document.querySelectorAll('.dock button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));renderPanel();}
function closePanel(){ui.open=false;$('panel').classList.add('closed');$('panel').classList.remove('object-menu');document.querySelectorAll('.dock button').forEach(b=>b.classList.remove('active'));if(ui.objectMenu!=null){ui.auto=null;ui.selection=null;ui.objectMenu=null;ui.stationId=null;drawSelection();}}
function dismissObjectMenu(){const linked=ui.objectMenu!=null;ui.auto=null;ui.selection=null;ui.objectMenu=null;if(linked){ui.stationId=null;closePanel();}drawSelection();}
function openObjectMenu(o){
 if(!o?.placed||!state.objects.includes(o))return;
 if(ui.objectMenu!=null)dismissObjectMenu();
 const tab=['feu','marmite'].includes(o.type)?'station':o.type==='etabli'?'craft':'installation';
 // Le catalogue peut être consulté à distance ; seule l'action exige la proximité.
 ui.stationId=o.id;if(o.type==='etabli')ui.craftFilter='construction';setTab(tab);ui.objectMenu=o.id;ui.selection=o.id;$('panel').classList.add('object-menu');drawSelection();
}
const STATION_ACTIONS=['craft','cook','nursery','nursery-collect','plant','inoculate','grow','harvest-garden','harvest-mushrooms','harvest-bush','rest','deposit','withdraw'];
function requestStationAction(action,key){
 const o=state.objects.find(o=>o.id===ui.stationId&&o.placed);if(!o||ui.objectMenu!==o.id)return;
 ui.auto=null;
 if(Math.hypot(o.x-state.player.x,o.y-state.player.y)>115){ui.auto={x:o.x,y:o.y,id:o.id,command:action,key};toast('Ton personnage s’approche.');drawSelection();return;}
 if(action==='craft'){if(o.type!=='etabli')return;craft(key);}
 else if(action==='cook'){if(FOOD[key]?.station!==o.type)return;cook(key);}
 else if(action==='deposit'||action==='withdraw')transferChest(action,key);
 else {const stage=o.stage;performInstall(action);if(action==='harvest-bush'&&stage===3&&o.stage!==3)dismissObjectMenu();}
}
function rowImage(key){const construction=typeof ConstructionUI!=='undefined'&&ConstructionUI.image(key);if(construction)return construction;if(key==='jeunes_plants')return '<img alt="" src="assets/propositions/jeunes-plants-godet-bois-v1.png" loading="lazy">';if(key==='toit')return '<img alt="" src="construction/pan-encre-v1.png" loading="lazy">';return `<img alt="" src="${imgPath(key)}" loading="lazy">`;}
function itemRow(key,details,action,actionText,disabled=false,quantity=null){return `<div class="item-row">${quantity===null?'':`<span class="item-quantity" aria-label="Quantité : ${quantity}">${quantity}</span>`}${rowImage(key==='carotte'?'carotte_item':key)}<div class="item-info"><strong>${LABEL[key]||CRAFT[key]?.name||FOOD[key]?.name||key}</strong>${details?`<small>${details}</small>`:''}</div>${action?`<button type="button" data-action="${action}" data-key="${key}" ${disabled?'disabled':''}>${actionText}</button>`:''}</div>`;}
function renderPanel(){if(!ui.open)return;let title='',html='';
 if(ui.tab==='sport'){
   title='Énergie sportive';const mode=state.mode;
   html=`<p>Chaque seconde d’activité compte, quelle que soit l’activité. Difficulté actuelle : <b>${MODENAMES[mode]}</b>. <small>Modifiable dans Paramètres.</small></p>
   <h3>Enregistrer une activité</h3><div class="form-row"><div><label for="mins">Minutes</label><input type="number" id="mins" min="0" step="1" value="4" inputmode="numeric"></div><div><label for="secs">Secondes</label><input type="number" id="secs" min="0" max="59" step="1" value="0" inputmode="numeric"></div></div>
   <button class="btn full" data-action="exercise">Créditer cette activité</button>
   <p class="soft">Secondes reportées dans ce mode : <b>${state.remainders[mode]||0} s</b>.</p>
   <h3>Points cardio · saisie manuelle</h3><p>Indique le total du jour affiché par Google Fit. Seule l’augmentation depuis la dernière saisie est créditée.</p>
   <label for="cardioDate">Jour</label><input type="date" id="cardioDate" value="${new Date().toLocaleDateString('en-CA')}">
   <label for="cardioAmount">Total de points cardio du jour</label><input type="number" id="cardioAmount" min="0" step="1" value="0" inputmode="numeric">
   <button class="btn secondary full" data-action="cardio">Convertir les nouveaux points cardio</button>
   <p class="soft">Coefficient provisoire : 1 point cardio = 2 sportifs. Pas de synchronisation automatique.</p>`;
 }
 if(ui.tab==='inventory'){
   title='Ton sac';
   html='';
   const materials=['bois','pierre','fibres','carotte','baies','champignon','jeunes_plants'];
   const held=Object.keys(state.items).filter(k=>!materials.includes(k)&&amount(k)>0);
   html+=`<h3>Objets & préparations</h3>${held.length?held.map(k=>itemRow(k,'',CRAFT[k]&&CRAFT[k].kind!=='outil'?'place':FOOD[k]?'eat':k==='arbuste'?'place':CRAFT[k]?.kind==='outil'&&k!=='sac'?'quick':'',CRAFT[k]?.kind==='outil'?(state.quickTools||[]).includes(k)?'Déséquiper':'Équiper':FOOD[k]?'Manger':'Placer',false,amount(k))).join(''):'<p>Tu n’as pas encore fabriqué d’objet.</p>'}`;
   html+=`<h3>Ingrédients et plants</h3>`;for(const k of ['carotte','champignon','jeunes_plants'])if(amount(k))html+=itemRow(k,'','','',false,amount(k));
   if(amount('baies'))html+=itemRow('baies','+1 <svg class="energy-symbol" aria-label="énergie culinaire" role="img"><use href="#energy-bolt" /></svg>','eat','Manger',false,amount('baies'));
 }
 if(ui.tab==='craft'){
   title=viewedWorkbench()?'Fabrication · Établi':'Fabrication à la main';
   html=`<p>Une seule interface pour les outils, installations, éléments de construction et meubles. Tout objet que tu fabriques et peux placer est directement prêt à poser sur la carte.</p>`;
   const groups={outil:'Outils',installation:'Installations',construction:'Construction',meuble:'Mobilier'};
   html+=`<div class="craft-filters">${Object.entries(groups).map(([k,n])=>`<button type="button" data-action="craft-filter" data-key="${k}" class="${ui.craftFilter===k?'current':''}">${n}</button>`).join('')}</div>`;
   for(const [k,r] of Object.entries(CRAFT))if(r.kind===ui.craftFilter&&(!r.bench||viewedWorkbench())){
     const note=`${fmtMaterials(r.materials)} · 4 énergie${r.qty?' · lot de '+r.qty:''}${r.bench?' · à l’établi':''}${k==='toit'?' · forme choisie à la pose':''}`;
     html+=`<div class="item-row">${rowImage(r.spr)}<div class="item-info"><strong>${r.name}</strong><small>${note}${amount(k)?' · déjà en réserve : '+amount(k):''}</small></div><button data-action="craft" data-key="${k}" ${!canCraft(k)?'disabled':''}>Fabriquer</button></div>`;
   }
   if(ui.craftFilter==='construction')html+=`<div class="notice">Chemins de terre et de pierre : dessins disponibles, recettes non validées. Fabrication désactivée.</div>`;
   if(ui.craftFilter==='installation')html+=`<div class="notice">Les cultures poussent en temps réel, y compris pendant les absences. Les durées utilisées sont des réglages provisoires de test.</div>`;
 }
 if(ui.tab==='station'){
   const o=state.objects.find(v=>v.id===ui.stationId&&v.placed&&['feu','marmite'].includes(v.type));
   if(!o){title='Cuisine';html='<p>Cette installation n’est plus disponible.</p>';}
   else{
     title=o.type==='feu'?'Feu de camp':'Marmite';
     html=`<p>Prépare tes plats ici, à proximité de l’installation. Une préparation coûte 4 énergie et donne deux portions. Manger se fait ensuite depuis le sac.</p>`;
     for(const [k,r] of Object.entries(FOOD))if(r.station===o.type)html+=`<div class="item-row">${rowImage(k)}<div class="item-info"><strong>${r.name}</strong><small>${fmtMaterials(r.materials)} → ${r.qty} portions · +${r.cul} énergie culinaire chacune</small></div><button data-action="cook" data-key="${k}" ${!enough(r.materials)||state.sport<4-Math.min(state.cul,2)?'disabled':''}>Cuisiner</button></div>`;
     html+=`<p class="soft">Astuce : les baies crues peuvent se manger directement depuis le sac.</p>`;
   }
 }
 if(ui.tab==='installation'){
  const o=state.objects.find(v=>v.id===ui.stationId&&v.placed);
  if(!o){title='Installation';html='<p>Cette installation n’est plus disponible.</p>';}
  else {title=displayName(o); const btn=(action,label,disabled=false)=>`<button class="btn full ${action==='grow'?'secondary':''}" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
   if(o.type==='pepiniere'){
    if(o.stage===2){html='<p>Portes ouvertes : les 4 jeunes plants sont prêts.</p>'+btn('nursery-collect','Récupérer les 4 jeunes plants');}
    else if(o.stage===1){html=`<p>Production en cours, portes fermées. ${timeRemaining(o.readyAt)}</p>`+btn('grow','Terminer la pousse (test)',false);}
    else {html='<p>Pépinière vide, portes fermées. 1 carotte + 2 énergie → 4 jeunes plants.</p>'+btn('nursery','Lancer la production · 2 énergie',amount('carotte')<1||state.sport<2-Math.min(state.cul,1));}
   }else if(o.type==='potager'){
    if(!o.stage){html='<p>Parcelle vide. Repiquer les 4 jeunes plants issus de la pépinière.</p>'+btn('plant','Planter 4 jeunes plants · 1 énergie',amount('jeunes_plants')<4||state.sport<1);}
    else if(o.stage===1){html=`<p>Jeunes plants en croissance. ${timeRemaining(o.readyAt)}</p>`+btn('grow','Terminer la pousse (test)');}
    else {html='<p>Carottes mûres : elles peuvent attendre indéfiniment sans mourir.</p>'+btn('harvest-garden','Récolter 8 carottes · 2 énergie',state.sport<2-Math.min(state.cul,1));}
   }else if(o.type==='champignonniere'){
    if(!o.seeded){html='<p>1 champignon + 1 énergie pour lancer la culture. La repousse est automatique après récolte.</p>'+btn('inoculate','Ensemencer · 1 champignon · 1 énergie',amount('champignon')<1||state.sport<1);}
    else if(o.stage===2){html='<p>Champignons mûrs, récolte renouvelable.</p>'+btn('harvest-mushrooms','Récolter 4 champignons · 2 énergie',state.sport<2-Math.min(state.cul,1));}
    else {html=`<p>Champignons en croissance. ${timeRemaining(o.readyAt)}</p>`+btn('grow','Terminer la pousse (test)');}
    if(o.seeded)html+=btn('change-seeding','Changer l’ensemencement (variétés futures)',true);
   }else if(o.type==='arbuste'){
    if(o.stage===3){html='<p>Baies mûres : aucune obligation de récolter rapidement.</p>'+btn('harvest-bush','Cueillir 2 baies · 1 énergie',state.sport<1);}
    else {html=`<p>Arbuste vivant, pousse sans entretien. ${timeRemaining(o.readyAt)}</p>`+btn('grow','Terminer la pousse (test)');}
   }else if(o.type==='paillasse'){
    html='<p>Paillasse : couchage sans bonus de confort, santé ou énergie. Le passage de la nuit par le sommeil reste à définir.</p>'+btn('rest','S’allonger un instant (test)');
   }else if(o.type==='coffre'){
    html='<p>Stockage de test. Capacité finale du coffre à définir. Dépose ou reprends les objets un par un.</p>';
    for(let k of [...new Set([...Object.keys(state.items),...Object.keys(o.contents||{})])].sort()){
      if(!amount(k)&&!(o.contents||{})[k])continue;
      html+=`<div class="item-row">${rowImage(k==='carotte'?'carotte_item':k)}<div class="item-info"><strong>${LABEL[k]||k}</strong><small>Sac : ${amount(k)} · Coffre : ${(o.contents||{})[k]||0}</small></div><button data-action="deposit" data-key="${k}" ${!amount(k)?'disabled':''}>+1</button><button data-action="withdraw" data-key="${k}" ${!(o.contents||{})[k]?'disabled':''}>−1</button></div>`;
    }
   }else html='<p>Cette installation se place et se récupère avec un marteau.</p>';
  }
 }
 if(ui.tab==='settings'){
   title='Paramètres & sauvegardes';const mode=state.mode;
   html=`<h3>Difficulté sportive</h3><p>Tu peux changer de mode à tout moment, sans perdre ton énergie ni ta progression.</p>
   <label for="mode">Mode de conversion</label><select id="mode">${Object.entries(MODENAMES).map(([k,n])=>`<option value="${k}" ${mode===k?'selected':''}>${n}</option>`).join('')}</select>
   <div class="notice">${mode==='pls'?'Mode PLS exceptionnel : pour les périodes de capacités très diminuées, y compris maladie, convalescence ou grossesse difficile. Les déplacements ordinaires comptent.':'Les secondes non converties restent séparées par difficulté pour éviter les doubles comptes.'}</div>
   <h3>Agriculture et nature · réglages de test</h3><p class="soft">La croissance continue en temps réel même quand le jeu est fermé. Durées actuellement utilisées (non validées) : pépinière 6 h, carottes 12 h, champignons 12 h, arbustes transplantés 24 h puis 12 h. Repousse des ressources sauvages : délais expérimentaux de 3 à 10 h selon le type. Zone protégée autour des installations : rayon d’essai de trois cases. Les cultures ne meurent jamais et l’absence de sport ne coûte rien.</p>
   <h3>Ambiance sonore</h3><p>Musique d’ambiance fournie avec le projet, diffusée en boucle. Activation et désactivation ici ; le navigateur peut attendre ton premier clic pour démarrer le son. Les effets sonores restent indépendants.</p><label class="sound-option"><input id="musicToggle" type="checkbox" ${state.audio?.music?'checked':''}> Musique d’ambiance</label><label class="sound-option"><input id="sfxToggle" type="checkbox" ${state.audio?.sfx?'checked':''}> Effets sonores</label>
   <h3>Sauvegardes</h3><p>Ta progression est enregistrée automatiquement. Les mises à jour compatibles conservent ta partie. Exporte aussi un fichier de secours.</p>
   <button class="btn full" data-action="save">Enregistrer maintenant</button><button class="btn full secondary" data-action="export">Exporter la partie (.json)</button>
   <label>Importer une partie sauvegardée</label><input id="importFile" type="file" accept=".json,application/json">
   ${SaveContinuity.backupButtons()}
   <div class="notice">Les sauvegardes du navigateur dépendent de l’adresse du fichier ou du site. Conserve une copie JSON si tu changes d’emplacement.</div>
   <h3>Historique récent</h3>${state.history.length?state.history.map(v=>`<p class="soft">• ${v.replaceAll('<','&lt;')}</p>`).join(''):'<p>La partie vient de commencer.</p>'}
   <button class="btn danger full" data-action="reset">Recommencer (efface la partie locale)</button>`;
 }
 $('panelTitle').textContent=title;$('panelBody').innerHTML=html;
}
function timeRemaining(target){
 if(!target)return 'Durée non initialisée.';
 const diff=Math.max(0,target-Date.now());if(!diff)return 'Prêt !';
 const h=Math.floor(diff/HOUR),m=Math.ceil((diff%HOUR)/60000);
 return `Temps restant : ${h?h+' h ':''}${m} min (durée provisoire).`;
}
function nextReady(obj,hours){obj.readyAt=Date.now()+hours*HOUR;}
function protectedSpot(x,y){
 // Rayon TEST de trois cases (192 unités), non encore adopté définitivement.
 for(const o of state.objects){if(!o.placed||!STRUCTURE_TYPES.has(o.type)||['sol','toit','chemin_terre','chemin_pierre'].includes(o.type))continue;
  if(Math.hypot(o.x-x,o.y-y)<192)return true;}
 // Sols et chemins : protection seulement à leur propre emplacement.
 for(const o of state.objects){if(!o.placed||!['sol','chemin_terre','chemin_pierre'].includes(o.type))continue;
  if(Math.hypot(o.x-x,o.y-y)<65)return true;}
 return Math.hypot(x-state.player.x,y-state.player.y)<95;
}
function scheduledReplacement(type,origin){
 state.respawnQueue.push({type,x:origin.x,y:origin.y,at:Date.now()+TEST_RESPAWN_HOURS[type]*HOUR,attempt:0});
}
function findRegrowthPosition(q){
 const rr=random((state.nextId*7291+Math.round(q.x)*13+Math.round(q.y)*47)>>>0);
 const attempt={x:q.x+(rr()-.5)*240,y:q.y+(rr()-.5)*240};
 for(let i=0;i<120;i++){
  const x=i===0?attempt.x:150+rr()*(WORLD.width-300),y=i===0?attempt.y:150+rr()*(WORLD.height-300);
  if(!protectedSpot(x,y)&&naturalPositionOK(q.type,x,y,state.objects,state.player,true))return {x,y};
 }
 return null;
}
function updateNatureAndCrops(){
 const now=Date.now();let changed=false;
 for(const o of state.objects){
  if(o.placed){
   // Premier arbuste transplanté : état planté, puis adulte sans fruits à mi-pousse,
   // puis fruits à maturité. On ne retouche jamais les PNG canoniques.
   if(o.type==='arbuste'&&o.stage===1&&o.readyAt&&now>=o.readyAt-(TEST_HOURS.arbusteFirst*HOUR/2)){
    o.stage=2;changed=true;
   }
   if(o.readyAt&&now>=o.readyAt){
    if(o.type==='pepiniere'&&o.stage===1){o.stage=2;o.readyAt=null;changed=true;}
    else if(o.type==='potager'&&o.stage===1){o.stage=2;o.readyAt=null;changed=true;}
    else if(o.type==='champignonniere'&&o.seeded&&o.stage===1){o.stage=2;o.readyAt=null;changed=true;}
    else if(o.type==='arbuste'&&o.stage<3){o.stage=3;o.readyAt=null;changed=true;}
   }
  }else if(o.type==='bush'&&o.harvested&&o.readyAt&&now>=o.readyAt){
   o.harvested=false;o.readyAt=null;changed=true;
  }
 }
 for(let i=state.respawnQueue.length-1;i>=0;i--){
  const q=state.respawnQueue[i];if(q.at>now)continue;
  const pos=findRegrowthPosition(q);
  if(pos){state.objects.push({id:state.nextId++,type:q.type,x:pos.x,y:pos.y,placed:false});state.respawnQueue.splice(i,1);changed=true;}
  else {q.at=now+HOUR;q.attempt=(q.attempt||0)+1;changed=true;}
 }
 if(changed){saveSoon();if(ui.open&&ui.tab==='installation')renderPanel();drawSelection();}
}
function gather(obj){let r=COLLECT[obj.type];if(!r)return;
 if(r.tool&&!hasTool(r.tool)){toast(`Équipe ${LABEL[r.tool].toLowerCase()} depuis le sac.`);return;}
 if(obj.type==='bush'&&obj.harvested){toast('Cet arbuste a déjà été cueilli. Repousse encore à définir.');return;}
 if(!pay(r.cost))return;
 sound('gather');
 give(r.item,r.qty);log(`Récolte : ${r.qty} ${LABEL[r.item].toLowerCase()}`);
 // Les baies cueillies laissent un arbuste nu à la même place.
 if(obj.type==='bush'){obj.harvested=true;nextReady(obj,TEST_HOURS.wildBush);}
 else {state.objects=state.objects.filter(o=>o.id!==obj.id);scheduledReplacement(obj.type,obj);}
 toast(`+${r.qty} ${LABEL[r.item].toLowerCase()}`);ui.selection=null;ui.auto=null;commit();drawSelection();
}
function bushHasBerries(obj){return obj.type==='bush'?!obj.harvested:obj.type==='arbuste'&&obj.stage===3;}
function uprootCost(obj){return bushHasBerries(obj)?3:obj.placed?0:2;}
function uproot(obj){if(!state.objects.includes(obj)||obj.placed||obj.type!=='bush')return;if(!hasTool('pelle')){toast('Équipe la pelle depuis le sac pour déterrer cet arbuste.');return;}
 const berries=bushHasBerries(obj);if(!pay(uprootCost(obj)))return;sound('gather');give('arbuste',1);if(berries)give('baies',2);state.objects=state.objects.filter(o=>o.id!==obj.id);scheduledReplacement('bush',obj);ui.selection=null;ui.auto=null;toast(berries?'Arbuste et 2 baies ajoutés au sac.':'Arbuste déterré : replantation disponible depuis le sac.');commit();drawSelection();}
function advanceVisual(obj){const cycles={potager:3,champignonniere:3,arbuste:4};if(!(obj.type in cycles))return;
 let len=cycles[obj.type],start=obj.type==='arbuste'?1:0;obj.stage= obj.stage>=len-1 ?start:(obj.stage||start)+1;
 toast('Stade visuel de démonstration — aucune récolte ni coût appliqué.');commit();drawSelection();}
function pickup(obj){if(!state.objects.includes(obj)||!obj.placed)return;const tool=obj.type==='arbuste'?'pelle':'marteau';if(!hasTool(tool)){toast(`Équipe ${tool==='pelle'?'la pelle':'le marteau'} depuis le sac pour récupérer cet objet.`);return;}const berries=obj.type==='arbuste'&&bushHasBerries(obj);if(obj.type==='arbuste'&&!pay(uprootCost(obj)))return;if(berries)give('baies',2);sound('place');
 // Retourne un objet intact : jamais son prix en matériaux EN PLUS.
 give(obj.type,1);state.objects=state.objects.filter(o=>o.id!==obj.id);ui.selection=null;
 toast(berries?'Arbuste et 2 baies ajoutés au sac.':'Élément récupéré intact, sans remboursement d’énergie.');commit();drawSelection();}
function performInstall(action){
 const o=state.objects.find(v=>v.id===ui.stationId&&v.placed);if(!o)return;
 if(action==='nursery'&&o.type==='pepiniere'&&!o.stage){
  if(!amount('carotte'))return toast('Il te faut une carotte.');if(!pay(2))return;
  give('carotte',-1);o.stage=1;nextReady(o,TEST_HOURS.pepiniere);
  sound('craft');toast('Pépinière en production : portes fermées.');
 }else if(action==='nursery-collect'&&o.type==='pepiniere'&&o.stage===2){
  give('jeunes_plants',4);o.stage=0;o.readyAt=null;sound('gather');toast('4 jeunes plants récupérés.');
 }else if(action==='plant'&&o.type==='potager'&&!o.stage){
  if(amount('jeunes_plants')<4)return toast('Il te faut 4 jeunes plants.');if(!pay(1))return;
  give('jeunes_plants',-4);o.stage=1;nextReady(o,TEST_HOURS.potager);sound('place');toast('4 jeunes plants repiqués.');
 }else if(action==='inoculate'&&o.type==='champignonniere'&&!o.seeded){
  if(amount('champignon')<1)return toast('Il faut un champignon pour ensemencer.');
  if(!pay(1))return;give('champignon',-1);
  o.seeded=true;o.variety='champignon';o.stage=1;nextReady(o,TEST_HOURS.champignonniere);
  sound('place');toast('Champignonnière ensemencée · 1 champignon et 1 énergie.');
 }else if(action==='grow'&&['pepiniere','potager','champignonniere','arbuste'].includes(o.type)){
  if(o.type==='pepiniere'&&o.stage===1)o.stage=2;
  else if(o.type==='potager'&&o.stage===1)o.stage=2;
  else if(o.type==='champignonniere'&&o.seeded&&o.stage===1)o.stage=2;
  else if(o.type==='arbuste'&&o.stage<3)o.stage=3;
  else return;
  o.readyAt=null;sound('click');toast('Maturité déclenchée manuellement, uniquement pour le prototype de test.');
 }else if(action==='harvest-garden'&&o.type==='potager'&&o.stage===2){
  if(!pay(2))return;give('carotte',8);o.stage=0;o.readyAt=null;sound('gather');toast('Récolte : +8 carottes. À replanter.');
 }else if(action==='harvest-mushrooms'&&o.type==='champignonniere'&&o.stage===2){
  if(!pay(2))return;give('champignon',4);o.stage=1;nextReady(o,TEST_HOURS.champignonniere);
  sound('gather');toast('Récolte : +4 champignons. Nouvelle pousse en cours.');
 }else if(action==='harvest-bush'&&o.type==='arbuste'&&o.stage===3){
  if(!pay(1))return;give('baies',2);o.stage=2;nextReady(o,TEST_HOURS.arbuste);
  sound('gather');toast('Récolte : +2 baies ; l’arbuste reste nu et repoussera.');
 }else if(action==='rest'&&o.type==='paillasse'){
  sound('click');toast('Un instant de repos, sans bonus ni passage automatique de la nuit.');return;
 }else return;
 commit();drawSelection();
}
function transferChest(action,key){const o=state.objects.find(v=>v.id===ui.stationId&&v.type==='coffre'&&v.placed);if(!o)return;
 if(!o.contents)o.contents={};if(action==='deposit'){if(!amount(key))return;give(key,-1);o.contents[key]=(o.contents[key]||0)+1;}
 else if(action==='withdraw'){if(!o.contents[key])return;o.contents[key]--;if(!o.contents[key])delete o.contents[key];give(key,1);}
 sound('click');commit();}
function spriteFor(o){if(!o.placed)return o.type==='bush'&&o.harvested?'bush_empty':o.type;
 if(o.type==='pepiniere')return o.stage===2?'pepiniere_prete':'pepiniere';
 if(o.type==='potager')return ['potager','potager_young','potager_ripe'][o.stage||0];
 if(o.type==='champignonniere')return ['champignonniere','champignonniere_young','champignonniere_ripe'][o.stage||0];
 if(o.type==='arbuste')return ['bush_root','bush_planted','bush_empty','bush'][o.stage??1];
 return o.type;
}
function displayName(o){return o.placed?(o.type==='arbuste'?'Arbuste transplanté':CRAFT[o.type]?.name||o.type):COLLECT[o.type]?.name||o.type;}
function drawSelection(){const el=$('selection'),o=state.objects.find(v=>v.id===ui.selection);
 if(!o){el.hidden=true;return;}
 el.hidden=false;let d=Math.hypot(state.player.x-o.x,state.player.y-o.y),near=d<118;
 let note=near?'À portée.':ui.auto?.id===o.id?'En approche…':'Hors de portée.',actions='';
 if(o.placed){
  if(['pepiniere','potager','champignonniere','arbuste','coffre','etabli','paillasse'].includes(o.type))actions+=`<button data-object-action="open">Interagir</button>`;
  actions+=`<button data-object-action="pickup">Récupérer avec ${o.type==='arbuste'?'la pelle':'le marteau'}</button>`;
 }else{
  const r=COLLECT[o.type];
  if(o.type==='bush'&&o.harvested)actions+=`<div class="notice">Baies cueillies : l’arbuste reste nu. ${timeRemaining(o.readyAt)}</div><button data-object-action="regrow">Faire repousser (test)</button>`;
  else actions+=`<button data-object-action="gather">${r.tool?'Exploiter':'Ramasser / cueillir'} · ${r.cost} énergie</button>`;
  if(o.type==='bush')actions+=`<button data-object-action="uproot">Déterrer · 2 énergie</button>`;
 }
 el.innerHTML=`<strong>${displayName(o)}</strong><p>${note}</p>${actions}`;
}
function interactWith(o,kind='gather'){
 if(!o)return;
 if(MapControls===DirectMapControls&&(kind==='open'||kind==='station')){openObjectMenu(o);return;}
 const d=Math.hypot(o.x-state.player.x,o.y-state.player.y);
 if(d>115){ui.auto={x:o.x,y:o.y,id:o.id,action:kind};toast('Ton personnage s’approche.');return;}
 if(kind==='regrow'&&o.type==='bush'){o.harvested=false;o.readyAt=null;toast('Repousse accélérée pour les tests.');commit();drawSelection();return;}
 if(kind==='open'||kind==='station'){ui.stationId=o.id;if(['feu','marmite'].includes(o.type))setTab('station');else if(o.type==='etabli'){ui.craftFilter='construction';setTab('craft');}else setTab('installation');sound('click');return;}
 if(kind==='gather')gather(o);
 if(kind==='uproot')uproot(o);
 if(kind==='preview')advanceVisual(o);
 if(kind==='pickup')pickup(o);
}
function placeStart(key){if(!amount(key)){toast('Cet objet n’est plus dans ton sac.');return;}
 if(key!=='arbuste'&&!CRAFT[key])return;
 if(CRAFT[key]?.kind==='outil'){toast('Les outils sont conservés dans le sac.');return;}
 ui.placing=key;ui.hover={x:state.player.x+80,y:state.player.y+20};closePanel();$('placementHelp').hidden=false;$('placementLabel').textContent=`Placement : ${LABEL[key]||key} × ${amount(key)}`;
 $('sceneHint').textContent=`Placement : clique sur le sol pour poser « ${LABEL[key]||key} » · Échap pour annuler.`;
 toast('Choisis un emplacement libre sur la carte.');
}
function stopPlacing(){ui.placing=null;$('placementHelp').hidden=true;$('sceneHint').textContent='Double toucher : marcher · glisser : carte · pincer : zoom';}
function floorCoords(x,y){
 const x0=x-FLOOR_GRID_ORIGIN.x,y0=y-FLOOR_GRID_ORIGIN.y;
 const a=FLOOR_BASIS.a,b=FLOOR_BASIS.b,det=a.x*b.y-a.y*b.x;
 return {u:(x0*b.y-y0*b.x)/det,v:(y0*a.x-x0*a.y)/det};
}
function floorWorld(u,v){return {x:FLOOR_GRID_ORIGIN.x+u*FLOOR_BASIS.a.x+v*FLOOR_BASIS.b.x,y:FLOOR_GRID_ORIGIN.y+u*FLOOR_BASIS.a.y+v*FLOOR_BASIS.b.y};}
function placementPoint(key,x,y){
 // Un même réseau 2D oblique pour toutes les dalles, et non des snaps successifs
 // (qui accumulaient les erreurs à chaque pose et finissaient par se chevaucher).
 if(key==='sol'){
  const coord=floorCoords(x,y);let best=null,dmin=Infinity;
  for(let u=Math.round(coord.u)-2;u<=Math.round(coord.u)+2;u++)for(let v=Math.round(coord.v)-2;v<=Math.round(coord.v)+2;v++){
   const w=floorWorld(u,v),d=Math.hypot(w.x-x,(w.y-y)*ui.camera.squash);
   if(d<dmin){best=w;dmin=d;}
  }
  return best;
 }
 const walls=['mur','porte','fenetre','cloture','portillon'];
 if(walls.includes(key)){
  // Les murs s'alignent bord à bord sur une même rangée horizontale.
  let best=null,dist=Infinity;
  for(const o of state.objects){if(!o.placed||!walls.includes(o.type))continue;
   for(const delta of [-WALL_STEP,WALL_STEP]){const xx=o.x+delta,yy=o.y;
    const d=Math.hypot(x-xx,(y-yy)*ui.camera.squash);
    if(d<dist){dist=d;best={x:xx,y:yy};}
   }
  }
  if(best&&dist<60)return best;
  return {x:Math.round(x/WALL_STEP)*WALL_STEP,y:Math.round(y/64)*64};
 }
 return {x:Math.round(x/64)*64,y:Math.round(y/64)*64};
}
function tryPlace(worldX,worldY){let key=ui.placing;if(!key)return;
 let {x,y}=placementPoint(key,worldX,worldY);
 if(Math.hypot(x-state.player.x,y-state.player.y)>255){toast('Approche-toi de l’emplacement pour construire.');return;}
 if(x<90||y<90||x>WORLD.width-90||y>WORLD.height-90){toast('Emplacement hors de la région accessible.');return;}
 const flat=['sol','chemin_terre','chemin_pierre','toit'].includes(key);
 const walls=['mur','porte','fenetre','cloture','portillon'];
 const obstructed=state.objects.some(o=>{
  const distance=Math.hypot(o.x-x,o.y-y),sameLayer=key==='sol'?o.type==='sol':key==='toit'?o.type==='toit':walls.includes(key)?walls.includes(o.type):o.type===key;
  if(o.placed&&sameLayer)return key==='sol'?distance<25:distance<26;
  if(flat||walls.includes(key))return !o.placed&&['tree','rock'].includes(o.type)&&distance<30;
  if(o.placed&&['sol','toit',...walls].includes(o.type))return false;
  return distance<(o.placed?56:40);
 });
 if(obstructed){toast('Cet emplacement est déjà occupé.');return;}
 if(key==='arbuste'&&!pay(1))return;
 give(key,-1);const placed={id:state.nextId++,type:key,x,y,placed:true,stage:key==='arbuste'?1:0};
 if(key==='arbuste')nextReady(placed,TEST_HOURS.arbusteFirst);state.objects.push(placed);
 sound('place');toast(`${LABEL[key]||key} installé${key==='arbuste'?' (1 énergie)':''}.`);
 if(!amount(key))stopPlacing();else $('placementLabel').textContent=`Placement : ${LABEL[key]||key} × ${amount(key)}`;
 commit();
}
function registerActivity(){const mins=Number($('mins')?.value||0),secs=Number($('secs')?.value||0);
 if(!Number.isSafeInteger(mins)||mins<0||mins>100000||!Number.isSafeInteger(secs)||secs<0||secs>59||mins*60+secs===0){toast('Saisis une durée positive en minutes et secondes.');return;}
 const mode=state.mode,tot=(state.remainders[mode]||0)+mins*60+secs,gain=Math.floor(tot/MODES[mode]);
 state.remainders[mode]=tot%MODES[mode];state.sport+=gain;log(`Sport : ${mins} min ${secs} s, +${gain} points (${mode})`);
 toast(`+${gain} énergie sportive · ${state.remainders[mode]} s conservées.`);commit();}
function registerCardio(){const date=$('cardioDate')?.value,total=Number($('cardioAmount')?.value);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!Number.isSafeInteger(total)||total<0||total>1000000){toast('Indique une date et un total de points cardio valide.');return;}
 const prev=Number(state.cardioDays[date]||0),delta=Math.max(0,total-prev);
 state.cardioDays[date]=Math.max(prev,total);state.sport+=delta*2;
 toast(delta?`+${delta*2} énergie sportive (${delta} nouveaux points cardio).`:'Déjà crédité pour ce jour : aucun doublon.');
 if(delta)log(`Cardio ${date} : ${delta} points, +${delta*2} sportifs`);commit();}
function exportSave(){saveNow();let data=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=`veilleurs-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),800);toast('Fichier de sauvegarde exporté.');}
async function importSave(file){if(!file)return;
 try{if(file.size>12000000)throw Error('Fichier trop volumineux.');let imported=JSON.parse(await file.text());if(!validateSave(imported))throw Error('Format non compatible avec cette version.');
 if(!confirm('Importer cette sauvegarde ? Elle remplacera ta partie actuelle sur cet appareil.'))return;
 state=imported;spaceWildResources(state);migrateSave(state);applyAudioSettings();ui.selection=null;stopPlacing();ui.auto=null;ui.camera.x=state.player.x;ui.camera.y=state.player.y;saveNow();commit();toast('Sauvegarde importée.');}
 catch(e){toast('Import impossible : '+e.message);}
}
function handlePanelClick(e){let b=e.target.closest('button[data-action]');if(!b)return;let act=b.dataset.action,k=b.dataset.key;
 if(ui.objectMenu!=null&&STATION_ACTIONS.includes(act)){requestStationAction(act,k);return;}
 if(act==='exercise')registerActivity();else if(act==='cardio')registerCardio();else if(act==='craft')craft(k);
 else if(act==='cook')cook(k);else if(['nursery','nursery-collect','plant','inoculate','grow','harvest-garden','harvest-mushrooms','harvest-bush','rest'].includes(act))performInstall(act);else if(['deposit','withdraw'].includes(act))transferChest(act,k);else if(act==='quick')toggleQuickTool(k);else if(act==='craft-filter'){ui.craftFilter=k;renderPanel();}else if(act==='equip')equipTool(k);else if(act==='eat')eat(k==='baies_crues'?'baies':k);else if(act==='place')placeStart(k);
 else if(act==='save')saveNow(true);else if(act==='export')exportSave();else if(act==='reset'){
 if(confirm('Recommencer une nouvelle partie ? Cette action effacera ta progression locale. Pense à exporter ta sauvegarde avant.')){state=newState();ui.selection=null;ui.auto=null;stopPlacing();ui.camera.x=state.player.x;ui.camera.y=state.player.y;saveNow();commit();toast('Nouvelle partie commencée.');}}
}
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);W=window.innerWidth;H=window.innerHeight;canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
function project(x,y){let c=ui.camera;return {x:W/2+(x-c.x)*c.zoom,y:H/2+(y-c.y)*c.zoom*c.squash};}
function unproject(x,y){let c=ui.camera;return {x:c.x+(x-W/2)/c.zoom,y:c.y+(y-H/2)/(c.zoom*c.squash)};}
function sizeFor(o,spr){let h=SIZES[spr]||90;return h;}
function objectRect(o){let spr=spriteFor(o),img=IMAGES[spr];if(!img)return null;const pt=project(o.x,o.y),h=sizeFor(o,spr)*ui.camera.zoom,w=h*img.naturalWidth/img.naturalHeight;
 return {x:pt.x-w/2,y:pt.y-h,w,h,foot:pt};}
// Les masques binaires précalculés évitent getImageData() sur des images chargées
// depuis file:// : Chrome/Edge interdisent souvent cette lecture de pixels.
const ALPHA_HIT_CACHE={};
function hasSpritePixel(spr,px,py,rect){
 if(px<rect.x||px>=rect.x+rect.w||py<rect.y||py>=rect.y+rect.h)return false;
 let data=ALPHA_HIT_CACHE[spr];
 if(!data){
  const entry=typeof PRECOMPUTED_HIT_MASKS!=='undefined'?PRECOMPUTED_HIT_MASKS[spr]:null;
  if(!entry)return false;
  const [w,h,b64]=entry, raw=atob(b64),bits=Uint8Array.from(raw,c=>c.charCodeAt(0));
  data=ALPHA_HIT_CACHE[spr]={w,h,bits};
 }
 const ix=Math.min(data.w-1,Math.max(0,Math.floor((px-rect.x)/rect.w*data.w)));
 const iy=Math.min(data.h-1,Math.max(0,Math.floor((py-rect.y)/rect.h*data.h)));
 const bit=iy*data.w+ix;
 return (data.bits[bit>>3] & (1<<(bit&7)))!==0;
}
function objectAt(px,py){
 let exact=[],near=[];
 for(const o of state.objects){const r=objectRect(o);if(!r)continue;
  const spr=spriteFor(o);
  if(hasSpritePixel(spr,px,py,r)){exact.push(o);continue;}
  // Tolérance de 10 à 15 pixels adaptée aux petits éléments et au tactile.
  const pad=Math.min(16,Math.max(9,26-r.w*.16)),cx=Math.max(r.x,Math.min(px,r.x+r.w)),cy=Math.max(r.y,Math.min(py,r.y+r.h));
  if(Math.hypot(px-cx,py-cy)>pad)continue;
  for(const [dx,dy] of [[-pad/2,0],[pad/2,0],[0,-pad/2],[0,pad/2]]){
   if(hasSpritePixel(spr,px+dx,py+dy,r)){near.push(o);break;}
  }
 }
 const matches=(exact.length?exact:near).sort((a,b)=>b.y-a.y);
 if(!matches.length){ui.lastHit=null;return null;}
  if(MapControls===DirectMapControls){const selected=matches.find(o=>o.id===ui.selection);return selected||matches[0];}
 // Cliquer à nouveau au même endroit sélectionne un objet derrière celui de devant.
 const now=Date.now();let index=0;
 if(ui.lastHit&&now-ui.lastHitAt<1900&&Math.hypot(ui.lastHit.x-px,ui.lastHit.y-py)<19&&matches.length>1)
   index=(ui.lastHit.index+1)%matches.length;
 ui.lastHit={x:px,y:py,index};ui.lastHitAt=now;
 return matches[index];
}
function canWalk(x,y){if(x<55||x>WORLD.width-55||y<55||y>WORLD.height-55)return false;
 for(let o of state.objects){if(o.trialFixture||o.placed&&['arbuste','feu','marmite','pepiniere','potager','champignonniere'].includes(o.type)||!['tree','orties','rock','bush','arbuste','feu','etabli','coffre','marmite','pepiniere','champignonniere','potager'].includes(o.type))continue;
 let radius=['tree','orties'].includes(o.type)?35:o.type==='rock'?30:o.type==='bush'?24:23;
 if(Math.hypot(o.x-x,o.y-y)<radius+12)return false;
 }return true;}
function movePlayer(vx,vy,dt){let mag=Math.hypot(vx,vy);if(!mag)return false;vx/=mag;vy/=mag;
 let p=state.player,speed=195,dx=vx*speed*dt,dy=vy*speed*dt;let did=false;
 if(canWalk(p.x+dx,p.y)){p.x+=dx;did=true;}if(canWalk(p.x,p.y+dy)){p.y+=dy;did=true;}
 if(Math.abs(vx)>.32)p.face=vx>0?'right':'left';else if(Math.abs(vy)>.20)p.face=vy>0?'person':'back';
 return did;}
let lastMovedStamp=0,lastPanelRefresh=0,lastCropTick=0;
function update(dt){if(Date.now()-lastCropTick>2200){lastCropTick=Date.now();updateNatureAndCrops();if(ui.open&&ui.tab==='installation')renderPanel();}const pressed=k=>!MapControls.active&&(ui.keys.has(k)||ui.touch.has(k));let vx=0,vy=0;
 if(['a','q','arrowleft'].some(pressed))vx--;if(['d','arrowright'].some(pressed))vx++;
 if(['w','z','arrowup'].some(pressed))vy--;if(['s','arrowdown'].some(pressed))vy++;
 let moved=false;
 if(vx||vy){ui.auto=null;moved=movePlayer(vx,vy,dt);}
  else if(ui.auto){let dest=ui.auto,dist=Math.hypot(dest.x-state.player.x,dest.y-state.player.y),r=dest.id?110:3;
   if(dest.id&&!state.objects.some(o=>o.id===dest.id)){ui.auto=null;dismissObjectMenu();}
   else if(dist<=r){let cmd=ui.auto;ui.auto=null;if(cmd.id){let o=state.objects.find(v=>v.id===cmd.id);if(cmd.command){if(ui.objectMenu===cmd.id&&ui.selection===cmd.id)requestStationAction(cmd.command,cmd.key);}else interactWith(o,cmd.action);}drawSelection();}
  else {
   if(!dest.route){dest.route=constructionTrial.navigation.plan(state.player,dest,dest.id?105:0);dest.index=0;}
   if(!dest.route){ui.auto=null;toast('Aucun passage accessible : ouvre la porte ou choisis un autre endroit.');}
   else {while(dest.index<dest.route.length-1&&Math.hypot(dest.route[dest.index].x-state.player.x,dest.route[dest.index].y-state.player.y)<3)dest.index++;
    const next=dest.route[dest.index];if(next){const dx=next.x-state.player.x,dy=next.y-state.player.y,d=Math.hypot(dx,dy);
     if(!constructionTrial.navigation.clear(state.player,next)){dest.route=null;}
     else {moved=movePlayer(dx,dy,Math.min(dt,d/195));if(!moved&&d>3){dest.route=null;}}}
    else {ui.auto=null;}
   }
  }
 }
 if(moved&&!ui.walkMoving)ui.walkClock=0;ui.walkMoving=!!moved;if(moved){ui.walkClock+=dt;if(ui.walkClock-ui.lastStep>.56){ui.lastStep=ui.walkClock;sound('step');}}else {ui.walkClock=0;ui.lastStep=0;}
 if(!ui.camera.free){let c=ui.camera;c.x+=(state.player.x-c.x)*Math.min(1,dt*5);c.y+=(state.player.y-120/(c.zoom*c.squash)-c.y)*Math.min(1,dt*5);}
 if(moved&&performance.now()-lastMovedStamp>1900){lastMovedStamp=performance.now();saveSoon();}
 if(moved&&performance.now()-lastPanelRefresh>1000&&ui.open&&['craft','station'].includes(ui.tab)){lastPanelRefresh=performance.now();renderPanel();}
}
function makePatch(p){const rx=Math.ceil(p.rx),ry=Math.ceil(p.ry),w=rx*2,h=ry*2;
 let surface=document.createElement('canvas');surface.width=w;surface.height=h;
 let c=surface.getContext('2d');let pattern=c.createPattern(IMAGES.terrain1,'repeat');
 if(!pattern)return null;
 c.translate(-(p.x-rx),-(p.y-ry));c.fillStyle=pattern;c.fillRect(p.x-rx,p.y-ry,w,h);
 c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-in';
 c.translate(rx,ry);c.scale(rx,ry);
 let g=c.createRadialGradient(0,0,.02,0,0,1);
 g.addColorStop(0,'rgba(0,0,0,0.96)');g.addColorStop(.37,'rgba(0,0,0,0.88)');g.addColorStop(.68,'rgba(0,0,0,0.55)');g.addColorStop(.87,'rgba(0,0,0,0.16)');g.addColorStop(1,'rgba(0,0,0,0)');
 c.fillStyle=g;c.fillRect(-1,-1,2,2);
 return surface;
}
function drawGround(){let c=ui.camera,z=c.zoom,k=c.squash,halfX=W/(2*z),halfY=H/(2*z*k);
 ctx.save();ctx.setTransform(dpr*z,0,0,dpr*z*k,dpr*(W/2-c.x*z),dpr*(H/2-c.y*z*k));
 const left=c.x-halfX-3,top=c.y-halfY-3,rw=halfX*2+6,rh=halfY*2+6;
 if(groundPattern){ctx.fillStyle=groundPattern;ctx.fillRect(left,top,rw,rh);}else{ctx.fillStyle='#5f6439';ctx.fillRect(left,top,rw,rh);}
 for(let p of patches){if(p.x+p.rx<left||p.x-p.rx>left+rw||p.y+p.ry<top||p.y-p.ry>top+rh)continue;
  if(p.surface)ctx.drawImage(p.surface,p.x-p.rx,p.y-p.ry);
 }
 if(ui.placing){let span=64;ctx.save();ctx.strokeStyle='#ddd9b127';ctx.lineWidth=1/z;ctx.beginPath();
 const xa=Math.floor(left/span)*span,ya=Math.floor(top/span)*span;
 for(let x=xa;x<left+rw;x+=span){ctx.moveTo(x,top);ctx.lineTo(x,top+rh);}
 for(let y=ya;y<top+rh;y+=span){ctx.moveTo(left,y);ctx.lineTo(left+rw,y);}
 ctx.stroke();ctx.restore();}
 ctx.restore();}
function drawOval(x,y,rx,ry,color){ctx.save();ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawSprite(spr,x,y,height,alpha=1){let img=IMAGES[spr];if(!img)return;
 let h=height*ui.camera.zoom,w=h*img.width/img.height,pt=project(x,y);
 if(pt.x+w/2<0||pt.x-w/2>W||pt.y< -10||pt.y-h>H)return;
 ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,pt.x-w/2,pt.y-h,w,h);ctx.restore();}
function drawObject(o){let spr=spriteFor(o);if(!IMAGES[spr])return;
 const pt=project(o.x,o.y),r=objectRect(o);
 if(!r||r.x>W+25||r.x+r.w< -25||r.y>H+25||r.y+r.h< -25)return;
 const flat=['sol','chemin_terre','chemin_pierre'].includes(o.type);
 if(!flat)drawOval(pt.x,pt.y,Math.max(10,r.w*.27),Math.max(3,r.w*.054), '#20261c4c');
 let alpha=1;
 if(['toit','mur','porte','fenetre'].includes(o.type)){
  const inside=state.objects.some(a=>a.placed&&a.type==='sol'&&Math.hypot(a.x-state.player.x,a.y-state.player.y)<82);
  const close=Math.hypot(o.x-state.player.x,o.y-state.player.y)<135;
  if(inside&&close)alpha=.22;
 }
 drawSprite(spr,o.x,o.y,sizeFor(o,spr),alpha);
 if(o.id===ui.selection){ctx.save();ctx.strokeStyle='#e2bd77';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(pt.x,pt.y,Math.max(12,r.w*.29),Math.max(6,r.w*.075),0,0,Math.PI*2);ctx.stroke();ctx.restore();}
}
function drawPlayer(){
 const p=state.player,pt=project(p.x,p.y);drawOval(pt.x,pt.y,20*ui.camera.zoom,6*ui.camera.zoom,'#22261966');
 // Plus d'animation cyclique. Au départ d'un déplacement latéral, une seule pose
 // validée est montrée brièvement ; la posture debout revient ensuite et à l'arrêt.
 if(ui.walkMoving&&(p.face==='right'||p.face==='left')&&ui.walkClock<.18&&IMAGES.walk1){
  const im=IMAGES.walk1,ht=SIZES.person*ui.camera.zoom,wd=ht*im.width/im.height;
  ctx.save();if(p.face==='left'){ctx.translate(pt.x,0);ctx.scale(-1,1);ctx.drawImage(im,-wd/2,pt.y-ht,wd,ht);}
  else ctx.drawImage(im,pt.x-wd/2,pt.y-ht,wd,ht);
  ctx.restore();return;
 }
 drawSprite(p.face,p.x,p.y,SIZES.person);
}
function drawGhost(){if(!ui.placing||!ui.hover)return;let p=ui.hover,key=ui.placing,{x,y}=placementPoint(key,p.x,p.y);
 const spr=key==='arbuste'?'bush_planted':key;
 if(!IMAGES[spr])return;
 drawSprite(spr,x,y,sizeFor({type:key},spr),.52);
 const screen=project(x,y);ctx.save();ctx.strokeStyle='#e7d4a6';ctx.lineWidth=1;ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(screen.x,screen.y,34*ui.camera.zoom,12*ui.camera.zoom,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
function render(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);drawGround();
 const visible=state.objects.filter(o=>{let p=project(o.x,o.y);return p.x>-330&&p.x<W+330&&p.y>-320&&p.y<H+330;});
 const flat=visible.filter(o=>o.placed&&['sol','chemin_terre','chemin_pierre'].includes(o.type));
 flat.sort((a,b)=>a.y-b.y).forEach(drawObject);
 const sprites=visible.filter(o=>!flat.includes(o)).map(o=>({kind:'object',y:o.y,o}));sprites.push({kind:'player',y:state.player.y});
 sprites.sort((a,b)=>a.y-b.y);
 sprites.forEach(item=>{if(item.kind==='player')drawPlayer();else drawObject(item.o);});
 drawGhost();}
let previous=0;
function frame(timestamp){const dt=Math.max(0,Math.min((timestamp-previous)/1000,.06));previous=timestamp;
 ui.time=timestamp;update(dt);render();requestAnimationFrame(frame);}
function activateAt(x,y){
  let world=unproject(x,y);ui.hover=world;
  if(ui.placing){tryPlace(world.x,world.y);return;}
  let found=objectAt(x,y);
  if(found){ui.selection=found.id;drawSelection();
    if(!found.placed){if(!(found.type==='bush'&&found.harvested))interactWith(found);}
    else interactWith(found,'open');
  }
  else {ui.selection=null;drawSelection();ui.auto={x:world.x,y:world.y,id:null};}
}
function initEvents(){window.addEventListener('resize',resize);
 window.addEventListener('beforeunload',()=>saveNow());
 window.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow();});
 document.querySelectorAll('.dock button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.tab==='craft')ui.stationId=null;ui.open&&ui.tab===b.dataset.tab?closePanel():setTab(b.dataset.tab);}));
 $('panelClose').addEventListener('click',closePanel);
 $('btnSave').addEventListener('click',()=>saveNow(true));
 $('openSport').addEventListener('click',()=>ui.open&&ui.tab==='sport'?closePanel():setTab('sport'));
 $('cancelPlacement').addEventListener('click',()=>stopPlacing());
 $('zoomPlus').addEventListener('click',()=>setZoom(ui.camera.zoom+.1));
 $('zoomMinus').addEventListener('click',()=>setZoom(ui.camera.zoom-.1));
 $('panelBody').addEventListener('click',handlePanelClick);

 $('panelBody').addEventListener('change',e=>{
  if(e.target.id==='mode'){
   if(!MODES[e.target.value])return;state.mode=e.target.value;toast('Mode modifié. Les secondes non converties restent associées à leur mode d’origine.');commit();
  }
  if(e.target.id==='importFile')importSave(e.target.files?.[0]);
  if(e.target.id==='musicToggle'||e.target.id==='sfxToggle'){if(!state.audio)state.audio={music:false,sfx:false};state.audio[e.target.id==='musicToggle'?'music':'sfx']=e.target.checked;applyAudioSettings();sound('click');commit();}
 });
 $('selection').addEventListener('click',e=>{let button=e.target.closest('[data-object-action]');if(!button)return;
  const o=state.objects.find(v=>v.id===ui.selection);interactWith(o,button.dataset.objectAction);
 });
 canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;ui.mouse={x,y};ui.hover=unproject(x,y);});
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')e.preventDefault();const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  activateAt(x,y);
 });
 window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){stopPlacing();dismissObjectMenu();return;}
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','z','q'].includes(key)){e.preventDefault();ui.keys.add(key);}
 });
 window.addEventListener('keyup',e=>ui.keys.delete(e.key.toLowerCase()));
 window.addEventListener('blur',()=>{ui.keys.clear();ui.touch.clear();ui.walkMoving=false;ui.walkClock=0;});
 window.addEventListener('pointerdown',()=>{if(state?.audio?.music&&$('forestMusic')?.paused)applyAudioSettings();},{passive:true});
 window.addEventListener('keydown',()=>{if(state?.audio?.music&&$('forestMusic')?.paused)applyAudioSettings();},{passive:true});
 document.querySelectorAll('.mobile-controls button').forEach(button=>{
  let dir=button.dataset.dir;
  const release=e=>{if(e)e.preventDefault();ui.touch.delete('arrow'+dir);button.classList.remove('pressed');};
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);ui.touch.add('arrow'+dir);button.classList.add('pressed');});
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
 });
}
function setZoom(z){ui.camera.zoom=Math.max(.35,Math.min(1.5,Math.round(z*10)/10));$('zoomValue').textContent=Math.round(ui.camera.zoom*100)+' %';}
async function boot(){try{
 state=loadSave();saveNow();idSequence=state.nextId||1;ui.camera.x=state.player.x;ui.camera.y=state.player.y;
 resize();initPatches();initEvents();updateHUD();closePanel();applyAudioSettings();
 await loadAssets();if(IMAGES.terrain0){groundPattern=ctx.createPattern(IMAGES.terrain0,'repeat');}
 if(IMAGES.terrain1)for(let p of patches)p.surface=makePatch(p);updateNatureAndCrops();
 $('loading').classList.add('hidden');requestAnimationFrame(frame);
 }catch(e){console.error(e);SaveContinuity.recovery(e);}}
// API limitée aux contrôles qualité locaux ; ne confère aucun bonus au jeu.
window.__veilleursTest={getState:()=>structuredClone(state),project:(x,y)=>project(x,y),unproject:(x,y)=>unproject(x,y)};
// Démarrage piloté par integration.js, après chargement de la construction.

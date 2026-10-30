/* Malle V17 retenue provisoirement : raccordement limité à la maison témoin locale. */
'use strict';
const MalleTrial=(()=>{
 const enabled=new URLSearchParams(location.search).has('maison-test'),M=ValidatedModel,G=LabGeometry;
 const size=[.7619214794232412,.5791242122650146],images={};let api,moving=null,rotation=0;
 const isFixture=o=>enabled&&o?.placed&&o.type==='coffre'&&o.expeditionPreview===true;
 if(enabled)M.specs.malle={name:'Malle d’expédition',states:[''],size,centered:true};
 const needsMigration=s=>enabled&&s.objects.some(o=>isFixture(o)&&(o.malleTrialVersion!==1||!Number.isInteger(o.rot)));
 function migrate(s){if(enabled)for(const o of s.objects.filter(isFixture)){if(!Number.isInteger(o.rot))o.rot=0;o.malleTrialVersion=1;}return s;}
 function model(o,point=o,rot=o.rot||0){const q=api.toGrid(point.x,point.y),dims=rot%2?[...size].reverse():size;return {key:'malle',stage:'',rot,u:q.u-dims[0]/2,v:q.v-dims[1]/2,sourceId:o.id};}
 const models=()=>api?state.objects.filter(isFixture).map(o=>model(o)):[];
 function bounds(o){return M.bounds(model(o),api.screenCamera(),G);}
 async function load(){if(!enabled)return {};await Promise.all([0,1,2,3].map(async r=>{const im=new Image();im.src='construction/malle-v17/malle-'+r*90+'.png';await im.decode();images['malle-'+r*90+'.png']=im;}));return images;}
 async function loadDepths(){if(!enabled)return {};const response=await fetch('construction/malle-v17/profondeurs.json');if(!response.ok)throw Error('Profondeur de la malle indisponible.');const atlas=await response.json(),maps={};for(const[key,raw]of Object.entries(atlas.maps)){const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));maps[key]=new Uint16Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());}return maps;}
 function evaluate(o,point,rot=o?.rot||0){
  const fail=reason=>({valid:false,reason});if(!isFixture(o))return fail('Malle indisponible.');if(!hasTool('marteau'))return fail('Marteau équipé requis.');
  const m=model(o,point,rot),poly=M.rect(m),q=api.toGrid(state.player.x,state.player.y);
  if(poly.some(([u,v])=>u<0||v<0||u>4||v>4))return fail('Garde la malle dans la maison témoin.');
  if(M.blocked([q.u,q.v],[m],[],DoorGeometry,G))return fail('Le personnage occupe cet emplacement.');
  const result=M.evaluate(m,api.objects.filter(p=>p.sourceId!==o.id),api.walls,DoorGeometry,G,true);return {...result,m,point,rot};
 }
 function persist(o,point,rot){const old={x:o.x,y:o.y,rot:o.rot};Object.assign(o,{x:point.x,y:point.y,rot});if(!saveNow()){Object.assign(o,old);return false;}api.refreshFloors();render();return true;}
 function turn(o){const rot=((o?.rot||0)+1)%4,r=evaluate(o,o,rot);if(!r.valid){toast(r.reason);return false;}const ok=persist(o,o,rot);if(ok)renderPanel();return ok;}
 function start(o){if(!isFixture(o))return false;if(!hasTool('marteau')){toast('Fabrique et équipe un marteau pour déplacer la malle.');return false;}FloorPlacement.stop();WallPlacement.stop();RoofPlacement.stop();stopPlacing();dismissObjectMenu();closePanel();moving=o.id;rotation=o.rot||0;ui.placing='coffre';ui.hover={x:o.x,y:o.y};$('placementHelp').hidden=false;$('placementLabel').textContent='Déplacer la malle';$('malleTurn').hidden=false;return true;}
 function candidate(x,y){const q=api.toGrid(x,y);return api.toWorld(Math.round(q.u*4)/4,Math.round(q.v*4)/4);}
 function applyMove(x,y){const o=state.objects.find(o=>o.id===moving),point=candidate(x,y),r=evaluate(o,point,rotation);if(!r.valid){toast(r.reason);return false;}if(!persist(o,point,rotation))return false;stopPlacing();return true;}
 function drawPreview(){if(moving===null||!ui.hover)return;const o=state.objects.find(o=>o.id===moving),point=candidate(ui.hover.x,ui.hover.y),r=evaluate(o,point,rotation),m=model(o,point,rotation),b=M.bounds(m,api.screenCamera(),G);ctx.save();ctx.globalAlpha=.7;ctx.drawImage(images[M.file(m)],b.x,b.y,b.w,b.h);ctx.globalAlpha=1;ctx.beginPath();M.rect(m).map(p=>G.project(...p,api.screenCamera())).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.strokeStyle=r.valid?'#c7ef99':'#ff8276';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
 function init(trial){api=trial;if(!enabled)return;
  const oldRect=objectRect;objectRect=o=>isFixture(o)?bounds(o):oldRect(o);
  const oldName=displayName;displayName=o=>isFixture(o)?'Malle d’expédition':oldName(o);
  const oldPickup=pickup;pickup=o=>isFixture(o)?toast('La malle témoin reste dans cette scène d’essai.'):oldPickup(o);
  const button=document.createElement('button');button.id='malleTurn';button.type='button';button.hidden=true;button.textContent='Tourner ↻';$('placementHelp').insertBefore(button,$('cancelPlacement'));button.onclick=()=>{if(moving!==null){rotation=(rotation+1)%4;drawPreview();}};
  const oldStop=stopPlacing;stopPlacing=function(){moving=null;button.hidden=true;oldStop();};
  const oldTry=tryPlace;tryPlace=(x,y)=>moving!==null?applyMove(x,y):oldTry(x,y);
  document.addEventListener('click',e=>{const b=e.target.closest('[data-malle-action]');if(!b)return;const o=state.objects.find(o=>o.id===ui.stationId&&isFixture(o));if(b.dataset.malleAction==='turn')turn(o);if(b.dataset.malleAction==='move')start(o);});
 }
 return {enabled,isFixture,needsMigration,migrate,model,models,bounds,load,loadDepths,init,evaluate,turn,start,applyMove,drawPreview,get moving(){return moving;}};
})();
if(MalleTrial.enabled){
 const baseNewState=newState;newState=function(){const s=baseNewState(),p=LabGeometry.project(2.65,1.6,{x:0,y:0,zoom:1}),requested=Number(new URLSearchParams(location.search).get('malle-rotation'))||0;s.objects.push({id:s.nextId++,type:'coffre',placed:true,stage:0,x:1500+p.x,y:1400+p.y/.7,expeditionPreview:true,malleTrialVersion:1,rot:Math.max(0,Math.min(3,requested))});return s;};
 const baseRenderPanel=renderPanel;renderPanel=function(){const o=state.objects.find(o=>o.id===ui.stationId&&MalleTrial.isFixture(o));if(ui.tab==='installation'&&o){ExpeditionPrep.header();$('panelBody').innerHTML=ExpeditionPrep.panel();return;}return baseRenderPanel();};
}

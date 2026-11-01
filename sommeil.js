/* Sommeil : fondu validé, progression nocturne enregistrée une seule fois au réveil. */
'use strict';
const PaillasseSleep=(()=>{
 let api,session=null,veil,label;
 const supports=o=>o?.placed&&o.type==='paillasse';
 const ease=t=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p);};
 function arrival(o){
  const q=api.toGrid(o.x,o.y),m=CultivationPlacement.model(o),[w,h]=ValidatedModel.dimensions(m);
  const candidates=[[-w/2-.22,0],[w/2+.22,0],[0,-h/2-.22],[0,h/2+.22]].map(([u,v])=>api.toWorld(q.u+u,q.v+v)).filter(p=>canWalk(p.x,p.y)).sort((a,b)=>Math.hypot(a.x-state.player.x,a.y-state.player.y)-Math.hypot(b.x-state.player.x,b.y-state.player.y));
  return candidates;
 }
 function journey(candidates){let index=0,job=null;return {step(budget=3){const until=performance.now()+budget;do{const point=candidates[index];if(!point)return {done:true,route:null,point:null};if(!job)job=api.navigation.begin(state.player,point);const result=job.step(Math.max(.1,until-performance.now()));if(!result.done)return {done:false};if(result.route)return {...result,point};index++;job=null;}while(performance.now()<until);return {done:false};}};}
 function request(o){
  if(session||!supports(o)||!state.objects.includes(o))return false;
  const candidates=arrival(o);if(!candidates.length){toast('Aucun côté accessible pour dormir sur cette paillasse.');return false;}
  const source=state,position={x:o.x,y:o.y,rot:o.rot||0};
  dismissObjectMenu();closePanel();ui.keys.clear();ui.touch.clear();
  session={id:o.id,source,position,point:candidates[0],phase:'approach',elapsed:0};
  const current=session,planning=journey(candidates),command={...candidates[0],id:null,index:0};command.pathJob={step(budget){const result=planning.step(budget);if(session===current&&result.done){if(result.point){current.point=result.point;Object.assign(command,result.point);}else current.noArrival=true;}return result;}};ui.auto=command;session.command=command;
  return true;
 }
 function clear(){session=null;ui.keys.clear();ui.touch.clear();ui.walkMoving=false;if(veil){veil.hidden=true;veil.style.opacity='0';}document.body.classList.remove('sleep-active');}
 function cancel(){if(!session)return;const approaching=session.phase==='approach';if(approaching&&ui.auto===session.command)ui.auto=null;clear();render();}
 function beginNight(){
  if(!saveNow()){cancel();return;}
  ui.auto=null;ui.keys.clear();ui.touch.clear();ui.walkMoving=false;ui.walkClock=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  session.phase='dusk';session.elapsed=0;session.fadeOut=reduced?250:1300;session.black=2200;session.fadeIn=reduced?300:1500;
  veil.hidden=false;veil.style.opacity='0';label.textContent='';label.style.opacity='0';document.body.classList.add('sleep-active');
 }
 function morning(){
  if(session.committed)return true;
  const o=state.objects.find(o=>o.id===session.id);let point=session.point;
  if(!canWalk(point.x,point.y)){if(!session.wakeJob)session.wakeJob=journey(arrival(o));const result=session.wakeJob.step(3);if(!result.done){session.elapsed=session.fadeOut+session.black;return false;}point=result.point;}
  if(!point){cancel();toast('Le côté de la paillasse n’est plus accessible.');return false;}
  if(!NightGrowth.sleep(point)){clear();drawSelection();render();return false;}
  session.committed=true;return true;
 }
 function finish(){clear();drawSelection();render();toast('Le jour se lève.');}
 function tick(dt){
  if(!session)return;
  const o=state.objects.find(o=>o.id===session.id);
  if(state!==session.source||!supports(o)||o.x!==session.position.x||o.y!==session.position.y||(o.rot||0)!==session.position.rot){cancel();return;}
  if(session.phase==='approach'){
   if(Math.hypot(state.player.x-session.point.x,state.player.y-session.point.y)<4){beginNight();return;}
   if(ui.auto!==session.command){const failed=session.noArrival;cancel();if(failed)toast('Aucun côté accessible pour dormir sur cette paillasse.');return;}return;
  }
  session.elapsed+=dt*1000;const t=session.elapsed,{fadeOut,black,fadeIn}=session;
  // Mettre le monde à jour pendant le noir, avant qu'il réapparaisse au matin.
  if(t>=fadeOut+black&&!morning())return;
  if(t<fadeOut){session.phase='dusk';veil.style.opacity=String(ease(t/fadeOut));label.style.opacity='0';}
  else if(t<fadeOut+black){session.phase='night';veil.style.opacity='1';label.textContent='C’est la nuit';label.style.opacity='1';}
  else if(t<fadeOut+black+fadeIn){session.phase='dawn';const opacity=1-ease((t-fadeOut-black)/fadeIn);veil.style.opacity=String(opacity);label.style.opacity=String(opacity);}
  else finish();
 }
 function init(trial){
  api=trial;
  veil=document.createElement('div');veil.id='sleepVeil';veil.hidden=true;veil.setAttribute('aria-hidden','true');document.body.append(veil);
  label=document.createElement('div');label.id='sleepStatus';label.setAttribute('role','status');label.setAttribute('aria-live','polite');document.body.append(label);
  const oldUpdate=update;update=function(dt){if(!PaillasseSleep.active)oldUpdate(dt);tick(dt);};
  const oldRequest=requestStationAction;requestStationAction=function(action,key){
   const o=state.objects.find(o=>o.id===ui.stationId);
   if(action==='rest'&&supports(o)&&ui.objectMenu===o.id&&ui.selection===o.id)return request(o);
   return oldRequest(action,key);
  };
  const oldPanel=renderPanel;renderPanel=function(){
   const o=state.objects.find(o=>o.id===ui.stationId);
   if(ui.tab!=='installation'||!supports(o))return oldPanel();
   $('panelTitle').textContent='Paillasse';document.querySelector('.eyebrow').textContent='COUCHAGE';
   $('panelBody').innerHTML='<button type="button" class="btn full" data-sleep="'+o.id+'">Dormir jusqu’au lendemain</button><p class="soft">Une nuit fait avancer chaque culture d’une étape.</p>';
  };
  const oldSelection=drawSelection;drawSelection=function(){oldSelection();const o=state.objects.find(o=>o.id===ui.selection);if(!supports(o)||ToolRecovery.active)return;
   const el=$('selection');el.hidden=false;el.replaceChildren();const title=document.createElement('strong');title.className='resource-summary';title.textContent='Paillasse';el.append(title);
   const b=document.createElement('button');b.type='button';b.dataset.sleep=String(o.id);b.textContent='Dormir jusqu’au lendemain';el.append(b);
   const p=document.createElement('p');p.textContent='Une nuit = une étape de pousse';el.append(p);
  };
  const click=e=>{const b=e.target.closest('[data-sleep]');if(!b)return;const o=state.objects.find(o=>o.id===Number(b.dataset.sleep));if(o&&ui.objectMenu===o.id)request(o);};$('selection').addEventListener('click',click);$('panelBody').addEventListener('click',click);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});window.addEventListener('pagehide',cancel);
 }
 return {init,request,cancel,supports,get active(){return !!session&&session.phase!=='approach';},get phase(){return session?.phase||'idle';}};
})();
// Ces intercepteurs précèdent les contrôles de carte, enregistrés pendant initEvents.
for(const type of ['pointerdown','pointerup','pointermove','wheel','keydown'])window.addEventListener(type,e=>{if(!PaillasseSleep.active)return;if(type==='keydown'&&e.key==='Escape')PaillasseSleep.cancel();e.preventDefault();e.stopImmediatePropagation();},{capture:true,passive:false});

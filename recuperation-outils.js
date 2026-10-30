/* Choisir l'outil équipé puis toucher l'objet ; aucun mode d'action n'est sauvegardé. */
'use strict';
const ToolRecovery=(()=>{
 let tool=null;
 const supported=k=>k==='marteau'||k==='pelle';
 const valid=(k,o)=>!!o&&!o.trialFixture&&(k==='pelle'?o.type==='arbuste'&&o.placed||o.type==='bush'&&!o.placed:o.placed&&o.type!=='arbuste');
 function paint(){
  $('toolRecoveryControls').hidden=!tool;document.body.classList.toggle('tool-recovery-active',!!tool);
  for(const b of $('toolbelt').querySelectorAll('[data-recovery-tool]'))b.setAttribute('aria-pressed',String(b.dataset.recoveryTool===tool));
  if(tool){$('toolRecoveryLabel').textContent=(tool==='pelle'?'Remettre un arbuste dans l’inventaire':'Remettre une construction dans l’inventaire')+' · Terrain libre : quitter';$('toolRecoveryControls').style.top=($('toolbelt').getBoundingClientRect().bottom+6)+'px';}
 }
 function stop(){if(tool){tool=null;ui.auto=null;ui.selection=null;drawSelection();}paint();}
 function start(key){
  if(!supported(key)||!hasTool(key))return;
  if(tool===key){stop();return;}
  FloorPlacement.stop();WallPlacement.stop();RoofPlacement.stop();stopPlacing();dismissObjectMenu();closePanel();
  clearTimeout(toastTimeout);$('toast').classList.remove('visible');
  tool=key;ui.auto=null;updateHUD();
 }
 function handle(x,y){
  if(!tool)return false;
  if(!hasTool(tool)){stop();toast('Équipe cet outil depuis le sac.');return true;}
  render();const target=ConstructionTrial.recoveryTargetAt(x,y),o=target?null:objectAt(x,y);ui.auto=null;
  if(target){ui.selection=null;drawSelection();if(tool!=='marteau'){toast('Choisis un arbuste.');return true;}if(target.kind==='blocked'){toast('Vise le panneau ou le module à récupérer.');return true;}const layer={floor:FloorPlacement,wall:WallPlacement,roof:RoofPlacement}[target.kind];if(layer.apply(target.piece,'remove')){render();toast('Élément remis dans l’inventaire.');}return true;}
  if(!o){stop();return true;}
  if(!valid(tool,o)){ui.selection=null;drawSelection();toast(o?.trialFixture?'La maison et son établi témoin sont conservés.':tool==='pelle'?'Choisis un arbuste.':'Choisis une installation récupérable.');return true;}
  ui.auto=null;ui.selection=o.id;interactWith(o,!o.placed?'uproot':'pickup');drawSelection();return true;
 }
 function init(){
  if(new URLSearchParams(location.search).has('outils'))return;
  $('toolbelt').addEventListener('click',e=>{const b=e.target.closest('[data-recovery-tool]');if(b)start(b.dataset.recoveryTool);});
  new ResizeObserver(paint).observe($('toolbelt'));window.addEventListener('resize',paint);
  window.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});
  const oldHUD=updateHUD;updateHUD=function(){oldHUD();if(tool&&!hasTool(tool))stop();paint();};
  const oldStop=stopPlacing;stopPlacing=function(){oldStop();stop();};
  const oldSelection=drawSelection;drawSelection=function(){
   oldSelection();const el=$('selection');el.querySelector('[data-object-action=pickup]')?.remove();el.querySelector('[data-object-action=uproot]')?.remove();
   const o=state.objects.find(o=>o.id===ui.selection);
   if(tool&&valid(tool,o)){
    const title=document.createElement('strong');title.className='resource-summary';const name=document.createElement('span');name.textContent=displayName(o);title.append(name);
    const cost=tool==='pelle'?uprootCost(o):0,badge=document.createElement('span');badge.className='resource-cost';badge.setAttribute('aria-label',cost+' points d’énergie');badge.innerHTML=cost+'<svg class="energy-symbol" aria-hidden="true" focusable="false"><use href="#energy-bolt" /></svg>';title.append(badge);el.replaceChildren(title);
   }
  };
  paint();
 }
 return {init,start,stop,handle,get active(){return tool;}};
})();

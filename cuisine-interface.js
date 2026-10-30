/* Même sélection par vignettes que le sac, sans modifier les règles de cuisine. */
'use strict';
const KitchenUI=(()=>{
 const bolt='<svg class="energy-symbol" role="img" aria-label="énergie"><use href="#energy-bolt" /></svg>';
 let selected=null,stationId=null;
 function init(){
  const base=renderPanel;
  renderPanel=function(){
   const result=base();$('panel').classList.toggle('kitchen-panel',ui.open&&ui.tab==='station');
   if(!ui.open||ui.tab!=='station')return result;
   const station=state.objects.find(o=>o.id===ui.stationId&&o.placed&&['feu','marmite'].includes(o.type));if(!station)return result;
   const recipes=Object.entries(FOOD).filter(([,r])=>r.station===station.type);
   if(stationId!==station.id||!recipes.some(([key])=>key===selected))selected=recipes[0]?.[0]||null;
   stationId=station.id;
   document.querySelector('.eyebrow').textContent=station.type==='feu'?'FEU DE CAMP':'MARMITE';
   $('panelTitle').innerHTML='Cuisine · <span class="workbench-energy" aria-label="4 énergie par préparation">4 '+bolt+'</span>';
   const tiles=recipes.map(([key,r])=>'<button type="button" class="inventory-card kitchen-recipe" data-recipe="'+key+'" data-kitchen-select="'+key+'" aria-pressed="'+(selected===key)+'" aria-label="'+r.qty+' '+r.name+'"><span class="inventory-qty">'+r.qty+'</span><span class="inventory-gain">+'+r.cul+bolt+'</span>'+rowImage(key)+'<span class="inventory-name">'+r.name+'</span></button>').join('');
   const r=FOOD[selected],energyMissing=Math.max(0,4-Math.min(state.cul,2)-state.sport);
   const missing=Object.entries(r.materials).some(([key,n])=>amount(key)<n);
   const ingredients=Object.entries(r.materials).map(([key,n])=>'<span class="kitchen-ingredient '+(amount(key)<n?'missing':'')+'">'+rowImage(key==='carotte'?'carotte_item':key)+'<strong>'+n+' '+LABEL[key]+'</strong></span>').join('');
   const reason=missing?'Ingrédients manquants.':energyMissing>0?'Il manque '+energyMissing+' '+bolt+' sportive'+(energyMissing>1?'s':'')+'.':'';
   const details='<section class="kitchen-detail" aria-label="Recette sélectionnée"><div class="kitchen-ingredients" aria-label="Ingrédients nécessaires">'+ingredients+'</div><button type="button" class="btn full" data-action="cook" data-key="'+selected+'" '+(missing||energyMissing>0?'disabled':'')+'>Préparer '+r.qty+' portions</button>'+(reason?'<p class="kitchen-reason">'+reason+'</p>':'')+'</section>';
   $('panelBody').innerHTML='<div class="kitchen-grid" role="group" aria-label="Plats à préparer">'+tiles+'</div>'+details;
   return result;
  };
  $('panelBody').addEventListener('click',e=>{
   const tile=e.target.closest('[data-kitchen-select]');if(!tile)return;
   selected=tile.dataset.kitchenSelect;renderPanel();
   $('panelBody').querySelector('[data-kitchen-select="'+selected+'"]')?.focus({preventScroll:true});
  });
 }
 return {init};
})();

/* Présentation du sac. Filtre et sélection restent en mémoire, hors sauvegarde. */
'use strict';
const InventoryUI=(()=>{
 const materials=['bois','pierre','fibres'];
 const categories=['Tout','Ressources','Nourriture','Outils','À poser'];
 const order=[...materials,'baies',...Object.keys(FOOD),'carotte','champignon','marteau','pelle','hache','pioche',...Object.keys(CRAFT),'jeunes_plants','arbuste'];
 let filter='Tout',selected=null;
 const energy='<svg class="energy-symbol" aria-hidden="true"><use href="#energy-bolt" /></svg>';
 const category=k=>materials.includes(k)?'Ressources':FOOD[k]||['baies','carotte','champignon'].includes(k)?'Nourriture':CRAFT[k]?.kind==='outil'?'Outils':'À poser';
 const image=k=>rowImage(k==='carotte'?'carotte_item':k);
 const name=k=>k==='toit'?'Toiture en chaume':LABEL[k];
 function render(){
  const focused=document.activeElement?.closest('.inventory-action')?.dataset.action;
  const scroll=$('panelBody').querySelector('.inventory-scroll')?.scrollTop||0;
  const keys=[...new Set([...order,...Object.keys(state.items)])].filter(k=>amount(k)>0);
  const visible=keys.filter(k=>filter==='Tout'||category(k)===filter);
  if(!visible.includes(selected))selected=null;
  $('panelTitle').textContent='';document.querySelector('.eyebrow').textContent='INVENTAIRE';
  $('panelBody').innerHTML='<div class="inventory-filters" role="group" aria-label="Catégorie d’objets">'+categories.map(c=>`<button type="button" data-inventory-filter="${c}" aria-pressed="${filter===c}">${c}</button>`).join('')+'</div><div class="inventory-scroll"><div class="inventory-grid" role="group" aria-label="Objets du sac">'+(visible.length?visible.map(k=>{
   const gain=k==='baies'?1:FOOD[k]?.cul||0,equipped=hasTool(k);
   return `<button type="button" class="inventory-card" data-inventory-item="${k}" aria-pressed="${selected===k}" aria-label="${name(k)}, quantité ${amount(k)}${equipped?', équipé':''}${gain?', gain '+gain+' énergie culinaire':''}"><span class="inventory-qty">${amount(k)}</span>${equipped?'<span class="inventory-equipped" aria-hidden="true">✓</span>':''}${gain?`<span class="inventory-gain" aria-hidden="true">+${gain}${energy}</span>`:''}${image(k)}<span class="inventory-name">${name(k)}</span></button>`;
  }).join(''):`<p class="inventory-empty">${keys.length?'Aucun objet dans cette catégorie.':'Ton sac est vide.'}</p>`)+'</div></div><div class="inventory-details" aria-live="polite">'+details()+'</div>';
  $('panelBody').querySelector('.inventory-scroll').scrollTop=scroll;
  if(focused)$('panelBody').querySelector(`.inventory-action[data-action="${focused}"]`)?.focus({preventScroll:true});
 }
 function details(){
  const k=selected;if(!k)return '';
  const gain=k==='baies'?1:FOOD[k]?.cul||0,tool=CRAFT[k]?.kind==='outil';
  const action=gain?'eat':tool?(k==='sac'?'':'quick'):k==='jeunes_plants'||materials.includes(k)||['carotte','champignon'].includes(k)?'':'place';
  const label=action==='eat'?'Manger':action==='quick'?(hasTool(k)?'Déséquiper':'Équiper'):'Placer';
  const note=materials.includes(k)?'Matériau de fabrication':gain?`+${gain} ${energy} culinaire`:tool?(k==='sac'?'Capacité d’inventaire à définir.':hasTool(k)?'Équipé':'Non équipé'):k==='jeunes_plants'?'À utiliser depuis le potager':!action?'Ingrédient de cuisine':k==='arbuste'?'À replanter sur le terrain':'Marteau équipé requis';
  return `<div class="inventory-large">${image(k)}</div><div class="inventory-description"><strong>${name(k)}</strong><p>${note}</p></div>${action?`<button type="button" class="inventory-action" data-action="${action}" data-key="${k}">${label}</button>`:''}`;
 }
 function init(){
  if(BuildingArea.tools)return;
  const bounds=()=>{
   const top=Math.ceil(Math.max(document.querySelector('.topbar').getBoundingClientRect().bottom,$('resourceStrip').getBoundingClientRect().bottom))+8;
   const bottom=Math.ceil(window.innerHeight-document.querySelector('.dock').getBoundingClientRect().top)+8;
   $('panel').style.setProperty('--inventory-top',top+'px');$('panel').style.setProperty('--inventory-bottom',bottom+'px');
  };
  const observer=new ResizeObserver(bounds);for(const el of [document.querySelector('.topbar'),$('resourceStrip'),document.querySelector('.dock')])observer.observe(el);window.addEventListener('resize',bounds);window.visualViewport?.addEventListener('resize',bounds);bounds();
  const original=renderPanel;
  renderPanel=function(){
   $('panel').classList.toggle('inventory-panel',ui.tab==='inventory');
   if(ui.tab==='inventory')$('panel').classList.remove('craft-panel');
   if(ui.tab!=='inventory')return original();if(!ui.open)return;render();
  };
  $('panelBody').addEventListener('click',e=>{
   const categoryButton=e.target.closest('[data-inventory-filter]'),item=e.target.closest('[data-inventory-item]');
   if(categoryButton){filter=categoryButton.dataset.inventoryFilter;selected=null;render();$('panelBody').querySelector('.inventory-scroll').scrollTop=0;$('panelBody').querySelector(`[data-inventory-filter="${filter}"]`).focus();}
   else if(item){selected=item.dataset.inventoryItem;render();$('panelBody').querySelector(`[data-inventory-item="${selected}"]`).focus({preventScroll:true});}
  });
 }
 return {init};
})();


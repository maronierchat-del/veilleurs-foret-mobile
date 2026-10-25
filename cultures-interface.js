/* Bulles et choix de culture ; recettes, coûts et cycles existants uniquement. */
'use strict';
const CultivationUI=(()=>{
 const choices={
  potager:{verb:'Planter',action:'plant',item:'jeunes_plants',quantity:4,crop:'Carottes',image:'jeunes_plants',cost:1,harvest:'harvest-garden',harvestCost:2,materials:'4 jeunes plants'},
  pepiniere:{verb:'Mettre à germer',action:'nursery',item:'carotte',quantity:1,crop:'Carottes',image:'carotte_item',cost:2,harvest:'nursery-collect',harvestCost:0,materials:'1 carotte'},
  champignonniere:{verb:'Ensemencer',action:'inoculate',item:'champignon',quantity:1,crop:'Champignons',image:'champignon',cost:1,harvest:'harvest-mushrooms',harvestCost:2,materials:'1 champignon'}
 };
 const supports=o=>!!o?.placed&&Object.hasOwn(choices,o.type);
 const status=o=>o.type==='champignonniere'&&!o.seeded||o.type!=='champignonniere'&&!o.stage?'empty':o.stage===2?'ready':'growing';
 const energy=n=>`<span class="resource-cost" aria-label="${n} point${n===1?'':'s'} d’énergie">${n}<svg class="energy-symbol" aria-hidden="true" focusable="false"><use href="#energy-bolt" /></svg></span>`;
 function countdown(target){if(!target)return 'Croissance en cours.';const minutes=Math.max(0,Math.ceil((target-Date.now())/60000)),h=Math.floor(minutes/60),m=minutes%60;return 'Prochaine étape : '+(minutes?`${h?h+' h ':''}${m?m+' min':''}`.trim():'imminente');}
 function harvest(o){if(supports(o)&&status(o)==='ready')requestStationAction(choices[o.type].harvest);}
 function init(){
  if(BuildingArea.tools)return;
  const oldSelection=drawSelection;
  drawSelection=function(){oldSelection();const o=state.objects.find(o=>o.id===ui.selection),el=$('selection');el.classList.toggle('cultivation-selection',supports(o));
   if(o?.placed&&o.type==='etabli'){el.hidden=true;return;}
   if(!supports(o))return;
   const c=choices[o.type],phase=status(o),title=document.createElement('strong'),name=document.createElement('span');title.className='resource-summary';name.textContent=displayName(o);title.append(name);el.replaceChildren(title);
   if(phase==='empty'){const button=document.createElement('button');button.type='button';button.dataset.cropStart=String(o.id);button.innerHTML=c.verb+' '+energy(c.cost);title.append(button);}
   else if(phase==='ready')title.insertAdjacentHTML('beforeend',energy(c.harvestCost));
   else {const p=document.createElement('p');p.textContent=countdown(o.readyAt);el.append(p);}
  };
  $('selection').addEventListener('click',e=>{const button=e.target.closest('[data-crop-start]');if(!button)return;const o=state.objects.find(o=>o.id===Number(button.dataset.cropStart));if(supports(o)&&status(o)==='empty')openObjectMenu(o);});
  const oldPanel=renderPanel;
  renderPanel=function(){const o=state.objects.find(o=>o.id===ui.stationId);if(!ui.open||ui.tab!=='installation'||!supports(o)||status(o)!=='empty')return oldPanel();
   const c=choices[o.type],available=amount(c.item)>=c.quantity&&state.sport>=c.cost-Math.min(state.cul,Math.floor(c.cost/2));
   document.querySelector('.eyebrow').textContent=displayName(o);$('panelTitle').textContent=c.verb;
   $('panelBody').innerHTML='<div class="item-row culture-choice">'+rowImage(c.image)+'<div class="item-info"><strong>'+c.crop+'</strong><small>Coût : '+c.materials+'</small></div><button type="button" data-action="'+c.action+'" '+(available?'':'disabled')+'>'+c.verb+'</button></div>'+(available?'':'<p>Ressources ou énergie insuffisantes.</p>');
  };
  const oldAction=requestStationAction;
  requestStationAction=function(action,key){const o=state.objects.find(o=>o.id===ui.stationId),before=o&&[o.stage,o.seeded].join(':');oldAction(action,key);if(supports(o)&&before!==[o.stage,o.seeded].join(':'))dismissObjectMenu();};
  const oldNature=updateNatureAndCrops;
  updateNatureAndCrops=function(){oldNature();if(state.objects.some(o=>o.id===ui.selection&&supports(o)))drawSelection();};
 }
 return {init,supports,status,harvest,energy,countdown};
})();

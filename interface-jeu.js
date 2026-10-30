/* Accès au chantier par les menus du jeu ; état et règles de l'essai conservés. */
'use strict';
const GameInterface=(()=>{
 const tools=new URLSearchParams(location.search).has('outils');
 function init(){
  document.body.classList.add(tools?'tools-mode':'game-interface');if(tools)return;
  ConstructionUI.init(window.constructionTrial);
  // Bornes réelles : les textes, la barre de ressources et le menu bas peuvent
  // changer de hauteur selon l'écran, sans déplacement des données de partie.
  const fitCraftPanel=()=>{
   const top=Math.ceil(Math.max(document.querySelector('.topbar').getBoundingClientRect().bottom,$('resourceStrip').getBoundingClientRect().bottom))+8;
   const bottom=Math.floor(document.querySelector('.dock').getBoundingClientRect().top)-8;
   $('panel').style.setProperty('--craft-panel-top',top+'px');
   $('panel').style.setProperty('--craft-panel-bottom',Math.max(0,window.innerHeight-bottom)+'px');
   $('panel').style.setProperty('--craft-panel-height',Math.max(0,bottom-top)+'px');
  };
  const craftBounds=new ResizeObserver(fitCraftPanel);
  for(const element of [document.querySelector('.topbar'),$('resourceStrip'),document.querySelector('.dock')])craftBounds.observe(element);
  window.addEventListener('resize',fitCraftPanel);window.visualViewport?.addEventListener('resize',fitCraftPanel);fitCraftPanel();
  document.querySelector('.brand small').hidden=true;
  const bars=[...document.querySelectorAll('.floor-controls')];
  const observer=new ResizeObserver(()=>{const active=bars.find(b=>!b.hidden);document.body.style.setProperty('--construction-controls-height',(active?.getBoundingClientRect().height||0)+'px');});bars.forEach(b=>observer.observe(b));
  const hint='Sol : marcher · objet : menu, puis action au second toucher · glisser : carte · pincer / molette : zoom';
  $('scene').setAttribute('aria-label','Carte. Toucher le sol pour marcher. Toucher un objet pour son menu, puis une seconde fois pour son action principale. Avec un menu d’objet ouvert, toucher le sol le ferme sans marcher. Glisser pour déplacer la vue, pincer ou utiliser la molette pour zoomer.');
  $('sceneHint').textContent=hint;
  const originalStopPlacing=stopPlacing;
  stopPlacing=function(){originalStopPlacing();$('sceneHint').textContent=hint;};
  const originalSelection=drawSelection;
  drawSelection=function(){const o=state.objects.find(o=>o.id===ui.selection);if(o?.placed&&o.type==='coffre'){$('selection').hidden=true;$('selection').replaceChildren();return;}originalSelection();if(!o)return;
   if(o.placed&&o.type==='arbuste'){
    const el=$('selection'),heading=document.createElement('strong');heading.className='resource-summary';
    el.hidden=false;
    const name=document.createElement('span');name.textContent=displayName(o);heading.append(name);el.replaceChildren(heading);
    if(o.stage===3){const cost=document.createElement('span');cost.className='resource-cost';cost.setAttribute('aria-label','1 point d’énergie');cost.innerHTML='1<svg class="energy-symbol" aria-hidden="true" focusable="false"><use href="#energy-bolt" /></svg>';heading.append(cost);}
    else {const p=document.createElement('p');p.textContent=NightGrowth.label(o);el.append(p);
    }return;
   }
   if(o.placed)return;
   const el=$('selection'),button=el.querySelector('[data-object-action=gather]');
   if(button){
    const heading=el.querySelector('strong'),label=document.createElement('span');label.textContent=({mushroom:'Champignon',carrot:'Carotte'})[o.type]||displayName(o);heading.className='resource-summary';heading.replaceChildren(label);
    const cost=document.createElement('span');cost.className='resource-cost';cost.setAttribute('aria-label',COLLECT[o.type].cost+' points d’énergie');cost.innerHTML=COLLECT[o.type].cost+'<svg class="energy-symbol" aria-hidden="true" focusable="false"><use href="#energy-bolt" /></svg>';heading.append(cost);
    el.querySelector('p')?.remove();button.remove();
   }
  };
  const originalNature=updateNatureAndCrops;
  updateNatureAndCrops=function(){originalNature();if(state.objects.some(o=>o.id===ui.selection&&o.placed&&o.type==='arbuste'))drawSelection();};
  $('floorControls').querySelector('strong').textContent='Plancher en bois';
  $('wallControls').querySelector('strong').textContent='Murs et ouvertures';
  $('roofControls').querySelector('strong').textContent='Toiture en chaume';
  $('roofFloors').textContent='← Construire';$('wallFloors').textContent='← Construire';
  const menu=()=>setTab('construction');$('roofFloors').onclick=menu;$('wallFloors').onclick=menu;
  for(const id of ['floorClose','wallClose','roofClose'])$(id).textContent='Terminer';
  const originalSetTab=setTab;
  setTab=function(tab){$('panel').classList.toggle('craft-panel',tab==='craft');FloorPlacement.stop();WallPlacement.stop();RoofPlacement.stop();stopPlacing();originalSetTab(tab);};
  const originalRenderPanel=renderPanel;
  renderPanel=function(){
   const preparation=typeof ExpeditionPrep!=='undefined'&&typeof MalleTrial!=='undefined'&&ui.tab==='installation'&&state.objects.some(o=>o.id===ui.stationId&&MalleTrial.isFixture(o));
   $('panel').classList.toggle('expedition-panel',preparation);if($('prepHeaderLegend'))$('prepHeaderLegend').hidden=!preparation;
   $('panel').classList.toggle('craft-panel',ui.tab==='craft');
   if(ui.tab==='craft')fitCraftPanel();
   if(ui.tab==='craft'&&viewedWorkbench()){
    document.querySelector('.eyebrow').textContent='ÉTABLI';
    $('panelTitle').innerHTML='Fabrication · <span class="workbench-energy" aria-label="4 points d’énergie">4 <svg class="energy-symbol" aria-hidden="true"><use href="#energy-bolt" /></svg></span>';
    const groups={outil:'Outils',installation:'Production',construction:'Construction',meuble:'Mobilier'};
    const catalogue={outil:['hache','pioche','marteau','pelle'],installation:['feu','etabli','marmite','potager','pepiniere','champignonniere'],construction:['sol','mur','porte','fenetre','toit'],meuble:['coffre','paillasse','portail']};
    if(!Object.hasOwn(groups,ui.craftFilter))ui.craftFilter='outil';
    const plurals={sol:'sols en bois',mur:'murs en bois',porte:'portes en bois',fenetre:'fenêtres',toit:'toitures en chaume'};
    let html='<div class="craft-filters">'+Object.entries(groups).map(([key,name])=>'<button type="button" data-action="craft-filter" data-key="'+key+'" class="'+(ui.craftFilter===key?'current':'')+'">'+name+'</button>').join('')+'</div>';
    for(const key of catalogue[ui.craftFilter]){
     const r=CRAFT[key];if(!r)continue;
     const name=key==='coffre'?'Malle d’expédition':key==='paillasse'?'Lit (paillasse)':r.qty?r.qty+' '+(plurals[key]||r.name):r.name;
     if(key==='coffre'){
      html+='<div class="item-row" data-workbench-item="coffre">'+rowImage(r.spr)+'<div class="item-info"><strong>'+name+'</strong><small>Fabrication à raccorder</small></div><button type="button" data-action="craft" data-key="coffre" disabled>Fabriquer</button></div>';continue;
     }
     html+='<div class="item-row" data-workbench-item="'+key+'">'+rowImage(r.spr)+'<div class="item-info"><strong>'+name+'</strong><small>'+fmtMaterials(r.materials)+(key==='toit'?'<br>Forme choisie à la pose':'')+'</small></div><button type="button" data-action="craft" data-key="'+key+'" '+(!canCraft(key)?'disabled':'')+'>Fabriquer</button></div>';
    }
    $('panelBody').innerHTML=html;return;
   }
   if(ui.tab==='craft'&&!viewedWorkbench()){
    document.querySelector('.eyebrow').textContent='FABRICATION À LA MAIN';
    $('panelTitle').innerHTML='Fabrication · <span class="workbench-energy" aria-label="4 points d’énergie">4 <svg class="energy-symbol" aria-hidden="true"><use href="#energy-bolt" /></svg></span>';
    $('panelBody').innerHTML=['marteau','pioche','hache','feu','etabli','portail'].filter(key=>CRAFT[key]).map(key=>{const r=CRAFT[key];return '<div class="item-row">'+rowImage(key)+'<div class="item-info"><strong>'+r.name+'</strong><small>'+fmtMaterials(r.materials)+'</small></div><button data-action="craft" data-key="'+key+'" '+(!canCraft(key)?'disabled':'')+'>Fabriquer</button></div>';}).join('');return;
   }
   if(ui.tab!=='construction'){const value=originalRenderPanel();if(ui.tab==='settings')$('panelBody').insertAdjacentHTML('afterbegin',GameInstall.markup());document.querySelector('.eyebrow').textContent=preparation?'PRÉPARER UNE EXPÉDITION':{inventory:'INVENTAIRE',craft:'FABRICATION',settings:'PARAMÈTRES',sport:'ACTIVITÉ'}[ui.tab]||'INSTALLATION';return value;}
   document.querySelector('.eyebrow').textContent='CONSTRUCTION';
   $('panelTitle').textContent='Construire';
   $('panelBody').innerHTML=ConstructionUI.catalogue();
  };
  $('panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-build-layer]');if(b)ConstructionUI.start(b.dataset.buildLayer,b.dataset.buildPiece);});
 }
 return {init};
})();

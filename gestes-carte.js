/* Sélection puis action ; un glissement ne déclenche jamais un clic. */
'use strict';
const DirectMapControls=(()=>{
 const pointers=new Map();
 let gesture=null,pinch=null,space=false,dragging=false;
 const editing=e=>e.target?.closest?.('input,textarea,select,[contenteditable=true]');
 function consume(e){e.preventDefault();e.stopImmediatePropagation();}
 function local(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 function pause(on){if(on){FloorPlacement.clearPreview();WallPlacement.clearPreview();}RoofPlacement.pause(on);}
 function free(){ui.camera.free=true;$('cameraCenter').disabled=false;if(!dragging)pause(true);dragging=true;canvas.style.cursor='grabbing';}
 function finish(){gesture=null;pinch=null;dragging=false;canvas.style.cursor=space?'grab':'';pause(false);}
 function reset(){const ids=[...pointers.keys()];pointers.clear();for(const id of ids)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);finish();}
 function center(){reset();ui.camera.free=false;ui.camera.x=state.player.x;ui.camera.y=state.player.y-120/(ui.camera.zoom*ui.camera.squash);$('cameraCenter').disabled=true;}
 function focus(p,screen={x:W/2,y:H/2}){reset();ui.auto=null;ui.keys.clear();ui.touch.clear();ui.camera.free=true;ui.camera.x=p.x-(screen.x-W/2)/ui.camera.zoom;ui.camera.y=p.y-(screen.y-H/2)/(ui.camera.zoom*ui.camera.squash);}
 function dock(){/* Le recentrage appartient aux commandes permanentes de la carte. */}
 function action(p){
  if(ui.open&&ui.tab==='inventory'){closePanel();dismissObjectMenu();return;}
  if(ToolRecovery.active){ToolRecovery.handle(p.x,p.y);return;}
  if(FloorPlacement.mode)return FloorPlacement.point(p.x,p.y,false)();
  if(WallPlacement.mode)return WallPlacement.point(p.x,p.y,false)();
  if(RoofPlacement.mode)return RoofPlacement.point(p.x,p.y,false)();
  const world=unproject(p.x,p.y);
  if(ui.placing)return tryPlace(world.x,world.y);
  const door=constructionTrial.doorAt(p.x,p.y);
  if(door){dismissObjectMenu();constructionTrial.toggleDoor(door);return;}
  const object=objectAt(p.x,p.y);
  if(object){
   if(ui.selection===object.id){
    if(!object.placed&&COLLECT[object.type]&&!(object.type==='bush'&&object.harvested)&&!ui.auto)interactWith(object,'gather');
    else if(object.placed&&object.type==='arbuste'&&object.stage===3&&!ui.auto)requestStationAction('harvest-bush');
    else if(CultivationUI.supports(object)&&!ui.auto)CultivationUI.harvest(object);
    drawSelection();return;
   }
   dismissObjectMenu();
   if(object.placed&&(object.type==='arbuste'||CultivationUI.supports(object))){closePanel();ui.stationId=object.id;ui.objectMenu=object.id;ui.selection=object.id;drawSelection();return;}
   ui.selection=object.id;drawSelection();if(object.placed)openObjectMenu(object);return;
  }
  if(ui.selection!==null||ui.objectMenu!=null){dismissObjectMenu();return;}
  if(!BoundaryMist.contains(world.x,world.y))return;
  ui.auto={x:world.x,y:world.y,id:null};
 }
 function pinchStart(){const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};free();pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:ui.camera.zoom,anchor:unproject(mid.x,mid.y)};gesture=null;}
 function init(){
  $('cameraHand').hidden=true;$('cameraCenter').onclick=center;$('cameraCenter').disabled=true;
  $('cameraControls').querySelector('small').textContent='Toucher le sol : marcher · glisser : carte';
  window.addEventListener('pointerdown',e=>{
   if(e.target!==canvas)return;if(e.button!==0&&e.button!==1)return;
   consume(e);const p=local(e);pointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);
   if(pointers.size>1){pinchStart();return;}
   gesture={id:e.pointerId,start:p,last:p,threshold:e.pointerType==='touch'?12:8,forced:e.button===1||space};if(gesture.forced)free();
  },true);
  window.addEventListener('pointermove',e=>{
   if(!pointers.has(e.pointerId))return;consume(e);const p=local(e);pointers.set(e.pointerId,p);
   if(pointers.size>1){const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},z=Math.max(.35,Math.min(1.5,pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance));ui.camera.zoom=z;ui.camera.x=pinch.anchor.x-(mid.x-W/2)/z;ui.camera.y=pinch.anchor.y-(mid.y-H/2)/(z*ui.camera.squash);$('zoomValue').textContent=Math.round(z*100)+' %';return;}
   if(!gesture)return;
   if(!dragging&&Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>=gesture.threshold){gesture.last=gesture.start;free();}
   if(dragging){const from=gesture.last;ui.camera.x-=(p.x-from.x)/ui.camera.zoom;ui.camera.y-=(p.y-from.y)/(ui.camera.zoom*ui.camera.squash);}
   gesture.last=p;
  },true);
  window.addEventListener('pointerup',e=>{
   if(!pointers.has(e.pointerId))return;consume(e);const p=local(e),wasDrag=dragging||!!gesture&&Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>=gesture.threshold;pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
   if(pointers.size){const [id,last]=[...pointers][0];gesture={id,start:last,last,forced:true};pinch=null;dragging=true;return;}
   finish();if(!wasDrag)action(p);
  },true);
  window.addEventListener('pointercancel',e=>{if(pointers.has(e.pointerId)){consume(e);reset();}},true);
  canvas.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))reset();});
  canvas.addEventListener('wheel',e=>{consume(e);reset();const p=local(e),anchor=unproject(p.x,p.y),delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?H:1),z=Math.max(.35,Math.min(1.5,ui.camera.zoom*Math.exp(-delta*.001)));ui.camera.zoom=z;ui.camera.free=true;ui.camera.x=anchor.x-(p.x-W/2)/z;ui.camera.y=anchor.y-(p.y-H/2)/(z*ui.camera.squash);$('cameraCenter').disabled=false;$('zoomValue').textContent=Math.round(z*100)+' %';}, {passive:false});
  window.addEventListener('keydown',e=>{if(editing(e)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.code==='Space'){consume(e);space=true;canvas.style.cursor='grab';}},true);
  window.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;canvas.style.cursor=dragging?'grabbing':'';}},true);
  window.addEventListener('blur',()=>{space=false;reset();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 }
 return {init,center,focus,dock,setHand(){},get active(){return dragging;}};
})();
const MapControls=new URLSearchParams(location.search).has('outils')?LegacyMapControls:DirectMapControls;

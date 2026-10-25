/* Caméra libre dans la copie jouable : aucune modification du personnage. */
'use strict';
const LegacyMapControls=(()=>{
 let space=false,hand=false,drag=null,home;
 const editing=e=>e.target?.closest?.('input,textarea,select,[contenteditable=true]');
 function consume(e){e.preventDefault();e.stopImmediatePropagation();}
 function cursor(){canvas.style.cursor=drag?'grabbing':hand||space?'grab':'';}
 function setHand(value){hand=value;if(value){ui.auto=null;ui.keys.clear();ui.touch.clear();ui.camera.free=true;$('cameraCenter').disabled=false;}$('cameraHand').setAttribute('aria-pressed',String(hand));$('cameraHand').textContent=hand?'Main active':'Main · carte';RoofPlacement.pause(hand||space);cursor();}
 function release(){if(drag&&canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);drag=null;RoofPlacement.pause(hand||space);cursor();}
 function center(){release();setHand(false);ui.camera.free=false;ui.camera.x=state.player.x;ui.camera.y=state.player.y-120/(ui.camera.zoom*ui.camera.squash);$('cameraCenter').disabled=true;}
 function dock(roof){if(roof){$('roofControls').insertBefore($('cameraControls'),$('roofStock'));setHand(false);}else if(home)home.after($('cameraControls'));}
 function init(){
  home=document.createComment('Commandes de caméra');$('cameraControls').before(home);
  $('cameraHand').onclick=()=>setHand(!hand);$('cameraCenter').onclick=center;
  window.addEventListener('keydown',e=>{if(editing(e)||e.ctrlKey||e.altKey||e.metaKey)return;if(e.code==='Space'){consume(e);space=true;RoofPlacement.pause(true);ui.keys.clear();ui.touch.clear();ui.auto=null;cursor();}},true);
  window.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;RoofPlacement.pause(hand);cursor();}},true);
  window.addEventListener('blur',()=>{space=false;release();});
  window.addEventListener('pointerdown',e=>{if(e.target!==canvas)return;if(drag){consume(e);return;}if(!(e.button===1||e.button===0&&(space||hand)))return;consume(e);drag={id:e.pointerId,x:e.clientX,y:e.clientY};RoofPlacement.pause(true);ui.auto=null;ui.keys.clear();ui.touch.clear();ui.camera.free=true;$('cameraCenter').disabled=false;canvas.setPointerCapture(e.pointerId);cursor();},true);
  window.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;consume(e);ui.camera.x-=(e.clientX-drag.x)/ui.camera.zoom;ui.camera.y-=(e.clientY-drag.y)/(ui.camera.zoom*ui.camera.squash);drag.x=e.clientX;drag.y=e.clientY;},true);
  window.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;consume(e);release();},true);
  window.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId){consume(e);release();}},true);
  canvas.addEventListener('lostpointercapture',()=>{drag=null;cursor();});
 }
 return {init,center,dock,setHand,get active(){return hand||space||!!drag;}};
})();

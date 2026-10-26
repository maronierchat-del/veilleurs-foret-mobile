/* Deux repères de bord d'écran, visibles uniquement quand leur cible sort du champ. */
'use strict';
const EdgeMarkers=(()=>{
 let api,buttons=[],lastKey='';
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
 function viewport(){
  const top=Math.max(...['.topbar','#resourceStrip'].map(s=>document.querySelector(s).getBoundingClientRect().bottom))+10,dock=document.querySelector('.dock').getBoundingClientRect();let bottom=dock.top-10;
  const obstacles=[...document.querySelectorAll('.floor-controls:not([hidden]),.panel:not(.closed),.zoom-buttons,.toolbelt,.mobile-controls,.scene-hint')].filter(e=>getComputedStyle(e).display!=='none').map(rect);
  for(const b of obstacles)if(b.w>W*.75)bottom=Math.min(bottom,b.y-10);
  return {area:{x:10,y:top,w:W-20,h:Math.max(72,bottom-top)},obstacles};
 }
 function visible(box,area,obstacles){
  if(!overlap(box,area))return false;const x0=Math.max(box.x,area.x),x1=Math.min(box.x+box.w,area.x+area.w),y0=Math.max(box.y,area.y),y1=Math.min(box.y+box.h,area.y+area.h);
  return [0,.5,1].some(a=>[0,.5,1].some(b=>{const x=x0+(x1-x0)*a,y=y0+(y1-y0)*b;return !obstacles.some(o=>x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h);}));
 }
 function targets(){
  const p=project(state.player.x,state.player.y),hero=api.lastHero?.rect||{x:p.x-25,y:p.y-110*ui.camera.zoom,w:50,h:110*ui.camera.zoom};
  const result=[{id:'person',box:hero,point:{x:p.x,y:p.y-55*ui.camera.zoom},world:state.player}],bench=state.objects.find(o=>o.placed&&o.type==='etabli');
  if(bench){const box=objectRect(bench);result.push({id:'house',box,point:{x:box.x+box.w/2,y:box.y+box.h/2},world:bench});}return result;
 }
 function place(point,area,obstacles,used){
  const left=area.x+34,right=area.x+area.w-34,top=area.y+34,bottom=Math.max(top,area.y+area.h-34),cx=(left+right)/2,cy=(top+bottom)/2,dx=point.x-cx,dy=point.y-cy,t=Math.min(dx?Math.abs((right-left)/2/dx):Infinity,dy?Math.abs((bottom-top)/2/dy):Infinity),nominal={x:cx+dx*t,y:cy+dy*t},candidates=[nominal];
  for(let x=left;x<=right;x+=52)candidates.push({x,y:top},{x,y:bottom});for(let y=top;y<=bottom;y+=52)candidates.push({x:left,y},{x:right,y});
  const choices=candidates.filter(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&![...obstacles,...used].some(b=>overlap({x:q.x-29,y:q.y-29,w:58,h:58},b)));
  choices.sort((a,b)=>(a.x-nominal.x)**2+(a.y-nominal.y)**2-(b.x-nominal.x)**2-(b.y-nominal.y)**2);return choices[0];
 }
 function icon(img,src,portrait=false){const image=new Image();image.onload=()=>{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const context=c.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);const pixels=context.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>20){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}const crop=document.createElement('canvas');crop.width=x1-x0+1;crop.height=portrait?Math.min(y1-y0+1,Math.round(crop.width*1.05)):y1-y0+1;crop.getContext('2d').drawImage(image,x0,y0,crop.width,crop.height,0,0,crop.width,crop.height);img.src=crop.toDataURL();};image.src=src;}
 function init(trial){api=trial;if(BuildingArea.tools)return;const container=document.createElement('div');container.id='edgeMarkers';document.body.append(container);
  for(const [id,label,src,portrait]of [['person','Voir le personnage','assets/sprites/personnage/face.png',true],['house','Voir l’établi','construction/sprites/etabli-0.png',false]]){const button=document.createElement('button');button.type='button';button.className='edge-marker';button.id='marker-'+id;button.setAttribute('aria-label',label);button.hidden=true;button.innerHTML='<span class="marker-arrow" aria-hidden="true"></span><span class="marker-image"><img alt=""></span>';container.append(button);icon(button.querySelector('img'),src,portrait);button.onclick=()=>{const target=targets().find(t=>t.id===id);if(!target)return;const {area}=viewport();MapControls.focus(target.world,{x:area.x+area.w/2,y:area.y+area.h/2+(id==='person'?55*ui.camera.zoom:0)});lastKey='';update();};buttons.push(button);}
 }
 function update(){if(!buttons.length||!api.ready)return;const {area,obstacles}=viewport(),items=targets(),key=JSON.stringify([area,obstacles,items.map(t=>[t.box,t.point])]);if(key===lastKey)return;lastKey=key;const used=[];
  for(const button of buttons)button.hidden=true;
  for(let i=0;i<items.length;i++){const target=items[i],button=buttons[i];if(visible(target.box,area,obstacles))continue;const q=place(target.point,area,obstacles,used);button.hidden=!q;if(!q)continue;button.style.left=q.x-24+'px';button.style.top=q.y-24+'px';const angle=Math.atan2(target.point.y-q.y,target.point.x-q.x);button.querySelector('.marker-arrow').style.transform='translate('+Math.cos(angle)*29+'px,'+Math.sin(angle)*29+'px) rotate('+(angle+Math.PI/2)+'rad)';used.push({x:q.x-29,y:q.y-29,w:58,h:58});}
 }
 return {init,update,viewport};
})();

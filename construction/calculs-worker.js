/* Les calculs de fond et de profondeur ne bloquent pas les événements tactiles. */
'use strict';
self.document={createElement(type){if(type!=='canvas')throw Error('Élément de calcul inconnu');return new OffscreenCanvas(1,1);}};
const sourceVersion=location.search,load=(...paths)=>importScripts(...paths.map(p=>p+sourceVersion));
load('geometry.js','plancher.js','murs.js','toit-model.js','toit-render.js','porte.js','murs-interieur.js','model.js','fond.js');
let pictures,images,labels,depths,patches,pattern,tools,workers=new Map(),background;
function addPictures(entries){for(const r of entries){r.bitmap.src=r.src;r.bitmap.naturalWidth=r.bitmap.width;r.bitmap.naturalHeight=r.bitmap.height;pictures.set(r.id,r.bitmap);}images=Object.fromEntries(Object.entries(labels).map(([key,id])=>[key,pictures.get(id)]));}
self.BuildingArea={tools:false};self.WORLD={width:3600,height:3200};
load('../brume-frontiere.js');
onmessage=e=>{const m=e.data;try{
 if(m.type==='init'){
  Object.assign(WORLD,m.world);
  pictures=new Map();labels=m.labels;addPictures(m.registry);depths=m.depths;Object.assign(ValidatedModel.specs,m.specs);self.DepthAtlas={constants:m.constants};load('masquage.js');tools=m.tools;BuildingArea.tools=tools;background=new OffscreenCanvas(1,1);pattern=background.getContext('2d',{alpha:false}).createPattern(images.terrain0,'repeat');patches=m.patches.map(p=>({...p,surface:SceneryPaint.patch(p,images.terrain1,new OffscreenCanvas(1,1))}));postMessage({type:'ready'});return;
 }
 if(m.type==='assets'){addPictures(m.assets);Object.assign(depths,m.depths);return;}
 if(m.type!=='job')return;let result,transfer=[];const job=m.job;
 if(job.type==='background'){
  const view=job.view;background.width=Math.ceil(view.width*view.density);background.height=Math.ceil(view.height*view.density);const c=background.getContext('2d',{alpha:false});SceneryPaint.draw(c,view,pattern,patches,job.placing);BoundaryMist.draw(c,view);const bitmap=background.transferToImageBitmap();result={bitmap,view};transfer=[bitmap];
 }else{
  let tile=workers.get(m.key);if(!tile){const canvas=new OffscreenCanvas(job.size,job.size),context=canvas.getContext('2d',{willReadFrequently:true});tile={canvas,context,worker:MeshOcclusion.create(context,LabGeometry,ValidatedModel,depths)};workers.set(m.key,tile);}
  workers.delete(m.key);workers.set(m.key,tile);for(const key of [...workers.keys()].slice(0,-2))workers.delete(key);
  const {context:c,canvas}=tile;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,job.size,job.size);FloorProposal.draw(c,job.localFloors,(u,v,z=0)=>LabGeometry.project(u,v,job.camera,z),1);
  const extras=job.extras.map(({imageId,...other})=>({...other,image:pictures.get(imageId)})),last=tile.worker.render({...job.frame,extras,images}),copy=array=>{const value=array.slice();transfer.push(value.buffer);return value;};
  const layers=last.layers.map(l=>({...l,transparent:l.alpha<.98||l.rgba.some((a,i)=>i%4===3&&a>0&&a<250),rgba:copy(l.rgba),z:copy(l.z)})),bitmap=canvas.transferToImageBitmap();transfer.push(bitmap);result={bitmap,last:{...last,owners:copy(last.owners),zbuffer:copy(last.zbuffer),layers}};
 }
 postMessage({type:'result',id:m.id,result},transfer);
}catch(error){postMessage({type:'error',error:error.message});}};

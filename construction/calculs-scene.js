/* Un seul calcul graphique en vol ; demandes périmées remplacées, jamais empilées. */
const SceneCalculations=(()=>{'use strict';
 const sourceVersion=document.currentScript?.src?new URL(document.currentScript.src).search:'';
 let lastError='';
 async function create({images,depths,specs,constants,patches,world,tools,invalidate}){
  if(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined')return null;
  const worker=new Worker('construction/calculs-worker.js'+sourceVersion),queue=new Map(),imageIds=new Map(),registry=[],uploaded=new Set(),maps=new Set();let serial=0,busy=null,dead=false,completed=0,waiters=[],labels={},imageBytes=0,depthBytes=0;
  function notify(){invalidate();for(const done of waiters.splice(0))done();}
  async function pump(){if(dead||busy||!queue.size)return;const record=queue.has('background')?queue.get('background'):[...queue.values()].pop();queue.delete(record.key);busy=record;try{
   if(record.job.type==='tile'){
    const wanted=new Set(record.job.extras.map(e=>e.imageId)),files=[];
    for(const p of record.job.frame.objects){const r=ValidatedModel.bounds(p,record.job.camera,LabGeometry);if(r.x>=record.job.size||r.y>=record.job.size||r.x+r.w<=0||r.y+r.h<=0)continue;const file=ValidatedModel.file(p);wanted.add(labels[file]);files.push(file);}
    const assets=[],encoded={},transfer=[];
    for(const id of wanted)if(!uploaded.has(id)){const r=registry[id],bitmap=await createImageBitmap(r.image);assets.push({id,bitmap,src:r.src});transfer.push(bitmap);uploaded.add(id);imageBytes+=bitmap.width*bitmap.height*4;}
    for(const file of files)if(!maps.has(file)){const map=depths[file].slice();encoded[file]=map;transfer.push(map.buffer);maps.add(file);depthBytes+=map.byteLength;}
    if(assets.length||transfer.length)worker.postMessage({type:'assets',assets,depths:encoded},transfer);
   }
   if(queue.has(record.key)||!record.valid()){busy=null;notify();pump();return;}
   worker.postMessage({type:'job',id:record.id,key:record.key,job:record.job});
  }catch(error){lastError=error.message;dead=true;notify();}}
  const initialized=new Promise((resolve,reject)=>{worker.onmessage=e=>{const m=e.data;if(m.type==='ready'){resolve();return;}if(m.type==='error'){lastError=m.error;reject(Error(m.error));dead=true;notify();return;}if(m.type==='result'&&busy?.id===m.id){const record=busy;busy=null;completed++;if(!queue.has(record.key)&&record.valid())record.accept(m.result);else m.result.bitmap?.close();notify();pump();}};worker.onerror=e=>{lastError=e.message||'Calcul graphique indisponible';dead=true;reject(Error(lastError));notify();};});initialized.catch(()=>{});
  try{
   for(const [key,image]of Object.entries(images)){if(!image||imageIds.has(image))continue;const id=registry.length;imageIds.set(image,id);registry.push({id,image,src:image.src||'canvas:'+key});}
   labels=Object.fromEntries(Object.entries(images).map(([key,image])=>[key,imageIds.get(image)]));const initial=[];
   for(const key of ['terrain0','terrain1','wood','pan','hero']){const id=labels[key];if(uploaded.has(id))continue;const r=registry[id],bitmap=await createImageBitmap(r.image);initial.push({id,bitmap,src:r.src});uploaded.add(id);imageBytes+=bitmap.width*bitmap.height*4;}
   worker.postMessage({type:'init',registry:initial,labels,depths:{},specs,constants,world,patches:patches.map(({x,y,rx,ry})=>({x,y,rx,ry})),tools},initial.map(r=>r.bitmap));await initialized;
  }catch(error){lastError=error.message;worker.terminate();return null;}
  return {request(key,signature,job,valid,accept){if(dead)return false;if(busy?.key===key&&busy.signature===signature||queue.get(key)?.signature===signature)return true;queue.set(key,{id:++serial,key,signature,job:structuredClone(job),valid,accept});pump();return true;},retain(keys){for(const key of queue.keys())if(key!=='background'&&!keys.has(key))queue.delete(key);},imageId:image=>imageIds.get(image),wait(){return new Promise(done=>waiters.push(done));},get metrics(){return {pending:queue.size+(busy?1:0),completed,failed:dead,imageBytes,depthBytes};},close(){dead=true;worker.terminate();queue.clear();notify();}};
 }
 return {create,get lastError(){return lastError;}};
})();

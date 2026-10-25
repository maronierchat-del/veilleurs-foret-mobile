/* Profondeur par pixel : couleurs approuvées intactes, maillages Blender en lecture seule. */
(function(root){'use strict';
 const constants=DepthAtlas.constants,A=constants.back[0]*constants.LU,B=-constants.back[1],C=constants.back[2]*constants.LZ;
 const world=(u,v,z=0)=>A*u+B*v+C*z;
 async function unpack(){const result={};await Promise.all(Object.entries(DepthAtlas.maps).map(async([key,base64])=>{const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')),data=await new Response(stream).arrayBuffer();result[key]=new Uint16Array(data);}));return result;}
 function create(ctx,G,M,depths){
  let cachedKey='',staticLayers=[],objectCache=new Map(),roofCache=new Map(),composition=null,partCache=new Map(),partKeys=new Set();const scratch=document.createElement('canvas'),sc=scratch.getContext('2d',{willReadFrequently:true});let W,H,dpr,last;
  // L'aperçu est une couche variable ; les panneaux et poteaux inchangés sont réutilisés.
  function part(key,draw,bounds,depthAt,owner,alpha=1){key=JSON.stringify([W,H,dpr,owner,alpha,key]);partKeys.add(key);if(!partCache.has(key))partCache.set(key,layer(draw,bounds,depthAt,owner,alpha));return partCache.get(key);}
  function layer(draw,bounds,depthAt,owner,alpha=1){const x0=Math.max(0,Math.floor(bounds.x*dpr)),y0=Math.max(0,Math.floor(bounds.y*dpr)),x1=Math.min(W,Math.ceil((bounds.x+bounds.w)*dpr)),y1=Math.min(H,Math.ceil((bounds.y+bounds.h)*dpr));if(x1<=x0||y1<=y0)return null;
   sc.setTransform(1,0,0,1,0,0);sc.clearRect(0,0,W,H);sc.setTransform(dpr,0,0,dpr,0,0);draw(sc);const w=x1-x0,h=y1-y0,image=sc.getImageData(x0,y0,w,h),z=new Float32Array(w*h).fill(-Infinity);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(image.data[i*4+3])z[i]=depthAt((x0+x+.5)/dpr,(y0+y+.5)/dpr);}
   return {x:x0,y:y0,w,h,rgba:image.data,z,owner,alpha};
  }
  function extent(points,pad=12){const x=Math.min(...points.map(p=>p.x))-pad,y=Math.min(...points.map(p=>p.y))-pad;return {x,y,w:Math.max(...points.map(p=>p.x))+pad-x,h:Math.max(...points.map(p=>p.y))+pad-y};}
  function prepareRoof(pieces,camera){return pieces.flatMap(p=>RoofModules.mesh(p)).map(face=>{const f=face.plane,a=-36-f.zu,b=49-f.zv,ps=face.points.map(q=>G.project(q.u,q.v,camera,q.z)),pad=8*camera.zoom;return {f,a,b,det:112*b-52*a,uv:face.points.map(q=>[q.u,q.v]),ps,left:Math.min(...ps.map(q=>q.x))-pad,right:Math.max(...ps.map(q=>q.x))+pad,top:Math.min(...ps.map(q=>q.y))-pad,bottom:Math.max(...ps.map(q=>q.y))+pad};});}
  // Index spatial des faces : mêmes intersections, seules les faces éloignées sont ignorées.
  function nearbyFaces(faces,x,y){if(!faces.bins){faces.bins=new Map();for(const f of faces)for(let bx=Math.floor(f.left/32);bx<=Math.floor(f.right/32);bx++)for(let by=Math.floor(f.top/32);by<=Math.floor(f.bottom/32);by++){const k=bx+":"+by;if(!faces.bins.has(k))faces.bins.set(k,[]);faces.bins.get(k).push(f);}}return faces.bins.get(Math.floor(x/32)+":"+Math.floor(y/32))||[];}
  function roofDepth(faces,camera,x,y){const px=(x-camera.x)/camera.zoom,py=(y-camera.y)/camera.zoom;let best=-Infinity,nearest=Infinity,fallback=-Infinity;
   for(const face of nearbyFaces(faces,x,y)){if(x<face.left||x>face.right||y<face.top||y>face.bottom)continue;const {f,a,b,det,ps}=face,u=(px*b-52*(py+f.c))/det,v=(112*(py+f.c)-a*px)/det,z=f.c+f.zu*u+f.zv*v,d=world(u,v,z);if(M.contains([u,v],face.uv))best=Math.max(best,d);else for(let i=0;i<ps.length;i++){const distance=G.segmentDistance({x,y},ps[i],ps[(i+1)%ps.length]);if(distance<nearest){nearest=distance;fallback=d;}}}
   return Number.isFinite(best)?best:fallback;
  }
  function render({camera,objects,hero,images,floors,walls,roofs,roofAlpha,hiddenWalls=[],extras=[],heroRect=null,ownerBands=false}){
   const objectKeys=new Set();
   W=ctx.canvas.width;H=ctx.canvas.height;dpr=ctx.getTransform().a;const key=JSON.stringify([W,H,dpr,camera,ownerBands,walls,floors,hiddenWalls.map(w=>G.edgeId(w))]);if(key!==cachedKey){cachedKey=key;partKeys=new Set();scratch.width=W;scratch.height=H;staticLayers=[];const project=(u,v,z=0)=>G.project(u,v,camera,z),nodes=InteriorWallArt.junctions(walls,G.ends,project);
    walls.forEach((p,i)=>{const ends=G.ends(p),bounds=extent(ends.flatMap(q=>[project(...q),project(...q,125)]),18*camera.zoom),fixed=ends[0];const depthAt=(x,y)=>{const dx=(x-camera.x)/camera.zoom,dy=(y-camera.y)/camera.zoom;let u,v;if(p.rot%2){u=fixed[0];v=(dx-112*u)/52;}else{v=fixed[1];u=(dx-52*v)/112;}return world(u,v,-36*u+49*v-dy);};staticLayers.push(part(['wall',camera,p,InteriorWallArt.layout(p,G.ends,floors),ends.map(q=>nodes.get(q.join(','))?.half)],c=>InteriorWallArt.draw(c,p,project,G.ends,camera.zoom,{nodes,posts:false,floors,material:images.wood,simple:hiddenWalls.includes(p)}),bounds,depthAt,(ownerBands?1000:10)+i,hiddenWalls.includes(p)?.22:1));});
    [...nodes.values()].forEach((p,i)=>{const faded=!walls.some(w=>!hiddenWalls.includes(w)&&G.ends(w).some(q=>q[0]===p.u&&q[1]===p.v));const ground=project(p.u,p.v);staticLayers.push(part(['post',camera,p],c=>InteriorWallArt.drawPost(c,p,project,camera.zoom,{material:images.wood,simple:faded}),extent([ground,project(p.u,p.v,126)],18*camera.zoom),(x,y)=>world(p.u,p.v,(ground.y-y)/camera.zoom),(ownerBands?10000:1000)+i,faded?.22:1));});
    walls.forEach((p,i)=>{if(p.key!=='porte'||!p.open)return;const g=HouseDoor.geometry(p,G),depthAt=(x,y)=>{const px=(x-camera.x)/camera.zoom,py=(y-camera.y)/camera.zoom,t=(px-112*g.hinge[0]-52*g.hinge[1])/(112*g.direction[0]+52*g.direction[1]),u=g.hinge[0]+g.direction[0]*t,v=g.hinge[1]+g.direction[1]*t;return world(u,v,-36*u+49*v-py);};staticLayers.push(part(['door',camera,p,InteriorWallArt.layout(p,G.ends,floors)],c=>InteriorWallArt.drawLeaf(c,p,project,G.ends,camera.zoom,{floors,material:images.wood,simple:hiddenWalls.includes(p)}),extent(g.corners.map(q=>project(q.u,q.v,q.z)),8*camera.zoom),depthAt,(ownerBands?5000:300)+i,hiddenWalls.includes(p)?.22:1));});
    // Limiter le cache aux couches encore utilisées dans la scène.
    for(const k of partCache.keys())if(!partKeys.has(k))partCache.delete(k);
   }
   const layers=[...staticLayers];objects.forEach((p,i)=>{const k=JSON.stringify([i,p,camera,W,H,dpr]);objectKeys.add(k);let value=objectCache.get(k);if(!value){const file=M.file(p),r=M.bounds(p,camera,G),map=depths[file],origin=M.anchor(p),offset=world(...origin);const depthAt=(x,y)=>{const nx=Math.floor((x-r.x)/r.scale),ny=Math.floor((y-r.y)/r.scale);if(nx<0||ny<0||nx>=1024||ny>=896)return -Infinity;let encoded=map[ny*1024+nx];if(encoded===65535)for(let radius=1;radius<=2&&encoded===65535;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const xx=nx+dx,yy=ny+dy;if(xx<0||yy<0||xx>=1024||yy>=896)continue;const e=map[yy*1024+xx];if(e!==65535){encoded=e;break;}}return encoded===65535?-Infinity:offset+encoded/65534*8-4;};value=layer(c=>c.drawImage(images[file],r.x,r.y,r.w,r.h),r,depthAt,i+1);objectCache.set(k,value);}layers.push(value);});
   for(const e of extras){const k='extra:'+JSON.stringify([e.owner,e.image.src,e.rect,camera,W,H,dpr]);objectKeys.add(k);let value=objectCache.get(k);if(!value){value=layer(c=>c.drawImage(e.image,e.rect.x,e.rect.y,e.rect.w,e.rect.h),e.rect,(x,y)=>world(e.u,e.v,(e.footY-y)/camera.zoom),e.owner);objectCache.set(k,value);}layers.push(value);}
   for(const k of objectCache.keys())if(!objectKeys.has(k))objectCache.delete(k);
   const foot=G.project(...hero,camera),hs=110*camera.zoom/458,r=heroRect||{x:foot.x-98*hs,y:foot.y-464*hs,w:166*hs,h:472*hs};layers.push(layer(c=>c.drawImage(images.hero,r.x,r.y,r.w,r.h),r,(x,y)=>world(...hero,(foot.y-y)/camera.zoom),100));
   // Les couches transparentes du toit sont appliquées en dernier, avec le même test de profondeur.
   // La géométrie du toit ne dépend pas du panneau survolé ni des sols.
   if(roofAlpha){const k=JSON.stringify([W,H,dpr,camera,roofs,roofAlpha]);let value=roofCache.get(k);if(!value){const project=(u,v,z=0)=>G.project(u,v,camera,z),faces=prepareRoof(roofs,camera);value=layer(c=>ModuleRoofArt.draw(c,roofs,project,camera.zoom,{materials:images,alpha:1}),extent(roofs.flatMap(p=>RoofModules.mesh(p).flatMap(f=>f.points.map(q=>project(q.u,q.v,q.z)))),16*camera.zoom),(x,y)=>roofDepth(faces,camera,x,y),200,roofAlpha);if(roofCache.size>=2)roofCache.delete(roofCache.keys().next().value);roofCache.set(k,value);}layers.push(value);}
   const output=ctx.getImageData(0,0,W,H),zbuffer=new Float32Array(W*H).fill(-Infinity),owners=new Uint16Array(W*H);let heroTotal=0,clip=null;
   const blend=(l,transparent)=>{if(!l)return;const data=l.rgba,x0=clip?Math.max(0,clip.x-l.x):0,y0=clip?Math.max(0,clip.y-l.y):0,x1=clip?Math.min(l.w,clip.x+clip.w-l.x):l.w,y1=clip?Math.min(l.h,clip.y+clip.h-l.y):l.h;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const j=y*l.w+x,alpha=data[j*4+3]/255*l.alpha;if(!alpha||(alpha<.98)!==transparent)continue;if(l.owner===100)heroTotal++;const i=(y+l.y)*W+x+l.x,d=l.z[j];if(!Number.isFinite(d)||d<zbuffer[i]-1e-5)continue;const n=i*4,da=output.data[n+3]/255,oa=alpha+da*(1-alpha);for(let c=0;c<3;c++)output.data[n+c]=(data[j*4+c]*alpha+output.data[n+c]*da*(1-alpha))/oa;output.data[n+3]=Math.round(oa*255);if(!transparent)zbuffer[i]=d;if(alpha>.5)owners[i]=l.owner;}};
   // Les contours antialiasés se mélangent mieux si les surfaces sont d'abord approximativement ordonnées.
   const ordered=layers.filter(l=>l&&l.owner!==200).sort((a,b)=>{const center=l=>{const d=l.z[Math.floor(l.h/2)*l.w+Math.floor(l.w/2)];return Number.isFinite(d)?d:0;};return center(a)-center(b);});ordered.push(...layers.filter(l=>l&&l.owner===200));
   // Le vitrage, le toit transparent et les contours alpha ne doivent pas écrire un obstacle opaque.
   // Cache de la scène fixe. Pendant la marche, seule la région du personnage
   // refait la composition et les transparences ; la caméra déplace ensuite l'image.
   const signature=key+JSON.stringify([objects,extras.map(e=>[e.owner,e.image.src,e.rect]),roofs,roofAlpha]);
   const fixed=ordered.filter(l=>l.owner!==100),heroLayer=layers.find(l=>l&&l.owner===100);
   const backgroundKey=JSON.stringify([W,H,dpr,camera,floors]);
   if(!composition||composition.signature!==signature){
    const previous=composition,copyRect=(dst,src,stride)=>{for(let y=clip.y;y<clip.y+clip.h;y++){const a=(y*W+clip.x)*stride;dst.set(src.subarray(a,a+clip.w*stride),a);}};
    if(previous?.backgroundKey===backgroundKey){
     const before=new Set(previous.fixed),after=new Set(fixed),changed=[...previous.fixed.filter(l=>!after.has(l)),...fixed.filter(l=>!before.has(l))];
     if(changed.length){const x=Math.min(...changed.map(l=>l.x)),y=Math.min(...changed.map(l=>l.y));clip={x,y,w:Math.max(...changed.map(l=>l.x+l.w))-x,h:Math.max(...changed.map(l=>l.y+l.h))-y};
      const ground=output.data.slice();output.data.set(previous.opaque);copyRect(output.data,ground,4);zbuffer.set(previous.depth);owners.set(previous.opaqueOwners);
      for(let yy=clip.y;yy<clip.y+clip.h;yy++){zbuffer.fill(-Infinity,yy*W+clip.x,yy*W+clip.x+clip.w);owners.fill(0,yy*W+clip.x,yy*W+clip.x+clip.w);}
     }
    }
    fixed.forEach(l=>blend(l,false));const opaque=output.data.slice(),opaqueOwners=owners.slice();
    const depth=zbuffer.slice();if(clip){output.data.set(previous.final);copyRect(output.data,opaque,4);owners.set(previous.owners);copyRect(owners,opaqueOwners,1);}fixed.forEach(l=>blend(l,true));clip=null;
    composition={signature,backgroundKey,fixed,opaque,opaqueOwners,depth,final:output.data.slice(),owners:owners.slice()};
   }else{output.data.set(composition.final);zbuffer.set(composition.depth);owners.set(composition.owners);}
   if(heroLayer){clip=heroLayer;for(let y=clip.y;y<clip.y+clip.h;y++)for(let x=clip.x;x<clip.x+clip.w;x++){const i=y*W+x,n=i*4;output.data.set(composition.opaque.subarray(n,n+4),n);owners[i]=composition.opaqueOwners[i];}
    blend(heroLayer,false);ordered.forEach(l=>blend(l,true));}
   ctx.putImageData(output,0,0);let heroVisible=0;for(const id of owners)if(id===100)heroVisible++;last={W,H,owners,zbuffer,heroTotal,heroVisible,layers:layers.filter(Boolean)};return last;
  }
  return {render,get last(){return last;}};
 }
 root.MeshOcclusion={world,unpack,create};
})(globalThis);




/* Une matière commune, dépliée autour des arêtiers ; hauteurs des cours dans le monde. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));else root.ModuleRoofArt=factory(root.RoofModules);})(globalThis,function(M){'use strict';
 const EPS=1e-7,COURSE=M.RISE/3;
 const pointKey=q=>[q.u,q.v,q.z].map(x=>Math.round(x*1e7)).join(','),edgeKey=(a,b)=>[pointKey(a),pointKey(b)].sort().join('|');
 const lateral=(face,q)=>face.axis===0?q.v:q.u;
 const uv=(face,q)=>({x:face.sign*lateral(face,q)+face.offset,h:(q.z-M.SEAT)/M.RISE});
 // Déplier la matière par les arêtes communes, sans modifier aucun sommet du modèle.
 function charts(pieces){
  const faces=pieces.flatMap(p=>M.mesh(p).map(f=>({...f,p,axis:Math.abs(f.plane.zu)>Math.abs(f.plane.zv)?0:1,sign:null,offset:0,links:[]}))),edges=new Map();
  for(const f of faces)for(let i=0;i<f.points.length;i++){
   const a=f.points[i],b=f.points[(i+1)%f.points.length],key=edgeKey(a,b),other=edges.get(key);
   if(other){f.links.push({face:other.face,a,b});other.face.links.push({face:f,a,b});}else edges.set(key,{face:f,a,b});
  }
  for(const seed of faces){if(seed.sign!==null)continue;seed.sign=1;seed.offset=0;const queue=[seed];
   while(queue.length){const f=queue.shift();for(const {face:g,a,b} of f.links){if(g.sign!==null)continue;
    const xa=uv(f,a).x,xb=uv(f,b).x,la=lateral(g,a),lb=lateral(g,b),delta=lb-la;
    g.sign=Math.abs(delta)>EPS?Math.round((xb-xa)/delta):f.sign;g.offset=xa-g.sign*la;queue.push(g);
   }}
  }return faces;
 }
 function draw(ctx,pieces,P,zoom,{alpha=1,materials={}}={}){
  const image=materials.pan,ready=image?.naturalWidth>0;
  const poly=(points,fill)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}};
  const prepared=charts(pieces);
  ctx.save();ctx.globalAlpha*=alpha;
  // La frange ne change pas l'accroche ; elle utilise la même matière que les faces.
  for(const face of prepared)for(let n=0;n<face.points.length;n++){
   const a=face.points[n],b=face.points[(n+1)%face.points.length];
   if(face.links.some(j=>edgeKey(j.a,j.b)===edgeKey(a,b)))continue;
   const top=[P(a.u,a.v,a.z),P(b.u,b.v,b.z)],low=[];
   for(let i=36;i>=0;i--){const t=i/36,drop=4+2*Math.sin(i*2.73)**2;low.push(P(a.u+(b.u-a.u)*t,a.v+(b.v-a.v)*t,a.z+(b.z-a.z)*t-drop));}
   ctx.save();poly([...top,...low],'#715b39');ctx.clip();
   if(ready){const w=image.naturalWidth,h=image.naturalHeight;ctx.transform((top[1].x-top[0].x)/w,(top[1].y-top[0].y)/w,0,7*zoom/h,top[0].x,top[0].y);ctx.filter='saturate(.8) brightness(.82)';ctx.drawImage(image,0,h*.87,w,h*.13,0,0,w,h);}ctx.restore();
  }
  const faces=prepared.sort((a,b)=>a.points.reduce((s,q)=>s+P(q.u,q.v,0).y,0)/a.points.length-b.points.reduce((s,q)=>s+P(q.u,q.v,0).y,0)/b.points.length);
  for(const face of faces){const f=face.plane,o=P(0,0,f.c),a=P(1,0,f.c+f.zu),b=P(0,1,f.c+f.zv);
   if((a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x)<=0)continue;
   ctx.save();poly(face.points.map(q=>P(q.u,q.v,q.z)),'#927440');ctx.clip();
   if(ready){
    const Q=(x,h)=>{const z=M.SEAT+h*M.RISE,l=(x-face.offset)/face.sign;return face.axis===0?P((z-f.c-f.zv*l)/f.zu,l,z):P(l,(z-f.c-f.zu*l)/f.zv,z);};
    const coords=face.points.map(q=>uv(face,q)),xmin=Math.min(...coords.map(q=>q.x)),xmax=Math.max(...coords.map(q=>q.x)),hmin=Math.min(...coords.map(q=>q.h)),hmax=Math.max(...coords.map(q=>q.h)),w=image.naturalWidth,h=image.naturalHeight;
    // Répétition réfléchie : aucun saut entre les deux bords d'une image non bouclable.
    // Les cours dépendent de la hauteur absolue, jamais de l'origine d'une pièce.
    for(let level=Math.floor(hmin+EPS);level<Math.ceil(hmax-EPS);level++)for(let k=Math.floor(xmin+EPS);k<Math.ceil(xmax-EPS);k++){
     const o=Q(k,level+1),x=Q(k+1,level+1),y=Q(k,level);ctx.save();ctx.transform((x.x-o.x)/w,(x.y-o.y)/w,(y.x-o.x)/h,(y.y-o.y)/h,o.x,o.y);
     ctx.filter='saturate(.8) brightness(.90)';if(((k%2)+2)%2){ctx.translate(w,0);ctx.scale(-1,1);}ctx.drawImage(image,0,0);ctx.restore();
    }
    // Coiffe de faîtage : petite bande du même chaume, repliée sur les deux versants.
    // Même échelle de brins et même phase latérale que la couverture voisine.
    if(face.p.kind==='ridge'){
     const top=(face.p.base-M.SEAT)/M.RISE+.5,bottom=top-.065,strip=.065*h;
     ctx.save();poly([Q(xmin,top),Q(xmax,top),Q(xmax,bottom),Q(xmin,bottom)]);ctx.clip();
     for(let k=Math.floor(xmin+EPS);k<Math.ceil(xmax-EPS);k++){
      const o=Q(k,top),x=Q(k+1,top),y=Q(k,bottom);ctx.save();ctx.transform((x.x-o.x)/w,(x.y-o.y)/w,(y.x-o.x)/strip,(y.y-o.y)/strip,o.x,o.y);ctx.filter='saturate(.8) brightness(.90)';if(((k%2)+2)%2){ctx.translate(w,0);ctx.scale(-1,1);}ctx.drawImage(image,0,h*.75,w,strip,0,0,w,strip);ctx.restore();
     }
     ctx.restore();ctx.beginPath();const a=Q(xmin,bottom),b=Q(xmax,bottom);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='rgba(45,32,18,.28)';ctx.lineWidth=.7*zoom;ctx.stroke();
    }
   }ctx.restore();
  }
  // Une ombre discrète au fond de la noue ; aucune frange ni poutre dans le creux.
  for(const p of pieces.filter(p=>p.kind==='valley')){
   const pts=[0,1].map(t=>{const [u,v]=M.turn(t,t,p.rot);return P(p.u+u,p.v+v,M.height(p,p.u+u,p.v+v));});ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);ctx.lineTo(pts[1].x,pts[1].y);ctx.strokeStyle='rgba(45,32,18,.25)';ctx.lineWidth=1.2*zoom;ctx.stroke();
  }ctx.restore();
 }
 return {draw,charts,uv,COURSE};
});

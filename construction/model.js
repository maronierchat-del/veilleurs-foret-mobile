(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./porte.js'):root.HouseDoor);if(typeof module==='object'&&module.exports)module.exports=api;else root.ValidatedModel=api;})(globalThis,function(HouseDoor){
 'use strict';
 const specs={etabli:{name:'Établi',states:[''],labels:['Avec rabot'],size:[1,.5]},potager:{name:'Potager',states:['vide','jeunes','mures'],labels:['Vide','Jeunes pousses','Carottes mûres'],size:[1,1]},champignonniere:{name:'Champignonnière',states:['vide','bebes','mures'],labels:['Vide','Bébés','Champignons mûrs'],size:[1,1]},pepiniere:{name:'Pépinière',states:['fermee','ouverte'],labels:['Fermée','Pousses prêtes'],size:[1,1]}};
 const turn=([x,y],r)=>[[x,y],[-y,x],[-x,-y],[y,-x]][r];
 const snap=(n,step)=>{const q=n/step,r=Math.round(q);return Math.floor(Math.abs(q-r)<1e-10?r:q)*step;};
 const file=p=>`${p.key}${p.stage?'-'+p.stage:''}-${p.rot*90}.png`;
 const dimensions=p=>p.rot%2?[...specs[p.key].size].reverse():specs[p.key].size;
 const rect=p=>{const [w,h]=dimensions(p);return [[p.u,p.v],[p.u+w,p.v],[p.u+w,p.v+h],[p.u,p.v+h]];};
 function anchor(p){if(p.key!=='etabli')return [p.u+.5,p.v+.5];const corners=[[-.5,-.253],[.5,-.253],[.5,.247],[-.5,.247]].map(q=>turn(q,p.rot));return [p.u-Math.min(...corners.map(q=>q[0])),p.v-Math.min(...corners.map(q=>q[1]))];}
 function bounds(p,camera,G){const a=anchor(p),q=G.project(...a,camera),s=camera.zoom/2.65;return {x:q.x-512*s,y:q.y-640*s,w:1024*s,h:896*s,scale:s};}
 function hull(points){const ps=[...new Map(points.map(q=>[q.join(','),q])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);let lo=[],hi=[];for(const p of ps){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of ps.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return [...lo.slice(0,-1),...hi.slice(0,-1)];}
 function polygons(p,doors=[]){const a=anchor(p);return [rect(p),...(p.key==='pepiniere'&&p.stage==='ouverte'?doors.map(d=>hull(d.points).map(q=>{const r=turn(q,p.rot);return [a[0]+r[0],a[1]+r[1]];})):[])];}
 function overlap(a,b){for(const poly of [a,b])for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],axis=[q[1]-p[1],p[0]-q[0]],aa=a.map(v=>v[0]*axis[0]+v[1]*axis[1]),bb=b.map(v=>v[0]*axis[0]+v[1]*axis[1]);if(Math.max(...aa)<=Math.min(...bb)+1e-9||Math.max(...bb)<=Math.min(...aa)+1e-9)return false;}return true;}
 function wallPoly(w,G){const [a,b]=G.ends(w),dx=b[0]-a[0],dy=b[1]-a[1],t=.035;return [[a[0]-dy*t,a[1]+dx*t],[b[0]-dy*t,b[1]+dx*t],[b[0]+dy*t,b[1]-dx*t],[a[0]+dy*t,a[1]-dx*t]];}
 // Placement sur grille : contact au bord autorisé, traversée d'arête interdite.
 // L'épaisseur de wallPoly reste utilisée pour les déplacements du personnage.
 function crossesWall(poly,w,G){const [a,b]=G.ends(w);let lo=0,hi=1;const eps=1e-9;
  const area=poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0),sign=area>=0?1:-1;
  for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);if(length<eps)continue;const side=r=>sign*(dx*(r[1]-p[1])-dy*(r[0]-p[0]))/length,start=side(a),delta=side(b)-start;if(Math.abs(delta)<eps){if(start<=eps)return false;continue;}const t=(eps-start)/delta;if(delta>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(hi-lo<=eps)return false;}
  return hi-lo>eps;
 }
 function evaluate(p,objects,walls,doors,G,hammer=true){if(!hammer)return {valid:false,reason:'Marteau requis.'};const polys=polygons(p,doors);if(walls.some(w=>polys.some(a=>crossesWall(a,w,G))))return {valid:false,reason:'Un mur bloque ce placement.'};if(walls.some(w=>w.key==='porte'&&w.open&&polys.some(poly=>overlap(poly,HouseDoor.geometry(w,G).polygon))))return {valid:false,reason:'Le vantail ouvert bloque ce placement.'};if(objects.some(q=>q.key!==p.key&&polygons(q,doors).some(b=>polys.some(a=>overlap(a,b)))))return {valid:false,reason:'Un objet ou une porte ouverte bloque ce placement.'};return {valid:true,reason:'Emplacement libre.'};}
 function contains(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
 const distance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);};
 function walkWallPolys(w,G){if(w.key!=='porte'||!w.open)return [wallPoly(w,G)];const [a,b]=G.ends(w),dx=b[0]-a[0],dy=b[1]-a[1],t=.035;return [...[[0,.13],[.87,1]].map(([lo,hi])=>[[a[0]+dx*lo-dy*t,a[1]+dy*lo+dx*t],[a[0]+dx*hi-dy*t,a[1]+dy*hi+dx*t],[a[0]+dx*hi+dy*t,a[1]+dy*hi-dx*t],[a[0]+dx*lo+dy*t,a[1]+dy*lo-dx*t]]),HouseDoor.geometry(w,G).polygon];}
 function blocked(point,objects,walls,doors,G){const polys=[...objects.flatMap(p=>polygons(p,doors)),...walls.flatMap(w=>walkWallPolys(w,G))];return polys.some(poly=>contains(point,poly)||poly.some((a,i)=>distance(point,a,poly[(i+1)%poly.length])<.1));}
 function walk(from,to,objects,walls,doors,G){let result=[...from];const steps=Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])*80);for(let i=1;i<=steps;i++){const q=from.map((v,j)=>v+(to[j]-v)*i/steps);if(blocked(q,objects,walls,doors,G))break;result=q;}return result;}
 return {specs,turn,snap,file,dimensions,rect,anchor,bounds,hull,polygons,overlap,wallPoly,evaluate,contains,blocked,walk};
});



/* Jalon 3 — PROPOSITION À VALIDER. Dessin construit dans le monde (u,v,z).
   Aucun PNG déformé, reflet ou réduction pour simuler une orientation. */
(function(root){
 'use strict';
 const KEYS=new Set(['mur','porte','fenetre','cloture','portillon']);
 const height=p=>['cloture','portillon'].includes(p.key)?67:119;
 const postHalf=p=>['cloture','portillon'].includes(p.key)?.035:.06;
 const PANEL_HALF=.035,FRAME_HALF=.06;
 const rand=(a,b)=>{let n=Math.imul(a+19,73856093)^Math.imul(b+31,19349663);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967296;};
 // L'intérieur vient des cases de sol, jamais de la caméra ni du numéro d'axe.
 function layout(p,ends,floors=[]){
  const [a,b]=ends(p),cells=new Set(floors.filter(q=>q.key==='sol').map(q=>`${q.u},${q.v}`));
  const horizontal=a[1]===b[1],u=Math.min(a[0],b[0]),v=Math.min(a[1],b[1]);
  const plus=cells.has(`${u},${v}`),minus=cells.has(horizontal?`${u},${v-1}`:`${u-1},${v}`);
  const sign=plus===minus?0:plus?1:-1,inward={u:horizontal?0:sign,v:horizontal?sign:0};
  // Ossature traversante : le bardage reste centré, quel que soit le côté du sol.
  return {inward,known:sign!==0,offset:{u:0,v:0}};
 }
 function describe(p,ends,project,floors=[],nodes=null){
  const [a,b]=ends(p),du=b[0]-a[0],dv=b[1]-a[1],n={u:-dv*PANEL_HALF,v:du*PANEL_HALF};
  const span={start:Math.max(nodes?.get(a.join(','))?.half||0,postHalf(p)),end:1-Math.max(nodes?.get(b.join(','))?.half||0,postHalf(p))};
  const frame=layout(p,ends,floors);
  const c=project(a[0],a[1]),d=project(a[0]+n.u,a[1]+n.v);if(d.y<c.y){n.u=-n.u;n.v=-n.v;}
  const world=(t,z,side=1)=>({u:a[0]+du*t+frame.offset.u+n.u*side,v:a[1]+dv*t+frame.offset.v+n.v*side,z});
  const point=(t,z,side=1)=>{const q=world(t,z,side);return project(q.u,q.v,q.z);};
  const opening=p.key==='fenetre'?{left:.17,right:.83,bottom:39,top:94}:p.key==='porte'?{left:.13,right:.87,bottom:0,top:101}:null;
  const parts=opening?[[span.start,0,opening.left,height(p)],[opening.right,0,span.end,height(p)],[opening.left,opening.top,opening.right,height(p)],...(opening.bottom?[[opening.left,0,opening.right,opening.bottom]]:[])]:[[span.start,0,span.end,height(p)]];
  const i=project(a[0]+frame.inward.u,a[1]+frame.inward.v);
  return {a,b,n,world,point,opening,parts,height:height(p),span,panelHalf:PANEL_HALF,frameHalf:FRAME_HALF,frame,insideVisible:!frame.known||i.y>c.y};
 }
 function junctions(pieces,ends,project){
  const nodes=new Map();
  for(const p of pieces.filter(p=>KEYS.has(p.key))){
   const e=ends(p),depth=e.reduce((s,q)=>s+project(...q).y,0)/2;
   for(const q of e){const key=q.join(','),node=nodes.get(key)||{u:q[0],v:q[1],height:0,count:0,owner:null,depth:-Infinity};
    node.count++;node.half=Math.max(node.half||0,postHalf(p));node.height=Math.max(node.height,height(p));if(depth>node.depth||depth===node.depth&&p.id>node.owner){node.owner=p.id;node.depth=depth;}nodes.set(key,node);
   }
  }
  for(const node of nodes.values()){node.postU=node.u;node.postV=node.v;}
  return nodes;
 }
 function crossesFixture(edge,fixture,ends,spans){
  const [a,b]=ends(edge),cells=new Set(spans(fixture));
  const pair=a[1]===b[1]?[[Math.min(a[0],b[0]),a[1]-1],[Math.min(a[0],b[0]),a[1]]]:[[a[0]-1,Math.min(a[1],b[1])],[a[0],Math.min(a[1],b[1])]];
  return pair.every(q=>cells.has(q.join(',')));
 }
 function beamGeometry(m,t0,z0,t1,z1,thickness,halfDepth=.05){
  t0=Math.max(m.span.start,t0);t1=Math.min(m.span.end,t1);
  const world=(f,w=0,side=1)=>m.world(t0+(t1-t0)*f,z0+(z1-z0)*f+w,side*halfDepth/PANEL_HALF);
  const point=(f,w=0,side=1)=>m.point(t0+(t1-t0)*f,z0+(z1-z0)*f+w,side*halfDepth/PANEL_HALF);
  return {start:t0,end:t1,thickness,halfDepth,world,point};
 }
 function draw(ctx,p,project,ends,zoom,{nodes=null,ghost=false,floors=[],material=null,posts=true}={}){
  const m=describe(p,ends,project,floors,nodes),P=m.point,H=m.height;
  ctx.save();ctx.globalAlpha=ghost?.46:1;ctx.lineJoin='miter';ctx.lineWidth=1.25*zoom;
  function poly(points,fill,stroke='#211914'){
   ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();
   if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function rect(t0,z0,t1,z1,fill,stroke){t0=Math.max(m.span.start,t0);t1=Math.min(m.span.end,t1);poly([P(t0,z0),P(t1,z0),P(t1,z1),P(t0,z1)],fill,stroke);}
  function line(points,color='#2a1e16',width=.8){ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle=color;ctx.lineWidth=width*zoom;ctx.stroke();}
  function wood(t0,z0,t1,z1,seed,horizontal=false){
   t0=Math.max(m.span.start,t0);t1=Math.min(m.span.end,t1);if(t1<=t0)return;
   ctx.save();rect(t0,z0,t1,z1,'#604936',null);ctx.clip();
   if(!horizontal&&material?.naturalWidth){
    // Matière plane, projetée comme une surface (pas un sprite complet tourné).
    // Repère commun à tout le panneau : les planches continuent autour des baies.
    const a=P(0,H),b=P(1,H),d=P(0,0),w=material.naturalWidth,h=material.naturalHeight;
    ctx.transform((b.x-a.x)/w,(b.y-a.y)/w,(d.x-a.x)/h,(d.y-a.y)/h,a.x,a.y);
    ctx.filter='saturate(0.7) brightness(0.95)';ctx.drawImage(material,0,0);ctx.restore();return;
   }
   const strips=horizontal?1:Math.max(1,Math.round((t1-t0)*6));
   // Largeurs inégales et chants fendus, contenus dans le panneau géométrique.
   const bounds=Array.from({length:strips+1},(_,i)=>t0+(t1-t0)*(i===0?0:i===strips?1:(i+(rand(seed,i)-.5)*.48)/strips));
   for(let s=0;s<strips;s++){
    const l=bounds[s],r=bounds[s+1];
    const edge=(t,z,k)=>t+.007*Math.sin(z*.13+seed+k*2.7)*Math.sin((z-z0)/(z1-z0)*Math.PI);
    const left=Array.from({length:13},(_,j)=>{const z=z0+(z1-z0)*j/12;return P(edge(l,z,s),z);});
    const right=Array.from({length:13},(_,j)=>{const z=z1-(z1-z0)*j/12;return P(edge(r,z,s+1),z);});
    poly([...left,...right],`hsl(${26+Math.round(rand(seed,s)*4)} 27% ${28+Math.round(rand(seed,s+1)*13)}%)`,null);
    if(!horizontal){
     const w=r-l,h=z1-z0;
     poly([P(l,z0),P(l+w*.19,z0+h*.06),P(l+w*.1,z0+h*.32),P(l+w*.16,z0+h*.57),P(l+w*.07,z1),P(l,z1)],'#251b164a',null);
     poly([P(r-w*.12,z0+h*.08),P(r-w*.2,z0+h*.26),P(r-w*.1,z0+h*.52),P(r-w*.16,z0+h*.83),P(r-w*.04,z1),P(r-w*.03,z0)],'#c59a6038',null);
     for(let k=0;k<4;k++){
      const f=rand(seed+s,k+90),z=z0+h*f,t=l+w*(.15+rand(seed,k+100)*.7),len=Math.min(h*.2,14+rand(s,k)*17);
      poly([P(t,z),P(t-.008,z+len*.38),P(t-.003,z+len*.65),P(t-.009,z+len),P(t+.005,z+len*.5)],'#281b1666',null);
     }
    }
    if(s){line(left,'#211914',1.6);line(left.slice(2,6).map(q=>({x:q.x+1.1*zoom,y:q.y})), '#c49a6588',.7);}
    for(let g=0;g<14;g++){
     const f=rand(seed+s,g+6),t=l+(r-l)*(.12+f*.73),z=z0+rand(seed,g+s+17)*(z1-z0),length=(z1-z0)*(.18+rand(s,g)*.5);
     const ink=g%4?'#281c16b8':'#b7946266';
     if(horizontal){const a=l+(r-l)*f,b=Math.min(r,a+(r-l)*(.2+rand(g,seed)*.6)),h=z0+(z1-z0)*rand(seed,g+40);line([P(a,h),P(a+(b-a)*.4,h+.6),P(b,h-.4)],ink,g%4?.7:.5);}
     else line([P(t,Math.max(z0,z-length)),P(t-.004,z-length*.7),P(t+.005,z-length*.37),P(t-.002,z)],ink,g%4?.75:.5);
    }
    if(p.key!=='porte'&&!horizontal&&z1-z0>70&&r-l>.07&&rand(seed,s+92)>.68){
     const t=l+(r-l)*(.3+rand(seed,s+70)*.4),z=z0+(z1-z0)*(.3+rand(seed,s+80)*.4);
     for(let k=1;k<=3;k++){const ring=[];for(let j=0;j<=20;j++){const a=j*Math.PI/10;ring.push(P(t+Math.cos(a)*.008*k,z+Math.sin(a)*1.7*k+.3*Math.sin(a*3)));}line(ring,'#302117b0',.7);}
     line([P(t,z+6),P(t-.006,z+12),P(t-.002,Math.min(z1,z+22))],'#271c16',.8);
    }
   }
   ctx.restore();ctx.lineWidth=1.15*zoom;
  }
  // Bois d'ossature taillé à la main, dessiné dans le plan réel du panneau.
  function beam(t0,z0,t1,z1,thickness,seed,halfDepth=.05){
   const volume=beamGeometry(m,t0,z0,t1,z1,thickness,halfDepth);if(volume.end<=volume.start)return;
   const Q=volume.point;
   function cap(points,fill,light){
    ctx.save();ctx.lineWidth=1.25*zoom;poly(points,fill);
    if(material?.naturalWidth){
     ctx.clip();const [a,b,,d]=points,sw=material.naturalWidth*.065,sh=material.naturalHeight;
     ctx.filter=`saturate(0.7) brightness(${light})`;
     ctx.transform((b.x-a.x)/sw,(b.y-a.y)/sw,(d.x-a.x)/sh,(d.y-a.y)/sh,a.x,a.y);
     ctx.drawImage(material,material.naturalWidth*.3,0,sw,sh,0,0,sw,sh);
    }
    ctx.restore();ctx.lineWidth=1.25*zoom;poly(points,null);
   }
   // Dessus et bout proche du prisme : même axe médian que le panneau et les poteaux.
   cap([Q(0,thickness/2,-1),Q(0,thickness/2),Q(1,thickness/2),Q(1,thickness/2,-1)],'#96704b',1.15);
   const near=project(...m.b).y>project(...m.a).y?1:0;
   cap([Q(near,thickness/2,-1),Q(near,thickness/2),Q(near,-thickness/2),Q(near,-thickness/2,-1)],'#513a29',.7);
   const outline=[Q(0,-thickness/2),Q(.12,-thickness*.49),Q(.26,-thickness*.54),Q(.28,-thickness*.35),Q(.31,-thickness*.51),Q(.61,-thickness*.54),Q(.84,-thickness*.46),Q(1,-thickness/2),Q(1,thickness/2),Q(.81,thickness*.48),Q(.79,thickness*.34),Q(.76,thickness*.5),Q(.54,thickness*.46),Q(.34,thickness*.55),Q(.16,thickness*.45),Q(0,thickness/2)];
   ctx.save();ctx.lineWidth=2*zoom;poly(outline,'#785638');ctx.clip();
   if(material?.naturalWidth){
    const a=Q(0,-thickness/2),b=Q(0,thickness/2),d=Q(1,-thickness/2),sw=material.naturalWidth*.065,sh=material.naturalHeight;
    ctx.save();ctx.filter='saturate(0.7) brightness(1.05)';ctx.transform((b.x-a.x)/sw,(b.y-a.y)/sw,(d.x-a.x)/sh,(d.y-a.y)/sh,a.x,a.y);
    ctx.drawImage(material,material.naturalWidth*.3,0,sw,sh,0,0,sw,sh);ctx.restore();
   }else{
   poly([Q(0,thickness*.22),Q(.19,thickness*.18),Q(.23,thickness*.37),Q(.4,thickness*.26),Q(.6,thickness*.34),Q(.79,thickness*.16),Q(1,thickness*.28),Q(1,thickness*.5),Q(.7,thickness*.43),Q(.3,thickness*.51),Q(0,thickness*.5)],'#b08858',null);
   }
   for(let k=0;k<7;k++){const f=rand(seed,k+81),w=(rand(seed,k+91)-.5)*thickness;poly([Q(f,w),Q(f+.06,w-.6),Q(f+.17,w+.1),Q(f+.04,w+1.6)],'#281a1577',null);}
   for(let g=0;g<(material?5:13);g++){
    const f=rand(seed,g)*.85,l=.12+rand(g,seed)*.55,w=(rand(seed,g+41)-.5)*thickness*.8;
    line([Q(f,w),Q(Math.min(1,f+l*.4),w+.55),Q(Math.min(1,f+l),w-.35)],g%4?'#2d1d15b8':'#d0a16a99',g%4?.8:.65);
   }
   ctx.restore();ctx.lineWidth=1.8*zoom;poly(outline,null);
   for(const f of [.09,.91]){
    line([Q(f,-.8),Q(f,.5)],'#1c1713',2.3);
    line([Q(f-.007,.7),Q(f+.004,.7)],'#b39b78',.7);
   }
   ctx.lineWidth=1.25*zoom;
  }
  // Les bois traversent l'épaisseur : leur face proche dépasse le bardage des deux côtés.
  // Dessus et terminaisons : épaisseur réelle identique dans les deux axes.
  if(!['cloture','portillon'].includes(p.key)){
   poly([P(m.span.start,H,-1),P(m.span.end,H,-1),P(m.span.end,H),P(m.span.start,H)],'#a38459');
  }
  if(['cloture','portillon'].includes(p.key)){
   // Ajouré : aucun aplat de fond sous les traverses.
   wood(.02,18,.98,26,17,true);wood(.02,46,.98,54,18,true);
   rect(.02,18,.98,26,null);rect(.02,46,.98,54,null);
   if(p.key==='portillon')poly([P(.08,19),P(.12,17),P(.93,50),P(.88,54)],'#785638');
  }else{
   m.parts.forEach((r,i)=>wood(...r,Math.round(p.u*7+p.v*13)+i*11));
   // Ossature épaisse et jambes de force : référence de la joueuse.
   if(p.key==='mur'){
    beam(.03,77,.29,H-15,10,81);
    beam(.71,H-15,.97,77,10,82);
    beam(.04,5,.96,5,6,83);
   }
   beam(m.span.start,H-7,m.span.end,H-7,13,13,FRAME_HALF);
   if(m.opening){
    const o=m.opening;
    // Tableaux intérieurs visibles : l'ouverture n'est pas une image collée.
    for(const t of [o.left,o.right])poly([P(t,o.bottom,-1),P(t,o.top,-1),P(t,o.top),P(t,o.bottom)],'#4e392a');
    poly([P(o.left,o.top,-1),P(o.right,o.top,-1),P(o.right,o.top),P(o.left,o.top)],'#513b29');
    if(p.key==='porte'){
     const l=o.left+.025,r=o.right-.025;
     wood(l,2,r,o.top-2,39);rect(l,2,r,o.top-2,null);
     beam(l+.025,19,r-.025,o.top-17,11,71);
     for(const z of [15,o.top-13])beam(l,z,r,z,9,73+z);
     // Pentures forgées, deux gonds à gauche et un seul anneau à droite.
     for(const z of [26,78]){
      poly([P(l-.004,z-2),P(l+.23,z-1.5),P(l+.25,z+1),P(l+.22,z+2.5),P(l-.004,z+2)],'#322b22');
      for(const t of [l+.025,l+.19])line([P(t,z),P(t+.002,z+.7)],'#ac9270',1.1);
     }
     const t=r-.09;
     rect(t-.018,44,t+.018,52,'#30271e');
     const ring=[];for(let i=0;i<=24;i++){const a=i*Math.PI/12;ring.push(P(t+.036*Math.cos(a),44+5*Math.sin(a)));}
     line(ring,'#1d1712',3);line(ring,'#9b805a',1);
    }else{
     rect(o.left,o.bottom,o.right,o.top,'#c3cbb54d',null);
     const middle=(o.left+o.right)/2,zmid=(o.bottom+o.top)/2;
     // Verre discret : pas de grands reflets diagonaux de menuiserie neuve.
     wood(middle-.023,o.bottom,middle+.023,o.top,61);
     line([P(middle-.023,o.bottom),P(middle-.018,zmid),P(middle-.023,o.top)],'#211914',1.1);
     wood(o.left,zmid-2,o.right,zmid+2,62,true);
     line([P(o.left,zmid-2),P(middle,zmid-1.4),P(o.right,zmid-2)],'#211914',1.1);
    }
    for(const t of [o.left,o.right]){
     wood(t-.027,o.bottom,t+.027,o.top,51);
     for(const side of [-1,1])line([P(t+side*.027,o.bottom),P(t+side*.022,o.bottom+(o.top-o.bottom)*.34),P(t+side*.029,o.bottom+(o.top-o.bottom)*.71),P(t+side*.027,o.top)],'#211914',1.2);
    }
    beam(o.left-.055,o.top+1,o.right+.055,o.top+1,8,53);
    if(p.key==='fenetre'){
     beam(o.left-.065,o.bottom,o.right+.065,o.bottom,8,54);
     beam(.035,H-17,.14,97,7,87);beam(.86,97,.965,H-17,7,88);
    }
   }
  }
  if(posts)for(const q of [m.a,m.b]){
   const node=nodes?.get(q.join(','));if(node&&node.owner!==p.id)continue;
   drawPost(ctx,node||{u:q[0],v:q[1],height:H,half:postHalf(p)},project,zoom,{material,ghost});
  }
  ctx.restore();return m;
 }
 function postGeometry(node){
  const u=node.u,v=node.v,s=node.half??FRAME_HALF;
  // Les plans de raccord sont fixes. Le grain garde l'irrégularité, pas l'axe du bois.
  return {u,v,half:s,height:node.height+3,corners:[[u-s,v-s],[u+s,v-s],[u+s,v+s],[u-s,v+s]]};
 }
 function drawPost(ctx,node,project,zoom,{material=null,ghost=false}={}){
   ctx.save();ctx.globalAlpha=ghost?.46:1;ctx.lineJoin='miter';
   function poly(points,fill,stroke='#211914'){
    ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
   }
   function line(points,color,width){ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle=color;ctx.lineWidth=width*zoom;ctx.stroke();}
   const volume=postGeometry(node),{corners}=volume,h=node.height,pu=volume.u,pv=volume.v;
   const a=corners.map(([u,v])=>project(u,v,0)),b=corners.map(([u,v])=>project(u,v,volume.height));
   for(let i=0;i<4;i++){const j=(i+1)%4;if(a[j].x<a[i].x){
    const face=[a[i],a[j],b[j],b[i]];
    ctx.save();ctx.lineWidth=2*zoom;poly(face,i===2?'#533a29':'#7b5739');ctx.clip();
    if(material?.naturalWidth){
     const sw=material.naturalWidth*.075,sh=material.naturalHeight;
     ctx.save();ctx.filter=`saturate(0.7) brightness(${i===2?.7:.95})`;ctx.transform((b[j].x-b[i].x)/sw,(b[j].y-b[i].y)/sw,(a[i].x-b[i].x)/sh,(a[i].y-b[i].y)/sh,b[i].x,b[i].y);
     ctx.drawImage(material,material.naturalWidth*(i===2?.08:.3),0,sw,sh,0,0,sw,sh);ctx.restore();
    }
    for(let g=0;g<(material?6:18);g++){const f=.06+g*.14,z=h*(.03+rand(g,19)*.6),u=corners[i][0]*(1-f)+corners[j][0]*f,v=corners[i][1]*(1-f)+corners[j][1]*f;line([project(u,v,z),project(u+.003,v,z+h*.16),project(u-.003,v,Math.min(h,z+h*.45))],g%3?'#241a13c8':'#c59a6588',g%3?.8:1.2);}
    for(const z of [15,h-12]){const u=(corners[i][0]+corners[j][0])/2,v=(corners[i][1]+corners[j][1])/2;line([project(u,v,z),project(u+.002,v,z+1.4)],'#231a14',1.8);}
    ctx.restore();
   }}
   ctx.lineWidth=2*zoom;poly(b,'#b48a59');
   line([b[0],project(pu-.006,pv+.012,h+3),b[2]],'#604129',.9);
   ctx.restore();return volume;
 }
 const api={height,layout,describe,junctions,beamGeometry,postGeometry,drawPost,crossesFixture,draw,supports:key=>KEYS.has(key)};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.WallProposal=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);

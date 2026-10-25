/* PROPOSITION NON VALIDÉE — plancher J2 dessiné en coordonnées du sol.
   Surface continue, rives et coins calculés. Aucun sprite source utilisé/retouché. */
(function(root){
 'use strict';
 const key=(u,v)=>`${u},${v}`,dirs=[[0,-1],[1,0],[0,1],[-1,0]];
 function topology(pieces){
  const cells=new Map([...pieces].sort((a,b)=>a.u-b.u||a.v-b.v).map(p=>[key(p.u,p.v),{u:p.u,v:p.v}])),edges=[];
  for(const p of cells.values()){
   const q=[[p.u,p.v],[p.u+1,p.v],[p.u+1,p.v+1],[p.u,p.v+1]];
   dirs.forEach(([du,dv],i)=>{if(!cells.has(key(p.u+du,p.v+dv)))edges.push({a:q[i],b:q[(i+1)%4],dir:i});});
  }
  const outgoing=new Map();
  edges.forEach((e,i)=>{const k=e.a.join(',');if(!outgoing.has(k))outgoing.set(k,[]);outgoing.get(k).push(i);});
  const used=new Set(),contours=[];
  for(let start=0;start<edges.length;start++){
   if(used.has(start))continue;
   const contour=[],first=edges[start].a.join(',');let i=start;
   while(!used.has(i)){
    const e=edges[i];used.add(i);contour.push(e.a);
    if(e.b.join(',')===first)break;
    const next=(outgoing.get(e.b.join(','))||[]).filter(n=>!used.has(n));
    // Rester sur la même composante quand deux dalles se touchent par un sommet.
    const rank=n=>[1,0,3,2].indexOf((edges[n].dir-e.dir+4)%4);
    next.sort((a,b)=>rank(a)-rank(b));
    if(!next.length)throw new Error('Contour de plancher ouvert');i=next[0];
   }
   // Fusionner les rives colinéaires : pas de poteau/trait vertical à chaque case.
   const corners=contour.filter((p,j)=>{
    const a=contour[(j+contour.length-1)%contour.length],b=contour[(j+1)%contour.length];
    return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);
   });
   contours.push(corners);
  }
  return {cells:[...cells.values()],edges,contours};
 }
 const random=(a,b,c=0)=>{let n=Math.imul(a,73856093)^Math.imul(b,19349663)^Math.imul(c,83492791);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967296;};
 function screenPath(ctx,contours,project){
  ctx.beginPath();for(const loop of contours){loop.forEach(([u,v],i)=>{const p=project(u,v);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();}
 }
 function draw(ctx,pieces,project,zoom,{ghost=false}={}){
  const model=topology(pieces);if(!model.cells.length)return model;
  ctx.save();ctx.globalAlpha=ghost?.48:1;ctx.lineJoin='miter';ctx.miterLimit=3;
  // Les rives cachées par la surface ne sont pas dessinées. Les deux côtés
  // réellement tournés vers la caméra ont dx<0 dans le contour orienté.
  for(const loop of model.contours)for(let i=0;i<loop.length;i++){
   const a=project(...loop[i]),b=project(...loop[(i+1)%loop.length]);
   if(b.x>=a.x)continue;
   const depth=7*zoom;
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(b.x,b.y+depth);ctx.lineTo(a.x,a.y+depth);ctx.closePath();
   ctx.fillStyle=b.y>a.y?'#503728':'#634431';ctx.fill();
  }
  // Un seul tracé continu par chaîne de faces visibles, raccordé aux coins.
  ctx.beginPath();
  for(const loop of model.contours){
   const q=loop.map(p=>project(...p)),visible=q.map((a,i)=>q[(i+1)%q.length].x<a.x),depth=7*zoom;
   for(let i=0;i<q.length;i++){
    if(!visible[i]||visible[(i+q.length-1)%q.length])continue;
    let j=i;ctx.moveTo(q[j].x,q[j].y);ctx.lineTo(q[j].x,q[j].y+depth);
    do{j=(j+1)%q.length;ctx.lineTo(q[j].x,q[j].y+depth);}while(visible[j]&&j!==i);
    ctx.lineTo(q[j].x,q[j].y);
   }
  }
  ctx.lineWidth=1.4*zoom;ctx.strokeStyle='#211914';ctx.stroke();
  // Un seul masque de surface : aucun anticrénelage entre dalles voisines.
  screenPath(ctx,model.contours,project);ctx.save();ctx.clip('evenodd');
  const minU=Math.min(...model.cells.map(p=>p.u)),maxU=Math.max(...model.cells.map(p=>p.u))+1;
  const minV=Math.min(...model.cells.map(p=>p.v)),maxV=Math.max(...model.cells.map(p=>p.v))+1;
  const o=project(0,0),x=project(1,0),y=project(0,1);
  ctx.transform(x.x-o.x,x.y-o.y,y.x-o.x,y.y-o.y,o.x,o.y);
  ctx.fillStyle='#6b503a';ctx.fillRect(minU,minV,maxU-minU,maxV-minV);
  // Irrégularité réservée aux planches et au veinage, JAMAIS à la silhouette.
  const pitch=.43,length=2.4;
  const seam=(row,u)=>row*pitch+.045*Math.sin(row*2.17)+.012*Math.sin(u*4.1+row*3)+.007*Math.sin(u*11+row);
  const end=(row,col)=>col*length+random(row,0)*length+.34*Math.sin(col*4.7+row*2.1);
  // Conserver les aplats de bois jusqu'au bord ; retirer uniquement les traits
  // décoratifs d'une fine marge de finition, y compris autour des trous.
  for(let row=Math.floor(minV/pitch)-1;row<=Math.ceil(maxV/pitch);row++){
   for(let col=Math.floor(minU/length)-2;col<=Math.floor(maxU/length)+1;col++){
    const u=end(row,col),right=end(row,col+1),v=seam(row,u),bottom=seam(row+1,u),r=random(row,col);
    // Ignorer les planches entièrement hors du masque, avec une marge pour tous les traits.
    if(!model.cells.some(p=>Math.min(u,right)-1<p.u+1&&Math.max(u,right)+1>p.u&&row*pitch-1<p.v+1&&(row+1)*pitch+1>p.v))continue;
    ctx.beginPath();
    for(let i=0;i<=18;i++){const x=u+(right-u)*i/18;const y=seam(row,x);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
    for(let i=18;i>=0;i--){const x=u+(right-u)*i/18;ctx.lineTo(x,seam(row+1,x));}ctx.closePath();
    ctx.fillStyle=`hsl(${26+Math.round(r*6)} 24% ${31+Math.round(r*13)}%)`;ctx.fill();
    ctx.save();const margin=.045;
    for(const loop of model.contours)for(let i=0;i<loop.length;i++){
     const a=loop[i],b=loop[(i+1)%loop.length];ctx.beginPath();
     ctx.rect(minU-1,minV-1,maxU-minU+2,maxV-minV+2);
     ctx.rect(Math.min(a[0],b[0])-margin,Math.min(a[1],b[1])-margin,
      Math.abs(b[0]-a[0])+2*margin,Math.abs(b[1]-a[1])+2*margin);
     ctx.clip('evenodd');
    }
    ctx.strokeStyle='#241a13';ctx.lineWidth=.022;ctx.beginPath();
    for(let i=0;i<=18;i++){const x=u+(right-u)*i/18,y=seam(row,x);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();
    ctx.beginPath();ctx.moveTo(u,v);ctx.lineTo(u+.012,(v+bottom)/2);ctx.lineTo(u,bottom);ctx.stroke();
    // Longues veines brisées, fissures, petites entailles : dessin déterministe.
    for(let g=0;g<18;g++){
     const gu=u+.05+random(row,col,g+1)*(right-u-.35),gv=v+.04+random(col,row,g+31)*(bottom-v-.08);
     const extent=.12+random(row,g,col+17)*.85;
     ctx.lineWidth=g%4===0?.019:.008;ctx.strokeStyle=g%3===0?'#c09b6866':'#281d15a8';
     ctx.beginPath();ctx.moveTo(gu,gv);ctx.lineTo(gu+extent*.3,gv-.01);ctx.lineTo(gu+extent*.62,gv+.006);ctx.lineTo(Math.min(right-.02,gu+extent),gv-.009);ctx.stroke();
    }
    if(r>.25){const ku=u+(right-u)*(.24+r*.4),kv=(v+bottom)/2;
     for(let ring=0;ring<3;ring++){ctx.beginPath();for(let i=0;i<=24;i++){const t=i*Math.PI/12,x=ku+(.045+ring*.038)*Math.cos(t),y=kv+(.018+ring*.014)*Math.sin(t)+.005*Math.sin(t*3+row);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.strokeStyle='#271c14c9';ctx.lineWidth=ring===0?.018:.008;ctx.stroke();}
    }
    ctx.beginPath();ctx.moveTo(right-.26,bottom-.04);ctx.lineTo(right-.04,bottom-.025);ctx.lineTo(right-.13,bottom-.065);ctx.fillStyle='#302118aa';ctx.fill();
    ctx.restore();
   }
  }
  ctx.restore();
  screenPath(ctx,model.contours,project);ctx.lineJoin='miter';ctx.lineWidth=2*zoom;ctx.strokeStyle='#211914';ctx.stroke();
  ctx.restore();return model;
 }
 const api={topology,draw};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorProposal=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);

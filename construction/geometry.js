/* Géométrie du laboratoire : coordonnées CSS à l'écran, unités de grille au sol.
   Aucun accès au DOM, aux images ou aux sauvegardes. */
(function (root) {
  'use strict';
  const BX = Object.freeze({x:112, y:-36});
  const BY = Object.freeze({x:52, y:49});
  function project(u,v,c,z=0) {
    return {x:c.x+(u*BX.x+v*BY.x)*c.zoom,
      y:c.y+(u*BX.y+v*BY.y-z)*c.zoom};
  }
  function unproject(x,y,c) {
    const dx=(x-c.x)/c.zoom,dy=(y-c.y)/c.zoom,det=BX.x*BY.y-BX.y*BY.x;
    return {u:(dx*BY.y-dy*BY.x)/det,v:(dy*BX.x-dx*BX.y)/det};
  }
  // Corriger uniquement l'erreur flottante des points exactement sur la grille.
  const stableFloor=n=>Math.floor(Math.abs(n-Math.round(n))<1e-10?Math.round(n):n);
  function cellAt(x,y,c) {const p=unproject(x,y,c);return {u:stableFloor(p.u),v:stableFloor(p.v)};}
  function dimensions(size,rot) {return rot%2?[size[1],size[0]]:[...size];}
  function corners(p,size) {
    const [w,h]=dimensions(size,p.rot);
    return [[p.u,p.v],[p.u+w,p.v],[p.u+w,p.v+h],[p.u,p.v+h]];
  }
  function cells(p,size) {
    const [w,h]=dimensions(size,p.rot),out=[];
    for(let x=0;x<w;x++)for(let y=0;y<h;y++)out.push(`${p.u+x},${p.v+y}`);
    return out;
  }
  function ends(p) {
    const {u,v}=p;
    return [[[u,v],[u+1,v]],[[u+1,v],[u+1,v+1]],
      [[u,v+1],[u+1,v+1]],[[u,v],[u,v+1]]][p.rot];
  }
  const edgeId=p=>ends(p).map(q=>q.join(':')).sort().join('|');
  function segmentDistance(p,a,b) {
    const dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  }
  // Arêtes canoniques : u pour l'axe BX, v pour l'axe BY.
  // Départage déterministe aux sommets ; même arête depuis ses deux côtés.
  function nearestEdge(x,y,c) {
    const cell=cellAt(x,y,c);
    const candidates=[{u:cell.u,v:cell.v,rot:0},{u:cell.u,v:cell.v+1,rot:0},
      {u:cell.u,v:cell.v,rot:3},{u:cell.u+1,v:cell.v,rot:3}];
    return candidates.map(p=>({p,id:edgeId(p),distance:segmentDistance({x,y},...ends(p).map(q=>project(...q,c)))}))
      .sort((a,b)=>Math.abs(a.distance-b.distance)<1e-8?a.id.localeCompare(b.id):a.distance-b.distance)[0].p;
  }
  // Point technique sur le bord avant de l'emprise, déclaré dans le monde.
  // Les tailles et la correspondance de TOUS les pieds restent à calibrer au jalon 5.
  function groundAnchor(p,size,local={u:.5,v:1}) {
    const [w,h]=dimensions(size,p.rot);
    return {u:p.u+w*local.u,v:p.v+h*local.v};
  }
  function spriteRect(anchor,image,size,zoom,foot) {
    const scale=size*zoom/image.height;
    return {x:anchor.x-foot.x*scale,y:anchor.y-foot.y*scale,
      w:image.width*scale,h:image.height*scale};
  }
  const api={BX,BY,project,unproject,cellAt,dimensions,corners,cells,ends,edgeId,
    nearestEdge,segmentDistance,groundAnchor,spriteRect};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LabGeometry=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);

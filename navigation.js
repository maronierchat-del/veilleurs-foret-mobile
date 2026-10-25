/* Recherche de chemin locale : mêmes collisions que la marche, aucune téléportation. */
(function(root){'use strict';
 function create(canWalk,{width,height},step=14){
  function clear(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));for(let i=1;i<=n;i++)if(!canWalk(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true;}
  function plan(from,to,radius=0){
   if(!radius&&!canWalk(to.x,to.y))return null;
   const distance=p=>Math.hypot(to.x-p.x,to.y-p.y);
   if(distance(from)<=radius)return [];
   const direct=radius?{x:to.x+(from.x-to.x)/distance(from)*(radius-2),y:to.y+(from.y-to.y)/distance(from)*(radius-2)}:to;
   if(clear(from,direct))return [direct];
   const heap=[],nodes=new Map(),occupied=new Map();
   const id=(x,y)=>x+','+y,point=(x,y)=>({x:from.x+x*step,y:from.y+y*step});
   function push(n){heap.push(n);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=n.f)break;heap[i]=heap[p];i=p;}heap[i]=n;}
   function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;}
   const heuristic=p=>Math.max(0,distance(p)-radius),start={x:0,y:0,g:0,f:heuristic(from),parent:null};nodes.set(id(0,0),start);push(start);
   let visited=0;
   while(heap.length&&visited++<26000){const n=pop();if(n.closed)continue;n.closed=true;const p=point(n.x,n.y),d=distance(p);
    if((radius&&d<=radius)||(!radius&&d<=step*1.5&&clear(p,to))){
     const path=[];for(let a=n;a.parent;a=a.parent)path.push(point(a.x,a.y));path.reverse();if(!radius)path.push({...to});
     // Raccourcir uniquement les segments entièrement libres, sans couper les angles.
     const smooth=[];let anchor=from,i=0;while(i<path.length){let j=i;while(j+1<path.length&&clear(anchor,path[j+1]))j++;smooth.push(path[j]);anchor=path[j];i=j+1;}return smooth;
    }
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
     const x=n.x+dx,y=n.y+dy,k=id(x,y),q=point(x,y);if(q.x<55||q.y<55||q.x>width-55||q.y>height-55)continue;
     if(!occupied.has(k))occupied.set(k,canWalk(q.x,q.y));if(!occupied.get(k)||!clear(p,q))continue;
     const old=nodes.get(k),g=n.g+step*Math.hypot(dx,dy);if(old&&(old.closed||old.g<=g))continue;
     const next={x,y,g,f:g+heuristic(q),parent:n};nodes.set(k,next);push(next);
    }
   }
   return null;
  }
  return {plan,clear};
 }
 root.ObstacleNavigation={create};
})(globalThis);

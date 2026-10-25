(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HouseDoor=api;})(globalThis,function(){
 function geometry(p,G,fraction=1){const [a,b]=G.ends(p),dx=b[0]-a[0],dy=b[1]-a[1],right=p.hinge==='right',du=right?-dx:dx,dv=right?-dy:dy,out=p.outward||[-dy,dx],sign=(-dv*out[0]+du*out[1])>=0?1:-1,angle=p.open?sign*90*Math.PI/180*fraction:0,c=Math.cos(angle),s=Math.sin(angle),offset=right?.845:.155,hinge=[a[0]+dx*offset,a[1]+dy*offset],direction=[c*du-s*dv,s*du+c*dv],width=.69;
  const transform=(u,v,z)=>({u:hinge[0]+c*(u-hinge[0])-s*(v-hinge[1]),v:hinge[1]+s*(u-hinge[0])+c*(v-hinge[1]),z});
  const point=(t,z)=>({u:hinge[0]+direction[0]*t*width,v:hinge[1]+direction[1]*t*width,z});
  const corners=[point(0,2),point(1,2),point(1,99),point(0,99)],normal=[-direction[1]*.025,direction[0]*.025],end=point(1,0),polygon=[[hinge[0]+normal[0],hinge[1]+normal[1]],[end.u+normal[0],end.v+normal[1]],[end.u-normal[0],end.v-normal[1]],[hinge[0]-normal[0],hinge[1]-normal[1]]];
  return {hinge,direction,corners,polygon,transform};
 }
 function awayFrom(p,point,G){const [a,b]=G.ends(p),du=b[0]-a[0],dv=b[1]-a[1],side=du*(point.v-a[1])-dv*(point.u-a[0]),sign=side>=0?-1:1;return [-dv*sign,du*sign];}
 return {geometry,awayFrom};
});

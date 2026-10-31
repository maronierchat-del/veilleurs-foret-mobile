/* Brume fixe dans le monde : aucune donnée de partie ni ressource modifiée. */
'use strict';
const BoundaryMist=(()=>{
 const edge=55,padding=48,scale=2,layer=document.createElement('canvas');
 let key='',origin=null,lastBuildMs=0,builds=0;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function hash(x,y){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^261026;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),a=smooth(x-ix),b=smooth(y-iy),n=hash(ix,iy),m=hash(ix+1,iy),p=hash(ix,iy+1),q=hash(ix+1,iy+1);return n+(m-n)*a+(p-n)*b+(n-m-p+q)*a*b;}
 function contains(x,y){return BuildingArea.tools||x>=edge&&y>=edge&&x<=WORLD.width-edge&&y<=WORLD.height-edge;}
 function interact(x,y){
  if(BuildingArea.tools||opacity(x,y)<.25)return false;
  const hasTrunk=state.objects.some(o=>MalleTrial.isFixture(o));
  ui.auto=null;dismissObjectMenu();
  toast(hasTrunk?'Préparez une expédition dans votre malle pour découvrir ce qui se cache au-delà de la brume.':'Construisez une malle d’expédition pour découvrir ce qui se cache au-delà de la brume.');
  return true;
 }
 function bounds(){
  const c=ui.camera,z=c.zoom,k=c.squash;
  const header=$('resourceStrip')?.getBoundingClientRect().bottom||110;
  const outsideX=Math.min(180,Math.max(100,W*.24)),outsideY=Math.min(H*.49,Math.max(165,header+110*z+20));
  return {minX:Math.min(WORLD.width/2,(W/2-outsideX)/z),maxX:Math.max(WORLD.width/2,WORLD.width-(W/2-outsideX)/z),minY:Math.min(WORLD.height/2,(H/2-outsideY)/(z*k)),maxY:Math.max(WORLD.height/2,WORLD.height-(H/2-outsideY)/(z*k))};
 }
 function clampCamera(){if(BuildingArea.tools||!W||!H)return;const b=bounds(),c=ui.camera;c.x=Math.max(b.minX,Math.min(b.maxX,c.x));c.y=Math.max(b.minY,Math.min(b.maxY,c.y));}
 function opacity(x,y){
  const distance=Math.min(x-edge,y-edge,WORLD.width-edge-x,WORLD.height-edge-y);
  if(distance>155)return 0;if(distance<-65)return 1;
  const bend=(noise(x/143,y/167)-.5)*60+(noise(x/39+14,y/47-9)-.5)*20;
  return 1-smooth((distance+bend+20)/120);
 }
 function draw(target=ctx,view=null){
  const width=view?.width??W,height=view?.height??H,density=view?.density??dpr;
  if(BuildingArea.tools||!width||!height)return;
  const c=view?.camera||ui.camera,z=c.zoom,k=c.squash,halfX=width/(2*z),halfY=height/(2*z*k);
  if(c.x-halfX>210&&c.y-halfY>210&&c.x+halfX<WORLD.width-210&&c.y+halfY<WORLD.height-210)return;
  const stepX=32/z,stepY=32/(z*k),ax=Math.floor(c.x/stepX)*stepX,ay=Math.floor(c.y/stepY)*stepY;
  const next=[width,height,z,k,ax,ay].join(':');
  if(next!==key){
   const start=performance.now();key=next;origin={x:ax-(width/2+padding)/z,y:ay-(height/2+padding)/(z*k)};
   layer.width=Math.ceil((width+padding*2)/scale);layer.height=Math.ceil((height+padding*2)/scale);
   const paint=layer.getContext('2d'),data=paint.createImageData(layer.width,layer.height),pixels=data.data;
   for(let y=0;y<layer.height;y++)for(let x=0;x<layer.width;x++){
    const wx=origin.x+(x+.5)*scale/z,wy=origin.y+(y+.5)*scale/(z*k),alpha=opacity(wx,wy);if(!alpha)continue;
    const cloud=noise(wx/185+31,wy/210-17)*.65+noise(wx/53-8,wy/64+23)*.25+noise(wx/17,wy/19)*.1;
    const i=(y*layer.width+x)*4;pixels[i]=118+cloud*47;pixels[i+1]=128+cloud*44;pixels[i+2]=113+cloud*42;pixels[i+3]=Math.round(alpha*255);
   }
   paint.putImageData(data,0,0);lastBuildMs=performance.now()-start;builds++;
  }
  target.save();target.setTransform(density,0,0,density,0,0);target.imageSmoothingEnabled=true;target.drawImage(layer,width/2+(origin.x-c.x)*z,height/2+(origin.y-c.y)*z*k,layer.width*scale,layer.height*scale);target.restore();
 }
 return {draw,clampCamera,bounds,contains,opacity,interact,get metrics(){return {lastBuildMs,builds};}};
})();

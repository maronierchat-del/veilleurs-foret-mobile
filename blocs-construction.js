/* Blocs alpha 3 : coûts validés le 3 novembre, conversion unique et sans perte. */
'use strict';
const ConstructionBlocks=(()=>{
 const costs={sol:1,mur:2,fenetre:1,porte:2,cloture:1,portillon:2},legacy=['sol','mur','fenetre','porte','toit'];
 Object.assign(CRAFT,{
  bloc_bois:{name:'Blocs de bois',kind:'construction',materials:{bois:8},qty:8,bench:true,spr:'bloc_bois',stock:true},
  bloc_toit:{name:'Blocs de toit',kind:'construction',materials:{bois:4,fibres:8},qty:8,bench:true,spr:'bloc_toit',stock:true}
 });
 LABEL.bloc_bois='Blocs de bois';LABEL.bloc_toit='Blocs de toit';
 const cost=key=>costs[key]??2;
 const stock=key=>Object.hasOwn(costs,key)?'bloc_bois':'bloc_toit';
 const available=key=>amount(stock(key))>=cost(key);
 const change=(key,direction)=>give(stock(key),cost(key)*direction);
 function validate(s){
  if(Object.hasOwn(s,'constructionBlocksVersion')&&s.constructionBlocksVersion!==1)throw Error('Version des blocs de construction incompatible.');
  if(s.constructionBlocksVersion===1)for(const items of [s.items,...s.objects.filter(o=>o.contents).map(o=>o.contents)])
   if(legacy.some(key=>(items[key]||0)>0))throw Error('Ancien stock de construction non converti.');
 }
 function migrate(s){
  validate(s);if(s.constructionBlocksVersion===1)return false;
  function add(items,key,n){const value=(items[key]||0)+n;if(!Number.isSafeInteger(value)||value<0)throw Error('Quantité de blocs trop élevée.');items[key]=value;}
  for(const items of [s.items,...s.objects.filter(o=>o.contents).map(o=>o.contents)]){
   for(const key of legacy){
    const n=items[key]||0;if(n){add(items,stock(key),n*cost(key));
     if(key==='fenetre'||key==='porte')add(items,'bois',n);
     if(key==='porte')add(items,'fibres',n);
    }
    delete items[key];
   }
  }
  s.constructionBlocksVersion=1;validate(s);return true;
 }
 return {cost,stock,available,change,legacy:[...legacy,'cloture','portillon'],validate,migrate};
})();

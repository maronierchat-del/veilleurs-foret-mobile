/* Coûts validés le 5 novembre : clôture 1 bloc de bois, portillon 2. */
'use strict';
const FenceData=(()=>{
 const keys=['cloture','portillon'];
 CRAFT.cloture.bench=CRAFT.portillon.bench=true;
 function validate(s){
  if(Object.hasOwn(s,'fenceBlocksVersion')&&s.fenceBlocksVersion!==1)throw Error('Version des clôtures incompatible.');
  if(s.fenceBlocksVersion===1)for(const items of [s.items,...s.objects.filter(o=>o.contents).map(o=>o.contents)])if(keys.some(k=>(items[k]||0)>0))throw Error('Ancien stock de clôtures non converti.');
 }
 function migrate(s){
  validate(s);if(s.fenceBlocksVersion===1)return false;
  for(const items of [s.items,...s.objects.filter(o=>o.contents).map(o=>o.contents)]){
   const extra=(items.cloture||0)+2*(items.portillon||0);
   if(extra){const n=(items.bloc_bois||0)+extra;if(!Number.isSafeInteger(n))throw Error('Stock de blocs trop élevé.');items.bloc_bois=n;}
   delete items.cloture;delete items.portillon;
  }
  // Les anciens objets posés restent à leur position et récupérables en blocs.
  s.fenceBlocksVersion=1;validate(s);return true;
 }
 return {validate,migrate};
})();

/* Installation sur l'écran d'accueil et paquet hors ligne, hors sauvegardes. */
'use strict';
const GameInstall=(()=>{
 let deferred=null,registration=null,ready=false,failed=false,progress=0,total=0,instructions=false,prompting=false,installedEvent=false;
 const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const installed=()=>installedEvent||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function status(){if(failed)return 'Téléchargement interrompu. Rétablis Internet, puis réessaie.';if(registration?.waiting)return 'Une mise à jour est prête. Ferme le jeu et ses autres onglets, puis rouvre-le pour l’appliquer.';if(ready)return 'Jeu prêt hors connexion sur ce navigateur.';return progress?'Téléchargement du jeu : '+Math.round(progress/total*100)+' %':'Préparation du jeu pour jouer hors connexion…';}
 function help(){return isIOS()?'<p>Pour retrouver ta partie sur iPhone ou iPad, exporte-la avant l’installation, puis importe le fichier dans l’application.</p><ol><li>Ouvre ce jeu dans Safari.</li><li>Choisis Partager, puis <b>Sur l’écran d’accueil</b>.</li><li>Active <b>Ouvrir comme app</b> si proposé, puis touche Ajouter.</li><li>Ouvre l’application une première fois avec Internet. Dans Paramètres, importe ta sauvegarde et attends que le jeu soit prêt hors connexion.</li></ol>':'<p>Si aucune confirmation ne s’ouvre, utilise le menu de ton navigateur : <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>. Sur téléphone Android, ouvre de préférence le lien dans Chrome.</p><p>Attends « Jeu prêt hors connexion » avant de couper Internet.</p>';}
 function markup(){return '<section id="gameInstallSection"><h3>Installer le jeu</h3><p>Ajoute le jeu à ton écran d’accueil et retrouve-le comme une application.</p>'+(installed()?'<p>Le jeu est installé sur cet appareil.</p>':'<button type="button" class="btn full" data-install-action="install">Installer le jeu</button>')+'<p role="status" data-install-status>'+status()+'</p><button type="button" class="btn full secondary" data-install-action="retry" '+(failed?'':'hidden')+'>Réessayer le téléchargement</button><button type="button" class="btn full secondary" data-install-action="export">'+(installed()?'Exporter ma partie':'Exporter ma partie avant l’installation')+'</button>'+(isIOS()?'<p>Sur iPhone/iPad, conserve ce fichier pour retrouver ta partie dans l’application.</p>':'<p>Ta partie reste enregistrée sur cet appareil. Garde aussi un fichier de secours.</p>')+'<div data-install-help '+(instructions?'':'hidden')+'>'+help()+'</div></section>';}
 function refresh(){const host=document.querySelector('#gameInstallSection');if(!host)return;const text=host.querySelector('[data-install-status]');text.textContent=status();let retry=host.querySelector('[data-install-action=retry]');if(!retry){retry=document.createElement('button');retry.type='button';retry.className='btn full secondary';retry.dataset.installAction='retry';retry.textContent='Réessayer le téléchargement';text.after(retry);}retry.hidden=!failed;const button=host.querySelector('[data-install-action=install]');if(button)button.hidden=installed();const helpBox=host.querySelector('[data-install-help]');helpBox.hidden=!instructions;}
 function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'){if(registration?.waiting)refresh();else worker.postMessage({type:'VEILLEURS_STATUS'});}if(worker.state==='redundant'&&!ready){failed=true;refresh();}});}
 async function register(){
  if(!('serviceWorker'in navigator)||!isSecureContext){failed=true;refresh();return;}
  try{failed=false;registration=await navigator.serviceWorker.register('service-worker.js',{scope:'./',updateViaCache:'none'});watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));(registration.active||registration.waiting)?.postMessage({type:'VEILLEURS_STATUS'});refresh();}
  catch{registration=await navigator.serviceWorker.getRegistration().catch(()=>null);if(registration?.active)registration.active.postMessage({type:'VEILLEURS_STATUS'});else failed=true;refresh();}
 }
 async function install(){
  if(prompting||installed())return;
  if(typeof saveNow==='function'&&!saveNow()){instructions=true;refresh();return;}
  if(failed||!registration)register();
  if(!deferred){instructions=true;refresh();return;}
  const request=deferred;deferred=null;prompting=true;
  try{await request.prompt();const result=await request.userChoice;if(result?.outcome==='accepted')installedEvent=true;else instructions=true;}
  catch{instructions=true;}
  finally{prompting=false;refresh();}
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;refresh();});
 window.addEventListener('appinstalled',()=>{installedEvent=true;deferred=null;refresh();});
 navigator.serviceWorker?.addEventListener('message',event=>{const d=event.data;if(d?.app!=='veilleurs-installation')return;if(d.type==='ready'){ready=true;failed=false;}else if(d.type==='progress'){progress=d.done||progress;total=d.total||total;}else if(d.type==='error')failed=true;refresh();});
 document.addEventListener('click',event=>{const button=event.target.closest('[data-install-action]');if(!button)return;if(button.dataset.installAction==='install')install();else if(button.dataset.installAction==='retry')register();else if(button.dataset.installAction==='export'&&typeof exportSave==='function')exportSave();});
 if(!new URLSearchParams(location.search).has('outils')){if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});}
 return {markup,register,get ready(){return ready;},get registration(){return registration;}};
})();

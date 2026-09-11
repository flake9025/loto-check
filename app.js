const state={main:new Set(),chance:null,draws:[],byMain:new Map(),byFull:new Map(),mainFrequency:Array(50).fill(0),chanceFrequency:Array(11).fill(0),mainDelay:Array(50).fill(0),chanceDelay:Array(11).fill(0),lastDateMain:Array(50).fill('—'),lastDateChance:Array(11).fill('—'),flashPos:0,flashCount:0,deferredPrompt:null,dataReady:false};
const $=id=>document.getElementById(id);
function key(nums){return [...nums].sort((a,b)=>a-b).join('-')}
function renderBalls(){
  const main=$('mainBalls'); main.innerHTML='';
  for(let n=1;n<=49;n++){const b=document.createElement('button');b.className='ball'+(state.main.has(n)?' selected':'');b.textContent=n;b.setAttribute('aria-pressed',state.main.has(n));b.onclick=()=>toggleMain(n);main.appendChild(b)}
  const cb=$('chanceBalls'); cb.innerHTML='';
  for(let n=1;n<=10;n++){const b=document.createElement('button');b.className='ball'+(state.chance===n?' selected':'');b.textContent=n;b.setAttribute('aria-pressed',state.chance===n);b.onclick=()=>{state.chance=n;renderBalls()};cb.appendChild(b)}
  update();
}
function toggleMain(n){if(state.main.has(n))state.main.delete(n);else if(state.main.size<5)state.main.add(n);renderBalls()}
function update(){
  $('mainCount').textContent=`${state.main.size} / 5`;
  $('chosenMain').textContent=state.main.size?[...state.main].sort((a,b)=>a-b).map(n=>String(n).padStart(2,'0')).join(' · '):'—';
  $('chanceValue').textContent=state.chance??'—';
  const ready=state.main.size===5&&state.chance!==null&&state.dataReady;
  $('checkBtn').disabled=!ready;$('uniqueBtn').disabled=!ready;
}
function mainRank(){const nums=[];for(let n=1;n<=49;n++)nums.push(n);nums.sort((a,b)=>(state.mainDelay[b]-state.mainDelay[a])||(state.mainFrequency[a]-state.mainFrequency[b])||(a-b));return nums}
function chanceRank(){const nums=[];for(let n=1;n<=10;n++)nums.push(n);nums.sort((a,b)=>(state.chanceDelay[b]-state.chanceDelay[a])||(state.chanceFrequency[a]-state.chanceFrequency[b])||(a-b));return nums}
function flash(){
  if(!state.dataReady){showError('Historique indisponible','Le Flash ne peut pas garantir une grille inédite tant que l’historique complet n’est pas chargé.');return}
  const mr=mainRank(), cr=chanceRank();
  let picked=null,pickedChance=null,usedOffset=0;
  for(let a=0;a<49;a++){
    const start=(state.flashPos+a)%49;
    const window=[];for(let k=0;k<5;k++)window.push(mr[(start+k)%49]);
    const candidate=[...window].sort((x,y)=>x-y);
    if(!isMainSeen(candidate)){picked=candidate;pickedChance=cr[(state.flashPos+a)%10];usedOffset=a;break}
  }
  if(!picked){showError('Impossible de générer une grille','Toutes les fenêtres de numéros en retard correspondent à des combinaisons déjà vues.');return}
  state.main=new Set(picked);
  state.chance=pickedChance;
  state.flashCount++;
  const flashNum=state.flashCount;
  state.flashPos=(state.flashPos+usedOffset+5)%49;
  renderBalls();check(false);
  explainFlash(picked,pickedChance,flashNum);
}
function explainFlash(picked,chance,flashNum){
  const box=$('result');if(!box||box.hidden)return;
  const details=picked.map(n=>`${String(n).padStart(2,'0')} (il y a ${state.mainDelay[n]} tirage${state.mainDelay[n]>1?'s':''} · ${state.lastDateMain[n]})`).join(' · ');
  const info=document.createElement('div');
  info.className='result-box flash-info';
  info.innerHTML=`<h3>⚡ Flash n°${flashNum} : les numéros les plus attendus</h3><p>${flashNum===1?'1<sup>er</sup> clic : les 5 numéros les plus en retard + le Numéro Chance le plus en retard.':'Clic suivant : les 5 suivants dans le classement des retards.'} Combinaison vérifiée <strong>inédite</strong> dans l’historique.</p><p class="muted">Retards : ${details} — Chance ${chance} (il y a ${state.chanceDelay[chance]} tirages · ${state.lastDateChance[chance]}). Cela ne rend pas ces numéros plus probables au prochain tirage.</p>`;
  box.prepend(info);
  const hint=$('flashHint');
  if(hint)hint.textContent=`Dernier Flash n°${flashNum} : ${picked.map(n=>String(n).padStart(2,'0')).join(' · ')} + Chance ${chance}. Prochain clic = les 5 suivants dans le classement des retards.`;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function isMainSeen(nums){return state.byMain.has(key(nums))}
function isFullSeen(nums,chance){return state.byFull.has(`${key(nums)}|${chance}`)}
function showError(title,text){const box=$('result');box.hidden=false;box.innerHTML=`<div class="result-box error"><h3>⚠️ ${title}</h3><p>${text}</p></div>`;box.scrollIntoView({behavior:'smooth',block:'nearest'})}
function check(show=true){
  if(state.main.size!==5||state.chance===null)return;
  if(!state.dataReady){showError('Historique indisponible','Impossible d’affirmer qu’une grille est unique avec un historique incomplet.');return}
  const mainSeen=isMainSeen(state.main), fullSeen=isFullSeen(state.main,state.chance);
  const dates=state.byMain.get(key(state.main))||[];
  const box=$('result'); box.hidden=false;
  box.innerHTML=`<div class="result-box ${mainSeen?'warn':'ok'}"><h3>${mainSeen?'⚠️ Cette combinaison est déjà sortie':'✓ Cette combinaison de 5 numéros est inédite'}</h3><p>${mainSeen?`Elle apparaît ${dates.length} fois dans l’historique. ${fullSeen?'Le Numéro Chance est également déjà associé à cette combinaison.':'Le Numéro Chance choisi est différent des occurrences historiques connues.'}`:'Aucun tirage de la période analysée ne contient exactement ces 5 numéros.'}</p>${mainSeen?`<ul class="history-list">${dates.slice(0,8).map(d=>`<li><span>${d.date}</span><span>Chance ${d.chance??'—'}</span></li>`).join('')}</ul>`:''}</div>`;
  if(show)box.scrollIntoView({behavior:'smooth',block:'start'});
}
function improve(){
  if(!state.dataReady){showError('Historique indisponible','Impossible de rendre une grille unique sans l’historique complet.');return}
  if(state.main.size!==5||state.chance===null)return;
  const original=[...state.main].sort((a,b)=>a-b);
  if(!isMainSeen(original)){check();return}
  for(let changes=1;changes<=5;changes++){
    for(const idxs of kCombinations([0,1,2,3,4],changes)){
      const base=original.filter((_,i)=>!idxs.includes(i));
      for(let n=1;n<=49;n++){
        if(base.includes(n))continue;
        const candidate=[...base,n].sort((a,b)=>a-b);
        if(!isMainSeen(candidate)){state.main=new Set(candidate);renderBalls();check();return}
      }
    }
  }
  showError('Impossible de modifier la grille','Aucune combinaison inédite n’a été trouvée.');
}
function kCombinations(arr,k){if(k===0)return[[]];if(arr.length<k)return[];const out=[];for(let i=0;i<=arr.length-k;i++)for(const tail of kCombinations(arr.slice(i+1),k-1))out.push([arr[i],...tail]);return out}
async function loadData(){
  try{
    const r=await fetch('data/history.json',{cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);const data=await r.json();
    state.draws=Array.isArray(data.draws)?data.draws:[];
    if(state.draws.length<1000)throw Error(`historique incomplet (${state.draws.length} tirages)`);
    for(const d of state.draws){
      const k=key(d.numbers);
      if(!state.byMain.has(k))state.byMain.set(k,[]);
      state.byMain.get(k).push(d);
      for(const n of d.numbers)if(n>=1&&n<=49)state.mainFrequency[n]++;
      if(d.chance!=null&&d.chance>=1&&d.chance<=10){state.chanceFrequency[d.chance]++;state.byFull.set(`${k}|${d.chance}`,d)}
    }
    const seenMain=new Set(),seenChance=new Set();
    state.mainDelay.fill(state.draws.length);state.chanceDelay.fill(state.draws.length);
    state.draws.forEach((d,i)=>{
      for(const n of d.numbers)if(n>=1&&n<=49&&!seenMain.has(n)){seenMain.add(n);state.mainDelay[n]=i;state.lastDateMain[n]=d.date}
      const c=d.chance;
      if(c>=1&&c<=10&&!seenChance.has(c)){seenChance.add(c);state.chanceDelay[c]=i;state.lastDateChance[c]=d.date}
    });
    state.dataReady=true;$('dataStatus').textContent=`${state.draws.length.toLocaleString('fr-FR')} tirages chargés · dernière mise à jour ${data.updatedAt||'—'}.`;
    $('dataStatus').classList.remove('error-status');
    state.flashPos=0;state.flashCount=0;
    const hint=$('flashHint');
    if(hint){const mr=mainRank(),cr=chanceRank();hint.textContent=`Flash = les 5 numéros les plus en retard (${mr.slice(0,5).map(n=>String(n).padStart(2,'0')).join(' · ')}) + Chance ${cr[0]}. Clics suivants = suite du classement.`}
    update();
  }catch(e){state.dataReady=false;$('dataStatus').textContent=`Historique incomplet ou indisponible (${e.message||'erreur inconnue'}). Lancez le workflow « Update Loto history » pour reconstruire les données depuis les archives officielles FDJ.`;
    $('dataStatus').classList.add('error-status');update()}
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredPrompt=e;$('installBtn').hidden=false});
$('installBtn').onclick=async()=>{if(state.deferredPrompt){state.deferredPrompt.prompt();await state.deferredPrompt.userChoice;state.deferredPrompt=null;$('installBtn').hidden=true}else alert('Sur iPhone/iPad : ouvrez le menu Partager de Safari puis « Sur l’écran d’accueil ».')};
$('flashBtn').onclick=flash;$('checkBtn').onclick=()=>check();$('uniqueBtn').onclick=improve;
$('infoBtn').onclick=()=>$('infoDialog').showModal();$('closeInfo').onclick=()=>$('infoDialog').close();$('closeInfoBottom').onclick=()=>$('infoDialog').close();
renderBalls();loadData();
if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.matchMedia('(display-mode: standalone)').matches){$('installBtn').hidden=false;$('installBtn').textContent='Installer'}
if('serviceWorker' in navigator){let swRefreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!swRefreshing){swRefreshing=true;window.location.reload()}});window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(reg=>{reg.update();if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});reg.onupdatefound=()=>{const nw=reg.installing;if(nw)nw.onstatechange=()=>{if(nw.state==='installed'&&navigator.serviceWorker.controller)window.location.reload()}}})})}

const VERSION='v3';
const CACHE='loto-unique-'+VERSION;
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
function isAppShell(url){return url.pathname.endsWith('/index.html')||url.pathname.endsWith('/app.js')||url.pathname.endsWith('/styles.css')||url.pathname.endsWith('/manifest.webmanifest')||url.pathname.endsWith('/')||url.pathname.endsWith('/loto-check/')||url.pathname.endsWith('/loto-check')}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(!url.protocol.startsWith('http'))return;
  // Navigations et app shell : network-first pour forcer la nouvelle version, fallback cache hors-ligne.
  if(e.request.mode==='navigate'||isAppShell(url)){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));return r}
      return caches.match(e.request).then(c=>c||r);
    }).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html'))));
    return;
  }
  // Le reste (icônes, historique géré à part) : cache-first classique.
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));return r}).catch(()=>c)));
});

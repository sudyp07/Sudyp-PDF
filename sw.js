/* SUDYP PDF offline worker. Caches only static app assets and processing engines;
   uploaded document contents never pass through this worker or any request. */
importScripts('./sw-assets.js');
const CACHE='sudyp-shell-v9';const RUNTIME='sudyp-engine-v9';
const origin=self.location.origin;
const ROOT=new URL('./',self.location.href);
const core=(self.SUDYP_ASSETS||[]).map(p=>new URL(p,ROOT).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);const essentials=['./index.html','./tools.html','./student-tools.html','./css/next.css','./js/app.js','./js/hero.js'];
 await Promise.all(essentials.map(async p=>{try{await cache.add(new URL(p,ROOT).href)}catch{}}));
 const rest=core.filter(u=>!essentials.some(e=>u===new URL(e,ROOT).href));
 // Installing should not fail when optional OCR assets haven't been downloaded yet.
 for(let i=0;i<rest.length;i+=12)await Promise.all(rest.slice(i,i+12).map(async url=>{try{await cache.add(url)}catch{}}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('sudyp-')&&![CACHE,RUNTIME].includes(n)).map(n=>caches.delete(n)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET')return;
 if(url.origin===origin){
  if(req.mode==='navigate'){
   event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(req);if(response.ok)cache.put(req,response.clone());return response}catch{return await cache.match(req)||await cache.match(new URL('./index.html',ROOT).href)||new Response('Offline: please open the homepage first.',{status:503,headers:{'Content-Type':'text/plain'}})}})());return;
  }
  event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;try{const response=await fetch(req);if(response.ok&&(url.pathname.includes('/vendor/')||url.pathname.includes('/assets/')||url.pathname.includes('/js/')||url.pathname.includes('/css/'))){const copy=response.clone();caches.open(RUNTIME).then(c=>c.put(req,copy)).catch(()=>{})}return response}catch{return new Response('Asset unavailable offline',{status:503})}})());return;
 }
 const allowed=['cdn.jsdelivr.net','cdnjs.cloudflare.com','unpkg.com','tessdata.projectnaptha.com'];
 if(allowed.includes(url.hostname)&&/\.(?:js|mjs|wasm|gz)(?:$|\?)/i.test(url.pathname)){
  event.respondWith((async()=>{const cache=await caches.open(RUNTIME);const hit=await cache.match(req);if(hit)return hit;const response=await fetch(req);if(response.ok||response.type==='opaque')cache.put(req,response.clone()).catch(()=>{});return response})());
 }
});

const CACHE = "mariyam-shebaloy-v6-4";
const SHELL = ["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return; const u=new URL(e.request.url); if(u.pathname.endsWith("/index.html")||u.pathname.endsWith("/")){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match("./index.html")));}else{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));}});

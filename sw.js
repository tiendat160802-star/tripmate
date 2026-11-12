/* TripMate v4.2: GitHub Pages, offline app shell and network-first updates. */
const CACHE = 'tripmate-v42-vapid-ready-02';
const SHELL = ['./index.html','./styles.css','./install-gate.js','./app.js','./firebase-config.js','./firebase-sync.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('tripmate-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});

// Push receiver for Firebase Cloud Messaging. Data-only payload prevents duplicate banners.
self.addEventListener('notificationclick', event=>{
  event.notification.close();
  const url=new URL('./',self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
    const candidate=clients.find(c=>c.url.startsWith(url));
    if(candidate){await candidate.focus();return}
    return self.clients.openWindow(url);
  }));
});
try{
  importScripts('https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js');
  firebase.initializeApp({apiKey:'AIzaSyBO_YSa9ggOrngs66aAvVexNQIzkTQXfKk',authDomain:'tripmate-93041.firebaseapp.com',
    projectId:'tripmate-93041',messagingSenderId:'159200616719',appId:'1:159200616719:web:8a8cbf730d589b22b11e7a'});
  const messaging=firebase.messaging();
  messaging.onBackgroundMessage(payload=>{
    const data=payload.data||{};
    const title=(data.title||'TripMate').slice(0,90),body=(data.body||'Bạn có thông báo mới').slice(0,240);
    self.registration.showNotification(title,{body,icon:'./icon-192.png',badge:'./icon-192.png',
      tag:data.notificationId?'tripmate-'+data.notificationId:undefined,data:{url:'./'},renotify:false});
  });
}catch(error){console.warn('Firebase Messaging SW chưa khởi tạo:',error)}

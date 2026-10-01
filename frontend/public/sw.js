// Service Worker — LJV Construção
const CACHE = 'ljv-v2'
const STATIC = ['/','index.html']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) return

  const networkFirst = e.request.mode === 'navigate'

  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()))
      }
      return res
    }).catch(() => caches.match(e.request).then(cached => {
      if (cached) return cached
      if (networkFirst) return caches.match('/')
      return new Response('Offline', { status: 503 })
    }))
  )
})

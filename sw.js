// ============================================================
// SERVICE WORKER — BEN-COUTURE PWA
// Version du cache : mettre à jour à chaque déploiement
// ============================================================

const CACHE_NAME = 'ben-couture-v1';
const CACHE_STATIC_NAME = 'ben-couture-static-v1';

// Ressources à mettre en cache immédiatement à l'installation
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Ressources CDN à mettre en cache à la première utilisation
const CDN_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'www.gstatic.com/firebasejs'
];

// ────────────────────────────────────────────────────────────
// INSTALL — mise en cache des ressources statiques
// ────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installation Ben-Couture v1');
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des assets statiques');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activer immédiatement sans attendre
  );
});

// ────────────────────────────────────────────────────────────
// ACTIVATE — nettoyage des anciens caches
// ────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activation — nettoyage anciens caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== CACHE_STATIC_NAME)
          .map(name => {
            console.log('[SW] Suppression cache obsolète:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim()) // Prendre le contrôle immédiatement
  );
});

// ────────────────────────────────────────────────────────────
// FETCH — stratégie de cache adaptée au type de ressource
// ────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et Firebase API
  if (request.method !== 'GET') return;
  if (url.hostname.includes('firestore.googleapis.com')) return;
  if (url.hostname.includes('firebase.googleapis.com')) return;
  if (url.protocol === 'chrome-extension:') return;

  // Stratégie pour les ressources CDN → Cache First
  const isCDN = CDN_PATTERNS.some(pattern => url.href.includes(pattern));
  if (isCDN) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Stratégie pour les pages HTML → Network First (toujours fraîche)
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE_STATIC_NAME));
    return;
  }

  // Stratégie pour les assets locaux (images, scripts, styles) → Cache First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_STATIC_NAME));
    return;
  }

  // Tout le reste → Network avec fallback cache
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// ────────────────────────────────────────────────────────────
// HELPERS — stratégies de cache
// ────────────────────────────────────────────────────────────

/**
 * Cache First : retourne le cache si dispo, sinon fetch et met en cache
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque-redirect') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Cache First — réseau indisponible:', request.url);
    return new Response('Ressource non disponible hors connexion', { status: 503 });
  }
}

/**
 * Network First : essaie le réseau, fallback sur le cache si offline
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Network First — fallback cache:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback page offline pour les navigations HTML
    if (request.destination === 'document') {
      return caches.match('./index.html');
    }
    return new Response('Hors ligne — ressource non disponible', { status: 503 });
  }
}

// ────────────────────────────────────────────────────────────
// SYNC en arrière-plan (optionnel, pour future extension)
// ────────────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-commandes') {
    console.log('[SW] Sync en arrière-plan — commandes');
    // Firebase gère déjà la persistence offline, pas besoin d'action
  }
});

// ────────────────────────────────────────────────────────────
// MESSAGE — communication avec l'app principale
// ────────────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

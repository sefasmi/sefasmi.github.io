// DoctorGo Service Worker
const CACHE_NAME = 'doctorgo-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/js/app.js',
  '/assets/js/auth.js',
  '/assets/js/patient.js',
  '/assets/js/doctor.js',
  '/assets/js/geolocation.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return offline page if available
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-consultations') {
    event.waitUntil(syncConsultations());
  } else if (event.tag === 'background-sync-location') {
    event.waitUntil(syncLocation());
  }
});

// Push notification handling
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'You have a new consultation request',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'accept',
        title: 'Accept',
        icon: '/assets/icons/accept.png'
      },
      {
        action: 'reject',
        title: 'Reject',
        icon: '/assets/icons/reject.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DoctorGo', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'accept') {
    // Handle accept action
    event.waitUntil(
      clients.openWindow('/doctor-dashboard?action=accept&id=' + event.notification.data.primaryKey)
    );
  } else if (event.action === 'reject') {
    // Handle reject action
    event.waitUntil(
      clients.openWindow('/doctor-dashboard?action=reject&id=' + event.notification.data.primaryKey)
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sync consultations when back online
async function syncConsultations() {
  try {
    const consultations = await getStoredConsultations();
    
    for (const consultation of consultations) {
      try {
        await fetch('/api/consultations/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(consultation)
        });
        
        // Remove from local storage after successful sync
        await removeStoredConsultation(consultation.id);
      } catch (error) {
        console.error('Failed to sync consultation:', consultation.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync location when back online
async function syncLocation() {
  try {
    const locationData = await getStoredLocationData();
    
    if (locationData) {
      await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });
      
      await clearStoredLocationData();
    }
  } catch (error) {
    console.error('Location sync failed:', error);
  }
}

// IndexedDB operations for offline storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DoctorGoDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('consultations')) {
        const consultationStore = db.createObjectStore('consultations', { keyPath: 'id' });
        consultationStore.createIndex('status', 'status', { unique: false });
        consultationStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('location')) {
        db.createObjectStore('location', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('requests')) {
        const requestStore = db.createObjectStore('requests', { keyPath: 'id' });
        requestStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

async function getStoredConsultations() {
  const db = await openDB();
  const transaction = db.transaction(['consultations'], 'readonly');
  const store = transaction.objectStore('consultations');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removeStoredConsultation(id) {
  const db = await openDB();
  const transaction = db.transaction(['consultations'], 'readwrite');
  const store = transaction.objectStore('consultations');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getStoredLocationData() {
  const db = await openDB();
  const transaction = db.transaction(['location'], 'readonly');
  const store = transaction.objectStore('location');
  
  return new Promise((resolve, reject) => {
    const request = store.get('current');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function clearStoredLocationData() {
  const db = await openDB();
  const transaction = db.transaction(['location'], 'readwrite');
  const store = transaction.objectStore('location');
  
  return new Promise((resolve, reject) => {
    const request = store.delete('current');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doPeriodicSync());
  }
});

async function doPeriodicSync() {
  try {
    // Sync any pending data
    await syncConsultations();
    await syncLocation();
    
    // Update cache with fresh data
    await updateCache();
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

async function updateCache() {
  const cache = await caches.open(CACHE_NAME);
  
  // Update critical resources
  const urlsToUpdate = [
    '/',
    '/assets/css/main.css',
    '/assets/css/components.css'
  ];
  
  for (const url of urlsToUpdate) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('Failed to update cache for:', url, error);
    }
  }
}

// Handle app shortcuts
self.addEventListener('notificationclick', event => {
  const url = new URL(event.currentTarget.location);
  const action = url.searchParams.get('action');
  
  let targetUrl = '/';
  
  switch (action) {
    case 'find-doctor':
      targetUrl = '/?screen=search';
      break;
    case 'emergency':
      targetUrl = '/?emergency=true';
      break;
    default:
      targetUrl = '/';
  }
  
  event.waitUntil(
    clients.openWindow(targetUrl)
  );
});

// Cache management
self.addEventListener('message', async event => {
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    const cacheSize = await getCacheSize();
    event.ports[0].postMessage({ cacheSize });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    await clearOldCache();
    event.ports[0].postMessage({ success: true });
  }
});

async function getCacheSize() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  let totalSize = 0;
  for (const request of requests) {
    try {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    } catch (error) {
      console.warn('Failed to calculate cache size for:', request.url);
    }
  }
  
  return totalSize;
}

async function clearOldCache() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
  
  return Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
}

console.log('DoctorGo Service Worker loaded successfully');
---
date: 2026-05-05
tags: [javascript, service-worker, pwa, cache, offline, web-api, browser]
type: #permanent-note
status: budding
---

# Service Workers e PWA

I **Service Workers** sono script JavaScript eseguiti dal browser in background, separati dalla pagina web.

Permettono di intercettare richieste di rete, gestire cache, supportare modalita offline, ricevere push notification e creare esperienze simili ad app native.

Una **PWA** (**Progressive Web App**) e una applicazione web che usa standard web per offrire funzionalita avanzate come installazione, offline support, cache intelligente e integrazione con il dispositivo.

---

## 1. Cos'e un Service Worker

Un Service Worker e un worker speciale controllato dal browser.

Caratteristiche principali:

- gira in background;
- non ha accesso diretto al DOM;
- comunica con le pagine tramite messaggi;
- puo intercettare richieste `fetch`;
- funziona solo su HTTPS, tranne `localhost`;
- ha un ciclo di vita indipendente dalla pagina;
- puo essere terminato e riavviato dal browser quando necessario.

Non va trattato come un normale script persistente sempre attivo.

---

## 2. Registrare un Service Worker

La registrazione avviene dal codice della pagina.

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      console.log("Service Worker registrato:", registration.scope);
    } catch (error) {
      console.error("Registrazione Service Worker fallita:", error);
    }
  });
}
```

Il file `/sw.js` definisce la logica del Service Worker.

Lo scope dipende dalla posizione del file. Un Service Worker in `/sw.js` puo controllare l'intero sito. Un Service Worker in `/app/sw.js` controlla solo `/app/` e sotto-percorsi.

---

## 3. Lifecycle

Il ciclo di vita di un Service Worker ha fasi precise:

- **register**: la pagina registra il worker;
- **install**: il browser installa la nuova versione;
- **activate**: il worker diventa attivo;
- **fetch**: il worker intercetta richieste delle pagine controllate;
- **update**: il browser rileva una nuova versione del file worker.

```text
register -> install -> waiting -> activate -> fetch
```

Il lifecycle e intenzionalmente rigoroso per evitare che una nuova versione rompa pagine ancora aperte con codice vecchio.

---

## 4. Install event

Durante `install` si possono salvare in cache risorse essenziali.

```js
const CACHE_NAME = "app-shell-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
});
```

`event.waitUntil()` dice al browser di considerare l'installazione completata solo quando la Promise viene risolta.

Se la Promise fallisce, l'installazione fallisce.

---

## 5. Activate event

Durante `activate` si puliscono cache vecchie o dati non piu necessari.

```js
const CURRENT_CACHE = "app-shell-v2";

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CURRENT_CACHE)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});
```

Questa fase e importante per evitare accumulo di cache obsolete.

---

## 6. Fetch event

Il Service Worker puo intercettare richieste di rete.

```js
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
```

`event.respondWith()` permette di rispondere alla richiesta usando:

- una risposta dalla cache;
- una risposta dalla rete;
- una risposta generata manualmente;
- una combinazione di strategie.

---

## 7. Cache API

La Cache API permette di salvare coppie richiesta/risposta.

```js
const cache = await caches.open("assets-v1");

await cache.add("/styles.css");
await cache.addAll(["/index.html", "/app.js"]);

const response = await cache.match("/app.js");

await cache.delete("/styles.css");
```

La Cache API e asincrona e disponibile sia nel Service Worker sia nella pagina, anche se il caso piu comune e usarla nel Service Worker.

Non va confusa con `localStorage` o `IndexedDB`: la Cache API e pensata per risposte HTTP.

---

## 8. Strategie di caching

### Cache first

Prima controlla la cache, poi la rete.

```js
async function cacheFirst(request) {
  const cached = await caches.match(request);

  return cached || fetch(request);
}
```

Utile per asset statici versionati, come CSS, JS, immagini e font.

### Network first

Prima prova la rete, poi usa la cache come fallback.

```js
async function networkFirst(request) {
  const cache = await caches.open("runtime-v1");

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match(request);
  }
}
```

Utile per dati che devono essere aggiornati ma disponibili anche offline.

### Stale while revalidate

Risponde subito dalla cache e aggiorna la cache in background.

```js
async function staleWhileRevalidate(request) {
  const cache = await caches.open("runtime-v1");
  const cached = await cache.match(request);

  const network = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  });

  return cached || network;
}
```

Utile per migliorare velocita percepita mantenendo dati abbastanza aggiornati.

---

## 9. Offline fallback

Una PWA dovrebbe gestire il caso offline in modo esplicito.

```js
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
  }
});
```

In questo caso, se una navigazione fallisce per assenza di rete, viene mostrata una pagina offline.

La pagina `/offline.html` deve essere salvata in cache durante `install`.

---

## 10. Aggiornamento del Service Worker

Il browser controlla periodicamente se il file del Service Worker e cambiato.

Quando trova una nuova versione:

1. installa il nuovo worker;
2. lo mette in stato `waiting`;
3. attende che le pagine controllate dal vecchio worker vengano chiuse;
4. attiva il nuovo worker.

Questo evita incoerenze tra vecchio codice pagina e nuovo Service Worker.

---

## 11. skipWaiting e clients.claim

`skipWaiting()` forza il nuovo worker ad attivarsi subito.

```js
self.addEventListener("install", event => {
  self.skipWaiting();
});
```

`clients.claim()` permette al worker attivo di prendere controllo delle pagine aperte.

```js
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});
```

Questi metodi sono potenti, ma vanno usati con attenzione: possono creare mismatch se la pagina aperta usa asset vecchi e il Service Worker nuovo serve asset diversi.

---

## 12. Comunicazione con la pagina

La pagina puo inviare messaggi al Service Worker.

```js
navigator.serviceWorker.controller?.postMessage({
  type: "CLEAR_CACHE",
});
```

Il Service Worker puo ascoltarli.

```js
self.addEventListener("message", event => {
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    );
  }
});
```

La comunicazione e utile per aggiornamenti, debug, pulizia cache e sincronizzazione stato.

---

## 13. Web App Manifest

Una PWA usa un file manifest per dichiarare metadati dell'app.

```json
{
  "name": "Appunti",
  "short_name": "Appunti",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111111",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Il manifest si collega nell'HTML.

```html
<link rel="manifest" href="/manifest.webmanifest">
```

Il manifest contribuisce a installabilita, nome app, icone, colore tema e comportamento di apertura.

---

## 14. Requisiti comuni di una PWA

Una PWA solida di solito include:

- HTTPS;
- manifest valido;
- icone adeguate;
- Service Worker registrato;
- pagina funzionante offline o fallback offline;
- layout responsive;
- performance accettabili;
- gestione degli aggiornamenti;
- esperienza installabile dove supportata.

Non tutti i browser applicano gli stessi criteri, quindi va testata sugli ambienti target.

---

## 15. Push notification

I Service Workers possono ricevere push notification anche quando la pagina non e aperta.

Schema generale:

```text
Utente concede permesso
|
Browser crea una subscription
|
Backend salva la subscription
|
Backend invia push
|
Service Worker riceve push
|
Service Worker mostra notifica
```

Esempio lato Service Worker:

```js
self.addEventListener("push", event => {
  const data = event.data?.json() ?? {
    title: "Nuova notifica",
    body: "Hai un aggiornamento.",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
    })
  );
});
```

Le push notification richiedono permesso utente e infrastruttura backend.

---

## 16. Background Sync

La Background Sync API permette di rimandare operazioni finche la rete torna disponibile.

Esempio concettuale:

```js
await registration.sync.register("sync-messages");
```

Nel Service Worker:

```js
self.addEventListener("sync", event => {
  if (event.tag === "sync-messages") {
    event.waitUntil(sendPendingMessages());
  }
});
```

E utile per form, messaggi o azioni create offline e inviate appena possibile.

Il supporto va verificato per i browser target.

---

## 17. Debugging

Nei browser Chromium, i Service Workers si controllano da DevTools.

Percorsi utili:

- Application tab;
- Service Workers;
- Cache Storage;
- Manifest;
- IndexedDB;
- Clear storage;
- Network tab con opzione offline.

Operazioni frequenti:

- aggiornare il worker;
- forzare update;
- disregistrare il worker;
- cancellare cache;
- simulare offline;
- controllare il manifest.

---

## 18. Sicurezza

I Service Workers sono potenti perche possono intercettare richieste.

Per questo:

- richiedono HTTPS;
- hanno scope limitato;
- devono essere serviti dalla stessa origine;
- non devono cacheare dati sensibili senza criterio;
- devono validare bene cosa salvano e cosa restituiscono;
- non devono aggirare autenticazione o autorizzazione lato server.

Un Service Worker compromesso puo alterare il comportamento dell'app fino a quando non viene aggiornato o rimosso.

---

## 19. Best practice

- Versiona le cache con nomi espliciti.
- Pulisci cache vecchie in `activate`.
- Usa strategie diverse per asset statici e dati API.
- Non cacheare risposte private senza una strategia chiara.
- Gestisci una pagina offline per le navigazioni.
- Testa update e rollback del Service Worker.
- Non usare `skipWaiting()` senza capire le conseguenze.
- Usa DevTools per verificare cache, manifest e stato del worker.
- Mantieni il Service Worker piccolo e focalizzato.

---

## 20. Errori comuni

- Pensare che il Service Worker abbia accesso diretto al DOM.
- Dimenticare che funziona solo su HTTPS o localhost.
- Non gestire la richiesta `fetch` per navigazioni offline.
- Cacheare tutto senza strategia.
- Non cancellare cache vecchie.
- Usare `skipWaiting()` creando mismatch tra asset vecchi e nuovi.
- Dimenticare che il Service Worker puo restare installato anche dopo deploy successivi.
- Confondere Cache API con `localStorage`.

---

## 21. Mappa mentale

```text
Service Workers e PWA
|
|-- Service Worker
|   |-- register
|   |-- install
|   |-- activate
|   |-- fetch
|
|-- Cache
|   |-- cache first
|   |-- network first
|   |-- stale while revalidate
|   |-- offline fallback
|
|-- PWA
|   |-- manifest
|   |-- installabilita
|   |-- icone
|   |-- standalone mode
|
|-- Funzionalita avanzate
|   |-- push notification
|   |-- background sync
|   |-- messaggi pagina-worker
|
|-- Debug
|   |-- DevTools Application
|   |-- Cache Storage
|   |-- Manifest
```

---

## 22. Collegamenti

- [[Fetch API]]
- [[Promises]]
- [[Promise avanzate]]
- [[Browser Storage]]
- [[Web Workers]]
- [[CORS]]
- [[Sicurezza]]
- [[Scheduling Browser]]

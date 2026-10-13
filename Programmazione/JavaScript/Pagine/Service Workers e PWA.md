---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - javascript
  - service-worker
  - pwa
  - cache
  - offline
  - web-api
  - browser
aliases:
  - Service Worker
  - PWA
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Browser Storage]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Web Workers]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Browser Storage]]"
  - "[[Programmazione/JavaScript/Pagine/CORS]]"
title: Service Workers e PWA
---

# Service Workers e PWA

## Sintesi

Un **Service Worker** e uno script gestito dal browser, separato dalla pagina, che puo gestire richieste di rete ed eventi come push. Non ha un DOM e non resta necessariamente in esecuzione: il browser puo arrestarlo e riavviarlo. Le variabili globali non sono uno storage persistente.

Una **Progressive Web App** e un'applicazione web con un'esperienza progressivamente arricchita: installazione, integrazione col dispositivo e funzionalita offline dove disponibili. Manifest, installabilita e Service Worker sono concetti distinti: registrare un worker non rende automaticamente offline l'app, e un worker non e un requisito universale per ogni forma di installazione nei browser.

## Quando usarlo

- Asset statici disponibili offline e navigazione con fallback esplicito.
- Strategie di rete/cache scelte in base al tipo di risorsa.
- Aggiornamenti controllati dell'applicazione.
- Push e sincronizzazione differita dove supportate.

Evitalo finche non hai una politica per aggiornamenti, dati privati e rimozione delle versioni vecchie. Un sito statico non ha necessariamente bisogno di un Service Worker: aggiungerlo cambia il comportamento della rete anche nelle visite successive.

Gli esempi sono **materiale didattico per un'app separata**: non installano un Service Worker nel sito Quartz. Le varianti vanno scelte, non concatenate tutte nello stesso file.

## Come funziona

### Contesto, origine e scope

Servono un contesto sicuro (normalmente HTTPS; localhost e loopback sono ammessi per sviluppo), script HTTP/HTTPS della stessa origine e MIME JavaScript corretto. Non usare `file://`. CSP, impostazioni del browser e politiche dello storage possono impedire la registrazione.

Lo scope predefinito e la directory dello script: `/demo/sw.js` controlla normalmente documenti sotto `/demo/`. Per ampliare oltre quella directory serve il corretto header `Service-Worker-Allowed` sulla risposta dello script, non solo l'opzione `scope`. Evita scope sovrapposti e usa un prefisso con slash finale.

Lo scope seleziona **le pagine controllate**, non e un filtro automatico sulle URL richieste: una pagina controllata puo richiedere anche risorse fuori scope o cross-origin. Filtra esplicitamente metodo, origine, URL e tipo di richiesta nel listener `fetch`. Il worker non aggira CORS o autenticazione.

### Registrare un Service Worker

Layout dell'esempio: `/demo/register.js`, `/demo/sw.js` e pagine sotto `/demo/`. `register.js` e un modulo ES; non dipende dall'evento load, che potrebbe essere gia passato quando il modulo viene importato.

```js
export async function registerAppWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return null;
  const script = new URL("./sw.js", import.meta.url);
  return navigator.serviceWorker.register(script, {
    scope: new URL("./", script).href,
    updateViaCache: "none",
  });
}
```

Uso dalla pagina, gestendo anche gli errori di registrazione:

```js
import { registerAppWorker } from "./register.js";

try {
  const registration = await registerAppWorker();
  console.log(registration ? registration.scope : "Service Worker non disponibile");
} catch (error) {
  console.error("Registrazione fallita", error);
}
```

Registrare nuovamente la stessa URL e lo stesso scope non crea un nuovo worker a ogni visita. `updateViaCache: "none"` riguarda la cache HTTP nel controllo degli script del worker, non svuota Cache Storage e non forza l'attivazione di un aggiornamento.

### Lifecycle

```text
registrazione -> installing -> installed (waiting se esiste un vecchio worker)
                            -> activating -> activated
errori di installazione o sostituzione -> redundant
```

`register`, `fetch` e update non sono valori di `ServiceWorker.state`. `install` e `activate` sono eventi; `installing`, `installed`, `activating`, `activated` e `redundant` sono stati osservabili.

| Riferimento | Significato |
| --- | --- |
| `registration.installing` | Versione in installazione, se presente |
| `registration.waiting` | Nuova versione installata in attesa |
| `registration.active` | Worker attivo della registrazione |
| `navigator.serviceWorker.controller` | Worker che controlla questa pagina; puo essere null |
| `navigator.serviceWorker.ready` | Promise che attende una registrazione associata con worker attivo |

La risoluzione di `register()` non certifica il successo del precache o il controllo della pagina. `ready` non rifiuta e puo attendere indefinitamente; non usarla come prova che l'installazione sia riuscita entro un tempo massimo. Anche dopo `ready`, la prima pagina puo non avere un controller. Senza `clients.claim()`, normalmente serve una successiva navigazione nello scope.

### Install event e waitUntil

In `install`, `event.waitUntil(promise)` lega l'esito dell'installazione alle operazioni asincrone, per esempio il precache. Se quella Promise rifiuta, la nuova versione non completa l'installazione e il vecchio worker puo restare attivo.

`cache.addAll` recupera le risorse e rifiuta anche per risposte HTTP non riuscite: una pagina offline mancante puo impedire l'installazione. Usa nomi di cache nuovi per ogni versione incompatibile; non riscrivere la cache utilizzata dal worker vecchio durante l'installazione di quello nuovo.

`waitUntil` deve essere inizialmente chiamato durante il callback dell'evento. Un listener dichiarato `async` non fa attendere automaticamente il browser. Non e un permesso per tenere il worker acceso per sempre.

### Activate event e proprieta delle cache

In `activate`, elimina solo cache appartenenti all'applicazione e non piu usate. Cache Storage non e isolata per scope del worker: altre applicazioni sulla stessa origine possono avere altre cache. Il nome/prefisso e una convenzione di proprieta, non un confine di sicurezza.

L'esempio pratico usa un prefisso che comprende il percorso dell'app e conserva la versione corrente. Evita la regola indiscriminata "cancella tutte le cache diverse dalla mia".

### Fetch event e Response

Chiama `event.respondWith(...)` **sincronicamente nel listener**, passando una Response o una Promise di Response. Non aspettare Fetch prima di chiamarlo. Per le richieste che non vuoi gestire, esci dal listener senza chiamarlo: il browser usa il comportamento normale.

Una cache miss restituisce `undefined`: non puo essere la risposta finale di `respondWith`. Un fallback deve produrre una vera Response, oppure lasciare fallire esplicitamente la richiesta. `fetch` non rifiuta per 404 o 500: decidi separatamente la politica per errori HTTP e problemi di rete.

### Cache API e cache HTTP

Cache Storage contiene coppie Request/Response decise dal codice. Non e la cache HTTP automatica del browser e non applica automaticamente scadenze o direttive come `Cache-Control: no-store`. Non confonderla con localStorage o IndexedDB.

- `cache.match(request)` cerca nella cache selezionata; `caches.match` puo cercare fra piu cache e trovare una versione vecchia.
- Metodo, URL/query e `Vary` incidono sul matching. `ignoreSearch` non e una soluzione generale: puo mescolare dati diversi.
- `cache.put` non effettua la richiesta di rete e puo memorizzare risposte di errore se non le filtri. Non tratta POST come una voce GET.
- Quando restituisci e memorizzi una risposta, usa `response.clone()` prima che il body sia consumato.
- Scritture possono fallire per quota o policy. La cache puo essere eliminata dal browser o dall'utente: prepara sempre il caso di assenza.

### Strategie di caching

| Strategia | Comportamento | Impiego tipico e limite |
| --- | --- | --- |
| Cache first | Cache, poi rete | Asset con URL versionate; altrimenti possono restare vecchi |
| Network first | Rete, poi cache su guasto previsto | Dati pubblici consultabili offline; la rete lenta puo ritardare il fallback |
| Stale while revalidate | Cache subito, aggiornamento in background | Dati pubblici per cui una versione vecchia e accettabile |
| Network only | Nessuna copia persistente applicativa | Operazioni sensibili o dati che devono essere attuali |

Esempi seguenti **alternativi** per un solo endpoint pubblico `public-feed.json`, nella directory del worker. Richiedono GET con `credentials: "omit"`, nessun Authorization/Range, JSON pubblico non personalizzato. Non usarli come cache generica di API private; l'assenza di cookie non dimostra da sola che una risorsa sia pubblica.

Helper comuni e tre strategie, da inserire nel worker che sceglie di usarle:

```js
const PUBLIC_URL = new URL("./public-feed.json", self.location.href).href;
const RUNTIME_CACHE = `notes-feed:${new URL("./", self.location.href).pathname}:v1`;

function checkPublicRequest(request) {
  if (!(request instanceof Request) || request.method !== "GET" ||
      request.url !== PUBLIC_URL || request.credentials !== "omit" ||
      request.headers.has("Authorization") || request.headers.has("Range")) {
    throw new TypeError("Richiesta fuori dalla politica di cache");
  }
}

async function readPublicCache(request) {
  try { return await (await caches.open(RUNTIME_CACHE)).match(request); }
  catch { return undefined; }
}

async function storePublicResponse(request, response) {
  const type = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  const directives = response.headers.get("Cache-Control") || "";
  if (response.status !== 200 || response.redirected || type !== "application/json" ||
      /\b(?:no-store|private)\b/i.test(directives)) return;
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn("Cache non aggiornata", error);
  }
}

function unavailable() {
  return new Response(JSON.stringify({ error: "offline" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

async function cacheFirst(request) {
  checkPublicRequest(request);
  const cached = await readPublicCache(request);
  if (cached) return cached;
  let response;
  try { response = await fetch(request); }
  catch { return unavailable(); }
  await storePublicResponse(request, response);
  return response;
}

async function networkFirst(request) {
  checkPublicRequest(request);
  let response;
  try { response = await fetch(request); }
  catch { return (await readPublicCache(request)) || unavailable(); }
  await storePublicResponse(request, response);
  return response;
}

function staleWhileRevalidate(event) {
  const request = event.request;
  checkPublicRequest(request);
  const network = fetch(request).then(async (response) => {
    await storePublicResponse(request, response);
    return response;
  });
  // Registrato subito: prolunga il lavoro anche se viene restituita la cache.
  event.waitUntil(network.then(() => undefined, () => undefined));
  return (async () => {
    const cached = await readPublicCache(request);
    return cached || network.catch(() => unavailable());
  })();
}
```

Esempio di collegamento per la sola strategia stale-while-revalidate, non da sommare al listener dell'esempio pratico:

```js
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.url !== PUBLIC_URL || request.method !== "GET" ||
      request.credentials !== "omit" || request.headers.has("Authorization") ||
      request.headers.has("Range")) return;
  event.respondWith(staleWhileRevalidate(event));
});
```

Le tre strategie riusano il clone del body solo per la scrittura; una quota esaurita non nasconde una risposta di rete gia ottenuta. In network-first, HTTP 404/500 vengono restituiti senza sostituirli con dati vecchi. In stale-while-revalidate una cache presente viene invece resa subito, anche se il tentativo successivo fallisce: questa e la semantica scelta, non una garanzia di freschezza.

Il codice mantiene al massimo una URL per questa cache, ma non impone un limite al body del server e non implementa TTL, timeout di rete, retry o deduplicazione di richieste concorrenti. Il MIME JSON non verifica la sintassi o lo schema del corpo: vanno controllati dal consumatore. Il filtro sulle direttive e una precauzione aggiuntiva: il contratto pubblico dell'endpoint rimane necessario.

### Aggiornamento, skipWaiting e clients.claim

Il browser controlla gli script in occasioni definite dal lifecycle; `registration.update()` richiede un controllo, non un'attivazione istantanea. Se i byte cambiano, la nuova versione viene installata; con client ancora controllati dal worker vecchio normalmente resta in `waiting`. Un semplice reload non garantisce lo sblocco. Osserva `updatefound`, lo stato di `installing` e un eventuale `waiting` gia presente.

`skipWaiting()` consente alla nuova versione di superare l'attesa; `clients.claim()` permette al worker attivo di prendere controllo di client nello scope. Sono operazioni diverse e **non ricaricano da sole JavaScript e CSS gia presenti nella pagina**.

Variante opzionale per un'app che ha gia progettato compatibilita fra versioni e consenso all'aggiornamento. L'esempio pratico sotto NON la usa.

Dal gestore del comando di aggiornamento della pagina, con `registration` gia ottenuta:

```text
registration.waiting?.postMessage({ type: "SKIP_WAITING" });
```

Nel worker:

```js
self.addEventListener("message", (event) => {
  if (event.origin !== self.location.origin ||
      !event.source?.url?.startsWith(self.registration.scope) ||
      event.data?.type !== "SKIP_WAITING") return;
  event.waitUntil(self.skipWaiting());
});
```

Solo se la presa di controllo immediata fa parte della strategia, in `activate`:

```js
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
```

Prepara il listener `controllerchange` prima di inviare il messaggio; un eventuale reload deve avvenire una sola volta e senza perdere dati non salvati. Mantieni disponibili gli asset richiesti dalle vecchie pagine. Non aggiungere `skipWaiting` incondizionato solo per far sparire `waiting` in DevTools.

### Comunicazione e pulizia richiesta dalla pagina

`navigator.serviceWorker.controller` puo essere null; `controller?.postMessage(...)` in quel caso non invia nulla, non accoda una richiesta futura. Per parlare con la nuova versione in attesa usa `registration.waiting`, non il vecchio controller.

Per un comando di pulizia usa un tipo esplicito, verifica mittente e dati, limita le cache al prefisso dell'app e restituisci un ACK, per esempio con MessageChannel. Dichiara l'effetto distruttivo: cancellare la cache offline puo lasciare l'app senza risorse. Non accettare un comando generico che cancelli tutte le cache dell'origine.

### Web App Manifest e installabilita

Manifest nella root dell'app, qui `/demo/manifest.webmanifest`. Le URL relative evitano di riferirsi accidentalmente alla root del dominio quando il deploy usa un sottopercorso.

```json
{
  "id": "./",
  "name": "Appunti Demo",
  "short_name": "Appunti",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#183d35",
  "icons": [
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Nell'HTML dell'app sotto `/demo/` (per pagine annidate usa la URL della root applicativa corretta):

```html
<link rel="manifest" href="/demo/manifest.webmanifest">
```

Le icone devono esistere davvero e avere le dimensioni dichiarate. `id` identifica l'app; `start_url` indica dove aprirla e lo scope del manifest riguarda l'esperienza dell'app installata, non lo scope di registrazione del Service Worker. `standalone` non crea supporto offline.

Criteri di promozione all'installazione, interfaccia e disponibilita cambiano fra browser e sistemi operativi. Non trattare `beforeinstallprompt` come un'API universale e non promettere un pulsante di installazione solo perche il manifest e valido. L'app deve restare usabile anche nel browser senza installazione. Verifica HTTPS, manifest, icone, layout responsive, avvio e aggiornamenti sui target reali.

### Push notification

Schema: azione esplicita dell'utente e permesso -> subscription del browser -> backend che la conserva -> servizio push -> evento `push` nel worker -> notifica. La pagina puo essere chiusa, ma consegna e tempi dipendono da browser, sistema e permessi; non e un canale realtime garantito.

Handler opzionale; il backend e la gestione della subscription non sono implementati qui. JSON invalido o schema inatteso producono una notifica generica, non un errore di parsing non gestito:

```js
self.addEventListener("push", (event) => {
  let data = null;
  try { data = event.data?.json(); } catch { /* Payload non JSON. */ }
  const title = typeof data?.title === "string" && data.title.trim()
    ? data.title.trim().slice(0, 80) : "Nuova notifica";
  const body = typeof data?.body === "string"
    ? data.body.slice(0, 240) : "Hai un aggiornamento.";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: new URL("icons/icon-192.png", self.registration.scope).href,
  }));
});
```

Richiedi il permesso da un'interazione della pagina, non automaticamente al primo accesso. Proteggi le subscription e non mostrare dati riservati sullo schermo bloccato. Gestione click, URL destinazione, rinnovo/revoca e preferenze utente richiedono una policy separata.

### Background Sync

Background Sync puo chiedere al browser un nuovo tentativo quando la connettivita lo permette. Disponibilita e scheduling non sono universali; non e un cron o una consegna garantita.

Schema concettuale, non codice completo: `sendPendingMessages` e logica applicativa ancora da implementare.

```text
Pagina: salva l'operazione in una outbox IndexedDB.
Se registration.sync esiste: await registration.sync.register("sync-messages").
Worker: nell'evento sync per quel tag, event.waitUntil(sendPendingMessages()).
Fallback: riprova dalla pagina o con un comando esplicito quando riaperta.
```

L'outbox deve sopravvivere al riavvio del worker. Usa chiavi di idempotenza lato server, conserva i dati finche l'ACK e confermato e distingui guasti transitori da input rifiutato. Un retry dopo risposta persa non deve duplicare un'operazione gia applicata.

## API / Sintassi

Operazioni indipendenti sulla Cache API, in un modulo o funzione async. `cache` e l'istanza aperta nel primo blocco; la risorsa deve esistere:

```js
const cache = await caches.open("notes-demo:manual:v1");
```

```js
await cache.add("/demo/styles.v1.css");
```

```js
const response = await cache.match("/demo/styles.v1.css");
console.log(response ? response.status : "Cache miss");
```

Elimina solo quella voce, non il file sul server:

```js
await cache.delete("/demo/styles.v1.css");
```

La Cache API e utilizzabile anche dalla pagina in ambienti che la supportano. Non richiede che quella pagina sia gia controllata da un worker.

## Esempio pratico

**Precache di pochi asset pubblici e fallback offline per navigazioni**, non una SPA offline completa. Usa la registrazione mostrata sopra; il worker e classico per default. File necessari:

```text
demo/
  index.html
  register.js
  sw.js
  app.v1.js
  styles.v1.css
  offline.html
```

`offline.html` deve essere autonomo, con le risorse essenziali incorporate o precaricate. I tre file nella lista devono essere pubblici, non personalizzati, senza redirect e disponibili prima di distribuire il worker. Non inserire nel precache pagine di account o risposte API.

File `sw.js`, blocco completo:

```js
const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `notes-demo:${SCOPE.pathname}:`;
const CACHE_NAME = `${CACHE_PREFIX}shell-v1`;
const OFFLINE_URL = new URL("offline.html", SCOPE).href;
const ASSET_URLS = ["offline.html", "styles.v1.css", "app.v1.js"]
  .map((name) => new URL(name, SCOPE).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(
    ASSET_URLS.map((url) => new Request(url, {
      credentials: "omit",
      cache: "reload",
      redirect: "error",
    })),
  )));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)),
  )));
});

async function navigationResponse(request) {
  try { return await fetch(request); }
  catch {
    try {
      const cached = await (await caches.open(CACHE_NAME)).match(OFFLINE_URL);
      if (cached) return cached;
    } catch { /* Storage non disponibile: usa il fallback minimo. */ }
    return new Response("Connessione non disponibile", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function assetResponse(request) {
  try {
    const cached = await (await caches.open(CACHE_NAME)).match(request);
    if (cached) return cached;
  } catch { /* La lettura cache non deve impedire il tentativo di rete. */ }
  return fetch(request);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== SCOPE.origin ||
      request.headers.has("Authorization") || request.headers.has("Range")) return;
  if (request.mode === "navigate" && url.pathname.startsWith(SCOPE.pathname)) {
    event.respondWith(navigationResponse(request));
  } else if (ASSET_URLS.includes(url.href)) {
    event.respondWith(assetResponse(request));
  }
});
```

La navigazione usa la rete senza salvare l'HTML visitato; su guasto di rete mostra il fallback. Un 404/500 del server rimane tale. Non restituire HTML offline a richieste JSON, immagini o POST. Le query degli asset non vengono ignorate: `app.v1.js?x=1` non e la stessa voce.

Non vengono chiamati `skipWaiting` o `clients.claim`: la prima visita non diventa automaticamente controllata. Attendi l'attivazione, poi apri una nuova navigazione nello scope prima di provare l'offline. Per un update cambia versione di cache e URL degli asset modificati; conserva sul server quelli ancora richiesti dai client vecchi. Il codice non aggiunge precache del manifest o delle icone: aggiungili consapevolmente se servono all'esperienza offline.

## Varianti

### Debugging e rimozione

In DevTools Chromium controlla Application > Service Workers, Cache Storage, Manifest e IndexedDB, oltre alle richieste nel pannello Network. Confronta registrazione, worker attivo/in attesa e controller della pagina; non basta vedere il file `sw.js` scaricato.

Prove minime: prima visita, reload controllato, offline, cache cancellata, un asset del precache mancante, update con due schede aperte e ritorno online. Disabilita le opzioni di sviluppo come Update on reload quando provi il lifecycle reale.

Per rimuovere un worker in sviluppo, disabilita prima il codice che lo registra, disiscrivi **la registrazione dell'app**, poi chiudi le pagine ancora controllate. `unregister()` non cancella Cache Storage e non e un interruttore che termina istantaneamente ogni client. Elimina solo le cache possedute dall'app se vuoi perdere anche i dati offline.

Non cancellare semplicemente `sw.js` dal server sperando di disinstallarlo: una versione gia installata puo continuare a operare. Pianifica un aggiornamento di dismissione e verifica i client esistenti.

### Mappa mentale

```text
Registrazione e scope -> installazione -> attesa -> attivazione -> client controllati
Richieste -> filtro -> rete / cache selezionata / fallback Response
PWA -> manifest + esperienza installata + offline progettato separatamente
Eventi opzionali -> push / sync / messaggi con contratti e permessi
Persistenza -> Cache Storage per risposte, IndexedDB per dati applicativi
```

### Sicurezza

Un worker compromesso puo alterare risposte anche nelle visite successive. HTTPS protegge il trasporto, non rende sicuro codice arbitrario. Usa script affidabili, CSP, filtri di routing e una policy per dati sensibili. Ne lo scope del worker ne un nome di cache separano applicazioni ostili sulla stessa origine. Autenticazione e autorizzazione restano responsabilita del server.

## Errori comuni

- Confondere registrazione riuscita, attivazione e controllo della pagina.
- Contare su variabili globali o timer come se il worker fosse sempre acceso.
- Chiamare `respondWith` dopo un await, oppure restituire una cache miss senza Response.
- Non attendere/catturare `cache.put`, oppure perdere il lavoro di revalidate senza `waitUntil`.
- Cacheare errori HTTP, redirect al login o dati privati; eliminare cache di altre app.
- Usare URL assolute alla root per un'app pubblicata in una sottocartella.
- Forzare aggiornamenti senza gestire compatibilita, piu schede e dati non salvati.
- Confondere modalita standalone, installabilita e offline; promettere push/sync su ogni browser.

## Checklist

- Definisci scope e prefisso delle cache, con URL corrette per il deploy.
- Documenta quali risorse sono pubbliche e quali non vanno memorizzate.
- Verifica installazione fallita, cache miss/eviction, errori HTTP e assenza di rete.
- Garantisciti una Response valida in ogni ramo gestito da `respondWith`.
- Separa operazioni critiche per installare da scritture runtime best effort.
- Prova update e dismissione con client gia aperti, non solo in un profilo pulito.
- Verifica manifest, icone, permessi e API opzionali su browser/dispositivi target.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]

## Fonti

- [MDN - Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [MDN - Register e scope](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register)
- [MDN - Ready](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/ready)
- [MDN - State](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/state)
- [MDN - waitUntil](https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil)
- [MDN - respondWith](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith)
- [MDN - Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [MDN - Cache.addAll](https://developer.mozilla.org/en-US/docs/Web/API/Cache/addAll)
- [MDN - Cache.put](https://developer.mozilla.org/en-US/docs/Web/API/Cache/put)
- [MDN - Caching strategies](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching)
- [MDN - skipWaiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting)
- [MDN - clients.claim](https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim)
- [MDN - Manifest e installabilita](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN - Push event](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/push_event)
- [MDN - Background Sync](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [MDN - Unregister](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/unregister)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

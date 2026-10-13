---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - browser
  - storage
  - localstorage
  - sessionstorage
  - indexeddb
aliases:
  - Storage Browser
  - Web Storage
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/JSON]]"
  - "[[Programmazione/JavaScript/Pagine/BOM]]"
related:
  - "[[Programmazione/JavaScript/Pagine/CORS]]"
  - "[[Programmazione/JavaScript/Pagine/Sicurezza]]"
  - "[[Programmazione/JavaScript/Pagine/Service Workers e PWA]]"
title: Browser Storage
---

# Browser Storage

## Sintesi

Il browser offre diverse API per salvare dati lato client.

Le principali sono `localStorage`, `sessionStorage`, cookie, IndexedDB e Cache API.

---

## Quando usarlo

Usa storage browser quando devi conservare dati lato client tra interazioni, pagine o sessioni.

Scelte tipiche:

- `sessionStorage` per dati temporanei della singola tab;
- `localStorage` per preferenze semplici non sensibili;
- cookie per sessioni e comunicazione automatica con il server;
- IndexedDB per dati strutturati, grandi o offline;
- Cache API per risposte HTTP e asset.

Non usarlo come posto sicuro per segreti leggibili da JavaScript.

## Come funziona

### localStorage
`localStorage` salva coppie chiave-valore persistenti.

```js
localStorage.setItem("theme", "dark");

const theme = localStorage.getItem("theme");
```

Non ha una scadenza automatica, ma non e un archivio garantito: utente, impostazioni di privacy o browser possono eliminare i dati. In navigazione privata la durata e limitata alla sessione privata.

Nel normale contesto di prima parte lo spazio e separato per origine (schema, host e porta), non per percorso: `/app-a` e `/app-b` sulla stessa origine condividono lo storage. HTTP e HTTPS, invece, sono origini diverse. Per gli iframe di terze parti valgono ulteriori politiche di partizionamento o blocco del browser.

Limiti:

- solo stringhe;
- API sincrona;
- accessibile da JavaScript della stessa origine;
- non adatto a dati sensibili.

`getItem()` restituisce `null` quando una chiave manca. Per oggetti usa JSON, controllando anche lo schema dopo `JSON.parse()`: dati modificati, vecchi o corrotti non diventano attendibili perche provengono dal browser.

Anche accedere a `window.localStorage` puo generare `SecurityError`; una scrittura puo fallire per quota. Per test affidabili usa HTTP/HTTPS, non basarti sul comportamento degli URL `file:`.

---
### sessionStorage
`sessionStorage` ha API simile, ma e separato sia per origine sia per sessione della tab. Sopravvive ai normali reload; termina con la sessione della tab, non con ogni cambio di pagina.

```js
sessionStorage.setItem("draft", "testo temporaneo");
```

E utile per bozze temporanee della tab. Se una nuova finestra ha un `opener`, puo ricevere una copia iniziale del suo `sessionStorage`: le modifiche successive restano separate. Non usare questa API come confine di sicurezza.

---
### Cookie
I cookie vengono inviati automaticamente al server nelle richieste compatibili.

Sono utili per sessioni e autenticazione, ma vanno configurati correttamente.

Attributi importanti:

- `HttpOnly`: impedisce la lettura da JavaScript, ma il browser continua a inviare il cookie; va impostato dal server con `Set-Cookie`.
- `Secure`: limita l'invio a connessioni sicure, con le eccezioni di sviluppo previste dal browser.
- `SameSite`: regola l'invio cross-site; `None` richiede `Secure`.
- `Expires` o `Max-Age`: definiscono la durata; `Max-Age` prevale se sono presenti entrambi.
- `Path`: limita i percorsi di invio, non isola i dati dagli script della stessa origine.
- `Domain`: estende l'ambito al dominio e ai sottodomini consentiti; ometterlo crea un cookie host-only.

Per token sensibili, preferire cookie `HttpOnly` quando l'architettura lo permette.

`HttpOnly` non impedisce a codice XSS di agire tramite il browser autenticato. Le richieste con cookie richiedono anche una strategia CSRF adeguata; `SameSite` non sostituisce ogni controllo applicativo. CORS non e un sistema di autenticazione.

---
### IndexedDB
IndexedDB e un database client-side asincrono per dati strutturati e volumi piu grandi.

E adatto a:

- app offline;
- cache applicative;
- dati indicizzati;
- sincronizzazione differita.

Per dati semplici, `localStorage` puo bastare. Per dati grandi o complessi, IndexedDB e piu corretto.

---

### Cache API
La Cache API salva richieste e risposte HTTP.

E usata spesso con Service Worker.

```js
async function cacheStyles() {
  const cache = await caches.open("assets-v1");
  await cache.add("./app.css");
}

cacheStyles().catch(() => console.error("Cache degli stili non disponibile"));
```

Richiede un contesto sicuro (HTTPS o origini locali considerate affidabili) e qui effettua una richiesta a un vero `app.css`. Non e un database generico: conserva coppie request/response. Non applica automaticamente la scadenza degli header HTTP della risposta; versionamento, aggiornamenti e rimozione delle cache vecchie spettano all'app.

### Quote e sincronizzazione

Le quote e le politiche di rimozione dipendono da API, browser e contesto. Non promettere spazio illimitato o persistenza assoluta, nemmeno con IndexedDB o Cache API. I dati essenziali richiedono backup o sincronizzazione, non soltanto storage client.

L'evento `storage` informa gli **altri** documenti che condividono lo spazio: non viene emesso nella finestra che ha scritto. Con `localStorage` puo aggiornare altre tab della stessa origine; `sessionStorage` non sincronizza tab indipendenti. Nel documento che scrive aggiorna la UI esplicitamente.

## API / Sintassi

Salvare una stringa (puo generare un'eccezione):

```js
localStorage.setItem("app:theme", "dark");
```

Leggerla:

```js
const savedTheme = localStorage.getItem("app:theme");
```

Rimuovere soltanto quella preferenza:

```js
localStorage.removeItem("app:theme");
```

Evita `localStorage.clear()` per il reset di una singola funzionalita: cancella tutte le chiavi dello spazio, anche quelle di altre app sulla stessa origine. Il prefisso `app:` evita collisioni accidentali, non crea isolamento.

---

## Esempio pratico

Preferenza UI con valori ammessi e fallback se lo storage e disabilitato o pieno:

```js
function saveTheme(theme) {
  if (theme !== "light" && theme !== "dark") {
    throw new TypeError("Tema non supportato");
  }

  try {
    window.localStorage.setItem("app:theme", theme);
    return true;
  } catch {
    return false;
  }
}

function loadTheme() {
  try {
    const theme = window.localStorage.getItem("app:theme");
    return theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

document.documentElement.dataset.theme = loadTheme();
```

`saveTheme()` restituisce `false` se non puo persistere la scelta: il chiamante puo applicarla solo in memoria e segnalare che non verra ricordata. Non nascondere allo stesso modo un fallimento se stai salvando una bozza importante. Qui il fallback silenzioso e una scelta limitata a una preferenza UI non essenziale.

## Varianti

- **localStorage**: semplice, persistente, sincrono.
- **sessionStorage**: temporaneo per tab.
- **Cookie**: inviati automaticamente al server, utili per sessioni.
- **IndexedDB**: asincrono, strutturato, adatto a grandi volumi.
- **Cache API**: cache di request/response, spesso con Service Worker.

## Errori comuni

- Salvare token sensibili in `localStorage`.
- Dimenticare che `localStorage` e sincrono.
- Non gestire quote e limiti di spazio.
- Usare cookie senza `Secure` e `SameSite`.
- Usare Cache API come sostituto generico di un database.

---

## Checklist

### Checklist operativa
- Usa `sessionStorage` per dati temporanei di tab.
- Usa `localStorage` per preferenze non sensibili.
- Usa IndexedDB per dati grandi o strutturati.
- Usa cookie sicuri per sessioni lato server.
- Non salvare segreti leggibili da JavaScript se puoi evitarlo.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- [[Programmazione/JavaScript/Pagine/Service Workers e PWA|Service Workers e PWA]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]


## Fonti

- [MDN: localStorage e SecurityError](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
- [MDN: sessionStorage e opener](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage).
- [MDN: quote e rimozione dei dati](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- [MDN: cookie HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies).
- [MDN: Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache).
- [MDN: evento storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

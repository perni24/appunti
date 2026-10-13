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
  - ajax
  - xhr
  - networking
  - browser
aliases:
  - AJAX JS
  - XMLHttpRequest
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/Callback]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/CORS]]"
title: AJAX
---

# AJAX

## Sintesi

AJAX significa Asynchronous JavaScript and XML.

Oggi il termine indica in generale richieste asincrone dal browser al server senza ricaricare l'intera pagina, anche quando il formato usato e JSON e non XML.

AJAX e una tecnica, non una libreria o un protocollo separato da HTTP. XHR e Fetch sono due API per realizzarla; ricevere dati non aggiorna automaticamente il DOM.

Gli esempi sono per il browser e richiedono endpoint `/api/...` forniti dall'applicazione, non dal sito degli appunti. I frammenti sono indipendenti salvo dipendenze dichiarate; quelli con await al livello principale richiedono un modulo. Non chiamare funzioni async senza attendere o gestire il loro risultato.

---

## Quando usarlo

### Quando sapere XHR serve ancora
XHR puo comparire in:

- codice legacy;
- vecchie librerie;
- esempi storici;
- upload con eventi di avanzamento tramite `xhr.upload`.

Per normali richieste HTTP, Fetch si integra bene con Promise e async/await. XHR non e pero un'API da eliminare solo perche piu vecchia: gli eventi di avanzamento upload restano un motivo concreto per usarla. Le API Fetch e XHR non sono intercambiabili riga per riga.

---

## Come funziona

### Idea di base
Prima delle applicazioni web moderne, molte interazioni richiedevano il caricamento completo di una nuova pagina.

Con AJAX, JavaScript puo:

- inviare una richiesta HTTP;
- ricevere dati;
- aggiornare solo una parte del DOM;
- mantenere l'utente sulla stessa pagina.

---
### XMLHttpRequest
`XMLHttpRequest` usa eventi. `open()` configura la richiesta, `send()` la avvia. Il terzo argomento true seleziona l'uso asincrono, che e anche il default: non usare XHR sincrono sul thread della UI.

Esempio completo di GET JSON: timeout intero da 0 a 2.147.483.647 millisecondi (0 disabilita il timeout), AbortSignal opzionale dello stesso realm e risposte senza corpo rappresentate da null. Il parsing non convalida ancora lo schema applicativo.

```js
function getJsonXHR(url, { timeoutMs = 5000, signal } = {}) {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 2_147_483_647) {
      throw new RangeError("Timeout non valido");
    }
    if (signal !== undefined && !(signal instanceof AbortSignal)) {
      throw new TypeError("Serve un AbortSignal");
    }
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const xhr = new XMLHttpRequest();
    let settled = false;
    function finish(callback, value) {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      xhr.onload = xhr.onerror = xhr.ontimeout = xhr.onabort = null;
      callback(value);
    }
    function onAbort() {
      xhr.abort();
      finish(reject, signal.reason);
    }
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        const error = new Error(`HTTP ${xhr.status}`);
        error.status = xhr.status;
        finish(reject, error);
        return;
      }
      try {
        const data = xhr.status === 204 || xhr.status === 205
          ? null : JSON.parse(xhr.responseText);
        finish(resolve, data);
      } catch (error) {
        finish(reject, error);
      }
    };
    xhr.onerror = () => finish(reject, new TypeError("Rete o accesso CORS fallito"));
    xhr.ontimeout = () => finish(reject, new DOMException("Tempo scaduto", "TimeoutError"));
    xhr.onabort = () => finish(reject, signal?.aborted
      ? signal.reason : new DOMException("Richiesta annullata", "AbortError"));
    try {
      xhr.open("GET", url, true);
      xhr.timeout = timeoutMs;
      xhr.setRequestHeader("Accept", "application/json");
      signal?.addEventListener("abort", onAbort, { once: true });
      xhr.send();
    } catch (error) {
      finish(reject, error);
    }
  });
}
```

Uso del solo helper precedente:

```js
try {
  console.log(await getJsonXHR("/api/users"));
} catch (error) {
  console.error("Caricamento non riuscito", error);
}
```

`load` significa trasferimento completato, non HTTP riuscito: anche 404 e 500 arrivano qui. `error`, `timeout` e `abort` sono percorsi distinti. `loadend` viene emesso al termine indipendentemente dall'esito, quindi e utile per cleanup, non come prova di successo. `status === 0` non e un codice HTTP del server e non permette da solo di diagnosticare CORS.

XHR non accetta nativamente un'opzione `signal`: il wrapper collega esplicitamente l'evento del signal a `xhr.abort()` e rimuove il listener su ogni esito. Il timeout riguarda il trasferimento, non interrompe JSON.parse o elaborazioni sincrone; abortire non fa rollback del server.

---
### readyState
`readyState` descrive lo stato della richiesta XHR.

| Valore | Nome | Significato |
| --- | --- | --- |
| 0 | UNSENT | `open()` non chiamato |
| 1 | OPENED | `open()` chiamato |
| 2 | HEADERS_RECEIVED | header ricevuti |
| 3 | LOADING | body in ricezione |
| 4 | DONE | operazione terminata, anche per errore |

La sequenza non garantisce il successo e puo cambiare in caso di abort. `readystatechange` puo scattare molte volte: non renderizzare dati parziali assumendo che siano gia JSON completo. Per testo usa responseText; con `responseType = "json"` usa response, che puo essere null anche per JSON non valido. Il wrapper sceglie parsing testuale esplicito per distinguere JSON malformato da JSON null. Per binari usa responseType blob o arraybuffer, non responseText.

---
### AJAX moderno con fetch
```js
async function loadUsers({ signal } = {}) {
  const response = await fetch("/api/users", { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const users = await response.json();
  if (!Array.isArray(users) || users.some((user) =>
    user === null || typeof user !== "object" || Array.isArray(user) ||
    !Number.isSafeInteger(user.id) || user.id < 1 ||
    typeof user.name !== "string" || !user.name.trim())) {
    throw new TypeError("Elenco utenti non valido");
  }
  return users.map(({ id, name }) => ({ id, name }));
}
```

Il contratto e un array JSON di utenti con id positivo sicuro e name non vuoto. La funzione restituisce dati validati: rendering, loading e gestione del rifiuto spettano al chiamante. Vedi l'esempio pratico per il collegamento al DOM.

---
### AJAX e JSON
Anche se il nome contiene XML, oggi il formato piu comune e JSON.

```js
const response = await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "Luca" }),
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
console.log(response.status);
```

Questo esempio controlla lo status senza leggere un eventuale corpo. Se l'endpoint restituisce JSON, leggilo una sola volta; se restituisce 204, non chiamare json(). Content-Type descrive cio che invii, non garantisce il formato della risposta.

---
### AJAX e CORS
CORS riguarda un'origine diversa: schema, host o porta differenti, non solo un dominio diverso.

```js
const response = await fetch("https://api.example.com/users");
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const users = await response.json();
```

Senza autorizzazione CORS il browser non rende leggibile la risposta. Un preflight puo impedire l'invio della richiesta applicativa, ma per altre richieste il server puo averla gia ricevuta. In XHR le credenziali cross-origin richiedono `withCredentials = true` prima di send e consenso del server; cookie e protezioni CSRF restano politiche separate. Vedi [[Programmazione/JavaScript/Pagine/CORS|CORS]].

### Avanzamento upload

`xhr.onprogress` riguarda il download; `xhr.upload` espone gli eventi di upload. `lengthComputable` e total vanno controllati prima di calcolare una percentuale. L'invio al 100% non prova che il server abbia validato o salvato il file: attendi anche l'esito HTTP.

Helper da collegare a un elemento HTML progress e a una XHR dedicata, prima di open/send. Restituisce il cleanup da chiamare al loadend o quando la vista viene rimossa:

```js
function trackUpload(xhr, progressElement) {
  function onProgress(event) {
    if (event.lengthComputable && event.total > 0) {
      progressElement.max = event.total;
      progressElement.value = event.loaded;
    } else {
      progressElement.removeAttribute("value");
    }
  }
  xhr.upload.addEventListener("progress", onProgress);
  return () => xhr.upload.removeEventListener("progress", onProgress);
}
```

Questo helper osserva soltanto l'avanzamento: non avvia un upload e non ne gestisce gli errori. Il codice di invio usa FormData senza impostare manualmente il Content-Type multipart, come in [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]. Registrare listener su xhr.upload puo richiedere un preflight per richieste cross-origin.

---

## API / Sintassi

Schema del ciclo XHR; non e un secondo esempio completo di gestione degli errori:

```text
const xhr = new XMLHttpRequest();
xhr.open("GET", "/api/users");
xhr.send();
```

Handler principali:

```text
xhr.onreadystatechange = () => {};
xhr.onload = () => {};
xhr.onerror = () => {};
xhr.onprogress = () => {};
xhr.ontimeout = () => {};
xhr.onabort = () => {};
xhr.onloadend = () => {};
```

Schema moderno equivalente per una risposta JSON:

```js
const response = await fetch("/api/users");
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
```

## Esempio pratico

Aggiornare una lista senza ricaricare la pagina, con dati da `loadUsers()` definita sopra. Markup richiesto:

```html
<button id="refresh-users" type="button">Aggiorna utenti</button>
<p id="users-status" role="status"></p>
<ul id="users-list"></ul>
```

Esegui il montaggio dopo che questi nodi esistono, per esempio da uno script type="module". Una sola richiesta alla volta; i dati precedenti rimangono visibili in caso di errore.

```js
function mountUsers() {
  const button = document.querySelector("#refresh-users");
  const status = document.querySelector("#users-status");
  const list = document.querySelector("#users-list");
  if (!button || !status || !list) throw new Error("Markup utenti mancante");
  let currentController;
  let disposed = false;

  async function refreshUsers() {
    if (disposed || currentController) return;
    const controller = new AbortController();
    currentController = controller;
    button.disabled = true;
    status.textContent = "Caricamento...";
    try {
      const users = await loadUsers({ signal: controller.signal });
      if (disposed || controller.signal.aborted) return;
      const fragment = document.createDocumentFragment();
      for (const user of users) {
        const item = document.createElement("li");
        item.textContent = user.name;
        fragment.append(item);
      }
      list.replaceChildren(fragment);
      status.textContent = `${users.length} utenti`;
    } catch (error) {
      if (!disposed && !controller.signal.aborted) {
        status.textContent = "Impossibile caricare gli utenti";
        console.error(error);
      }
    } finally {
      if (currentController === controller) currentController = undefined;
      if (!disposed) button.disabled = false;
    }
  }

  const onClick = () => { void refreshUsers(); };
  button.addEventListener("click", onClick);
  return function unmountUsers() {
    disposed = true;
    button.removeEventListener("click", onClick);
    currentController?.abort();
    currentController = undefined;
    button.disabled = false;
  };
}
```

Uso: `const unmountUsers = mountUsers()`; al cambio vista chiama `unmountUsers()`. Non montare due volte sullo stesso markup senza cleanup. `void` non gestisce gli errori: qui il catch e dentro refreshUsers. I nomi sono inseriti con textContent, non come HTML eseguibile.

Questo e AJAX nel senso moderno: richiesta asincrona, dati ricevuti e DOM aggiornato parzialmente. Per ricerche sovrapposte con criterio "vince l'ultima", usa il modello in [[Programmazione/JavaScript/Pagine/AbortController|AbortController]].

## Varianti

- **XMLHttpRequest**: API storica callback/event-based.
- **Fetch API**: API moderna Promise-based.
- **JSON over HTTP**: uso piu comune nelle applicazioni moderne.
- **FormData upload**: invio di form e file.
- **Polling AJAX**: richieste periodiche per aggiornamenti.
- **CORS request**: richiesta cross-origin soggetta a policy browser.

Con polling non avviare richieste lente a ogni setInterval senza controllo: possono sovrapporsi. Pianifica la successiva dopo il completamento, applica intervalli/backoff e annulla il ciclo nel cleanup. Long polling mantiene una richiesta aperta fino a un evento; SSE e WebSocket richiedono modelli diversi, non un semplice ciclo AJAX piu rapido.

## Errori comuni

- Pensare che AJAX significhi solo XML.
- Usare XHR in nuovo codice senza motivo.
- Dimenticare gestione errori HTTP.
- Confondere errore CORS con errore del codice JavaScript.
- Aggiornare troppo DOM dopo ogni risposta senza batching.
- Scambiare DONE, load o status 0 per conferma di successo HTTP.
- Usare responseText insieme a un responseType non testuale.
- Dimenticare timeout, abort, cleanup o risposte obsolete.
- Inserire nella pagina HTML non fidato ricevuto dalla rete.

---

## Checklist

### Checklist operativa
- Usa `fetch()` per nuovo codice.
- Usa XHR solo quando serve compatibilita o una feature specifica.
- Controlla sempre lo status HTTP.
- Serializza e deserializza JSON in modo esplicito.
- Considera CORS quando chiami API esterne.
- Se usi responseType json, distingui il contratto applicativo da un semplice parsing automatico.
- Per upload, separa avanzamento del trasferimento e conferma del server.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]


## Fonti

- [MDN - Using XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_XMLHttpRequest)
- [MDN - readyState](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState)
- [MDN - responseType](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType)
- [MDN - timeout](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout)
- [MDN - abort](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort)
- [MDN - upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload)
- [WHATWG - XMLHttpRequest](https://xhr.spec.whatwg.org/)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, promises, async, concurrency, allsettled, race, error-handling]
aliases: [Promise all, Promise race, Promise any, Promise allSettled]
prerequisites: [Promises, Async Await]
related: [Event Loop, Fetch API, AbortController, Error Handling]
---

# Promise avanzate

## Sintesi

### Testo introduttivo
Le Promise avanzate servono a coordinare piu operazioni asincrone, decidendo se attendere tutti i risultati, accettare solo il primo completato, gestire fallimenti parziali o limitare la concorrenza.

Questi strumenti sono fondamentali quando un'applicazione deve lavorare con piu richieste HTTP, task indipendenti, fallback, timeout o batch di operazioni.

> [!INFO]
> I metodi come `Promise.all()`, `Promise.race()` e `Promise.any()` non creano parallelismo CPU reale. Coordinano operazioni asincrone gia avviate, come richieste di rete, timer o I/O.

---

## Quando usarlo

Usa tecniche avanzate con Promise quando devi coordinare piu operazioni asincrone, gestire concorrenza, fallback, timeout o risultati parziali.

Casi comuni:

- richieste indipendenti da eseguire insieme;
- retry e timeout;
- uso del primo risultato disponibile;
- gestione di piu errori;
- caricamento parallelo di risorse;
- limitazione della concorrenza.

Se il flusso e semplice, `async/await` con una singola Promise basta.

## Come funziona

### 1. Promise.all()
`Promise.all()` riceve un iterabile di Promise e restituisce una nuova Promise.

La Promise risultante:

- si risolve quando tutte le Promise si sono risolte;
- restituisce un array con i risultati nello stesso ordine dell'input;
- si rifiuta appena una delle Promise viene rifiutata.

```js
const [user, posts, comments] = await Promise.all([
  fetch("/api/user").then(response => response.json()),
  fetch("/api/posts").then(response => response.json()),
  fetch("/api/comments").then(response => response.json()),
]);
```

`Promise.all()` e utile quando tutti i risultati sono necessari per continuare.

Esempi tipici:

- caricare dati indipendenti per una pagina;
- eseguire controlli preliminari obbligatori;
- attendere piu file prima di elaborare un risultato finale.

---
### 3. Promise.allSettled()
`Promise.allSettled()` attende che tutte le Promise terminino, sia con successo sia con errore.

Restituisce sempre un array di oggetti con questa forma:

```js
[
  { status: "fulfilled", value: "Risultato" },
  { status: "rejected", reason: new Error("Errore") },
]
```

Esempio:

```js
const results = await Promise.allSettled([
  fetch("/api/profile"),
  fetch("/api/notifications"),
  fetch("/api/recommendations"),
]);

const successful = results
  .filter(result => result.status === "fulfilled")
  .map(result => result.value);

const failed = results
  .filter(result => result.status === "rejected")
  .map(result => result.reason);
```

`Promise.allSettled()` e utile quando gli errori parziali sono accettabili.

Esempi tipici:

- dashboard con widget indipendenti;
- importazione massiva di dati;
- caricamento di risorse opzionali;
- invio di notifiche a piu destinatari.

---
### 4. Promise.race()
`Promise.race()` restituisce il risultato della prima Promise che termina, sia con successo sia con errore.

```js
const result = await Promise.race([
  fetch("/api/primary"),
  fetch("/api/backup"),
]);
```

Se la prima Promise completata viene risolta, `Promise.race()` si risolve.

Se la prima Promise completata viene rifiutata, `Promise.race()` viene rifiutata.

`Promise.race()` e utile per:

- timeout;
- scegliere la prima risposta disponibile;
- implementare competizioni tra task;
- evitare attese troppo lunghe.

> [!WARNING]
> Le Promise che perdono la race non vengono cancellate automaticamente. Continuano a eseguire il loro lavoro se non vengono annullate esplicitamente.

---
### 5. Timeout con Promise.race()
Un uso comune di `Promise.race()` e creare un timeout.

```js
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), ms);
  });
}

const response = await Promise.race([
  fetch("/api/data"),
  timeout(3000),
]);
```

Questo codice interrompe l'attesa dopo 3 secondi, ma non annulla automaticamente la richiesta `fetch`.

Per annullare davvero la richiesta si usa `AbortController`.

```js
const controller = new AbortController();

const timeoutId = setTimeout(() => {
  controller.abort();
}, 3000);

try {
  const response = await fetch("/api/data", {
    signal: controller.signal,
  });

  const data = await response.json();
  console.log(data);
} finally {
  clearTimeout(timeoutId);
}
```

---
### 6. Promise.any()
`Promise.any()` restituisce il primo risultato risolto con successo.

Ignora le Promise rifiutate finche almeno una Promise riesce.

```js
const response = await Promise.any([
  fetch("https://cdn-1.example.com/file.json"),
  fetch("https://cdn-2.example.com/file.json"),
  fetch("https://cdn-3.example.com/file.json"),
]);
```

Se tutte le Promise falliscono, `Promise.any()` viene rifiutata con un `AggregateError`.

```js
try {
  const result = await Promise.any([
    loadFromPrimary(),
    loadFromReplica(),
    loadFromCache(),
  ]);

  console.log(result);
} catch (error) {
  if (error instanceof AggregateError) {
    console.error("Tutti i tentativi sono falliti:", error.errors);
  }
}
```

`Promise.any()` e utile per:

- fallback tra servizi equivalenti;
- CDN multiple;
- lettura da cache o rete;
- strategie "usa il primo successo".

---
### 7. Confronto tra i metodi
| Metodo | Quando termina | Se una Promise fallisce | Caso d'uso |
| --- | --- | --- | --- |
| `Promise.all()` | Quando tutte hanno successo | Fallisce subito | Tutti i risultati sono obbligatori |
| `Promise.allSettled()` | Quando tutte sono terminate | Non fallisce in automatico | Errori parziali accettabili |
| `Promise.race()` | Quando la prima termina | Dipende dalla prima terminata | Timeout o prima risposta |
| `Promise.any()` | Quando la prima ha successo | Fallisce solo se falliscono tutte | Fallback e primo successo |

---
### 8. Sequenziale vs concorrente
Questo codice esegue le richieste una alla volta.

```js
for (const url of urls) {
  const response = await fetch(url);
  console.log(await response.json());
}
```

Questo codice avvia tutte le richieste insieme e poi attende il completamento.

```js
const responses = await Promise.all(
  urls.map(url => fetch(url))
);
```

La versione concorrente e spesso piu veloce, ma puo creare troppa pressione su rete, server, memoria o rate limit.

---
### 10. Concorrenza controllata
Avviare migliaia di Promise contemporaneamente puo causare problemi:

- troppe richieste di rete;
- consumo eccessivo di memoria;
- blocchi lato server;
- errori di rate limit;
- UI meno reattiva.

In questi casi conviene limitare il numero di operazioni attive.

```js
async function runWithLimit(items, limit, task) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const promise = Promise.resolve().then(() => task(item));

    results.push(promise);
    executing.add(promise);

    promise.finally(() => {
      executing.delete(promise);
    });

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}
```

Uso:

```js
const results = await runWithLimit(urls, 5, async url => {
  const response = await fetch(url);
  return response.json();
});
```

Questo pattern mantiene al massimo 5 operazioni attive nello stesso momento.

---
### 11. Gestire fallimenti parziali
Quando alcune operazioni possono fallire senza bloccare tutto, `Promise.allSettled()` rende esplicita la gestione dei risultati.

```js
const results = await Promise.allSettled(files.map(uploadFile));

const uploaded = [];
const failed = [];

for (const result of results) {
  if (result.status === "fulfilled") {
    uploaded.push(result.value);
  } else {
    failed.push(result.reason);
  }
}

console.log("Upload riusciti:", uploaded.length);
console.log("Upload falliti:", failed.length);
```

Questo approccio evita di perdere informazioni sugli altri task quando uno solo fallisce.

---
### 12. Cleanup con finally()
`finally()` e utile per liberare risorse dopo un gruppo di operazioni asincrone.

```js
setLoading(true);

try {
  const data = await Promise.all([
    loadUser(),
    loadProjects(),
  ]);

  render(data);
} catch (error) {
  showError(error);
} finally {
  setLoading(false);
}
```

Il blocco `finally` viene eseguito sia in caso di successo sia in caso di errore.

---

## API / Sintassi

Metodi statici principali:

```js
Promise.all(promises);
Promise.allSettled(promises);
Promise.race(promises);
Promise.any(promises);
Promise.resolve(value);
Promise.reject(error);
```

Pattern timeout:

```js
const timeout = new Promise((_, reject) => {
  setTimeout(() => reject(new Error("timeout")), 5000);
});

await Promise.race([operation(), timeout]);
```

Per cancellazione reale usa API che supportano `AbortSignal`, non solo `Promise.race`.

## Esempio pratico

Caricare dati indipendenti:

```js
const [user, settings, notifications] = await Promise.all([
  loadUser(),
  loadSettings(),
  loadNotifications(),
]);
```

Se vuoi conservare anche i fallimenti:

```js
const results = await Promise.allSettled([
  loadUser(),
  loadSettings(),
  loadNotifications(),
]);
```

`allSettled` e utile quando un errore non deve cancellare tutto il batch.

## Varianti

### 15. Mappa mentale
```text
Promise avanzate
|
|-- Promise.all()
|   |-- attende tutti i successi
|   |-- fallisce al primo errore
|
|-- Promise.allSettled()
|   |-- attende tutti gli esiti
|   |-- gestisce successi e fallimenti
|
|-- Promise.race()
|   |-- restituisce il primo completato
|   |-- utile per timeout
|
|-- Promise.any()
|   |-- restituisce il primo successo
|   |-- fallisce solo se falliscono tutte
|
|-- Concorrenza controllata
|   |-- limita task attivi
|   |-- riduce pressione su rete e memoria
```

---

## Errori comuni

### 2. Comportamento in caso di errore
Se una Promise fallisce, `Promise.all()` rifiuta subito la Promise aggregata.

```js
try {
  const results = await Promise.all([
    loadUser(),
    loadPermissions(),
    loadSettings(),
  ]);

  console.log(results);
} catch (error) {
  console.error("Almeno una operazione e fallita:", error);
}
```

Le altre operazioni asincrone non vengono cancellate automaticamente. Possono continuare a girare, ma il risultato di `Promise.all()` e ormai rifiutato.

Per annullare operazioni di rete bisogna usare strumenti come `AbortController`.

---
### 9. Errore comune con map async
`map(async ...)` restituisce un array di Promise, non un array di risultati.

```js
const users = ids.map(async id => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

console.log(users); // Array di Promise
```

Per ottenere i risultati bisogna usare `Promise.all()`.

```js
const users = await Promise.all(
  ids.map(async id => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  })
);
```

---
### 14. Errori comuni
- Confondere `Promise.race()` con `Promise.any()`.
- Pensare che `Promise.race()` cancelli le Promise perdenti.
- Usare `map(async ...)` senza `Promise.all()`.
- Avviare troppe operazioni concorrenti senza limite.
- Usare `Promise.all()` quando servirebbe tollerare errori parziali.
- Ignorare `AggregateError` con `Promise.any()`.

---

## Checklist

### 13. Best practice
- Usa `Promise.all()` quando tutti i risultati sono necessari.
- Usa `Promise.allSettled()` quando vuoi conoscere ogni esito.
- Usa `Promise.race()` per timeout o prima operazione terminata.
- Usa `Promise.any()` quando basta il primo successo.
- Non usare `Promise.all()` su liste enormi senza valutare limiti di concorrenza.
- Ricorda che le Promise non vengono cancellate da sole.
- Gestisci sempre gli errori con `try/catch` o `.catch()`.
- Usa `AbortController` quando vuoi annullare richieste HTTP.

---

## Collegamenti

### 16. Collegamenti
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]

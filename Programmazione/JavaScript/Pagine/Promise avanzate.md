---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - promises
  - async
  - concurrency
  - allsettled
  - race
  - error-handling
aliases:
  - Promise all
  - Promise race
  - Promise any
  - Promise allSettled
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/AbortController]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling]]"
title: Promise avanzate
---

# Promise avanzate

## Sintesi


Le Promise avanzate servono a coordinare piu operazioni asincrone, decidendo se attendere tutti i risultati, accettare solo il primo completato, gestire fallimenti parziali o limitare la concorrenza.

Questi strumenti sono fondamentali quando un'applicazione deve lavorare con piu richieste HTTP, task indipendenti, fallback, timeout o batch di operazioni.

> [!INFO]
> I metodi come `Promise.all()`, `Promise.race()` e `Promise.any()` non creano parallelismo CPU reale. Coordinano operazioni asincrone gia avviate, come richieste di rete, timer o I/O.

Gli esempi sono indipendenti. I blocchi con `await` al top-level richiedono un modulo ES, oppure vanno inseriti in una funzione async il cui rifiuto sia gestito dal chiamante. Gli URL `/api/...` sono endpoint dimostrativi da implementare o simulare: non funzionano per il solo fatto di incollare il codice.

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

### Preparazione degli esempi HTTP

Negli esempi seguenti definisci prima questo helper. Distingue errori HTTP e JSON malformato, ma non valida lo schema applicativo del JSON; aggiungi tale controllo prima di usare i dati. Fetch puo essere fulfilled anche per una risposta HTTP 404 o 500.

```js
async function fetchJSON(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
```

I combinatori accettano iterabili di Promise, thenable e valori ordinari. Non invocano funzioni passate come elementi: `[loadUser]` contiene una funzione, `[loadUser()]` contiene il risultato della sua chiamata. Per controllare quando parte un lavoro serve una funzione da chiamare, non una Promise di un lavoro gia avviato.

### Promise.all()
`Promise.all()` aggrega tutti i risultati richiesti in una nuova Promise.

La Promise risultante:

- diventa fulfilled quando tutti gli elementi hanno successo;
- restituisce un array con i risultati nello stesso ordine dell'input;
- si rifiuta appena una delle Promise viene rifiutata.

```js
const [user, posts, comments] = await Promise.all([
  fetchJSON("/api/user"),
  fetchJSON("/api/posts"),
  fetchJSON("/api/comments"),
]);
```

`Promise.all()` e utile quando tutti i risultati sono necessari per continuare.

Le chiamate nell'array avviano i lavori; `all` li osserva. Un fallimento non annulla gli altri e non esegue rollback di scritture gia effettuate. Con un array ordinario di Promise gia ottenute, i rifiuti degli altri input sono osservati dal combinatore, ma devi comunque gestire la Promise aggregata.

Esempi tipici:

- caricare dati indipendenti per una pagina;
- eseguire controlli preliminari obbligatori;
- attendere piu file prima di elaborare un risultato finale.

---
### Promise.allSettled()
`Promise.allSettled()` attende che tutte le Promise terminino, sia con successo sia con errore.

Quando gli input terminano, la Promise aggregata e fulfilled con un array nello stesso ordine dell'input, non in ordine di completamento:

```js
[
  { status: "fulfilled", value: "Risultato" },
  { status: "rejected", reason: new Error("Errore") },
]
```

Esempio:

```js
const results = await Promise.allSettled([
  fetchJSON("/api/profile"),
  fetchJSON("/api/notifications"),
  fetchJSON("/api/recommendations"),
]);

const successful = results
  .filter(result => result.status === "fulfilled")
  .map(result => result.value);

const failed = results
  .filter(result => result.status === "rejected")
  .map(result => result.reason);
```

`Promise.allSettled()` e utile quando gli errori parziali sono accettabili.

Un input che resta pending impedisce il completamento. "Non fallisce" riguarda i rifiuti delle operazioni raccolte: un iterabile non valido o che lancia durante l'iterazione puo comunque far rifiutare il combinatore. Inoltre una funzione che lancia mentre costruisci l'array lo fa prima che `allSettled` venga chiamato.

Esempi tipici:

- dashboard con widget indipendenti;
- importazione massiva di dati;
- caricamento di risorse opzionali;
- invio di notifiche a piu destinatari.

---
### Promise.race()
`Promise.race()` adotta il primo esito osservato, successo o rifiuto. Se gli input sono gia settled, non ne ricostruisce l'ordine cronologico passato: anche l'ordine nell'iterabile conta.

```js
const result = await Promise.race([
  fetchJSON("/api/primary"),
  fetchJSON("/api/backup"),
]);
```

Se il primo esito osservato e un successo, `Promise.race()` diventa fulfilled.

Se la prima Promise completata viene rifiutata, `Promise.race()` viene rifiutata.

`Promise.race()` e utile per:

- timeout;
- scegliere la prima risposta disponibile;
- implementare competizioni tra task;
- evitare attese troppo lunghe.

> [!WARNING]
> Le Promise che perdono la race non vengono cancellate automaticamente. Continuano a eseguire il loro lavoro se non vengono annullate esplicitamente.

---
### Timeout con Promise.race()
Un timeout di attesa non e una cancellazione. Questo wrapper riceve una **funzione che avvia** il lavoro, non una Promise gia in esecuzione; valida prima il ritardo e rimuove il timer quando non serve piu.

```js
async function withTimeout(start, ms) {
  if (typeof start !== "function") {
    throw new TypeError("Serve una funzione che avvii il lavoro");
  }
  if (!Number.isInteger(ms) || ms < 0 || ms > 2_147_483_647) {
    throw new RangeError("Timeout non valido");
  }

  let timeoutId;
  const deadline = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Timeout")), ms);
  });

  try {
    return await Promise.race([Promise.resolve().then(start), deadline]);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

Uso con l'helper precedente:

```js
try {
  const data = await withTimeout(() => fetchJSON("/api/data"), 3000);
  console.log(data);
} catch (error) {
  console.error("Operazione fallita:", error);
}
```

Il timer rende possibile il rifiuto dopo il ritardo richiesto, non a una scadenza esatta. Non interrompe codice sincrono pesante e non ferma il lavoro che perde la race. La Promise del lavoro resta osservata, ma puo continuare a usare risorse o produrre effetti anche dopo il timeout.

Per annullare davvero la richiesta si usa `AbortController`.

```js
async function fetchJSONWithTimeout(url, ms = 3000) {
  if (!Number.isInteger(ms) || ms < 0 || ms > 2_147_483_647) {
    throw new RangeError("Timeout non valido");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    return await fetchJSON(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
```

Qui `return await` mantiene il timer attivo fino alla lettura del corpo inclusa, perche `fetchJSON` adotta la Promise di `response.json()`. Il chiamante deve gestire il rifiuto. L'abort e cooperativo e riguarda le API che ricevono il segnale: non annulla effetti gia avvenuti sul server e non interrompe a meta un parsing sincrono. Questa versione ha solo il proprio timeout, non un segnale esterno.

---
### Promise.any()
`Promise.any()` restituisce il primo risultato risolto con successo.

Ignora le Promise rifiutate finche almeno una Promise riesce.

```js
const data = await Promise.any([
  fetchJSON("/api/replica-1/data"),
  fetchJSON("/api/replica-2/data"),
  fetchJSON("/api/replica-3/data"),
]);
```

Se tutte le Promise falliscono, `Promise.any()` viene rifiutata con un `AggregateError`.

Le repliche devono offrire dati equivalenti; "primo successo" non significa automaticamente dato piu recente o semanticamente corretto. Usando Fetch senza controllare `ok`, una risposta 500 veloce potrebbe essere considerata il successo vincente. `any` avvia una competizione concorrente, non un fallback sequenziale.

Schema applicativo: `loadFromPrimary`, `loadFromReplica` e `loadFromCache` sono funzioni da fornire che restituiscono Promise.

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
  } else {
    throw error;
  }
}
```

`Promise.any()` e utile per:

- fallback tra servizi equivalenti;
- CDN multiple;
- lettura da cache o rete;
- strategie "usa il primo successo".

`error.errors` mantiene l'ordine degli input, non quello dei rifiuti. Le operazioni non vincenti non vengono annullate automaticamente, neppure dopo il primo successo.

---
### Confronto tra i metodi
| Metodo | Quando termina | Se una Promise fallisce | Caso d'uso |
| --- | --- | --- | --- |
| `Promise.all()` | Quando tutte hanno successo | Fallisce subito | Tutti i risultati sono obbligatori |
| `Promise.allSettled()` | Quando tutte sono terminate | Non fallisce in automatico | Errori parziali accettabili |
| `Promise.race()` | Quando la prima termina | Dipende dalla prima terminata | Timeout o prima risposta |
| `Promise.any()` | Quando la prima ha successo | Fallisce solo se falliscono tutte | Fallback e primo successo |

### Input vuoti e callback differite

| Espressione | Esito |
| --- | --- |
| `Promise.all([])` | Fulfilled con `[]` |
| `Promise.allSettled([])` | Fulfilled con `[]` |
| `Promise.race([])` | Resta pending |
| `Promise.any([])` | Rejected con `AggregateError` e `errors: []` |

Anche se una Promise e gia settled, gli handler collegati con `then/catch` sono differiti. Non aspettare `race([])` se il tuo algoritmo deve terminare. I valori ordinari non sono operazioni: diventano valori fulfilled; `Promise.all([loadUser])` non carica un utente.

---
### Sequenziale vs concorrente
Esempi alternativi, con una lista finita di URL e l'helper definito sopra. Questo codice avvia la richiesta successiva soltanto dopo aver letto la risposta precedente.

```js
const urls = ["/api/user", "/api/settings"];
for (const url of urls) {
  console.log(await fetchJSON(url));
}
```

Questo codice avvia tutte le richieste insieme e poi attende il completamento.

```js
const urls = ["/api/user", "/api/settings"];
const responses = await Promise.all(urls.map((url) => fetchJSON(url)));
```

La versione concorrente e spesso piu veloce, ma puo creare troppa pressione su rete, server, memoria o rate limit.

---
### Concorrenza controllata
Avviare migliaia di Promise contemporaneamente puo causare problemi:

- troppe richieste di rete;
- consumo eccessivo di memoria;
- blocchi lato server;
- errori di rate limit;
- UI meno reattiva.

In questi casi conviene limitare il numero di operazioni attive.

Contratto di questa funzione: array denso ordinario, limite intero positivo e `task(item, index)` che restituisce un valore o una Promise dell'intero lavoro da limitare. La funzione conserva l'ordine dei risultati. Al primo errore osservato non avvia altri elementi, attende i lavori gia partiti e poi rifiuta con quell'errore. Non esegue rollback o cancellazione.

```js
async function runWithLimit(items, limit, task) {
  if (!Array.isArray(items) || typeof task !== "function") {
    throw new TypeError("Servono un array e una funzione");
  }
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError("Limite intero positivo richiesto");
  }
  const input = items.slice();
  for (let index = 0; index < input.length; index += 1) {
    if (!Object.hasOwn(input, index)) {
      throw new TypeError("L'array non deve contenere buchi");
    }
  }

  const results = new Array(input.length);
  let nextIndex = 0;
  let failed = false;
  let firstError;

  async function worker() {
    while (!failed) {
      const index = nextIndex++;
      if (index >= input.length) return;
      try {
        results[index] = await task(input[index], index);
      } catch (error) {
        if (!failed) {
          failed = true;
          firstError = error;
        }
        return;
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, input.length) },
    () => worker(),
  );
  await Promise.all(workers);
  if (failed) throw firstError;
  return results;
}
```

Uso con le due funzioni complete `runWithLimit` e `fetchJSON`:

```js
const urls = ["/api/users/1", "/api/users/2", "/api/users/3"];
try {
  const results = await runWithLimit(urls, 2, (url) => fetchJSON(url));
  console.log(results);
} catch (error) {
  console.error("Batch fallito:", error);
}
```

Qui sono attivi al massimo due lavori. `worker` e soltanto una funzione async, non un Web Worker. Un array vuoto produce `[]`; un throw sincrono di `task` segue lo stesso percorso di un rifiuto. Il flag `failed` permette di conservare anche ragioni falsy, per esempio `undefined`.

Limiti: la copia dell'array e superficiale; gli oggetti restano condivisi. Il risultato occupa memoria proporzionale all'input. Se un lavoro attivo non termina, anche il drenaggio dopo un errore puo restare in attesa: prevedi un timeout/cancellazione nel singolo task quando necessario. Questo e un limite di concorrenza, non di richieste al secondo. Il task non deve avviare lavoro scollegato e restituire subito: quel lavoro sfuggirebbe al limite.

Evita `promise.finally(cleanup)` ignorandone il risultato: crea una nuova Promise che puo rifiutarsi anche se la Promise originale e osservata. Il pool sopra attende tutti i propri worker e intercetta i rifiuti dei task senza generare rami di cleanup abbandonati.

---
### Gestire fallimenti parziali
Quando alcune operazioni possono fallire senza bloccare tutto, `Promise.allSettled()` rende esplicita la gestione dei risultati.

Schema: `files` e una lista finita e `uploadFile(file)` esegue l'upload. Il wrapper differito cattura anche eventuali throw sincroni di uploadFile; non introduce un limite di concorrenza.

```js
const results = await Promise.allSettled(
  files.map((file) => Promise.resolve().then(() => uploadFile(file))),
);

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
### Cleanup con finally()
`finally()` e utile per liberare risorse dopo un gruppo di operazioni asincrone.

Qui si usa il blocco `try/finally`, non il metodo `Promise.prototype.finally`. E uno schema UI: setLoading, loadUser, loadProjects, render e showError sono funzioni dell'applicazione. Si assume una sola esecuzione attiva; un solo booleano loading non basta a gestire piu caricamenti sovrapposti.

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

Se `Promise.all` rifiuta, altri lavori possono essere ancora attivi quando loading torna false. Non interpretare quello stato come garanzia che ogni richiesta sia terminata. Un throw nel cleanup puo sostituire l'errore originale; evita return/throw accidentali nel finally.

---

## API / Sintassi

Metodi statici principali, schema dei nomi e non blocco da eseguire senza dati e gestione dei rifiuti:

```text
Promise.all(promises);
Promise.allSettled(promises);
Promise.race(promises);
Promise.any(promises);
Promise.resolve(value);
Promise.reject(error);
```

Per il timeout usa `withTimeout(() => operation(), ms)` del paragrafo dedicato: il timer viene rimosso. Per interrompere operazioni che lo supportano usa `AbortSignal`, non solo `Promise.race`.

## Esempio pratico

Caricare dati indipendenti, dopo aver definito `fetchJSON`. I due blocchi sono alternative con politiche di errore diverse:

```js
const [user, settings, notifications] = await Promise.all([
  fetchJSON("/api/user"),
  fetchJSON("/api/settings"),
  fetchJSON("/api/notifications"),
]);
```

Se vuoi conservare anche i fallimenti:

```js
const results = await Promise.allSettled([
  fetchJSON("/api/user"),
  fetchJSON("/api/settings"),
  fetchJSON("/api/notifications"),
]);
```

`allSettled` conserva gli esiti parziali invece di rifiutare l'aggregato al primo errore; non e una forma di cancellazione. Nel primo caso gestisci il rifiuto al confine del chiamante; nel secondo controlla ogni campo `status` prima di leggere `value` o `reason`.

## Varianti

### Mappa mentale
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

### Comportamento in caso di errore
Se una Promise fallisce, `Promise.all()` rifiuta subito la Promise aggregata.

Schema applicativo, con le tre funzioni di caricamento fornite dal chiamante:

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
### Errore comune con map async
`map(async ...)` restituisce un array di Promise, non un array di risultati. Controesempio incompleto: i rifiuti dell'array non sono gestiti. `ids` e un array di identificativi positivi gia validati e `fetchJSON` e l'helper precedente.

```js
const users = ids.map(async id => {
  return fetchJSON(`/api/users/${id}`);
});

console.log(users); // Array di Promise
```

Per ottenere i risultati bisogna usare `Promise.all()`.

```js
const users = await Promise.all(
  ids.map(async id => {
    return fetchJSON(`/api/users/${id}`);
  })
);
```

---

- Confondere `Promise.race()` con `Promise.any()`.
- Pensare che `Promise.race()` cancelli le Promise perdenti.
- Usare `map(async ...)` senza `Promise.all()`.
- Avviare troppe operazioni concorrenti senza limite.
- Usare `Promise.all()` quando servirebbe tollerare errori parziali.
- Ignorare `AggregateError` con `Promise.any()`.
- Dimenticare gli input vuoti o lasciare timer attivi dopo una race.
- Scambiare un errore HTTP per un successo oppure ignorare la Promise restituita da finally.

---

## Checklist

### Best practice
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


- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]

## Fonti

- [MDN: Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).
- [MDN: Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled).
- [MDN: Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).
- [MDN: Promise.any e AggregateError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any).
- [MDN: Promise.finally e Promise restituita](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally).
- [MDN: Fetch, status HTTP e corpo della risposta](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [MDN: AbortController.abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort).
- [MDN: composizione delle Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

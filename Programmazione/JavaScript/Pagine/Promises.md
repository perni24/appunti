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
  - promises
  - async
  - error-handling
aliases:
  - Promise JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Callback]]"
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Promise avanzate]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling]]"
title: Promises
---

# Promises

## Sintesi

Una Promise rappresenta un esito singolo: un valore di successo oppure una ragione di fallimento. Puo essere ancora in attesa o gia completata quando la ricevi.

La Promise e un oggetto che permette di osservare e comporre l'esito, non un thread e non l'operazione stessa. I frammenti qui sono indipendenti, salvo dove indicato; gli esempi con Fetch richiedono un endpoint reale o simulato.

---

## Quando usarlo

Usa Promise quando devi rappresentare un risultato asincrono che arrivera una volta sola.

Casi comuni:

- richieste HTTP;
- lettura file in Node.js;
- timeout;
- caricamento risorse;
- inizializzazioni asincrone;
- operazioni indipendenti da coordinare.

Per sequenze continue di eventi, stream o dati nel tempo, valuta EventEmitter, stream o async iterator.

## Come funziona

### Stati
Una Promise puo trovarsi in tre stati:

- pending: nessun esito definitivo ancora disponibile;
- fulfilled: operazione completata con successo;
- rejected: operazione fallita.

Una volta fulfilled o rejected, la Promise e settled e non cambia piu stato.

La ragione del rifiuto puo essere qualsiasi valore JavaScript, ma usare un oggetto `Error` conserva messaggio e stack. Essere fulfilled non rende immutabile l'oggetto eventualmente restituito.

### Resolved non significa sempre fulfilled

`resolve(value)` avvia la risoluzione: con un valore ordinario produce successo; con una Promise o un *thenable* (oggetto con `then` chiamabile) ne adotta l'esito. Puo quindi lasciare la Promise pending e farla terminare in rejected.

```js
let rejectInner;
const inner = new Promise((resolve, reject) => {
  rejectInner = reject;
});

const outer = new Promise((resolve, reject) => {
  resolve(inner);
  reject(new Error("ignorato"));
});

outer.catch((error) => console.log(error.message));
rejectInner(new Error("errore adottato"));
// Stampa: errore adottato
```

La prima chiamata al resolver blocca la scelta dell'esito da adottare; ulteriori chiamate a resolve/reject non la cambiano. Tuttavia resolve/reject **non sono return**: il codice successivo nell'esecutore continua. La Promise puo anche restare pending indefinitamente se nessuno ne determina l'esito.

---
### Chaining
Ogni `.then()` restituisce una nuova Promise.

Schema di una sequenza applicativa: `loadUser`, `loadPosts` e `loadComments` devono restituire Promise con dati della forma attesa; `render` e `showError` sono funzioni dell'applicazione, non API JavaScript.

```js
loadUser(1)
  .then((user) => loadPosts(user.id))
  .then((posts) => {
    if (posts.length === 0) return [];
    return loadComments(posts[0].id);
  })
  .then((comments) => render(comments))
  .catch((error) => showError(error));
```

Un rifiuto nella **catena restituita**, o un throw dentro un suo handler, passa al successivo gestore di rifiuto: `.catch()` oppure il secondo argomento di `.then()`. Un lavoro avviato e non restituito non entra automaticamente nella catena. Un throw sincrono di `loadUser(1)` prima che restituisca una Promise non e catturato da quel `.catch()`.

---
### Return dentro then
Il valore ordinario restituito dall'handler passato a `.then()` diventa il valore ricevuto dall'handler successivo. E distinto dalla nuova Promise che il metodo `.then()` restituisce subito al chiamante.

```js
Promise.resolve(2)
  .then((value) => value * 2)
  .then((value) => {
    console.log(value); // 4
  });
```

Se restituisci una Promise, la nuova Promise ne adotta l'esito. Senza `return`, l'handler restituisce `undefined` e il passaggio successivo non aspetta il lavoro che hai soltanto avviato.

Esempio autonomo di composizione:

```js
function doubleLater(value) {
  return Promise.resolve(value * 2);
}

Promise.resolve(3)
  .then((value) => {
    return doubleLater(value);
  })
  .then((value) => console.log(value)); // 6
```

---
### Promise e microtask
Gli handler di `.then()`, `.catch()` e `.finally()` vengono eseguiti in modo differito, tramite i job delle Promise, integrati nelle microtask del browser. Vale anche se la Promise era gia settled. L'esecutore passato a `new Promise`, invece, viene invocato subito.

```js
console.log("A");

const promise = new Promise((resolve) => {
  console.log("executor");
  resolve("B");
  console.log("dopo resolve");
});

promise.then((value) => console.log(value));
console.log("C");

// A
// executor
// dopo resolve
// C
// B
```

---

## API / Sintassi

### Creare una Promise
```js
const promise = new Promise((resolve, reject) => {
  const success = true;

  if (success) {
    resolve("ok");
  } else {
    reject(new Error("errore"));
  }
});
```

Nella maggior parte del codice applicativo si consumano Promise create da API esistenti, come `fetch`, invece di crearle manualmente.

`return` nell'esecutore non fornisce il risultato alla Promise: usa resolve/reject. Un throw sincrono nell'esecutore rifiuta la Promise, a meno che la risoluzione sia gia stata determinata. Un throw in un timer futuro non viene catturato dal costruttore.

---
### Consumare una Promise
Nel browser, `/api/users` deve rispondere con un array JSON di oggetti con `id` intero positivo e `name` stringa non vuota. La funzione restituisce una nuova lista con i soli campi ammessi; il controllo non sostituisce autenticazione, autorizzazioni o limiti alla dimensione della risposta.

```js
function loadUsers() {
  return fetch("/api/users")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        throw new TypeError("Atteso un array di utenti");
      }
      return data.map((user) => {
        if (
          user === null || typeof user !== "object" || Array.isArray(user) ||
          !Number.isSafeInteger(user.id) || user.id < 1 ||
          typeof user.name !== "string" || user.name.trim() === ""
        ) {
          throw new TypeError("Utente non valido");
        }
        return { id: user.id, name: user.name };
      });
    });
}
```

Uso dopo la definizione precedente:

```js
loadUsers()
  .then((users) => console.log(users))
  .finally(() => console.log("richiesta terminata"))
  .catch((error) => console.error("Caricamento fallito:", error));
```

Fetch non rifiuta automaticamente per HTTP 404/500: il controllo di `ok` e esplicito. Anche `response.json()` e asincrono e puo fallire; JSON valido non significa schema applicativo valido. Il catch e qui al confine di utilizzo: `loadUsers` lascia propagare gli errori al chiamante.

Metodi principali:

- `.then(onFulfilled, onRejected)` collega handler opzionali e restituisce una nuova Promise;
- `.catch(onRejected)` equivale a `.then(undefined, onRejected)`;
- `.finally(onFinally)` esegue cleanup dopo il completamento, senza ricevere valore o ragione dell'esito.

### Errori e recupero con catch

Un catch che restituisce un valore ordinario recupera dall'errore: quel valore diventa un successo della nuova Promise. Se restituisce un'altra Promise, ne adotta l'esito, che puo essere ancora un rifiuto. Non e soltanto un log.

```js
Promise.reject(new Error("cache non disponibile"))
  .catch(() => [])
  .then((items) => console.log(items.length)); // 0: fallback scelto
```

Se l'errore deve proseguire, rilancialo o restituisci una Promise rejected. Se un catch stampa soltanto, la nuova Promise sara fulfilled con `undefined`, non ancora rejected.

L'handler di errore nello **stesso** `.then(success, failure)` non intercetta gli errori lanciati da `success`, perche questi riguardano la Promise appena restituita:

```js
Promise.resolve("ok")
  .then(
    () => { throw new Error("errore nel successo"); },
    () => console.log("non eseguito"),
  )
  .catch((error) => console.log(error.message));
```

Un catch protegge soltanto il ramo a cui appartiene. Chiamare due volte `p.then(...)` crea due rami distinti, e ogni ramo che puo rifiutarsi deve avere un proprietario che ne gestisca l'esito.

### Finally conserva l'esito, salvo errori

Se la callback termina normalmente, `finally` conserva il valore o il rifiuto precedente: il valore ordinario restituito dalla callback viene ignorato. Se restituisce una Promise, questa viene attesa; se lancia o restituisce un rifiuto, la nuova Promise viene rifiutata con quel nuovo motivo.

```js
Promise.resolve(7)
  .finally(() => 99)
  .then((value) => console.log(value)); // 7, non 99
```

Variante indipendente con cleanup fallito:

```js
Promise.resolve(7)
  .finally(() => { throw new Error("cleanup fallito"); })
  .catch((error) => console.log(error.message)); // cleanup fallito
```

Per questo un `.catch(...).finally(...)` puo ancora produrre un rifiuto dopo il catch. Restituisci/attendi la catena completa oppure gestisci anche gli errori finali.

---

## Esempio pratico

Adattare un timer a una Promise. Il contratto scelto accetta solo millisecondi interi fra 0 e 2.147.483.647, evitando coercizioni e ritardi fuori dall'intervallo dei timer comuni:

```js
function wait(ms) {
  if (!Number.isInteger(ms) || ms < 0 || ms > 2_147_483_647) {
    return Promise.reject(new RangeError("Ritardo non valido"));
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

wait(1000)
  .then(() => console.log("Timer completato"))
  .catch((error) => console.error(error));
```

`wait` restituisce sempre una Promise anche per input non validi. Non promette precisione al millisecondo e questa versione non supporta cancellazione. `wait(0)` passa attraverso un timer, non e equivalente a `Promise.resolve()`.

Puoi usare `await wait(1000)` dentro una funzione async o al top-level di un modulo che lo supporta; non nello script classico senza un contesto async.

### Adattare una API error-first

Questa funzione adatta la `readConfig(filePath, callback)` completa della nota [[Programmazione/JavaScript/Pagine/Callback|Callback]]. Va definita nello stesso modulo o importata esplicitamente; non e una funzione integrata.

```js
function readConfigAsync(filePath) {
  return new Promise((resolve, reject) => {
    readConfig(filePath, (error, config) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(config);
    });
  });
}
```

Gli errori sincroni di registrazione vengono catturati dal costruttore, quelli asincroni devono arrivare nella callback. Per codice Node nuovo preferisci `node:fs/promises`; per molte API error-first esiste anche `node:util.promisify`, rispettandone il contratto e il receiver. Non avvolgere di nuovo Fetch solo per ottenere una Promise: ne restituisce gia una.

## Varianti

- **Promise singola**: rappresenta un risultato futuro.
- **Catena `.then()`**: composizione asincrona esplicita.
- **`async/await`**: sintassi piu lineare sopra Promise.
- **`Promise.all`**: restituisce tutti i valori in ordine di input oppure rifiuta al primo rifiuto osservato.
- **`Promise.race`**: prende la prima Promise settled.
- **`Promise.allSettled`**: restituisce esito di tutte.
- **`Promise.any`**: prende la prima fulfilled.

Questi combinatori non fermano automaticamente le altre operazioni e non creano thread. Risultati vuoti, timeout e limitazione della concorrenza sono trattati in [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]].

## Errori comuni

### Executor async

Evita `new Promise(async (resolve, reject) => ...)`: il costruttore ignora la Promise restituita dalla funzione async. Un suo rifiuto puo risultare non gestito mentre la Promise esterna rimane pending. Scrivi direttamente una funzione async o usa un esecutore sincrono per adattare una API callback.

### Try senza await

`try { operationAsync(); } catch (...) { ... }` intercetta un eventuale throw sincrono, non un rifiuto successivo. Devi attendere la Promise con `await` dentro il try oppure collegare un gestore di rifiuto.

---
- Dimenticare `return` dentro una catena.
- Non gestire `.catch()`.
- Pensare che una Promise possa essere cancellata direttamente.
- Usare `new Promise` quando esiste gia un'API Promise-based.
- Confondere Promise concorrenti e codice parallelo CPU.
- Recuperare un errore con catch per sbaglio, restituendo undefined a chi si aspetta dati validi.
- Ignorare il ramo restituito da then/finally o una Promise avviata senza return.

---

## Checklist

### Checklist operativa
- Gestisci sempre il percorso di errore.
- Usa `async/await` quando rende il flusso piu leggibile.
- Usa `Promise.all` per operazioni indipendenti necessarie.
- Usa `AbortController` per cancellare operazioni che lo supportano.
- Evita catene troppo lunghe se diventano meno leggibili.
- Verifica chi possiede la Promise finale e gestisce il suo eventuale rifiuto.
- Separa errore di rete, status HTTP, parsing JSON e validazione dei dati.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]

## Fonti

- [MDN: Promise, stati e adozione dell'esito](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
- [MDN: costruttore Promise ed esecutore](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise).
- [MDN: then e nuova Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then).
- [MDN: catch e recupero](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch).
- [MDN: finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally).
- [MDN: composizione e gestione degli errori](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).
- [MDN: Fetch, errori HTTP e lettura del corpo](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [Node.js: util.promisify](https://nodejs.org/api/util.html#utilpromisifyoriginal).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

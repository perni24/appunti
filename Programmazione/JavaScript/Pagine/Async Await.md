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
  - async-await
  - promises
  - async
aliases:
  - Async Await JS
  - async await
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Promise avanzate]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling]]"
title: Async Await
---

# Async Await

## Sintesi

`async` e `await` sono sintassi costruita sopra le Promise.

Servono a scrivere codice asincrono con una forma piu lineare e leggibile rispetto a catene lunghe di `.then()`.

Non rendono sincrona la rete e non spostano calcoli su un altro thread. Gli esempi sono indipendenti; i frammenti con `await` fuori da una funzione richiedono un modulo ES. Gli endpoint HTTP devono esistere o essere simulati.

---

## Quando usarlo

Usa `async/await` quando devi scrivere flussi asincroni leggibili e ordinati.

Casi tipici:

- chiamate `fetch`;
- lettura file in Node.js;
- sequenze di operazioni dipendenti;
- gestione errori con `try/catch`;
- API che restituiscono Promise.

Per operazioni indipendenti valuta `Promise.all` o un limite di concorrenza. La sequenza resta corretta se serve contenere il carico o rispettare un ordine: non parallelizzare automaticamente ogni chiamata.

## Come funziona

### `async`
Una funzione marcata con `async` restituisce sempre una Promise.

```js
async function getMessage() {
  return "ciao";
}

const result = getMessage();

console.log(result instanceof Promise); // true
```

Un valore ordinario diventa un successo; una Promise/thenable restituita viene adottata; un throw nel corpo diventa un rifiuto. La chiamata crea una nuova Promise anche quando il return e una Promise esistente.

Il corpo parte sincronicamente e continua fino alla prima sospensione. Anche senza await un ciclo pesante blocca il thread:

```js
async function describeOrder() {
  console.log("inizio funzione");
  const value = await 7;
  console.log("ripresa", value);
  return value;
}

const pending = describeOrder();
console.log("chiamante");
pending.then((value) => console.log("risultato", value));

// inizio funzione
// chiamante
// ripresa 7
// risultato 7
```

---
### `await`
`await` attende l'esito dell'operando senza bloccare il thread: sospende la funzione async, non il chiamante. Accetta anche valori ordinari e thenable; la continuazione e differita anche per `await 7` o per una Promise gia fulfilled.

```js
async function getUserRecord() {
  const response = await fetch("/api/users/1");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const user = await response.json();

  return user;
}
```

`await` produce il valore fulfilled oppure rilancia nel punto di attesa la ragione del rifiuto, che non e necessariamente un oggetto Error. `getUserRecord` controlla HTTP e parsing, ma non lo schema: la versione completa e nell'esempio pratico.

L'operando viene valutato prima di sospendere: in `await expensiveCalculation()` il calcolo sincrono avviene ancora sul thread corrente. Ripetere await su Promise gia risolte non garantisce un frame di rendering; vedi [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]].

---
### `finally`
`finally` e utile per cleanup e stato UI.

Schema applicativo: `setLoading` e `saveForm` devono essere forniti dall'applicazione, e si assume un solo invio attivo. La funzione restituisce una Promise che il chiamante deve attendere o gestire.

```js
async function submitForm(data) {
  setLoading(true);

  try {
    await saveForm(data);
  } finally {
    setLoading(false);
  }
}
```

Viene eseguito sia in caso di successo sia in caso di errore.

Il finally non assorbe automaticamente l'errore. Un suo throw o return puo pero sostituire l'esito precedente: evita return nei blocchi di cleanup. Se il cleanup e asincrono, attendilo esplicitamente e decidi come gestirne l'errore. Non si garantisce il cleanup se il processo o la pagina vengono terminati forzatamente.

### Return e return await

Se devi solo inoltrare un esito, puoi restituire la Promise. Se devi intercettarne il rifiuto con il catch locale o mantenere una risorsa fino al completamento prima del finally, devi attendere dentro il try.

```js
async function withoutAwait(operation) {
  try {
    return operation();
  } catch {
    return "fallback";
  }
}

async function withAwait(operation) {
  try {
    return await operation();
  } catch {
    return "fallback";
  }
}
```

Con `() => Promise.reject(new Error("errore"))`, `withoutAwait` propaga il rifiuto mentre `withAwait` recupera con `"fallback"`. Un throw sincrono di `operation()` viene invece intercettato da entrambe. Il fallback qui e una scelta dimostrativa, non una raccomandazione a nascondere tutti gli errori.

Analogamente, `try { return operation(); } finally { cleanup(); }` esegue il cleanup prima che l'operazione restituita termini. Non eliminare un `return await` dentro try/finally come se fosse sempre ridondante.

---
### Sequenziale vs concorrente
Qui le **chiamate** vengono avviate in sequenza, e la seconda dipende dal risultato della prima. loadUser/loadPosts/loadSettings sono funzioni dell'applicazione nei due schemi seguenti:

```js
const user = await loadUser();
const posts = await loadPosts(user.id);
```

Se le operazioni sono indipendenti, avviale insieme.

```js
const [user, settings] = await Promise.all([
  loadUser(),
  loadSettings(),
]);
```

Questo consente concorrenza, non parallelismo CPU. `Promise.all` non annulla il lavoro restante se un input fallisce.

Avviare prima due Promise e poi attenderle una alla volta non le rende sequenziali. Inoltre la seconda potrebbe rifiutarsi prima che le venga collegato un handler: collega subito entrambe a `Promise.all` o `allSettled`, invece di lasciare temporaneamente un ramo senza gestione.

---
### Top-level await
Nei moduli ES moderni si puo usare `await` al top-level: nel browser serve `type="module"`, in Node un file ESM come `.mjs`. Non e valido in uno script classico o dentro una callback non async, anche se questa e annidata in una funzione async.

Esempio browser completo di modulo `config.js` con endpoint JSON:

```js
const response = await fetch("/api/config");
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const config = await response.json();

export { config };
```

I moduli che dipendono da questa valutazione attendono la configurazione, ma non viene bloccato il thread o tutto il caricamento della pagina. Se l'attesa fallisce, fallisce la valutazione/importazione del modulo. Lo schema di config resta da validare; evita I/O essenziale senza una strategia di errore, e considera le dipendenze circolari.

---

## API / Sintassi

Schemi alternativi: `operation`, `handleError` e le funzioni di caricamento devono essere definiti nell'applicazione. Non concatenare i due blocchi che dichiarano `loadData` nello stesso scope.

Sintassi base:

```js
async function loadData() {
  const result = await operation();
  return result;
}
```

Arrow function:

```js
const loadData = async () => {
  return await operation();
};
```

Gestione errori:

```js
try {
  const data = await loadData();
} catch (error) {
  handleError(error);
}
```

Concorrenza:

```js
const [user, settings] = await Promise.all([
  loadUser(),
  loadSettings(),
]);
```

## Esempio pratico

Caricare un utente con timeout e pulizia del timer. Contratto: `id` intero positivo sicuro; `timeoutMs` intero fra 0 e 2.147.483.647. L'endpoint deve fornire un oggetto JSON con lo stesso id e `name` stringa non vuota. La funzione restituisce solo questi due campi e lascia propagare gli errori al chiamante.

```js
async function loadUser(id, timeoutMs = 5000) {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new RangeError("Id intero positivo richiesto");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 2_147_483_647) {
    throw new RangeError("Timeout non valido");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`/api/users/${id}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const user = await response.json();
    if (
      user === null || typeof user !== "object" || Array.isArray(user) ||
      user.id !== id || typeof user.name !== "string" || user.name.trim() === ""
    ) {
      throw new TypeError("Risposta utente non valida");
    }
    return { id: user.id, name: user.name };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

Il timer rimane attivo durante la lettura del corpo e viene rimosso dal finally su successo, errore HTTP, parsing, schema invalido o abort. Non e un limite di tempo rigido: il timer puo essere ritardato e non interrompe lavoro sincrono gia in corso. L'abort non annulla effetti gia eseguiti sul server.

Uso dopo la definizione:

```js
loadUser(1)
  .then((user) => console.log(user.name))
  .catch((error) => {
    if (error?.name === "AbortError") {
      console.error("Caricamento interrotto dal timeout");
    } else {
      console.error("Caricamento fallito:", error);
    }
  });
```

Qui esiste soltanto il controller interno, quindi l'abort atteso deriva dal timeout. Non generalizzare questa diagnosi ad API che accettano anche un segnale esterno. Non sono implementati retry, autenticazione o cancellazione manuale; per i segnali vedi [[Programmazione/JavaScript/Pagine/AbortController|AbortController]].

## Varianti

- **Funzione `async` dichiarata**: `async function fn()`.
- **Arrow async**: `const fn = async () =>`.
- **Metodo async**: metodo di oggetto o classe.
- **Top-level await**: disponibile nei moduli ES.
- **Sequenziale**: un `await` dipende dal precedente.
- **Concorrente**: piu Promise avviate insieme con `Promise.all`.

## Errori comuni

### Gestione errori
Con `async/await` puoi usare `try/catch` dove hai una politica di recupero o vuoi aggiungere contesto all'errore. Wrapper della funzione `loadUser` precedente:

```js
async function loadProfile(id) {
  try {
    return await loadUser(id);
  } catch (error) {
    throw new Error("Impossibile caricare il profilo", { cause: error });
  }
}
```

Il catch intercetta throw sincroni nel try e rifiuti delle Promise **attese** nel try, non qualunque operazione avviata al suo interno. `cause` conserva il motivo originale; il chiamante di `loadProfile` deve ancora gestire il rifiuto. Un catch che non rilancia e non restituisce dati produce invece un successo con undefined.

### Array e callback async

Non usare `forEach(async ...)` per un flusso che deve attendere tutti i lavori. E `await arrayDiPromise` restituisce l'array, non attende i suoi elementi.

Esempi alternativi e autonomi, con una piccola operazione dimostrativa:

```js
async function double(value) {
  return value * 2;
}

const results = [];
for (const value of [1, 2, 3]) {
  results.push(await double(value));
}
console.log(results); // [2, 4, 6]
```

Variante concorrente:

```js
async function double(value) {
  return value * 2;
}

const results = await Promise.all([1, 2, 3].map((value) => double(value)));
console.log(results); // [2, 4, 6]
```

Con liste grandi usa un limite di concorrenza. Nei listener di eventi una funzione async restituisce una Promise che il DOM non aspetta: gestisci gli errori dentro il listener o con un catch esplicito sulla funzione chiamata. `void operationAsync()` da solo non gestisce i rifiuti.

---
- Usare `await` fuori da una funzione `async` o da un modulo.
- Dimenticare `try/catch` nei punti critici.
- Rendere sequenziali operazioni indipendenti.
- Usare `Array.prototype.forEach` con callback `async` aspettandosi che venga atteso.
- Dimenticare che una funzione `async` restituisce una Promise.
- Usare async per rendere "non bloccante" un calcolo CPU o aspettare un frame con await su un valore gia pronto.
- Eliminare return await dove catch/finally devono attendere il completamento.

---

## Checklist

### Checklist operativa
- Usa `async/await` per flussi leggibili e lineari.
- Usa `Promise.all` quando le operazioni sono indipendenti.
- Gestisci errori con `try/catch`.
- Evita `forEach(async ...)`; usa `for...of` o `Promise.all`.
- Controlla `response.ok` quando usi `fetch`.
- Mantieni le risorse necessarie fino al completamento, inclusa la lettura del corpo.
- Collega la gestione degli errori a tutte le operazioni avviate.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]

## Fonti

- [MDN: async function, esecuzione e concorrenza](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).
- [MDN: await, continuazioni e moduli](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).
- [MDN: try, catch e finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch).
- [MDN: composizione e gestione degli errori](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).
- [MDN: Fetch, parsing e abort](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [MDN: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

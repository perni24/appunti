---
date: 2026-05-04
tags: [javascript, abortcontroller, abortsignal, fetch, async, promises, cleanup]
type: #permanent-note
status: budding
---

# AbortController

`AbortController` e una Web API che permette di annullare operazioni asincrone che supportano un segnale di cancellazione.

Il caso piu comune e interrompere una richiesta `fetch()`, ma lo stesso meccanismo puo essere usato anche con altri task asincroni, listener di eventi e API moderne che accettano un `AbortSignal`.

---

## 1. Problema che risolve

Una Promise in JavaScript non puo essere cancellata direttamente.

```js
const promise = fetch("/api/data");
```

Una volta avviata, questa Promise continuera a rappresentare l'operazione fino al completamento o all'errore.

`AbortController` non cancella la Promise in se, ma invia un segnale all'operazione sottostante.

Se l'operazione supporta quel segnale, puo interrompersi.

---

## 2. Controller e Signal

`AbortController` espone due elementi principali:

- `controller.signal`: il segnale da passare all'operazione asincrona;
- `controller.abort()`: il metodo che invia la richiesta di annullamento.

```js
const controller = new AbortController();

fetch("/api/data", {
  signal: controller.signal,
});

controller.abort();
```

Il controller controlla l'annullamento.

Il signal comunica lo stato di annullamento.

---

## 3. Annullare una richiesta fetch

Esempio base:

```js
const controller = new AbortController();

try {
  const response = await fetch("/api/users", {
    signal: controller.signal,
  });

  const users = await response.json();
  console.log(users);
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Richiesta annullata");
  } else {
    console.error("Errore di rete:", error);
  }
}
```

Quando `controller.abort()` viene chiamato, `fetch()` viene rifiutata con un errore di tipo `AbortError`.

---

## 4. Timeout con AbortController

`AbortController` e spesso usato per evitare richieste troppo lunghe.

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
} catch (error) {
  if (error.name === "AbortError") {
    console.error("La richiesta ha superato il timeout");
  } else {
    console.error(error);
  }
} finally {
  clearTimeout(timeoutId);
}
```

Il blocco `finally` evita che il timer rimanga attivo dopo il completamento della richiesta.

---

## 5. AbortSignal.timeout()

In ambienti moderni si puo creare direttamente un signal che si annulla dopo un certo tempo.

```js
const response = await fetch("/api/data", {
  signal: AbortSignal.timeout(3000),
});
```

Questo codice rende piu semplice il caso del timeout.

Tuttavia, quando serve supportare ambienti meno recenti o gestire piu cause di annullamento, il pattern con `AbortController` manuale rimane utile.

---

## 6. Annullamento manuale da interfaccia

Un caso tipico e annullare una richiesta quando l'utente preme un pulsante.

```js
let controller;

async function loadData() {
  controller = new AbortController();

  try {
    const response = await fetch("/api/report", {
      signal: controller.signal,
    });

    const report = await response.json();
    renderReport(report);
  } catch (error) {
    if (error.name !== "AbortError") {
      showError(error);
    }
  }
}

function cancelLoad() {
  controller?.abort();
}
```

Questo evita di continuare a consumare rete e risorse quando il risultato non serve piu.

---

## 7. Evitare race condition

`AbortController` e utile quando piu richieste possono sovrapporsi.

Esempio: una ricerca lanciata mentre l'utente digita.

```js
let currentController;

async function search(query) {
  currentController?.abort();

  currentController = new AbortController();

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: currentController.signal,
    });

    const results = await response.json();
    renderResults(results);
  } catch (error) {
    if (error.name !== "AbortError") {
      showError(error);
    }
  }
}
```

Prima di avviare la nuova richiesta, la richiesta precedente viene annullata.

Questo riduce il rischio che una risposta vecchia sovrascriva dati piu recenti.

---

## 8. Usare signal con addEventListener()

Alcuni metodi del browser accettano `signal` anche fuori da `fetch()`.

Con `addEventListener()`, il listener viene rimosso automaticamente quando il signal viene annullato.

```js
const controller = new AbortController();

window.addEventListener(
  "resize",
  () => {
    console.log("Resize");
  },
  { signal: controller.signal }
);

controller.abort();
```

Questo pattern e utile per cleanup automatico di listener temporanei.

---

## 9. Creare API cancellabili

Anche funzioni personalizzate possono accettare un `signal`.

```js
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(signal.reason ?? new Error("Operazione annullata"));
    }, { once: true });
  });
}
```

Uso:

```js
const controller = new AbortController();

const promise = wait(5000, controller.signal);

controller.abort(new Error("Timer non piu necessario"));
```

Accettare un `signal` rende una funzione asincrona piu componibile.

---

## 10. signal.aborted e signal.reason

Un `AbortSignal` espone informazioni sul proprio stato.

```js
const controller = new AbortController();

console.log(controller.signal.aborted); // false

controller.abort("Operazione annullata dall'utente");

console.log(controller.signal.aborted); // true
console.log(controller.signal.reason);  // "Operazione annullata dall'utente"
```

`signal.aborted` indica se il signal e gia stato annullato.

`signal.reason` contiene il motivo passato a `abort()`, quando disponibile.

---

## 11. AbortController e Promise.race()

`Promise.race()` puo simulare un timeout, ma non cancella automaticamente l'operazione perdente.

```js
await Promise.race([
  fetch("/api/data"),
  timeout(3000),
]);
```

Se il timeout vince, la richiesta `fetch()` puo comunque continuare.

Con `AbortController`, invece, si puo interrompere davvero l'operazione supportata.

```js
const controller = new AbortController();

setTimeout(() => {
  controller.abort();
}, 3000);

await fetch("/api/data", {
  signal: controller.signal,
});
```

---

## 12. Best practice

- Passa sempre `signal` alle API che supportano cancellazione.
- Gestisci `AbortError` separatamente dagli errori reali.
- Usa `finally` per pulire timer, loader e riferimenti temporanei.
- Annulla richieste obsolete in ricerca, navigazione e componenti UI.
- Non assumere che tutte le Promise siano cancellabili.
- Evita di riusare lo stesso controller per operazioni indipendenti.
- Crea un nuovo `AbortController` per ogni ciclo logico di operazioni.

---

## 13. Errori comuni

- Pensare che `abort()` cancelli qualunque Promise.
- Dimenticare di passare `signal` a `fetch()`.
- Trattare `AbortError` come errore applicativo.
- Non pulire il timeout dopo una richiesta riuscita.
- Riusare un controller gia abortito.
- Usare solo `Promise.race()` per timeout senza annullare la richiesta.

---

## 14. Mappa mentale

```text
AbortController
|
|-- controller
|   |-- abort()
|   |-- crea il signal
|
|-- signal
|   |-- passato a fetch()
|   |-- contiene aborted
|   |-- contiene reason
|
|-- usi principali
|   |-- timeout
|   |-- cancellazione manuale
|   |-- cleanup listener
|   |-- evitare race condition
|
|-- attenzione
|   |-- non cancella Promise generiche
|   |-- serve supporto dell'API usata
```

---

## 15. Collegamenti

- [[Fetch API]]
- [[Promise avanzate]]
- [[Promises]]
- [[Async Await]]
- [[Event Loop]]
- [[Web APIs]]
- [[Memory Leaks]]

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
  - abortcontroller
  - abortsignal
  - fetch
  - async
  - promises
  - cleanup
aliases:
  - AbortController JS
  - AbortSignal
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Promise avanzate]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Memory Leaks]]"
title: AbortController
---

# AbortController

## Sintesi


`AbortController` e una Web API che permette di annullare operazioni asincrone che supportano un segnale di cancellazione.

Il caso piu comune e interrompere una richiesta `fetch()`, ma lo stesso meccanismo puo essere usato anche con altri task asincroni, listener di eventi e API moderne che accettano un `AbortSignal`.

E cancellazione cooperativa: ogni API decide come reagire. Non interrompe codice JavaScript sincrono gia in esecuzione, non annulla effetti completati sul server e non cambia l'esito di una Promise gia settled.

Gli esempi sono indipendenti. Gli URL `/api/...` richiedono un backend dimostrativo; i frammenti con await al livello principale richiedono un modulo. Ogni funzione async va attesa o collegata a un gestore del rifiuto: abortire non elimina l'obbligo di gestire gli errori.

---

## Quando usarlo

Usa `AbortController` quando un'operazione asincrona non e piu utile e vuoi annullarla in modo esplicito.

Casi comuni:

- timeout di richieste `fetch`;
- ricerca mentre l'utente continua a digitare;
- cleanup quando una vista viene smontata;
- cancellazione manuale da UI;
- listener DOM da rimuovere con `signal`;
- prevenzione di race condition tra richieste obsolete e richieste nuove.

## Come funziona

### Problema che risolve
Una Promise in JavaScript non puo essere cancellata direttamente.

```text
const promise = fetch("/api/data");
```

Una volta avviata, questa Promise continuera a rappresentare l'operazione fino al completamento o all'errore.

`AbortController` non cancella la Promise in se, ma invia un segnale all'operazione sottostante.

Se l'operazione supporta quel segnale, puo interrompersi. Il frammento sopra e soltanto uno schema: nel codice reale bisogna osservare la Promise restituita.

---
### Controller e Signal
`AbortController` espone due elementi principali:

- `controller.signal`: il segnale da passare all'operazione asincrona;
- `controller.abort()`: il metodo che invia la richiesta di annullamento.

```js
const controller = new AbortController();

const pending = fetch("/api/data", {
  signal: controller.signal,
});

controller.abort();

try {
  await pending;
} catch (error) {
  if (controller.signal.aborted && error === controller.signal.reason) {
    console.log("Richiesta annullata");
  } else {
    console.error(error);
  }
}
```

Il controller controlla l'annullamento.

Il signal comunica lo stato di annullamento.

Il segnale e monouso: dopo abort resta annullato. Passarlo a una nuova fetch provoca un rifiuto senza riavviare la richiesta. Puoi condividere lo stesso signal fra operazioni dello stesso gruppo; crea controller diversi per cicli indipendenti. Aggiungere un listener dopo l'abort non ripete l'evento gia avvenuto: una API personalizzata deve controllare prima `signal.aborted`.

---
### Annullare una richiesta fetch
Funzione base: il proprietario del controller decide quando chiamare abort, mentre la funzione riceve solo il signal. Il risultato atteso e JSON; lo schema applicativo si valida separatamente.

```js
async function readUsers(signal) {
  const response = await fetch("/api/users", { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

Se fetch e ancora pending, l'abort la fa rifiutare con il motivo del signal. Se fetch ha gia restituito Response, puo fallire invece la lettura del corpo ancora in corso. Non vengono annullati un risultato gia letto o gli effetti di un POST. Un successivo parsing o lavoro CPU sincrono non e interrompibile dal solo segnale.

---
### Timeout con AbortController
`AbortController` e spesso usato per evitare richieste troppo lunghe. Questa funzione accetta millisecondi interi da 0 a 2.147.483.647 e usa un motivo esplicito per distinguere il timeout dall'abort predefinito.

```js
async function readWithTimeout(url, ms = 3000) {
  if (!Number.isInteger(ms) || ms < 0 || ms > 2_147_483_647) {
    throw new RangeError("Timeout non valido");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException("Tempo scaduto", "TimeoutError"));
  }, ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

Il blocco `finally` rimuove il timer su successo, HTTP fallito, parsing fallito o abort. `return await` mantiene il timeout anche durante la lettura del corpo. Il chiamante deve gestire il rifiuto; non tutti gli errori sono timeout. I timer possono essere ritardati: non sono una deadline assoluta e non interrompono il thread occupato.

---
### AbortSignal.timeout()
In ambienti moderni si puo creare direttamente un signal che si annulla dopo un certo tempo.

```js
try {
  const signal = AbortSignal.timeout(3000);
  const response = await fetch("/api/data", { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  console.log(await response.json());
} catch (error) {
  console.error(error?.name === "TimeoutError" ? "Timeout" : "Richiesta fallita", error);
}
```

Questo codice rende piu semplice il timeout. Il motivo predefinito e una DOMException `TimeoutError`, non `AbortError`. Nel browser il conteggio riguarda il tempo attivo: una pagina nella back-forward cache o un worker sospeso possono metterlo in pausa.

Verifica la compatibilita di questa API separatamente da AbortController, per esempio con `typeof AbortSignal.timeout === "function"`. Non esiste un metodo per fermare il suo timer: completare la richiesta prima non lo cancella. Quando vuoi gestire e rimuovere esplicitamente il timeout, usa il pattern manuale precedente.

### Combinare segnali con AbortSignal.any()

`AbortSignal.any()` produce un segnale che assume il primo motivo di annullamento osservato. Non annulla gli altri signal in ingresso. Se piu segnali sono gia annullati, conta il primo nell'iterabile; un iterabile vuoto produce un segnale che non si annulla da solo.

```js
const manual = new AbortController();
const deadline = AbortSignal.timeout(3000);
const signal = AbortSignal.any([manual.signal, deadline]);

try {
  const response = await fetch("/api/report", { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  console.log(await response.json());
} catch (error) {
  if (signal.aborted && error === signal.reason) {
    console.log("Annullamento del segnale:", signal.reason);
  } else {
    console.error("HTTP, rete o parsing:", error);
  }
}
```

Durante l'attesa il proprietario puo chiamare `manual.abort()` da un evento UI; qui non e collegato un pulsante. Il segnale composto conserva il motivo vincente. Controllare soltanto `deadline.aborted` piu tardi puo trarre in inganno, perche il timeout puo scattare anche dopo un abort manuale. Verifica `typeof AbortSignal.any === "function"` sul runtime target e non sostituirlo silenziosamente con una Promise.race che lascia proseguire il lavoro.

---
### Annullamento manuale da interfaccia
Un caso tipico e annullare una richiesta quando l'utente preme un pulsante. Schema applicativo: `renderReport` e `showError` sono callback sincrone della UI; `loadData()` va chiamata con un gestore del rifiuto se queste callback possono fallire.

```js
let activeController;

async function loadData() {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;

  try {
    const response = await fetch("/api/report", {
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const report = await response.json();
    if (activeController === controller && !controller.signal.aborted) {
      renderReport(report);
    }
  } catch (error) {
    if (activeController === controller && !controller.signal.aborted) {
      showError(error);
    }
  } finally {
    if (activeController === controller) activeController = undefined;
  }
}

function cancelLoad() {
  const controller = activeController;
  activeController = undefined;
  controller?.abort();
}
```

Il riferimento locale identifica l'operazione: un vecchio finally non deve cancellare il controller della nuova richiesta. L'annullamento e il controllo di identita impediscono aggiornamenti obsoleti; non e una garanzia che il server smetta di elaborare. Per un report reale aggiungi anche la validazione del suo schema.

---
### Evitare race condition
Una ricerca mentre si digita puo ricevere le risposte fuori ordine. Prima annulla il lavoro precedente, poi verifica l'identita dell'operazione immediatamente prima di aggiornare la UI. L'abort da solo non controlla tutte le continuazioni o le API che ignorano il segnale.

L'esempio pratico sotto usa entrambe le protezioni e tratta una query vuota come annullamento con svuotamento dei risultati. Non e debounce: parte una richiesta per ogni ricerca non vuota. Un debounce puo ridurre il numero di richieste, ma non sostituisce la protezione dai risultati obsoleti.

---
### Usare signal con addEventListener()
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

Non significa che i listener DOM attendano una callback async. I suoi rifiuti devono comunque essere gestiti. Un signal gia abortito impedisce la registrazione del listener.

---
### signal.aborted e signal.reason
Un `AbortSignal` espone informazioni sul proprio stato.

```js
const controller = new AbortController();

console.log(controller.signal.aborted); // false

controller.abort("Operazione annullata dall'utente");

console.log(controller.signal.aborted); // true
console.log(controller.signal.reason);  // "Operazione annullata dall'utente"
```

`signal.aborted` indica se il signal e gia stato annullato.

`signal.reason` e undefined prima dell'abort. Senza un motivo esplicito, abort usa una DOMException con nome `AbortError`; con un motivo esplicito puo contenere qualunque valore, anche null o una stringa. Per le API che progetti, preferisci un Error o DOMException per mantenere contesto diagnostico. La seconda chiamata ad abort non cambia il primo motivo.

`signal.throwIfAborted()` lancia quel motivo se il segnale e annullato; altrimenti non fa nulla. Serve ai confini tra fasi cooperative, non inserisce sospensioni e non interrompe un loop sincrono. Non assumere che ogni rifiuto abbia `.name`, ne che il solo stato aborted dimostri la causa di un errore precedente. Il confronto con reason e utile per API che propagano quel motivo; altre API possono usare errori propri.

---
### AbortController e Promise.race()
`Promise.race()` puo simulare un timeout, ma non cancella automaticamente l'operazione perdente.

Schema concettuale: `timeout()` rappresenta una Promise che rifiuta, non una funzione definita in questa nota.

```text
await Promise.race([
  fetch("/api/data"),
  timeout(3000),
]);
```

Se il timeout vince, la richiesta `fetch()` puo comunque continuare.

Con AbortController puoi chiedere all'API supportata di interrompersi, come in `readWithTimeout()` sopra. Il timeout deve includere anche la lettura del corpo e va rimosso al termine. Vedi [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]] per il confronto con un timeout della sola attesa.

---

## API / Sintassi

### Creare API cancellabili
Anche funzioni personalizzate possono accettare un `signal`. Questa attesa usa un numero intero di millisecondi da 0 a 2.147.483.647 e, se presente, un AbortSignal dello stesso realm. Rimuove il listener anche quando il timer termina normalmente: `{ once: true }` da solo non basta se abort non viene mai chiamato.

```js
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(ms) || ms < 0 || ms > 2_147_483_647) {
      throw new RangeError("Durata non valida");
    }
    if (signal !== undefined && !(signal instanceof AbortSignal)) {
      throw new TypeError("Serve un AbortSignal");
    }
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    function onAbort() {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason);
    }
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
```

Uso:

```js
const controller = new AbortController();

const promise = wait(5000, controller.signal);

controller.abort(new Error("Timer non piu necessario"));
try {
  await promise;
} catch (error) {
  console.log("Attesa terminata con errore:", error);
}
```

Accettare un `signal` rende una funzione asincrona piu componibile.

---

## Esempio pratico

Ricerca cancellabile con criterio "solo l'ultima aggiorna la UI". Contratto: `renderResults` e `showError` sono callback sincrone; l'endpoint restituisce un array di utenti con id positivo sicuro e name non vuoto. Gli errori di una ricerca obsoleta vengono ignorati per la UI, non classificati tutti come abort.

```js
function createUserSearch({ renderResults, showError }) {
  if (typeof renderResults !== "function" || typeof showError !== "function") {
    throw new TypeError("Servono le callback della UI");
  }
  let currentController;

  function cancel() {
    const previous = currentController;
    currentController = undefined;
    previous?.abort();
  }

  async function searchUsers(query) {
    if (typeof query !== "string") throw new TypeError("Query non valida");
    cancel();
    const text = query.trim();
    if (!text) {
      renderResults([]);
      return;
    }
    const controller = new AbortController();
    currentController = controller;
    const isCurrent = () => currentController === controller && !controller.signal.aborted;
    try {
      const params = new URLSearchParams({ q: text });
      const response = await fetch(`/api/users?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const users = await response.json();
      if (!isCurrent()) return;
      if (!Array.isArray(users) || users.some((user) =>
        user === null || typeof user !== "object" || Array.isArray(user) ||
        !Number.isSafeInteger(user.id) || user.id < 1 ||
        typeof user.name !== "string" || !user.name.trim())) {
        throw new TypeError("Elenco utenti non valido");
      }
      renderResults(users.map(({ id, name }) => ({ id, name })));
    } catch (error) {
      if (isCurrent()) showError(error);
    } finally {
      if (currentController === controller) currentController = undefined;
    }
  }
  return { searchUsers, cancel };
}
```

Uso dimostrativo senza dipendenze UI nascoste:

```js
const search = createUserSearch({
  renderResults: (users) => console.log(users),
  showError: (error) => console.error("Ricerca fallita", error),
});
try {
  await search.searchUsers("Ada");
} catch (error) {
  console.error("Input o callback della UI non validi", error);
}
```

In un evento input collega il rifiuto della funzione a un catch: il DOM non attende la Promise. Quando la vista viene smontata chiama `search.cancel()` e rimuovi i listener della vista. Per query vuote non parte alcuna richiesta. Le callback qui sono sincrone: se le trasformi in async devi riprogettare attesa, gestione degli errori e protezione degli aggiornamenti. Il controllo sullo schema presuppone dati provenienti da JSON, non array sparsi creati da codice arbitrario.

## Varianti

### Mappa mentale
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

## Errori comuni


- Pensare che `abort()` cancelli qualunque Promise.
- Dimenticare di passare `signal` a `fetch()`.
- Trattare `AbortError` come errore applicativo.
- Presumere che ogni annullamento abbia nome AbortError, ignorando TimeoutError e motivi personalizzati.
- Lasciare listener su un signal longevo dopo il successo dell'operazione.
- Fidarsi del solo abort per impedire aggiornamenti UI obsoleti.
- Confondere annullamento client con rollback sul server.
- Non pulire il timeout dopo una richiesta riuscita.
- Riusare un controller gia abortito.
- Usare solo `Promise.race()` per timeout senza annullare la richiesta.

---

## Checklist

### Best practice
- Passa sempre `signal` alle API che supportano cancellazione.
- Distingui annullamenti previsti, timeout e guasti senza nascondere errori HTTP o di parsing.
- Usa `finally` per pulire timer, loader e riferimenti temporanei.
- Annulla richieste obsolete in ricerca, navigazione e componenti UI.
- Non assumere che tutte le Promise siano cancellabili.
- Evita di riusare lo stesso controller per operazioni indipendenti.
- Crea un nuovo `AbortController` per ogni ciclo logico di operazioni.
- Controlla i signal gia annullati prima di registrare listener nelle API personalizzate.
- Verifica separatamente il supporto di reason, throwIfAborted, timeout e any nel runtime target.

---

## Collegamenti


- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]


## Fonti

- [MDN - AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [MDN - AbortController.abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)
- [MDN - AbortSignal.throwIfAborted](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted)
- [MDN - AbortSignal.timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
- [MDN - AbortSignal.any](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)
- [WHATWG - Cancellazione cooperativa](https://dom.spec.whatwg.org/#abortsignal)
- [WHATWG - Fetch](https://fetch.spec.whatwg.org/#fetch-method)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

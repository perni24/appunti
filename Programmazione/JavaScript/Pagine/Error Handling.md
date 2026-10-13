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
  - errors
  - exceptions
  - debugging
aliases:
  - Gestione Errori JS
  - Errori JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Testing]]"
title: Error Handling
---

# Error Handling

## Sintesi

La gestione errori serve a distinguere percorso normale, fallimenti previsti e bug.

In JavaScript gli errori si gestiscono con `throw`, `try/catch`, Promise rejection e handler globali.

---

## Quando usarlo

Usa gestione errori esplicita in ogni punto dove un'operazione puo fallire per motivi previsti o esterni.

Casi tipici:

- input non valido;
- richieste HTTP fallite;
- permessi mancanti;
- parsing di dati esterni;
- file o risorse non disponibili;
- operazioni asincrone.

Non catturare errori solo per nasconderli. Se il livello corrente non puo risolvere il problema, lascia propagare l'errore; aggiungi un `catch` solo se devi fare qualcosa di utile, per esempio aggiungere contesto o ripulire risorse.

## Come funziona

### `throw`
Esempio con operandi numerici gia validati:

```js
function divide(a, b) {
  if (b === 0) {
    throw new Error("Divisione per zero");
  }

  return a / b;
}
```

JavaScript permette di lanciare qualsiasi valore, anche `null`. Nel tuo codice preferisci `Error` o una sottoclasse: forniscono un nome, un messaggio e normalmente uno stack utile al debug. Non assumere pero che una libreria esterna rispetti questa convenzione.

---
### `try/catch/finally`
Da eseguire dopo aver definito `divide` nel blocco precedente:

```js
try {
  const result = divide(10, 0);
  console.log(result);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
} finally {
  console.log("cleanup");
}
```

`catch` intercetta un'eccezione lanciata durante l'esecuzione del `try`, anche dentro funzioni chiamate da esso. Il codice nel `try` dopo l'istruzione fallita viene saltato.

`finally` viene eseguito quando si esce dal costrutto, anche per un `return` o un errore non gestito. Evita `return` e nuovi errori nel cleanup: possono sostituire il risultato o l'errore originale. Non e una garanzia contro la terminazione forzata del processo.

```js
function maskedError() {
  try {
    throw new Error("Operazione fallita");
  } finally {
    return "OK"; // Errore intenzionale: nasconde il fallimento
  }
}

console.log(maskedError()); // OK, nessuna eccezione raggiunge il chiamante
```

### Errori custom

Una classe specifica permette al chiamante di distinguere un errore applicativo senza confrontarne il testo:

```js
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}
```

### Conservare la causa

Se aggiungi contesto, conserva l'errore originale in `cause`:

```js
function readSettings(source) {
  try {
    return JSON.parse(source);
  } catch (cause) {
    throw new Error("Configurazione JSON non leggibile", { cause });
  }
}
```

Il chiamante riceve un messaggio applicativo e puo ispezionare `error.cause` per la causa originale. `JSON.parse()` controlla la sintassi JSON, non lo schema: anche `null` e `42` sono JSON validi.

`Error` con l'opzione `cause` richiede un runtime che la supporti (ECMAScript 2022). Un errore di sintassi del file JavaScript stesso, invece, impedisce l'avvio del file: un `try` in quel file non puo intercettarlo.

---

## API / Sintassi

Sintassi principali. Nei seguenti schemi `doWork`, `loadData`, `renderData`, `handleError` e `cleanup` rappresentano funzioni da fornire nell'applicazione:

```js
throw new Error("Messaggio");
```

```js
try {
  doWork();
} catch (error) {
  handleError(error);
} finally {
  cleanup();
}
```

Con Promise:

```js
loadData()
  .then(renderData)
  .catch(handleError);
```

Con `async/await`, dentro una funzione `async` o al livello principale di un modulo ES:

```js
try {
  const data = await loadData();
  renderData(data);
} catch (error) {
  handleError(error);
}
```

## Esempio pratico

Gestione distinta tra utente assente, errore HTTP, errore di rete e JSON non leggibile. Esempio per browser con un backend che espone `/api/users/`: non funziona su un sito statico privo di questa API. In Node.js serve un URL assoluto.

```js
async function loadUser(id, { signal } = {}) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new TypeError("Serve un identificativo utente non vuoto");
  }

  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, { signal });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

Qui il contratto dell'API considera `404` un utente assente e gli altri successi risposte JSON; un `204` senza corpo richiederebbe un ramo apposito. I dati decodificati devono ancora essere validati prima dell'uso.

`fetch()` non rigetta solo perche riceve `404` o `500`: occorre verificare lo stato. Errori di rete, annullamento e parsing possono invece rigettare. `return response.json()` propaga anche il rifiuto del parsing al chiamante.

`signal` permette al chiamante di annullare la richiesta; l'esempio non imposta un timeout applicativo. I retry richiedono una politica esplicita, considerando tipo di errore e possibili effetti duplicati, non un tentativo automatico dopo qualsiasi eccezione.

## Varianti

- **Errori di validazione**: input non conforme.
- **Errori di rete**: timeout, offline, CORS, DNS.
- **Errori HTTP**: risposta ricevuta, per esempio con stato `4xx` o `5xx`; `response.ok` indica l'intervallo `200-299`.
- **Errori di programmazione**: bug, stato impossibile, `TypeError`.
- **Errori custom**: classi derivate da `Error` per distinguere casi applicativi.

## Errori comuni

### Errori asincroni
Un `try/catch` non osserva automaticamente una Promise lasciata senza `await`, ne gli errori di una callback eseguita piu tardi, per esempio da `setTimeout()`. Attendi la Promise o restituiscila a un chiamante che ne gestisce il rifiuto.

Esempio autonomo, senza richieste di rete:

```js
async function runOperation(operation) {
  try {
    return await operation();
  } catch (error) {
    throw new Error("Operazione asincrona fallita", { cause: error });
  }
}

runOperation(async () => {
  throw new Error("Servizio non disponibile");
}).catch(error => console.error(error.message));
```

Qui `return await` e intenzionale: senza `await`, questo `catch` non intercetterebbe un rifiuto asincrono. La Promise sarebbe comunque propagata, ma senza il nuovo contesto.

Con la funzione `loadUser` definita sopra, il chiamante puo usare `.catch()`:

```js
loadUser("42").catch((error) => {
  console.error(error);
});
```

---
### Rilanciare errori
Gestisci solo errori che puoi davvero trattare. Schema da usare in una funzione `async`, con `saveUser`, `user` e `logError` forniti dall'applicazione:

```js
try {
  await saveUser(user);
} catch (error) {
  logError(error);
  throw error;
}
```

Nascondere errori rende il debug piu difficile.

---
- Fare `catch` vuoti.
- Lanciare stringhe invece di `Error`.
- Trattare abort, validazione e bug nello stesso modo.
- Dimenticare `.catch()` su Promise.
- Mostrare dettagli tecnici all'utente finale.
- Confondere JSON valido con dati conformi allo schema applicativo.
- Usare `return` in `finally`, perdendo l'errore originale.

---

## Checklist

### Checklist operativa
- Usa `Error` o classi derivate.
- Logga contesto utile senza segreti.
- Gestisci separatamente errori attesi e bug.
- Rilancia se il livello corrente non puo risolvere.
- Aggiungi test per percorsi di errore critici.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]

## Fonti

- [MDN: try, catch e finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch).
- [MDN: Error e sottoclassi](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error).
- [MDN: Error.cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause).
- [MDN: gestione delle risposte con Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [MDN: controllo di flusso ed errori](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

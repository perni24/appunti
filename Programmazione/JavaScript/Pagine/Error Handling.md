---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, errors, exceptions, debugging]
aliases: [Gestione Errori JS, Errori JavaScript]
prerequisites: [Funzioni, Async Await]
related: [Promises, Async Await, Fetch API, Testing]
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

Non catturare errori solo per nasconderli. Se il livello corrente non puo risolvere il problema, aggiungi contesto e rilancia.

## Come funziona

### `throw`
```js
function divide(a, b) {
  if (b === 0) {
    throw new Error("Divisione per zero");
  }

  return a / b;
}
```

Lancia oggetti `Error`, non stringhe.

---
### `try/catch/finally`
```js
try {
  const result = divide(10, 0);
  console.log(result);
} catch (error) {
  console.error(error.message);
} finally {
  console.log("cleanup");
}
```

`finally` viene eseguito sia in caso di successo sia in caso di errore.

---

## API / Sintassi

Sintassi principali:

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

Con `async/await`:

```js
try {
  const data = await loadData();
  renderData(data);
} catch (error) {
  handleError(error);
}
```

## Esempio pratico

Gestione distinta tra errore previsto e errore inatteso:

```js
async function loadUser(id) {
  const response = await fetch(`/api/users/${id}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

Un `404` puo essere un caso gestibile. Un `500` o una risposta inattesa va propagata per log, retry o messaggio di errore.

## Varianti

- **Errori di validazione**: input non conforme.
- **Errori di rete**: timeout, offline, CORS, DNS.
- **Errori HTTP**: risposta ricevuta ma con status non positivo.
- **Errori di programmazione**: bug, stato impossibile, `TypeError`.
- **Errori custom**: classi derivate da `Error` per distinguere casi applicativi.

## Errori comuni

### Errori custom
```js
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}
```

Errori specifici aiutano a decidere come reagire.

---
### Errori asincroni
Con `async/await`, usa `try/catch`.

```js
try {
  const response = await fetch("/api/users");

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
} catch (error) {
  console.error(error);
}
```

Con Promise, usa `.catch()`.

```js
loadUser().catch((error) => {
  console.error(error);
});
```

---
### Rilanciare errori
Gestisci solo errori che puoi davvero trattare.

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

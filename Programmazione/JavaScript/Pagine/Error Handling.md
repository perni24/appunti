---
date: 2026-05-13
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

## `throw`

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

## `try/catch/finally`

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

## Errori custom

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

## Errori asincroni

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

## Rilanciare errori

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

## Errori comuni

- Fare `catch` vuoti.
- Lanciare stringhe invece di `Error`.
- Trattare abort, validazione e bug nello stesso modo.
- Dimenticare `.catch()` su Promise.
- Mostrare dettagli tecnici all'utente finale.

---

## Checklist operativa

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

---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, promises, async, error-handling]
aliases: [Promise JS]
prerequisites: [Callback, Event Loop]
related: [Async Await, Promise avanzate, Fetch API, Error Handling]
---

# Promises

## Sintesi

Una Promise rappresenta il risultato futuro di un'operazione asincrona.

Puo terminare con successo, producendo un valore, oppure fallire, producendo un errore.

---

## Stati

Una Promise puo trovarsi in tre stati:

- pending: operazione ancora in corso;
- fulfilled: operazione completata con successo;
- rejected: operazione fallita.

Una volta fulfilled o rejected, la Promise e settled e non cambia piu stato.

---

## Creare una Promise

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

---

## Consumare una Promise

```js
fetch("/api/users")
  .then((response) => response.json())
  .then((users) => {
    console.log(users);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    console.log("richiesta terminata");
  });
```

Metodi principali:

- `.then()` gestisce il successo;
- `.catch()` gestisce il fallimento;
- `.finally()` viene eseguito in entrambi i casi.

---

## Chaining

Ogni `.then()` restituisce una nuova Promise.

```js
loadUser(1)
  .then((user) => loadPosts(user.id))
  .then((posts) => loadComments(posts[0].id))
  .then((comments) => render(comments))
  .catch((error) => showError(error));
```

Un errore in qualunque punto della catena passa al primo `.catch()` disponibile.

---

## Return dentro then

Il valore restituito da un `.then()` diventa il valore ricevuto dal `.then()` successivo.

```js
Promise.resolve(2)
  .then((value) => value * 2)
  .then((value) => {
    console.log(value); // 4
  });
```

Se restituisci una Promise, la catena aspetta che venga risolta.

```js
fetch("/api/users")
  .then((response) => response.json())
  .then((users) => console.log(users));
```

---

## Error handling

Lanciare un errore dentro `.then()` rifiuta la Promise successiva.

```js
fetch("/api/users")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  })
  .catch((error) => {
    console.error(error);
  });
```

---

## Promise e microtask

I callback di `.then()` e `.catch()` vengono eseguiti come microtask.

```js
console.log("A");

Promise.resolve().then(() => {
  console.log("B");
});

console.log("C");

// A
// C
// B
```

---

## Errori comuni

- Dimenticare `return` dentro una catena.
- Non gestire `.catch()`.
- Pensare che una Promise possa essere cancellata direttamente.
- Usare `new Promise` quando esiste gia un'API Promise-based.
- Confondere Promise concorrenti e codice parallelo CPU.

---

## Checklist operativa

- Gestisci sempre il percorso di errore.
- Usa `async/await` quando rende il flusso piu leggibile.
- Usa `Promise.all` per operazioni indipendenti necessarie.
- Usa `AbortController` per cancellare operazioni che lo supportano.
- Evita catene troppo lunghe se diventano meno leggibili.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]

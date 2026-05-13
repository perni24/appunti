---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, closures, scope, functions]
aliases: [Closure JS, Chiusure JavaScript]
prerequisites: [Scope, Funzioni]
related: [Scope, Callback, Memory Leaks, Private Fields e Static Blocks]
---

# Closures

## Sintesi

Una closure e una funzione che mantiene accesso allo scope lessicale in cui e stata creata, anche dopo che quello scope ha terminato la sua esecuzione.

In pratica: una funzione puo ricordare variabili esterne.

---

## Esempio base

```js
function createMessage(name) {
  const prefix = "Ciao";

  return function printMessage() {
    console.log(`${prefix}, ${name}`);
  };
}

const message = createMessage("Luca");

message(); // "Ciao, Luca"
```

`printMessage` continua ad accedere a `prefix` e `name` anche dopo la fine di `createMessage`.

---

## Come funziona

Quando una funzione viene creata, JavaScript conserva un riferimento al suo ambiente lessicale.

La closure non copia semplicemente i valori: mantiene accesso alle variabili dello scope esterno.

```js
function createCounter() {
  let count = 0;

  return function increment() {
    count += 1;
    return count;
  };
}

const counter = createCounter();

console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

`count` resta privata rispetto al codice esterno, ma resta modificabile dalla funzione `increment`.

---

## Stato privato

Le closures sono spesso usate per incapsulare stato.

```js
function createUserSession(userId) {
  let token = null;

  return {
    login(newToken) {
      token = newToken;
    },
    getAuthHeader() {
      return `Bearer ${token}`;
    },
    getUserId() {
      return userId;
    },
  };
}

const session = createUserSession(42);

session.login("abc123");
console.log(session.getAuthHeader()); // "Bearer abc123"
```

Il codice esterno non puo leggere direttamente `token`.

---

## Function factory

Una function factory crea funzioni specializzate partendo da una configurazione.

```js
function createFormatter(locale, currency) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });

  return function formatPrice(value) {
    return formatter.format(value);
  };
}

const formatEuro = createFormatter("it-IT", "EUR");

console.log(formatEuro(19.99)); // "19,99 EUR"
```

La funzione restituita riusa la configurazione senza doverla ricevere a ogni chiamata.

---

## Closures nei callback

I callback mantengono accesso alle variabili esterne.

```js
function delayLog(message) {
  setTimeout(() => {
    console.log(message);
  }, 1000);
}

delayLog("Operazione completata");
```

Il callback passato a `setTimeout` puo leggere `message` anche quando `delayLog` ha gia terminato.

---

## Loop e closure

Con `var`, tutte le funzioni condividono la stessa variabile del ciclo.

```js
for (var i = 0; i < 3; i += 1) {
  setTimeout(() => {
    console.log(i);
  }, 0);
}

// 3
// 3
// 3
```

Con `let`, ogni iterazione crea un binding separato.

```js
for (let i = 0; i < 3; i += 1) {
  setTimeout(() => {
    console.log(i);
  }, 0);
}

// 0
// 1
// 2
```

---

## Memoria

Una closure mantiene vivi gli oggetti a cui fa riferimento.

```js
function createHandler(largeData) {
  return function handleClick() {
    console.log(largeData.id);
  };
}
```

Se `handleClick` resta registrata come event listener, anche `largeData` puo restare in memoria.

Per evitare leak:

- rimuovi listener non piu necessari;
- evita di chiudere su oggetti grandi se non servono;
- annulla timer, subscription e richieste quando non servono piu.

---

## Errori comuni

- Pensare che una closure copi i valori invece di mantenere riferimenti.
- Creare closures dentro loop con `var`.
- Tenere in memoria oggetti grandi tramite callback non rimossi.
- Usare closures dove una classe o un modulo sarebbero piu leggibili.
- Nascondere troppo stato rendendo difficile il debug.

---

## Checklist operativa

- Usa closures per factory, callback e stato privato semplice.
- Preferisci `let` e `const` nei loop.
- Rimuovi listener e timer quando non servono.
- Mantieni esplicite le dipendenze chiuse dalla funzione.
- Se lo stato cresce molto, valuta classi, moduli o strutture dati dedicate.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Private Fields e Static Blocks]]

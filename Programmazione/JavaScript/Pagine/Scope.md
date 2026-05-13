---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, scope, lexical-scope, variables]
aliases: [Scope JS, Ambito JavaScript]
prerequisites: [Variabili]
related: [Hoisting, Closures, Moduli, Strict Mode]
---

# Scope

## Sintesi

Lo scope definisce dove una variabile, una funzione o una classe e visibile e accessibile.

In JavaScript lo scope e principalmente lessicale: dipende da dove il codice e scritto, non da dove viene chiamato.

---

## Perche conta

Capire lo scope serve per:

- evitare variabili globali accidentali;
- leggere correttamente funzioni annidate e closures;
- capire `ReferenceError`;
- capire perche una variabile interna nasconde una variabile esterna;
- organizzare meglio moduli e funzioni.

---

## Scope globale

Una variabile dichiarata nello scope globale e accessibile da tutto il codice caricato nello stesso contesto.

```js
const appName = "Dashboard";

function printName() {
  console.log(appName);
}

printName(); // "Dashboard"
```

Nel browser l'oggetto globale e `window`. In ambienti moderni si puo usare `globalThis`.

```js
console.log(globalThis);
```

Nota importante: in uno script classico, `var` globale puo diventare una proprieta di `window`; `let` e `const` globali no.

```js
var legacyValue = 1;
let modernValue = 2;

console.log(window.legacyValue); // 1
console.log(window.modernValue); // undefined
```

---

## Scope di funzione

Ogni funzione crea un nuovo scope.

```js
function createUser() {
  const name = "Luca";
  return name;
}

console.log(createUser()); // "Luca"
console.log(name); // ReferenceError
```

Le variabili dichiarate dentro una funzione non sono accessibili dall'esterno.

---

## `var` e scope di funzione

`var` non rispetta lo scope di blocco: viene limitato alla funzione piu vicina.

```js
function example() {
  if (true) {
    var value = 10;
  }

  console.log(value); // 10
}
```

Per codice moderno, preferire `let` e `const`.

---

## Scope di blocco

`let` e `const` sono limitati al blocco in cui vengono dichiarati.

```js
if (true) {
  const role = "admin";
  let isActive = true;
}

console.log(role); // ReferenceError
console.log(isActive); // ReferenceError
```

Un blocco e una coppia di parentesi graffe `{}`: `if`, `for`, `while`, `try`, funzioni e blocchi espliciti.

---

## Scope di modulo

Ogni modulo ES ha il proprio scope top-level.

```js
// config.js
const apiUrl = "https://api.example.com";

export function getApiUrl() {
  return apiUrl;
}
```

`apiUrl` non diventa globale. E disponibile solo dentro il modulo, salvo esportazione.

I moduli ES sono anche eseguiti in strict mode automaticamente.

---

## Scope lessicale

Una funzione puo leggere le variabili definite nello scope in cui e stata creata.

```js
function createGreeter(name) {
  return function greet() {
    console.log(`Ciao ${name}`);
  };
}

const greetLuca = createGreeter("Luca");
greetLuca(); // "Ciao Luca"
```

La funzione `greet` mantiene accesso a `name` perche e stata definita dentro `createGreeter`.

---

## Scope chain

Quando JavaScript cerca un identificatore, procede dall'interno verso l'esterno:

- scope locale;
- scope della funzione esterna;
- scope di modulo o globale;
- errore se il nome non esiste.

```js
const value = "globale";

function outer() {
  const value = "outer";

  function inner() {
    console.log(value);
  }

  inner();
}

outer(); // "outer"
```

---

## Shadowing

Lo shadowing avviene quando una variabile interna ha lo stesso nome di una variabile esterna.

```js
const status = "global";

function update() {
  const status = "local";
  console.log(status);
}

update(); // "local"
console.log(status); // "global"
```

Lo shadowing non e sempre un errore, ma puo rendere il codice meno leggibile se abusato.

---

## Errori comuni

- Usare `var` pensando che sia limitato al blocco.
- Dichiarare variabili globali non necessarie.
- Confondere scope e `this`.
- Riutilizzare lo stesso nome in troppi scope annidati.
- Leggere una variabile fuori dal blocco in cui e dichiarata.

---

## Checklist operativa

- Usa `const` di default.
- Usa `let` solo quando il valore deve cambiare.
- Evita `var` nel codice moderno.
- Mantieni gli scope piccoli.
- Evita funzioni troppo annidate.
- Esporta dai moduli solo cio che serve davvero.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Hoisting|Hoisting]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Strict Mode|Strict Mode]]

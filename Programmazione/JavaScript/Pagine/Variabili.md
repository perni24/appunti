---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
difficulty: beginner
tags:
  - javascript
  - basics
  - variables
aliases:
  - Variabili JS
  - let const var
prerequisites: []
related:
  - Tipi di Dati
  - Scope
  - Hoisting
---

# Variabili

## Sintesi

Le variabili permettono di associare un nome a un valore.

In JavaScript si dichiarano principalmente con `const` e `let`. `var` esiste ancora per compatibilita con codice vecchio, ma nella maggior parte del codice moderno va evitato.

La scelta tra `const`, `let` e `var` influenza scope, riassegnazione e comportamento con l'hoisting.

---

## Quando usarle

- Usa `const` quando il binding non deve essere riassegnato.
- Usa `let` quando il valore deve cambiare nel tempo.
- Evita `var` nel codice nuovo.
- Usa nomi descrittivi per rendere chiaro cosa contiene una variabile.

---

## Tipizzazione dinamica

JavaScript e un linguaggio a tipizzazione dinamica: il tipo appartiene al valore, non alla variabile.

```js
let output = 42;
output = "Ciao";
output = true;
```

La stessa variabile puo contenere valori di tipo diverso, anche se abusare di questa possibilita rende il codice meno leggibile.

---

## const

`const` crea un binding non riassegnabile.

```js
const name = "Luca";

// name = "Marco"; // TypeError
```

`const` non rende immutabile il valore interno di un oggetto.

```js
const user = {
  name: "Luca",
};

user.name = "Marco"; // Valido

// user = {}; // TypeError
```

> [!INFO]
> `const` blocca la riassegnazione della variabile, non la mutazione dell'oggetto referenziato.

---

## let

`let` crea una variabile riassegnabile con scope di blocco.

```js
let counter = 0;

counter += 1;
counter += 1;

console.log(counter); // 2
```

E utile per contatori, accumulatori, variabili aggiornate in un algoritmo o stato temporaneo.

---

## var

`var` ha scope di funzione, non scope di blocco.

```js
function example() {
  if (true) {
    var value = 10;
  }

  console.log(value); // 10
}
```

Con `let` o `const`, lo stesso codice non funzionerebbe perche la variabile resterebbe confinata nel blocco `if`.

```js
function example() {
  if (true) {
    let value = 10;
  }

  // console.log(value); // ReferenceError
}
```

---

## Scope

Lo scope definisce dove una variabile e visibile.

```js
const globalValue = "globale";

function run() {
  const localValue = "locale";

  console.log(globalValue);
  console.log(localValue);
}

run();

// console.log(localValue); // ReferenceError
```

`let` e `const` sono block-scoped.

```js
if (true) {
  const message = "Dentro il blocco";
}

// console.log(message); // ReferenceError
```

---

## Hoisting e Temporal Dead Zone

Le dichiarazioni vengono gestite durante la fase di creazione dello scope.

Con `var`, la variabile viene inizializzata a `undefined`.

```js
console.log(count); // undefined
var count = 1;
```

Con `let` e `const`, la variabile esiste nello scope ma non puo essere usata prima della dichiarazione. Questo intervallo si chiama **Temporal Dead Zone**.

```js
// console.log(count); // ReferenceError
let count = 1;
```

---

## Tabella comparativa

| Keyword | Scope | Riassegnabile | Riedichiarabile | Uso consigliato |
| --- | --- | --- | --- | --- |
| `const` | Blocco | No | No | Default nel codice moderno |
| `let` | Blocco | Si | No | Valori che cambiano |
| `var` | Funzione | Si | Si | Solo codice legacy |

---

## Errori comuni

- Usare `var` in codice nuovo senza motivo.
- Pensare che `const` renda immutabili gli oggetti.
- Dichiarare variabili troppo lontano dal punto in cui vengono usate.
- Usare nomi generici come `data`, `value`, `temp` senza contesto.
- Riassegnare la stessa variabile a tipi diversi senza necessita.

---

## Checklist

- La variabile puo essere `const`?
- Il nome descrive chiaramente il valore?
- La variabile e dichiarata nello scope piu piccolo possibile?
- Sto evitando `var`?
- Sto distinguendo riassegnazione e mutazione?

---

## Collegamenti

- [[Tipi di Dati]]
- [[Scope]]
- [[Hoisting]]
- [[Strict Mode]]
- [[Immutabilita e Copia degli Oggetti]]

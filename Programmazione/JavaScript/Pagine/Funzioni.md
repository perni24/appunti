---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, basics, functions, parameters, return]
aliases: [Funzioni JS]
prerequisites: [Variabili]
related: [Arrow Functions, Closures, Scope]
---

# Funzioni

## Sintesi

Le funzioni sono blocchi di codice riutilizzabili.

In JavaScript le funzioni sono valori: possono essere assegnate a variabili, passate come argomenti e restituite da altre funzioni.

---

## Function declaration

Una function declaration definisce una funzione con nome.

```js
function greet(name) {
  return `Ciao ${name}`;
}

console.log(greet("Luca"));
```

Le function declaration sono soggette a hoisting: possono essere chiamate prima della dichiarazione.

```js
console.log(sum(2, 3)); // 5

function sum(a, b) {
  return a + b;
}
```

---

## Function expression

Una function expression assegna una funzione a una variabile.

```js
const greet = function (name) {
  return `Ciao ${name}`;
};
```

In questo caso, la variabile segue le regole di `const` o `let`.

```js
// greet("Luca"); // ReferenceError

const greet = function (name) {
  return `Ciao ${name}`;
};
```

---

## Arrow function

Le arrow function sono una sintassi compatta.

```js
const sum = (a, b) => {
  return a + b;
};
```

Con un solo return, si puo usare il return implicito.

```js
const sum = (a, b) => a + b;
```

Le arrow function non hanno un proprio `this`.

Per dettagli, vedi [[Arrow Functions]] e [[Context]].

---

## Parametri e argomenti

I parametri sono i nomi nella definizione.

Gli argomenti sono i valori passati alla chiamata.

```js
function multiply(a, b) {
  return a * b;
}

multiply(2, 3);
```

In questo esempio:

- `a` e `b` sono parametri;
- `2` e `3` sono argomenti.

---

## Parametri di default

```js
function greet(name = "Guest") {
  return `Ciao ${name}`;
}

console.log(greet());       // "Ciao Guest"
console.log(greet("Luca")); // "Ciao Luca"
```

I parametri di default evitano controlli manuali semplici.

---

## Rest parameters

`...` raccoglie piu argomenti in un array.

```js
function sumAll(...numbers) {
  return numbers.reduce((total, number) => total + number, 0);
}

console.log(sumAll(1, 2, 3)); // 6
```

---

## return

`return` termina la funzione e restituisce un valore.

```js
function getArea(size) {
  if (size <= 0) {
    return 0;
  }

  return size * size;
}
```

Se manca `return`, la funzione restituisce `undefined`.

```js
function logMessage(message) {
  console.log(message);
}

console.log(logMessage("test")); // undefined
```

---

## Funzioni come valori

Le funzioni possono essere passate ad altre funzioni.

```js
function run(callback) {
  callback();
}

run(() => {
  console.log("Eseguito");
});
```

Questo e alla base di callback, event listener e molte API JavaScript.

---

## Pure function

Una funzione pura restituisce lo stesso risultato con gli stessi input e non modifica stato esterno.

```js
function add(a, b) {
  return a + b;
}
```

Esempio non puro:

```js
let total = 0;

function addToTotal(value) {
  total += value;
}
```

Le funzioni pure sono piu facili da testare e ragionare.

---

## Errori comuni

- Dimenticare `return`.
- Confondere parametri e argomenti.
- Usare arrow function quando serve un `this` dinamico.
- Creare funzioni troppo lunghe con troppe responsabilita.
- Dipendere da stato globale senza necessita.

---

## Checklist

- La funzione ha un nome chiaro?
- Fa una sola cosa principale?
- I parametri sono pochi e comprensibili?
- Restituisce esplicitamente cio che serve?
- Potrebbe essere una funzione pura?

---

## Collegamenti

- [[Arrow Functions]]
- [[Closures]]
- [[Scope]]
- [[Context]]
- [[Callback]]
- [[Functional Programming]]

---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, es6, destructuring, objects, arrays]
aliases: [Destrutturazione, Destructuring assignment]
prerequisites: [Array Methods, Oggetti Avanzati]
related: [Spread & Rest Operators, Funzioni]
---

# Destructuring

## Sintesi

Il destructuring permette di estrarre valori da array e oggetti assegnandoli a variabili in modo compatto.

Riduce codice ripetitivo e rende espliciti i dati usati da una funzione o da un blocco.

---

## Destructuring degli array

L'estrazione dagli array avviene per posizione.

```js
const colors = ["red", "green", "blue"];

const [first, second] = colors;

console.log(first);  // "red"
console.log(second); // "green"
```

---

## Saltare elementi

```js
const values = ["A", "B", "C"];

const [first, , third] = values;

console.log(first); // "A"
console.log(third); // "C"
```

Usalo con moderazione: troppi salti riducono la leggibilita.

---

## Valori di default

```js
const [name = "Guest"] = [];

console.log(name); // "Guest"
```

Il default viene usato solo se il valore e `undefined`.

---

## Rest negli array

```js
const [head, ...tail] = [1, 2, 3, 4];

console.log(head); // 1
console.log(tail); // [2, 3, 4]
```

Il rest deve essere l'ultimo elemento.

---

## Destructuring degli oggetti

L'estrazione dagli oggetti avviene per nome della proprieta.

```js
const user = {
  name: "Luca",
  role: "admin",
};

const { name, role } = user;

console.log(name);
console.log(role);
```

L'ordine non conta.

---

## Rinomina

Puoi estrarre una proprieta usando un nome diverso.

```js
const user = {
  name: "Luca",
};

const { name: userName } = user;

console.log(userName); // "Luca"
```

---

## Default negli oggetti

```js
const user = {
  name: "Luca",
};

const { role = "reader" } = user;

console.log(role); // "reader"
```

---

## Destructuring nidificato

```js
const response = {
  data: {
    user: {
      name: "Luca",
    },
  },
};

const {
  data: {
    user: { name },
  },
} = response;

console.log(name);
```

Attenzione: se una proprieta intermedia e `undefined`, il destructuring puo generare errore.

---

## Parametri di funzione

Molto utile quando una funzione riceve un oggetto di opzioni.

```js
function createUser({ name, role = "reader" }) {
  return {
    name,
    role,
  };
}

createUser({ name: "Luca" });
```

Per evitare errori se non viene passato nulla:

```js
function createUser({ name = "Guest" } = {}) {
  return { name };
}
```

---

## Errori comuni

- Destrutturare da `undefined` o `null`.
- Usare destructuring troppo annidato.
- Confondere posizione negli array e chiave negli oggetti.
- Dimenticare che i default valgono solo per `undefined`, non per `null`.
- Rendere la firma di una funzione difficile da leggere.

---

## Checklist

- Sto destrutturando un array o un oggetto?
- La struttura puo essere `undefined`?
- Serve un valore di default?
- La destrutturazione e ancora leggibile?
- Nei parametri, serve `= {}` come default?

---

## Collegamenti

- [[Spread & Rest Operators]]
- [[Funzioni]]
- [[Array Methods]]
- [[Oggetti Avanzati]]
- [[Default Parameters]]

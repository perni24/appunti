---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, es6, arrow-functions, functions, this]
aliases: [Funzioni freccia, Arrow function]
prerequisites: [Funzioni, Context]
related: [Funzioni, Context, Callback]
---

# Arrow Functions

## Sintesi

Le arrow functions sono una sintassi compatta per definire funzioni.

Non sono solo una forma piu breve di `function`: non hanno un proprio `this`, non hanno `arguments` e non possono essere usate come costruttori.

---

## Sintassi base

```js
const sum = (a, b) => {
  return a + b;
};
```

Con return implicito:

```js
const sum = (a, b) => a + b;
```

Con un solo parametro, le parentesi sono opzionali.

```js
const square = value => value * value;
```

Senza parametri, le parentesi sono obbligatorie.

```js
const getRandom = () => Math.random();
```

---

## Restituire oggetti

Per restituire un oggetto con return implicito, usa parentesi tonde.

```js
const createUser = name => ({
  name,
  active: true,
});
```

Senza parentesi, le graffe vengono interpretate come corpo della funzione.

---

## Lexical this

Le arrow functions non creano un proprio `this`.

Usano il `this` dello scope esterno.

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds += 1;
      console.log(this.seconds);
    }, 1000);
  },
};
```

Qui `this` dentro la arrow function resta quello del metodo `start()`.

---

## Quando usarle

Sono adatte per:

- callback brevi;
- funzioni passate a `map()`, `filter()`, `reduce()`;
- handler dove vuoi preservare il `this` esterno;
- funzioni pure brevi;
- trasformazioni dichiarative.

```js
const numbers = [1, 2, 3];

const doubled = numbers.map(number => number * 2);
```

---

## Quando evitarle

Evita arrow functions quando serve un `this` dinamico.

```js
const user = {
  name: "Luca",
  greet: () => {
    console.log(this.name);
  },
};

user.greet(); // Probabilmente undefined
```

Meglio:

```js
const user = {
  name: "Luca",
  greet() {
    console.log(this.name);
  },
};
```

---

## arguments

Le arrow functions non hanno un proprio oggetto `arguments`.

Usa rest parameters.

```js
const sumAll = (...numbers) => {
  return numbers.reduce((total, number) => total + number, 0);
};
```

---

## Non sono costruttori

Le arrow functions non possono essere usate con `new`.

```js
const User = name => {
  this.name = name;
};

// new User("Luca"); // TypeError
```

Per oggetti istanziabili usa `class` o funzioni costruttrici tradizionali.

---

## Errori comuni

- Usare arrow function come metodo di oggetto quando serve `this`.
- Dimenticare le parentesi quando si restituisce un oggetto.
- Cercare di usare `arguments`.
- Usarle come costruttori.
- Rendere poco leggibile una funzione complessa pur di scriverla in una riga.

---

## Checklist

- Mi serve un `this` dinamico? Se si, evita arrow function.
- La funzione e una callback breve?
- Sto restituendo un oggetto? Ho usato `({ ... })`?
- Mi serve `arguments`? Usa `...args`.
- La versione compatta resta leggibile?

---

## Collegamenti

- [[Funzioni]]
- [[Context]]
- [[Callback]]
- [[Array Methods]]
- [[Spread & Rest Operators]]

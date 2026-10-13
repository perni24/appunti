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
  - es6
  - arrow-functions
  - functions
  - this
aliases:
  - Funzioni freccia
  - Arrow function
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Context]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Context]]"
  - "[[Programmazione/JavaScript/Pagine/Callback]]"
title: Arrow Functions
---

# Arrow Functions

## Sintesi

Le arrow functions sono una sintassi compatta per definire funzioni.

Non sono solo una forma piu breve di `function`: non hanno un proprio `this` o `arguments` e non possono essere usate come costruttori.

---

## Quando usarlo

### Quando usarle
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
### Quando evitarle
Evita arrow functions quando serve un `this` dinamico.

```js
const user = {
  name: "Luca",
  greet: () => {
    console.log(this.name);
  },
};

user.greet(); // Non usa user come this: esempio da NON usare
```

Il risultato dipende dal contesto esterno. Al livello principale di un modulo ES, `this` e `undefined` e leggere `this.name` genera `TypeError`. In uno script classico del browser, invece, puo leggere `window.name`: non e il nome di `user`.

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

## Come funziona

### Restituire oggetti
Per restituire un oggetto con return implicito, usa parentesi tonde.

```js
const createUser = name => ({
  name,
  active: true,
});
```

Senza parentesi, le graffe vengono interpretate come corpo della funzione.

---
### Lexical this
Le arrow functions non creano un proprio `this`.

Usano il `this` dello scope esterno.

```js
const timer = {
  seconds: 0,
  start() {
    return setInterval(() => {
      this.seconds += 1;
      console.log(this.seconds);
    }, 1000);
  },
};
```

Qui `this` dentro la arrow function resta quello del metodo `start()`. Il chiamante deve conservare l'identificatore restituito e passarlo a `clearInterval()` quando il timer non serve piu.

Neppure `call()`, `apply()` o `bind()` sostituiscono il `this` catturato:

```js
const owner = {
  name: "Ada",
  createReader() {
    return () => this.name;
  },
};

const readName = owner.createReader();
console.log(readName.call({ name: "Marco" })); // "Ada"
```

---
### arguments
Le arrow functions non hanno un proprio oggetto `arguments`.

Un riferimento a `arguments` cerca quindi quello di una funzione esterna, se esiste:

```js
function firstArgument(value) {
  const read = () => arguments[0];
  return read("ignorato");
}

console.log(firstArgument("esterno")); // "esterno"
```

Per gli argomenti ricevuti dalla arrow stessa, usa rest parameters.

```js
const sumAll = (...numbers) => {
  return numbers.reduce((total, number) => total + number, 0);
};
```

---
### Non sono costruttori
Le arrow functions non possono essere usate con `new`.

```js
const User = name => {
  this.name = name;
};

// new User("Luca"); // TypeError
```

Per oggetti istanziabili usa `class` o funzioni costruttrici tradizionali.

---

## API / Sintassi

### Sintassi base
```js
const sum = (a, b) => {
  return a + b;
};
```

Con return implicito:

```js
const sum = (a, b) => a + b;
```

Con un solo parametro semplice, le parentesi sono opzionali. Rest, destructuring e valori di default richiedono sempre parentesi.

```js
const square = value => value * value;
```

Senza parametri, le parentesi sono obbligatorie.

```js
const getRandom = () => Math.random();
```

---

## Esempio pratico

Callback concisa:

```js
const users = [
  { name: "Ada", active: true },
  { name: "Marco", active: false },
];

const activeNames = users
  .filter((user) => user.active)
  .map((user) => user.name);
```

Uso utile con `this` lessicale:

```js
class Timer {
  seconds = 0;
  intervalId = null;

  start() {
    if (this.intervalId !== null) return;

    this.intervalId = setInterval(() => {
      this.seconds += 1;
    }, 1000);
  }

  stop() {
    if (this.intervalId === null) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
```

L'arrow function mantiene il `this` del metodo `start`. `start()` evita timer duplicati; chi crea l'istanza deve chiamare `stop()` alla fine del suo utilizzo. Il contatore conta le callback eseguite: non misura con precisione il tempo trascorso, perche il runtime puo ritardarle.

## Varianti

- **Parametro singolo**: `value => value * 2`.
- **Piu parametri**: `(a, b) => a + b`.
- **Return implicito**: `value => value.id`.
- **Corpo a blocco**: `value => { return value.id; }`.
- **Ritorno di oggetto**: `value => ({ id: value })`.
- **Callback con `this` lessicale**: utile dentro metodi e classi.

## Errori comuni

- Usare arrow function come metodo di oggetto quando serve `this`.
- Dimenticare le parentesi quando si restituisce un oggetto.
- Aspettarsi un `arguments` proprio della arrow.
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

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Context|Context]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Spread & Rest Operators|Spread & Rest Operators]]


## Fonti

- [MDN - Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

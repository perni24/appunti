---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, generators, iterators, iterable]
aliases: [Generator JS, Iterator JS]
prerequisites: [Funzioni, Cicli]
related: [Array Methods, Async Await, Event Loop]
---

# Generators e Iterators

## Sintesi

Gli iterator definiscono come consumare una sequenza di valori.

I generator sono funzioni speciali che producono valori uno alla volta usando `yield`.

---

## Protocollo iterator

Un iterator espone un metodo `next()`.

```js
const iterator = {
  current: 0,
  next() {
    this.current += 1;

    if (this.current <= 3) {
      return { value: this.current, done: false };
    }

    return { value: undefined, done: true };
  },
};
```

Ogni chiamata restituisce `{ value, done }`.

---

## Iterable

Un oggetto iterable espone `Symbol.iterator`.

```js
const range = {
  from: 1,
  to: 3,
  [Symbol.iterator]() {
    let current = this.from;
    const end = this.to;

    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        }

        return { done: true };
      },
    };
  },
};

for (const value of range) {
  console.log(value);
}
```

`for...of`, spread e destructuring usano il protocollo iterable.

---

## Generator function

```js
function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}

for (const value of numbers()) {
  console.log(value);
}
```

Una generator function restituisce un iterator.

---

## Generator per range

```js
function* range(from, to) {
  for (let value = from; value <= to; value += 1) {
    yield value;
  }
}

console.log([...range(1, 3)]); // [1, 2, 3]
```

I generator sono utili per sequenze lazy.

---

## `yield*`

`yield*` delega a un altro iterable.

```js
function* combined() {
  yield* [1, 2];
  yield* [3, 4];
}
```

---

## Async iterators

Un async iterator produce valori asincroni.

```js
async function* streamItems(items) {
  for (const item of items) {
    await wait(100);
    yield item;
  }
}

for await (const item of streamItems([1, 2, 3])) {
  console.log(item);
}
```

`for await...of` consuma async iterable.

---

## Errori comuni

- Confondere generator function e funzione normale.
- Dimenticare che un generator e lazy.
- Consumare due volte lo stesso iterator aspettandosi che riparta.
- Usare generator dove un array semplice sarebbe piu leggibile.
- Ignorare gestione errori in async iterator.

---

## Checklist operativa

- Usa generator per sequenze lazy o pipeline.
- Usa iterable per rendere oggetti consumabili con `for...of`.
- Usa async generator per stream asincroni.
- Evita generator per logica banale.
- Documenta se un iterator e monouso.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Cicli|Cicli]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]

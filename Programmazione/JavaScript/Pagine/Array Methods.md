---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, arrays, methods, functional-programming, iteration]
aliases: [Metodi Array, Array methods JS]
prerequisites: [Cicli, Funzioni]
related: [Cicli, Functional Programming, Promise avanzate]
---

# Array Methods

## Sintesi

Gli array method permettono di iterare, trasformare, filtrare, cercare e aggregare dati in modo dichiarativo.

Molti metodi restituiscono un nuovo array, altri modificano l'array originale. Questa distinzione e fondamentale per evitare bug.

---

## Quando usarlo

### Quando usarli
- Usa `map()` per trasformare ogni elemento.
- Usa `filter()` per tenere solo alcuni elementi.
- Usa `find()` per cercare il primo elemento che soddisfa una condizione.
- Usa `some()` o `every()` per verifiche booleane.
- Usa `reduce()` per accumulare un risultato.
- Usa `forEach()` solo per effetti collaterali.

---

## Come funziona

### map
`map()` crea un nuovo array applicando una funzione a ogni elemento.

```js
const numbers = [1, 2, 3];
const doubled = numbers.map(number => number * 2);

console.log(doubled); // [2, 4, 6]
```

Non modifica l'array originale.

---
### filter
`filter()` crea un nuovo array con gli elementi che superano una condizione.

```js
const users = [
  { name: "Luca", active: true },
  { name: "Marco", active: false },
];

const activeUsers = users.filter(user => user.active);
```

---
### find e findIndex
`find()` restituisce il primo elemento trovato.

```js
const users = [
  { id: 1, name: "Luca" },
  { id: 2, name: "Sara" },
];

const user = users.find(user => user.id === 2);
```

Se non trova nulla, restituisce `undefined`.

`findIndex()` restituisce l'indice oppure `-1`.

```js
const index = users.findIndex(user => user.id === 2);
```

---
### some ed every
`some()` verifica se almeno un elemento soddisfa la condizione.

```js
const numbers = [1, 2, 3];

console.log(numbers.some(number => number > 2)); // true
```

`every()` verifica se tutti gli elementi soddisfano la condizione.

```js
console.log(numbers.every(number => number > 0)); // true
```

---
### reduce
`reduce()` accumula un risultato.

```js
const prices = [10, 20, 30];

const total = prices.reduce((accumulator, price) => {
  return accumulator + price;
}, 0);

console.log(total); // 60
```

Esempio con oggetto accumulatore:

```js
const users = [
  { role: "admin" },
  { role: "reader" },
  { role: "admin" },
];

const countByRole = users.reduce((acc, user) => {
  acc[user.role] = (acc[user.role] ?? 0) + 1;
  return acc;
}, {});
```

---
### forEach
`forEach()` esegue una funzione per ogni elemento e restituisce `undefined`.

```js
const names = ["Luca", "Sara"];

names.forEach(name => {
  console.log(name);
});
```

Usalo per effetti collaterali, non per creare nuovi array.

```js
const upperNames = names.map(name => name.toUpperCase());
```

---
### includes
`includes()` verifica se un array contiene un valore.

```js
const roles = ["admin", "editor", "reader"];

console.log(roles.includes("admin")); // true
```

Per oggetti, `includes()` controlla il riferimento, non il contenuto.

```js
console.log([{ id: 1 }].includes({ id: 1 })); // false
```

---
### sort
`sort()` ordina l'array in-place.

```js
const numbers = [10, 2, 30];

numbers.sort((a, b) => a - b);

console.log(numbers); // [2, 10, 30]
```

Senza comparatore, converte i valori in stringhe.

```js
const numbers = [10, 2, 30];

numbers.sort();

console.log(numbers); // [10, 2, 30]
```

Per evitare mutazione, copia prima.

```js
const sorted = [...numbers].sort((a, b) => a - b);
```

---
### Metodi che mutano
Alcuni metodi modificano l'array originale:

- `push()`;
- `pop()`;
- `shift()`;
- `unshift()`;
- `splice()`;
- `sort()`;
- `reverse()`;
- `fill()`.

Altri restituiscono nuovi array o valori:

- `map()`;
- `filter()`;
- `slice()`;
- `concat()`;
- `flat()`;
- `toSorted()`;
- `toReversed()`;
- `toSpliced()`.

---
### Async e map
`map(async ...)` restituisce un array di Promise.

```js
const promises = ids.map(async id => {
  return fetchUser(id);
});
```

Per ottenere i risultati:

```js
const users = await Promise.all(
  ids.map(id => fetchUser(id))
);
```

---

## API / Sintassi

Metodi frequenti:

```js
array.map(callback);
array.filter(callback);
array.find(callback);
array.some(callback);
array.every(callback);
array.reduce(callback, initialValue);
array.forEach(callback);
array.includes(value);
array.sort(compareFn);
```

Callback tipica:

```js
array.map((value, index, array) => {
  return transform(value);
});
```

Alcuni metodi restituiscono nuovi array, altri mutano l'array originale. Controlla sempre questo dettaglio.

## Esempio pratico

Trasformare una lista utenti in nomi ordinati:

```js
const names = users
  .filter((user) => user.active)
  .map((user) => user.name.trim())
  .filter((name) => name !== "")
  .sort((a, b) => a.localeCompare(b));
```

La catena e leggibile se ogni passaggio ha uno scopo chiaro. Se la logica cresce, estrai funzioni con nome.

## Varianti

- **Trasformazione**: `map`.
- **Filtro**: `filter`.
- **Ricerca**: `find`, `findIndex`.
- **Verifica**: `some`, `every`, `includes`.
- **Accumulo**: `reduce`.
- **Iterazione con side effect**: `forEach`.
- **Ordinamento**: `sort`, attenzione perche muta l'array.
- **Metodi immutabili moderni**: `toSorted`, `toReversed`, `toSpliced` dove supportati.

## Errori comuni

- Usare `map()` senza usare il nuovo array.
- Usare `forEach()` con `await` aspettandosi sequenzialita.
- Dimenticare che `sort()` muta l'array.
- Usare `reduce()` per tutto, anche quando `map()` o `filter()` sarebbero piu chiari.
- Cercare oggetti con `includes()` creando un nuovo oggetto.

---

## Checklist

- Il metodo muta l'array originale?
- Sto trasformando, filtrando, cercando o accumulando?
- Il codice resta leggibile?
- Con async, devo usare `Promise.all()`?
- Serve una copia prima di ordinare?

---

## Collegamenti

- [[Cicli]]
- [[Funzioni]]
- [[Promise avanzate]]
- [[Functional Programming]]
- [[Immutabilita e Copia degli Oggetti]]

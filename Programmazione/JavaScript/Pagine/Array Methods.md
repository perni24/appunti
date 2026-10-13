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
  - arrays
  - methods
  - functional-programming
  - iteration
aliases:
  - Metodi Array
  - Array methods JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Cicli]]"
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Cicli]]"
  - "[[Programmazione/JavaScript/Pagine/Functional Programming]]"
  - "[[Programmazione/JavaScript/Pagine/Promise avanzate]]"
title: Array Methods
---

# Array Methods

## Sintesi

Gli array method permettono di iterare, trasformare, filtrare, cercare e aggregare dati in modo dichiarativo.

Molti metodi restituiscono un nuovo array, altri modificano l'array originale. Questa distinzione e fondamentale per evitare bug.

---

## Quando usarlo

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

`map()` non modifica direttamente l'array originale, ma la callback puo farlo. Un nuovo array non significa copia profonda degli oggetti contenuti.

```js
const source = [{ name: "Ada", active: true }];
const selected = source.filter(user => user.active);
selected[0].name = "Grace";
console.log(source[0].name); // "Grace": stesso oggetto
```

Le callback ricevono anche indice e array. Passare una funzione con una firma diversa puo cambiare il risultato:

```js
const values = ["10", "10", "10"];
console.log(values.map(parseInt)); // [10, NaN, 2]: l'indice diventa la base
console.log(values.map(value => parseInt(value, 10))); // [10, 10, 10]
```

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

Non usare quell'indice in `splice()` senza controllarlo: `splice(-1, 1)` eliminerebbe l'ultimo elemento. Anche `find()` puo trovare un valore `undefined`; per distinguere quel caso dall'assenza usa un indice.

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

Entrambi interrompono la ricerca appena conoscono il risultato. Su `[]`, `some()` restituisce `false` ed `every()` restituisce `true`: se serve almeno un elemento, verifica anche `length > 0`.

### Array sparsi

Un buco non equivale sempre a un elemento con valore `undefined`:

```js
const sparse = new Array(2);
console.log(sparse.every(Number.isFinite)); // true: nessun elemento visitato
console.log([...sparse].every(Number.isFinite)); // false: due undefined
console.log(sparse.map(() => 1)); // due buchi, non [1, 1]
```

`map`, `filter`, `forEach`, `some`, `every` e `reduce` saltano gli indici assenti. `find` e `findIndex` li visitano come `undefined`. Evita array sparsi nei dati applicativi; consulta il comportamento del singolo metodo se devi gestirli.

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

Il valore iniziale determina anche il risultato dell'array vuoto. Senza valore iniziale, `[].reduce(...)` genera `TypeError`; non assumere che il risultato sia automaticamente `0`.

Esempio con oggetto accumulatore:

```js
const users = [
  { role: "admin" },
  { role: "reader" },
  { role: "admin" },
];

function countUsersByRole(users) {
  return users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] ?? 0) + 1;
    return acc;
  }, Object.create(null));
}

const countByRole = countUsersByRole(users);
```

L'accumulatore senza prototipo evita collisioni tra ruoli come `constructor` o `__proto__` e proprieta ereditate. L'esempio presume `role` stringa gia validata; per un dizionario piu generale usa [[Programmazione/JavaScript/Pagine/Map e Set|Map]].

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

Per i primitivi usa SameValueZero: trova anche `NaN` e considera `0` e `-0` equivalenti.

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

Senza comparatore, confronta le rappresentazioni testuali secondo le unita UTF-16: non e un ordinamento numerico o linguistico. Non sostituisce con stringhe gli elementi dell'array.

```js
const numbers = [10, 2, 30];

numbers.sort();

console.log(numbers); // [10, 2, 30]
```

Per evitare mutazione, copia prima.

```js
const sorted = [...numbers].sort((a, b) => a - b);
```

Il comparatore restituisce un numero negativo, zero o positivo; `(a, b) => a > b` non e un comparatore corretto. Deve restare coerente e senza effetti collaterali. Nei runtime che lo supportano, `numbers.toSorted((a, b) => a - b)` restituisce direttamente una nuova copia ordinata. L'ordinamento e stabile per elementi considerati equivalenti.

### slice, splice e fill

```js
const letters = ["A", "B", "C", "D"];
const part = letters.slice(1, 3); // ["B", "C"], fine esclusa, originale invariato
const removed = letters.splice(1, 2, "X"); // rimuove B e C, inserisce X
console.log(removed, letters); // ["B", "C"], ["A", "X", "D"]
```

`fill()` assegna lo stesso valore in ogni posizione, anche se e un oggetto:

```js
const shared = new Array(2).fill({ done: false });
shared[0].done = true;
console.log(shared[1].done); // true

const independent = Array.from({ length: 2 }, () => ({ done: false }));
independent[0].done = true;
console.log(independent[1].done); // false
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
- `copyWithin()`.

Altri restituiscono nuovi array o valori:

- `map()`;
- `filter()`;
- `slice()`;
- `concat()`;
- `flat()`;
- `toSorted()`;
- `toReversed()`;
- `toSpliced()`.
- `with()`.

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

Questi frammenti presuppongono `ids` e `fetchUser` definiti e un contesto che consenta `await`. `Promise.all` conserva l'ordine dei risultati, ma non limita la concorrenza e non annulla le altre operazioni quando una fallisce.

Non usare callback `async` con `filter`, `some`, `every` o `find` per decidere in base a un risultato remoto: una Promise e truthy, anche quando risolvera a `false`. Per un filtro asincrono, attendi prima i risultati, poi applica un filtro sincrono.

---

## API / Sintassi

Metodi frequenti: `array`, callback e valori sono segnaposto, non un programma completo.

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
const users = [
  { name: " Sara ", active: true },
  { name: "Ada", active: true },
  { name: "Marco", active: false },
  { name: "   ", active: true },
];

const names = users
  .filter((user) => user.active)
  .map((user) => user.name.trim())
  .filter((name) => name !== "")
  .sort((a, b) => a.localeCompare(b, "it"));

console.log(names); // ["Ada", "Sara"]
```

Qui `active` e booleano e `name` e stringa: dati esterni vanno validati prima. `sort` modifica soltanto l'array intermedio di nomi, non `users`. La catena e leggibile se ogni passaggio ha uno scopo chiaro; se la logica cresce, estrai funzioni con nome.

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

- [[Programmazione/JavaScript/Pagine/Cicli|Cicli]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]


## Fonti

- [MDN - Array, mutazione e indici assenti](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN - map e firma della callback](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [MDN - sort e comparatori](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
- [MDN - Metodi delle collezioni indicizzate](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

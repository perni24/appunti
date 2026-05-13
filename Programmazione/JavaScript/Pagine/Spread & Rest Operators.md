---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, es6, spread, rest, arrays, objects]
aliases: [Spread operator, Rest operator, Tre puntini JavaScript]
prerequisites: [Array Methods, Oggetti Avanzati, Funzioni]
related: [Destructuring, Immutabilita e Copia degli Oggetti]
---

# Spread & Rest Operators

## Sintesi

La sintassi `...` ha due significati diversi in base al contesto:

- **spread**: espande valori;
- **rest**: raccoglie valori.

La stessa sintassi produce quindi effetti opposti.

---

## Spread negli array

Lo spread espande un array nei suoi elementi.

```js
const numbers = [1, 2, 3];
const copy = [...numbers];

console.log(copy); // [1, 2, 3]
```

Puo essere usato per combinare array.

```js
const a = [1, 2];
const b = [3, 4];

const result = [...a, ...b];

console.log(result); // [1, 2, 3, 4]
```

---

## Spread nelle chiamate di funzione

```js
const numbers = [4, 8, 2];

console.log(Math.max(...numbers)); // 8
```

Senza spread, `Math.max()` riceverebbe un array come singolo argomento.

---

## Spread negli oggetti

Lo spread copia proprieta enumerabili in un nuovo oggetto.

```js
const user = {
  name: "Luca",
  role: "reader",
};

const admin = {
  ...user,
  role: "admin",
};
```

Se due proprieta hanno lo stesso nome, vince quella piu a destra.

```js
const result = {
  a: 1,
  a: 2,
};

console.log(result.a); // 2
```

---

## Copia superficiale

Spread crea una copia superficiale.

```js
const original = {
  user: {
    name: "Luca",
  },
};

const copy = {
  ...original,
};

copy.user.name = "Marco";

console.log(original.user.name); // "Marco"
```

Gli oggetti annidati restano condivisi.

Per copie profonde, valuta `structuredClone()` quando supportato.

---

## Rest nei parametri

Rest raccoglie piu argomenti in un array.

```js
function sum(...numbers) {
  return numbers.reduce((total, number) => total + number, 0);
}

console.log(sum(1, 2, 3)); // 6
```

Il rest parameter deve essere l'ultimo.

```js
function log(prefix, ...messages) {
  console.log(prefix, messages);
}
```

---

## Rest nel destructuring

Negli array:

```js
const [first, ...others] = [1, 2, 3, 4];

console.log(first);  // 1
console.log(others); // [2, 3, 4]
```

Negli oggetti:

```js
const { password, ...safeUser } = {
  name: "Luca",
  password: "secret",
  role: "admin",
};

console.log(safeUser); // { name: "Luca", role: "admin" }
```

---

## Differenza tra spread e rest

| Uso | Significato | Esempio |
| --- | --- | --- |
| Spread | Espande valori | `[...items]` |
| Rest | Raccoglie valori | `function fn(...args)` |

Regola pratica:

- a destra di una assegnazione o in una chiamata tende a essere spread;
- in parametri o destructuring tende a essere rest.

---

## Errori comuni

- Pensare che spread faccia una copia profonda.
- Usare rest non come ultimo parametro.
- Confondere spread e rest perche usano entrambi `...`.
- Sovrascrivere proprieta oggetto senza accorgersene.
- Copiare oggetti con metodi, prototipi o descriptor pensando di preservare tutto.

---

## Checklist

- Sto espandendo o raccogliendo?
- La copia superficiale e sufficiente?
- L'ordine delle proprieta nello spread oggetto e corretto?
- Il rest parameter e ultimo?
- Per oggetti complessi serve `structuredClone()` o una logica dedicata?

---

## Collegamenti

- [[Destructuring]]
- [[Funzioni]]
- [[Array Methods]]
- [[Immutabilita e Copia degli Oggetti]]
- [[Property Descriptors]]

---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, functional-programming, pure-functions, immutability]
aliases: [FP JavaScript, Programmazione Funzionale JS]
prerequisites: [Funzioni, Array Methods, Immutabilita e Copia degli Oggetti]
related: [Array Methods, Immutabilita e Copia degli Oggetti, Design Patterns, Testing]
---

# Functional Programming

## Sintesi

La programmazione funzionale organizza il codice attorno a funzioni, trasformazioni di dati, immutabilita e riduzione degli effetti collaterali.

JavaScript e multi-paradigma e supporta bene lo stile funzionale.

---

## Funzioni pure

Una funzione pura:

- restituisce lo stesso output per lo stesso input;
- non modifica stato esterno;
- non produce side effect osservabili.

```js
function add(a, b) {
  return a + b;
}
```

Funzione impura:

```js
let total = 0;

function addToTotal(value) {
  total += value;
  return total;
}
```

Le funzioni pure sono piu facili da testare.

---

## Immutabilita

Invece di modificare dati esistenti, si creano nuove versioni.

```js
const user = { name: "Luca", age: 30 };

const updatedUser = {
  ...user,
  age: 31,
};
```

Questo riduce effetti collaterali e rende i cambiamenti piu prevedibili.

---

## Higher-order functions

Una higher-order function riceve o restituisce funzioni.

```js
function withTax(taxRate) {
  return (price) => price * (1 + taxRate);
}

const addVat = withTax(0.22);

console.log(addVat(100)); // 122
```

Metodi come `map`, `filter` e `reduce` sono esempi pratici.

---

## Map, filter, reduce

```js
const numbers = [1, 2, 3, 4];

const doubled = numbers.map((n) => n * 2);
const even = numbers.filter((n) => n % 2 === 0);
const total = numbers.reduce((sum, n) => sum + n, 0);
```

Questi metodi descrivono cosa vuoi ottenere, non ogni passo imperativo.

---

## Composizione

La composizione combina funzioni piccole.

```js
const trim = (value) => value.trim();
const lower = (value) => value.toLowerCase();

const normalize = (value) => lower(trim(value));
```

Funzioni piccole e pure sono piu semplici da riusare.

---

## Currying

Il currying trasforma una funzione con piu argomenti in una sequenza di funzioni.

```js
const multiply = (a) => (b) => a * b;

const double = multiply(2);

console.log(double(5)); // 10
```

Utile quando vuoi specializzare funzioni.

---

## Side effect

Side effect comuni:

- modificare variabili esterne;
- mutare oggetti ricevuti;
- scrivere su DOM;
- chiamare API;
- leggere tempo o random;
- loggare.

Non tutti i side effect sono sbagliati. Devono pero essere isolati e controllati.

---

## Errori comuni

- Usare FP in modo dogmatico.
- Creare catene `map/filter/reduce` poco leggibili.
- Copiare strutture grandi senza considerare performance.
- Nascondere side effect in funzioni apparentemente pure.
- Usare `reduce` dove un ciclo sarebbe piu chiaro.

---

## Checklist operativa

- Preferisci funzioni pure per logica di dominio.
- Isola side effect ai bordi del sistema.
- Evita mutazioni implicite.
- Usa `map`, `filter`, `reduce` quando migliorano chiarezza.
- Testa funzioni pure con input/output espliciti.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]

---
date: 2026-02-17
tags: [javascript, arrays, methods, functional-programming, es6]
type: #permanent-note
status: budding
---

# Array Methods

JavaScript fornisce una vasta gamma di metodi integrati per manipolare, iterare e trasformare gli array. Questi metodi rendono il codice più dichiarativo, leggibile e meno incline agli errori rispetto ai cicli `for` tradizionali.

## 1. Metodi di Trasformazione

Questi metodi creano un **nuovo array** basato sull'array originale.

### `map()`
Crea un nuovo array applicando una funzione a ogni elemento dell'array originale.

```javascript
const numbers = [1, 2, 3];
const squares = numbers.map(x => x * x); // [1, 4, 9]
```

### `filter()`
Crea un nuovo array contenente solo gli elementi che soddisfano una determinata condizione.

```javascript
const ages = [15, 20, 18, 25];
const adults = ages.filter(age => age >= 18); // [20, 18, 25]
```

## 2. Metodi di Ricerca

### `find()`
Restituisce il **primo** elemento che soddisfa la condizione, o `undefined` se non trovato.

```javascript
const users = [{id: 1, name: "Luca"}, {id: 2, name: "Sara"}];
const user = users.find(u => u.id === 2); // {id: 2, name: "Sara"}
```

### `some()` e `every()`
- `some()`: Ritorna `true` se **almeno un** elemento soddisfa la condizione.
- `every()`: Ritorna `true` se **tutti** gli elementi soddisfano la condizione.

```javascript
const prices = [10, 50, 100];
const hasExpensive = prices.some(p => p > 80); // true
const allCheap = prices.every(p => p < 200); // true
```

## 3. Metodi di Iterazione

### `forEach()`
Esegue una funzione per ogni elemento dell'array. A differenza di `map`, **non restituisce nulla** (ritorna `undefined`).

```javascript
const fruits = ["mela", "pera"];
fruits.forEach(f => console.log(f)); // Iterates and prints each fruit
```

## 4. Riduzione e Ordinamento

### `reduce()`
Riduce l'array a un **unico valore** (es. somma, media, oggetto accumulatore).

```javascript
const cart = [10, 20, 30];
const total = cart.reduce((acc, current) => acc + current, 0); // 60
// 'acc' is the accumulator, '0' is the initial value
```

### `sort()`
Ordina gli elementi dell'array **in-place** (modifica l'array originale). 

> [!CAUTION] Ordinamento Alfabetico
> Di default, `sort()` converte tutto in stringhe. Per ordinare numeri, è necessaria una funzione di comparazione.

```javascript
const points = [40, 100, 1, 5];
points.sort((a, b) => a - b); // [1, 5, 40, 100] (Ascending order)
```

## Perché Utilizzarli

- **Immutabilità**: Metodi come `map` e `filter` incoraggiano a non modificare i dati originali.
- **Concatenazione (Chaining)**: È possibile concatenare più metodi tra loro.
  ```javascript
  const sumOfAdultAges = ages
    .filter(age => age >= 18)
    .reduce((acc, age) => acc + age, 0);
  ```

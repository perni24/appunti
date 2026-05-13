---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, memory, heap, stack, performance]
aliases: [Ciclo di vita memoria JS, JavaScript Memory Lifecycle]
prerequisites: [Tipi di Dati, Oggetti Avanzati]
related: [Garbage Collection, Memory Leaks, WeakMap e WeakSet, Optimization]
---

# Memory Lifecycle

## Sintesi

Il ciclo di vita della memoria descrive come JavaScript alloca, usa e libera memoria durante l'esecuzione.

JavaScript gestisce il rilascio in modo automatico tramite garbage collection, ma il codice puo comunque causare consumo eccessivo o memory leak.

---

## Fasi principali

Il ciclo e composto da tre fasi:

- allocazione: il runtime riserva memoria per valori, oggetti, funzioni e strutture dati;
- utilizzo: il programma legge e modifica i dati allocati;
- rilascio: il garbage collector libera la memoria non piu raggiungibile.

```js
const user = {
  name: "Luca",
  active: true,
};

console.log(user.name);
```

L'oggetto viene allocato, usato e poi potra essere rimosso quando non sara piu raggiungibile.

---

## Stack

Lo stack contiene dati legati all'esecuzione corrente:

- frame delle funzioni;
- variabili locali primitive;
- riferimenti a oggetti;
- indirizzi di ritorno.

```js
function sum(a, b) {
  const result = a + b;
  return result;
}

sum(2, 3);
```

Quando la funzione termina, il suo frame viene rimosso dallo stack.

---

## Heap

L'heap contiene dati dinamici:

- oggetti;
- array;
- funzioni;
- strutture dati complesse.

```js
const numbers = [1, 2, 3];
const user = { id: 1, name: "Luca" };
```

Le variabili conservano riferimenti agli oggetti nell'heap.

---

## Primitivi e riferimenti

I primitivi vengono copiati per valore.

```js
let a = 1;
let b = a;

b = 2;

console.log(a); // 1
```

Gli oggetti vengono manipolati tramite riferimento.

```js
const a = { count: 1 };
const b = a;

b.count = 2;

console.log(a.count); // 2
```

---

## Raggiungibilita

Un valore resta in memoria finche e raggiungibile da una root.

Root tipiche:

- variabili globali;
- variabili nello stack corrente;
- closure ancora vive;
- riferimenti dal DOM;
- timer, listener e subscription attive.

```js
let user = { name: "Luca" };

user = null;
```

Dopo l'assegnazione a `null`, l'oggetto puo essere raccolto se non esistono altri riferimenti.

---

## Memoria e asincronia

Callback, Promise, timer e listener possono mantenere vivi riferimenti piu a lungo del previsto.

```js
function start(data) {
  const id = setInterval(() => {
    console.log(data.length);
  }, 1000);

  return id;
}
```

Finche l'intervallo resta attivo, `data` resta raggiungibile.

---

## Errori comuni

- Pensare che il garbage collector elimini qualunque cosa "non usata mentalmente".
- Tenere riferimenti globali non necessari.
- Dimenticare listener, timer o subscription.
- Conservare oggetti grandi dentro closure longeve.
- Confondere copia di primitivi e riferimento a oggetti.

---

## Checklist operativa

- Riduci la durata dei riferimenti a oggetti grandi.
- Pulisci timer e listener quando non servono.
- Usa scope piccoli.
- Evita cache illimitate.
- Controlla l'heap con DevTools se la memoria cresce nel tempo.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]

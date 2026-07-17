---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
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

## Quando usarlo

Consulta questa nota quando devi capire perche memoria e performance peggiorano nel tempo o quando lavori con oggetti grandi, cache, listener, timer e closure.

E utile per:

- diagnosticare crescita dell'heap;
- capire differenza tra primitivi e riferimenti;
- evitare cache illimitate;
- progettare cleanup di componenti e subscription;
- ragionare su closure e durata dei dati.

## Come funziona

### Fasi principali
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
### Stack
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
### Heap
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
### Primitivi e riferimenti
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
### Raggiungibilita
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
### Memoria e asincronia
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

## API / Sintassi

Non esiste una API JavaScript standard per liberare memoria manualmente.

Le operazioni utili sono indirette:

```js
reference = null;
clearInterval(intervalId);
removeEventListener("resize", listener);
cache.delete(key);
cache.clear();
```

Per osservare memoria:

- Chrome DevTools Memory;
- Performance panel;
- heap snapshot;
- strumenti runtime di Node.js.

In codice applicativo, il controllo reale consiste nel rimuovere riferimenti non piu necessari.

## Esempio pratico

Cleanup di una risorsa:

```js
function mountWidget(element, data) {
  function onClick() {
    console.log(data.id);
  }

  element.addEventListener("click", onClick);

  return function cleanup() {
    element.removeEventListener("click", onClick);
  };
}

const cleanup = mountWidget(button, largeData);
cleanup();
```

Finche il listener resta registrato, puo mantenere vivi `element`, `data` e la closure.

## Varianti

- **Memoria stack**: frame di chiamata e variabili locali.
- **Memoria heap**: oggetti dinamici.
- **Riferimenti forti**: mantengono raggiungibile un oggetto.
- **Riferimenti deboli**: usati da `WeakMap` e `WeakSet`.
- **Cache temporanee**: richiedono limiti o invalidazione.
- **Risorse esterne**: listener, timer, stream e subscription da pulire esplicitamente.

## Errori comuni

- Pensare che il garbage collector elimini qualunque cosa "non usata mentalmente".
- Tenere riferimenti globali non necessari.
- Dimenticare listener, timer o subscription.
- Conservare oggetti grandi dentro closure longeve.
- Confondere copia di primitivi e riferimento a oggetti.

---

## Checklist

### Checklist operativa
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

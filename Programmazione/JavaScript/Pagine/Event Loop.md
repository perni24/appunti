---
date: 2026-02-20
tags: [javascript, programming, async]
type: #permanent-note
status: budding
---

# Event Loop in JavaScript

JavaScript è un linguaggio **single-threaded** (può eseguire una sola cosa alla volta) e **sincrono**. Tuttavia, grazie all'**Event Loop**, è in grado di gestire operazioni asincrone e non bloccanti (come richieste API o timer).

## 1. Architettura del Motore

Per capire l'asincronia, dobbiamo guardare oltre il solo motore JS (come V8) e considerare l'ambiente runtime (Browser o Node.js).

### Call Stack (Pila delle Chiamate)
Segue il principio **LIFO** (Last In, First Out). È dove JavaScript tiene traccia delle funzioni in esecuzione. Quando una funzione viene chiamata, viene "pusshata" nello stack; quando termina, viene rimossa.

### Web APIs
Il browser fornisce funzionalità extra che JS non ha nativamente: `setTimeout`, `fetch`, DOM Events. Queste operazioni vengono delegate al browser per non bloccare lo stack.

## 2. Le Code (Queues)

Quando un'operazione asincrona termina, il suo callback viene inserito in una coda in attesa di essere eseguito.

- **Task Queue (o Callback Queue)**: Contiene i callback di `setTimeout`, `setInterval` e degli eventi del browser.
- **Microtask Queue**: Ha una **priorità maggiore**. Contiene principalmente i callback delle **Promises** (`.then`, `.catch`) e `queueMicrotask`.

## 3. Come funziona l'Event Loop

L'Event Loop è un ciclo infinito con un compito semplicissimo:
1. Controlla se il **Call Stack** è vuoto.
2. Se lo stack è vuoto, guarda la **Microtask Queue**: esegue *tutti* i microtask presenti finché la coda non è vuota.
3. Dopo aver svuotato i microtask, prende il *primo* compito dalla **Task Queue** e lo sposta nel Call Stack per eseguirlo.
4. Ricomincia da capo.

## 4. Esempio di Ordine di Esecuzione

```javascript
console.log("1. Inizio"); // Sincrono

setTimeout(() => {
    console.log("2. Task Queue (Timeout)"); // Macrotask
}, 0);

Promise.resolve().then(() => {
    console.log("3. Microtask Queue (Promise)"); // Microtask
});

console.log("4. Fine"); // Sincrono

/* Output:
   1. Inizio
   4. Fine
   3. Microtask Queue (Promise)
   2. Task Queue (Timeout)
*/
```

> [!IMPORTANT] Priorità Microtask
> Il microtask (Promise) verrà eseguito SEMPRE prima del macrotask (setTimeout), anche se il timeout è impostato a 0ms, perché l'Event Loop svuota l'intera coda dei microtask prima di passare al compito successivo della Task Queue.

---
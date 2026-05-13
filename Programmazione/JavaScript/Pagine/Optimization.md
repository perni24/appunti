---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, optimization, performance, v8, profiling]
aliases: [JavaScript Performance, Ottimizzazione JS]
prerequisites: [Event Loop, Memory Lifecycle, Oggetti Avanzati]
related: [Garbage Collection, Memory Leaks, Scheduling Browser, Web Workers]
---

# Optimization

## Sintesi

Ottimizzare JavaScript significa ridurre tempo CPU, memoria, lavoro sul main thread e latenza percepita.

La regola principale e misurare prima di ottimizzare. Senza profiling, il rischio e migliorare codice non critico e peggiorare leggibilita.

---

## Misurare prima

Strumenti principali:

- Performance panel dei DevTools;
- Memory panel;
- Lighthouse;
- `performance.now()`;
- profiling Node.js;
- metriche real user monitoring.

```js
const start = performance.now();

runTask();

console.log(performance.now() - start);
```

Misure locali aiutano, ma non sostituiscono profiling su casi reali.

---

## Hot path

Un hot path e una parte di codice eseguita molto spesso o con impatto alto.

Prima di ottimizzare chiedi:

- quante volte viene eseguito;
- quanto tempo impiega;
- quanta memoria alloca;
- se blocca input o rendering;
- se il problema e CPU, rete, DOM o memoria.

---

## Hidden classes

Motori come V8 ottimizzano oggetti con forma stabile.

```js
function createPoint(x, y) {
  return { x, y };
}

const a = createPoint(1, 2);
const b = createPoint(3, 4);
```

Creare oggetti con proprieta nello stesso ordine aiuta il motore.

```js
const user = { id: 1, name: "Luca" };

user.active = true;
delete user.name;
```

Aggiungere e rimuovere proprieta dinamicamente puo rendere alcune ottimizzazioni meno efficaci.

---

## Allocazioni

Allocare molti oggetti temporanei puo aumentare pressione sul garbage collector.

```js
for (const item of items) {
  const view = { id: item.id, label: item.name };
  render(view);
}
```

Non evitare ogni oggetto per principio. Intervieni solo se il profiling mostra pressione reale.

---

## Array

Array omogenei e densi sono piu facili da ottimizzare.

```js
const numbers = [1, 2, 3, 4];
```

Evita, nei percorsi critici:

- array con buchi;
- tipi molto misti;
- uso eccessivo di `delete`;
- conversioni implicite ripetute.

---

## DOM e rendering

Molti problemi performance nel browser non sono nel linguaggio, ma nel rendering.

```js
const heights = elements.map((element) => element.offsetHeight);

requestAnimationFrame(() => {
  elements.forEach((element, index) => {
    element.style.height = `${heights[index] + 10}px`;
  });
});
```

Separare letture e scritture riduce layout thrashing.

---

## Debounce e throttle

Debounce: esegue dopo una pausa negli eventi.

```js
function debounce(callback, delay) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}
```

Throttle: limita la frequenza massima di esecuzione.

```js
function throttle(callback, delay) {
  let lastRun = 0;

  return (...args) => {
    const now = Date.now();

    if (now - lastRun >= delay) {
      lastRun = now;
      callback(...args);
    }
  };
}
```

Debounce e utile per search input. Throttle e utile per scroll e resize.

---

## Lavoro pesante

Se un task CPU blocca il main thread, valuta:

- chunking con `setTimeout`;
- `requestIdleCallback` per lavoro non urgente;
- `Web Worker`;
- elaborazione lato server;
- streaming o paginazione.

```js
const worker = new Worker("worker.js");

worker.postMessage({ type: "process", payload: data });
```

---

## Errori comuni

- Ottimizzare senza misurare.
- Sacrificare leggibilita per micro-ottimizzazioni non rilevanti.
- Fare lavoro pesante nel main thread.
- Confondere lentezza di rete con lentezza JavaScript.
- Ignorare layout, paint e dimensione del DOM.

---

## Checklist operativa

- Misura prima con DevTools o profiler.
- Identifica hot path reali.
- Riduci lavoro sul main thread.
- Evita cache illimitate.
- Usa `requestAnimationFrame` per UI e animazioni.
- Usa Web Worker per CPU pesante.
- Mantieni il codice leggibile finche il profiling non giustifica compromessi.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]

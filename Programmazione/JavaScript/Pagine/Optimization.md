---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
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

## Quando usarlo

Ottimizza quando hai un problema misurabile: lentezza percepita, frame persi, input bloccato, memoria crescente, bundle pesante o tempi server elevati.

Intervieni soprattutto quando:

- il profiling mostra un hot path;
- il main thread resta occupato troppo a lungo;
- il garbage collector lavora spesso;
- la pagina fa troppe letture/scritture DOM;
- una lista o una tabella cresce molto;
- una funzione viene chiamata migliaia di volte.

Non ottimizzare codice non critico solo per renderlo "piu furbo".

## Come funziona

### Misurare prima
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
### Hot path
Un hot path e una parte di codice eseguita molto spesso o con impatto alto.

Prima di ottimizzare chiedi:

- quante volte viene eseguito;
- quanto tempo impiega;
- quanta memoria alloca;
- se blocca input o rendering;
- se il problema e CPU, rete, DOM o memoria.

---
### Hidden classes
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
### Allocazioni
Allocare molti oggetti temporanei puo aumentare pressione sul garbage collector.

```js
for (const item of items) {
  const view = { id: item.id, label: item.name };
  render(view);
}
```

Non evitare ogni oggetto per principio. Intervieni solo se il profiling mostra pressione reale.

---
### Array
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
### DOM e rendering
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
### Debounce e throttle
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
### Lavoro pesante
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

## API / Sintassi

Misure locali:

```js
const start = performance.now();
runTask();
const duration = performance.now() - start;
```

Scheduling browser:

```js
requestAnimationFrame(updateUi);
requestIdleCallback(runLowPriorityWork);
```

Spostare CPU pesante:

```js
const worker = new Worker("worker.js");
worker.postMessage(data);
```

Ridurre lavoro ripetuto:

```js
const formatter = new Intl.NumberFormat("it-IT");
items.map((item) => formatter.format(item.price));
```

## Esempio pratico

Debounce su ricerca:

```js
function debounce(callback, delay) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

const search = debounce(async (query) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  renderResults(await response.json());
}, 300);
```

Questo evita una richiesta a ogni singolo carattere digitato.

## Varianti

- **CPU optimization**: riduce calcoli e hot path.
- **Memory optimization**: riduce allocazioni e riferimenti longevi.
- **DOM optimization**: riduce layout, paint e manipolazioni costose.
- **Network optimization**: riduce richieste, payload e latenza.
- **Bundle optimization**: code splitting, tree shaking e lazy loading.
- **Perceived performance**: migliora feedback, skeleton e progressivita.

## Errori comuni

- Ottimizzare senza misurare.
- Sacrificare leggibilita per micro-ottimizzazioni non rilevanti.
- Fare lavoro pesante nel main thread.
- Confondere lentezza di rete con lentezza JavaScript.
- Ignorare layout, paint e dimensione del DOM.

---

## Checklist

### Checklist operativa
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

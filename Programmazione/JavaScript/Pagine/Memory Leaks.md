---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [javascript, memory-leaks, memory, performance, debugging]
aliases: [Memory Leak JS, Perdite di memoria JS]
prerequisites: [Memory Lifecycle, Garbage Collection, Closures]
related: [WeakMap e WeakSet, AbortController, Scheduling Browser, Optimization]
---

# Memory Leaks

## Sintesi

Un memory leak avviene quando memoria non piu utile resta raggiungibile e quindi non puo essere liberata dal garbage collector.

Il problema tipico non e "JavaScript non libera memoria", ma "il codice mantiene ancora un riferimento".

---

## Quando usarlo

Consulta questa nota quando un'app consuma sempre piu memoria, diventa lenta dopo uso prolungato o mantiene dati che dovrebbero essere stati rimossi.

Casi frequenti:

- SPA con cambio viste;
- componenti montati e smontati;
- listener globali;
- timer e polling;
- cache in memoria;
- dashboard real-time;
- rendering di liste grandi.

## Come funziona

### Variabili globali accidentali
In codice non strict, assegnare a un nome non dichiarato puo creare una globale.

```js
function createLeak() {
  leakedValue = { large: true };
}
```

Usa strict mode, moduli ES, `const` e `let`.

```js
"use strict";

function safe() {
  const value = { large: true };
}
```

---
### Timer non puliti
`setInterval` mantiene viva la callback e tutto cio che la callback referenzia.

```js
const data = loadLargeData();

const intervalId = setInterval(() => {
  console.log(data.length);
}, 1000);
```

Quando non serve piu:

```js
clearInterval(intervalId);
```

---
### Event listener non rimossi
Un listener puo trattenere riferimenti a oggetti, componenti o nodi DOM.

```js
function mount() {
  const panel = document.querySelector("#panel");

  function onResize() {
    console.log(panel.offsetWidth);
  }

  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
  };
}
```

Il cleanup deve usare la stessa funzione registrata.

---
### DOM scollegato ma referenziato
Un nodo rimosso dal DOM puo restare in memoria se JavaScript lo conserva.

```js
let removedNode = document.querySelector("#modal");

removedNode.remove();
```

Se non serve piu:

```js
removedNode = null;
```

---
### Closure troppo longeve
Le closure conservano accesso allo scope esterno.

```js
function createHandler(data) {
  return function handleClick() {
    console.log(data.id);
  };
}
```

Se `handleClick` resta registrata per molto tempo, anche `data` resta raggiungibile.

---
### Cache senza limite
```js
const cache = new Map();

function getUser(id) {
  if (!cache.has(id)) {
    cache.set(id, loadUser(id));
  }

  return cache.get(id);
}
```

Una cache deve avere una strategia di pulizia: TTL, limite dimensione, LRU o invalidazione esplicita.

---
### Richieste obsolete
In UI dinamiche, richieste vecchie possono trattenere dati e aggiornare stato non piu valido.

```js
const controller = new AbortController();

await fetch("/api/search", {
  signal: controller.signal,
});

controller.abort();
```

`AbortController` aiuta a cancellare operazioni non piu utili.

---
### Come rilevarli
Strumenti utili:

- Chrome DevTools, tab Memory;
- heap snapshot;
- allocation instrumentation;
- performance timeline;
- confronto dopo cicli ripetuti di uso.

Procedura pratica:

1. Apri la pagina in stato iniziale.
2. Fai uno heap snapshot.
3. Ripeti l'azione sospetta piu volte.
4. Forza garbage collection dagli strumenti, se disponibile.
5. Fai un secondo snapshot.
6. Cerca oggetti che crescono e restano trattenuti.

---

## API / Sintassi

Operazioni di cleanup comuni:

```js
clearTimeout(timeoutId);
clearInterval(intervalId);
controller.abort();
element.removeEventListener("click", listener);
cache.delete(key);
cache.clear();
```

Pattern con funzione di cleanup:

```js
function setup() {
  const controller = new AbortController();

  window.addEventListener("resize", onResize, {
    signal: controller.signal,
  });

  return () => controller.abort();
}
```

Usare `AbortController` con listener supportati permette di centralizzare la cancellazione.

## Esempio pratico

Leak con listener anonimo:

```js
function mount() {
  window.addEventListener("resize", () => {
    console.log("resize");
  });
}
```

Non puoi rimuovere facilmente quella funzione anonima. Versione corretta:

```js
function mount() {
  function onResize() {
    console.log("resize");
  }

  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
  };
}
```

## Varianti

- **Leak da listener**: callback ancora registrate.
- **Leak da timer**: interval o timeout non cancellati.
- **Leak da closure**: scope esterni trattenuti.
- **Leak da DOM scollegato**: nodi rimossi ma referenziati.
- **Leak da cache**: strutture senza eviction.
- **Leak da richieste obsolete**: Promise e fetch non piu utili.

## Errori comuni

- Rimuovere un nodo DOM ma conservare riferimenti JS.
- Registrare listener anonimi impossibili da rimuovere.
- Lasciare interval attivi.
- Tenere cache infinite.
- Ignorare richieste e subscription durante cambio vista.

---

## Checklist

### Checklist operativa
- Pulisci listener, interval, timeout e subscription.
- Usa `AbortController` per richieste obsolete.
- Limita cache e strutture globali.
- Evita closure che catturano oggetti grandi senza motivo.
- Verifica leak con heap snapshot.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]

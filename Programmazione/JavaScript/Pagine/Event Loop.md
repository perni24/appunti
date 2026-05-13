---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, event-loop, async, microtasks, browser]
aliases: [Event Loop JS, Loop degli eventi]
prerequisites: [Callback, Promises]
related: [Callback, Promises, Async Await, Scheduling Browser]
---

# Event Loop

## Sintesi

L'Event Loop e il meccanismo che permette a JavaScript di gestire operazioni asincrone pur eseguendo codice su un singolo call stack.

JavaScript esegue il codice sincrono subito. Timer, eventi, fetch e Promise vengono coordinati dal runtime tramite code e callback.

---

## Componenti principali

- Call stack: contiene le funzioni in esecuzione.
- Web APIs: funzionalita fornite dal browser, come timer, DOM events e rete.
- Task queue: contiene task come `setTimeout`, `setInterval` ed eventi.
- Microtask queue: contiene callback di Promise, `queueMicrotask` e alcune API del runtime.
- Rendering: il browser aggiorna layout e paint tra un ciclo e l'altro, quando puo.

---

## Ordine generale

Il ciclo semplificato e:

1. Esegui tutto il codice sincrono nel call stack.
2. Quando il call stack e vuoto, svuota la microtask queue.
3. Esegui un task dalla task queue.
4. Dai al browser occasione di aggiornare rendering e input.
5. Ripeti.

Le microtask hanno priorita sui task normali.

---

## Esempio di ordine

```js
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve().then(() => {
  console.log("C");
});

console.log("D");

// Output:
// A
// D
// C
// B
```

`A` e `D` sono sincroni. La Promise finisce nella microtask queue. Il timeout finisce nella task queue.

---

## Microtask

Le microtask vengono eseguite dopo il codice sincrono corrente e prima del prossimo task.

```js
queueMicrotask(() => {
  console.log("microtask");
});

console.log("sync");

// sync
// microtask
```

Attenzione: troppe microtask consecutive possono ritardare rendering e input, perche la coda deve essere svuotata prima di procedere.

---

## Task

I task sono unita di lavoro pianificate dal runtime.

Esempi tipici:

- `setTimeout`;
- `setInterval`;
- eventi DOM;
- messaggi tra contesti;
- callback di alcune API browser.

```js
setTimeout(() => {
  console.log("task futura");
}, 0);
```

Anche con `0`, il callback non viene eseguito subito: viene rimandato a un task successivo.

---

## Rendering

Il browser deve alternare JavaScript, input utente e rendering.

Se un task sincrono dura troppo, la pagina non puo aggiornarsi.

```js
while (performance.now() < 5000) {
  // blocca il main thread
}
```

Per animazioni e lavoro visivo usa `requestAnimationFrame`. Per spezzare lavoro pesante usa chunk piccoli o Web Worker.

---

## Errori comuni

- Pensare che `setTimeout(fn, 0)` esegua subito `fn`.
- Ignorare la priorita delle microtask.
- Bloccare il main thread con cicli lunghi.
- Usare Promise per lavoro CPU pesante pensando che diventi parallelo.
- Dimenticare che il browser non puo renderizzare mentre JavaScript blocca lo stack.

---

## Checklist operativa

- Usa Promise e `async/await` per coordinare asincronia.
- Usa `requestAnimationFrame` per lavoro legato al rendering.
- Spezza task lunghi se impattano input e UI.
- Non creare catene infinite di microtask.
- Per CPU pesante valuta `Web Worker`.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]

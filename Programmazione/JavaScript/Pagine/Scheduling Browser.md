---
date: 2026-05-04
tags: [javascript, browser, scheduling, event-loop, performance, animation]
type: #permanent-note
status: budding
---

# Scheduling Browser

Lo scheduling nel browser riguarda il modo in cui JavaScript programma lavoro asincrono senza bloccare troppo a lungo il thread principale.

Nel browser il thread principale gestisce JavaScript, rendering, eventi utente, layout, paint e aggiornamenti del DOM. Per questo e importante scegliere lo strumento giusto per rimandare, distribuire o sincronizzare il lavoro.

---

## 1. Perche serve lo scheduling

JavaScript nel browser esegue codice sul main thread.

Se un task dura troppo:

- la pagina non risponde ai click;
- lo scroll diventa poco fluido;
- le animazioni scattano;
- il rendering viene ritardato;
- l'esperienza utente peggiora.

Lo scheduling permette di decidere quando eseguire un lavoro:

- subito;
- dopo lo stack corrente;
- prima del prossimo frame;
- durante i momenti di inattivita;
- a intervalli regolari;
- dopo un certo ritardo.

---

## 2. setTimeout()

`setTimeout()` programma una funzione da eseguire dopo un ritardo minimo.

```js
setTimeout(() => {
  console.log("Eseguito dopo almeno 1000 ms");
}, 1000);
```

Il ritardo non e garantito al millisecondo. Il callback viene inserito nella task queue e puo essere eseguito solo quando il call stack e libero.

```js
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

console.log("C");

// Output:
// A
// C
// B
```

Anche con `0`, il callback viene rinviato a un task successivo.

---

## 3. setInterval()

`setInterval()` esegue una funzione ripetutamente a intervalli regolari.

```js
const intervalId = setInterval(() => {
  console.log("Tick");
}, 1000);

clearInterval(intervalId);
```

E utile per polling semplice o aggiornamenti periodici, ma va usato con attenzione.

Se il lavoro interno dura troppo, gli intervalli possono accumularsi o diventare imprecisi.

Per task periodici complessi spesso e meglio usare `setTimeout()` ricorsivo.

```js
async function poll() {
  await fetchUpdates();

  setTimeout(poll, 1000);
}

poll();
```

In questo modo il nuovo ciclo parte solo dopo la fine del precedente.

---

## 4. queueMicrotask()

`queueMicrotask()` inserisce un callback nella microtask queue.

```js
console.log("A");

queueMicrotask(() => {
  console.log("B");
});

console.log("C");

// Output:
// A
// C
// B
```

Le microtask vengono eseguite dopo il codice sincrono corrente, ma prima del prossimo task e prima che il browser passi normalmente al rendering.

Sono utili per:

- normalizzare codice sincrono e asincrono;
- eseguire cleanup immediati;
- rinviare un callback senza aspettare un nuovo task.

> [!WARNING]
> Troppe microtask consecutive possono bloccare il rendering, perche il browser deve svuotare la microtask queue prima di continuare.

---

## 5. requestAnimationFrame()

`requestAnimationFrame()` programma un callback prima del prossimo repaint.

E lo strumento corretto per aggiornare animazioni e modifiche visive sincronizzate con il rendering.

```js
function animate(timestamp) {
  element.style.transform = `translateX(${timestamp / 10}px)`;

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

Il browser prova a chiamare il callback in sincronia con il refresh dello schermo.

Vantaggi:

- animazioni piu fluide;
- meno lavoro quando la tab non e visibile;
- sincronizzazione con il ciclo di rendering;
- migliore efficienza rispetto a `setInterval()` per animazioni.

---

## 6. Separare letture e scritture del DOM

Le operazioni sul DOM possono causare layout e repaint.

Un errore comune e alternare letture e scritture nello stesso ciclo.

```js
for (const item of items) {
  const height = item.offsetHeight;
  item.style.height = `${height + 10}px`;
}
```

Questo puo forzare layout ripetuti.

Meglio separare le letture dalle scritture.

```js
const heights = items.map(item => item.offsetHeight);

requestAnimationFrame(() => {
  items.forEach((item, index) => {
    item.style.height = `${heights[index] + 10}px`;
  });
});
```

Questo pattern riduce il rischio di layout thrashing.

---

## 7. requestIdleCallback()

`requestIdleCallback()` programma lavoro da eseguire quando il browser ha tempo libero.

```js
requestIdleCallback(deadline => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    const task = tasks.shift();
    task();
  }
});
```

E utile per lavori non urgenti:

- pre-elaborazione dati;
- salvataggi secondari;
- analytics;
- prefetch leggero;
- cleanup non critico.

Non va usato per lavoro necessario al rendering immediato o all'interazione principale.

---

## 8. Timeout con requestIdleCallback()

`requestIdleCallback()` puo ricevere un timeout.

```js
requestIdleCallback(
  deadline => {
    processLowPriorityWork(deadline);
  },
  { timeout: 2000 }
);
```

Il timeout indica che il callback deve essere eseguito entro un tempo massimo, anche se il browser non trova un momento completamente idle.

Questo e utile quando un lavoro e a bassa priorita, ma non puo essere rimandato per sempre.

---

## 9. Suddividere task pesanti

Un task lungo puo essere spezzato in blocchi piu piccoli.

```js
function processItems(items) {
  let index = 0;

  function processChunk() {
    const start = performance.now();

    while (index < items.length && performance.now() - start < 8) {
      processItem(items[index]);
      index += 1;
    }

    if (index < items.length) {
      setTimeout(processChunk, 0);
    }
  }

  processChunk();
}
```

Questo lascia spazio al browser per gestire input, rendering e altri task tra un blocco e l'altro.

---

## 10. Scheduler API

Alcuni ambienti moderni espongono `scheduler.postTask()`, che permette di programmare task con priorita.

```js
await scheduler.postTask(() => {
  updateSearchIndex();
}, {
  priority: "background",
});
```

Priorita comuni:

- `user-blocking`;
- `user-visible`;
- `background`.

Questa API e utile quando si vuole comunicare al browser quanto e urgente un lavoro.

> [!INFO]
> Prima di usarla in produzione bisogna verificare il supporto dell'ambiente target o prevedere un fallback.

---

## 11. Confronto tra strumenti

| Strumento | Quando usarlo | Note |
| --- | --- | --- |
| `queueMicrotask()` | Dopo il codice corrente, prima del rendering | Alta priorita, da usare con moderazione |
| `setTimeout()` | Rinviare lavoro a un task futuro | Ritardo minimo, non preciso |
| `setInterval()` | Esecuzione ripetuta semplice | Attenzione ad accumuli e drift |
| `requestAnimationFrame()` | Animazioni e aggiornamenti visivi | Sincronizzato con il repaint |
| `requestIdleCallback()` | Lavoro non urgente | Dipende dal tempo libero del browser |
| `scheduler.postTask()` | Task con priorita esplicita | Supporto da verificare |

---

## 12. Best practice

- Usa `requestAnimationFrame()` per animazioni e modifiche visive.
- Usa `requestIdleCallback()` per lavoro non urgente.
- Usa `setTimeout()` per spezzare task lunghi.
- Evita cicli sincroni pesanti sul main thread.
- Non abusare di `queueMicrotask()`, perche puo ritardare il rendering.
- Pulisci sempre timer e intervalli quando non servono piu.
- Per lavori CPU pesanti valuta un `Web Worker`.
- Misura con DevTools prima di ottimizzare.

---

## 13. Errori comuni

- Usare `setInterval()` per animazioni invece di `requestAnimationFrame()`.
- Pensare che `setTimeout(fn, 0)` esegua subito `fn`.
- Riempire la microtask queue e bloccare il rendering.
- Fare lavoro pesante dentro `requestAnimationFrame()`.
- Usare `requestIdleCallback()` per task urgenti.
- Non cancellare timer e interval, causando memory leak.
- Alternare letture e scritture DOM causando layout thrashing.

---

## 14. Mappa mentale

```text
Scheduling Browser
|
|-- task futuri
|   |-- setTimeout()
|   |-- setInterval()
|
|-- microtask
|   |-- queueMicrotask()
|   |-- Promise callbacks
|
|-- rendering
|   |-- requestAnimationFrame()
|   |-- animazioni
|   |-- DOM updates
|
|-- idle time
|   |-- requestIdleCallback()
|   |-- lavoro non urgente
|
|-- priorita
|   |-- scheduler.postTask()
|   |-- user-blocking
|   |-- background
```

---

## 15. Collegamenti

- [[Event Loop]]
- [[Promises]]
- [[Promise avanzate]]
- [[AbortController]]
- [[Web Workers]]
- [[Memory Leaks]]
- [[Optimization]]

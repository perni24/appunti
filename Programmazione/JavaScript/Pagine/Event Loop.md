---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - event-loop
  - async
  - microtasks
  - browser
aliases:
  - Event Loop JS
  - Loop degli eventi
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Callback]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Callback]]"
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Scheduling Browser]]"
title: Event Loop
---

# Event Loop

## Sintesi

L'Event Loop coordina l'esecuzione del codice e delle callback con i servizi del runtime. Nel main thread del browser, il codice JavaScript ordinario esegue un tratto sincrono alla volta; rete e timer possono avanzare senza tenere quel tratto sullo stack.

Una Promise non crea un thread e non sposta un calcolo altrove. I worker hanno un contesto di esecuzione separato: il browser nel suo insieme non e un programma a thread unico.

Questa nota usa il modello del browser. I frammenti sono indipendenti e gli output indicano un ordine, non tempi esatti.

---

## Quando usarlo

Studia l'Event Loop quando devi capire ordine di esecuzione, Promise, timer, UI bloccata o differenza tra codice asincrono e parallelo.

Serve soprattutto per:

- prevedere output di codice async;
- evitare blocchi del main thread;
- capire microtask e task;
- progettare animazioni e rendering;
- scegliere tra Promise, timer e Web Worker;
- diagnosticare input lag.

## Come funziona

### Componenti principali
- **Call stack**: tiene traccia delle chiamate sincrone attive. Una callback JavaScript viene eseguita su questo stack, non dentro una coda.
- **Servizi del browser**: gestiscono attese, rete, eventi e altre operazioni. Non tutte le Web API sono asincrone: per esempio molte operazioni DOM sono sincrone.
- **Task**: unita di lavoro, per esempio l'esecuzione di uno script, la consegna di un evento di input o la callback di un timer pronto. Il browser ha piu code e sorgenti di task, non una singola coda FIFO universale.
- **Microtask**: lavoro accodato da `queueMicrotask`, reazioni alle Promise e API come MutationObserver. L'oggetto Promise non e una microtask.
- **Rendering**: lavoro necessario ad aggiornare la vista, coordinato dal browser alle opportunita di rendering.

---
### Ordine generale
Per ragionare sugli esempi di questa nota:

1. Il browser seleziona un task eseguibile e ne esegue il lavoro sincrono.
2. Al checkpoint delle microtask esegue quelle in coda, comprese quelle aggiunte da altre microtask, finche la coda e vuota.
3. Quando esiste un'opportunita di rendering, puo eseguire il lavoro relativo al frame.
4. Prosegue con il lavoro disponibile.

Non e la trascrizione completa dello standard: esistono checkpoint anche al termine di altre invocazioni di script/callback. Lo stack vuoto da solo non significa che il browser debba dipingere un frame.

Le microtask non interrompono una funzione sincrona a meta. La loro precedenza sul task successivo vale quando vengono elaborate al checkpoint; non esiste una priorita assoluta che permetta di interrompere il lavoro corrente.

---
### Microtask
Le microtask vengono eseguite dopo il codice sincrono corrente e prima del prossimo task.

```js
queueMicrotask(() => {
  console.log("microtask");
});

console.log("sync");

// sync
// microtask
```

Una microtask puo aggiungerne un'altra nello stesso checkpoint:

```js
console.log("sync");

queueMicrotask(() => {
  console.log("micro 1");
  queueMicrotask(() => console.log("micro 3"));
});

Promise.resolve().then(() => console.log("micro 2"));
setTimeout(() => console.log("timer"), 0);

// sync, micro 1, micro 2, micro 3, timer
```

Non c'e una coda delle Promise con precedenza su `queueMicrotask`: qui conta l'ordine di accodamento. Catene molto lunghe, o infinite, possono impedire di tornare a input e rendering. Anche ripetere `await Promise.resolve()` non e un modo affidabile per cedere un frame alla UI.

---
### Task
I task sono unita di lavoro pianificate dal runtime.

Esempi tipici:

- `setTimeout`;
- `setInterval`;
- consegna di eventi di input del browser;
- messaggi tra contesti;
- callback di alcune API browser.

```js
setTimeout(() => {
  console.log("task futura");
}, 0);
```

Anche con `0`, la callback non viene eseguita subito. Il ritardo richiesto non e una scadenza garantita: task occupati, timer annidati e throttling delle schede in background possono aumentare l'attesa. Nell'HTML i timer annidati oltre una certa profondita hanno un minimo di 4 ms.

Un evento non implica sempre un nuovo task: `dispatchEvent()` invoca sincronicamente i listener prima di restituire il controllo. Vedi [[Programmazione/JavaScript/Pagine/Callback|Callback]]. Non dedurre un ordine globale fra timer, rete e input registrati da sorgenti diverse.

---
### Rendering
Il browser deve alternare JavaScript, input utente e rendering.

Un lungo lavoro sul main thread ritarda input e aggiornamenti che lo richiedono. Alcune animazioni gestite dal compositor possono continuare: non tutta la pipeline grafica vive sullo stack JavaScript.

Controesempio intenzionalmente bloccante, da non usare per aspettare:

```js
const startedAt = performance.now();
while (performance.now() - startedAt < 50) {
  // Busy wait: occupa il thread invece di cederlo.
}
```

La differenza rispetto al valore iniziale misura una durata; confrontare solo `performance.now() < 5000` dipenderebbe dal tempo trascorso dall'origine temporale della pagina.

`requestAnimationFrame` pianifica una callback prima di un prossimo repaint, non dopo il paint e non ogni 16 ms garantiti. E una richiesta singola, da ripetere per continuare un'animazione, ed e normalmente sospesa nelle schede in background. Anche una sua callback troppo pesante blocca il main thread.

Per calcoli lunghi usa piccoli blocchi con pause reali fra task, oppure un Web Worker se il lavoro e separabile dal DOM. Un timer consente al browser di scegliere altro lavoro, ma non garantisce che dipinga fra due callback.

---

## API / Sintassi

| API | Cosa pianifica | Attenzione |
| --- | --- | --- |
| `setTimeout(fn, delay)` | Una callback di timer | Non garantisce il momento esatto; restituisce un handle per `clearTimeout` |
| `setInterval(fn, delay)` | Callback ripetute | Non attende le Promise restituite; operazioni async possono sovrapporsi |
| `queueMicrotask(fn)` | Una microtask | Un throw viene segnalato come eccezione, non come rifiuto di una Promise restituita |
| `Promise.resolve().then(fn)` | Una reazione a Promise | Restituisce una nuova Promise; un throw la rifiuta |
| `requestAnimationFrame(fn)` | Callback legata a un frame | Non e un timer per lavoro generico; cancellabile con `cancelAnimationFrame` |

Ordine tipico:

```js
console.log("sync");

queueMicrotask(() => console.log("microtask"));

setTimeout(() => console.log("task"), 0);
```

Il codice sincrono termina prima, poi vengono eseguite microtask, poi task future.

## Esempio pratico

### Esempio di ordine
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

`A` e `D` sono sincroni. La Promise e gia fulfilled: la reazione che stampa `C` viene accodata come microtask. Il timer che stampa `B` puo essere eseguito solo dopo il codice corrente e quel checkpoint.

### Elaborazione a blocchi

Questa funzione somma un array denso di numeri finiti, senza modificarlo. Esegue al massimo `chunkSize` elementi per task e restituisce una Promise. L'input non deve essere modificato dal chiamante durante l'elaborazione.

```js
function sumInChunks(values, chunkSize = 1000) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(values)) {
      throw new TypeError("Atteso un array");
    }
    if (!Number.isSafeInteger(chunkSize) || chunkSize < 1) {
      throw new RangeError("chunkSize deve essere un intero positivo");
    }

    let index = 0;
    let total = 0;

    function step() {
      try {
        const end = Math.min(index + chunkSize, values.length);
        for (; index < end; index += 1) {
          if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
            throw new TypeError("Ogni elemento deve essere un numero finito");
          }
          total += values[index];
          if (!Number.isFinite(total)) {
            throw new RangeError("Somma fuori intervallo");
          }
        }
      } catch (error) {
        reject(error);
        return;
      }

      if (index < values.length) {
        setTimeout(step, 0);
      } else {
        resolve(total);
      }
    }

    setTimeout(step, 0);
  });
}

sumInChunks([10, 20, 30, 40], 2)
  .then((total) => console.log(total)) // 100
  .catch((error) => console.error(error));
```

L'esecutore della Promise e sincrono, ma il primo blocco e rinviato dal timer. Il `try/catch` dentro `step` e necessario: il costruttore non cattura automaticamente errori lanciati in una futura callback.

Il limite e per numero di elementi, non per millisecondi. Non aggiunge parallelismo o cancellazione; la somma usa la precisione di `Number`, non aritmetica decimale esatta. Per array enormi e calcoli costosi servono misure e, se opportuno, worker: vedi [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]].

---

## Varianti

- **Browser event loop**: coordina JavaScript, Web APIs, rendering e input.
- **Node.js event loop**: ha fasi per timer, I/O, check e close callback, ma nessun rendering DOM. `process.nextTick` non e un normale timer e puo ritardare l'I/O se usato ricorsivamente.
- **Task/macrotask**: "macrotask" e un nome didattico comune; lo standard HTML parla di task.
- **Microtask**: Promise callback e `queueMicrotask`.
- **Rendering frame**: lavoro visuale coordinato con `requestAnimationFrame`.

Non trasferire al browser una tabella di priorita di Node. In Node l'ordine di `setImmediate` rispetto a un timer dipende dal contesto; anche gli esempi top-level con `nextTick` e Promise possono differire fra CommonJS ed ESM. La documentazione Node segnala inoltre una modifica dei timer con libuv 1.45 / Node 20. I dettagli vanno verificati sulla versione in uso.

## Errori comuni

- Pensare che `setTimeout(fn, 0)` esegua subito `fn`.
- Ignorare la priorita delle microtask.
- Bloccare il main thread con cicli lunghi.
- Usare Promise per lavoro CPU pesante pensando che diventi parallelo.
- Dimenticare che il lavoro sul main thread ritarda input e aggiornamenti della vista che dipendono da quel thread.
- Considerare `await` su una Promise gia risolta come una pausa garantita per input e paint.
- Confondere la modifica immediata del DOM con l'istante in cui appare sullo schermo.

---

## Checklist

### Checklist operativa
- Usa Promise e `async/await` per coordinare asincronia.
- Usa `requestAnimationFrame` per lavoro legato al rendering.
- Spezza task lunghi se impattano input e UI.
- Non creare catene infinite di microtask.
- Per CPU pesante valuta `Web Worker`.
- Distingui comportamento browser, worker e Node; non promettere tempi esatti dei timer.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]

## Fonti

- [HTML Standard: event loop e modello di elaborazione](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model).
- [MDN: microtask e runtime](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth).
- [MDN: queueMicrotask e differenze con Promise](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide).
- [MDN: setTimeout e ritardi effettivi](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout).
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
- [Node.js: event loop, timer e nextTick](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick).
- [Node.js: queueMicrotask, nextTick e differenze fra ESM e CommonJS](https://nodejs.org/api/process.html#when-to-use-queuemicrotask-vs-processnexttick).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

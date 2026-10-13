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
  - browser
  - scheduling
  - event-loop
  - performance
  - animation
aliases:
  - Browser Scheduling
  - requestAnimationFrame
  - requestIdleCallback
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/AbortController]]"
  - "[[Programmazione/JavaScript/Pagine/Web Workers]]"
  - "[[Programmazione/JavaScript/Pagine/Optimization]]"
title: Scheduling Browser
---

# Scheduling Browser

## Sintesi

Lo **scheduling** decide quando eseguire lavoro, non lo rende automaticamente parallelo. Il codice JavaScript del documento condivide il main thread con lavoro necessario a input, DOM e rendering; i worker hanno invece contesti separati.

Un timer, una Promise o una priorita non possono interrompere a meta una funzione sincrona. Per mantenere la pagina reattiva servono operazioni brevi, pause cooperative e, per calcoli pesanti trasferibili, Web Workers.

## Quando usarlo

- Animazioni: sincronizza aggiornamenti visivi con `requestAnimationFrame`.
- Polling: attendi la richiesta precedente prima di pianificare la successiva.
- Calcoli divisibili: lavora a blocchi e restituisci il controllo al browser.
- Preparazione non urgente: usa periodi idle, con fallback e un limite al lavoro.
- Ordine interno di aggiornamenti: una microtask puo essere adatta, ma non e una pausa per dipingere la pagina.

Questa nota riguarda il browser. Gli esempi sono indipendenti, salvo la funzione `sumWithBudget`, che usa `yieldToBrowser` definita nella sezione API. Non promettono tempi esatti ne un frame visibile tra ogni blocco.

## Come funziona

### Task e microtask non sono livelli di parallelismo

Il browser seleziona task da diverse sorgenti. Ai checkpoint esegue le microtask accodate, comprese quelle aggiunte durante lo stesso checkpoint; il rendering avviene alle opportunita previste dal runtime, non automaticamente dopo ogni task.

```js
console.log("sync");
setTimeout(() => console.log("timer"), 0);
queueMicrotask(() => console.log("microtask"));
// sync, microtask, timer
```

`queueMicrotask` serve a rimandare lavoro breve mantenendo un ordine preciso, non a eseguire calcoli con una generica "alta priorita". Catene di microtask possono affamare input e rendering. Anche ripetere `await Promise.resolve()` non crea una pausa affidabile per la UI.

Un throw dentro `queueMicrotask` viene segnalato come eccezione non gestita; in `Promise.resolve().then(callback)` rifiuta invece la Promise restituita. Vedi [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]] per il modello completo.

### Timer, ritardo minimo e throttling

`setTimeout(callback, delay)` pianifica una singola callback dopo l'attesa richiesta; `delay` non e una scadenza garantita. Task occupati, throttling in background e timer annidati possono ritardarla. Per i timer con profondita di annidamento oltre cinque, HTML applica almeno 4 ms ai ritardi inferiori: `0` non significa esecuzione immediata.

```js
const timerId = setTimeout(() => {
  console.log("Aggiornamento differito");
}, 1000);
```

Quando il proprietario dell'operazione viene smontato o chiuso:

```js
clearTimeout(timerId);
```

La cancellazione riguarda una callback non ancora eseguita, non puo annullare effetti gia prodotti. `setInterval` programma ripetizioni, ma **non attende la Promise di una callback async**: due richieste di rete possono restare contemporaneamente in corso anche se i loro tratti JavaScript non eseguono in parallelo sul main thread.

### Polling senza richieste sovrapposte

La funzione seguente avvia subito una richiesta; la successiva parte dopo il completamento e un ulteriore ritardo. Non mantiene una frequenza esatta. Gli errori vengono segnalati e il polling riprova; un'applicazione reale puo aggiungere backoff e distinguere errori temporanei da permanenti.

```js
function startPolling(task, delay = 1000) {
  if (typeof task !== "function") throw new TypeError("task deve essere una funzione");
  if (!Number.isFinite(delay) || delay < 0 || delay > 2147483647) {
    throw new RangeError("Ritardo fuori intervallo");
  }

  const controller = new AbortController();
  let timerId;

  async function run() {
    try {
      await task(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) console.error("Polling fallito:", error);
    } finally {
      if (!controller.signal.aborted) timerId = setTimeout(run, delay);
    }
  }

  void run();
  return function stop() {
    controller.abort();
    clearTimeout(timerId);
  };
}
```

Esempio di chiamata, con una API JSON `/api/updates` disponibile sulla stessa origine:

```js
const stopPolling = startPolling(async (signal) => {
  const response = await fetch("/api/updates", { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  signal.throwIfAborted();
  console.log(data);
}, 5000);
```

Alla chiusura della vista chiama `stopPolling()`. Il segnale deve essere rispettato dal lavoro in corso: se `task` ignora l'abort puo continuare, ma non viene pianificato un nuovo ciclo. L'abort non annulla retroattivamente una modifica gia ricevuta dal server.

### requestAnimationFrame: timestamp e cancellazione

`requestAnimationFrame` e **one-shot**: per proseguire devi richiamarlo. La callback precede il paint di un aggiornamento del rendering; non certifica che il frame sia gia apparso. Frequenza del display, carico e visibilita incidono sulle chiamate, spesso sospese nelle schede nascoste.

Usa il tempo trascorso, non un numero fisso di pixel per callback o il timestamp assoluto. Questa animazione da 0 a 200 px richiede un elemento libero di usare `transform`; sovrascrive eventuali trasformazioni precedenti.

```html
<div id="moving-label">Elemento in movimento</div>
```

```js
function animateTranslation(element, durationMs = 1000) {
  if (!(element instanceof HTMLElement)) throw new TypeError("Elemento HTML richiesto");
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError("Durata positiva richiesta");
  }

  let requestId = null;
  let startedAt = null;
  let cancelled = false;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function frame(timestamp) {
    requestId = null;
    if (cancelled) return;
    startedAt ??= timestamp;
    const progress = Math.min((timestamp - startedAt) / durationMs, 1);
    element.style.transform = `translateX(${200 * progress}px)`;
    if (progress < 1) requestId = requestAnimationFrame(frame);
  }

  if (reducedMotion) {
    element.style.transform = "translateX(200px)";
  } else {
    requestId = requestAnimationFrame(frame);
  }

  return function stop() {
    cancelled = true;
    if (requestId !== null) cancelAnimationFrame(requestId);
    requestId = null;
  };
}
```

Avvio dopo il markup:

```js
const stopAnimation = animateTranslation(document.querySelector("#moving-label"));
```

Chiama `stopAnimation()` allo smontaggio. Il valore iniziale di `startedAt` e `null`: un timestamp pari a zero e valido. L'esempio legge reduced motion all'avvio; per animazioni lunghe ascolta anche i cambiamenti della preferenza. Al rientro da una scheda nascosta il tempo puo essere avanzato: qui l'animazione raggiunge direttamente il progresso corrispondente.

### Separare letture e scritture del DOM

Leggere una misura dopo aver invalidato il layout puo forzarne il ricalcolo. Alternare lettura e scrittura per ogni nodo aumenta il rischio di layout thrashing. `requestAnimationFrame` non lo elimina se dentro la callback continui ad alternarle.

Prerequisito di questo esempio: elementi `[data-grow]` con `box-sizing: border-box`, senza vincoli di altezza che prevalgano sul valore assegnato. `offsetHeight` include padding e bordi e arrotonda a un intero.

```js
const items = Array.from(document.querySelectorAll("[data-grow]"));
const heights = items.map((item) => item.offsetHeight);

requestAnimationFrame(() => {
  items.forEach((item, index) => {
    item.style.height = `${heights[index] + 10}px`;
  });
});
```

`querySelectorAll` restituisce una NodeList, non un Array con `map`. Le misure descrivono l'istante della lettura: se il layout cambia prima della scrittura, valuta se ricalcolarle. Anche una singola lettura puo forzare layout; il vantaggio e evitare un ricalcolo per ogni coppia lettura/scrittura.

### requestIdleCallback: budget e timeout

`requestIdleCallback` propone una finestra per lavoro non urgente. `deadline.timeRemaining()` stima i millisecondi disponibili: **non interrompe** la tua funzione allo scadere.

L'opzione `timeout` non garantisce esecuzione entro quel numero di millisecondi. Alla scadenza il browser accoda il lavoro anche senza un periodo idle; main thread occupato e altre attese possono ritardarlo ancora. In questo caso `didTimeout` e vero: non approfittarne per elaborare tutta la coda senza limiti.

Esempio autonomo con piccole operazioni sincrone, cursore senza `shift()`, ripianificazione e fallback. Ogni callback esegue al massimo 50 operazioni; quando scatta il timeout ne esegue **una sola**.

```js
const idleResults = [];
const jobs = Array.from({ length: 200 }, (_, index) => () => {
  idleResults.push(index * index);
});
const supportsIdle = typeof globalThis.requestIdleCallback === "function"
  && typeof globalThis.cancelIdleCallback === "function";
let cursor = 0;
let idleHandle = null;
let stopped = false;

function scheduleIdleStep() {
  idleHandle = supportsIdle
    ? requestIdleCallback(runIdleStep, { timeout: 2000 })
    : setTimeout(() => runIdleStep({
        didTimeout: true,
        timeRemaining: () => 0,
      }), 0);
}

function runIdleStep(deadline) {
  idleHandle = null;
  if (stopped) return;
  let count = 0;

  while (cursor < jobs.length && count < 50
    && (deadline.timeRemaining() > 0 || (deadline.didTimeout && count === 0))) {
    jobs[cursor]();
    cursor += 1;
    count += 1;
    if (deadline.didTimeout) break;
  }
  if (cursor < jobs.length) scheduleIdleStep();
}

function cancelIdleWork() {
  stopped = true;
  if (idleHandle !== null) {
    if (supportsIdle) cancelIdleCallback(idleHandle);
    else clearTimeout(idleHandle);
  }
  idleHandle = null;
}

scheduleIdleStep();
```

Il fallback a timer **non simula un vero periodo idle**. Le operazioni dell'esempio sono brevi e non lanciano eccezioni: per una coda applicativa definisci come notificare completamento ed errori, senza perdere eccezioni dentro callback future. Non usare callback async qui: le Promise non vengono attese. Per salvataggi essenziali o lavoro necessario alla UI non affidarti alla disponibilita di idle time.

## API / Sintassi

| API | Uso | Limite importante |
| --- | --- | --- |
| `setTimeout` | Singola task futura | Ritardo non esatto; cancellazione prima dell'avvio |
| `setInterval` | Ripetizioni semplici | Non attende callback async |
| `queueMicrotask` | Ordinamento interno breve | Non cede una task alla UI |
| `requestAnimationFrame` | Aggiornamento visivo | Una chiamata per frame richiesto; niente CPU pesante |
| `requestIdleCallback` | Lavoro non urgente | Budget indicativo, supporto da verificare |
| `scheduler.postTask` | Task con priorita esplicita | Non interrompe codice sincrono gia in esecuzione |
| `scheduler.yield` | Cedere il controllo durante un lavoro | Ripresa in una task successiva, non garanzia di paint |

### Scheduler API e fallback

`postTask` restituisce una Promise del risultato. Accetta priorita `user-blocking`, `user-visible` (default) e `background`, oltre a ritardo e segnale di cancellazione. L'abort puo impedire l'avvio di un task pendente, ma non preempie una callback sincrona avviata. Se la callback avvia I/O deve inoltrare il segnale anche a quella operazione.

Esempio indipendente, da eseguire in un modulo o in una funzione async:

```js
if (typeof globalThis.scheduler?.postTask === "function") {
  const controller = new AbortController();
  const result = await scheduler.postTask(() => 21 * 2, {
    priority: "background",
    signal: controller.signal,
  });
  console.log(result); // 42
} else {
  console.log("postTask non disponibile");
}
```

`scheduler.yield()` permette di proseguire in una task successiva. Quando viene chiamato dentro un `postTask`, puo ereditare priorita e segnale di quel task; gestisci anche un eventuale rifiuto. Questa funzione sceglie un fallback che cede una task, senza pretendere le stesse priorita:

```js
function yieldToBrowser() {
  if (typeof globalThis.scheduler?.yield === "function") {
    return globalThis.scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}
```

Controlla separatamente le due funzionalita: la presenza di `scheduler` non garantisce tutti i suoi metodi. Verifica i browser target nelle fonti, invece di assumere una disponibilita uniforme.

## Esempio pratico

### Calcolo a blocchi con risultato ed abort

Questa variante di [[Programmazione/JavaScript/Pagine/Event Loop|sumInChunks nell'Event Loop]] aggiunge un budget temporale indicativo e un segnale. Usa la funzione `yieldToBrowser` precedente. Accetta un array denso di numeri finiti e non va chiamata su dati modificati durante l'elaborazione.

```js
async function sumWithBudget(values, {
  budgetMs = 4,
  batchSize = 250,
  signal,
} = {}) {
  if (!Array.isArray(values)) throw new TypeError("Atteso un array");
  if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
    throw new RangeError("Budget positivo richiesto");
  }
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) {
    throw new RangeError("batchSize deve essere un intero positivo");
  }

  let index = 0;
  let total = 0;
  signal?.throwIfAborted();

  while (index < values.length) {
    const start = performance.now();
    let count = 0;
    do {
      signal?.throwIfAborted();
      if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
        throw new TypeError("Ogni elemento deve essere un numero finito");
      }
      total += values[index];
      if (!Number.isFinite(total)) throw new RangeError("Somma fuori intervallo");
      index += 1;
      count += 1;
    } while (index < values.length && count < batchSize
      && performance.now() - start < budgetMs);

    if (index < values.length) {
      await yieldToBrowser();
      signal?.throwIfAborted();
    }
  }
  return total;
}
```

Uso in modulo:

```js
const calculation = new AbortController();
try {
  const total = await sumWithBudget([10, 20, 30, 40], {
    batchSize: 2,
    signal: calculation.signal,
  });
  console.log(total); // 100
} catch (error) {
  if (!calculation.signal.aborted) console.error(error);
}
```

Conserva il controller nel proprietario della vista e chiama `calculation.abort()` quando il risultato non serve piu. La prima porzione esegue prima del primo `await`; l'annullamento e cooperativo e viene controllato tra operazioni e dopo la pausa, non a meta di un'istruzione.

Il budget viene verificato **dopo** un'operazione: non e un limite rigido di durata. `batchSize` limita anche il numero di iterazioni quando il clock ha risoluzione grossolana. L'attesa avviata da `yieldToBrowser` non viene cancellata dal segnale passato a `sumWithBudget`: il controllo al ritorno impedisce di elaborare il blocco successivo.

## Varianti

- Per animazioni puramente visuali valuta CSS o Web Animations: non tutte richiedono un loop JavaScript.
- Per debounce conserva un timer e sostituiscilo a ogni input; non confonderlo con una limitazione di frequenza tramite throttle.
- Per calcoli che non si riescono a spezzare utilmente, valuta [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]], considerando il costo dei messaggi.
- Per polling reale aggiungi gestione della visibilita, backoff, errori permanenti e ciclo di vita della vista.

## Errori comuni

- Considerare timeout o idle timeout come scadenze di tempo reale.
- Usare `await Promise.resolve()` per garantire un aggiornamento visibile.
- Credere che `async`, `background` o un timer spostino il calcolo su un altro thread.
- Dimenticare che un singolo lavoro lungo puo superare qualsiasi budget cooperativo.
- Accodare nuove richieste con `setInterval` mentre le precedenti sono ancora in corso.
- Usare il timestamp assoluto di rAF come distanza o assumere 60 callback al secondo.
- Aspettarsi che un abort annulli effetti remoti gia prodotti.
- Non gestire errori dentro callback future o Promise restituite.

## Checklist

- Ogni operazione indivisibile e breve o viene spostata fuori dal main thread.
- E definito chi cancella timer, rAF, lavoro idle e richieste.
- Le API opzionali hanno feature detection e un fallback esplicito.
- Il completamento dei calcoli e osservabile e i rifiuti vengono gestiti.
- Schede in background e preferenza reduced motion sono considerate.
- Performance e reattivita vengono misurate su dati e dispositivi rappresentativi.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]

## Fonti

- [HTML Standard: timer e microtask](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html).
- [MDN: requestAnimationFrame, timestamp e cancellazione](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
- [W3C: requestIdleCallback e gestione dei timeout](https://www.w3.org/TR/requestidlecallback/).
- [MDN: scheduler.postTask](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask).
- [MDN: scheduler.yield e priorita ereditate](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

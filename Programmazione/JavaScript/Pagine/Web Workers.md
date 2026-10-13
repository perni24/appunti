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
  - web-workers
  - browser
  - performance
  - concurrency
aliases:
  - Worker JS
  - Web Worker
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/Scheduling Browser]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Optimization]]"
  - "[[Programmazione/JavaScript/Pagine/Service Workers e PWA]]"
  - "[[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays]]"
title: Web Workers
---

# Web Workers

## Sintesi

Un **Web Worker dedicato** esegue JavaScript in un contesto separato da quello della pagina, con un proprio event loop. Puo svolgere calcoli senza occupare direttamente il main thread; non rende pero gratuita la serializzazione dei dati, il rendering del risultato o l'uso della CPU.

La pagina e il worker comunicano con messaggi. `async` e `await`, da soli, non spostano un calcolo su un altro thread. Un Service Worker ha invece un ciclo di vita gestito dal browser e serve soprattutto a gestire rete ed eventi: non e un sostituto per calcoli lunghi.

## Quando usarlo

Usa un worker per parsing pesante, compressione, elaborazione immagini, calcoli numerici, ricerca su grandi dataset e trasformazioni costose. Misura prima il collo di bottiglia: una semplice somma di pochi numeri serve a mostrare il protocollo, non giustifica l'avvio di un thread.

Per una normale richiesta HTTP spesso basta `fetch` nel main thread: l'attesa della rete non blocca JavaScript. Puo essere utile spostare nel worker il lavoro CPU successivo alla risposta.

## Come funziona

### Contesto e prerequisiti

- Niente accesso diretto a DOM, `document`, `window` o `localStorage`. Il worker restituisce dati; la pagina aggiorna la UI.
- Sono disponibili molte API, per esempio Fetch, timer, IndexedDB e Web Crypto, con vincoli di compatibilita e contesto sicuro propri delle singole API.
- Servi gli esempi tramite HTTP su localhost o HTTPS, non aprendo file con `file://`. Lo script worker deve essere servito con MIME JavaScript e, per gli esempi qui, dalla stessa origine.
- Il thread puo essere eseguito in parallelo, ma non hai una garanzia sul numero di core o sul tempo di risposta. Un loop sincrono lungo blocca l'event loop del worker stesso.

### Worker base

Due file distinti, relativi alla pagina. Esempio minimo di scambio, senza timeout; nell'esempio pratico successivo il ciclo di vita e gestito completamente.

Pagina principale:

```js
const worker = new Worker("./worker.js");
worker.addEventListener("message", (event) => {
  console.log(event.data);
  worker.terminate();
}, { once: true });
worker.addEventListener("error", (event) => {
  console.error("Worker fallito", event.message);
  worker.terminate();
}, { once: true });
worker.postMessage({ type: "hello", name: "Luca" });
```

`worker.js`:

```js
self.addEventListener("message", (event) => {
  if (event.data?.type !== "hello" || typeof event.data.name !== "string") return;
  self.postMessage({ type: "greeting", text: `Ciao ${event.data.name}` });
});
```

`postMessage` accoda un messaggio: non restituisce il risultato del lavoro. I messaggi dello stesso canale mantengono l'ordine di invio, ma operazioni asincrone avviate dai listener possono completarsi in ordine diverso. Per piu richieste concorrenti usa ID univoci, una mappa delle richieste pendenti e una politica per risultati obsoleti e sovraccarico.

### Worker classici e moduli

Il tipo predefinito e `classic`; le dipendenze possono essere caricate con `importScripts`, che e sincrono. Nei worker `module` usa import ES, non `importScripts`.

In un file ES module della pagina:

```js
const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
  name: "calcoli",
});
```

La stringa relativa passata direttamente a `Worker` e risolta rispetto alla pagina; `new URL(..., import.meta.url)` rispetto al modulo che la costruisce. E una differenza importante con routing e bundler. Non costruire la URL da input non affidabile; verifica anche la CSP `worker-src` e la policy dello script worker.

### Dati copiati e trasferiti

La comunicazione usa **structured clone**, non JSON: supporta per esempio cicli, Map e typed array, ma non funzioni o nodi DOM. Il costo di preparare/copiarne grandi quantita puo incidere anche sul mittente. Le istanze di classi personalizzate non conservano automaticamente metodi, descrittori o campi privati.

Frammento da usare con un worker gia creato e un protocollo che accetti `bytes`:

```js
const bytes = new Uint8Array([10, 20, 30]);
worker.postMessage({ type: "bytes", bytes }, [bytes.buffer]);
console.log(bytes.byteLength); // 0: buffer sorgente distaccato
```

La transfer list trasferisce l'ArrayBuffer, non la typed array: il destinatario riceve i dati perche sono anche nel messaggio. Il trasferimento distacca il buffer e tutte le viste che lo usavano; se il job fallisce, non ottieni automaticamente indietro i dati. Conserva una copia prima del trasferimento solo se accetti quel costo.

`SharedArrayBuffer` e diverso: condivide memoria, non la trasferisce. Nel browser richiede le condizioni di isolamento cross-origin previste dalla piattaforma; sincronizza gli accessi con un protocollo e `Atomics`. Non usarlo come ottimizzazione automatica.

### Errori e terminazione

| Caso | Dove gestirlo |
| --- | --- |
| Creazione vietata o input non clonabile | `try/catch` attorno a costruttore o `postMessage` |
| Caricamento o errore runtime del worker | Evento `error` sul worker |
| Deserializzazione del messaggio fallita | Evento `messageerror` sul destinatario |
| Dato fuori dal contratto | Messaggio applicativo di errore, non necessariamente evento `error` |

`worker.terminate()` interrompe il worker dal chiamante; non aspettarti `finally`, un ACK o il completamento delle scritture. `self.close()` viene invece chiamato dentro il worker per chiuderlo. Entrambi richiedono una politica lato pagina per le richieste ancora pendenti.

Inviare `{ type: "cancel" }` non interrompe un loop sincrono in corso: il listener lo vedra solo quando potra elaborare un nuovo task. Per cancellazione cooperativa dividi il lavoro in blocchi e cedi il controllo all'event loop; una catena di sole microtask non basta a far elaborare i nuovi messaggi. In alternativa termina il worker, perdendo il suo stato.

## API / Sintassi

Schemi, non file autonomi: `url`, `message` e `transferables` sono input da definire.

```text
const worker = new Worker(url, { type: "module" });
worker.postMessage(message, transferables);
worker.addEventListener("message", onMessage);
worker.addEventListener("error", onError);
worker.addEventListener("messageerror", onMessageError);
```

Cleanup lato pagina:

```text
worker.terminate();
```

## Esempio pratico

Un worker dedicato **per singolo job**, terminato su successo, errore, timeout o abort. E semplice da gestire, ma per job frequenti conviene riusare worker con un protocollo piu articolato.

Due moduli affiancati: `sum-client.js` nella pagina e `sum-worker.js` nel worker. Input: array denso di massimo un milione di numeri finiti, con somma finita. Il risultato usa la normale aritmetica floating point, non e una somma esatta per contabilita. L'array viene copiato, non trasferito.

`sum-client.js`:

```js
export async function sumInWorker(numbers, { signal, timeoutMs = 5000 } = {}) {
  if (!Array.isArray(numbers) || numbers.length > 1_000_000) {
    throw new TypeError("Serve un array di dimensione limitata");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new RangeError("Timeout non valido");
  }
  if (signal !== undefined && !(signal instanceof AbortSignal)) {
    throw new TypeError("Serve un AbortSignal dello stesso realm");
  }
  signal?.throwIfAborted();

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./sum-worker.js", import.meta.url), {
      type: "module",
    });
    let settled = false;
    let timer;
    const finish = (ok, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.removeEventListener("messageerror", onMessageError);
      worker.terminate();
      if (ok) resolve(value);
      else reject(value);
    };
    const onAbort = () => finish(false, signal.reason);
    const onError = (event) => {
      event.preventDefault();
      finish(false, new Error(event.message || "Worker fallito"));
    };
    const onMessageError = () => finish(false, new Error("Messaggio non leggibile"));
    const onMessage = ({ data }) => {
      if (data?.id === "sum-1" && data.type === "result" && Number.isFinite(data.total)) {
        finish(true, data.total);
      } else if (data?.id === "sum-1" && data.type === "failure" && typeof data.message === "string") {
        finish(false, new Error(data.message));
      } else {
        finish(false, new Error("Risposta fuori protocollo"));
      }
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", onMessageError);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) { onAbort(); return; }
    timer = setTimeout(() => finish(false, new Error("Timeout del worker")), timeoutMs);
    try {
      worker.postMessage({ type: "sum", id: "sum-1", numbers });
    } catch (error) {
      finish(false, error);
    }
  });
}
```

`sum-worker.js`:

```js
self.addEventListener("message", ({ data }) => {
  const id = typeof data?.id === "string" && data.id.length <= 64 ? data.id : null;
  try {
    if (!id || data.type !== "sum" || !Array.isArray(data.numbers) || data.numbers.length > 1_000_000) {
      throw new TypeError("Richiesta non valida");
    }
    let total = 0;
    for (const number of data.numbers) {
      if (typeof number !== "number" || !Number.isFinite(number)) {
        throw new TypeError("Servono numeri finiti in un array denso");
      }
      total += number;
      if (!Number.isFinite(total)) throw new RangeError("Somma fuori intervallo");
    }
    self.postMessage({ type: "result", id, total });
  } catch (error) {
    self.postMessage({ type: "failure", id, message: error.message });
  }
});
```

Uso dalla pagina, in un altro modulo. Collega eventualmente `controller.abort()` al cleanup della vista o a un comando di annullamento:

```js
import { sumInWorker } from "./sum-client.js";

const controller = new AbortController();
try {
  const total = await sumInWorker([1, 2, 3, 4], { signal: controller.signal });
  console.log(total); // 10
} catch (error) {
  if (controller.signal.aborted) console.log("Calcolo annullato");
  else console.error("Calcolo fallito", error);
}
```

Il limite di tempo e un timer del main thread, non una deadline garantita: se la pagina e bloccata o sospesa il callback puo arrivare in ritardo. Non esiste una Promise implicita di `Worker`: e il wrapper a risolverla o rifiutarla e a rimuovere listener/timer. L'ID fisso e sufficiente solo perche ogni worker tratta un unico job.

## Varianti

- **Dedicated Worker**: un proprietario e comunicazione diretta, come negli esempi.
- **SharedWorker**: piu contesti compatibili della stessa origine possono comunicare tramite MessagePort. Con `addEventListener` chiama `port.start()`; chiudi le porte non piu necessarie. Verifica supporto e regole di partizionamento del browser.
- **Pool di worker**: numero limitato di worker riutilizzati, coda limitata e politica di cancellazione. Non creare un worker per ogni elemento di una lista.
- **OffscreenCanvas o WebAssembly nel worker**: utili per carichi specifici; non autorizzano accesso al DOM e vanno misurati nell'ambiente target.

### Limiti e sicurezza

Un worker non e una sandbox per codice ostile: puo usare rete e API dell'origine. Carica soltanto script affidabili e valida i messaggi. Messaggi persi per terminazione, risultati vecchi e memoria occupata dalle copie sono responsabilita del protocollo dell'applicazione.

## Errori comuni

- Passare funzioni, DOM o `AbortSignal` come se fossero un protocollo di cancellazione portabile.
- Usare `import.meta.url` in uno script classico o `importScripts` in un modulo.
- Confondere transfer con copia e riusare un buffer distaccato.
- Gestire soltanto `error` e lasciare senza risposta errori applicativi o deserializzazione fallita.
- Aspettarsi che un messaggio cancel interrompa il calcolo sincrono o che terminate esegua cleanup nel worker.
- Dichiarare la UI sempre fluida senza misurare copia, rendering e contesa della CPU.

## Checklist

- Definisci input, output, ID, limiti di dimensione e gestione dei risultati obsoleti.
- Mantieni DOM e aggiornamenti della UI nella pagina.
- Prova successo, input invalido, file worker mancante, messaggi malformati, timeout e abort.
- Rimuovi listener e timer, termina worker o chiudi porte nel cleanup.
- Prova percorsi reali del deploy, MIME, CSP e supporto nei browser scelti.
- Misura se conviene copiare, trasferire o non usare un worker.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/JavaScript/Pagine/Service Workers e PWA|Service Workers e PWA]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e copia degli oggetti]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]

## Fonti

- [MDN - Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [MDN - Worker e moduli](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker)
- [MDN - postMessage e transfer](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage)
- [MDN - messageerror](https://developer.mozilla.org/en-US/docs/Web/API/Worker/messageerror_event)
- [MDN - terminate](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate)
- [MDN - Structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
- [MDN - SharedArrayBuffer e sicurezza](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

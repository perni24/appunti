---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - nodejs
  - concorrenza
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]"
  - "[[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Child process|Child process]]"
  - "[[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]"
  - "[[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]"
title: Worker threads
---

# Worker threads

## Sintesi

I **worker thread** eseguono JavaScript in thread separati dello stesso processo Node.js. Servono soprattutto a spostare calcoli CPU-bound fuori dall'event loop principale. Una funzione `async` da sola non sposta il lavoro su un altro thread.

Ogni worker ha un proprio contesto JavaScript. Gli oggetti ordinari non diventano automaticamente condivisi: si comunicano dati con messaggi, trasferimenti espliciti o memoria condivisa. Un thread separato **non e una sandbox per codice non fidato**.

## Quando usarlo

- Calcoli numerici, parsing o trasformazioni costose implementate in JavaScript.
- Elaborazione immagini o dati quando il costo misurato giustifica thread e comunicazione.
- Job indipendenti con input, risultato e limiti dichiarati.

Per normali operazioni asincrone di rete o filesystem usa prima le API I/O. Anche diverse API asincrone native di crittografia e compressione usano gia il pool di libuv: non assumere che avvolgerle in un worker le renda piu veloci. Misura separatamente attesa, CPU JavaScript e costo della libreria.

Gli esempi usano **Node.js 24.14.0**, file ESM `.mjs` e nessuna dipendenza esterna. Non sono codice da eseguire nel browser o dentro Quartz.

## Come funziona

### Thread, processo e browser

| Strumento | Separazione | Uso tipico |
| --- | --- | --- |
| API I/O asincrone | Stesso event loop per le callback JS | Attesa di file o rete senza bloccare JS |
| `node:worker_threads` | Thread e contesto JS separati, stesso processo | Calcolo JavaScript |
| `node:child_process` | Processo distinto | Programmi esterni o runtime separati |
| Web Worker | Contesto del browser senza DOM della pagina | Calcolo lato client |

Un worker Node ha accesso alle API Node consentite dal processo, non al DOM. Il crash nativo o l'esaurimento globale delle risorse possono coinvolgere l'intero processo. Per eseguire codice ostile servono confini e policy ulteriori; neppure avviare un processo basta da solo.

### Ciclo di vita e contratto dei messaggi

`new Worker(...)` avvia il worker e puo gia fallire durante la costruzione, per esempio con dati non clonabili. Dopo la creazione si osservano gli eventi:

| Evento | Significato | Cosa non garantisce |
| --- | --- | --- |
| `online` | Il worker ha iniziato a eseguire JavaScript | Inizializzazione applicativa completata |
| `message` | Dato inviato dal worker | Chiusura, successo dell'intero job o schema valido |
| `messageerror` | Deserializzazione fallita | Recupero automatico |
| `error` | Eccezione non catturata; il worker viene terminato | Risultato parziale utilizzabile |
| `exit` | Il worker si e fermato; e l'ultimo evento | Che abbia prodotto il risultato richiesto |

I messaggi inviati arrivano prima di `exit`. Il callback Node riceve direttamente il valore: `worker.on("message", value => ...)`, non `event.data` come nel browser.

Per un job **one-shot** questa nota impone un messaggio `{ type: "result", value }`, seguito da uscita con codice zero. Anche un'uscita zero senza risultato e un errore del protocollo. Per un pool persistente serve invece un protocollo diverso con ID, risposte ed errori per job: non si aspetta l'uscita del thread a ogni richiesta.

## API / Sintassi

- `workerData`: input iniziale clonato al momento dell'avvio.
- `parentPort.postMessage(value)`: invia al chiamante dal worker.
- `worker.postMessage(value)`: invia a un worker gia avviato.
- `MessageChannel`: coppia di porte per un canale esplicito.
- `worker.terminate()`: richiede l'interruzione e restituisce una Promise che attende l'uscita.
- `worker.unref()`: consente al processo di finire se non restano altri handle che lo tengono attivo; **non cancella il job**.

Usa un URL relativo al modulo, come `new URL("./prime-worker.mjs", import.meta.url)`, per non dipendere dalla working directory. Non ricavare il file da input dell'utente.

## Esempio pratico

### 1. Calcolo e vincoli: prime.mjs

Conta i numeri primi minori o uguali al limite. L'algoritmo per divisioni successive e intenzionalmente semplice, non una scelta ottimizzata per grandi volumi. Il limite massimo protegge questo esempio da input arbitrariamente costosi.

```js
export function countPrimes(limit) {
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 1_000_000) {
    throw new RangeError("Expected an integer from 0 to 1000000");
  }

  let count = 0;
  for (let candidate = 2; candidate <= limit; candidate++) {
    let prime = true;
    for (let divisor = 2; divisor * divisor <= candidate; divisor++) {
      if (candidate % divisor === 0) {
        prime = false;
        break;
      }
    }
    if (prime) count++;
  }
  return count;
}
```

### 2. Entry point: prime-worker.mjs

```js
import { parentPort, workerData } from "node:worker_threads";
import { countPrimes } from "./prime.mjs";

if (parentPort === null) throw new Error("Run this file as a worker");

const value = countPrimes(workerData?.limit);
parentPort.postMessage({ type: "result", value });
parentPort.close();
```

La chiusura della porta non e un comando per arrestare qualunque risorsa: un timer o un server ancora attivo potrebbe mantenere il thread in vita. Qui il calcolo e puro e non apre altre risorse.

### 3. Attesa controllata: worker-client.mjs

Il wrapper e dedicato a **worker locali fidati, un solo risultato e nessun worker discendente**. Non usa `Promise.race` lasciando il calcolo attivo: dopo timeout, abort o protocollo errato richiede la terminazione e attende `exit`.

```js
import { Worker } from "node:worker_threads";

export async function runWorker(workerUrl, data, {
  signal,
  timeoutMs = 5_000,
  transferList = [],
} = {}) {
  if (!(workerUrl instanceof URL) || workerUrl.protocol !== "file:") {
    throw new TypeError("Expected a trusted local file URL");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new RangeError("Expected timeoutMs from 1 to 60000");
  }
  if (signal !== undefined && !(signal instanceof AbortSignal)) {
    throw new TypeError("Expected an AbortSignal");
  }
  signal?.throwIfAborted();

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, {
      workerData: data,
      transferList,
      execArgv: [],
      env: {},
    });
    let received = false;
    let value;
    let failure;

    function remember(error) {
      failure ??= error instanceof Error
        ? error
        : new Error("Worker failed", { cause: error });
    }
    function stop(error) {
      if (failure) return;
      remember(error);
      void worker.terminate().catch(remember);
    }
    function onAbort() {
      const error = new Error("Worker aborted", { cause: signal.reason });
      error.name = "AbortError";
      stop(error);
    }
    function onMessage(message) {
      if (failure) return;
      if (received || message === null || typeof message !== "object" ||
          Array.isArray(message) || Object.keys(message).length !== 2 ||
          message.type !== "result" || !Object.hasOwn(message, "value")) {
        stop(new Error("Invalid or duplicate worker result"));
        return;
      }
      received = true;
      value = message.value;
    }
    function onMessageError(error) {
      stop(error);
    }
    function onExit(code) {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      worker.off("message", onMessage);
      worker.off("messageerror", onMessageError);
      worker.off("error", remember);

      if (failure) reject(failure);
      else if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
      else if (!received) reject(new Error("Worker exited without a result"));
      else resolve(value);
    }

    const timer = setTimeout(() => stop(new Error("Worker timed out")), timeoutMs);
    worker.on("message", onMessage);
    worker.on("messageerror", onMessageError);
    worker.on("error", remember);
    worker.once("exit", onExit);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}
```

`execArgv: []` evita di ereditare i flag Node del chiamante; `env: {}` fornisce un ambiente vuoto al worker. Sono scelte del demo, non isolamento di sicurezza: un'applicazione reale puo richiedere loader o configurazione esplicita. Di default i flag vengono ereditati e l'ambiente copiato; `SHARE_ENV` abilita invece condivisione delle modifiche all'ambiente.

Il wrapper controlla la **busta del messaggio**, non il significato di qualunque `value`. Il chiamante valida lo schema del risultato della propria operazione. In particolare, ricevere un risultato e poi un'eccezione non deve trasformare un job fallito in successo.

### 4. Chiamante: main.mjs

Metti i quattro file nella stessa cartella.

```js
import { runWorker } from "./worker-client.mjs";

try {
  const limit = 100_000;
  const count = await runWorker(
    new URL("./prime-worker.mjs", import.meta.url),
    { limit },
  );
  if (!Number.isSafeInteger(count) || count < 0 || count > limit) {
    throw new TypeError("Unexpected prime count");
  }
  console.log(count);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Worker operation failed");
  process.exitCode = 1;
}
```

```sh
node main.mjs
```

Risultato atteso: `9592`. Il demo non scrive file e non accede alla rete. Per un numero cosi contenuto il costo di avviare il worker puo superare il beneficio: serve a verificare il flusso completo, non a dimostrare un miglioramento di prestazioni.

## Varianti

### Copia, trasferimento e memoria condivisa

I messaggi usano structured clone: funzioni non clonabili, prototipi di classi e accessor non preservati, un `Buffer` ricevuto come `Uint8Array`. Progetta dati espliciti, non oggetti con comportamenti impliciti.

Esempio autonomo `transfer.mjs`: usa lo stesso meccanismo di messaggistica, qui tra due porte nello stesso thread.

```js
import { MessageChannel } from "node:worker_threads";
import { once } from "node:events";

const { port1, port2 } = new MessageChannel();
try {
  const bytes = new Uint8Array([1, 2, 3]);
  const alias = bytes.subarray(1);
  const waiting = once(port2, "message");
  port1.postMessage({ bytes }, [bytes.buffer]);

  console.log(bytes.byteLength, alias.byteLength);
  const [message] = await waiting;
  console.log([...message.bytes].join(","));
} finally {
  port1.close();
  port2.close();
}
```

```sh
node transfer.mjs
```

Stampa `0 0`, poi `1,2,3`: il buffer e trasferito e tutte le viste del mittente sono distaccate. La transfer list non sostituisce il payload: il destinatario deve poter raggiungere il buffer attraverso i dati inviati. Un errore del job non restituisce automaticamente l'ownership al mittente.

Non trasferire alla cieca `buffer.buffer` di un `Buffer`: puo appartenere a un pool o essere condiviso con altre viste, e non tutti i buffer sono trasferibili. Il demo alloca una `Uint8Array` di proprieta nota. Approfondimenti in [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]] e [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]].

`SharedArrayBuffer` resta condiviso e non va nella transfer list. Richiede un protocollo di sincronizzazione, per esempio con `Atomics`; non usare normali letture/scritture concorrenti come se fossero una transazione. I requisiti di isolamento cross-origin del browser non vanno applicati per analogia a Node.

### Pool e pressione sul sistema

Per job frequenti riusa un numero limitato di worker. Aggiungi una coda con capacita massima, una politica quando e piena, timeout comprensivo dell'attesa e ID per riconoscere risposte tardive. `postMessage` non fornisce da solo un limite applicativo alla coda.

`os.availableParallelism()` e una stima utile come punto di partenza, non il numero obbligatorio di worker. Lascia risorse per il thread principale e misura latenza, memoria, CPU e costo di serializzazione. Un pool va sostituito o riparato quando un thread termina, senza riprovare automaticamente operazioni con effetti non idempotenti.

### Cancellazione e limiti

Un messaggio `cancel` non interrompe un loop sincrono: il worker deve tornare al suo event loop o controllare un segnale condiviso. `terminate()` e piu drastico: non promette esecuzione di `finally`, rollback o completamento delle scritture. Per questo il demo usa un calcolo puro.

Il timeout del wrapper dipende dal timer del chiamante: un main thread bloccato lo ritarda. Non e una deadline real-time; l'esito attende anche l'uscita del worker.

`resourceLimits` puo limitare parti del motore JavaScript del worker, ma non e un tetto generale alla RAM: per esempio non include la memoria di `ArrayBuffer`. Per limiti globali di memoria/CPU servono strumenti e policy del sistema operativo. Non usare queste opzioni come garanzia contro codice non fidato.

## Errori comuni

- Risolvere alla prima risposta ignorando un successivo errore o un thread ancora attivo.
- Rimanere in attesa per sempre quando il worker esce con codice zero senza messaggio.
- Creare un worker per ogni richiesta senza limitare worker e coda.
- Passare funzioni, istanze complesse o buffer senza una politica di ownership.
- Credere che `unref()`, `parentPort.close()` e `terminate()` siano equivalenti.
- Confondere worker Node e Web Workers o presumere un isolamento di sicurezza.
- Usare un timeout come se fosse rollback o prova di completamento delle operazioni esterne.

## Checklist

- Il collo di bottiglia e davvero JavaScript CPU-bound?
- File, formato ESM, input e schema del risultato sono espliciti?
- Errori di costruzione, `error`, protocollo, uscita e abort hanno un esito?
- Timer e listener vengono rimossi quando il thread termina?
- Sono limitati input, worker attivi, coda e dimensioni dei messaggi?
- Copie, transfer e memoria condivisa hanno ownership e sincronizzazione chiare?
- Le operazioni interrotte hanno una strategia per eventuali effetti parziali?

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Child process|Child process]]
- [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]]

## Fonti

- [Node.js 24.14.0: worker_threads, lifecycle, messaggi e resourceLimits](https://nodejs.org/download/release/v24.14.0/docs/api/worker_threads.html).
- [Node.js 24.14.0: os.availableParallelism](https://nodejs.org/download/release/v24.14.0/docs/api/os.html#osavailableparallelism).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

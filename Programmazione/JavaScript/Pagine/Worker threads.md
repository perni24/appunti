---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - nodejs
  - concorrenza
aliases: []
prerequisites: []
related: []
---

# Worker threads

## Sintesi

I **worker threads** permettono a Node.js di eseguire codice JavaScript in thread separati. Sono utili per lavoro CPU-bound che bloccherebbe l'event loop principale.

## Quando usarlo

### Quando usarli
- Compressione o cifratura pesante.
- Elaborazione immagini.
- Parsing grande e costoso.
- Calcoli numerici.
### Quando evitarli
- Operazioni I/O-bound normali.
- Task piccoli dove il costo di creazione del worker supera il beneficio.
- Condivisione di stato complessa.

## Come funziona

### Concetto chiave
Node.js gestisce bene I/O concorrente, ma il codice JavaScript CPU-bound gira su un singolo thread. I worker spostano calcoli pesanti fuori dal thread principale.

```javascript
import { Worker } from "node:worker_threads";

const worker = new Worker("./worker.js");

worker.on("message", result => {
  console.log(result);
});
```

## API / Sintassi

In Node.js i worker thread si usano tramite il modulo `worker_threads`.

```javascript
import { Worker, parentPort, workerData } from "node:worker_threads";
```

Nel thread principale crei un `Worker`:

```javascript
const worker = new Worker(new URL("./worker.js", import.meta.url), {
  workerData: { input: 42 },
});

worker.on("message", (result) => {
  console.log(result);
});
```

Nel file worker usi `parentPort` per comunicare:

```javascript
parentPort.postMessage(workerData.input * 2);
```

## Esempio pratico

Esempio per spostare lavoro CPU-bound fuori dal thread principale:

```javascript
// main.js
import { Worker } from "node:worker_threads";

function runJob(payload) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./job.js", import.meta.url), {
      workerData: payload,
    });

    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker exited with ${code}`));
      }
    });
  });
}
```

```javascript
// job.js
import { parentPort, workerData } from "node:worker_threads";

const result = heavyCalculation(workerData);
parentPort.postMessage(result);
```

## Varianti

- **Worker singolo**: utile per job rari o molto pesanti.
- **Worker pool**: riusa un numero fisso di worker per molti job.
- **Transferable objects**: trasferiscono buffer senza copiarli.
- **SharedArrayBuffer**: memoria condivisa, da usare solo con sincronizzazione chiara.
- **Child process**: alternativa piu isolata, con processo separato.

## Errori comuni

- Usare worker thread per I/O normale, dove async I/O di Node.js basta gia.
- Creare troppi worker invece di usare un pool.
- Passare grandi oggetti copiati invece di usare transfer quando possibile.
- Dimenticare gestione di `error` ed `exit`.
- Condividere memoria senza una strategia chiara di sincronizzazione.

## Checklist

- Usa worker thread solo per lavoro CPU-bound.
- Limita il numero di worker attivi.
- Gestisci `message`, `error` ed `exit`.
- Valuta un worker pool per job frequenti.
- Misura overhead di serializzazione e trasferimento dati.
- Evita stato condiviso se non e necessario.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]

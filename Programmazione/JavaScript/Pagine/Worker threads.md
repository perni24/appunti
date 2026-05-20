---
date: 2026-05-20
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

## Concetto chiave

Node.js gestisce bene I/O concorrente, ma il codice JavaScript CPU-bound gira su un singolo thread. I worker spostano calcoli pesanti fuori dal thread principale.

```javascript
import { Worker } from "node:worker_threads";

const worker = new Worker("./worker.js");

worker.on("message", result => {
  console.log(result);
});
```

## Quando usarli

- Compressione o cifratura pesante.
- Elaborazione immagini.
- Parsing grande e costoso.
- Calcoli numerici.

## Quando evitarli

- Operazioni I/O-bound normali.
- Task piccoli dove il costo di creazione del worker supera il beneficio.
- Condivisione di stato complessa.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Web Workers|Web Workers]]
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]



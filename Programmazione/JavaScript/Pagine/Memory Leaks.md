---
date: 2026-02-23
tags: [javascript, programming, memory, optimization]
type: #permanent-note
status: budding
---

# Memory Leaks in JavaScript

Un **Memory Leak** (perdita di memoria) si verifica quando un'applicazione alloca della memoria che non è più necessaria, ma che non viene rilasciata dal [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collector]]. Se questi accumuli continuano nel tempo, possono rallentare l'applicazione o causarne il crash.

## 1. Cause Comuni di Memory Leaks

Sebbene JavaScript gestisca la memoria automaticamente, alcune sviste nel codice possono impedire al Garbage Collector di funzionare correttamente.

### Variabili Globali Accidentali
Se dimentichi di dichiarare una variabile con `let`, `const` o `var`, questa viene creata nell'oggetto globale (`window` nel browser). Le radici globali non vengono mai rimosse finché l'applicazione è attiva.

```javascript
function creaLeak() {
    leak = "Sono una globale accidentale"; // Manca let/const
}
```

### Timer o Callback Dimenticati
`setInterval` continuerà a girare all'infinito se non viene esplicitamente fermato con `clearInterval`. Finché il timer è attivo, tutti i dati usati all'interno della sua callback non possono essere eliminati.

```javascript
const datiPesanti = caricamentoDatiConfig();
setInterval(() => {
    // Se non fermiamo questo intervallo, datiPesanti resterà in memoria per sempre
    console.log(datiPesanti);
}, 1000);
```

### Closures
Le [[Programmazione/JavaScript/Pagine/Closures|closures]] mantengono il riferimento al loro scope lessicale. Una funzione interna può trattenere involontariamente oggetti grandi presenti nella funzione esterna, anche se non li usa direttamente.

### Riferimenti DOM esterni
Mantenere un riferimento a un elemento DOM in una variabile JavaScript impedisce al Garbage Collector di rimuoverlo, anche se l'elemento è stato rimosso dalla pagina (DOM tree).

```javascript
let pulsante = document.getElementById('btn-rimuovi');
document.body.removeChild(pulsante); // Rimosso dalla pagina
// Pulsante è ancora in memoria perché la variabile 'pulsante' esiste ancora
```

## 2. Come Rilevarli

Il modo migliore per identificare un memory leak è usare il tab **Memory** nei **Chrome DevTools**:
1. Esegui uno "Heap Snapshot" all'inizio dell'attività.
2. Esegui le operazioni sospette nell'applicazione.
3. Esegui un secondo snapshot e confrontali. Se la memoria allocata cresce costantemente senza mai tornare ai livelli base, c'è un leak.

> [!TIP] Prevenzione
> - Usa sempre **`"use strict";`** per evitare variabili globali accidentali.
> - Rimuovi sempre i listener (`removeEventListener`) e i timer quando un componente o una pagina vengono distrutti.
> - Usa `WeakMap` o `WeakSet` quando possibile (approfondito in [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]]).

---

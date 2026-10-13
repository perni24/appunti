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
  - garbage-collection
  - memory
  - performance
aliases:
  - GC JavaScript
  - Garbage Collector
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Memory Lifecycle]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Memory Leaks]]"
  - "[[Programmazione/JavaScript/Pagine/WeakMap e WeakSet]]"
  - "[[Programmazione/JavaScript/Pagine/Optimization]]"
title: Garbage Collection
---

# Garbage Collection

## Sintesi

La **garbage collection** recupera memoria che il runtime non deve piu conservare per l'esecuzione del programma. Il modello pratico per gli oggetti e la raggiungibilita: un oggetto ancora raggiunto da riferimenti forti non diventa inutile per il collector solo perche l'applicazione ha finito di usarlo.

Un oggetto irraggiungibile puo essere raccolto, ma non e garantito quando. Il GC non sostituisce il cleanup di listener, timer, connessioni o altre risorse.

## Quando usarlo

Consulta questa nota per interpretare cicli di riferimenti, picchi di memoria, pause del collector e heap snapshot. Per assegnazione, alias e proprieta del cleanup parti da [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]].

Gli snippet sono indipendenti e non richiedono di forzare il GC. Gli esempi con WeakRef e FinalizationRegistry richiedono un runtime che implementi queste API; quello con `node:process` e solo per Node.js.

## Come funziona

### Raggiungibilita: conta il percorso, non il numero di riferimenti

Il collector parte da punti che il runtime deve mantenere vivi, detti **root**, e segue i riferimenti forti. Possono intervenire contesti di esecuzione, ambienti globali e riferimenti mantenuti dall'host; i dettagli non sono una lista universale fissata da ECMAScript.

Una closure non e automaticamente una root: deve essere raggiungibile a sua volta. Anche un listener su un nodo DOM completamente irraggiungibile non rende eterno quel nodo. Diverso e un listener ancora registrato su `window`, che puo mantenere una catena verso i dati del componente.

```js
let user = { name: "Luca" };
const alias = user;

user = null;
console.log(alias.name); // Luca: esiste ancora un riferimento forte.
```

Cambiare un binding toglie un collegamento. Non elimina gli altri alias, le voci delle Map o i riferimenti conservati nelle callback.

### Mark and sweep e cicli

Il modello di tracing piu semplice si descrive con due fasi:

1. **Mark**: visita gli oggetti raggiungibili dai punti di partenza.
2. **Sweep**: rende riutilizzabile lo spazio degli oggetti non marcati.

Alcuni collector spostano anche gli oggetti vivi, tramite copia o compattazione. Questi dettagli non cambiano l'identita osservabile degli oggetti JS.

```js
function inspectCycle() {
  const first = { name: "first" };
  const second = { name: "second" };

  first.other = second;
  second.other = first;

  return first.other.other === first;
}

console.log(inspectCycle()); // true
```

Dalla funzione esce solo un booleano. I due oggetti si riferiscono tra loro, ma non viene conservato un percorso esterno per raggiungerli: il ciclo non impedisce da solo la raccolta.

Un **reference counting semplice** conterebbe invece i riferimenti entranti: entrambi i conteggi resterebbero positivi per via del ciclo. Questo spiega il limite di quella tecnica, non significa che ogni sottosistema del browser usi lo stesso algoritmo. I motori JS e le risorse native possono combinare strategie diverse.

### Generazioni e costo delle allocazioni

Nei collector generazionali si distinguono oggetti giovani e longevi, sfruttando il fatto che molti oggetti temporanei durano poco. Una raccolta della generazione giovane puo fare meno lavoro di una visita estesa all'heap.

“Minor” e “major” descrivono raccolte con ambiti diversi, non una cadenza obbligatoria. Promozione, dimensioni delle generazioni e soglie sono scelte del motore e cambiano fra versioni. Gli oggetti longevi possono essere raccolti: non sono permanenti.

Se un oggetto vecchio punta a uno giovane, quel collegamento deve comunque essere considerato. Le implementazioni possono registrare queste scritture con **write barrier** e strutture di riferimenti ricordati, senza ripercorrere ogni volta tutti gli oggetti vecchi.

Non dedurre che ogni oggetto temporaneo sia costoso: JIT e rappresentazioni interne possono evitare lavoro. Prima di introdurre pooling o riuso manuale, misura un carico rappresentativo.

### Pause: incrementale, parallelo e concorrente

| Tecnica | Idea | Limite |
| --- | --- | --- |
| Incrementale | Suddivide una fase in porzioni intervallate all'applicazione | Richiede di tenere conto delle modifiche fra le porzioni |
| Parallela | Piu thread del collector collaborano sulla stessa fase | Puo avvenire mentre il codice applicativo e sospeso |
| Concorrente | Parte del collector lavora mentre procede l'applicazione | Servono sincronizzazione e gestione delle scritture |
| Compattazione | Sposta oggetti vivi per riordinare lo spazio | Ha un costo e non viene applicata sempre a tutto l'heap |

Queste tecniche possono coesistere. Non significano assenza di pause: alcune fasi richiedono ancora coordinamento o sospensioni. Un motore puo sfruttare periodi di inattivita, ma non promette di lavorare solo quando l'app e idle. V8 e un esempio documentato, non una specifica comune a tutti i motori.

### Raccolta, riuso e memoria del processo

Distingui tre eventi:

1. L'applicazione smette di rendere raggiungibile un dato.
2. Il runtime recupera spazio per nuove allocazioni.
3. Il processo restituisce eventualmente pagine di memoria al sistema operativo.

Non sono simultanei. Anche dopo una raccolta, il runtime puo conservare spazio per riutilizzarlo; una memoria di processo che non cala immediatamente non dimostra un leak.

## API / Sintassi

JavaScript standard non offre un `free(object)` o un comando portabile che garantisca una raccolta immediata.

| Strumento | Uso corretto | Non usarlo per |
| --- | --- | --- |
| `null`, `delete`, `Map.delete`, `Map.clear` | Togliere specifici riferimenti applicativi | Distruggere oggetti condivisi |
| `WeakMap` / `WeakSet` | Associare informazioni senza trattenere fortemente le chiavi o gli elementi | Enumerare gli oggetti gia raccolti |
| `WeakRef` | Provare a recuperare un target che puo non esserci piu | Garantire disponibilita o scadenze |
| `FinalizationRegistry` | Registrare una notifica di finalizzazione eventuale | Chiudere risorse essenziali in tempo |
| Heap snapshot / profiler | Analizzare allocazioni e percorsi che trattengono dati | Dimostrare un leak da un singolo numero |

`gc()` disponibile in alcuni ambienti di debug o con opzioni specifiche del runtime non e una API ECMAScript da usare nella logica applicativa. Anche una raccolta richiesta da uno strumento non offre una scadenza per ogni finalizer.

## Esempio pratico

### Una Map mantiene raggiungibile l'intero ciclo

```js
function createPair() {
  const first = { name: "first" };
  const second = { name: "second" };
  first.other = second;
  second.other = first;
  return first;
}

const registry = new Map();
registry.set("pair", createPair());

console.log(registry.get("pair").other.name); // second
console.log(registry.delete("pair")); // true
console.log(registry.size); // 0
```

Finche la Map raggiungibile conserva la voce, entrambi gli oggetti sono accessibili. La cancellazione toglie quel percorso. In questo esempio non viene conservato un altro alias; in un'app reale potrebbe esserci una variabile, una closure o un'altra collezione che raggiunge ancora la coppia.

Non serve spezzare ogni collegamento interno del ciclo solo per aiutare un collector tracing. Serve rimuovere i riferimenti esterni che non hanno piu uno scopo.

### Leggere una WeakRef senza assumere la presenza del target

```js
function readWeakLabel(reference) {
  const value = reference.deref();
  return value === undefined ? null : value.label;
}

let item = { label: "cache-1" };
const reference = new WeakRef(item);
console.log(readWeakLabel(reference)); // cache-1

item = null;
```

Il contratto dell'esempio e una WeakRef a un oggetto ordinario con `label` stringa. In una chiamata successiva la funzione restituisce la label oppure `null` se il target non e disponibile; il chiamante deve gestire entrambi i casi.

La creazione della WeakRef e un `deref()` riuscito mantengono il target vivo almeno nel job corrente secondo le regole del linguaggio. Non aspettarti `undefined` immediatamente dopo `item = null`, e nemmeno dopo un timeout arbitrario. Conservare il risultato di `deref()` in una struttura longeva crea un nuovo riferimento forte.

### Registrare e annullare una finalizzazione

```js
const finalizers = new FinalizationRegistry((label) => {
  console.log("Finalizzazione osservata:", label);
});

const token = {};

{
  const item = { id: "record-1" };
  finalizers.register(item, item.id, token);
}

console.log(finalizers.unregister(token)); // true
console.log(finalizers.unregister(token)); // false
```

Questo esempio **annulla volontariamente** la registrazione: mostra il contratto di `register`/`unregister`, non attende una raccolta. Il token identifica le registrazioni da rimuovere; non distrugge il target.

Senza annullamento, la callback potrebbe essere invocata dopo la raccolta, molto piu tardi o mai. Non affidarle salvataggi, rilascio di lock o chiusure necessarie. Anche il registry deve restare vivo perche una notifica possa essere utile.

Il valore associato viene conservato fortemente: passa un identificatore piccolo, non un contenitore che rimanda al target. `register(item, item)` e rifiutato; `register(item, { item })` e consentito ma mantiene vivo il target tramite il valore associato. Anche catturare il target nella callback puo vanificare la finalizzazione.

## Varianti

### Diagnosi nel browser

Una procedura ripetibile e piu utile di un test che aspetta “abbastanza”:

1. Porta l'app a uno stato stabile dopo l'inizializzazione.
2. Acquisisci uno snapshot iniziale senza conservare in console gli oggetti da studiare.
3. Ripeti lo stesso ciclo, per esempio apri una vista, interagisci e chiudila.
4. Attendi la normale conclusione delle operazioni avviate e torna allo stesso stato.
5. Confronta uno snapshot successivo: quali istanze crescono, chi le trattiene, il cleanup e stato chiamato?
6. Correggi il percorso sospetto e ripeti lo stesso scenario.

La **shallow size** riguarda l'oggetto in se; la **retained size** stima anche cio che diverrebbe raccoglibile perdendo quel trattenitore. Non sommare ingenuamente retained size sovrapposte. Esamina i percorsi verso le root e distingui cache volute da crescita non limitata.

Snapshot e profiler alterano il contesto osservato; console e debugger possono trattenere oggetti. Gli snapshot possono contenere dati dell'applicazione: trattali come diagnostica potenzialmente sensibile.

### Metriche in Node.js

Modulo ESM, per esempio un file `.mjs`, su Node.js:

```js
import { memoryUsage } from "node:process";

const { rss, heapTotal, heapUsed, external, arrayBuffers } = memoryUsage();
console.table({ rss, heapTotal, heapUsed, external, arrayBuffers });
```

I valori sono in byte:

- `heapUsed`: heap V8 attualmente utilizzato.
- `heapTotal`: spazio dell'heap V8 allocato dal runtime, non tutta la memoria del processo.
- `external`: memoria di oggetti C++ associati a oggetti JS gestiti da V8.
- `arrayBuffers`: memoria di ArrayBuffer e SharedArrayBuffer, inclusi i Buffer Node; e gia compresa in `external`.
- `rss`: memoria residente del processo, che comprende anche componenti non rappresentate da `heapUsed`.

Non sommare tutte le metriche: alcune si sovrappongono. Con Worker, RSS riguarda l'intero processo mentre le altre metriche riguardano il thread corrente. Confronta serie di misure in condizioni simili, non differenze esatte attorno a una singola istruzione.

## Errori comuni

- Considerare un ciclo di riferimenti una prova automatica di leak.
- Chiamare “root” qualunque closure o nodo DOM senza cercare il percorso esterno.
- Aspettarsi che `null` causi un calo immediato di RSS.
- Deducere tempi di raccolta dalla fine dello scope o dalla durata di un timeout.
- Usare WeakRef come cache con scadenza garantita.
- Trattenere il target nei valori o nelle callback del FinalizationRegistry.
- Ottimizzare allocazioni senza profilo, aumentando complessita e dati longevi.
- Considerare un test del cleanup una prova di rilascio fisico della memoria.

## Checklist

- Il percorso che trattiene i dati e identificato, non soltanto ipotizzato.
- Alias, Map, callback e riferimenti host sono considerati separatamente.
- Il cleanup e esplicito e la logica non dipende dal GC.
- I cicli sono valutati in base alla raggiungibilita esterna.
- Le misure distinguono heap, buffer e memoria di processo.
- Le conclusioni derivano da scenari ripetibili e piu osservazioni.
- Nei test si verificano effetti e contratti delle API, non istanti di raccolta.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]

## Fonti

- [MDN: gestione della memoria](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management).
- [ECMAScript: gestione della memoria, WeakRef e FinalizationRegistry](https://tc39.es/ecma262/multipage/managing-memory.html).
- [V8: panoramica del collector Orinoco](https://v8.dev/blog/trash-talk).
- [V8: marking concorrente e write barrier](https://v8.dev/blog/concurrent-marking).
- [MDN: WeakRef e garanzie del job corrente](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef).
- [MDN: FinalizationRegistry e limiti della finalizzazione](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry).
- [Chrome DevTools: heap snapshot e confronto delle allocazioni](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots).
- [Node.js 24: process.memoryUsage](https://nodejs.org/docs/latest-v24.x/api/process.html#processmemoryusage).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

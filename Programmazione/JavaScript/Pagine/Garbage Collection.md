---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, garbage-collection, memory, performance]
aliases: [GC JavaScript, Garbage Collector]
prerequisites: [Memory Lifecycle]
related: [Memory Leaks, WeakMap e WeakSet, Optimization]
---

# Garbage Collection

## Sintesi

La garbage collection e il processo con cui il motore JavaScript libera memoria occupata da valori non piu raggiungibili.

Il programmatore non libera memoria manualmente, ma deve evitare di mantenere riferimenti inutili.

---

## Quando usarlo

Consulta questa nota quando vuoi capire perche un oggetto resta in memoria o perche il garbage collector non elimina subito dati non piu usati.

Serve soprattutto per:

- analizzare memory leak;
- ridurre allocazioni in percorsi critici;
- capire riferimenti circolari;
- progettare cache;
- interpretare heap snapshot;
- distinguere cleanup esplicito da raccolta automatica.

## Come funziona

### Raggiungibilita
Il concetto chiave e la raggiungibilita.

Un oggetto e mantenuto in memoria se puo essere raggiunto partendo da una root.

Root comuni:

- oggetto globale;
- variabili locali nello stack;
- closure attive;
- code di task e microtask;
- riferimenti DOM ancora vivi;
- timer e listener registrati.

```js
let user = { name: "Luca" };

user = null;
```

Se nessun altro riferimento punta all'oggetto, il garbage collector potra liberarlo.

---
### Mark and sweep
I motori moderni usano varianti di mark and sweep.

Fasi semplificate:

- mark: il collector parte dalle root e marca tutti gli oggetti raggiungibili;
- sweep: gli oggetti non marcati vengono considerati garbage;
- compact o optimize: in alcuni casi la memoria viene riorganizzata.

Questo risolve anche i riferimenti circolari non raggiungibili.

```js
let a = {};
let b = {};

a.other = b;
b.other = a;

a = null;
b = null;
```

Anche se i due oggetti si riferiscono a vicenda, possono essere raccolti se non sono raggiungibili da root.

---
### Reference counting
Il reference counting storico contava quanti riferimenti puntavano a un oggetto.

Il problema principale erano i cicli.

```js
const a = {};
const b = {};

a.b = b;
b.a = a;
```

Se nessuno dall'esterno raggiunge `a` o `b`, mark and sweep puo liberarli; un reference counting semplice no.

---
### GC generazionale
Molti motori distinguono oggetti giovani e oggetti vecchi.

Idea pratica:

- molti oggetti muoiono rapidamente;
- gli oggetti che sopravvivono a piu cicli vengono promossi;
- controllare spesso gli oggetti giovani e piu efficiente.

Questa e una semplificazione: i dettagli cambiano tra motori e versioni.

---
### Pause e performance
La garbage collection consuma tempo CPU.

I motori moderni usano tecniche incrementali, concorrenti e in idle time per ridurre pause visibili, ma una pressione eccessiva sulla memoria puo comunque causare rallentamenti.

Cause frequenti:

- allocazioni massicce in loop;
- creazione continua di oggetti temporanei;
- cache senza limite;
- DOM node trattenuti dopo la rimozione.

---
### Non determinismo
Non puoi decidere in modo affidabile quando il garbage collector verra eseguito.

```js
let data = buildLargeObject();

data = null;
```

Questo rende l'oggetto candidabile alla raccolta, ma non forza una raccolta immediata.

---

## API / Sintassi

JavaScript standard non espone una API affidabile per forzare garbage collection.

Quello che puoi fare e rendere gli oggetti non piu raggiungibili:

```js
let data = buildLargeObject();

data = null;
```

Oppure rimuovere riferimenti da strutture longeve:

```js
cache.delete(key);
listeners.delete(listener);
clearInterval(intervalId);
```

Per debugging usa strumenti del runtime, non logica applicativa che dipende dal momento esatto della GC.

## Esempio pratico

Riferimento circolare raccoglibile:

```js
let first = {};
let second = {};

first.second = second;
second.first = first;

first = null;
second = null;
```

Il ciclo interno non basta a mantenere vivi gli oggetti. Se nessuna root li raggiunge, il garbage collector puo liberarli.

Riferimento circolare non raccoglibile se resta una root:

```js
const registry = [];

const first = {};
const second = {};

first.second = second;
second.first = first;

registry.push(first);
```

Qui `registry` mantiene raggiungibile l'intero ciclo.

## Varianti

- **Mark and sweep**: marca oggetti raggiungibili e libera gli altri.
- **GC generazionale**: ottimizza oggetti giovani e longevi.
- **Incremental GC**: divide il lavoro in parti piu piccole.
- **Concurrent GC**: svolge parte del lavoro fuori dal thread principale.
- **Compaction**: riorganizza memoria per ridurre frammentazione.
- **Weak references**: non impediscono la raccolta.

## Errori comuni

- Pensare che `obj = null` liberi subito memoria.
- Usare il garbage collector come sostituto del cleanup.
- Creare molte allocazioni temporanee in percorsi hot.
- Conservare cache senza eviction.
- Dimenticare che listener e timer sono root pratiche.

---

## Checklist

### Checklist operativa
- Rimuovi riferimenti non necessari.
- Limita cache e strutture dati longeve.
- Pulisci listener, interval e subscription.
- Riduci allocazioni ripetute in codice critico.
- Usa snapshot memoria per verificare, non intuizioni.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]

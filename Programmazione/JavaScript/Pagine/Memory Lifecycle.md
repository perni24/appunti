---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - memory
  - heap
  - stack
  - performance
aliases:
  - Ciclo di vita memoria JS
  - JavaScript Memory Lifecycle
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Garbage Collection]]"
  - "[[Programmazione/JavaScript/Pagine/Memory Leaks]]"
  - "[[Programmazione/JavaScript/Pagine/WeakMap e WeakSet]]"
  - "[[Programmazione/JavaScript/Pagine/Optimization]]"
title: Memory Lifecycle
---

# Memory Lifecycle

## Sintesi

Il ciclo di vita della memoria comprende **allocazione, utilizzo e recupero** dello spazio non piu necessario. JavaScript delega al runtime la gestione della memoria dei valori, ma l'applicazione resta responsabile della durata dei riferimenti e delle risorse che apre.

Due problemi diversi: un oggetto puo restare raggiungibile anche se non serve piu, oppure una risorsa puo richiedere una chiusura esplicita. Il garbage collector non sostituisce `clearInterval`, la rimozione di un listener o la chiusura di una connessione.

## Quando usarlo

Consulta questa nota per ragionare su durata di dati, closure, componenti, cache e operazioni asincrone. Per gli algoritmi del collector vedi [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]; per la diagnosi dettagliata dei riferimenti indesiderati vedi [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]].

Gli esempi sono indipendenti, salvo i blocchi HTML/avvio/cleanup del widget, che appartengono allo stesso caso d'uso. Non misurano il momento in cui la memoria viene materialmente restituita.

## Come funziona

### Allocazione, uso e recupero

1. **Allocazione**: la creazione di valori e strutture puo richiedere memoria.
2. **Uso**: il programma legge o modifica i dati.
3. **Recupero**: il runtime puo riutilizzare memoria che non serve piu a conservare il comportamento osservabile del programma.

```js
function readName() {
  const user = { name: "Luca", active: true };
  return user.name;
}

console.log(readName()); // Luca
```

Il chiamante riceve una stringa, non l'oggetto `user`. Non esce un riferimento a quell'oggetto. Questo non obbliga il motore ad allocarlo fisicamente e poi raccoglierlo: un'ottimizzazione puo anche evitare l'allocazione.

Essere candidabile alla raccolta, essere raccolto e vedere calare la memoria del processo sono **tre cose diverse**.

### Stack e heap: modello utile, non una regola sui tipi

Lo stack delle chiamate descrive le esecuzioni attive. Una chiamata puo introdurre un frame; al ritorno non resta una chiamata attiva di quella funzione. L'heap e il modello usuale per oggetti con vita dinamica.

Non tradurre questa distinzione in “ogni primitivo vive nello stack e ogni oggetto nell'heap”. ECMAScript descrive valori, binding e contesti di esecuzione, non una posizione fisica obbligatoria per ogni variabile. Registri, rappresentazioni interne, eliminazione di allocazioni e compilazione JIT sono scelte del motore.

La fine di una chiamata non implica la scomparsa dei suoi dati:

```js
function createCounter() {
  let count = 0;
  return () => {
    count += 1;
    return count;
  };
}

const next = createCounter();
console.log(next(), next()); // 1, 2
```

La closure conserva l'accesso al binding `count` anche dopo il ritorno di `createCounter`. Non mantiene per questo l'intera chiamata nello stack. Anche una funzione async sospesa puo conservare dati necessari alla ripresa.

### Valori, alias e passaggio degli argomenti

L'assegnazione di un primitivo copia il valore osservabile; cambiarne un binding non cambia l'altro:

```js
let firstNumber = 1;
let secondNumber = firstNumber;
secondNumber = 2;
console.log(firstNumber); // 1
```

Con gli oggetti viene copiato il valore che ne identifica il riferimento, non una copia profonda dell'oggetto. Due binding possono quindi raggiungere lo stesso oggetto:

```js
let first = { count: 1 };
const alias = first;

alias.count = 2;
first = null;
console.log(alias.count); // 2: l'oggetto e ancora accessibile
```

Gli argomenti sono passati per valore anche quando quel valore identifica un oggetto:

```js
function update(value) {
  value.count += 1;
  value = null;
}

const record = { count: 1 };
update(record);
console.log(record.count); // 2
```

La mutazione e osservabile dal chiamante; riassegnare il parametro non riassegna `record`. `const` impedisce di riassegnare un binding, non rende l'oggetto immutabile e non ne accorcia la vita.

### Raggiungibilita e percorsi che trattengono i dati

Il modello pratico e un grafo: dagli elementi che il runtime deve mantenere vivi si seguono i riferimenti forti verso altri oggetti. Questi punti di partenza vengono chiamati **root**; i dettagli dipendono dal motore e dall'host.

Percorsi comuni da cercare:

```text
ambiente globale/modulo -> Map -> record
timer attivo -> callback -> ambiente catturato -> dati
window raggiungibile -> listener -> componente -> nodo DOM
oggetto raggiungibile -> proprieta -> altro oggetto
```

Closure, listener e nodi DOM sono spesso **passaggi del percorso**, non root indipendenti. Un ciclo nodo/listener/closure puo diventare raccoglibile se non esiste piu alcun percorso forte dall'esterno. Togliere un nodo dal documento elimina un collegamento, non quelli presenti in array, Map, handler o codice applicativo.

La raccolta non dipende dall'intenzione “non lo usero piu”, ma dai vincoli del runtime. Anche il solo scope lessicale non permette di prevedere l'istante della raccolta: i motori possono ottimizzare dati non piu osservabili.

### Timer, Promise e closure

Un timer attivo conserva la callback necessaria alla sua esecuzione; quella callback puo mantenere vivi i dati che usa. Cancellare il timer interrompe la registrazione, non i riferimenti indipendenti del chiamante.

Anche una catena di Promise o un'operazione host in corso puo trattenere dati. Una Promise pending **non e, da sola, una root eterna**: se tutto il gruppo diventa irraggiungibile e nessuna operazione esterna ne richiede la ripresa, puo essere raccolto. Non dedurre un leak dal solo stato pending.

Per le operazioni supportate usa [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]. Ignorare una Promise non cancella il lavoro sottostante; cancellarlo non annulla effetti gia prodotti e non promette il rilascio immediato di tutta la memoria.

## API / Sintassi

Non esiste un `free(object)` standard per oggetti JS ordinari. Distingui l'effetto osservabile dell'operazione dalla possibile raccolta successiva:

| Operazione | Cosa fa | Cosa non garantisce |
| --- | --- | --- |
| `reference = null` | Sostituisce un binding o una proprieta | Non elimina gli altri alias |
| `map.delete(key)` / `map.clear()` | Rimuove voci dalla Map | Non distrugge oggetti conservati altrove |
| `delete object.property` | Rimuove una proprieta configurabile | Non e una chiamata al GC |
| `clearTimeout(id)` / `clearInterval(id)` | Cancella una registrazione timer | Non interrompe codice sincrono gia in esecuzione |
| `target.removeEventListener(...)` | Rimuove la registrazione corrispondente | Non rimuove altre funzioni o altri target |
| `controller.abort()` | Segnala annullamento agli utilizzatori del signal | Non ferma operazioni che ignorano il signal |
| `URL.revokeObjectURL(url)` | Rilascia la registrazione dell'object URL | Non invalida ogni altro riferimento al Blob |

Per rimuovere un listener devono corrispondere target, tipo, identita della funzione e flag `capture`. Ricreare una funzione con lo stesso testo non produce la stessa identita. Un signal passato a `addEventListener` e un'alternativa quando l'API e supportata.

Le API di chiusura dipendono dalla risorsa: per esempio `socket.close()`, `worker.terminate()`, `observer.disconnect()` o il metodo di unsubscribe di una libreria. Una funzione di cleanup deve sapere **cosa possiede** e non chiudere risorse condivise di altri componenti.

## Esempio pratico

### Widget con cleanup idempotente

Il widget possiede il listener click e il testo di un pulsante esistente. Riceve un record ordinario con `id` stringa e puo trattenere altri dati dello stesso record mentre e montato. La demo va eseguita dopo questo markup:

```html
<button id="show-record" type="button">Mostra ID</button>
```

```js
function mountWidget(button, data) {
  if (!(button instanceof HTMLButtonElement)) {
    throw new TypeError("Atteso un pulsante HTML");
  }
  if (data === null || typeof data !== "object" || typeof data.id !== "string") {
    throw new TypeError("Atteso un record con id stringa");
  }

  let active = true;
  const initialText = button.textContent;

  function onClick() {
    if (!active) return;
    button.textContent = `ID: ${data.id}`;
  }

  button.addEventListener("click", onClick);

  return function cleanup() {
    if (!active) return;
    active = false;
    button.removeEventListener("click", onClick);
    button.textContent = initialText;
    button = null;
    data = null;
  };
}
```

Avvio nello stesso script:

```js
let widgetData = { id: "record-1", payload: new Uint8Array(1024) };
let disposeWidget = mountWidget(document.querySelector("#show-record"), widgetData);
widgetData = null;
```

Alla chiusura della vista:

```js
disposeWidget();
disposeWidget(); // Nessun effetto aggiuntivo.
disposeWidget = null;
```

Il reset di `button` e `data` riguarda i binding interni della funzione, non gli oggetti del chiamante. Evita che una funzione di cleanup conservata accidentalmente continui a offrire accesso a quel record e al pulsante. Non certifica una raccolta immediata e non toglie riferimenti mantenuti da altri.

Il cleanup ripristina il testo originale: non usare due widget proprietari dello stesso pulsante. Il componente inserisce l'ID come testo, non come HTML; il chiamante non deve modificare il record in modo da violare il contratto.

### Timer con un proprietario esplicito

Il ticker conserva un array finche e attivo e ne legge la lunghezza a ogni tick. La callback deve essere sincrona; per polling async usa gli esempi in [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]].

```js
function startTicker(data, onTick) {
  if (!Array.isArray(data) || typeof onTick !== "function") {
    throw new TypeError("Attesi un array e una callback");
  }
  let active = true;
  const intervalId = setInterval(() => {
    if (active) onTick(data.length);
  }, 1000);

  return function stop() {
    if (!active) return;
    active = false;
    clearInterval(intervalId);
    data = null;
    onTick = null;
  };
}
```

Uso:

```js
const stopTicker = startTicker([1, 2, 3], (length) => console.log(length));
```

Quando il proprietario viene smontato chiama `stopTicker()`. La guardia `active` impedisce lavoro anche se una callback conservata altrove venisse richiamata dopo lo stop. La demo non intercetta eccezioni della callback e non attende Promise: chi la usa deve rispettare quel contratto.

## Varianti

### Dati temporanei, cache e buffer

Una cache puo mantenere dati intenzionalmente; serve comunque una politica coerente con il carico, per esempio limite, TTL o invalidazione. Un limite di elementi non equivale a un limite in byte.

Anche una piccola vista su un grande ArrayBuffer puo mantenere raggiungibile il buffer sottostante. La lunghezza della vista non descrive da sola tutta la memoria trattenuta; vedi [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]].

I riferimenti deboli non sostituiscono una politica di cache: non garantiscono quando o quanto spazio venga recuperato. Per metadati associati alla vita di una chiave vedi [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]].

### Memoria JS e risorse dell'host

Heap JS, DOM, buffer, immagini decodificate e risorse native non sono la stessa metrica. Il browser e il runtime gestiscono anche memoria fuori dall'heap ordinario. Chiudere una risorsa e perdere l'ultimo riferimento al suo wrapper JS sono operazioni diverse.

Azzerare la variabile che contiene la stringa di un'object URL non ne revoca la registrazione: questa deve essere rilasciata con `revokeObjectURL` quando nessun utilizzatore ne ha piu bisogno.

### Osservare senza promettere tempi

Confronta lo stesso stato dell'app prima e dopo cicli ripetuti di apertura/chiusura. Cerca percorsi che trattengono oggetti negli heap snapshot, non solo un aumento temporaneo del grafico.

Debug e console possono mantenere riferimenti agli oggetti ispezionati. Un test funzionale puo verificare che non arrivino piu tick o click gestiti dopo il cleanup; non dimostra l'istante del GC o una riduzione esatta dei byte.

## Errori comuni

- Considerare stack/heap una mappa fisica obbligatoria per i tipi JS.
- Confondere fine dello scope, fine della chiamata e durata dei dati catturati.
- Credere che `null` o `delete` distruggano un oggetto condiviso.
- Chiamare “root” ogni listener anche quando il suo target e irraggiungibile.
- Lasciare timer, subscription e object URL senza proprietario.
- Conservare un cleanup che continua a catturare dati non necessari.
- Confondere memoria in crescita, picchi temporanei e leak dimostrati.

## Checklist

- Per ogni risorsa e chiaro chi la crea e chi la chiude.
- Setup e cleanup sono abbinati; il cleanup ripetuto e sicuro.
- I riferimenti nelle strutture longeve hanno una ragione e una durata.
- Le callback trattengono solo dati necessari; i risultati obsoleti sono gestiti.
- Sono verificati mount/unmount ripetuti e assenza di effetti dopo lo stop.
- I dati degli snapshot vengono interpretati separatamente da memoria di processo e risorse native.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]

## Fonti

- [MDN: gestione della memoria JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management).
- [ECMAScript: contesti di esecuzione e ambienti lessicali](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-execution-contexts).
- [MDN: rimozione dei listener e matching dei parametri](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener).
- [MDN: rilascio degli object URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static).
- [Chrome DevTools: problemi di memoria e strumenti diagnostici](https://developer.chrome.com/docs/devtools/memory-problems).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

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
  - generators
  - iterators
  - iterable
aliases:
  - Generator JS
  - Iterator JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Cicli]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
title: Generators e Iterators
---

# Generators e Iterators

## Sintesi

Gli iterator definiscono come consumare una sequenza di valori.

I generator sono funzioni speciali che producono valori uno alla volta usando `yield`.

---

## Quando usarlo

Usa iterator e generator quando vuoi produrre o consumare una sequenza senza costruire subito un array completo.

Casi utili:

- range numerici;
- pipeline di trasformazione lazy;
- lettura progressiva di dati;
- oggetti custom consumabili con `for...of`;
- sequenze potenzialmente grandi;
- stream asincroni con `async function*`.

Se la sequenza e piccola e semplice, un array resta spesso piu leggibile.

I blocchi sono indipendenti salvo richiami espliciti. Gli esempi con await al livello principale richiedono un modulo ES o una funzione async. Lazy significa "calcolato quando richiesto", non parallelo o automaticamente non bloccante.

## Come funziona

### Protocollo iterator
Un iterator espone un metodo `next()`.

```js
const iterator = {
  current: 0,
  next() {
    if (this.current >= 3) return { value: undefined, done: true };
    this.current += 1;
    return { value: this.current, done: false };
  },
};
```

Ogni chiamata restituisce `{ value, done }`.

Il risultato deve essere un oggetto. Quando done e true, value puo contenere un risultato finale, ma non e un ulteriore elemento della sequenza. Per un iterator ben progettato, dopo il completamento anche i next successivi restano completati. Il metodo usa this: non estrarlo per chiamarlo senza receiver.

---
### Iterable
Un oggetto iterable espone un metodo `Symbol.iterator` che restituisce un iterator. L'iterator sopra non e automaticamente iterable: `[...iterator]` fallisce perche quel metodo manca. Un oggetto puo soddisfare entrambi i protocolli.

```js
const range = {
  from: 1,
  to: 3,
  [Symbol.iterator]() {
    let current = this.from;
    const end = this.to;

    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        }

        return { done: true };
      },
    };
  },
};

for (const value of range) {
  console.log(value);
}
```

`for...of`, lo spread in array o chiamate di funzione e il destructuring di array usano il protocollo iterable. Il destructuring di oggetti, come `const { name } = user`, legge invece proprieta e non richiede un iteratore.

Il range sopra e configurato per piccoli interi e crea un cursore nuovo a ogni iterazione; due cicli non condividono current. L'iterator restituito non e a sua volta iterable, ma e sufficiente come risultato di Symbol.iterator. Un iterable puo anche restituire sempre lo stesso cursore monouso: il protocollo non promette che sia riavviabile. Lo spread di oggetto `{...value}` copia proprieta, non usa questo protocollo.

---
### Generator function
```js
function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}

for (const value of numbers()) {
  console.log(value);
}
```

Chiamare numbers() crea un **generator object**, che e sia iterator sia iterable: il suo Symbol.iterator restituisce se stesso. Il corpo inizia soltanto al primo next e si sospende a yield. Ogni chiamata alla funzione crea un cursore nuovo; riusare lo stesso oggetto gia consumato non riavvia la sequenza.

### Valori in ingresso e risultato finale

```js
function* conversation() {
  const answer = yield "domanda";
  return `risposta: ${answer}`;
}

const dialog = conversation();
console.log(dialog.next("ignorato")); // { value: "domanda", done: false }
console.log(dialog.next("si")); // { value: "risposta: si", done: true }
console.log(dialog.next()); // { value: undefined, done: true }
```

Il primo argomento di next e ignorato: non esiste ancora un yield sospeso che lo riceva. Il successivo diventa il risultato dell'espressione yield. for...of restituisce solo i valori con done false, quindi non espone il return finale. yield non puo essere spostato dentro una callback normale annidata.

### Chiusura, return e throw

Un'uscita anticipata dal corpo di for...of, come break o un errore del consumatore, richiama return() se presente. In un generator gia avviato, questo attraversa i finally attivi:

```js
function* trackedNumbers(onClose) {
  try {
    yield 1;
    yield 2;
  } finally {
    onClose();
  }
}

for (const value of trackedNumbers(() => console.log("chiuso"))) {
  console.log(value); // 1
  break;
}
// stampa anche "chiuso"
```

onClose deve essere una callback sincrona; se fallisce, l'errore fa parte della chiusura. All'esaurimento naturale il finally viene eseguito dal generator stesso, senza bisogno di un return aggiuntivo del ciclo. Se abbandoni un cursore manuale, usa try/finally nel consumatore e iterator.return?.(): il garbage collector non garantisce quel cleanup.

Un errore lanciato da next di un iterator manuale non fa invocare automaticamente return al ciclo: l'iterator deve occuparsi delle proprie risorse. return su un generator mai avviato non entra nel corpo ne nei suoi finally. return puo perfino dare done false se un finally contiene yield: evita yield nei blocchi destinati solo al rilascio di risorse.

throw(error) inserisce un errore nel punto del yield sospeso. Il generator puo catturarlo e continuare; altrimenti si chiude e l'errore torna al chiamante. Un errore nel corpo del ciclo for...of non viene inoltrato a questo catch tramite throw: il ciclo usa la chiusura con return.

```js
function* recoverable() {
  try {
    yield "pronto";
  } catch (error) {
    yield `recuperato: ${error.message}`;
  }
}

const task = recoverable();
task.next();
console.log(task.throw(new Error("stop"))); // done: false, value: "recuperato: stop"
console.log(task.next()); // done: true
```

---
### Generator per range
Versione con estremi inclusivi e interi sicuri. from maggiore di to produce una sequenza vuota; non e un range decrescente.

```js
function* range(from, to) {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) {
    throw new TypeError("Servono estremi interi sicuri");
  }
  for (let value = from; value <= to; value += 1) {
    yield value;
    if (value === to) return;
  }
}

console.log([...range(1, 3)]); // [1, 2, 3]
```

La validazione nel corpo avviene al primo next, non alla creazione del cursore. Il controllo prima dell'incremento finale evita di oltrepassare il dominio degli interi sicuri. Un range enorme puo comunque bloccare il thread se lo consumi interamente; `[...range(...)]` materializza tutti i valori e puo esaurire memoria.

---
### `yield*`
`yield*` delega a un altro iterable.

```js
function* combined() {
  yield* [1, 2];
  yield* [3, 4];
}
```

Non equivale a yield dell'array, che emetterebbe l'array come un solo valore. yield* inoltra anche next, return e throw secondo il protocollo del delegato; la sua espressione restituisce il risultato finale del delegato, non l'ultimo elemento prodotto. Se il delegato non supporta i metodi opzionali, non presumere che accetti ogni forma di controllo.

---
### Async iterators
Un async iterator ha next() che restituisce una Promise di `{value, done}`; un async iterable lo espone tramite Symbol.asyncIterator. Un async generator implementa entrambi. Helper minimo per il ritardo dimostrativo:

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function* streamItems(items) {
  for (const item of items) {
    await wait(100);
    yield item;
  }
}
```

Consumo del generator precedente:

```js
for await (const item of streamItems([1, 2, 3])) {
  console.log(item);
}
```

for await...of attende ciascun next e consuma anche iterable sincroni tramite un adattatore. Su un'uscita anticipata attende return se presente. L'esempio lavora in sequenza e non offre cancellazione del timer; 100 ms e un ritardo richiesto, non una deadline.

Async non significa esecuzione parallela. Non avviare molte chiamate next senza controllo: quelle di un async generator vengono accodate. Se una richiesta e sospesa in await, chiamare return non interrompe automaticamente la Promise o Fetch gia in corso; serve un meccanismo come AbortSignal nell'operazione sottostante.

---

## API / Sintassi

Iterator protocol:

```text
iterator.next(); // { value, done }
```

Iterable protocol:

```text
object[Symbol.iterator] = function () {
  return iterator;
};
```

Generator function:

```text
function* generator() {
  yield value;
}
```

Async generator:

```text
async function* generator() {
  yield await loadValue();
}
```

Consumo:

```text
for (const value of iterable) {}
for await (const value of asyncIterable) {}
```

## Esempio pratico

Paginazione HTTP lazy, una richiesta per pagina e nessun prefetch. Contratto del backend: page parte da 1, risposta JSON `{ "items": [...] }`, prodotti con id intero positivo e name stringa; **solo un array items vuoto** segnala la fine. Non dedurre la fine dalla dimensione di una pagina. La URL deve essere assoluta HTTP/HTTPS e senza credenziali incorporate.

```js
async function* fetchPages(baseUrl, { signal, maxPages = 100 } = {}) {
  if (!Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > 10000) {
    throw new RangeError("Limite pagine non valido");
  }
  if (signal !== undefined && !(signal instanceof AbortSignal)) {
    throw new TypeError("Serve un AbortSignal dello stesso realm");
  }
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new TypeError("URL non supportata");
  }
  for (let page = 1; page <= maxPages; page += 1) {
    signal?.throwIfAborted();
    url.searchParams.set("page", String(page));
    const response = await fetch(url.href, { headers: { Accept: "application/json" }, signal });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    signal?.throwIfAborted();
    if (data === null || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.items)) {
      throw new TypeError("Risposta non valida");
    }
    const items = [];
    for (const item of data.items) {
      if (item === null || typeof item !== "object" || Array.isArray(item) ||
          !Number.isSafeInteger(item.id) || item.id <= 0 || typeof item.name !== "string") {
        throw new TypeError("Prodotto non valido");
      }
      items.push({ id: item.id, name: item.name });
    }
    if (items.length === 0) return;
    yield items;
  }
  throw new RangeError("Limite pagine raggiunto prima della fine");
}
```

Consumo browser, in un modulo, con un endpoint reale che rispetti il contratto. Il break chiude il generator e non avvia la pagina successiva:

```js
const controller = new AbortController();
const endpoint = new URL("/api/products?category=books", location.href);

try {
  for await (const items of fetchPages(endpoint, { signal: controller.signal })) {
    console.log(items);
    break; // qui serve solo la prima pagina non vuota
  }
} catch (error) {
  if (controller.signal.aborted) console.log("Caricamento annullato");
  else console.error("Caricamento fallito", error);
}
```

Un evento esterno puo chiamare controller.abort() per interrompere Fetch in corso. Passare il signal senza mai annullarlo non crea un timeout; un'eventuale scadenza va impostata dal chiamante.

La query esistente viene mantenuta, sostituendo soltanto page. HTTP non riuscito, JSON invalido e schema errato non sono scambiati per fine sequenza. Se maxPages pagine sono tutte non vuote, il next successivo all'ultima pagina emessa genera RangeError: non dichiara un completamento che il server non ha confermato.

Il generatore conserva dati nell'ordine di una pagina, ma response.json() carica **l'intero corpo della pagina**: non e streaming dei singoli byte o record. Se il consumatore accumula tutti gli items, la memoria cresce comunque. Non include retry, deadline, autenticazione, deduplicazione o snapshot consistente: con dati remoti che cambiano valuta una paginazione a cursore progettata dal backend.

## Varianti

- **Iterator manuale**: oggetto con `next`.
- **Iterable custom**: oggetto consumabile da `for...of`.
- **Generator function**: sintassi compatta per iterator.
- **Async iterator**: valori prodotti in modo asincrono.
- **Async generator**: sintassi compatta per async iterator.
- **Delegazione con `yield*`**: combina sequenze.

### Iterator helpers

Nei runtime che li supportano, gli iteratori built-in e i generator hanno helper come map, filter, take e toArray. Con il range definito sopra:

```js
const firstDoubles = range(1, 100).map((value) => value * 2).take(3).toArray();
console.log(firstDoubles); // [2, 4, 6]
```

map e take sono lazy; toArray consuma la pipeline. Un oggetto manuale con il solo next non eredita automaticamente questi metodi: quando disponibile, Iterator.from permette di adattarlo. Verifica compatibilita nel runtime di destinazione e non trasferire queste API automaticamente agli async iterator. Un map di iterator sincrono con callback async produce Promise, non una pipeline async gestita.

## Errori comuni

- Confondere generator function e funzione normale.
- Dimenticare che un generator e lazy.
- Consumare due volte lo stesso iterator aspettandosi che riparta.
- Usare generator dove un array semplice sarebbe piu leggibile.
- Ignorare gestione errori in async iterator.
- Trattare yield come await o usarlo per presumere che il browser possa renderizzare tra due next sincroni.
- Materializzare con spread una sequenza infinita o molto grande.
- Aspettarsi che return interrompa un Fetch pendente o che il garbage collector esegua finally.
- Confondere return finale e ultimo elemento della sequenza.

---

## Checklist

### Checklist operativa
- Usa generator per sequenze lazy o pipeline.
- Usa iterable per rendere oggetti consumabili con `for...of`.
- Usa async generator per stream asincroni.
- Evita generator per logica banale.
- Documenta se un iterator e monouso.
- Prova esaurimento, break, errori nel consumatore e negli iteratori, chiusura manuale e input invalidi.
- Per la paginazione dichiara schema, fine sequenza, limite delle richieste e cancellazione.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Cicli|Cicli]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]

## Fonti

- [MDN - Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- [MDN - Iterators and generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators)
- [MDN - Generator.next](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next)
- [MDN - Generator.return](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return)
- [MDN - Generator.throw](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/throw)
- [MDN - yield*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)
- [MDN - for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
- [MDN - Async generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*)
- [MDN - Iterator e compatibilita degli helper](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator)
- [MDN - Iterator.take](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/take)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

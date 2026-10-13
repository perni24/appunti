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
  - scope
  - lexical-scope
  - variables
aliases:
  - Scope JS
  - Ambito JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Hoisting]]"
  - "[[Programmazione/JavaScript/Pagine/Closures]]"
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Strict Mode]]"
title: Scope
---

# Scope

## Sintesi

Lo scope definisce dove un identificatore (nome di variabile, funzione o classe) puo essere risolto. Essere nello scope non significa essere gia inizializzato: durante la Temporal Dead Zone l'accesso fallisce.

In JavaScript lo scope e principalmente lessicale: dipende da dove il codice e scritto, non da dove viene chiamato.

---

## Quando usarlo

Studia lo scope quando devi capire dove una variabile e visibile, perche un nome produce `ReferenceError` o perche una funzione conserva accesso a dati esterni.

Serve per:

- evitare globali accidentali;
- leggere closure;
- progettare moduli;
- capire `let`, `const` e `var`;
- ridurre collisioni di nomi;
- mantenere funzioni piccole e leggibili.

## Come funziona

### Perche conta
Capire lo scope serve per:

- evitare variabili globali accidentali;
- leggere correttamente funzioni annidate e closures;
- capire `ReferenceError`;
- capire perche una variabile interna nasconde una variabile esterna;
- organizzare meglio moduli e funzioni.

---
### Scope globale
Una dichiarazione globale puo essere raggiunta dagli scope annidati dello stesso ambiente, salvo shadowing e vincoli di inizializzazione. Non e automaticamente condivisa con altre pagine, worker o processi. Il top-level di un modulo, invece, non e scope globale.

```js
const appName = "Dashboard";

function printName() {
  console.log(appName);
}

printName(); // "Dashboard"
```

In una pagina browser si accede all'oggetto globale tramite `window`; nei worker `window` non esiste. `globalThis` fornisce un accesso comune ai diversi ambienti, senza rendere disponibili API assenti come il DOM in Node.js.

```js
console.log(globalThis);
```

In una pagina nuova, esegui questo esempio in uno **script classico**, non in un modulo: una dichiarazione `var` top-level crea una proprieta globale, mentre `let` e `const` no. Si assumono nomi non gia presenti sulla pagina.

```js
var legacyValue = 1;
let modernValue = 2;

console.log(window.legacyValue); // 1
console.log(window.modernValue); // undefined
```

Il binding `modernValue` resta comunque leggibile per nome da successivi script classici della stessa pagina. In un modulo ES anche `var` resta nel modulo. In un file CommonJS di Node.js il top-level e racchiuso nel wrapper del modulo, non e il globale. Vedi [Node.js: module wrapper](https://nodejs.org/api/modules.html#the-module-wrapper).

---
### Scope di funzione
Ogni funzione crea un nuovo scope.

```js
function createUser() {
  const createdUserName = "Luca";
  return createdUserName;
}

console.log(createUser()); // "Luca"
// console.log(createdUserName); // ReferenceError: fuori dallo scope
```

Il nome locale non e accessibile direttamente dall'esterno: puoi esporne il valore con `return` oppure permetterne l'uso tramite una closure. Nell'esempio si assume che non esista un altro `createdUserName` esterno. Evita `name` per dimostrare questo errore nel browser: puo risolversi alla proprieta preesistente `window.name`.

---
### `var` e scope di funzione
Nei normali blocchi `if`, `for` o `while`, `var` non crea un binding locale al blocco: appartiene alla funzione che li contiene. Se manca una funzione, vale lo scope top-level dello script o modulo. I blocchi statici delle classi hanno invece un proprio scope anche per `var`.

```js
function example() {
  if (true) {
    var value = 10;
  }

  console.log(value); // 10
}
```

Per codice moderno, preferire `let` e `const`.

---
### Scope di blocco
`let` e `const` sono limitati al blocco in cui vengono dichiarati.

```js
if (true) {
  const role = "admin";
  let isActive = true;
}

console.log(role); // ReferenceError
console.log(isActive); // ReferenceError
```

Qui "blocco" significa un blocco di istruzioni, per esempio il corpo di `if` o un blocco esplicito. Non tutte le graffe creano questo scope: `{ role: "admin" }` in un object literal definisce proprieta, non variabili locali. Gli esempi con errori sono indipendenti: un `ReferenceError` non gestito interrompe l'esecuzione del frammento.

---
### Scope di modulo
Ogni modulo ES ha il proprio scope top-level.

```js
// config.js
const apiUrl = "https://api.example.com";

export function getApiUrl() {
  return apiUrl;
}
```

`apiUrl` non diventa globale. E disponibile solo dentro il modulo, salvo esportazione.

I moduli ES sono anche eseguiti in strict mode automaticamente.

---
### Scope lessicale
Una funzione puo leggere le variabili definite nello scope in cui e stata creata.

```js
function createGreeter(name) {
  return function greet() {
    console.log(`Ciao ${name}`);
  };
}

const greetLuca = createGreeter("Luca");
greetLuca(); // "Ciao Luca"
```

La funzione `greet` mantiene accesso a `name` perche e stata definita dentro `createGreeter`.

Il chiamante non fornisce le proprie variabili alla funzione:

```js
const label = "definizione";

function readLabel() {
  return label;
}

function callReader() {
  const label = "chiamante";
  return readLabel();
}

console.log(callReader()); // "definizione"
```

---
### Scope chain
Quando JavaScript cerca un identificatore, procede dall'interno verso l'esterno:

- scope locale;
- scope della funzione esterna;
- scope di modulo o globale;
- errore se il nome non esiste.

```js
const value = "globale";

function outer() {
  const value = "outer";

  function inner() {
    console.log(value);
  }

  inner();
}

outer(); // "outer"
```

La ricerca si ferma al primo binding con quel nome, anche se non e ancora inizializzato. Non ripiega su quello esterno:

```js
const quantity = 20;
{
  console.log(quantity); // ReferenceError: binding interno in TDZ
  let quantity = 5;
}
```

Questa ricerca riguarda identificatori come `quantity`. In `user.quantity`, invece, si risolve prima `user` e poi si cerca una proprieta sull'oggetto e sui suoi prototipi: sono due meccanismi distinti.

---
### Shadowing
Lo shadowing avviene quando una variabile interna ha lo stesso nome di una variabile esterna.

```js
const status = "global";

function update() {
  const status = "local";
  console.log(status);
}

update(); // "local"
console.log(status); // "global"
```

Lo shadowing non e sempre un errore, ma puo rendere il codice meno leggibile se abusato.

---

## API / Sintassi

Scope di blocco:

```js
{
  const value = 1;
}
```

Scope di funzione:

```js
function run() {
  const value = 1;
}
```

Scope di modulo:

```js
const internal = 1;
export const publicValue = 2;
```

Accesso globale moderno:

```js
globalThis;
```

Regola pratica: dichiara i valori nello scope piu piccolo possibile.

## Esempio pratico

Evitare stato globale:

```js
function createCounter() {
  let count = 0;

  return {
    increment() {
      count += 1;
      return count;
    },
  };
}

const counter = createCounter();
const otherCounter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(otherCounter.increment()); // 1
```

Ogni chiamata a `createCounter` crea un binding `count` indipendente. I metodi restituiti continuano a usarlo anche dopo il ritorno della factory; `count` non e una proprieta dell'oggetto restituito e non diventa globale.

## Varianti

- **Scope globale**: ambiente esterno condiviso nel relativo realm, soggetto a shadowing.
- **Scope di modulo**: top-level isolato del modulo ES.
- **Scope di funzione**: creato da ogni funzione.
- **Scope di blocco**: creato da blocchi con `let` e `const`.
- **Scope lessicale**: determinato dalla posizione nel codice.
- **Scope chain**: ricerca dei nomi dall'interno verso l'esterno.
- **Shadowing**: nome interno che nasconde nome esterno.

## Errori comuni

- Usare `var` pensando che sia limitato al blocco.
- Dichiarare variabili globali non necessarie.
- Confondere scope e `this`.
- Riutilizzare lo stesso nome in troppi scope annidati.
- Leggere una variabile fuori dal blocco in cui e dichiarata.

---

## Checklist

### Checklist operativa
- Usa `const` di default.
- Usa `let` solo quando il valore deve cambiare.
- Evita `var` nel codice moderno.
- Mantieni gli scope piccoli.
- Evita funzioni troppo annidate.
- Esporta dai moduli solo cio che serve davvero.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Hoisting|Hoisting]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Strict Mode|Strict Mode]]
- [[Programmazione/JavaScript/Pagine/Context|Context: this e contesto di esecuzione]]
- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes: ricerca delle proprieta]]

## Fonti

- [MDN: let, scope e TDZ](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let).
- [ECMAScript: ambienti e risoluzione dei binding](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-resolvebinding).
- [MDN: closures e ambiente lessicale](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

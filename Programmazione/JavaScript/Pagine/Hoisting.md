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
  - hoisting
  - declarations
  - tdz
aliases:
  - Hoisting JS
  - Temporal Dead Zone
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
title: Hoisting
---

# Hoisting

## Sintesi

L'hoisting e il comportamento per cui JavaScript registra dichiarazioni di variabili, funzioni e classi prima di eseguire il codice.

Non significa che il codice venga davvero spostato nel file. Significa che durante la fase di creazione del contesto di esecuzione il motore prepara gli identificatori.

---

## Quando usarlo

Studia l'hoisting quando devi capire perche una variabile, funzione o classe sembra disponibile o non disponibile prima della sua dichiarazione.

Serve soprattutto per:

- leggere errori `ReferenceError`;
- capire differenza tra `var`, `let` e `const`;
- distinguere function declaration e function expression;
- evitare dipendenze implicite dall'ordine del codice;
- comprendere moduli e import statici.

Nel codice moderno conviene non basarsi sull'hoisting come tecnica: dichiara prima di usare.

## Come funziona

### Creazione ed esecuzione
JavaScript valuta il codice in due fasi concettuali:

- fase di creazione: registra dichiarazioni e prepara gli scope;
- fase di esecuzione: esegue le istruzioni riga per riga.

Questo e un modello per ragionare sul comportamento, non la promessa che il motore legga tutto il programma esattamente due volte. I binding vengono preparati per il relativo script, modulo, invocazione di funzione o ingresso nel blocco. Un binding e l'associazione tra un nome e il suo stato/valore.

I frammenti sono indipendenti. Quelli annotati con `ReferenceError` o `TypeError` mostrano volutamente un errore: non concatenarli con gli esempi corretti nello stesso file.

---
### Hoisting con `var`
Le dichiarazioni `var` vengono inizializzate a `undefined`.

```js
console.log(count); // undefined

var count = 3;

console.log(count); // 3
```

Il comportamento e simile a:

```js
var count;

console.log(count);

count = 3;
```

Solo la dichiarazione viene preparata prima. L'assegnazione resta dove si trova.

---
### Hoisting con `let` e `const`
`let` e `const` sono presenti nello scope, ma non sono utilizzabili finche non viene eseguita la loro inizializzazione.

```js
console.log(name); // ReferenceError

const name = "Luca";
```

La zona temporale tra l'ingresso nello scope e l'inizializzazione si chiama Temporal Dead Zone (TDZ).

---
### Temporal Dead Zone
La Temporal Dead Zone impedisce di leggere una variabile prima che sia stata inizializzata, anche dentro il suo stesso inizializzatore: `let total = total + 1` non legge un eventuale `total` esterno.

```js
{
  console.log(total); // ReferenceError
  let total = 10;
}
```

Questo rende `let` e `const` piu sicuri di `var`, perche evita valori `undefined` accidentali.

Conta il momento della lettura, non la posizione del corpo della funzione:

```js
const readLimit = () => limit;
let limit = 10;
console.log(readLimit()); // 10: chiamata dopo l'inizializzazione
```

Una dichiarazione `let pending;` inizializza `pending` a `undefined` quando viene eseguita. Una dichiarazione ordinaria `const pending;` senza inizializzatore e invece un errore di sintassi.

Anche `typeof` distingue un nome assente da uno in TDZ:

```js
console.log(typeof neverDeclaredHere); // "undefined", se il nome non esiste
{
  console.log(typeof pending); // ReferenceError
  let pending;
}
```

---
### Function declaration
Le dichiarazioni di funzione sono richiamabili prima della loro posizione nel relativo scope, non da qualunque punto del file.

```js
sayHello();

function sayHello() {
  console.log("Ciao");
}
```

Questo vale per le function declaration, non per tutte le forme di funzione.

In strict mode una funzione dichiarata in un blocco resta nel blocco:

```js
"use strict";
{
  announce(); // "pronto"
  function announce() {
    console.log("pronto");
  }
}
console.log(typeof announce); // "undefined"
```

Le dichiarazioni di funzione nei blocchi di vecchi script non-strict hanno regole legacy aggiuntive: non usarle per far uscire intenzionalmente un nome dal blocco. Vedi [MDN: function declaration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function).

---
### Function expression
Una funzione assegnata a una variabile segue le regole della variabile.

```js
sayHello(); // ReferenceError

const sayHello = function () {
  console.log("Ciao");
};
```

Con `var` il risultato cambia, ma resta un errore pratico:

```js
sayHello(); // TypeError: sayHello is not a function

var sayHello = function () {
  console.log("Ciao");
};
```

La variabile esiste come `undefined`, ma la funzione non e ancora stata assegnata.

---
### Class declaration
Anche le classi sono registrate prima dell'esecuzione, ma restano nella Temporal Dead Zone.

```js
const user = new User(); // ReferenceError

class User {
  constructor(name) {
    this.name = name;
  }
}
```

Le classi vanno dichiarate prima dell'uso.

---
### Import
Gli import dei moduli ES sono statici e vengono risolti prima dell'esecuzione del modulo.

Due file ES module nella stessa cartella. Per Node.js usa un `package.json` con `"type": "module"`; nel browser carica `main.js` con `<script type="module">` da un server HTTP.

```js
// users.js
export function createUser(name) {
  return { name };
}
```

```js
// main.js
const user = createUser("Ada");
import { createUser } from "./users.js";
console.log(user.name); // "Ada"
```

L'import puo comparire dopo l'uso a livello testuale, ma non viene eseguito come una normale istruzione in quel punto. Per leggibilita tienilo comunque all'inizio. Gli import statici devono stare al top-level; `import()` dinamico e un'altra operazione.

Il binding importato non assicura che qualunque valore esportato sia gia inizializzato: nelle dipendenze circolari una lettura anticipata di un export `let`, `const` o `class` puo generare `ReferenceError`. Vedi [[Programmazione/JavaScript/Pagine/Circular Dependencies|Circular Dependencies]].

---

## API / Sintassi

Comportamenti principali:

```js
console.log(value); // undefined
var value = 1;
```

```js
console.log(value); // ReferenceError
let value = 1;
```

```js
run(); // ok

function run() {}
```

```js
run(); // ReferenceError

const run = function () {};
```

Le dichiarazioni vengono registrate prima dell'esecuzione, ma inizializzazione e assegnazione seguono regole diverse.

## Esempio pratico

Errore tipico con function expression, da eseguire separatamente dalle due correzioni:

```js
start(); // ReferenceError

const start = () => {
  console.log("start");
};
```

Correzione:

```js
const start = () => {
  console.log("start");
};

start();
```

Oppure usa una function declaration se vuoi poter chiamare la funzione prima della definizione:

```js
start();

function start() {
  console.log("start");
}
```

## Varianti

- **`var`**: dichiarazione hoisted e inizializzata a `undefined`.
- **`let` e `const`**: hoisted ma in Temporal Dead Zone.
- **Function declaration**: callable prima della dichiarazione.
- **Function expression**: segue le regole della variabile.
- **Class declaration**: hoisted ma in Temporal Dead Zone.
- **Import ES module**: risolto staticamente prima dell'esecuzione.

## Errori comuni

- Pensare che l'hoisting sposti fisicamente le righe di codice.
- Usare `var` e ottenere `undefined` invece di un errore.
- Chiamare una function expression prima dell'inizializzazione.
- Istanziare una classe prima della sua dichiarazione.
- Confondere hoisting e scope.

---

## Checklist

### Checklist operativa
- Dichiara variabili e classi prima di usarle.
- Preferisci `const` e `let` a `var`.
- Usa function declaration quando vuoi una funzione richiamabile prima della definizione.
- Evita dipendenze implicite dall'hoisting.
- Mantieni gli import statici all'inizio del modulo.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]


## Fonti

- [MDN: hoisting e limiti del termine](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting).
- [MDN: let e Temporal Dead Zone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz).
- [MDN: import statici e hoisting](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#hoisting).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

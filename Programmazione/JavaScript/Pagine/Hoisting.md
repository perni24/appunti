---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [javascript, hoisting, declarations, tdz]
aliases: [Hoisting JS, Temporal Dead Zone]
prerequisites: [Variabili, Scope]
related: [Scope, Funzioni, Classi, Moduli]
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

Questo spiega perche alcune dichiarazioni sono disponibili prima della riga in cui compaiono.

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
`let` e `const` sono registrati nello scope, ma non sono utilizzabili prima della dichiarazione.

```js
console.log(name); // ReferenceError

const name = "Luca";
```

La zona tra l'inizio dello scope e la dichiarazione si chiama Temporal Dead Zone.

---
### Temporal Dead Zone
La Temporal Dead Zone impedisce di leggere una variabile prima che sia stata dichiarata.

```js
{
  console.log(total); // ReferenceError
  let total = 10;
}
```

Questo rende `let` e `const` piu sicuri di `var`, perche evita valori `undefined` accidentali.

---
### Function declaration
Le dichiarazioni di funzione sono disponibili prima della loro posizione nel file.

```js
sayHello();

function sayHello() {
  console.log("Ciao");
}
```

Questo vale per le function declaration, non per tutte le forme di funzione.

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

```js
import { createUser } from "./users.js";

createUser();
```

Gli import devono stare al top-level del modulo, salvo uso di `import()` dinamico.

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

Errore tipico con function expression:

```js
start();

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

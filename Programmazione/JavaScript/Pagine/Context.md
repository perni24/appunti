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
  - this
  - execution-context
  - functions
aliases:
  - Context JS
  - This JavaScript
  - Execution Context
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
  - "[[Programmazione/JavaScript/Pagine/Arrow Functions]]"
  - "[[Programmazione/JavaScript/Pagine/Strict Mode]]"
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
title: Context
---

# Context

## Sintesi

Questa nota tratta soprattutto il valore di `this`. Il termine **execution context** e piu ampio: indica lo stato con cui il motore esegue codice, inclusi gli ambienti usati per risolvere i nomi. Non e un sinonimo di `this`.

Nelle funzioni ordinarie `this` dipende dalla chiamata e dalla strict mode della funzione. Le arrow lo ereditano lessicalmente; le funzioni prodotte da `bind` conservano il receiver associato nelle chiamate ordinarie. `this` puo anche essere `undefined`, `null` o un primitivo, non solo un oggetto.

---

## Quando usarlo

Studia il context quando una funzione usa `this`, quando passi metodi come callback o quando un metodo smette di leggere correttamente i dati dell'oggetto.

Serve soprattutto per:

- metodi di oggetto;
- classi;
- event listener;
- callback;
- `call`, `apply` e `bind`;
- differenza tra function normale e arrow function.

Se una funzione non ha bisogno di `this`, preferisci parametri espliciti.

## Come funziona

### Scope vs context
Scope e context non sono la stessa cosa.

- Lo scope decide quali nomi sono visibili.
- `this` e un valore che la funzione puo usare, con regole di binding distinte dalla ricerca di variabili per nome.

```js
const user = {
  name: "Luca",
  printName() {
    console.log(this.name);
  },
};

user.printName(); // "Luca"
```

`this.name` cerca una proprieta sul receiver, non una variabile locale chiamata `name`. Il contesto di esecuzione tiene traccia di queste operazioni e del codice corrente; le chiamate sincrone formano lo stack. Vedi [MDN: modello di esecuzione](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) per stack, job e sospensione delle funzioni asincrone.

---
### Global context
Nel browser, in uno script classico, `this` al top-level punta a `window`, anche con `"use strict"`. La regola non e quella di una chiamata di funzione senza receiver.

```js
"use strict";
console.log(this === window); // true in uno script browser classico
```

Nei moduli ES, `this` top-level e `undefined`.

```js
// dentro un modulo ES
console.log(this); // undefined
```

In un **file CommonJS** di Node.js, il wrapper viene chiamato con `this` inizialmente uguale a `module.exports`, non al globale:

```js
// context.cjs: eseguire con node context.cjs
console.log(this === module.exports); // true
console.log(this === globalThis); // false
```

REPL, console del browser e `node -e` non sono sostituti perfetti di un file: per confrontare i risultati usa il tipo di script indicato. Vedi [Node.js: wrapper CommonJS](https://nodejs.org/api/modules.html#the-module-wrapper).

---
### Chiamata come metodo
Per una funzione ordinaria non bound, la chiamata `object.method()` usa `object` come receiver. Lo stesso vale per `object["method"]()`.

```js
const cart = {
  total: 100,
  printTotal() {
    console.log(this.total);
  },
};

cart.printTotal(); // 100
```

La funzione non appartiene permanentemente all'oggetto su cui e stata definita. Proseguendo l'esempio:

```js
const otherCart = { total: 25, printTotal: cart.printTotal };
otherCart.printTotal(); // 25
```

---
### Chiamata come funzione
Quando una funzione ordinaria non bound viene chiamata senza receiver, conta la strict mode **del corpo della funzione**, non quella del chiamante.

```js
function showThis() {
  "use strict";
  return this;
}

console.log(showThis()); // undefined
console.log(showThis.call(null)); // null
console.log(showThis.call(7)); // 7, non un oggetto Number
```

Nella chiamata semplice `showThis()` il receiver e `undefined`; con `call` la funzione strict conserva invece il valore passato.

In una funzione non-strict, `undefined` e `null` come receiver vengono sostituiti con l'oggetto globale del suo ambiente; i primitivi vengono convertiti nei relativi oggetti wrapper. Nel codice moderno evita questa dipendenza implicita.

---
### Perdita del context
Se si estrae un metodo da un oggetto, si perde il receiver originale.

Frammento autonomo volutamente errato, in strict mode:

```js
"use strict";
const user = {
  displayName: "Luca",
  printName() {
    console.log(this.displayName);
  },
};

const print = user.printName;

print(); // TypeError: this e undefined
```

La funzione non viene piu chiamata come `user.printName()`, quindi `this` non punta piu a `user`.

---
### `call`, `apply` e `bind`
`call` e `apply` eseguono una funzione ordinaria passando il receiver: il primo accetta argomenti separati, il secondo un array o array-like. Valgono le conversioni non-strict descritte sopra; le arrow non acquisiscono un nuovo `this`.

```js
function printRole(prefix) {
  console.log(`${prefix}: ${this.role}`);
}

const admin = { role: "admin" };

printRole.call(admin, "Ruolo"); // "Ruolo: admin"
printRole.apply(admin, ["Ruolo"]); // "Ruolo: admin"
```

`bind` non esegue subito la funzione: ne restituisce una nuova con il receiver associato. Continuazione dell'esempio precedente:

```js
const boundPrintRole = printRole.bind(admin);

boundPrintRole("Ruolo"); // "Ruolo: admin"
boundPrintRole.call({ role: "reader" }, "Ruolo"); // ancora "Ruolo: admin"
```

Un secondo `bind` non sostituisce il primo receiver. Eccezione importante: se il target e costruibile, `new BoundFunction()` ignora il receiver bound e crea un'istanza del target; gli argomenti preimpostati restano. Una arrow non diventa costruibile tramite `bind`.

---
### Arrow function
Le arrow function non hanno un proprio `this`.

```js
const user = {
  name: "Luca",
  delayedPrint() {
    return setTimeout(() => {
      console.log(this.name);
    }, 1000);
  },
};

const timeoutId = user.delayedPrint(); // stampa "Luca" successivamente
// clearTimeout(timeoutId); // per annullare prima dell'esecuzione
```

L'arrow function eredita `this` da `delayedPrint`.

Non usare arrow function come metodi quando ti serve il `this` dell'oggetto.

Questo frammento e un **modulo ES** e mostra un errore intenzionale:

```js
// wrong-arrow.mjs
const user = {
  name: "Luca",
  printName: () => {
    console.log(this.name);
  },
};

user.printName(); // TypeError: this top-level del modulo e undefined
```

In uno script browser classico la stessa arrow legge invece il `this` globale: `this.name` puo essere `window.name`, non il nome dell'utente. L'object literal non crea un binding `this` per la arrow.

---
### Costruttori e classi
Con `new`, `this` punta alla nuova istanza.

```js
function User(name) {
  this.name = name;
}

const user = new User("Luca");

console.log(user.name); // "Luca"
```

I corpi delle classi sono sempre strict. I metodi pubblici di istanza ordinari usano il receiver della chiamata e non sono automaticamente bound.

```js
class Counter {
  constructor() {
    this.count = 0;
  }

  increment() {
    this.count += 1;
  }
}
```

Se passi `counter.increment` come callback, potresti perdere `this`.

---
### Event listener
In un listener DOM registrato con `addEventListener`, una funzione ordinaria non bound riceve come `this` il `currentTarget`. Non necessariamente coincide con `target`, che puo essere un discendente cliccato.

HTML dell'esempio:

```html
<button id="context-button" type="button"><span>Verifica</span></button>
```

Codice eseguito dopo l'inserimento del pulsante nel DOM:

```js
const button = document.querySelector("#context-button");
if (!button) throw new Error("Pulsante non trovato");

button.addEventListener("click", function (event) {
  console.log(this === event.currentTarget); // true
  console.log(event.target.tagName); // SPAN se si clicca il testo
});
```

Con arrow function, `this` non viene impostato dal browser.

```js
button.addEventListener("click", (event) => {
  console.log(event.currentTarget);
});
```

Nel codice moderno e spesso piu chiaro usare `event.currentTarget`. Una funzione bound mantiene invece il proprio `this`. Se ti serve `currentTarget` dopo un `await`, salvalo prima: la proprieta dell'evento viene azzerata al termine del dispatch, come spiegato in [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]].

---

## API / Sintassi

Chiamata come metodo:

```js
object.method();
```

Chiamata con context esplicito:

```js
fn.call(context, arg);
fn.apply(context, [arg]);
```

Binding:

```js
const bound = fn.bind(context);
```

Arrow function:

```js
const fn = () => {
  // this ereditato dallo scope esterno
};
```

I frammenti di questa sezione sono schemi, non un programma completo. Per capire `this`, identifica prima una eventuale arrow o funzione bound; altrimenti controlla chiamata con `new`, receiver esplicito, chiamata come metodo o chiamata semplice e strict mode.

## Esempio pratico

Perdita di `this` passando un metodo:

```js
class Counter {
  count = 0;

  increment() {
    this.count += 1;
    return this.count;
  }
}

const counter = new Counter();
const increment = counter.increment;

// increment(); // TypeError: il metodo e strict, this e undefined
```

Correzione con `bind`:

```js
const boundIncrement = counter.increment.bind(counter);
console.log(boundIncrement()); // 1
```

In alternativa, in una pagina con `button` gia individuato, passa una funzione wrapper. Conservane il riferimento se devi rimuoverla:

```js
const onIncrement = () => {
  counter.increment();
};
button.addEventListener("click", onIncrement);
// button.removeEventListener("click", onIncrement); // allo smontaggio
```

Ogni chiamata a `bind` crea una funzione diversa: `removeEventListener("click", counter.increment.bind(counter))` non rimuove una funzione bound creata in precedenza. Conserva anche quella in una variabile.

## Varianti

- **Global context**: top-level in script classici.
- **Function call**: `this` dipende da strict mode.
- **Method call**: receiver della chiamata, salvo arrow e funzioni bound.
- **Constructor call**: `this` e la nuova istanza.
- **Explicit binding**: `call`, `apply`, `bind`.
- **Arrow function**: `this` lessicale.
- **DOM listener**: spesso meglio usare `event.currentTarget`.

## Errori comuni

- Confondere `this` con lo scope.
- Estrarre un metodo e aspettarsi che mantenga il suo oggetto.
- Usare arrow function come metodi quando serve `this`.
- Dipendere dal `this` globale.
- Dimenticare `bind` quando si passa un metodo come callback.

---

## Checklist

### Checklist operativa
- Per capire `this`, guarda come viene chiamata la funzione.
- Usa arrow function per mantenere il `this` esterno nei callback.
- Usa metodi normali quando ti serve il `this` dell'oggetto.
- Usa `bind` se devi passare un metodo come callback.
- Preferisci `event.currentTarget` nei listener DOM.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Arrow Functions|Arrow Functions]]
- [[Programmazione/JavaScript/Pagine/Strict Mode|Strict Mode]]
- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]


## Fonti

- [MDN: this nelle diverse forme di chiamata](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this).
- [MDN: bind, rebinding e costruzione](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
- [MDN: this nei listener DOM](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#the_value_of_this_within_the_handler).
- [ECMAScript: execution contexts](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-execution-contexts).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

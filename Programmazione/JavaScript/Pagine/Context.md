---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, this, execution-context, functions]
aliases: [Context JS, This JavaScript, Execution Context]
prerequisites: [Scope, Funzioni]
related: [Scope, Arrow Functions, Strict Mode, Classi]
---

# Context

## Sintesi

In JavaScript il context indica soprattutto il valore di `this` durante l'esecuzione di una funzione.

`this` non dipende dallo scope lessicale della funzione, ma da come la funzione viene chiamata. L'eccezione principale sono le arrow function, che ereditano `this` dallo scope esterno.

---

## Scope vs context

Scope e context non sono la stessa cosa.

- Lo scope decide quali nomi sono visibili.
- Il context decide a quale oggetto punta `this`.

```js
const user = {
  name: "Luca",
  printName() {
    console.log(this.name);
  },
};

user.printName(); // "Luca"
```

`name` viene letto tramite `this`, non tramite scope.

---

## Global context

Nel browser, in uno script classico, `this` al top-level punta a `window`.

```js
console.log(this === window); // true in uno script browser classico
```

Nei moduli ES, `this` top-level e `undefined`.

```js
// dentro un modulo ES
console.log(this); // undefined
```

---

## Chiamata come metodo

Quando una funzione viene chiamata come proprieta di un oggetto, `this` punta all'oggetto prima del punto.

```js
const cart = {
  total: 100,
  printTotal() {
    console.log(this.total);
  },
};

cart.printTotal(); // 100
```

La regola pratica e: guarda cosa c'e a sinistra del punto nella chiamata.

---

## Chiamata come funzione

Quando una funzione normale viene chiamata senza oggetto, `this` dipende dalla modalita di esecuzione.

```js
function showThis() {
  console.log(this);
}

showThis();
```

In strict mode, `this` e `undefined`.

In non-strict mode, `this` puo puntare all'oggetto globale. Nel codice moderno conviene evitare di dipendere da questo comportamento.

---

## Perdita del context

Se si estrae un metodo da un oggetto, si perde il receiver originale.

```js
const user = {
  name: "Luca",
  printName() {
    console.log(this.name);
  },
};

const print = user.printName;

print(); // undefined o errore, dipende dalla modalita
```

La funzione non viene piu chiamata come `user.printName()`, quindi `this` non punta piu a `user`.

---

## `call`, `apply` e `bind`

`call` e `apply` eseguono una funzione impostando manualmente `this`.

```js
function printRole(prefix) {
  console.log(`${prefix}: ${this.role}`);
}

const admin = { role: "admin" };

printRole.call(admin, "Ruolo"); // "Ruolo: admin"
printRole.apply(admin, ["Ruolo"]); // "Ruolo: admin"
```

`bind` crea una nuova funzione con `this` fissato.

```js
const boundPrintRole = printRole.bind(admin);

boundPrintRole("Ruolo"); // "Ruolo: admin"
```

---

## Arrow function

Le arrow function non hanno un proprio `this`.

```js
const user = {
  name: "Luca",
  delayedPrint() {
    setTimeout(() => {
      console.log(this.name);
    }, 1000);
  },
};

user.delayedPrint(); // "Luca"
```

L'arrow function eredita `this` da `delayedPrint`.

Non usare arrow function come metodi quando ti serve il `this` dell'oggetto.

```js
const user = {
  name: "Luca",
  printName: () => {
    console.log(this.name);
  },
};

user.printName(); // di solito undefined
```

---

## Costruttori e classi

Con `new`, `this` punta alla nuova istanza.

```js
function User(name) {
  this.name = name;
}

const user = new User("Luca");

console.log(user.name); // "Luca"
```

Nelle classi, i metodi usano le stesse regole di `this`.

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

## Event listener

Nei listener DOM con funzione normale, `this` spesso punta all'elemento che ha ricevuto il listener.

```js
button.addEventListener("click", function (event) {
  console.log(this === event.currentTarget); // true
});
```

Con arrow function, `this` non viene impostato dal browser.

```js
button.addEventListener("click", (event) => {
  console.log(event.currentTarget);
});
```

Nel codice moderno e spesso piu chiaro usare `event.currentTarget`.

---

## Errori comuni

- Confondere `this` con lo scope.
- Estrarre un metodo e aspettarsi che mantenga il suo oggetto.
- Usare arrow function come metodi quando serve `this`.
- Dipendere dal `this` globale.
- Dimenticare `bind` quando si passa un metodo come callback.

---

## Checklist operativa

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

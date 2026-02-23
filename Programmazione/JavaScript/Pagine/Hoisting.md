---
date: 2026-02-19
tags: [javascript, programming, architecture]
type: #permanent-note
status: budding
---

# Hoisting in JavaScript

L'**Hoisting** è un comportamento di JavaScript in cui le dichiarazioni di variabili e funzioni vengono "sollevate" (spostate metaforicamente in cima) al loro scope di appartenenza durante la fase di compilazione, prima dell'esecuzione del codice.

## 1. Hoisting delle Variabili

Il comportamento varia drasticamente a seconda della parola chiave utilizzata.

### `var`
Le variabili dichiarate con `var` sono soggette a hoisting e vengono inizializzate con `undefined`.

```javascript
console.log(x); // undefined (non da errore!)
var x = 5;
```

### `let` e `const`
Anche `let` e `const` subiscono l'hoisting, ma **non vengono inizializzate**. Rimangono in uno stato chiamato **Temporal Dead Zone (TDZ)** dalla cima dello scope fino alla riga della dichiarazione.

```javascript
// console.log(y); // Errore: Cannot access 'y' before initialization
let y = 10;
```

> [!WARNING] Temporal Dead Zone
> Accedere a una variabile in TDZ causa un `ReferenceError`. Questo comportamento è stato introdotto per evitare bug silenti comuni con `var`.

## 2. Hoisting delle Funzioni

### Function Declarations
Le dichiarazioni di funzione vengono sollevate interamente. Possono essere chiamate prima di essere definite.

```javascript
sayHello(); // Funziona: "Ciao!"

function sayHello() {
    console.log("Ciao!");
}
```

### Function Expressions
Le espressioni di funzione (incluse le **Arrow Functions**) seguono le regole delle variabili con cui sono dichiarate.

```javascript
// greet(); // Errore: greet is not a function (se var) o Initialization error (se let/const)

var greet = function() {
    console.log("Salve");
};
```

---

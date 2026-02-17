---
date: 2026-02-17
tags: [javascript, arrow-functions, es6, sintassi, this-binding]
type: #permanent-note
status: budding
---

# Arrow Functions

Le **Arrow Functions** (funzioni a freccia), introdotte in **ES6 (2015)**, offrono una sintassi più sintetica per definire funzioni in JavaScript e introducono un comportamento peculiare riguardo al legame della parola chiave `this`.

## Sintassi

Esistono diverse varianti sintattiche a seconda della complessità della funzione.

### 1. Sintassi Base
Se la funzione ha più parametri o richiede più righe di codice.

```javascript
const sum = (a, b) => {
  return a + b;
};
```

### 2. Parametro Singolo
Se è presente un solo parametro, le parentesi tonde possono essere omesse.

```javascript
const square = x => x * x; // Implicit return
```

### 3. Ritorno Implicito (Implicit Return)
Se il corpo della funzione contiene una sola espressione, è possibile omettere le parentesi graffe e la parola chiave `return`.

```javascript
const greet = name => `Ciao, ${name}!`;
```

> [!IMPORTANT] Oggetti e Ritorno Implicito
> Se si desidera restituire un oggetto letterale in modo implicito, è necessario avvolgerlo tra parentesi tonde, altrimenti le graffe verrebbero interpretate come l'inizio del blocco della funzione.
> ```javascript
> const getUser = id => ({ id: id, name: "Luca" });
> ```

## Caratteristiche e Differenze Principali

Le arrow functions non sono solo "zucchero sintattico", ma differiscono dalle funzioni tradizionali (`function`) per alcuni aspetti fondamentali:

### 1. Lexical `this`
A differenza delle funzioni regolari, le arrow functions non hanno un proprio valore di `this`. Il valore di `this` all'interno di una arrow function è ereditato dallo **scope superiore** (lexical scoping).

```javascript
const timer = {
  seconds: 0,
  start: function() {
    setInterval(() => {
      this.seconds++; // 'this' refers to the 'timer' object
      console.log(this.seconds);
    }, 1000);
  }
};
```

> [!WARNING] Metodi di Oggetti
> Evitare l'uso di arrow functions per definire metodi di oggetti se si ha bisogno di accedere all'oggetto stesso tramite `this`.

### 2. Assenza dell'oggetto `arguments`
A differenza delle funzioni tradizionali, le arrow functions non hanno un proprio oggetto locale `arguments`. Questo oggetto, nelle funzioni classiche, contiene tutti i parametri passati alla funzione.

Nelle arrow functions, se si prova ad accedere ad `arguments`, verrà cercato nello scope esterno (con lo stesso meccanismo di `this`).

```javascript
// Function TRADIZIONALE
function standardFunc() {
  console.log(arguments); // [1, 2, 3]
}
standardFunc(1, 2, 3);

// ARROW Function
const arrowFunc = () => {
  console.log(arguments); // ReferenceError (o 'arguments' dello scope esterno)
};
```

> [!TIP] Soluzione: Rest Operator
> Per gestire un numero indefinito di argomenti nelle arrow functions, si utilizza il **Rest Operator** (`...`), che crea un vero Array (a differenza di `arguments` che è un oggetto "array-like").
> ```javascript
> const sumAll = (...args) => {
>   return args.reduce((acc, val) => acc + val, 0); // 'args' is a real Array
> };
> ```

### 3. Non sono Costruttori
Non possono essere utilizzate con l'operatore `new`. Se si tenta di farlo, JavaScript solleverà un `TypeError`.

## Quando Usarle

-   **Callback**: Perfette per metodi come `map`, `filter`, `forEach`.
-   **Metodi asincroni**: Quando si vuole preservare il contesto di `this` senza usare `.bind(this)`.
-   **Funzioni brevi**: Per migliorare la leggibilità del codice.
# Variabili e Tipi di Dati in JavaScript

In JavaScript, una variabile è un contenitore per un valore. Permette di memorizzare dati che possono essere utilizzati e manipolati nel corso del programma.

---

## Dichiarazione di Variabili

In JavaScript moderno (ES6+), ci sono tre parole chiave per dichiarare una variabile: `let`, `const`, e la più datata `var`.

### `let`
Permette di dichiarare variabili il cui valore **può essere riassegnato**. Ha un "block scope", cioè è visibile solo all'interno del blocco di codice (`{...}`) in cui è definita.

```javascript
let eta = 30;
console.log(eta); // Stampa 30

eta = 31;
console.log(eta); // Stampa 31

if (true) {
  let nome = "Mario";
  console.log(nome); // Stampa "Mario"
}
// console.log(nome); // Errore: nome is not defined (perché è fuori dal suo scope)
```

### `const`
Permette di dichiarare costanti, cioè variabili il cui valore **non può essere riassegnato** dopo la prima assegnazione. Anche `const` ha un "block scope".

```javascript
const annoDiNascita = 1990;
// annoDiNascita = 1991; // Errore: Assignment to constant variable.
```

**Importante:** Se una `const` contiene un oggetto o un array, non si può riassegnare la variabile, ma si possono modificare le proprietà dell'oggetto o gli elementi dell'array.

```javascript
const utente = {
  nome: "Alice",
  eta: 25
};

// Questo è permesso
utente.eta = 26;

// Questo causerebbe un errore
// utente = { nome: "Bob", eta: 30 };
```

### `var`
È il modo più vecchio di dichiarare variabili. Ha un "function scope" o "global scope", ma non un "block scope". Il suo utilizzo è **sconsigliato** nel codice moderno per evitare comportamenti inattesi (hoisting, sovrascrittura involontaria).

```javascript
var cognome = "Rossi";
if (true) {
  var cognome = "Bianchi"; // Sovrascrive la variabile esterna
  console.log(cognome); // Stampa "Bianchi"
}
console.log(cognome); // Stampa "Bianchi"
```

---

## Tipi di Dati

JavaScript è un linguaggio a **tipizzazione dinamica**: non è necessario specificare il tipo di dato di una variabile, e il tipo può cambiare durante l'esecuzione.

### Tipi Primitivi

1.  **String**: Una sequenza di caratteri.
    ```javascript
    let saluto = "Ciao mondo!";
    ```
2.  **Number**: Valori numerici, sia interi che in virgola mobile.
    ```javascript
    let numeroIntero = 100;
    let numeroDecimale = 3.14;
    ```
3.  **Boolean**: Valore logico `true` o `false`.
    ```javascript
    let isVero = true;
    ```
4.  **`undefined`**: Rappresenta un valore non definito. Una variabile dichiarata ma non inizializzata ha valore `undefined`.
    ```javascript
    let x;
    console.log(x); // undefined
    ```
5.  **`null`**: Rappresenta l'assenza intenzionale di un valore.
    ```javascript
    let y = null;
    ```
6.  **`BigInt`**: Per numeri interi troppo grandi per essere rappresentati dal tipo `Number`.
    ```javascript
    const numeroGrande = 1234567890123456789012345678901234567890n;
    ```
7.  **`Symbol`**: Un valore unico e immutabile, usato principalmente come chiave per le proprietà degli oggetti per evitare collisioni.
    ```javascript
    const id = Symbol('id');
    ```

### Tipi Complessi

*   **Object**: Il tipo di dato complesso principale. È una collezione di coppie chiave-valore.
    ```javascript
    let persona = {
      nome: "Luca",
      eta: 40,
      lavoro: "Sviluppatore"
    };
    ```
    Anche gli `Array` e le `Function` sono, tecnicamente, tipi speciali di oggetti in JavaScript.

---

## Operatore `typeof`
L'operatore `typeof` restituisce una stringa che indica il tipo di un operando.

```javascript
typeof "Ciao"      // "string"
typeof 3.14        // "number"
typeof true        // "boolean"
typeof undefined   // "undefined"
typeof {a: 1}      // "object"
typeof [1, 2]      // "object" (gli array sono oggetti)
typeof null        // "object" (questo è un bug storico di JavaScript!)
typeof function(){} // "function"
```
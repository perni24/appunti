---
date: 2026-02-19
tags: [javascript, programming, architecture]
type: #permanent-note
status: budding
---

# Scope in JavaScript

Lo **Scope** (ambito) definisce la visibilità e l'accessibilità delle variabili in diverse parti del codice. Determina dove una variabile può essere utilizzata e dove invece non è definita.

## 1. Global Scope
Una variabile dichiarata fuori da qualsiasi funzione o blocco appartiene allo **scope globale**. È accessibile da qualsiasi punto del programma.

```javascript
const globalVar = "Sono globale";

function test() {
    console.log(globalVar); // Funziona: "Sono globale"
}
```

## 2. Function Scope
Le variabili dichiarate all'interno di una funzione sono accessibili **solo** all'interno di quella funzione. In JavaScript, la parola chiave `var` segue sempre lo scope di funzione.

```javascript
function localExample() {
    var secret = "Solo qui dentro";
    console.log(secret); // "Solo qui dentro"
}

// console.log(secret); // Errore: secret is not defined
```

## 3. Block Scope
Introdotto con ES6, il **block scope** limita la visibilità delle variabili all'interno di un blocco racchiuso tra parentesi graffe `{}` (es. `if`, `for`, `while`). Questo vale solo per `let` e `const`.

```javascript
if (true) {
    let blockVariable = "Sono protetto dal blocco";
    var notBlocked = "Io posso uscire!";
}

console.log(notBlocked); // "Io posso uscire!"
// console.log(blockVariable); // Errore: blockVariable is not defined
```

> [!IMPORTANT] `var` vs `let/const`
> La differenza principale tra `var` e `let/const` risiede proprio nel Block Scope. `var` ignora i blocchi (tranne le funzioni), rendendo il codice più soggetto a bug e collisioni di nomi.

## 4. Scope Chain
Quando JavaScript cerca una variabile, inizia dallo scope attuale. Se non la trova, risale allo scope superiore (genitore) fino ad arrivare allo Global Scope. Questo processo è chiamato **Scope Chain**.

```javascript
const user = "Luca";

function outer() {
    const age = 30;

    function inner() {
        // inner cerca 'user' -> non lo trova -> sale a 'outer' -> non lo trova -> sale a Global
        console.log(`${user} ha ${age} anni`);
    }
    inner();
}

outer();
```

---
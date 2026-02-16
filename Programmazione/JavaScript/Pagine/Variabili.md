---
date: 2026-02-16
tags:
  - javascript
  - programming
  - basics
type: permanent-note
status: budding
---

# Variabili in JavaScript

Le **variabili** sono contenitori fondamentali per memorizzare e manipolare dati in un programma. In JavaScript, la gestione della memoria e dello scope è determinata dalla parola chiave utilizzata per la dichiarazione: `var`, `let` o `const`.

Ogni variabile associa un nome simbolico (identificatore) a un valore di un certo tipo.

## Tipizzazione Dinamica

JavaScript è un linguaggio a **tipizzazione debole** (o dinamica). A differenza di linguaggi come Java o C#, una variabile non è vincolata a un tipo specifico (es. `int` o `string`) e può cambiare contenuto durante l'esecuzione.

```javascript
let output = 42;    // output è un Number
output = "Ciao";    // ora output è una String
output = true;      // ora output è un Boolean
```

## Dichiarazione e Scope

La differenza principale tra le keyword risiede nel loro **Scope** (ambito di visibilità) e nella gestione del **Hoisting**.

### 1. `var` (Legacy / Function Scope)
Prima di ES6 (2015), `var` era l'unico modo per dichiarare variabili.
- **Scope:** È limitato alla **funzione** in cui è dichiarata (`function-scoped`). Se dichiarata fuori, diventa globale.
- **Hoisting:** La dichiarazione viene "sollevata" in cima alla funzione, ma inizializzata a `undefined`.
- **Riassegnabile:** Sì.

> [!WARNING] Problemi di `var`
> Poiché `var` ignora i blocchi `{ ... }` (come `if` o `for`), può causare bug sovrascrivendo variabili globali o esterne inavvertitamente.

```javascript
function esempioVar() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10 -> 'var' ignora il blocco if!
}
```

### 2. `let` (Block Scope)
Introdotto per correggere i difetti di `var`.
- **Scope:** È limitato al **blocco** `{ ... }` in cui si trova (`block-scoped`).
- **Hoisting:** Esiste, ma la variabile finisce nella **Temporal Dead Zone (TDZ)** fino alla riga di dichiarazione. Accedervi prima causa un `ReferenceError`.
- **Riassegnabile:** Sì.

```javascript
function esempioLet() {
  if (true) {
    let y = 20;
  }
  // console.log(y); // ReferenceError: y is not defined
}
```

### 3. `const` (Costanti)
Simile a `let` per lo scope, ma impone un vincolo sull'assegnazione.
- **Scope:** Block Scope.
- **Immutabilità:** Non del valore, ma del **binding** (associazione nome-valore). Non puoi usare `=` di nuovo su di essa.

> [!INFO] Mutabilità degli Oggetti
> `const` impedisce la riassegnazione della variabile, ma **non** rende immutabile l'oggetto a cui punta. Puoi modificare le proprietà di un oggetto dichiarato con `const`.

```javascript
const user = { nome: "Luca" };
user.nome = "Marco"; // LECITO: modifichi la proprietà, non il binding
// user = {}; // ERRORE: Assignment to constant variable.
```

## Tabella Comparativa

| Keyword | Scope | Hoisting | Riassegnabile | Riedicharabile nel blocco |
| :--- | :--- | :--- | :--- | :--- |
| `var` | Function | Sì (init `undefined`) | Sì | Sì |
| `let` | Block | Sì (TDZ Error) | Sì | No |
| `const` | Block | Sì (TDZ Error) | No | No |

## Best Practices

1. **Usa `const`**: per variabili che non devono cambiare valore.
2. **Usa `let`**: per variabili che devono cambiare valore nel tempo (es. contatori di loop, accumulatori).
3. **Evita `var`**: Non ci sono motivi moderni per usare `var`, a meno di dover mantenere codice legacy molto vecchio.

---
date: 2026-02-16
tags:
  - javascript
  - programming
  - basics
type: permanent-note
status: budding
---

# Funzioni in JavaScript

Le **funzioni** sono blocchi di codice riutilizzabili progettati per eseguire un compito specifico. Sono uno dei mattoni fondamentali di JavaScript.

Una funzione viene eseguita quando viene "invocata" (chiamata).

## 1. Dichiarazione di Funzione (Function Declaration)
È il metodo classico.
Caratteristica chiave: **Hoisting**. Le funzioni dichiarate in questo modo vengono spostate in cima al loro scope, quindi possono essere chiamate *prima* di essere definite nel codice.

```javascript
saluta("Luca"); // Funziona grazie all'hoisting!

function saluta(nome) {
  console.log("Ciao " + nome);
}
```

## 2. Espressione di Funzione (Function Expression)
La funzione viene assegnata a una variabile.
Caratteristica chiave: **No Hoisting**. La funzione esiste solo dopo che l'esecuzione raggiunge la riga di assegnazione.

```javascript
// salutaVar("Marco"); // Error: Cannot access before initialization

const salutaVar = function(nome) {
  console.log("Ciao " + nome);
};
```

## 3. Parametri e Argomenti
- **Parametri**: I nomi elencati nella definizione della funzione.
- **Argomenti**: I valori reali passati alla funzione quando viene chiamata.

```javascript
function somma(a, b) { // a, b sono PARAMETRI
  return a + b;
}

somma(5, 10); // 5, 10 sono ARGOMENTI
```

> [!TIP] Parametri Default
> Da ES6, puoi definire valori di default: `function test(a = 1) { ... }`

## 4. Il valore `return`
Quando JS raggiunge un'istruzione `return`, la funzione **si ferma** e restituisce il valore specificato al chiamante.
Se non c'è `return`, la funzione restituisce `undefined`.

```javascript
function area(lato) {
  if (lato < 0) return 0; // Esce subito se lato negativo
  return lato * lato;
}

const risultato = area(5); // 25
```
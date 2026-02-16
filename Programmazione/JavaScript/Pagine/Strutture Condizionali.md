---
date: 2026-02-16
tags:
  - javascript
  - programming
  - basics
type: permanent-note
status: budding
---

# Strutture Condizionali in JavaScript

Le **strutture condizionali** permettono di eseguire blocchi di codice diversi in base al verificarsi o meno di determinate condizioni (valori booleani `true` o `false`).

## 1. `if`, `else if`, `else`
È la struttura di controllo più comune. Valuta una condizione tra parentesi tonde `()` e, se vera, esegue il blocco nelle graffe `{}`.

```javascript
const orario = 14;

if (orario < 12) {
  console.log("Buongiorno");
} else if (orario < 18) {
  console.log("Buon pomeriggio");
} else {
  console.log("Buonasera");
}
```

### Truthy e Falsy
In JavaScript, le condizioni negli `if` non devono essere per forza booleani puri. Il linguaggio esegue una **conversione implicita** (Type Coercion).

Un valore è **Falsy** (considerato `false`) se è:
- `false`
- `0` (zero)
- `""` (stringa vuota)
- `null`
- `undefined`
- `NaN`

Tutti gli altri valori sono **Truthy** (considerati `true`), inclusi array vuoti `[]` e oggetti vuoti `{}`.

```javascript
const nome = ""; // Stringa vuota -> Falsy

if (nome) {
  console.log("Nome presente: " + nome);
} else {
  console.log("Nome non inserito"); // Verrà eseguito questo
}
```

## 2. `switch`
Utile quando si deve confrontare una singola variabile con **molti valori diversi** (uguaglianza stretta `===`).

> [!WARNING] Il `break` è essenziale
> Senza l'istruzione `break`, l'esecuzione "cade" (fall-through) nei case successivi, eseguendo anche codice che non dovrebbe.

```javascript
const giorno = 3;

switch (giorno) {
  case 1:
    console.log("Lunedì");
    break;
  case 2:
    console.log("Martedì");
    break;
  case 3:
    console.log("Mercoledì");
    break;
  default:
    console.log("Giorno non valido");
}
```

## 3. Operatore Ternario
Una forma concisa di `if...else`, molto utile per assegnazioni condizionali.

```javascript
const stato = online ? "Connesso" : "Disconnesso";
```
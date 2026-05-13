---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, basics, conditionals, if, switch, truthy, falsy]
aliases: [Condizioni JS, Controllo di flusso JS]
prerequisites: [Operatori, Tipi di Dati]
related: [Operatori, Cicli]
---

# Strutture Condizionali

## Sintesi

Le strutture condizionali permettono di eseguire codice diverso in base a una condizione.

In JavaScript le condizioni non devono essere per forza booleani: qualunque valore viene valutato come truthy o falsy.

---

## if, else if, else

`if` esegue un blocco quando la condizione e vera.

```js
const hour = 14;

if (hour < 12) {
  console.log("Buongiorno");
} else if (hour < 18) {
  console.log("Buon pomeriggio");
} else {
  console.log("Buonasera");
}
```

Usa `else if` per condizioni alternative e `else` come fallback.

---

## Truthy e falsy

Valori falsy:

- `false`;
- `0`;
- `-0`;
- `0n`;
- `""`;
- `null`;
- `undefined`;
- `NaN`.

Tutti gli altri valori sono truthy, inclusi:

- `[]`;
- `{}`;
- `"false"`;
- `"0"`;
- funzioni.

```js
const name = "";

if (name) {
  console.log("Nome presente");
} else {
  console.log("Nome mancante");
}
```

> [!WARNING]
> Array e oggetti vuoti sono truthy.

```js
if ([]) {
  console.log("Eseguito");
}
```

---

## Condizioni esplicite

Quando il significato e importante, preferisci condizioni esplicite.

```js
const users = [];

if (users.length > 0) {
  console.log("Ci sono utenti");
}
```

Meglio di:

```js
if (users) {
  console.log("Questo e sempre true per un array");
}
```

---

## switch

`switch` confronta una espressione con piu casi usando uguaglianza stretta.

```js
const status = "loading";

switch (status) {
  case "idle":
    console.log("In attesa");
    break;
  case "loading":
    console.log("Caricamento");
    break;
  case "error":
    console.log("Errore");
    break;
  default:
    console.log("Stato sconosciuto");
}
```

`break` evita il fall-through verso i casi successivi.

---

## Fall-through intenzionale

A volte il fall-through e voluto, ma deve essere evidente.

```js
const role = "admin";

switch (role) {
  case "admin":
  case "owner":
    console.log("Accesso completo");
    break;
  default:
    console.log("Accesso limitato");
}
```

---

## Operatore ternario

Il ternario e utile per assegnazioni semplici.

```js
const age = 20;
const label = age >= 18 ? "adulto" : "minorenne";
```

Evita ternari annidati complessi.

```js
// Difficile da leggere
const label = score > 90 ? "A" : score > 70 ? "B" : "C";
```

In questi casi, usa `if...else` o una funzione.

---

## Guard clause

Una guard clause interrompe subito la funzione se una condizione non e valida.

```js
function getUserName(user) {
  if (!user) {
    return "Guest";
  }

  return user.name;
}
```

Riduce annidamenti e rende piu chiaro il flusso.

---

## Errori comuni

- Pensare che `[]` o `{}` siano falsy.
- Dimenticare `break` dentro `switch`.
- Usare condizioni implicite quando serve distinguere `0`, `""`, `null` e `undefined`.
- Scrivere ternari troppo lunghi.
- Annidare troppi `if` invece di usare guard clause.

---

## Checklist

- La condizione e leggibile?
- Sto distinguendo valori falsy validi come `0` o `""`?
- Serve `if...else`, `switch` o ternario?
- In uno `switch`, ho gestito `default`?
- Posso semplificare con una guard clause?

---

## Collegamenti

- [[Operatori]]
- [[Tipi di Dati]]
- [[Cicli]]
- [[Funzioni]]

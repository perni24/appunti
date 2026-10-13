---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - basics
  - conditionals
  - if
  - switch
  - truthy
  - falsy
aliases:
  - Condizioni JS
  - Controllo di flusso JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Operatori]]"
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Operatori]]"
  - "[[Programmazione/JavaScript/Pagine/Cicli]]"
title: Strutture Condizionali
---

# Strutture Condizionali

## Sintesi

Le strutture condizionali permettono di eseguire codice diverso in base a una condizione.

In JavaScript le condizioni non devono essere per forza booleani: qualunque valore viene valutato come truthy o falsy.

---

## Quando usarlo

Usa strutture condizionali quando il programma deve scegliere tra percorsi diversi.

Casi comuni:

- validare input;
- gestire stati applicativi;
- scegliere messaggi o UI;
- interrompere funzioni con guard clause;
- trattare errori o casi limite;
- selezionare comportamento in base a ruolo, stato o configurazione.

Preferisci condizioni esplicite quando valori falsy come `0` o `""` sono validi.

## Come funziona

### if, else if, else
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
### Truthy e falsy
Valori falsy:

- `false`;
- `0`;
- `-0`;
- `0n`;
- `""`;
- `null`;
- `undefined`;
- `NaN`.

Gli altri valori ordinari sono truthy, inclusi:

- `[]`;
- `{}`;
- `"false"`;
- `"0"`;
- funzioni.

Nel browser esiste un'eccezione storica: `document.all` e un oggetto falsy. Non usarlo come modello per il codice moderno.

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
### Condizioni esplicite
Quando il significato e importante, preferisci condizioni esplicite.

```js
const users = [];

if (users.length > 0) {
  console.log("Ci sono utenti");
}
```

Il solo controllo dell'array, invece, non ne verifica il contenuto:

```js
const users = [];

if (users) {
  console.log("Questo e sempre true per un array");
}
```

---
### switch
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

Il confronto non converte i tipi: `case 1` non corrisponde a `"1"`. Anche `case NaN` non puo riconoscere `NaN`: usa `Number.isNaN()` in una condizione separata.

I `case` condividono lo scope dello `switch`. Se dichiari `let` o `const` con lo stesso nome in piu rami, racchiudi ciascun ramo in un blocco:

```js
const action = "save";

switch (action) {
  case "save": {
    const message = "Salvato";
    console.log(message);
    break;
  }
  case "delete": {
    const message = "Eliminato";
    console.log(message);
    break;
  }
  default:
    console.log("Azione sconosciuta");
}
```

---
### Fall-through intenzionale
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
### Operatore ternario
Il ternario e utile per assegnazioni semplici.

```js
const age = 20;
const label = age >= 18 ? "adulto" : "minorenne";
```

Evita ternari annidati complessi.

```js
// Difficile da leggere
const score = 80;
const label = score > 90 ? "A" : score > 70 ? "B" : "C";
```

In questi casi, usa `if...else` o una funzione.

---
### Guard clause
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

Qui si assume che `user` sia assente oppure un oggetto gia valido con `name`. Il controllo `!user` non verifica lo schema: `{}` supera la guardia e produce `undefined`. La validazione dei dati esterni deve controllare anche tipi e proprieta richieste.

---

## API / Sintassi

Forme principali (schemi: `condition`, `otherCondition` e `value` rappresentano valori da definire):

```js
if (condition) {
  // ...
} else if (otherCondition) {
  // ...
} else {
  // ...
}
```

```js
switch (value) {
  case "a":
    break;
  default:
    break;
}
```

```js
const label = condition ? "si" : "no";
```

Guard clause:

```js
function run(input) {
  if (!input) {
    return;
  }

  // percorso principale
}
```

## Esempio pratico

Calcolo di uno sconto con guard clause. Il contratto prevede `user` assente oppure un oggetto gia validato, con `active` booleano e `role` stringa:

```js
function getDiscount(user) {
  if (!user) {
    return 0;
  }

  if (user.active !== true) {
    return 0;
  }

  if (user.role === "premium") {
    return 0.2;
  }

  return 0.05;
}
```

Le guard clause evitano un blocco annidato e mettono subito in evidenza i casi di uscita.

Il risultato e una frazione: `0.2` significa 20%. Il confronto con `true` evita di trattare stringhe come `"false"` come utenti attivi, ma non sostituisce la validazione completa dell'oggetto.

## Varianti

- **`if` semplice**: una condizione.
- **`if/else`**: due percorsi.
- **`else if`**: piu alternative ordinate.
- **`switch`**: confronto con piu valori discreti.
- **Ternario**: scelta breve usata in espressioni.
- **Guard clause**: uscita anticipata per casi non validi.

## Errori comuni

- Pensare che `[]` o `{}` siano falsy.
- Dimenticare `break` dentro `switch`.
- Usare condizioni implicite quando serve distinguere `0`, `""`, `null` e `undefined`.
- Scrivere ternari troppo lunghi.
- Annidare troppi `if` invece di usare guard clause.
- Scambiare un controllo truthy per una validazione di tipo o di schema.

---

## Checklist

- La condizione e leggibile?
- Sto distinguendo valori falsy validi come `0` o `""`?
- Serve `if...else`, `switch` o ternario?
- In uno `switch`, ho gestito `default`?
- Posso semplificare con una guard clause?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Operatori|Operatori]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Cicli|Cicli]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]

## Fonti

- [MDN: valori falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy).
- [MDN: switch, confronto e scope dei case](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch).
- [MDN: controllo di flusso](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

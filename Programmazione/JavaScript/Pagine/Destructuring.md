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
  - es6
  - destructuring
  - objects
  - arrays
aliases:
  - Destrutturazione
  - Destructuring assignment
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Spread & Rest Operators]]"
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
title: Destructuring
---

# Destructuring

## Sintesi

Il destructuring permette di estrarre valori da array e oggetti assegnandoli a variabili in modo compatto.

Riduce codice ripetitivo e rende espliciti i dati usati da una funzione o da un blocco.

---

## Quando usarlo

Usa destructuring quando vuoi estrarre pochi valori da una struttura nota rendendo esplicito cosa ti serve.

Casi comuni:

- leggere proprieta da oggetti;
- estrarre elementi da array o tuple;
- gestire oggetti di opzioni;
- ricevere risultati multipli;
- rendere piu chiara la firma di una funzione.

Evitalo quando la struttura e molto annidata o incerta: il codice puo diventare fragile e meno leggibile.

## Come funziona

### Destructuring degli array
L'estrazione dagli array avviene per posizione.

La forma `[a, b]` usa in realta il protocollo iterabile: funziona anche con un `Set`, non con un semplice oggetto dotato soltanto di chiavi numeriche e `length`.

```js
const [firstColor, secondColor] = new Set(["red", "green"]);
console.log(firstColor, secondColor); // "red", "green"
```

```js
const colors = ["red", "green", "blue"];

const [first, second] = colors;

console.log(first);  // "red"
console.log(second); // "green"
```

---
### Saltare elementi
```js
const values = ["A", "B", "C"];

const [first, , third] = values;

console.log(first); // "A"
console.log(third); // "C"
```

Usalo con moderazione: troppi salti riducono la leggibilita.

---
### Valori di default
```js
const [name = "Guest"] = [];

console.log(name); // "Guest"
```

Il default viene usato solo se il valore e `undefined`.

---
### Rest negli array
```js
const [head, ...tail] = [1, 2, 3, 4];

console.log(head); // 1
console.log(tail); // [2, 3, 4]
```

Il rest deve essere l'ultimo elemento.

---
### Destructuring degli oggetti
L'estrazione dagli oggetti avviene per nome della proprieta.

```js
const user = {
  name: "Luca",
  role: "admin",
};

const { name, role } = user;

console.log(name);
console.log(role);
```

L'ordine non conta.

La lettura puo trovare anche proprieta ereditate ed eseguire getter. Non e una validazione dei dati. Destrutturare `null` o `undefined` genera `TypeError`, anche con un pattern vuoto.

---
### Rinomina
Puoi estrarre una proprieta usando un nome diverso.

```js
const user = {
  name: "Luca",
};

const { name: userName } = user;

console.log(userName); // "Luca"
```

Viene dichiarata `userName`, non una variabile `name`.

### Assegnare a variabili esistenti

```js
let name;
const user = { name: "Ada" };
({ name } = user);
console.log(name); // "Ada"
```

Le parentesi impediscono che le graffe iniziali siano interpretate come un blocco. Per riassegnare serve una variabile modificabile, non `const`.

---
### Default negli oggetti
```js
const user = {
  name: "Luca",
};

const { role = "reader" } = user;

console.log(role); // "reader"
```

---
### Destructuring nidificato
```js
const response = {
  data: {
    user: {
      name: "Luca",
    },
  },
};

const {
  data: {
    user: { name },
  },
} = response;

console.log(name);
```

Attenzione: se una proprieta intermedia e `undefined` o `null`, il destructuring genera errore. Un default `= {}` coprirebbe soltanto `undefined`, non `null`.

---
### Parametri di funzione
Molto utile quando una funzione riceve un oggetto di opzioni.

```js
function createUser({ name, role = "reader" }) {
  return {
    name,
    role,
  };
}

createUser({ name: "Luca" });
```

Per evitare errori se non viene passato nulla:

```js
function createUser({ name = "Guest" } = {}) {
  return { name };
}
```

---

## API / Sintassi

Array:

```js
const [first, second] = values;
const [head, ...tail] = values;
const [name = "Guest"] = values;
```

Oggetti: queste sono forme alternative, da non incollare nello stesso scope perche ridichiarerebbero `role`.

```js
const { name, role } = user;
```

```js
const { name: userName } = user;
```

```js
const { role = "reader" } = user;
```

Parametri:

```js
function createUser({ name, role = "reader" } = {}) {
  return { name, role };
}
```

La forma `= {}` evita errore quando la funzione viene chiamata senza argomento, ma non con `null`. Nei frammenti di sintassi, `values` e `user` rappresentano dati gia disponibili.

## Esempio pratico

Estrarre solo i campi necessari da una risposta:

```js
function renderUserCard(response) {
  const user = response?.data?.user;
  if (user === null || user === undefined) {
    return "Utente non disponibile";
  }
  if (
    typeof user !== "object" || Array.isArray(user) ||
    typeof user.name !== "string" ||
    (user.role !== undefined && typeof user.role !== "string")
  ) {
    throw new TypeError("Dati utente non validi");
  }

  const { name, role = "reader" } = user;
  return `${name} - ${role}`;
}
```

La funzione restituisce una label, non HTML. Distingue un utente assente da campi malformati: il controllo precede il destructuring, che da solo non garantisce i tipi. Anche `role: null` viene rifiutato, non sostituito silenziosamente dal default.

## Varianti

- **Array destructuring**: estrae per posizione.
- **Object destructuring**: estrae per nome proprieta.
- **Default values**: fallback solo per `undefined`.
- **Rename**: assegna una proprieta a un nome diverso.
- **Rest**: raccoglie il resto degli elementi o proprieta.
- **Nested destructuring**: estrae strutture annidate, ma puo ridurre leggibilita.

## Errori comuni

- Destrutturare da `undefined` o `null`.
- Usare destructuring troppo annidato.
- Confondere posizione negli array e chiave negli oggetti.
- Dimenticare che i default valgono solo per `undefined`, non per `null`.
- Rendere la firma di una funzione difficile da leggere.

---

## Checklist

- Sto destrutturando un array o un oggetto?
- La struttura puo essere `undefined`?
- Serve un valore di default?
- La destrutturazione e ancora leggibile?
- Nei parametri, serve `= {}` come default?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Spread & Rest Operators|Spread & Rest Operators]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Default Parameters|Default Parameters]]


## Fonti

- [MDN - Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

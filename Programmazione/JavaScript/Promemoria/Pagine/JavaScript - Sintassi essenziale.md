---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - promemoria
  - sintassi
aliases:
  - Cheatsheet sintassi JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Variabili|Variabili]]"
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Operatori|Operatori]]"
title: JavaScript - Sintassi essenziale
---

# JavaScript - Sintassi essenziale

## Uso rapido

Forme da adattare al tuo codice; i nomi come `user`, `items` e `value` rappresentano dati gia disponibili. I blocchi sono esempi separati, non un unico programma.

## Variabili

```javascript
const name = "Ada"       // binding non riassegnabile
let count = 0            // valore riassegnabile
```

`const` non rende immutabile un oggetto: vieta di riassegnare la variabile.

## Tipi

```javascript
typeof "test"            // "string"
typeof 42                // "number"
typeof true              // "boolean"
typeof undefined         // "undefined"
typeof 10n               // "bigint"
typeof Symbol("id")      // "symbol"
typeof {}                // "object"
typeof null              // "object": caso storico
typeof (() => {})        // "function"

Array.isArray([])        // true
value === null           // controllo di null
```

## Confronti e valori mancanti

```javascript
value === expected
value !== expected

const label = value ?? "Predefinito"
const city = user?.address?.city
```

Usa `===` e `!==` come scelta predefinita. `??` sostituisce solo `null`/`undefined`, mentre `||` sostituisce anche `0`, `false` e `""`. `user?.x` richiede comunque che `user` sia dichiarata.

## Condizioni

```javascript
const score = 75
let result

if (score >= 90) {
  result = "A"
} else if (score >= 60) {
  result = "B"
} else {
  result = "C"
}
```

```javascript
const status = active ? "online" : "offline"
```

```javascript
const role = "user"

switch (role) {
  case "admin":
    break
  case "user":
    break
  default:
    break
}
```

Per dichiarazioni `let`/`const` nei `case`, usa blocchi `{ ... }` distinti. `break` evita di proseguire nel caso successivo.

## Cicli

```javascript
for (let index = 0; index < items.length; index += 1) {
  console.log(items[index])
}
```

```javascript
for (const item of items) {
  console.log(item)
}
```

```javascript
for (const [key, value] of Object.entries(object)) {
  console.log(key, value)
}
```

## Destructuring

```javascript
const { id, name: displayName, role = "user" } = user
const [first, second, ...remaining] = values
```

Il default del destructuring vale solo per `undefined`, non per `null`; destrutturare direttamente `null` o `undefined` genera errore.

## Spread e rest

```javascript
const copy = { ...user }
const updated = { ...user, name: "Grace" }
const combined = [...firstList, ...secondList]

function sum(...numbers) {
  return numbers.reduce((total, number) => total + number, 0)
}
```

Spread crea una copia superficiale: gli oggetti annidati restano condivisi. `for...of` visita i valori di un iterabile; per le proprieta proprie enumerabili di un record usa `Object.entries()`, non `for...in`.

## Template literal

```javascript
const message = `Ciao ${name}, hai ${count} messaggi`
```

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Variabili|Variabili]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Operatori|Operatori]]
- [[Programmazione/JavaScript/Pagine/Strutture Condizionali|Strutture Condizionali]]
- [[Programmazione/JavaScript/Pagine/Cicli|Cicli]]
- [[Programmazione/JavaScript/Pagine/Destructuring|Destructuring]]
- [[Programmazione/JavaScript/Pagine/Spread & Rest Operators|Spread & Rest Operators]]
- [[Programmazione/JavaScript/Pagine/Template Literals|Template Literals]]

## Fonti

- [MDN: operatori](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

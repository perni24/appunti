---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, sintassi]
aliases: [Cheatsheet sintassi JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Operatori]]"
---

# JavaScript - Sintassi essenziale

## Variabili

```javascript
const name = "Ada"       // riferimento non riassegnabile
let count = 0            // valore riassegnabile
```

## Tipi

```javascript
typeof "test"            // "string"
typeof 42                // "number"
typeof true              // "boolean"
typeof undefined         // "undefined"
typeof 10n               // "bigint"
typeof Symbol("id")      // "symbol"
typeof {}                // "object"
typeof null              // "object"

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

Usare `===` e `!==` come scelta predefinita.

## Condizioni

```javascript
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
switch (role) {
  case "admin":
    break
  case "user":
    break
  default:
    break
}
```

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

## Spread e rest

```javascript
const copy = { ...user }
const updated = { ...user, name: "Grace" }
const combined = [...firstList, ...secondList]

function sum(...numbers) {
  return numbers.reduce((total, number) => total + number, 0)
}
```

Spread crea una copia superficiale.

## Template literal

```javascript
const message = `Ciao ${name}, hai ${count} messaggi`
```

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Variabili]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Operatori]]
- [[Programmazione/JavaScript/Pagine/Strutture Condizionali]]
- [[Programmazione/JavaScript/Pagine/Cicli]]
- [[Programmazione/JavaScript/Pagine/Destructuring]]
- [[Programmazione/JavaScript/Pagine/Spread & Rest Operators]]
- [[Programmazione/JavaScript/Pagine/Template Literals]]

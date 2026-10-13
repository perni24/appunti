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
  - array
aliases:
  - Cheatsheet array JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]"
title: JavaScript - Array
---

# JavaScript - Array

## Uso rapido

I blocchi che usano `values` partono dall'array definito sotto e non lo modificano. Gli altri dichiarano dati propri. Le copie mostrate sono superficiali.

## Creazione e accesso

```javascript
const values = [10, 20, 30]

values[0]                 // 10
values.at(-1)             // 30
values.length             // 3
Array.from("abc")         // ["a", "b", "c"]
Array.isArray(values)     // true
```

## Aggiungere e rimuovere

| Metodo | Effetto | Modifica l'array |
|---|---|---|
| `push(value)` | Aggiunge in fondo | Si |
| `pop()` | Rimuove dal fondo | Si |
| `unshift(value)` | Aggiunge all'inizio | Si |
| `shift()` | Rimuove dall'inizio | Si |
| `splice(start, count, ...items)` | Rimuove/inserisce; restituisce gli elementi rimossi | Si |
| `toSpliced(start, count, ...items)` | Restituisce la copia modificata | No |

```javascript
const appended = [...values, 40]
const prepended = [0, ...values]
const withoutSecond = values.filter((_, index) => index !== 1)
```

`push`/`unshift` restituiscono la nuova lunghezza; `pop`/`shift` l'elemento rimosso oppure `undefined` se vuoto.

## Cercare

```javascript
values.includes(20)                       // true
values.indexOf(99)                        // -1
values.find((value) => value > 15)         // 20
values.findIndex((value) => value > 99)    // -1
```

Non passare un indice `-1` a `splice`: rimuoveresti l'ultimo elemento. `find` restituisce `undefined` se non trova; `includes(NaN)` puo trovare `NaN`, `indexOf(NaN)` no.

## Trasformare

```javascript
const doubled = values.map((value) => value * 2)
const filtered = values.filter((value) => value >= 20)
const total = values.reduce((sum, value) => sum + value, 0)
```

## Verificare

```javascript
values.some((value) => value < 0)
values.every((value) => value > 0)
```

Su un array vuoto `some` e `false`, `every` e `true`; `reduce` senza valore iniziale genera errore.

## Ordinare

```javascript
const ascending = [...values].sort((left, right) => left - right)
const descending = [...values].sort((left, right) => right - left)
const users = [{ name: "Grace" }, { name: "Ada" }]
const byName = users.toSorted((a, b) => a.name.localeCompare(b.name, "it"))
```

`sort()` modifica l'originale e senza comparatore ordina come stringhe. `toSorted()`/`toSpliced()` richiedono runtime compatibili; per l'ordinamento la copia con spread e `sort` e l'alternativa mostrata.

## Estrarre e unire

```javascript
values.slice(1, 3) // [20, 30]: fine esclusa
const first = [1, 2]
const second = [3]
const nested = [1, [2, [3]]]
first.concat(second) // [1, 2, 3]
const combined = [...first, ...second] // stessa unione
nested.flat(2) // [1, 2, 3]
```

## Iterare

```javascript
values.forEach((value, index) => {
  console.log(index, value)
})
```

Usa `map` per un array trasformato, `forEach` per effetti sincroni: non attende callback `async`. Per dati applicativi preferisci array densi; `map` e `forEach` saltano gli indici assenti.

## Raggruppare per chiave

```javascript
function groupByRole(users) {
  return users.reduce((groups, user) => {
    const role = user.role // contratto: stringa gia validata
    groups[role] ??= []
    groups[role].push(user)
    return groups
  }, Object.create(null))
}

const byRole = groupByRole([
  { name: "Ada", role: "__proto__" },
  { name: "Grace", role: "admin" },
])
```

Il dizionario senza prototipo evita collisioni con `__proto__`, `constructor` e `toString`; gli utenti restano gli oggetti originali, non copie.

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]

## Fonti

- [MDN: toSorted e compatibilita](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

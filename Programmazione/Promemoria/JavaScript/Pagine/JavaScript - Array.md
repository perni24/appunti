---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, array]
aliases: [Cheatsheet array JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]"
---

# JavaScript - Array

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
| `splice(start, count)` | Rimuove o inserisce | Si |
| `toSpliced(start, count)` | Copia modificata | No |

```javascript
const appended = [...values, 40]
const prepended = [0, ...values]
const withoutSecond = values.filter((_, index) => index !== 1)
```

## Cercare

```javascript
values.includes(20)
values.indexOf(20)
values.find((value) => value > 15)
values.findIndex((value) => value > 15)
```

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

## Ordinare

```javascript
const ascending = [...values].sort((left, right) => left - right)
const descending = [...values].sort((left, right) => right - left)
const byName = [...users].sort((a, b) => a.name.localeCompare(b.name))
```

`sort()` modifica l'array originale. Copiarlo prima oppure usare `toSorted()`.

## Estrarre e unire

```javascript
values.slice(1, 3)
first.concat(second)
[...first, ...second]
nested.flat(2)
```

## Iterare

```javascript
values.forEach((value, index) => {
  console.log(index, value)
})
```

Usare `map()` quando serve un nuovo array; `forEach()` per effetti collaterali.

## Raggruppare per chiave

```javascript
const byRole = users.reduce((groups, user) => {
  const role = user.role
  groups[role] ??= []
  groups[role].push(user)
  return groups
}, {})
```

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Array Methods]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Functional Programming]]

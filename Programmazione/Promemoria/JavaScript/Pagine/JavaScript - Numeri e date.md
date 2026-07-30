---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, numeri, date]
aliases: [Cheatsheet numeri e date JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Date & Time]]"
---

# JavaScript - Numeri e date

## Numeri

```javascript
Number("42")                    // 42
Number.parseInt("42px", 10)     // 42
Number.parseFloat("3.14")       // 3.14
Number.isNaN(value)
Number.isFinite(value)
Number.isInteger(value)
```

## Arrotondare

```javascript
Math.round(3.6)                 // 4
Math.floor(3.6)                 // 3
Math.ceil(3.1)                  // 4
Math.trunc(3.9)                 // 3
```

```javascript
const rounded = Math.round(value * 100) / 100
const display = value.toFixed(2)
```

`toFixed()` restituisce una stringa.

## Minimo, massimo e casuale

```javascript
Math.min(...values)
Math.max(...values)

const random = Math.random()
const integer = Math.floor(Math.random() * (max - min + 1)) + min
```

Non usare `Math.random()` per token o valori di sicurezza.

## Formattare

```javascript
new Intl.NumberFormat("it-IT").format(1234567.89)
```

```javascript
new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
}).format(19.9)
```

## Date

```javascript
const now = new Date()
const fromIso = new Date("2026-07-30T12:00:00Z")
const timestamp = Date.now()
```

```javascript
date.toISOString()
date.getTime()
date.getFullYear()
date.getMonth() + 1
date.getDate()
date.getHours()
```

`getMonth()` parte da `0`.

## Confrontare

```javascript
firstDate.getTime() < secondDate.getTime()
```

## Aggiungere giorni

```javascript
const nextDate = new Date(date)
nextDate.setDate(nextDate.getDate() + 7)
```

## Formattare una data

```javascript
const formatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Rome",
})

formatter.format(date)
```

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Date & Time]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati]]

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
  - numeri
  - date
aliases:
  - Cheatsheet numeri e date JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Date & Time|Date & Time]]"
title: JavaScript - Numeri e date
---

# JavaScript - Numeri e date

## Uso rapido

Forme rapide per numeri finiti e Date valide. Nei frammenti generici `value`, `values` e `date` sono dati gia disponibili; i blocchi di calcolo non sono validatori di input.

## Numeri

```javascript
Number("42")                    // 42
Number.parseInt("42px", 10)     // 42
Number.parseFloat("3.14")       // 3.14
Number.isNaN(value)
Number.isFinite(value)
Number.isInteger(value)
```

`Number("")` e `Number(" ")` danno 0; `parseInt`/`parseFloat` accettano prefissi numerici come `42px`. Per input esterni verifica prima formato e intervallo; `Number.isFinite` non converte stringhe. Per interi affidabili usa anche `Number.isSafeInteger`.

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

`toFixed` restituisce una stringa. Moltiplicare per 100 e arrotondare non garantisce precisione decimale (`1.005` e un caso limite). Per importi usa una strategia esplicita, per esempio unita minime intere con limiti sicuri.

## Minimo, massimo e casuale

```javascript
Math.min(...values)
Math.max(...values)

const random = Math.random()
const integer = Math.floor(Math.random() * (max - min + 1)) + min
```

La formula intera assume `min`/`max` interi sicuri, `min <= max` e un intervallo piccolo. Non usare `Math.random` per sicurezza. Evita spread su array enormi; `Math.min()` senza argomenti vale `Infinity`, `Math.max()` vale `-Infinity`.

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

I getter sopra usano il fuso locale del runtime; `getMonth()` parte da 0. Usa `getUTCFullYear`/`getUTCMonth` ecc. per UTC. `toISOString` restituisce UTC e genera `RangeError` su una Date invalida; `getTime` e `Date.now` usano millisecondi dall'epoch.

```javascript
const invalid = new Date("non-una-data")
Number.isNaN(invalid.getTime()) // true
```

Specifica `Z` o un offset per un istante: `2026-07-30` viene interpretata come data UTC, `2026-07-30T12:00:00` come ora locale. Il parsing puo normalizzare date impossibili: per un calendario valido serve un controllo dedicato.

## Confrontare

```javascript
firstDate.getTime() < secondDate.getTime()
```

## Aggiungere giorni

```javascript
const nextDate = new Date(date)
nextDate.setDate(nextDate.getDate() + 7)
```

`setDate` muta `nextDate` (una copia) e aggiunge giorni di calendario **locale**, non necessariamente multipli di 24 ore per via dell'ora legale. Per una durata esatta, su Date valida:

```javascript
const after24Hours = new Date(date.getTime() + 24 * 60 * 60 * 1000)
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

- [[Programmazione/JavaScript/Pagine/Date & Time|Date & Time]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]

## Fonti

- [MDN: Date.setDate e ora legale](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setDate).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

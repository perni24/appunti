---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, stringhe, regexp]
aliases: [Cheatsheet stringhe JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Template Literals]]"
  - "[[Programmazione/JavaScript/Pagine/Regular Expressions]]"
---

# JavaScript - Stringhe e RegExp

## Creazione

```javascript
const single = "test"
const multiline = `Prima riga
Seconda riga`
const message = `Ciao ${name}`
```

## Metodi principali

```javascript
text.length
text.at(0)
text.at(-1)
text.toLowerCase()
text.toUpperCase()
text.trim()
text.includes("termine")
text.startsWith("https://")
text.endsWith(".json")
text.indexOf("termine")
text.slice(0, 5)
text.replace("prima", "dopo")
text.replaceAll("-", " ")
text.split(",")
```

Le stringhe sono immutabili: i metodi restituiscono una nuova stringa.

## Unire

```javascript
const csv = values.join(",")
const path = [base, folder, file].join("/")
```

## Padding

```javascript
"7".padStart(2, "0")    // "07"
"x".padEnd(3, ".")      // "x.."
```

## Conversioni

```javascript
String(42)
Number("42")
parseInt("42px", 10)
parseFloat("3.14")
```

## Espressione regolare

```javascript
const pattern = /^[a-z0-9_-]+$/i

pattern.test("user_01")
"user_01".match(pattern)
```

## Gruppi

```javascript
const match = "2026-07-30".match(
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/,
)

const year = match?.groups?.year
```

## Tutte le corrispondenze

```javascript
const matches = [...text.matchAll(/\d+/g)]
const numbers = matches.map((match) => match[0])
```

## Sostituzione con callback

```javascript
const result = text.replace(/\b\w/g, (letter) => letter.toUpperCase())
```

## Flag

| Flag | Effetto |
|---|---|
| `g` | Tutte le corrispondenze |
| `i` | Ignora maiuscole e minuscole |
| `m` | `^` e `$` per ogni riga |
| `s` | `.` include i caratteri di nuova riga |
| `u` | Modalita Unicode |

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Template Literals]]
- [[Programmazione/JavaScript/Pagine/Regular Expressions]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati]]

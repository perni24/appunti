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
  - stringhe
  - regexp
aliases:
  - Cheatsheet stringhe JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Template Literals|Template Literals]]"
  - "[[Programmazione/JavaScript/Pagine/Regular Expressions|Regular Expressions]]"
title: JavaScript - Stringhe e RegExp
---

# JavaScript - Stringhe e RegExp

## Uso rapido

Blocchi indipendenti; per l'elenco dei metodi usa una stringa `text` gia disponibile. Regex di formato non sostituiscono la validazione del significato dei dati.

## Creazione

```javascript
const name = "Ada"
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

Le stringhe non vengono modificate. Il risultato dipende dal metodo: stringa, booleano, indice o array. `replace` con stringa sostituisce la prima occorrenza; `replaceAll` tutte. `indexOf` restituisce `-1` se manca il testo.

`length`, indici, `at` e `slice` lavorano su code unit UTF-16, non necessariamente caratteri visibili; lo spread di una stringa itera code point, non grafemi.

## Unire

```javascript
const values = ["Ada", "Grace"]
const joined = values.join(",") // "Ada,Grace"
const path = ["assets", "images", "logo.png"].join("/")
```

`join(",")` non e un serializzatore CSV (virgole, virgolette e newline richiedono escaping). Unire con `/` non risolve URL o percorsi filesystem: usa `URL` o `node:path` quando serve.

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

I gruppi sono stringhe; il pattern della data controlla solo la forma: anche `2026-99-99` corrisponde.

## Tutte le corrispondenze

```javascript
const text = "ordine 12, quantita 3"
const matches = [...text.matchAll(/\d+/g)]
const numbers = matches.map((match) => match[0])
```

## Sostituzione con callback

```javascript
const text = "hello world"
const result = text.replace(/\b\w/g, (letter) => letter.toUpperCase())
```

`\w`/`\b` non sono segmentazione universale delle parole; il frammento e adatto al semplice testo ASCII. Per una sostituzione letterale contenente `$`, usa una callback: i replacement string interpretano sequenze come `$&`.

## Flag

| Flag | Effetto |
|---|---|
| `g` | Tutte le corrispondenze |
| `i` | Ignora maiuscole e minuscole |
| `m` | `^` e `$` per ogni riga |
| `s` | `.` include i caratteri di nuova riga |
| `u` | Modalita Unicode, per esempio code point e property escape |
| `y` | Cerca esattamente da `lastIndex` |

Con `g` o `y`, `test`/`exec` cambiano `lastIndex`: per controlli indipendenti evita quei flag oppure azzera l'indice. `matchAll` richiede `g` quando riceve una RegExp.

```javascript
const repeated = /a/g
repeated.test("a") // true
repeated.test("a") // false: lastIndex era 1
repeated.lastIndex = 0
```

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Template Literals|Template Literals]]
- [[Programmazione/JavaScript/Pagine/Regular Expressions|Regular Expressions]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]

## Fonti

- [MDN: String.length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length).
- [MDN: RegExp.test e lastIndex](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

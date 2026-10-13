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
  - errori
  - debug
aliases:
  - Cheatsheet errori JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]"
  - "[[Programmazione/JavaScript/Pagine/Source maps e debugging|Source maps e debugging]]"
title: JavaScript - Errori e debug
---

# JavaScript - Errori e debug

## Uso rapido

Schemi da adattare: `loadData`, `render`, `hideLoader`, `operation` e `saveData` sono funzioni applicative gia definite. `await` richiede una funzione `async` o un modulo; gli errori rilanciati vanno gestiti dal chiamante.

## Generare un errore

```javascript
if (!user) {
  throw new Error("User not found")
}
```

## Gestire un errore

```javascript
try {
  const data = await loadData()
  render(data)
} catch (error) {
  console.error(error)
} finally {
  hideLoader()
}
```

Il `try` cattura anche il rifiuto delle Promise **attese**, non di un lavoro asincrono avviato e abbandonato. Un `return`/`throw` in `finally` puo sovrascrivere l'esito precedente; il cleanup puo fallire a sua volta.

## Restringere il valore catturato

```javascript
try {
  await operation()
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error("Errore sconosciuto", error)
  }
}
```

Si puo lanciare qualunque valore, non solo `Error`. `instanceof Error` e un controllo pratico nello stesso realm; puo non riconoscere errori da iframe o VM differenti. Non esporre stack o dettagli riservati all'utente.

## Errore personalizzato

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message)
    this.name = "ValidationError"
    this.field = field
  }
}
```

Errore intenzionale, dopo aver definito la classe:

```javascript
throw new ValidationError("Valore non valido", "email")
```

## Conservare la causa

```javascript
try {
  await saveData()
} catch (error) {
  throw new Error("Salvataggio fallito", { cause: error })
}
```

## Console

```javascript
console.log(value)
console.info(message)
console.warn(message)
console.error(error)
console.table(users)
console.dir(object)
console.trace()
```

## Misurare il tempo

```javascript
console.time("load")
try {
  await loadData()
} finally {
  console.timeEnd("load")
}
```

```javascript
const start = performance.now()
runOperation()
const duration = performance.now() - start
```

`performance.now()` e monotono e misura una durata relativa; se l'operazione e asincrona, attendila. Una sola misura non e un benchmark. Non riusare la stessa label di `console.time` per lavori concorrenti.

## Asserzione di debug

```javascript
console.assert(items.length > 0, "Lista vuota")
```

`console.assert` scrive un messaggio se la condizione e falsa: non lancia un'eccezione e non interrompe il flusso. Per validazione usa `throw`; per test usa le assertion del runner.

## Breakpoint

```javascript
debugger
```

`debugger` richiede un debugger collegato e abilitato. In DevTools gli oggetti loggati possono essere mostrati con valori aggiornati successivamente, non come snapshot del momento.

## Controlli rapidi

```javascript
value == null
Number.isNaN(value)
Array.isArray(value)
Object.hasOwn(object, key)
```

Per normali dati JavaScript, `value == null` controlla insieme `null` e `undefined`; il browser ha l'eccezione legacy `document.all`. Per il controllo esplicito usa `value === null || value === undefined`.

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Source maps e debugging|Source maps e debugging]]
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]

## Fonti

- [MDN: console.assert](https://developer.mozilla.org/en-US/docs/Web/API/console/assert_static).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

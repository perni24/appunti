---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, errori, debug]
aliases: [Cheatsheet errori JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Error Handling]]"
  - "[[Programmazione/JavaScript/Pagine/Source maps e debugging]]"
---

# JavaScript - Errori e debug

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
await loadData()
console.timeEnd("load")
```

```javascript
const start = performance.now()
runOperation()
const duration = performance.now() - start
```

## Asserzione di debug

```javascript
console.assert(items.length > 0, "Lista vuota")
```

Non usare `console.assert()` come validazione di produzione.

## Breakpoint

```javascript
debugger
```

## Controlli rapidi

```javascript
value == null
Number.isNaN(value)
Array.isArray(value)
Object.hasOwn(object, key)
```

`value == null` e un caso intenzionale che controlla insieme `null` e `undefined`.

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Error Handling]]
- [[Programmazione/JavaScript/Pagine/Source maps e debugging]]
- [[Programmazione/JavaScript/Pagine/ESLint]]
- [[Programmazione/JavaScript/Pagine/Testing]]

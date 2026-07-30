---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, funzioni]
aliases: [Cheatsheet funzioni JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Arrow Functions]]"
  - "[[Programmazione/JavaScript/Pagine/Closures]]"
---

# JavaScript - Funzioni

## Dichiarazione

```javascript
function add(left, right) {
  return left + right
}
```

## Espressione

```javascript
const add = function (left, right) {
  return left + right
}
```

## Arrow function

```javascript
const add = (left, right) => left + right

const createUser = (name) => ({
  id: crypto.randomUUID(),
  name,
})
```

Le arrow function non definiscono un proprio `this` o `arguments`.

## Parametri

```javascript
function greet(name = "Utente") {
  return `Ciao ${name}`
}
```

```javascript
function total(discount, ...prices) {
  return prices.reduce((sum, price) => sum + price, 0) - discount
}
```

## Callback

```javascript
function execute(value, callback) {
  return callback(value)
}

execute(5, (value) => value * 2)
```

## Closure

```javascript
function createCounter() {
  let count = 0

  return () => {
    count += 1
    return count
  }
}

const next = createCounter()
```

## Metodi e `this`

```javascript
const user = {
  name: "Ada",
  greet() {
    return `Ciao ${this.name}`
  },
}
```

| Metodo | Uso |
|---|---|
| `fn.call(thisArg, a, b)` | Invoca con argomenti separati |
| `fn.apply(thisArg, [a, b])` | Invoca con array di argomenti |
| `fn.bind(thisArg)` | Crea una nuova funzione associata |

## Funzione immediata

```javascript
(() => {
  const privateValue = 42
  console.log(privateValue)
})()
```

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Funzioni]]
- [[Programmazione/JavaScript/Pagine/Arrow Functions]]
- [[Programmazione/JavaScript/Pagine/Default Parameters]]
- [[Programmazione/JavaScript/Pagine/Callback]]
- [[Programmazione/JavaScript/Pagine/Closures]]
- [[Programmazione/JavaScript/Pagine/Scope]]
- [[Programmazione/JavaScript/Pagine/Context]]

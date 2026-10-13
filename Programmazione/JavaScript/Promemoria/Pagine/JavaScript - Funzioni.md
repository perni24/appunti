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
  - funzioni
aliases:
  - Cheatsheet funzioni JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Arrow Functions|Arrow Functions]]"
  - "[[Programmazione/JavaScript/Pagine/Closures|Closures]]"
title: JavaScript - Funzioni
---

# JavaScript - Funzioni

## Uso rapido

Blocchi alternativi: non incollare le tre definizioni di `add` nello stesso scope. Gli esempi aritmetici assumono numeri finiti, gia validati.

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

const createUser = (id, name) => ({ id, name })
```

Le arrow non hanno un proprio `this`/`arguments` e non si usano con `new`. Le parentesi in `=> ({ ... })` restituiscono un oggetto, non un blocco.

## Parametri

```javascript
function greet(name = "Utente") {
  return `Ciao ${name}`
}
```

```javascript
function total(discountAmount, ...prices) {
  return prices.reduce((sum, price) => sum + price, 0) - discountAmount
}

total(5, 10, 20) // 25: sconto assoluto, non percentuale
```

Il parametro predefinito si applica se manca l'argomento o vale `undefined`, non se vale `null`. Qui lo sconto e un importo; non e un esempio di contabilita esatta.

## Callback

```javascript
function execute(value, callback) {
  return callback(value)
}

execute(5, (value) => value * 2)
```

`execute` invoca la callback subito: callback non significa necessariamente asincrona. Se restituisce una Promise, il chiamante deve attenderla o gestirne il rifiuto.

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
next() // 1
next() // 2
createCounter()() // 1: stato distinto
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

```javascript
const greetAda = user.greet.bind(user)
greetAda()                         // "Ciao Ada"
user.greet.call({ name: "Grace" })   // "Ciao Grace"
```

Il blocco usa `user` appena definito. Estrarre `user.greet` senza binding perde il receiver; `bind` non cambia il `this` lessicale di una arrow.

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

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Arrow Functions|Arrow Functions]]
- [[Programmazione/JavaScript/Pagine/Default Parameters|Default Parameters]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]
- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Context|Context]]

## Fonti

- [MDN: funzioni](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

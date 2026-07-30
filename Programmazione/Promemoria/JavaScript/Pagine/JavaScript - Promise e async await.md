---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [javascript, promemoria, promise, async-await]
aliases: [Cheatsheet asincronia JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
---

# JavaScript - Promise e async-await

## Consumare una Promise

```javascript
loadData()
  .then((data) => processData(data))
  .catch((error) => console.error(error))
  .finally(() => hideLoader())
```

## Async-await

```javascript
async function loadUser(userId) {
  try {
    return await getUser(userId)
  } catch (error) {
    console.error("Caricamento fallito", error)
    throw error
  }
}
```

Una funzione `async` restituisce sempre una Promise.

## Operazioni parallele

```javascript
const [user, orders] = await Promise.all([
  getUser(userId),
  getOrders(userId),
])
```

Creare prima le Promise quando le operazioni non dipendono tra loro.

## Risultati anche in caso di errore

```javascript
const results = await Promise.allSettled(tasks)

for (const result of results) {
  if (result.status === "fulfilled") {
    console.log(result.value)
  } else {
    console.error(result.reason)
  }
}
```

## Combinatori

| Metodo | Risultato |
|---|---|
| `Promise.all()` | Tutte riuscite oppure primo errore |
| `Promise.allSettled()` | Esito di tutte |
| `Promise.race()` | Prima Promise completata |
| `Promise.any()` | Primo successo |

## Creare una Promise

```javascript
function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

await delay(500)
```

## Esecuzione sequenziale

```javascript
for (const item of items) {
  await processItem(item)
}
```

## Esecuzione parallela

```javascript
await Promise.all(items.map((item) => processItem(item)))
```

## Timeout con annullamento

```javascript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000)

try {
  await fetch(url, { signal: controller.signal })
} finally {
  clearTimeout(timeoutId)
}
```

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Promises]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Async Await]]
- [[Programmazione/JavaScript/Pagine/Event Loop]]
- [[Programmazione/JavaScript/Pagine/AbortController]]

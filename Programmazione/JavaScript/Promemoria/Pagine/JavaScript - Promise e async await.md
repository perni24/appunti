---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - promemoria
  - promise
  - async-await
aliases:
  - Cheatsheet asincronia JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Promises|Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await|Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]"
title: JavaScript - Promise e async-await
---

# JavaScript - Promise e async-await

## Uso rapido

Schemi con funzioni applicative gia definite: `loadData`, `processData`, `getUser`, `getOrders`, `processItem` e `hideLoader`. Il top-level `await` va in un modulo; altrimenti usa una funzione `async`. Gli esempi alternativi non sono un unico programma.

## Consumare una Promise

```javascript
loadData()
  .then((data) => processData(data))
  .finally(() => hideLoader())
  .catch((error) => console.error(error))
```

Restituisci la Promise della callback per includerla nella catena. Il `catch` finale copre anche un errore del cleanup; se `finally` fallisce puo sostituire l'esito precedente. Un lancio sincrono di `loadData()` prima che restituisca una Promise richiede un `try/catch`.

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

Una funzione `async` restituisce una Promise. Qui `return await` fa arrivare anche il rifiuto asincrono al `catch` locale; il chiamante deve gestire il rifiuto rilanciato.

## Operazioni concorrenti

```javascript
const [user, orders] = await Promise.all([
  getUser(userId),
  getOrders(userId),
])
```

Le chiamate avviano il lavoro; `Promise.all` lo attende. Non garantisce parallelismo CPU e non annulla le altre operazioni al primo errore.

## Risultati anche in caso di errore

`tasks` e un iterabile di Promise/valori, non un elenco di funzioni da avviare.

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

| Metodo | Risultato | Input vuoto |
|---|---|---|
| `Promise.all(iterable)` | Valori in ordine di input, oppure primo rifiuto osservato | Fulfilled con `[]` |
| `Promise.allSettled(iterable)` | Esiti di tutti in ordine di input | Fulfilled con `[]` |
| `Promise.race(iterable)` | Primo esito, riuscito o fallito | Resta pending |
| `Promise.any(iterable)` | Primo successo; se tutti falliscono, `AggregateError` | Rejected con `AggregateError` |

Nessuno di questi combinatori cancella automaticamente i perdenti.

## Creare una Promise

Per durate brevi, intere e non negative; il timer non e una scadenza precisa.

```javascript
function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

await delay(50)
```

Non usare un executor `async` in `new Promise`.

## Sequenziale o concorrente

Sequenziale; il primo errore interrompe l'avvio dei successivi:

```javascript
for (const item of items) {
  await processItem(item)
}
```

Concorrente, soltanto per liste di dimensione controllata:

```javascript
await Promise.all(items.map((item) => processItem(item)))
```

`forEach(async ...)` non attende i risultati. Per carichi grandi usa il pool limitato nella teoria, non migliaia di richieste in contemporanea.

## Timeout fino alla lettura del corpo

Funzione indipendente: URL di un endpoint GET JSON noto, risposta 2xx con corpo JSON, esclusi 204/205. Il chiamante deve gestire il rifiuto e validare lo schema dei dati.

```javascript
async function getJsonWithTimeout(url, milliseconds = 5000) {
  if (!Number.isInteger(milliseconds) || milliseconds < 1 || milliseconds > 60_000) {
    throw new RangeError("Timeout tra 1 e 60000 ms")
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), milliseconds)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok || response.status === 204 || response.status === 205) {
      await response.body?.cancel()
      throw new Error(`HTTP ${response.status}: atteso JSON`)
    }
    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}
```

`return await` mantiene il timer durante `json()`. Il timeout non interrompe lavoro sincrono gia in corso e l'abort non annulla modifiche gia avvenute sul server. Il controllo del media type e altri casi HTTP sono nel wrapper di [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]].

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]

## Fonti

- [MDN: uso delle Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).
- [MDN: Fetch e annullamento](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

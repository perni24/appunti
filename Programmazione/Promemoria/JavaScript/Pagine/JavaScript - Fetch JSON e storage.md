---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [javascript, promemoria, fetch, json, storage]
aliases: [Cheatsheet Fetch JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/JSON]]"
  - "[[Programmazione/JavaScript/Pagine/Browser Storage]]"
---

# JavaScript - Fetch, JSON e storage

## Richiesta GET

```javascript
const response = await fetch("/api/entities")

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`)
}

const entities = await response.json()
```

`fetch()` non genera automaticamente un errore per status come `404` o `500`.

## Parametri query

```javascript
const params = new URLSearchParams({
  page: "1",
  search: "test",
})

const response = await fetch(`/api/entities?${params}`)
```

## Richiesta POST JSON

```javascript
const response = await fetch("/api/entities", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    name: "Example",
  }),
})

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`)
}

const entity = await response.json()
```

## Header di autorizzazione

```javascript
const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
```

## Annullare

```javascript
const controller = new AbortController()

const request = fetch(url, {
  signal: controller.signal,
})

controller.abort()
```

## JSON

```javascript
const text = JSON.stringify(data)
const pretty = JSON.stringify(data, null, 2)
const data = JSON.parse(text)
```

```javascript
try {
  const data = JSON.parse(text)
} catch (error) {
  console.error("JSON non valido", error)
}
```

## Local storage

```javascript
localStorage.setItem("theme", "dark")
const theme = localStorage.getItem("theme")
localStorage.removeItem("theme")
localStorage.clear()
```

I valori vengono salvati come stringhe.

```javascript
localStorage.setItem("settings", JSON.stringify(settings))

const settings = JSON.parse(
  localStorage.getItem("settings") ?? "{}",
)
```

## Session storage

```javascript
sessionStorage.setItem("draft", JSON.stringify(draft))
const draft = JSON.parse(sessionStorage.getItem("draft") ?? "null")
```

`sessionStorage` e limitato alla sessione della scheda.

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController]]
- [[Programmazione/JavaScript/Pagine/JSON]]
- [[Programmazione/JavaScript/Pagine/Browser Storage]]
- [[Programmazione/JavaScript/Pagine/CORS]]
- [[Programmazione/JavaScript/Pagine/API REST]]

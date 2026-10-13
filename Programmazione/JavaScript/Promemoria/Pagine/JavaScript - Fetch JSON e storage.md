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
  - fetch
  - json
  - storage
aliases:
  - Cheatsheet Fetch JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/JSON|JSON]]"
  - "[[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]"
title: JavaScript - Fetch, JSON e storage
---

# JavaScript - Fetch, JSON e storage

## Uso rapido

Browser su HTTP(S). Gli endpoint `/api/entities` sono esempi: richiedono un backend con il contratto indicato. I blocchi con `await` sono corpi da mettere in una funzione `async` con gestione degli errori, oppure in un modulo. Non inviare dati reali durante le prove.

## Lettura JSON comune

Definisci questo helper prima dei blocchi GET/POST. Legge una volta il corpo; non verifica lo schema applicativo.

```javascript
async function readJson(response) {
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(`HTTP ${response.status}`)
  }
  if (response.status === 204 || response.status === 205) return null

  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase()
  if (type !== "application/json" && !/^application\/[\w!#$&^.+-]+\+json$/.test(type ?? "")) {
    await response.body?.cancel()
    throw new TypeError("Atteso un media type JSON")
  }
  return response.json()
}
```

Contratto: GET/POST con JSON oppure 204/205; non usarlo per HEAD o per un 200 vuoto. JSON valido non implica campi validi. `fetch` non rifiuta automaticamente per 404/500; rete, HTTP, parsing e schema sono problemi distinti.

## Richiesta GET

Contratto del demo: array denso di record con `id` intero positivo sicuro e `name` stringa; si conservano soltanto quei due campi.

```javascript
const response = await fetch("/api/entities", {
  headers: { Accept: "application/json" },
})
const data = await readJson(response)
if (
  !Array.isArray(data) ||
  !data.every((item) =>
    item !== null && typeof item === "object" && !Array.isArray(item) &&
    Number.isSafeInteger(item.id) && item.id > 0 && typeof item.name === "string"
  )
) {
  throw new TypeError("Elenco entita non valido")
}
const entities = data.map(({ id, name }) => ({ id, name }))
```

## Parametri query

```javascript
const params = new URLSearchParams({ page: "1", search: "test & demo" })
const endpoint = `/api/entities?${params}`
```

Passa `endpoint` a `fetch` come nel GET. Non concatenare manualmente testo utente dentro la query.

## Richiesta POST JSON

```javascript
const response = await fetch("/api/entities", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({ name: "Example" }),
})
const entity = await readJson(response)
```

`entity` puo essere `null` su 204/205; negli altri casi valida i campi prima dell'uso. Autorizzazione e protezione CSRF dipendono dal backend, non dall'header JSON.

## Header di autorizzazione

Schema: `url` deve essere un endpoint HTTPS fidato, `token` gia disponibile. Non usare input arbitrario come destinazione del token.

```javascript
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
  credentials: "omit",
  redirect: "error",
})
const data = await readJson(response)
```

`credentials: "omit"` evita cookie automatici, **non** rimuove l'Authorization impostato a mano. Non salvare token in localStorage come scorciatoia; CORS e autorizzazione sono controlli differenti.

## Annullare senza rifiuti non gestiti

Dopo aver definito `readJson`; annullamento immediato solo per mostrare il ciclo:

```javascript
const controller = new AbortController()
const request = fetch("/api/entities", { signal: controller.signal })
  .then(readJson)

const handled = request.catch((error) => {
  if (controller.signal.aborted && error === controller.signal.reason) {
    return null
  }
  throw error
})

controller.abort()
try {
  await handled
} catch (error) {
  console.error("Richiesta fallita", error)
}
```

Il signal e monouso. Per un nuovo tentativo crea un controller nuovo; per un timeout vedi [[Programmazione/JavaScript/Promemoria/Pagine/JavaScript - Promise e async await|Promise e async-await]].

## JSON

```javascript
const source = { name: "Ada", active: true }
const text = JSON.stringify(source)
const pretty = JSON.stringify(source, null, 2)
const parsedData = JSON.parse(text)
```

`JSON.parse` puo generare `SyntaxError`; non convalida lo schema. `JSON.stringify` non e un clone generale: cicli e BigInt generano normalmente errore, alcuni valori vengono omessi o convertiti.

## Local storage

Stringhe, persistenti per origine salvo cancellazione/policy. Anche l'accesso allo storage puo fallire; non contiene segreti sicuri.

```javascript
try {
  localStorage.setItem("demo:theme", "dark")
  const theme = localStorage.getItem("demo:theme") // stringa o null
  localStorage.removeItem("demo:theme")
} catch (error) {
  console.error("Storage non disponibile", error)
}
```

**Distruttivo:** `clear()` elimina tutte le chiavi localStorage dell'origine, anche di altre pagine/app sullo stesso dominio, protocollo e porta. Usalo solo intenzionalmente; preferisci `removeItem` sulla chiave dell'app.

```javascript
try {
  localStorage.clear()
} catch (error) {
  console.error("Cancellazione non riuscita", error)
}
```

Preferenza JSON con fallback e lista di valori ammessi:

```javascript
function readSettings() {
  try {
    const data = JSON.parse(localStorage.getItem("demo:settings") ?? "null")
    if (data && typeof data === "object" && !Array.isArray(data) &&
        (data.theme === "light" || data.theme === "dark")) {
      return { theme: data.theme }
    }
  } catch {}
  return { theme: "light" }
}
```

Salvataggio separato; il valore e fisso nel demo:

```javascript
try {
  localStorage.setItem("demo:settings", JSON.stringify({ theme: "dark" }))
} catch (error) {
  console.error("Preferenza non salvata", error)
}
```

## Session storage

Origine e contesto della scheda; sopravvive al reload. Una nuova scheda aperta con opener puo ricevere una copia iniziale, poi i valori sono indipendenti.

```javascript
try {
  sessionStorage.setItem("demo:draft", JSON.stringify({ title: "Bozza" }))
  const raw = JSON.parse(sessionStorage.getItem("demo:draft") ?? "null")
  const draft = raw && typeof raw.title === "string" ? { title: raw.title } : null
  console.log(draft)
} catch (error) {
  console.error("Bozza non disponibile", error)
}
```

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- [[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/API REST|API REST]]

## Fonti

- [MDN: Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [MDN: Storage.clear](https://developer.mozilla.org/en-US/docs/Web/API/Storage/clear).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, oggetti, map, set]
aliases: [Cheatsheet oggetti JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
  - "[[Programmazione/JavaScript/Pagine/Map e Set]]"
---

# JavaScript - Oggetti, Map e Set

## Oggetti

```javascript
const user = {
  id: 1,
  name: "Ada",
  active: true,
}

user.name
user["name"]
```

## Verificare proprieta

```javascript
Object.hasOwn(user, "name")
"name" in user
```

`in` considera anche la catena dei prototipi.

## Chiavi e valori

```javascript
Object.keys(user)
Object.values(user)
Object.entries(user)
Object.fromEntries([["name", "Ada"], ["active", true]])
```

## Copiare e aggiornare

```javascript
const copy = { ...user }
const updated = { ...user, active: false }
const merged = { ...defaults, ...options }
```

Sono copie superficiali.

## Rimuovere senza modificare l'originale

```javascript
const { password, ...publicUser } = user
```

## Iterare

```javascript
for (const [key, value] of Object.entries(user)) {
  console.log(key, value)
}
```

## Map

```javascript
const usersById = new Map()

usersById.set(1, user)
usersById.get(1)
usersById.has(1)
usersById.delete(1)
usersById.size
```

```javascript
for (const [id, currentUser] of usersById) {
  console.log(id, currentUser)
}
```

## Set

```javascript
const uniqueIds = new Set([1, 2, 2, 3])

uniqueIds.add(4)
uniqueIds.has(2)
uniqueIds.delete(1)
uniqueIds.size
```

## Rimuovere duplicati

```javascript
const uniqueValues = [...new Set(values)]
```

## Conversioni

```javascript
const map = new Map(Object.entries(object))
const object = Object.fromEntries(map)
const array = [...uniqueIds]
```

## Scelta rapida

| Struttura | Uso |
|---|---|
| `Object` | Record con chiavi stringa note |
| `Map` | Dizionario dinamico con chiavi di qualsiasi tipo |
| `Set` | Insieme di valori unici |

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Map e Set]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors]]

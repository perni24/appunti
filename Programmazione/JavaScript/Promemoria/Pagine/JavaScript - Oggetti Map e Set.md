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
  - oggetti
  - map
  - set
aliases:
  - Cheatsheet oggetti JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]"
  - "[[Programmazione/JavaScript/Pagine/Map e Set|Map e Set]]"
title: JavaScript - Oggetti, Map e Set
---

# JavaScript - Oggetti, Map e Set

## Uso rapido

I blocchi riusano `user` e le collezioni dichiarate nella pagina. Le operazioni `set`, `add` e `delete` mutano la relativa collezione.

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

`Object.hasOwn` controlla proprieta proprie; `in` considera anche quelle ereditate. Una proprieta presente puo comunque contenere `undefined`.

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
const defaults = { theme: "light", size: 10 }
const options = { theme: "dark" }
const merged = { ...defaults, ...options } // vince la chiave a destra
```

Sono copie superficiali. `keys`/`values`/`entries` includono solo proprieta proprie enumerabili con chiave stringa; spread include anche i Symbol enumerabili.

## Rimuovere senza modificare l'originale

```javascript
const account = { id: 1, name: "Ada", password: "demo", token: "demo" }
const { password, ...withoutPassword } = account
const publicUser = { id: account.id, name: account.name }
```

Omettere `password` lascia tutti gli altri campi, incluso `token`: per dati pubblici seleziona esplicitamente i campi consentiti, come `publicUser`. Non sostituisce autorizzazione e validazione.

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
usersById.get(1)    // user
usersById.has(1)    // true
usersById.delete(1) // true: ora e vuota
usersById.size      // 0
```

```javascript
for (const [id, currentUser] of usersById) {
  console.log(id, currentUser)
}
```

Il ciclo precedente trova una Map vuota dopo `delete`. `get` restituisce anche `undefined` per chiavi assenti: usa `has` se `undefined` e un valore ammesso.

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
const values = [1, 2, 2, NaN, NaN]
const uniqueValues = [...new Set(values)] // [1, 2, NaN]
```

Map/Set confrontano gli oggetti per identita, non per contenuto; due `{ id: 1 }` restano distinti. `NaN` e uguale a se stesso per queste collezioni; `0` e `-0` coincidono.

## Conversioni

```javascript
const source = { name: "Ada", active: true }
const map = new Map(Object.entries(source))
const restoredObject = Object.fromEntries(map)
const array = [...uniqueIds]
```

`Object.fromEntries` converte le chiavi in stringhe o Symbol: una Map con chiavi `1` e `"1"` perderebbe la distinzione. `JSON.stringify(new Map())` non serializza le entry automaticamente.

## Scelta rapida

| Struttura | Uso |
|---|---|
| `Object` | Record con chiavi stringa note |
| `Map` | Dizionario dinamico con chiavi di qualsiasi tipo |
| `Set` | Insieme di valori unici |

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Map e Set|Map e Set]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]

## Fonti

- [MDN: Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

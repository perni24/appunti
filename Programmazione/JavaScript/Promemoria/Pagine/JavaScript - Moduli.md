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
  - moduli
  - esm
aliases:
  - Cheatsheet moduli JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Moduli|Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]"
title: JavaScript - Moduli
---

# JavaScript - Moduli

## Uso rapido

ES Modules: ogni blocco e un file o un'alternativa dichiarata. Gli esempi usano `.mjs`, esplicito per Node, e funzionano nel browser se serviti via HTTP con un media type JavaScript. Nessun backend e richiesto.

## Export nominato

`api.mjs`, con dati fittizi:

```javascript
export const API_URL = "/api"
export let calls = 0

export function loadData() {
  calls += 1
  return ["Ada", "Grace"]
}
```

Forma alternativa nello **stesso file al posto della precedente**, non in aggiunta:

```javascript
const API_URL = "/api"
let calls = 0

function loadData() {
  calls += 1
  return ["Ada", "Grace"]
}

export { API_URL, calls, loadData }
```

## Import nominato e alias

`main.mjs`, accanto a `api.mjs`:

```javascript
import { API_URL, loadData as fetchData, calls } from "./api.mjs"

const names = fetchData()
console.log(API_URL, names, calls) // "/api", ["Ada", "Grace"], 1

export { fetchData }
```

Il nome locale ora e `fetchData`, non `loadData`. Gli import sono binding vivi, non copie dei valori: `calls` riflette gli aggiornamenti del modulo e non puo essere riassegnato dall'importatore.

## Export e import predefinito

`format.mjs`:

```javascript
export default function formatName(name) {
  return name.trim()
}
```

In un altro modulo, dopo aver creato quel file:

```javascript
import formatName from "./format.mjs"

console.log(formatName(" Ada ")) // "Ada"
```

Un solo export `default` per modulo; il nome locale dell'import predefinito e libero.

## Import namespace

```javascript
import * as api from "./api.mjs"

console.log(api.loadData())
```

## Re-export

`index.mjs`, senza bisogno di un import locale:

```javascript
export { loadData as fetchData } from "./api.mjs"
export * from "./api.mjs"
export { default as formatName } from "./format.mjs"
```

`export *` non include `default` e non crea binding locali; i nomi in conflitto tra piu wildcard richiedono disambiguazione.

## Import dinamico

In un modulo, dopo aver creato `format.mjs`:

```javascript
try {
  const module = await import("./format.mjs")
  console.log(module.default(" Ada "))
} catch (error) {
  console.error("Modulo non disponibile", error)
}
```

Alternativa al namespace:

```javascript
const { default: formatName } = await import("./format.mjs")
console.log(formatName(" Grace "))
```

`import()` restituisce una Promise; gestisci errori di caricamento **e valutazione**. Lo stesso modulo risolto viene normalmente riusato, non rieseguito a ogni chiamata.

## Avvio

Node, dalla directory dei file:

```shell
node main.mjs
```

Browser, HTML nella stessa directory e servito tramite HTTP:

```html
<script type="module" src="./main.mjs"></script>
```

I moduli sono in strict mode. In Node per `.js` dichiara `"type": "module"` nel `package.json`; con gli import relativi specifica l'estensione. Nel browser i nomi di pacchetto non si risolvono automaticamente: servono import map o bundler. Il top-level `await` richiede un modulo, non uno script classico.

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]
- [[Programmazione/JavaScript/Pagine/Circular Dependencies|Circular Dependencies]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]

## Fonti

- [MDN: export e re-export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]

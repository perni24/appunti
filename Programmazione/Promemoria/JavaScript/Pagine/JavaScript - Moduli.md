---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, moduli, esm]
aliases: [Cheatsheet moduli JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Dynamic Import]]"
---

# JavaScript - Moduli

## Export nominato

```javascript
export const API_URL = "/api"

export function loadData() {
  // ...
}
```

```javascript
const API_URL = "/api"

function loadData() {
  // ...
}

export { API_URL, loadData }
```

## Import nominato

```javascript
import { API_URL, loadData } from "./api.js"
```

## Alias

```javascript
import { loadData as fetchData } from "./api.js"
export { loadData as fetchData }
```

## Export e import predefinito

```javascript
export default function App() {
  // ...
}
```

```javascript
import App from "./App.js"
```

Un modulo puo avere un solo export predefinito.

## Import namespace

```javascript
import * as api from "./api.js"

api.loadData()
```

## Re-export

```javascript
export { loadData } from "./api.js"
export * from "./constants.js"
```

## Import dinamico

```javascript
const module = await import("./editor.js")
module.openEditor()
```

```javascript
const { openEditor } = await import("./editor.js")
```

## Modulo nel browser

```html
<script type="module" src="/src/main.js"></script>
```

I moduli eseguono automaticamente in strict mode.

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Moduli]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import]]
- [[Programmazione/JavaScript/Pagine/Circular Dependencies]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking]]

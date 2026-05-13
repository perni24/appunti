---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, es-modules, modules, import, export]
aliases: [ES Modules, Moduli ES, import export]
prerequisites: [Funzioni, Scope]
related: [Dynamic Import, Circular Dependencies, Strict Mode]
---

# Moduli

## Sintesi

I moduli permettono di dividere il codice JavaScript in file separati.

Con ES Modules puoi esportare funzioni, classi, costanti o oggetti da un file e importarli in un altro.

I moduli migliorano organizzazione, riuso, testabilita e gestione delle dipendenze.

---

## Export nominato

Un named export esporta un valore con il suo nome.

```js
// math.js
export const pi = 3.14;

export function sum(a, b) {
  return a + b;
}
```

Import:

```js
import { pi, sum } from "./math.js";
```

I nomi devono corrispondere agli export.

---

## Export a fine file

```js
const pi = 3.14;

function sum(a, b) {
  return a + b;
}

export { pi, sum };
```

Questa forma rende piu visibile cosa il modulo espone.

---

## Default export

Ogni modulo puo avere al massimo un default export.

```js
// logger.js
export default function log(message) {
  console.log(message);
}
```

Import:

```js
import log from "./logger.js";
```

Il nome locale puo essere scelto liberamente.

---

## Named export vs default export

Named export:

- favorisce refactor piu sicuri;
- rende esplicito il nome importato;
- permette piu export per file.

Default export:

- comodo quando il file espone una sola cosa principale;
- permette nomi locali diversi;
- puo rendere meno uniforme il naming tra file.

Regola pratica: usa named export come default di progetto, default export quando c'e davvero una entita principale.

---

## Import con alias

```js
import { sum as add } from "./math.js";

console.log(add(2, 3));
```

Utile per evitare collisioni di nomi o rendere il significato piu chiaro nel contesto locale.

---

## Namespace import

```js
import * as MathUtils from "./math.js";

console.log(MathUtils.sum(2, 3));
```

Utile quando vuoi raggruppare molte funzioni sotto un nome.

Evita namespace troppo grandi che diventano contenitori generici.

---

## Moduli nel browser

```html
<script type="module" src="app.js"></script>
```

Caratteristiche:

- sono strict mode di default;
- hanno scope di modulo;
- sono caricati in modo defer;
- supportano `import` ed `export`;
- richiedono percorsi espliciti.

```js
import { initApp } from "./app.js";
```

Nel browser, spesso devi includere l'estensione `.js`.

---

## Scope di modulo

Le variabili dichiarate in un modulo non diventano globali.

```js
const internalValue = 42;

export function getValue() {
  return internalValue;
}
```

Solo cio che esporti e disponibile ad altri moduli.

---

## Esecuzione singola e cache

Un modulo viene valutato una sola volta per runtime.

Se piu file importano lo stesso modulo, condividono la stessa istanza del modulo.

```js
// counter.js
let count = 0;

export function increment() {
  count += 1;
  return count;
}
```

Questo puo essere utile, ma anche creare stato condiviso implicito.

---

## Import statico e dynamic import

Import statico:

```js
import { formatDate } from "./date.js";
```

Dynamic import:

```js
const module = await import("./date.js");
```

Usa import statico come scelta normale. Usa dynamic import per lazy loading, code splitting o moduli opzionali.

---

## Errori comuni

- Confondere named export e default export.
- Dimenticare `{}` negli import nominati.
- Usare percorsi sbagliati o senza estensione nel browser.
- Creare file `index.js` che causano dipendenze circolari.
- Mettere troppo codice non correlato nello stesso modulo.
- Creare stato condiviso implicito senza documentarlo.

---

## Checklist

- Il modulo espone una API chiara?
- Sto usando named export o default export in modo coerente?
- Il percorso importato e corretto?
- Il modulo ha effetti collaterali al caricamento?
- Ci sono dipendenze circolari?

---

## Collegamenti

- [[Dynamic Import]]
- [[Circular Dependencies]]
- [[Strict Mode]]
- [[Scope]]
- [[Funzioni]]

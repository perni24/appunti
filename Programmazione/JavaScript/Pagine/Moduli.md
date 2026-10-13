---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - es-modules
  - modules
  - import
  - export
aliases:
  - ES Modules
  - Moduli ES
  - import export
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Dynamic Import]]"
  - "[[Programmazione/JavaScript/Pagine/Circular Dependencies]]"
  - "[[Programmazione/JavaScript/Pagine/Strict Mode]]"
title: Moduli
---

# Moduli

## Sintesi

I moduli permettono di dividere il codice JavaScript in file separati.

Con ES Modules puoi esportare funzioni, classi, costanti o oggetti da un file e importarli in un altro.

I moduli migliorano organizzazione, riuso, testabilita e gestione delle dipendenze.

---

## Quando usarlo

Usa moduli quando vuoi dividere il codice in responsabilita separate e controllare esplicitamente cosa ogni file espone.

Casi comuni:

- riusare funzioni tra file;
- separare logica, UI e dati;
- rendere testabili unita piccole;
- evitare variabili globali;
- organizzare librerie e applicazioni grandi;
- abilitare bundling e tree shaking.

Ogni file modulo dovrebbe avere una responsabilita leggibile e una API pubblica piccola.

## Come funziona

### Export nominato
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
### Export a fine file
```js
const pi = 3.14;

function sum(a, b) {
  return a + b;
}

export { pi, sum };
```

Questa forma rende piu visibile cosa il modulo espone.

---
### Default export
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
### Named export vs default export
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
### Import con alias
```js
import { sum as add } from "./math.js";

console.log(add(2, 3));
```

Utile per evitare collisioni di nomi o rendere il significato piu chiaro nel contesto locale.

---
### Namespace import
```js
import * as MathUtils from "./math.js";

console.log(MathUtils.sum(2, 3));
```

Utile quando vuoi raggruppare molte funzioni sotto un nome.

Evita namespace troppo grandi che diventano contenitori generici.

---
### Moduli nel browser
```html
<script type="module" src="app.js"></script>
```

Caratteristiche:

- sono strict mode di default;
- hanno scope di modulo;
- senza `async`, vengono eseguiti dopo il parsing HTML, come gli script deferred;
- supportano `import` ed `export`;
- risolvono gli import come URL; nomi di pacchetto come `react` richiedono una import map o un bundler.

```js
// app.js
import { sum } from "./math.js";
console.log(sum(2, 3)); // 5
```

Il browser non aggiunge `.js` e non cerca automaticamente un `index.js`. Usa URL che il server espone davvero. Prova gli esempi via HTTP, non aprendo un file `file://`; il server deve inviare un MIME JavaScript corretto e gli import cross-origin richiedono CORS.

### Moduli in Node.js

Per dichiarare esplicitamente ESM usa file `.mjs` oppure `.js` dentro un package con questo `package.json`:

```json
{
  "type": "module"
}
```

I percorsi relativi ESM in Node richiedono l'estensione; i pacchetti vengono risolti secondo le regole Node. `.cjs` identifica CommonJS. Le versioni moderne possono rilevare sintassi ESM in alcuni file ambigui, ma dichiarare il formato evita di dipendere da tale rilevamento. ESM non rende portabili le API dell'ambiente: `node:fs` non esiste nel browser.

---
### Scope di modulo
Le variabili dichiarate in un modulo non diventano globali.

```js
const internalValue = 42;

export function getValue() {
  return internalValue;
}
```

Solo cio che esporti e disponibile ad altri moduli.

Al top-level del modulo `this` vale `undefined`. Lo scope non e una protezione per segreti: il codice inviato al browser rimane ispezionabile.

---
### Esecuzione singola e cache
Per la stessa identita risolta, un modulo valutato correttamente viene riusato nello stesso ambiente di esecuzione. Un'altra pagina, un worker o un altro processo hanno istanze separate.

Se piu file importano lo stesso modulo, condividono la stessa istanza del modulo.

```js
// counter.js
export let count = 0;

export function increment() {
  count += 1;
  return count;
}
```

Questo puo essere utile, ma anche creare stato condiviso implicito.

### Live binding, non copia del valore

```js
// counter-consumer.js, in un ambiente dove counter.js non e gia stato usato
import { count, increment } from "./counter.js";

console.log(count); // 0
increment();
console.log(count); // 1
// count = 10; // TypeError: l'importatore non puo riassegnare il binding
```

Un named import segue gli aggiornamenti fatti dal modulo esportatore. Un oggetto esportato puo comunque essere mutabile: il binding in sola lettura non equivale a `Object.freeze()`.

### Re-export

```js
// index.js
export { sum } from "./math.js";
export { default as log } from "./logger.js";
```

Questa sintassi riespone gli export senza dichiarare variabili locali `sum` e `log`. `export *` non riesporta il default; per quello serve una forma esplicita.

---
### Import statico e dynamic import
Import statico:

```js
import { formatDate } from "./date.js";
```

Dynamic import:

```js
const module = await import("./date.js");
```

Usa import statico come scelta normale. Usa dynamic import per lazy loading, code splitting o moduli opzionali.

Un import statico richiede una stringa letterale e deve stare al top-level, non dentro `if` o funzioni. Le dipendenze vengono collegate prima di eseguire il modulo; nei cicli, leggere un binding non ancora inizializzato puo comunque fallire: vedi [[Programmazione/JavaScript/Pagine/Circular Dependencies|Dipendenze circolari]]. I frammenti con `date.js` e `feature.js` mostrano soltanto la sintassi e presuppongono quei file.

---

## API / Sintassi

Named export:

```js
export function sum(a, b) {
  return a + b;
}
```

Named import:

```js
import { sum } from "./math.js";
```

Default export:

```js
export default function log(message) {}
```

Default import:

```js
import log from "./logger.js";
```

Dynamic import:

```js
const module = await import("./feature.js");
```

## Esempio pratico

Separare logica di validazione:

```js
// validators.js
export function hasEmailShape(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
```

```js
// signup.js
import { hasEmailShape } from "./validators.js";

export function hasSignupEmail(form) {
  return hasEmailShape(form?.email);
}
```

Il modulo `signup.js` dipende da una funzione esplicita, facile da testare e sostituire.

La regex controlla soltanto una forma comune: non copre tutta la sintassi email, non verifica l'esistenza della casella e non valida una registrazione completa. Il nome della funzione rende esplicito questo limite.

Per provare i due file nello stesso package ESM:

```js
// check-signup.js
import { hasSignupEmail } from "./signup.js";
console.log(hasSignupEmail({ email: "ada@example.test" })); // true
console.log(hasSignupEmail({ email: "@" })); // false
```

Da terminale, nella cartella contenente i file e il `package.json` mostrato sopra:

```sh
node check-signup.js
```

## Varianti

- **Named export**: piu export espliciti.
- **Default export**: una entita principale.
- **Namespace import**: raggruppa export sotto un oggetto.
- **Re-export**: riespone export da altri moduli.
- **Dynamic import**: caricamento lazy.
- **CommonJS**: sistema storico di Node.js con `require` e `module.exports`.

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

- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]
- [[Programmazione/JavaScript/Pagine/Circular Dependencies|Circular Dependencies]]
- [[Programmazione/JavaScript/Pagine/Strict Mode|Strict Mode]]
- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]


## Fonti

- [MDN - Guida ai moduli](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN - Import statico](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [MDN - Export e re-export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
- [Node.js - ECMAScript modules](https://nodejs.org/api/esm.html)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]

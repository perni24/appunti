---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - javascript
  - bundling
  - performance
aliases: []
prerequisites: []
related: []
---

# Bundling e tree shaking

## Sintesi

Il **bundling** combina moduli JavaScript e asset in file ottimizzati per il browser. Il **tree shaking** elimina codice importato ma non usato, riducendo la dimensione finale.

## Quando usarlo

Usa bundling quando il codice deve essere distribuito al browser in modo efficiente, con moduli, asset e dipendenze ottimizzati.

Serve soprattutto per:

- applicazioni frontend con molti moduli;
- uso di librerie da npm;
- trasformazioni come TypeScript, JSX o CSS modules;
- code splitting e lazy loading;
- ottimizzazione della dimensione finale.

Per pagine molto semplici puoi anche usare moduli ES nativi senza bundler, ma perdi molte ottimizzazioni automatiche.

## Come funziona

### Concetto chiave
I bundler analizzano il grafo dei moduli. Con moduli ES statici possono capire quali export sono realmente usati.

```javascript
import { used } from "./lib.js";

used();
```

Se `lib.js` esporta anche `unused`, un bundler puo rimuoverlo dal bundle finale se non ha side effect.
### Strumenti comuni
- Vite.
- Rollup.
- esbuild.
- webpack.
- Parcel.
### Side effects
Il tree shaking funziona meglio quando i moduli sono puri. Import con side effect rendono piu difficile eliminare codice.

```javascript
import "./global-polyfill.js";
```

## API / Sintassi

Il tree shaking funziona meglio con import/export ES statici:

```javascript
import { formatPrice } from "./formatters.js";

export function renderProduct(product) {
  return formatPrice(product.price);
}
```

Evita import generici quando non servono:

```javascript
import * as utils from "./utils.js";
```

In `package.json`, il campo `sideEffects` puo aiutare il bundler a capire quali file sono eliminabili:

```json
{
  "sideEffects": false
}
```

Va usato solo se i moduli non producono effetti collaterali al solo import.

## Esempio pratico

Modulo con export multipli:

```javascript
// math.js
export function sum(a, b) {
  return a + b;
}

export function expensiveDebug(value) {
  console.log("debug", value);
}
```

Uso nell'app:

```javascript
import { sum } from "./math.js";

console.log(sum(2, 3));
```

Se il bundler puo provare che `expensiveDebug` non viene usata e non ha side effect, puo rimuoverla dal bundle finale.

## Varianti

- **Bundling unico**: tutto il codice in un file principale.
- **Code splitting**: bundle separati per route o feature.
- **Dynamic import**: carica codice solo quando serve.
- **Pre-bundling dipendenze**: ottimizza librerie esterne durante lo sviluppo.
- **Library mode**: bundle pensato per pubblicare una libreria.
- **No-bundle development**: server dev che usa ESM nativo e trasforma on demand.

## Errori comuni

- Importare intere librerie quando serve una sola funzione.
- Usare CommonJS dove servirebbe analisi statica ESM.
- Ignorare bundle analyzer e dimensione finale.

## Checklist

- Usa moduli ES quando vuoi favorire tree shaking.
- Misura la dimensione del bundle con strumenti di analisi.
- Evita import di librerie intere se usi poche funzioni.
- Isola import con side effect.
- Usa dynamic import per feature pesanti non sempre necessarie.
- Controlla che il bundle prodotto sia compatibile con i browser target.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]
- [[Programmazione/JavaScript/Pagine/Vite|Vite]]

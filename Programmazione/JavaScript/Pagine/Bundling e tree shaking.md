---
date: 2026-05-20
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
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

## Concetto chiave

I bundler analizzano il grafo dei moduli. Con moduli ES statici possono capire quali export sono realmente usati.

```javascript
import { used } from "./lib.js";

used();
```

Se `lib.js` esporta anche `unused`, un bundler puo rimuoverlo dal bundle finale se non ha side effect.

## Strumenti comuni

- Vite.
- Rollup.
- esbuild.
- webpack.
- Parcel.

## Side effects

Il tree shaking funziona meglio quando i moduli sono puri. Import con side effect rendono piu difficile eliminare codice.

```javascript
import "./global-polyfill.js";
```

## Errori comuni

- Importare intere librerie quando serve una sola funzione.
- Usare CommonJS dove servirebbe analisi statica ESM.
- Ignorare bundle analyzer e dimensione finale.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]
- [[Programmazione/JavaScript/Pagine/Vite|Vite]]



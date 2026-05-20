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
  - debugging
  - tooling
aliases: []
prerequisites: []
related: []
---

# Source maps e debugging

## Sintesi

Le **source maps** collegano il codice generato, minificato o compilato al codice sorgente originale. Permettono di fare debug leggendo i file originali invece del bundle finale.

## Concetto chiave

In produzione il browser esegue spesso codice trasformato. Una source map descrive la corrispondenza tra posizioni nel file generato e posizioni nel sorgente.

```javascript
//# sourceMappingURL=app.js.map
```

## Quando servono

- Debug di codice minificato.
- Debug di TypeScript compilato.
- Debug di bundle Vite, Rollup o webpack.
- Stack trace leggibili nei sistemi di monitoring.

## Attenzione in produzione

Pubblicare source map puo esporre codice sorgente. In alcuni progetti conviene caricarle solo su sistemi di error tracking, senza renderle pubbliche.

## Errori comuni

- Disabilitarle in sviluppo.
- Pubblicarle senza valutare implicazioni di sicurezza.
- Non collegarle al sistema di error reporting.

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
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]
- [[Programmazione/JavaScript/Pagine/Vite|Vite]]



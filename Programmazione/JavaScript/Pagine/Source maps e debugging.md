---
date: 2026-06-02
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

## Quando usarlo

### Quando servono
- Debug di codice minificato.
- Debug di TypeScript compilato.
- Debug di bundle Vite, Rollup o webpack.
- Stack trace leggibili nei sistemi di monitoring.

## Come funziona

### Concetto chiave
In produzione il browser esegue spesso codice trasformato. Una source map descrive la corrispondenza tra posizioni nel file generato e posizioni nel sorgente.

```javascript
//# sourceMappingURL=app.js.map
```

## API / Sintassi

La source map e collegata al file generato con un commento finale:

```javascript
//# sourceMappingURL=app.js.map
```

Nelle configurazioni dei bundler il nome dell'opzione cambia, ma il concetto resta:

```javascript
export default {
  build: {
    sourcemap: true,
  },
};
```

In sviluppo le source map sono normalmente pubbliche. In produzione puoi generarle ma caricarle solo nel sistema di error tracking.

## Esempio pratico

Senza source map, uno stack trace puo puntare al bundle minificato:

```text
TypeError: user is undefined
  at app.min.js:1:24891
```

Con source map corretta, il debugger puo ricondurre l'errore al file sorgente:

```text
TypeError: user is undefined
  at src/profile/renderProfile.js:42:12
```

Questo rende molto piu rapido capire quale funzione reale ha generato il problema.

## Varianti

- **Inline source map**: incorporata nel file generato, comoda in sviluppo.
- **External source map**: file `.map` separato.
- **Hidden source map**: utile per error tracking senza esporre il riferimento nel bundle.
- **Eval source map**: veloce in sviluppo, meno adatta a produzione.
- **Source map di produzione**: da proteggere se contiene codice sorgente sensibile.

## Errori comuni

### Attenzione in produzione
Pubblicare source map puo esporre codice sorgente. In alcuni progetti conviene caricarle solo su sistemi di error tracking, senza renderle pubbliche.
- Disabilitarle in sviluppo.
- Pubblicarle senza valutare implicazioni di sicurezza.
- Non collegarle al sistema di error reporting.

## Checklist

- Abilita source map leggibili in sviluppo.
- Scegli una strategia sicura per produzione.
- Carica source map nel tool di error tracking se usato.
- Verifica stack trace dopo la build.
- Evita di esporre sorgenti sensibili pubblicamente.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]
- [[Programmazione/JavaScript/Pagine/Vite|Vite]]

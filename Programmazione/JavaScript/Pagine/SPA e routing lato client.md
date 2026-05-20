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
  - frontend
  - routing
aliases: []
prerequisites: []
related: []
---

# SPA e routing lato client

## Sintesi

Una **SPA** (Single Page Application) carica una pagina HTML principale e aggiorna l'interfaccia via JavaScript. Il **routing lato client** cambia vista senza richiedere al server una nuova pagina completa.

## Concetto chiave

Il browser mantiene l'URL, ma JavaScript decide quale componente o vista mostrare.

```javascript
window.history.pushState({}, "", "/settings");
```

## Routing lato client

Le API principali sono:

- `history.pushState`;
- `history.replaceState`;
- evento `popstate`;
- hash routing con `location.hash`.

## Vantaggi

- Navigazione fluida.
- Stato client ricco.
- Transizioni rapide tra viste gia caricate.

## Limiti

- Serve configurare fallback server verso `index.html`.
- SEO e performance iniziale possono richiedere SSR o prerendering.
- Gestire loading, errori e permessi diventa responsabilita dell'app.

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

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/BOM|BOM]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Server-side rendering|Server-side rendering]]



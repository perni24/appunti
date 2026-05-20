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
  - ssr
  - frontend
aliases: []
prerequisites: []
related: []
---

# Server-side rendering

## Sintesi

Il **server-side rendering** (SSR) genera HTML sul server prima di inviarlo al browser. JavaScript sul client puo poi rendere la pagina interattiva tramite hydration.

## Concetto chiave

In una SPA pura il browser riceve poco HTML e costruisce l'interfaccia lato client. Con SSR il server invia gia markup significativo.

## Vantaggi

- Primo contenuto visibile piu rapido in molti scenari.
- Migliore supporto SEO.
- Condivisione piu semplice di anteprime e metadata.
- Possibilita di combinare rendering server e client.

## Costi

- Architettura piu complessa.
- Doppio ambiente: server e browser.
- Problemi di hydration se HTML server e client divergono.
- Caching piu importante.

## Concetti collegati

- Hydration.
- Static Site Generation.
- Streaming SSR.
- Server Components.
- Edge rendering.

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
- [[Programmazione/JavaScript/Pagine/SPA e routing lato client|SPA e routing lato client]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]



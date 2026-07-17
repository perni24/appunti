---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, nextjs, remix, framework]
aliases: [Next.js, Remix, Framework React]
prerequisites: []
related: []
---

# Framework Next.js e Remix

## Sintesi

Next.js e Remix sono framework sopra React. Aggiungono routing, data loading, rendering server-side, build, deployment conventions e pattern full-stack.

React da solo gestisce UI; un framework gestisce l'applicazione web completa.

## Quando usarlo

Usa un framework quando servono routing integrato, SSR/SSG, data loading a livello route, SEO, deploy full-stack, server actions o convenzioni solide.

Per SPA interne piccole, Vite + React Router puo bastare.

## Come funziona

Next.js usa file-based routing e supporta Server Components nel suo modello moderno.

Remix enfatizza route, loader, action, form web-native e progressive enhancement.

## API / Sintassi

Concetti Next.js:

```text
app/
  page.tsx
  layout.tsx
```

Concetti Remix:

```text
routes/
  _index.tsx
  users.$id.tsx
```

Entrambi spostano parte della logica di routing e dati fuori dai componenti client puri.

## Esempio pratico

Scelta:

- pagina marketing statica: SSG;
- dashboard utente: SSR o data loading server;
- form con mutazione: action/server action;
- app interna SPA: React Router puo bastare.

## Varianti

- **Next.js**: ecosystem ampio, App Router, RSC, SSG/SSR.
- **Remix**: web standards, loader/action, form e nested routing.
- **React Router framework mode**: evoluzione verso data routing full-stack.
- **Vite SPA**: client-side puro.
- **Astro + React**: isole interattive in siti content-heavy.

## Errori comuni

- Scegliere framework solo per moda.
- Non capire quali parti girano server-side.
- Usare API browser in codice server.
- Confondere cache framework e cache client.
- Portare pattern SPA puri in framework server senza adattarli.

## Checklist

- Serve SSR/SSG?
- Serve data loading a livello route?
- Il team capisce il confine server/client?
- La cache e documentata?
- React puro sarebbe sufficiente?
- Il framework supporta il deployment target?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[SSR e SSG]]
- [[Server Components]]
- [[React Router]]
- [[Data Fetching e Cache]]

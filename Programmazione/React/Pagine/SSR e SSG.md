---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: advanced
tags: [react, ssr, ssg, rendering]
aliases: [SSR, SSG, Streaming SSR, Hydration]
prerequisites: []
related: []
---

# SSR e SSG

## Sintesi

SSR renderizza HTML sul server a ogni richiesta o secondo regole del framework. SSG genera HTML statico in fase di build. Entrambi migliorano primo caricamento, SEO e distribuzione rispetto a una SPA pura, ma aggiungono complessita.

## Quando usarlo

Usa SSR per pagine dinamiche con bisogno di SEO, dati aggiornati o personalizzazione. Usa SSG per contenuti stabili, documentazione, blog, landing, cataloghi statici.

## Come funziona

SSR:

```text
request -> server render -> HTML -> hydration client
```

SSG:

```text
build -> HTML statico -> CDN -> hydration client
```

Hydration collega il markup server-rendered al comportamento React nel browser.

## API / Sintassi

In React puro esistono API server come `renderToPipeableStream`, ma nella pratica SSR/SSG vengono gestiti da framework come Next.js o Remix.

Concetti:

- render server;
- hydration;
- streaming;
- static generation;
- route data loading;
- cache e revalidation.

## Esempio pratico

Pagina SSG concettuale:

```text
Product page generata in build
HTML servito da CDN
React idrata interazioni client
```

Pagina SSR:

```text
Dashboard utente
dati letti per richiesta
HTML iniziale personalizzato
```

## Varianti

- **SSR classico**: HTML per richiesta.
- **Streaming SSR**: invio progressivo.
- **SSG**: generazione statica.
- **ISR/revalidation**: rigenerazione controllata dal framework.
- **Hydration parziale/selettiva**: dipende dal framework.
- **RSC**: Server Components, modello diverso dal solo SSR.

## Errori comuni

- Pensare che SSR elimini JavaScript client.
- Ignorare mismatch di hydration.
- Usare API browser durante render server.
- Non gestire cache e invalidazione.
- Rendere tutto SSR anche se statico.
- Confondere SSR con Server Components.

## Checklist

- La pagina ha bisogno di SEO o primo HTML utile?
- I dati sono statici o per richiesta?
- Il framework gestisce cache e revalidation?
- Ci sono API browser usate lato server?
- Hydration e fallback sono testati?
- SSG sarebbe sufficiente?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Server Components]]
- [[Framework Next.js e Remix]]
- [[Suspense e Lazy Loading]]
- [[Data Fetching e Cache]]

---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, suspense, lazy-loading, performance]
aliases: [Suspense, Lazy Loading, Bundle splitting]
prerequisites: []
related: []
---

# Suspense e Lazy Loading

## Sintesi

`Suspense` permette di mostrare un fallback mentre una parte della UI non e pronta. `React.lazy` permette di caricare componenti solo quando servono, riducendo il bundle iniziale.

Suspense e utile per code splitting, route lazy e integrazioni con framework/data layer compatibili.

## Quando usarlo

Usalo per route pesanti, pannelli caricati raramente, modali grandi, componenti sotto feature flag e parti della UI che possono aspettare.

## Come funziona

```jsx
const SettingsPage = lazy(() => import("./SettingsPage"));

function App() {
  return (
    <Suspense fallback={<p>Caricamento...</p>}>
      <SettingsPage />
    </Suspense>
  );
}
```

Il componente viene caricato quando renderizzato.

## API / Sintassi

```jsx
import { Suspense, lazy } from "react";
```

Lazy:

```jsx
const Component = lazy(() => import("./Component"));
```

Fallback:

```jsx
<Suspense fallback={<Spinner />}>
  <Component />
</Suspense>
```

## Esempio pratico

Route lazy:

```jsx
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

function ReportsRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReportsPage />
    </Suspense>
  );
}
```

## Varianti

- **Component lazy loading**: `React.lazy`.
- **Route splitting**: una chunk per pagina.
- **Nested Suspense**: fallback granulari.
- **Streaming SSR**: server invia HTML progressivo.
- **Framework data Suspense**: dipende da framework/libreria.

## Errori comuni

- Mettere fallback troppo grandi o instabili.
- Spezzare bundle in troppe chunk piccole.
- Non gestire errori di import con error boundary.
- Usare lazy loading per componenti sempre visibili.
- Creare layout shift durante fallback.

## Checklist

- Il componente e abbastanza pesante o raro?
- Il fallback preserva layout?
- C'e un error boundary vicino?
- La chunk migliora davvero il bundle iniziale?
- La UX resta comprensibile durante caricamento?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Error Boundaries]]
- [[SSR e SSG]]
- [[Server Components]]
- [[Profiler e Debugging]]

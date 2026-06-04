---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, error-handling, architecture]
aliases: [Error Boundaries, Error handling globale, Boundary UI]
prerequisites: []
related: []
---

# Error Boundaries

## Sintesi

Gli Error Boundaries catturano errori durante il rendering, nei lifecycle e nei constructor dei componenti sotto di loro, mostrando una UI di fallback invece di far collassare tutta l'app.

Non catturano errori in event handler, async callback o codice server.

## Quando usarlo

Usali per isolare sezioni critiche: route, widget, dashboard panel, parti caricate lazy, componenti di terze parti o aree dove un errore non deve rompere tutta la pagina.

## Come funziona

Storicamente un error boundary e un componente a classe:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

## API / Sintassi

Uso:

```jsx
<ErrorBoundary fallback={<p>Errore nel pannello</p>}>
  <DashboardPanel />
</ErrorBoundary>
```

Boundary per route:

```jsx
<ErrorBoundary fallback={<RouteError />}>
  <RouteContent />
</ErrorBoundary>
```

## Esempio pratico

```jsx
function Dashboard() {
  return (
    <main>
      <ErrorBoundary fallback={<p>Grafico non disponibile</p>}>
        <Chart />
      </ErrorBoundary>
      <ErrorBoundary fallback={<p>Tabella non disponibile</p>}>
        <Table />
      </ErrorBoundary>
    </main>
  );
}
```

Ogni area fallisce in modo isolato.

## Varianti

- **Boundary globale**: protegge tutta l'app.
- **Boundary per route**: fallback per pagina.
- **Boundary locale**: protegge widget specifici.
- **Boundary + logging**: invia errori a osservabilita.
- **Boundary + Suspense**: fallback diversi per errore e loading.

## Errori comuni

- Pensare che catturi errori async o event handler.
- Mettere un solo boundary globale e perdere isolamento.
- Non loggare errori catturati.
- Mostrare fallback generici senza azione utile.
- Usare boundary per nascondere bug ricorrenti.

## Checklist

- Le aree critiche sono isolate?
- Il fallback e comprensibile?
- Gli errori vengono registrati?
- Gli event handler gestiscono i propri errori?
- Le route hanno boundary dedicati?
- Gli errori non vengono semplicemente nascosti?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Suspense e Lazy Loading]]
- [[React Router]]
- [[Profiler e Debugging]]
- [[API layer]]

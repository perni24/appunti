---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, memory, abortcontroller, effects]
aliases: [Gestione memoria React, AbortController, Race condition negli effect, Cancellation]
prerequisites: []
related: []
---

# Gestione della memoria e AbortController

## Sintesi

In React i problemi di memoria nascono spesso da effect senza cleanup, listener non rimossi, timer attivi, richieste obsolete e riferimenti trattenuti inutilmente. `AbortController` permette di cancellare fetch e operazioni collegate a un segnale.

## Quando usarlo

Usa cleanup e cancellazione quando un componente avvia risorse esterne: fetch, subscription, timer, websocket, observer, listener DOM o librerie imperative.

## Come funziona

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/users", { signal: controller.signal });

  return () => controller.abort();
}, []);
```

Quando il componente si smonta, la richiesta viene cancellata.

## API / Sintassi

AbortController:

```jsx
const controller = new AbortController();
const signal = controller.signal;
controller.abort();
```

Listener con cleanup:

```jsx
useEffect(() => {
  function handleResize() {}
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

## Esempio pratico

```jsx
useEffect(() => {
  const controller = new AbortController();

  async function loadData() {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        signal: controller.signal,
      });
      setUser(await response.json());
    } catch (error) {
      if (error.name !== "AbortError") setError(error);
    }
  }

  loadData();

  return () => controller.abort();
}, [userId]);
```

## Varianti

- **AbortController**: cancellazione fetch.
- **Boolean guard**: evita update tardivi.
- **Cleanup effect**: listener, timer, subscription.
- **Data fetching library**: gestisce molte cancellazioni e race.
- **WebSocket cleanup**: chiusura connessioni.

## Errori comuni

- Non cancellare fetch obsolete.
- Non rimuovere listener.
- Non pulire interval e timeout.
- Aggiornare state dopo smontaggio.
- Conservare grandi oggetti in closure non necessarie.
- Ignorare race condition tra richieste.

## Checklist

- L'effect apre una risorsa esterna?
- Esiste cleanup?
- Le richieste obsolete vengono cancellate?
- Gli errori `AbortError` sono gestiti?
- Le dipendenze sono corrette?
- Una cache dedicata risolverebbe meglio?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useEffect]]
- [[Data Fetching e Cache]]
- [[HTTPX e requests]]
- [[Profiler e Debugging]]

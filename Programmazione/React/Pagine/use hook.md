---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: advanced
tags: [react, hooks, suspense]
aliases: [use, use hook, React use]
prerequisites: []
related: []
---

# use hook

## Sintesi

`use` e una API React moderna per leggere risorse come promise o context in contesti supportati. Si collega a Suspense e Server Components, e va usata seguendo attentamente le regole documentate per la versione e il framework in uso.

## Quando usarlo

Valutalo quando lavori con Server Components, Suspense o framework che espongono pattern compatibili. Non sostituisce `useEffect` per side effect client generici.

## Come funziona

Concettualmente, `use` legge una risorsa. Se la risorsa non e pronta, React puo sospendere il rendering e mostrare un fallback Suspense.

```jsx
function Message({ messagePromise }) {
  const message = use(messagePromise);
  return <p>{message}</p>;
}
```

## API / Sintassi

```jsx
import { use } from "react";
```

Uso con Suspense:

```jsx
<Suspense fallback={<p>Caricamento...</p>}>
  <Message messagePromise={messagePromise} />
</Suspense>
```

## Esempio pratico

In un framework compatibile, una promise preparata a livello superiore puo essere letta da un componente che sospende finche il dato non e disponibile.

## Varianti

- **use con promise**: sospende se non pronta.
- **use con context**: lettura context in alcuni pattern consentiti.
- **Server Components**: uso frequente lato server/framework.
- **Suspense boundary**: fallback per risorse non pronte.

## Errori comuni

- Usarlo come data fetching generico client senza capire Suspense.
- Non avere boundary Suspense.
- Creare promise nuove a ogni render.
- Confondere `use` con gli hook classici.
- Usarlo fuori da contesti supportati dal framework.

## Checklist

- La versione React/framework supporta il caso?
- Esiste un boundary Suspense?
- La promise e stabile?
- Il fallback e utile?
- `useEffect` o una cache data fetching sarebbero piu adatti?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Suspense e Lazy Loading]]
- [[Server Components]]
- [[Data Fetching e Cache]]
- [React Reference](https://react.dev/reference/react)

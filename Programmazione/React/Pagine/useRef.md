---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [react, hooks, ref]
aliases: [useRef, Ref React]
prerequisites: []
related: []
---

# useRef

## Sintesi

`useRef` crea un oggetto mutabile persistente tra render. Il valore sta in `ref.current`. Modificarlo non causa un nuovo render.

Si usa per riferimenti DOM, valori imperativi, timer id, istanze di librerie esterne o dati che devono sopravvivere ai render senza influenzare la UI.

## Quando usarlo

Usa `useRef` quando:

- devi accedere a un nodo DOM;
- devi gestire focus o misure;
- devi salvare un id di timer;
- devi mantenere un valore mutabile non renderizzato;
- devi integrare codice imperativo esterno.

Se il valore deve essere mostrato nella UI, usa `useState`.

## Come funziona

```jsx
import { useRef } from "react";

function SearchInput() {
  const inputRef = useRef(null);

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}
```

React assegna il nodo DOM a `inputRef.current`.

## API / Sintassi

Creazione:

```jsx
const ref = useRef(initialValue);
```

Scrittura:

```jsx
ref.current = value;
```

Timer:

```jsx
const timeoutRef = useRef(null);

timeoutRef.current = setTimeout(() => {
  console.log("done");
}, 1000);
```

## Esempio pratico

Memorizzare valore precedente:

```jsx
function Price({ value }) {
  const previousValue = useRef(value);

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  return (
    <p>
      Ora: {value}, prima: {previousValue.current}
    </p>
  );
}
```

## Varianti

- **DOM ref**: accesso a elementi.
- **Mutable ref**: valore persistente non renderizzato.
- **Timer ref**: id di timeout o interval.
- **Integration ref**: istanza di libreria esterna.
- **forwardRef**: passare ref attraverso componenti.
- **useImperativeHandle**: esporre API imperative controllate.

## Errori comuni

- Usare ref al posto dello state per dati visibili.
- Leggere o scrivere ref durante render per controllare output.
- Non controllare `ref.current` quando puo essere `null`.
- Usare ref per aggirare il modello dichiarativo.
- Non pulire timer o istanze esterne.

## Checklist

- Il valore deve causare render? Se si, serve state.
- La ref puo essere `null`?
- Il codice imperativo e confinato?
- Serve cleanup?
- Il focus o la misura DOM rispettano accessibilita?
- Una prop controllata sarebbe piu semplice?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Focus Management]]
- [[Gestione della memoria e AbortController]]
- [[useEffect]]
- [[Portals]]

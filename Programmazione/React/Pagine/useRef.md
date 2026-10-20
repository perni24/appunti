---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - react
  - hooks
  - ref
aliases:
  - useRef
  - Ref React
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/useEffect|useEffect]]"
  - "[[Programmazione/React/Pagine/Focus Management|Focus Management]]"
title: useRef
---

# useRef

## Sintesi

`useRef` conserva lo stesso oggetto `{ current: ... }` tra i render di una stessa istanza. Modificare `current` non richiede un render: una ref e adatta a un nodo DOM o a un identificatore di timer, non a un valore da mostrare nel JSX.

Esempi client completi per React 19.3.0. Ogni blocco esporta un componente indipendente utilizzabile come `App.jsx` nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]].

## Quando usarlo

Usa `useRef` quando:

- devi accedere a un nodo DOM;
- devi gestire focus o misure;
- devi salvare un id di timer;
- devi mantenere un valore mutabile non renderizzato;
- devi integrare codice imperativo esterno.

Se il valore deve essere mostrato nella UI, usa `useState`.

## Come funziona

Una variabile locale riparte a ogni chiamata del componente; una variabile di modulo sarebbe condivisa fra tutte le istanze. La ref e invece privata dell'istanza e persiste fino allo smontaggio. Un nuovo mount o una nuova `key` la inizializzano di nuovo.

Leggi e scrivi la ref negli handler o negli effect. Non usarla nel render per decidere il contenuto della UI: React non sa quando cambia. La limitata eccezione per inizializzazioni prevedibili e pure non autorizza fetch, timer o scritture globali durante il render.

Nel caso DOM, `current` parte da `null`; React assegna il nodo durante il commit e lo azzera quando lo rimuove. Non presumere che un input appena richiesto con un setter sia gia presente nella stessa istruzione successiva.

## API / Sintassi

Schema nel corpo di un componente o custom Hook:

```jsx
const ref = useRef(initialValue);
```

Schema in un handler o effect, con `value` gia disponibile:

```jsx
ref.current = value;
```

`initialValue` vale per l'inizializzazione; una nuova prop non sostituisce automaticamente `current`. Diversamente da `useState`, passare una funzione a `useRef` **conserva quella funzione**, non la invoca come initializer. L'espressione `useRef(createValue())` invece chiama `createValue` a ogni render per le normali regole JavaScript.

## Esempio pratico

### Focus senza controllare il valore

```jsx
import { useRef } from "react";

export default function SearchInput() {
  const inputRef = useRef(null);

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <section>
      <label>Ricerca<input ref={inputRef} defaultValue="" /></label>
      <button type="button" onClick={focusInput}>Focus ricerca</button>
    </section>
  );
}
```

L'input e non controllato: il DOM gestisce il testo e la ref serve soltanto al focus. Non assegnare manualmente `input.value` a un input che React controlla tramite `value`. Evita inoltre di rimuovere nodi DOM di proprieta React: cambiali tramite stato/JSX.

### Timer cancellabile

La ref conserva il timer; lo stato conserva il messaggio visibile. Premi Programma piu volte: viene sostituita la scadenza precedente, non accumulata. Il ritardo e minimo indicativo, non un orologio preciso.

```jsx
import { useEffect, useRef, useState } from "react";

export default function DelayedNotice() {
  const timerRef = useRef(null);
  const [status, setStatus] = useState("Inattivo");

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  function schedule() {
    clearTimeout(timerRef.current);
    setStatus("In attesa");
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setStatus("Completato");
    }, 1000);
  }

  function cancel() {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    setStatus("Annullato");
  }

  return (
    <section>
      <p role="status">{status}</p>
      <button type="button" onClick={schedule}>Programma</button>
      <button type="button" onClick={cancel}>Annulla</button>
    </section>
  );
}
```

Per un intervallo che nasce e muore interamente nello stesso effect basta una variabile locale al setup, come in [[Programmazione/React/Pagine/useEffect|useEffect]]. Qui serve la ref per condividere l'handle fra handler e cleanup.

### Un valore precedente da visualizzare non e una ref

Il vecchio pattern che aggiornava `previousValue.current` in un effect e lo leggeva nel JSX mescolava memoria imperativa e rendering. Se controlli l'evento che cambia il valore, conserva corrente e precedente nello stesso aggiornamento di stato:

```jsx
import { useState } from "react";

export default function PriceHistory() {
  const [price, setPrice] = useState({ current: 10, previous: null });

  function increase() {
    setPrice((old) => ({ current: old.current + 5, previous: old.current }));
  }

  return (
    <section>
      <p>Ora: {price.current}; prima: {price.previous ?? "nessuno"}</p>
      <button type="button" onClick={increase}>Aumenta di 5</button>
    </section>
  );
}
```

Qui "precedente" significa valore precedente all'ultimo incremento, non "render precedente". Se il dato arriva dal padre, definisci li lo storico o il confronto necessario; non aggiungere un effect solo per duplicare una prop.

## Varianti

- **DOM ref**: focus, selezione, scorrimento o misure, rispettando navigazione da tastiera e timing del commit.
- **Mutable ref**: handle esterni non renderizzati; la ref non chiude automaticamente le risorse che contiene.
- **Ref attraverso componenti**: in React 19 una funzione puo ricevere `ref` come prop e passarla al nodo. Nei componenti compatibili con React 18 si usa `forwardRef`; non e necessaria per un nodo nativo come `<input>`.
- **useImperativeHandle**: limita i metodi esposti al padre, quando props/callback non sono sufficienti.
- **Strict Mode**: in sviluppo React puo richiamare il componente e scartare una delle ref create. Non avviare risorse durante il render assumendo che avvenga una sola volta.

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

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController|Gestione della memoria e AbortController]]
- [[Programmazione/React/Pagine/useEffect|useEffect]]
- [[Programmazione/React/Pagine/Portals|Portals]]
- [[Programmazione/React/Pagine/useState|useState]]

## Fonti

Documentazione consultata il 2026-10-15; React 19.3.0.

- [useRef: identita, inizializzazione e limiti](https://react.dev/reference/react/useRef).
- [Ref e stato: cosa conservare e cosa renderizzare](https://react.dev/learn/referencing-values-with-refs).
- [Accesso al DOM e momento di assegnazione della ref](https://react.dev/learn/manipulating-the-dom-with-refs).
- [forwardRef e differenza rispetto a React 19](https://react.dev/reference/react/forwardRef).
- [Strict Mode](https://react.dev/reference/react/StrictMode).

---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - rendering
  - performance
aliases:
  - Batching
  - Automatic batching
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/Virtual DOM|Virtual DOM]]"
  - "[[Programmazione/React/Pagine/useTransition e useDeferredValue|Transition e valore differito]]"
title: Batching
---

# Batching

## Sintesi

Il batching permette a React di elaborare insieme piu aggiornamenti di stato, evitando UI intermedie e lavoro ripetuto. Non garantisce che la funzione componente venga chiamata esattamente una volta: Strict Mode, priorita diverse e tentativi di render possono modificare quel conteggio.

Da React 18, usando le API di root moderne, il batching automatico si estende anche a callback di Promise, timer ed eventi nativi. Gli esempi qui usano React 19.3.0 con `createRoot`, come nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]].

## Quando usarlo

Non va abilitato su ogni handler. Serve capirlo quando piu setter dipendono dallo stesso valore, quando osservi il DOM subito dopo un update o quando integri un'API imperativa. La correttezza della logica non deve dipendere da quanti render vengono risparmiati.

## Come funziona

Un setter mette in coda un aggiornamento; non cambia la variabile letta dall'handler corrente. Quella variabile appartiene allo snapshot del render che ha creato l'handler, anche dentro una callback asincrona.

Gli aggiornamenti vengono applicati nell'ordine della coda. Un valore richiede una sostituzione; una funzione updater riceve il risultato precedente della coda. Esempi, partendo sempre da `count = 0`:

| Chiamate nello stesso handler | Risultato |
| --- | --- |
| Due volte `setCount(count + 1)` | `1`: entrambe chiedono di sostituire con `1` |
| Due volte `setCount(value => value + 1)` | `2`: gli updater si compongono |
| `setCount(5)`, poi incremento funzionale | `6` |
| Incremento funzionale, poi `setCount(5)` | `5`: la sostituzione successiva prevale |

Gli updater devono essere puri. Non inserire salvataggi, analytics o mutazioni al loro interno: React puo richiamarli per controlli o tentativi di rendering. Batching non e una transazione su database e non coordina effetti su sistemi esterni.

## API / Sintassi

- Usa `setCount(value => value + 1)` quando il prossimo valore dipende dallo stato precedente.
- Il setter non restituisce una Promise: `await setCount(...)` non significa "attendi il commit".
- `flushSync` si importa da `react-dom`, non da `react`. E una soluzione eccezionale per requisiti DOM sincroni, non un modo per aggiornare lo snapshot dell'handler.

## Esempio pratico

### Confrontare sostituzioni e updater

Questo `App.jsx` rende osservabile sia il risultato sia il valore letto dopo i setter:

```jsx
import { useState } from "react";

export default function BatchCounter() {
  const [count, setCount] = useState(0);
  const [snapshot, setSnapshot] = useState(null);

  function replaceTwice() {
    setCount(count + 1);
    setCount(count + 1);
    setSnapshot(count);
  }

  function incrementTwice() {
    setCount((value) => value + 1);
    setCount((value) => value + 1);
    setSnapshot(count);
  }

  return (
    <section aria-label="Coda dello stato">
      <p>Conteggio: {count}</p>
      <p>Letto nell'ultimo handler: {snapshot ?? "nessuna lettura"}</p>
      <button type="button" onClick={replaceTwice}>Due sostituzioni</button>
      <button type="button" onClick={incrementTwice}>Due updater</button>
      <button type="button" onClick={() => {
        setCount(5);
        setCount((value) => value + 1);
      }}>Sostituzione poi updater</button>
      <button type="button" onClick={() => {
        setCount((value) => value + 1);
        setCount(5);
      }}>Updater poi sostituzione</button>
      <button type="button" onClick={() => {
        setCount(0);
        setSnapshot(null);
      }}>Reset</button>
    </section>
  );
}
```

Da zero, "Due updater" mostra `2` ma la lettura nell'handler resta `0`. Un click successivo usa il nuovo snapshot: non e uno stato globalmente "rimasto indietro".

### Integrazione DOM sincrona

Qui la stessa callback deve montare un campo e focalizzarlo immediatamente. Nell'app ordinaria preferisci la gestione del focus dopo commit descritta in [[Programmazione/React/Pagine/Focus Management|Focus Management]]; questo esempio isola il caso in cui serve il DOM gia aggiornato prima di proseguire.

```jsx
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";

export function ImmediateEditor() {
  const inputId = useId();
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);

  function openAndFocus() {
    flushSync(() => setOpen(true));
    inputRef.current?.focus();
  }

  return (
    <section aria-label="Editor sincrono">
      <button ref={triggerRef} type="button" onClick={openAndFocus}>
        Apri editor
      </button>
      {open && (
        <div>
          <label htmlFor={inputId}>Bozza temporanea</label>
          <input id={inputId} ref={inputRef} />
          <button type="button" onClick={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}>Chiudi editor</button>
        </div>
      )}
    </section>
  );
}
```

Alla chiusura la bozza non controllata viene scartata. `flushSync` puo forzare altro lavoro pendente, eseguire effect e far riapparire fallback Suspense; puo peggiorare le prestazioni. Non chiamarlo durante render o effect per aggirare il lifecycle. Non forza necessariamente il paint del browser prima del ritorno.

## Varianti

- Gli update nella stessa callback di un timer o Promise possono essere raggruppati. Non dedurre che un'intera procedura async, attraversando diversi `await`, sia un unico batch.
- Eventi intenzionali distinti, per esempio due click separati, non sono un'unica operazione da fondere indiscriminatamente.
- Update urgenti e transition possono produrre commit distinti. Batching e scheduling risolvono problemi diversi.
- Quando piu campi costituiscono una sola transizione di dominio, un reducer puo esprimerla meglio di molti setter. Il batching da solo non definisce le invarianti del dominio.

## Errori comuni

- Aspettarsi che lo state cambi immediatamente dopo il setter.
- Usare `setCount(count + 1)` piu volte nello stesso handler.
- Usare batching come scusa per render impuri.
- Forzare render sincroni senza necessita.

## Checklist

- Il nuovo valore dipende dal precedente?
- Sto leggendo state subito dopo un setter?
- Gli update sono raggruppabili?
- Il comportamento e testato?
- Serve davvero forzare aggiornamento sincrono?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/Fiber Architecture e Concurrent Mode|Fiber Architecture e Concurrent Mode]]
- [[Programmazione/React/Pagine/useTransition e useDeferredValue|useTransition e useDeferredValue]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/useReducer|useReducer]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]

## Fonti

- [React: coda degli aggiornamenti](https://react.dev/learn/queueing-a-series-of-state-updates).
- [React: snapshot dello stato](https://react.dev/learn/state-as-a-snapshot).
- [React 18 Working Group: batching automatico e root](https://github.com/reactwg/react-18/discussions/21), contesto storico della modifica.
- [React DOM: flushSync e cautele](https://react.dev/reference/react-dom/flushSync).

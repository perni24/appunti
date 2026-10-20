---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - fiber
  - concurrent-rendering
aliases:
  - Fiber Architecture
  - Concurrent Mode
  - Concurrent Rendering
prerequisites:
  - "[[Programmazione/React/Pagine/Virtual DOM|Virtual DOM]]"
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/useTransition e useDeferredValue|Transition e valore differito]]"
  - "[[Programmazione/React/Pagine/Batching|Batching]]"
title: Fiber Architecture e Concurrent Mode
---

# Fiber Architecture e Concurrent Mode

## Sintesi

Fiber e l'architettura interna con cui React rappresenta istanze e lavoro di rendering. Permette di organizzare aggiornamenti con priorita diverse e preparare un risultato senza pubblicare nel DOM una UI incompleta.

"Concurrent Mode" e una denominazione storica, mantenuta nel titolo per ritrovare la nota. Nelle applicazioni moderne si usano funzionalita concorrenti tramite API pubbliche, non un componente `<ConcurrentMode>`. Fiber non significa che ogni render sia interrompibile o eseguito su un thread separato.

## Quando usarlo

Serve capirlo quando studi performance, rendering interrompibile, `useTransition`, Suspense, scheduling e perche React puo preparare UI in background.

## Come funziona

Una Fiber contiene, fra le altre cose, il tipo del nodo, collegamenti nell'albero e informazioni su props, stato e aggiornamenti. L'albero attualmente pubblicato e quello in preparazione permettono a React di conservare la UI esistente durante nuovo lavoro. Le *lanes* rappresentano categorie/priorita di lavoro: sono dettagli interni, non impostazioni applicative stabili.

Nel rendering concorrente React puo cedere il controllo tra unita di lavoro, riprendere o scartare un tentativo superato. Non puo interrompere arbitrariamente a meta una tua funzione JavaScript: un ciclo CPU lungo dentro un componente o un handler continua a bloccare il main thread.

Il commit che modifica il DOM resta sincrono. Non confonderlo con un render in background, un Web Worker o una Promise. Gli effect passivi hanno una propria gestione; non assumere che tutti gli effect siano lavoro interrompibile o che girino sempre dopo il paint.

Questa possibilita di ripetere il render richiede purezza: niente richieste, mutazioni esterne o registrazione di listener nel corpo del componente. Strict Mode aiuta a scoprire problemi in sviluppo, ma i suoi controlli non sono una simulazione completa dello scheduler.

## API / Sintassi

Non esiste una API pubblica per manipolare le Fiber. Usa gli strumenti in base al problema:

| Strumento | Funzione e limite |
| --- | --- |
| `useTransition` | Marca aggiornamenti non urgenti e fornisce `isPending`; non controllare cosi il valore di un input |
| `startTransition` | Variante senza hook; non fornisce da sola uno stato pending |
| `useDeferredValue` | Permette a una parte della UI di restare temporaneamente sul valore precedente |
| `Suspense` | Mostra un fallback quando una sorgente compatibile sospende; non intercetta qualunque fetch in un effect |
| Batching | Raggruppa aggiornamenti compatibili; non equivale a render interrompibile |

## Esempio pratico

Il seguente `App.jsx` funziona nel progetto base React 19.3.0. Non contiene ritardi artificiali: mostra la separazione fra valore digitato e ricerca visualizzata, non misura la fluidita sotto carico.

```jsx
import { memo, useId, useState, useTransition } from "react";

const entries = ["React", "Rust", "Python", "PostgreSQL"];

export const SearchResults = memo(function SearchResults({ query }) {
  const matches = entries.filter((entry) =>
    entry.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div>
      <p>Filtro applicato: {query || "tutti"}</p>
      {matches.length === 0 ? <p>Nessun risultato</p> : (
        <ul>{matches.map((entry) => <li key={entry}>{entry}</li>)}</ul>
      )}
    </div>
  );
});

export default function SearchPage() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    startTransition(() => setFilter(nextQuery));
  }

  return (
    <section aria-label="Ricerca locale">
      <label htmlFor={inputId}>Cerca linguaggi e strumenti</label>
      <input id={inputId} value={query} onChange={handleChange} />
      <p role="status">{isPending ? "Aggiornamento risultati" : "Risultati pronti"}</p>
      <div aria-busy={isPending}>
        <SearchResults query={filter} />
      </div>
    </section>
  );
}
```

`setQuery` e urgente; `setFilter` appartiene alla transition. `memo` permette al sottoalbero dei risultati di saltare l'aggiornamento urgente quando `filter` e ancora invariato. Il testo pending sta fuori dal figlio: passargli una prop che cambia a ogni battitura ne impedirebbe questo riuso.

La callback di `startTransition` viene chiamata subito: non mettervi un calcolo costoso pensando di spostarlo in background. Nel demo il filtro viene calcolato durante il render del figlio. Anche li, un singolo filtro enorme non viene spezzato magicamente: valuta dati indicizzati, virtualizzazione o Worker secondo il collo di bottiglia.

## Varianti

- Le transition possono essere superate da input piu recenti: conta il risultato corretto, non un numero fisso di render o una durata minima di `isPending`.
- Una transition non e un debounce e non cancella HTTP. Per concorrenza di richieste servono anche ordinamento dei risultati e, quando opportuno, cancellazione.
- Le Actions async di React 19 hanno regole aggiuntive: dopo `await` gli update da marcare come transition richiedono attualmente un altro `startTransition`. Vedi la nota dedicata, senza trasferire automaticamente le regole degli handler sincroni.
- Lo stato di store esterni deve essere letto con integrazioni compatibili, per esempio basate su `useSyncExternalStore`, non con variabili globali mutevoli lette liberamente nel render.

## Errori comuni

- Pensare che concurrent rendering significhi multi-threading.
- Usare transizioni per update che devono essere immediati.
- Fare side effect durante render.
- Dipendere dal numero esatto di render.
- Non distinguere render phase e commit phase.

## Checklist

- Il componente e puro durante render?
- Gli aggiornamenti urgenti sono separati da quelli non urgenti?
- Suspense e transizioni hanno fallback utili?
- La UI resta responsiva sotto carico?
- Le performance sono misurate con profiler?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Virtual DOM|Virtual DOM]]
- [[Programmazione/React/Pagine/Batching|Batching]]
- [[Programmazione/React/Pagine/useTransition e useDeferredValue|useTransition e useDeferredValue]]
- [[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]

## Fonti

- [React 18: introduzione della concorrenza](https://react.dev/blog/2022/03/29/react-v18), fonte storica, non stato attuale di tutte le funzionalita citate.
- [React: useTransition](https://react.dev/reference/react/useTransition) e [startTransition](https://react.dev/reference/react/startTransition).
- [React: StrictMode](https://react.dev/reference/react/StrictMode) e [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).
- [Sorgente dei tipi interni Fiber, tag 19.3.0](https://github.com/react/react/blob/v19.3.0/packages/react-reconciler/src/ReactInternalTypes.js): riferimento d'implementazione, non API da importare.

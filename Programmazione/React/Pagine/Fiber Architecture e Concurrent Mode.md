---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: advanced
tags: [react, fiber, concurrent-rendering]
aliases: [Fiber Architecture, Concurrent Mode, Concurrent Rendering]
prerequisites: []
related: []
---

# Fiber Architecture e Concurrent Mode

## Sintesi

Fiber e l'architettura interna di React che rappresenta il lavoro di rendering come unita interrompibili, riprendibili e prioritizzabili. Ha reso possibili funzionalita come concurrent rendering, Suspense e transizioni.

Il vecchio termine "Concurrent Mode" e oggi meno utile: e meglio parlare di funzionalita concorrenti abilitate da React moderno.

## Quando usarlo

Serve capirlo quando studi performance, rendering interrompibile, `useTransition`, Suspense, scheduling e perche React puo preparare UI in background.

## Come funziona

React divide il lavoro in due fasi:

- **render phase**: calcola cosa dovrebbe cambiare;
- **commit phase**: applica modifiche al DOM.

Con Fiber, il lavoro di render puo essere spezzato e prioritizzato. Gli aggiornamenti urgenti, come digitare in un input, possono restare responsivi mentre aggiornamenti meno urgenti vengono preparati.

## API / Sintassi

Non esiste una API "Fiber" pubblica. Le API collegate sono:

```jsx
const [isPending, startTransition] = useTransition();
```

```jsx
<Suspense fallback={<Spinner />}>
  <LazyPanel />
</Suspense>
```

## Esempio pratico

```jsx
function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    startTransition(() => setFilter(nextQuery));
  }

  return <SearchResults query={filter} pending={isPending} />;
}
```

L'input resta prioritario, mentre la lista puo aggiornarsi come transizione.

## Varianti

- **Urgent updates**: input e interazioni immediate.
- **Transitions**: aggiornamenti non urgenti.
- **Suspense**: fallback durante caricamento.
- **Interruptible rendering**: render preparato e abbandonato se superato.
- **Automatic batching**: piu update raggruppati.

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

- [[Programmazione/React/Indice react|Indice React]]
- [[Virtual DOM]]
- [[Batching]]
- [[useTransition e useDeferredValue]]
- [[Suspense e Lazy Loading]]

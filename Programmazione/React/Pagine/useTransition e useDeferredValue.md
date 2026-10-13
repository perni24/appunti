---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - hooks
  - concurrent-rendering
aliases:
  - useTransition
  - useDeferredValue
prerequisites: []
related: []
title: useTransition e useDeferredValue
---

# useTransition e useDeferredValue

## Sintesi

`useTransition` e `useDeferredValue` aiutano a mantenere la UI responsiva separando aggiornamenti urgenti da aggiornamenti non urgenti. Sono strumenti di concurrent rendering, non soluzioni generiche per ogni lentezza.

## Quando usarlo

Usa `useTransition` quando un'interazione deve aggiornare subito un input ma puo rimandare una parte pesante della UI. Usa `useDeferredValue` quando vuoi usare una versione ritardata di un valore, per esempio una query che filtra una lista pesante.

## Come funziona

```jsx
const [isPending, startTransition] = useTransition();

function handleChange(event) {
  const nextValue = event.target.value;
  setInputValue(nextValue);

  startTransition(() => {
    setSearchQuery(nextValue);
  });
}
```

## API / Sintassi

`useTransition`:

```jsx
const [isPending, startTransition] = useTransition();
```

`useDeferredValue`:

```jsx
const deferredQuery = useDeferredValue(query);
```

## Esempio pratico

```jsx
function SearchPage({ items }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const results = items.filter((item) =>
    item.name.includes(deferredQuery)
  );

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Results items={results} stale={query !== deferredQuery} />
    </>
  );
}
```

L'input resta reattivo mentre i risultati possono aggiornarsi piu lentamente.

## Varianti

- **Transition per navigazione interna**: update non urgente.
- **Transition per filtri pesanti**: lista o tabella.
- **Deferred value**: valore ritardato.
- **Pending UI**: mostra stato leggero durante transizione.
- **Virtualizzazione**: spesso complementare.

## Errori comuni

- Usarli per mascherare calcoli troppo pesanti non ottimizzati.
- Mettere update urgenti dentro transizioni.
- Non mostrare feedback quando `isPending` e vero.
- Confonderli con debounce.
- Usarli per risolvere richieste rete senza cache o cancellazione.

## Checklist

- Quale update e urgente?
- Quale update puo essere rimandato?
- Il profiler mostra blocco UI?
- Serve anche virtualizzazione o memoization?
- L'utente vede feedback durante pending?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Fiber Architecture e Concurrent Mode|Fiber Architecture e Concurrent Mode]]
- [[Programmazione/React/Pagine/Virtualizzazione delle liste|Virtualizzazione delle liste]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]

---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: intermediate
tags: [react, rendering, performance]
aliases: [Batching, Automatic batching]
prerequisites: []
related: []
---

# Batching

## Sintesi

Batching e il raggruppamento di piu aggiornamenti di stato in un solo render. React lo usa per evitare render intermedi inutili e rendere gli aggiornamenti piu efficienti.

Nelle versioni moderne, il batching e automatico in molti piu contesti rispetto al passato.

## Quando usarlo

Non lo abiliti normalmente a mano: devi capirlo quando piu `setState` sembrano produrre un solo render o quando leggi stato subito dopo un update.

## Come funziona

```jsx
function handleClick() {
  setFirstName("Luca");
  setLastName("Rossi");
}
```

React puo raggruppare i due update e fare un unico render finale.

## API / Sintassi

Aggiornamento funzionale:

```jsx
setCount((count) => count + 1);
setCount((count) => count + 1);
```

Questo e corretto quando piu update dipendono dal valore precedente.

Forzare commit sincrono e raro e va evitato salvo casi particolari.

## Esempio pratico

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function incrementTwice() {
    setCount((value) => value + 1);
    setCount((value) => value + 1);
  }

  return <button onClick={incrementTwice}>{count}</button>;
}
```

Con aggiornamenti funzionali il risultato finale e prevedibile.

## Varianti

- **Event batching**: update dentro handler.
- **Automatic batching**: update anche in promise, timeout e callback.
- **Functional updates**: evitano stale state.
- **flush sincrono**: raro, per integrazioni DOM specifiche.
- **Transitions**: update meno urgenti.

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

- [[Programmazione/React/Indice react|Indice React]]
- [[useState]]
- [[Fiber Architecture e Concurrent Mode]]
- [[useTransition e useDeferredValue]]
- [[Profiler e Debugging]]

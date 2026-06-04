---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, hooks, reducer, state]
aliases: [useReducer, Reducer pattern]
prerequisites: []
related: []
---

# useReducer

## Sintesi

`useReducer` gestisce stato locale tramite una funzione reducer e azioni esplicite. E utile quando lo stato ha piu transizioni, quando gli aggiornamenti dipendono dal valore precedente o quando vuoi rendere la logica di aggiornamento piu testabile.

## Quando usarlo

Usa `useReducer` quando:

- lo stato ha molti campi collegati;
- ci sono molte azioni possibili;
- la logica di update e complessa;
- vuoi separare rendering e transizioni;
- `useState` produce molti setter scollegati.

Per stato semplice, `useState` resta piu chiaro.

## Come funziona

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <button onClick={() => dispatch({ type: "increment" })}>
      {state.count}
    </button>
  );
}
```

## API / Sintassi

Firma:

```jsx
const [state, dispatch] = useReducer(reducer, initialArg, init);
```

Reducer:

```jsx
function reducer(state, action) {
  return nextState;
}
```

Inizializzazione lazy:

```jsx
const [state, dispatch] = useReducer(reducer, rawData, initState);
```

## Esempio pratico

Form con stati collegati:

```jsx
function formReducer(state, action) {
  switch (action.type) {
    case "change":
      return {
        ...state,
        values: {
          ...state.values,
          [action.name]: action.value,
        },
      };
    case "submit":
      return { ...state, isSubmitting: true };
    case "error":
      return { ...state, isSubmitting: false, error: action.error };
    default:
      return state;
  }
}
```

Le transizioni diventano nominate e centralizzate.

## Varianti

- **Reducer locale**: dentro un componente.
- **Reducer estratto**: testabile separatamente.
- **Reducer + Context**: stato condiviso semplice.
- **State machine leggera**: azioni come transizioni esplicite.
- **Redux-like pattern**: utile, ma da non introdurre per stato banale.

## Errori comuni

- Mutare lo stato nel reducer.
- Usare reducer per stato troppo semplice.
- Creare azioni vaghe come `setData` per tutto.
- Mettere side effect dentro reducer.
- Non gestire azioni sconosciute.
- Accoppiare reducer a dettagli visuali del componente.

## Checklist

- Lo stato ha transizioni abbastanza complesse?
- Le azioni hanno nomi chiari?
- Il reducer e puro?
- Lo stato viene copiato senza mutazioni?
- La logica e testabile fuori dal componente?
- `useState` sarebbe piu semplice?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useState]]
- [[Context API]]
- [[State Management Esterno]]
- [[Control Props e State Reducer Pattern]]

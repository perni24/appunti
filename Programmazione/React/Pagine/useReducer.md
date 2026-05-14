---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [useReducer]
prerequisites: []
related: []
---
# useReducer

## Sintesi

Nota su useReducer in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

Il hook `useReducer` è un'alternativa avanzata a `useState` per la gestione dello stato nei componenti React. È particolarmente utile quando si ha a che fare con logiche di stato complesse, stati che dipendono da altri valori o quando l'aggiornamento dello stato richiede più passaggi.

## 1. Il Pattern Reducer

Ispirato a Redux, `useReducer` si basa su un'architettura che separa la logica di aggiornamento (il "come" cambia lo stato) dall'azione che scatena il cambiamento (il "cosa" è successo).

### Gli elementi chiave
- **State:** Il dato corrente (può essere un valore primitivo o, più comunemente, un oggetto).
- **Action:** Un oggetto che descrive cosa è successo (solitamente ha una proprietà `type`).
- **Reducer:** Una funzione pura che riceve lo stato corrente e l'azione, e restituisce il **nuovo stato**.
- **Dispatch:** La funzione utilizzata per "inviare" un'azione al reducer.

---

## 2. Sintassi e Utilizzo

```javascript
const [state, dispatch] = useReducer(reducer, initialState);
```

### Esempio Pratico: Gestore di Task
```javascript
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return initialState;
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      Contatore: {state.count}
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </>
  );
}
```

---

## 3. useReducer vs useState

| Caratteristica | `useState` | `useReducer` |
| :--- | :--- | :--- |
| **Complessità Stato** | Ideale per valori semplici (stringhe, boolean). | Ideale per oggetti complessi o array. |
| **Logica di Aggiornamento** | Semplice, definita nel componente. | Complessa, definita in una funzione esterna. |
| **Relazione tra Stati** | Variabili indipendenti tra loro. | Stati correlati captati in un unico oggetto. |
| **Testabilità** | Più difficile testare la logica isolata. | Molto facile (il reducer è una funzione pura). |

---

## 4. Best Practices

1. **Reducer come Funzione Pura:** Un reducer non deve mai avere effetti collaterali (chiamate API, timer). Per quelli si usa `useEffect`.
2. **Immutabilità:** Come per `useState`, non bisogna mai mutare lo stato direttamente. Restituisci sempre una **copia** dello stato aggiornato.
3. **Action Types:** È consigliabile usare costanti per i tipi di azione per evitare refusi (errori di digitazione).

---

---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [react, hooks, state]
aliases: [useState]
prerequisites: []
related: []
---

# useState

## Sintesi

`useState` e l'hook base per gestire stato locale in un componente funzionale. Restituisce il valore corrente e una funzione per aggiornarlo.

Usalo per dati che cambiano nel tempo e influenzano il rendering del componente.

## Quando usarlo

Usa `useState` per input, toggle, selezioni, UI locale, modali, tab attiva, filtri semplici e valori che appartengono a un componente specifico.

Se lo stato dipende da molti eventi o ha transizioni complesse, valuta `useReducer`. Se serve a molti componenti lontani, valuta context o state management esterno.

## Come funziona

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

Quando chiami `setCount`, React pianifica un nuovo render con il valore aggiornato.

## API / Sintassi

Inizializzazione:

```jsx
const [value, setValue] = useState(initialValue);
```

Aggiornamento funzionale:

```jsx
setCount((current) => current + 1);
```

Inizializzazione lazy:

```jsx
const [items, setItems] = useState(() => loadInitialItems());
```

Stato oggetto:

```jsx
setUser((user) => ({
  ...user,
  name: "Luca",
}));
```

## Esempio pratico

```jsx
function SearchForm() {
  const [query, setQuery] = useState("");

  return (
    <form>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <p>Ricerca: {query}</p>
    </form>
  );
}
```

L'input e controllato: il valore mostrato deriva dallo state React.

## Varianti

- **Stato primitivo**: stringhe, numeri, booleani.
- **Stato oggetto**: aggiornare copiando con spread.
- **Stato array**: creare nuovi array con `map`, `filter`, spread.
- **Lazy initial state**: funzione passata a `useState`.
- **Functional update**: quando il nuovo valore dipende dal precedente.

## Errori comuni

- Mutare direttamente oggetti o array nello state.
- Leggere un valore vecchio dopo `setState`.
- Usare state per valori derivabili da props.
- Duplicare lo stesso dato in piu componenti.
- Tenere stato troppo in alto o troppo in basso.
- Non usare aggiornamento funzionale quando serve.

## Checklist

- Il valore influenza il rendering?
- Il dato appartiene davvero a questo componente?
- Il nuovo stato dipende dal precedente?
- Oggetti e array vengono copiati?
- Il dato potrebbe essere derivato invece di salvato?
- Serve `useReducer` per logica piu complessa?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[State colocato]]
- [[Derived state]]
- [[useReducer]]
- [[Props e Flusso di dati unidirezionale]]
